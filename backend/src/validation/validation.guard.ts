import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { TenantService } from '../database/entities/tenant-service.entity';
import { CacheService } from '../scalability/cache.service';
import { AuditService } from '../audit/audit.service';
import { loadValidateSync } from './validation-engine-loader';

/**
 * Guard that validates form data against the tenant service's form_schema
 * before allowing the request to proceed to ConsumerService.submitApplication().
 *
 * Applied to POST /consumer/applications.
 *
 * - On valid: true  → allows request through (result cached for 60 s)
 * - On valid: false → responds HTTP 422 with { success: false, validationErrors }
 * - On missing/malformed schema → responds HTTP 500 and logs structured error
 *
 * Cache key format: `validation:${serviceId}:${sha256(JSON.stringify(formData) + serviceId)}`
 * Only `valid: true` results are cached. `valid: false` results are never cached.
 * If the CacheService is unavailable, validation runs fresh (graceful degradation).
 */
@Injectable()
export class FormValidationGuard implements CanActivate {
  private readonly logger = new Logger(FormValidationGuard.name);

  constructor(
    @InjectRepository(TenantService)
    private readonly tenantServiceRepository: Repository<TenantService>,
    @Optional()
    private readonly cacheService?: CacheService,
    @Optional()
    private readonly auditService?: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { serviceId, formData } = request.body ?? {};

    // Compute cache key early so we can check before hitting the DB for schema
    const cacheKey = this.buildCacheKey(serviceId, formData);

    // Check cache — if we have a cached valid result, skip validation entirely
    if (cacheKey) {
      const cached = await this.getCachedResult(cacheKey);
      if (cached) {
        return true;
      }
    }

    // Retrieve the tenant service and its form_schema
    let tenantService: TenantService | null;
    try {
      tenantService = await this.tenantServiceRepository.findOne({
        where: { id: serviceId },
      });
    } catch (err) {
      this.logger.error(
        `Failed to retrieve tenant service for serviceId=${serviceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new InternalServerErrorException('Internal server error');
    }

    if (!tenantService) {
      // Service not found — let the downstream controller handle 404.
      // The guard's job is schema validation, not existence checks.
      return true;
    }

    const formSchema = tenantService.form_schema;

    // Validate that form_schema is present and is a valid object
    if (
      !formSchema ||
      typeof formSchema !== 'object' ||
      Array.isArray(formSchema) ||
      !formSchema.fields
    ) {
      this.logger.error({
        message: 'Missing or malformed form_schema for tenant service',
        serviceId,
        tenantId: tenantService.tenant_id,
        schemaType: typeof formSchema,
        hasFields: formSchema ? !!formSchema.fields : false,
      });
      throw new InternalServerErrorException('Internal server error');
    }

    // Load the validation engine and run validation
    let validate: (schema: any, data: any) => any;
    try {
      validate = loadValidateSync();
    } catch (err) {
      this.logger.error(
        `Failed to load validation engine: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new InternalServerErrorException('Internal server error');
    }

    const result = validate(formSchema, formData ?? {});

    // Extract actor ID from JWT-authenticated user (consumer)
    const actorId: string | undefined = request.user?.id;

    if (!result.valid) {
      // Audit log: validation failure — log error codes only, no raw FormData (DPDP compliance)
      await this.logAuditEvent({
        eventType: 'validation.failure',
        resourceType: 'application',
        resourceId: serviceId,
        tenantId: tenantService.tenant_id,
        actorId,
        metadata: {
          error_codes: this.extractErrorCodes(result.errors),
          service_id: serviceId,
        },
        success: false,
      });

      // Never cache invalid results
      throw new HttpException(
        {
          success: false,
          validationErrors: result.errors,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Audit log: validation success
    await this.logAuditEvent({
      eventType: 'validation.success',
      resourceType: 'application',
      resourceId: serviceId,
      tenantId: tenantService.tenant_id,
      actorId,
      metadata: {
        validation_passed: true,
        service_id: serviceId,
      },
    });

    // Cache the valid result with 60-second TTL
    if (cacheKey) {
      await this.cacheValidResult(cacheKey);
    }

    return true;
  }

  /**
   * Build a cache key from the serviceId and formData.
   * Format: `validation:${serviceId}:${sha256(JSON.stringify(formData) + serviceId)}`
   * Returns null if serviceId is missing (cannot build a meaningful key).
   */
  private buildCacheKey(serviceId: string | undefined, formData: unknown): string | null {
    if (!serviceId) {
      return null;
    }
    const payload = JSON.stringify(formData ?? {}) + serviceId;
    const hash = createHash('sha256').update(payload).digest('hex');
    return `validation:${serviceId}:${hash}`;
  }

  /**
   * Check the cache for a previously validated result.
   * Returns `true` if a cached valid result exists, `false` otherwise.
   * Gracefully degrades if CacheService is unavailable.
   */
  private async getCachedResult(cacheKey: string): Promise<boolean> {
    if (!this.cacheService) {
      return false;
    }
    try {
      const result = await this.cacheService.readThrough<{ valid: boolean }>({
        key: cacheKey,
        domain: 'validation-results',
        endpoint: 'validation.guard.cacheCheck',
        featureFlag: 'validation.cache',
        loader: async () => {
          // Throw to signal a cache miss — we don't want readThrough to
          // populate the cache on a check. We handle caching after validation.
          throw new CacheMissError();
        },
      });
      return result?.valid === true;
    } catch {
      // Cache miss or CacheService unavailable — run validation fresh
      return false;
    }
  }

  /**
   * Store a valid validation result in the cache with a 60-second TTL.
   * Gracefully degrades if CacheService is unavailable.
   */
  private async cacheValidResult(cacheKey: string): Promise<void> {
    if (!this.cacheService) {
      return;
    }
    try {
      // First invalidate any stale entry, then populate via readThrough
      await this.cacheService.invalidate(cacheKey);
      await this.cacheService.readThrough<{ valid: boolean }>({
        key: cacheKey,
        domain: 'validation-results',
        endpoint: 'validation.guard.cacheStore',
        featureFlag: 'validation.cache',
        loader: async () => ({ valid: true }),
      });
    } catch {
      // CacheService unavailable — graceful degradation, just log and continue
      this.logger.warn(`Failed to cache validation result for key=${cacheKey}`);
    }
  }

  /**
   * Write an audit log entry for a validation event.
   * If AuditService is unavailable, logs at WARN level and does not block the response.
   */
  private async logAuditEvent(options: {
    eventType: 'validation.success' | 'validation.failure';
    resourceType: string;
    resourceId: string;
    tenantId: string;
    actorId?: string;
    metadata: Record<string, unknown>;
    success?: boolean;
  }): Promise<void> {
    try {
      if (!this.auditService) {
        this.logger.warn(
          `AuditService unavailable — skipping audit log for event "${options.eventType}" (serviceId=${options.resourceId})`,
        );
        return;
      }
      await this.auditService.log({
        eventType: options.eventType,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        tenantId: options.tenantId,
        actorId: options.actorId,
        metadata: options.metadata,
        success: options.success ?? true,
      });
    } catch (err) {
      // Audit failures must never block the primary request path (Requirement 12.4)
      this.logger.warn(
        `Failed to write audit log for event "${options.eventType}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Extract all unique error codes from a ValidationResult errors map.
   * Does NOT include raw FormData values — only error codes (DPDP compliance).
   */
  private extractErrorCodes(errors: Record<string, Array<{ errorCode: string }>>): string[] {
    const codes: string[] = [];
    for (const fieldErrors of Object.values(errors)) {
      for (const error of fieldErrors) {
        if (error.errorCode && !codes.includes(error.errorCode)) {
          codes.push(error.errorCode);
        }
      }
    }
    return codes;
  }
}

/** Sentinel error used to signal a cache miss inside readThrough loader. */
class CacheMissError extends Error {
  constructor() {
    super('CACHE_MISS');
    this.name = 'CacheMissError';
  }
}
