import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import { Tenant } from '../database/entities/tenant.entity';
import { AuditService } from '../audit/audit.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { validateTheme } from '../validation/theme-validator';

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  onboarding: ['active'],
  active: ['suspended', 'offboarded'],
  suspended: ['active', 'offboarded'],
  offboarded: [], // terminal
};

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly auditService: AuditService,
    private readonly webhookDelivery: WebhookDeliveryService,
  ) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async createTenant(dto: CreateTenantDto, actorId: string): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`A tenant with name "${dto.name}" already exists`);
    }

    const tenant = this.tenantRepository.create({
      id: uuidv4(),
      name: dto.name,
      type: dto.type,
      status: 'onboarding',
      contact_email: dto.contact_email ?? null,
      api_base_url: dto.api_base_url ?? null,
      governance_scope: dto.governance_scope ?? null,
      branding: dto.branding ?? null,
      auth_policy: dto.auth_policy ?? null,
      consent_policy: dto.consent_policy ?? null,
      notification_policy: dto.notification_policy ?? null,
      integration_policy: dto.integration_policy ?? null,
    });

    await this.tenantRepository.save(tenant);

    void this.auditService.log({
      eventType: 'tenant.created',
      actorId,
      actorRole: 'platform_admin',
      resourceType: 'tenant',
      resourceId: tenant.id,
      metadata: { name: tenant.name, type: tenant.type },
    });

    void this.dispatchTenantEvent(tenant, 'tenant.created', {
      tenantId: tenant.id,
      name: tenant.name,
      type: tenant.type,
    });

    return tenant;
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async getTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async listTenants(status?: string, search?: string, page = 1, limit = 50): Promise<{ tenants: Tenant[]; total: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(200, Math.max(1, limit));

    const qb = this.tenantRepository
      .createQueryBuilder('t')
      .orderBy('t.created_at', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (status) {
      qb.andWhere('t.status = :status', { status });
    }
    if (search) {
      qb.andWhere('(t.name ILIKE :search OR t.contact_email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [tenants, total] = await qb.getManyAndCount();
    return { tenants, total };
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateTenant(
    tenantId: string,
    dto: UpdateTenantDto,
    actorId: string,
    actorRole: string,
  ): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);

    if (dto.name !== undefined) tenant.name = dto.name;
    if (dto.status !== undefined) {
      this.assertStatusTransition(tenant.status, dto.status);
      tenant.status = dto.status;
    }
    if (dto.contact_email !== undefined) tenant.contact_email = dto.contact_email;
    if (dto.api_base_url !== undefined) tenant.api_base_url = dto.api_base_url;
    if (dto.governance_scope !== undefined) {
      tenant.governance_scope = { ...tenant.governance_scope, ...dto.governance_scope };
    }
    if (dto.branding !== undefined) {
      // Validate theme if present in branding update
      const brandingUpdate = dto.branding as Record<string, unknown>;
      if (brandingUpdate?.theme !== undefined) {
        const themeResult = validateTheme(brandingUpdate.theme);
        if (!themeResult.valid) {
          throw new BadRequestException({
            success: false,
            errors: themeResult.errors,
          });
        }
      }
      tenant.branding = { ...tenant.branding, ...dto.branding };
    }
    if (dto.auth_policy !== undefined) tenant.auth_policy = { ...tenant.auth_policy, ...dto.auth_policy };
    if (dto.consent_policy !== undefined) tenant.consent_policy = { ...tenant.consent_policy, ...dto.consent_policy };
    if (dto.notification_policy !== undefined) tenant.notification_policy = { ...tenant.notification_policy, ...dto.notification_policy };
    if (dto.integration_policy !== undefined) tenant.integration_policy = { ...tenant.integration_policy, ...dto.integration_policy };

    await this.tenantRepository.save(tenant);

    void this.auditService.log({
      eventType: 'tenant.updated',
      actorId,
      actorRole,
      tenantId,
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata: { fields: Object.keys(dto) },
    });

    void this.dispatchTenantEvent(tenant, 'tenant.updated', {
      tenantId: tenant.id,
      updatedFields: Object.keys(dto),
    });

    return tenant;
  }

  // ─── Lifecycle transitions ─────────────────────────────────────────────────

  async activateTenant(tenantId: string, actorId: string): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    this.assertStatusTransition(tenant.status, 'active');

    tenant.status = 'active';
    await this.tenantRepository.save(tenant);

    void this.auditService.log({
      eventType: 'tenant.activated',
      actorId,
      actorRole: 'platform_admin',
      tenantId,
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata: { previousStatus: 'onboarding' },
    });

    void this.dispatchTenantEvent(tenant, 'tenant.activated', { tenantId: tenant.id });
    return tenant;
  }

  async suspendTenant(tenantId: string, reason: string, actorId: string): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    this.assertStatusTransition(tenant.status, 'suspended');

    tenant.status = 'suspended';
    await this.tenantRepository.save(tenant);

    void this.auditService.log({
      eventType: 'tenant.suspended',
      actorId,
      actorRole: 'platform_admin',
      tenantId,
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata: { reason },
    });

    void this.dispatchTenantEvent(tenant, 'tenant.suspended', { tenantId: tenant.id, reason });
    return tenant;
  }

  async offboardTenant(tenantId: string, actorId: string): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    this.assertStatusTransition(tenant.status, 'offboarded');

    tenant.status = 'offboarded';
    await this.tenantRepository.save(tenant);

    void this.auditService.log({
      eventType: 'tenant.offboarded',
      actorId,
      actorRole: 'platform_admin',
      tenantId,
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata: {},
    });

    void this.dispatchTenantEvent(tenant, 'tenant.offboarded', { tenantId: tenant.id });
    return tenant;
  }

  // ─── Policy accessors ──────────────────────────────────────────────────────

  async getEffectiveAuthPolicy(tenantId: string) {
    const tenant = await this.getTenant(tenantId);
    return {
      mfa_required: tenant.auth_policy?.mfa_required ?? false,
      session_timeout_minutes: tenant.auth_policy?.session_timeout_minutes ?? 60,
      allowed_email_domains: tenant.auth_policy?.allowed_email_domains ?? [],
      password_min_length: tenant.auth_policy?.password_min_length ?? 8,
      max_login_failures: tenant.auth_policy?.max_login_failures ?? 5,
      lockout_minutes: tenant.auth_policy?.lockout_minutes ?? 15,
    };
  }

  async getEffectiveConsentPolicy(tenantId: string) {
    const tenant = await this.getTenant(tenantId);
    return {
      require_consent_before_submission: tenant.consent_policy?.require_consent_before_submission ?? true,
      consent_purposes: tenant.consent_policy?.consent_purposes ?? ['service_delivery'],
      consent_expiry_days: tenant.consent_policy?.consent_expiry_days ?? null,
      data_retention_days: tenant.consent_policy?.data_retention_days ?? null,
    };
  }

  async getEffectiveFeatureFlags(tenantId: string): Promise<Record<string, boolean>> {
    const tenant = await this.getTenant(tenantId);
    // Merge platform defaults with tenant overrides
    const defaults: Record<string, boolean> = {
      'consumer.services.cache': true,
      'consumer.applications.cache': true,
      'producer.services.cache': true,
      'queue.write_path': false,
      'consent.required': true,
      'digilocker.enabled': false,
      'payment.enabled': false,
      'sms.notifications': tenant.notification_policy?.sms_enabled ?? false,
      'email.notifications': tenant.notification_policy?.email_enabled ?? false,
    };

    // Tenant integration policy overrides
    const allowed = tenant.integration_policy?.allowed_providers ?? [];
    if (allowed.includes('digilocker')) defaults['digilocker.enabled'] = true;
    if (allowed.includes('payment_gateway')) defaults['payment.enabled'] = true;

    return defaults;
  }

  // ─── Webhook ───────────────────────────────────────────────────────────────

  async sendTestWebhook(tenantId: string): Promise<{ delivered: boolean; url: string | null }> {
    const tenant = await this.getTenant(tenantId);
    const url = tenant.notification_policy?.webhook_url;
    if (!url) {
      return { delivered: false, url: null };
    }

    const event = this.webhookDelivery.buildEvent('tenant.webhook.test', tenantId, {
      tenantId,
      message: 'This is a test webhook from ServiceFormAI',
    });

    const delivered = await this.webhookDelivery.deliver(url, undefined, event);
    return { delivered, url };
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private assertStatusTransition(current: string, target: string): void {
    const allowed = STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Cannot transition tenant from "${current}" to "${target}". ` +
        `Allowed transitions: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`,
      );
    }
  }

  private async dispatchTenantEvent(
    tenant: Tenant,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const url = tenant.notification_policy?.webhook_url;
    if (!url) return;

    const event = this.webhookDelivery.buildEvent(eventType, tenant.id, payload);
    await this.webhookDelivery.deliver(url, undefined, event).catch((err) => {
      this.logger.error(`dispatchTenantEvent failed for ${eventType}: ${err}`);
    });
  }
}
