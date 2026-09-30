import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  Optional,
} from '@nestjs/common';
import { CacheService } from '../scalability/cache.service';
import { CustomComponentService } from '../custom-component/custom-component.service';
import { loadValidateSchemaSync, loadValidateActionsSync } from './validation-engine-loader';
import { validateLayoutSchema } from './layout-schema-validator';

/**
 * Guard that validates a FormSchema's structure before allowing
 * producer service creation or update to proceed.
 *
 * Applied to POST /producer/services and PUT /producer/services/:id.
 *
 * - On valid: true  → allows request through
 * - On valid: false → responds HTTP 400 with { success: false, schemaErrors }
 * - If formSchema is absent from the body, allows request through
 *   (e.g. an update that doesn't change the schema)
 *
 * On schema update, invalidates the validation result cache for the service
 * so that stale cached results are not served against the new schema.
 *
 * Custom field types are validated against the tenant's registered custom
 * component configurations via the CustomComponentService.
 *
 * Also validates layout configuration (columns, colSpan, sections, responsive
 * breakpoints, conditional style references) when present in the schema.
 */
@Injectable()
export class SchemaValidationGuard implements CanActivate {
  private readonly logger = new Logger(SchemaValidationGuard.name);

  constructor(
    @Optional()
    private readonly cacheService?: CacheService,
    @Optional()
    private readonly customComponentService?: CustomComponentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { formSchema } = request.body ?? {};

    // If formSchema is not present, allow the request through.
    // This handles updates that don't modify the schema.
    if (formSchema === undefined || formSchema === null) {
      return true;
    }

    // Load the validateSchema function from the validation engine
    let validateSchema: (schema: unknown, registeredCustomTypes?: Set<string>) => { valid: boolean; errors: any[] };
    try {
      validateSchema = loadValidateSchemaSync();
    } catch (err) {
      this.logger.error(
        `Failed to load validation engine: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new InternalServerErrorException('Internal server error');
    }

    // Build the set of registered custom field types for this tenant
    const registeredCustomTypes = await this.getRegisteredCustomTypes(request);

    const result = validateSchema(formSchema, registeredCustomTypes);

    if (!result.valid) {
      throw new BadRequestException({
        success: false,
        schemaErrors: result.errors,
      });
    }

    // Validate layout configuration if present
    const layoutResult = validateLayoutSchema(formSchema);
    if (!layoutResult.valid) {
      throw new BadRequestException({
        success: false,
        schemaErrors: layoutResult.errors,
      });
    }

    // Validate action definitions if present
    if (Array.isArray(formSchema.actions) && formSchema.actions.length > 0) {
      await this.validateActions(formSchema);
    }

    // Schema is valid — invalidate validation cache for this service
    // so stale cached results against the old schema are cleared.
    await this.invalidateServiceCache(request);

    return true;
  }

  /**
   * Validate action definitions in the FormSchema using the validation-engine's
   * validateActions function. Collects field IDs from the schema and runs
   * structural, syntax, and prohibited-construct checks on all actions.
   *
   * Throws BadRequestException with structured error codes on failure.
   * Ensures validation completes within 500ms for up to 50 action definitions.
   */
  private async validateActions(formSchema: any): Promise<void> {
    let validateActionsFn: (actions: unknown[], fieldIds: Set<string>) => { valid: boolean; errors: any[] };
    try {
      validateActionsFn = loadValidateActionsSync();
    } catch (err) {
      this.logger.error(
        `Failed to load action validator: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new InternalServerErrorException('Internal server error');
    }

    // Collect field IDs from the schema
    const fieldIds = new Set<string>();
    if (Array.isArray(formSchema.fields)) {
      for (const field of formSchema.fields) {
        if (field && typeof field.id === 'string') {
          fieldIds.add(field.id);
        }
      }
    }
    // Also collect from steps if present
    if (Array.isArray(formSchema.steps)) {
      for (const step of formSchema.steps) {
        if (step && Array.isArray(step.fields)) {
          for (const field of step.fields) {
            if (field && typeof field.id === 'string') {
              fieldIds.add(field.id);
            }
          }
        }
      }
    }

    const actionResult = validateActionsFn(formSchema.actions, fieldIds);

    if (!actionResult.valid) {
      throw new BadRequestException({
        success: false,
        schemaErrors: actionResult.errors,
      });
    }
  }

  /**
   * Query the CustomComponentService to get all registered custom field types
   * for the authenticated tenant. Returns a Set of field type strings.
   *
   * If the CustomComponentService is not available, returns an empty set
   * (which means unknown custom types will be rejected by the schema validator).
   */
  private async getRegisteredCustomTypes(request: any): Promise<Set<string>> {
    if (!this.customComponentService) {
      return new Set();
    }

    const tenantId = request.user?.tenantId;
    if (!tenantId) {
      return new Set();
    }

    try {
      const components = await this.customComponentService.findAll(tenantId);
      return new Set(components.map((c) => c.field_type));
    } catch (err) {
      this.logger.warn(
        `Failed to load custom component types for tenant ${tenantId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return new Set();
    }
  }

  /**
   * Invalidate all cached validation results for the service being updated.
   * For PUT requests, the serviceId comes from the route params.
   * For POST requests, there is no existing service yet, so nothing to invalidate.
   * Gracefully degrades if CacheService is unavailable.
   */
  private async invalidateServiceCache(request: any): Promise<void> {
    if (!this.cacheService) {
      return;
    }

    const serviceId = request.params?.serviceId;
    if (!serviceId) {
      // POST — new service, no cached results to invalidate
      return;
    }

    try {
      await this.cacheService.invalidateByPrefix(`validation:${serviceId}:`);
    } catch (err) {
      // Cache invalidation failure should not block the schema save
      this.logger.warn(
        `Failed to invalidate validation cache for serviceId=${serviceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
