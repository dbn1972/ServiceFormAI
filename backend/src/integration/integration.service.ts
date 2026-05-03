import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import {
  IntegrationProvider,
  type IntegrationStatus,
} from '../database/entities/integration-provider.entity';
import { AuditService } from '../audit/audit.service';
import { UpsertIntegrationDto } from './dto/upsert-integration.dto';

// How many consecutive failures before the circuit opens
const CIRCUIT_FAILURE_THRESHOLD = 5;
// How long the circuit stays open (ms)
const CIRCUIT_OPEN_DURATION_MS = 5 * 60 * 1000;

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    @InjectRepository(IntegrationProvider)
    private readonly integrationRepository: Repository<IntegrationProvider>,
    private readonly auditService: AuditService,
  ) {}

  async upsertIntegration(
    tenantId: string,
    dto: UpsertIntegrationDto,
    actorId: string,
    actorRole: string,
  ): Promise<IntegrationProvider> {
    let record = await this.integrationRepository.findOne({
      where: { tenant_id: tenantId, provider: dto.provider },
    });

    if (record) {
      record.status = dto.status as IntegrationStatus;
      if (dto.config !== undefined) record.config = dto.config;
      if (dto.credential_refs !== undefined) record.credential_refs = dto.credential_refs;
      if (dto.webhook_secret_ref !== undefined) record.webhook_secret_ref = dto.webhook_secret_ref;
    } else {
      record = this.integrationRepository.create({
        id: uuidv4(),
        tenant_id: tenantId,
        provider: dto.provider,
        status: dto.status as IntegrationStatus,
        config: dto.config ?? null,
        credential_refs: dto.credential_refs ?? null,
        webhook_secret_ref: dto.webhook_secret_ref ?? null,
        consecutive_failures: 0,
        circuit_open_until: null,
      });
    }

    await this.integrationRepository.save(record);

    void this.auditService.log({
      eventType: 'admin.service.update',
      actorId,
      actorRole,
      tenantId,
      resourceType: 'integration_provider',
      resourceId: record.id,
      metadata: { provider: dto.provider, status: dto.status },
    });

    return this.sanitize(record);
  }

  async listIntegrations(tenantId: string): Promise<IntegrationProvider[]> {
    const records = await this.integrationRepository.find({
      where: { tenant_id: tenantId },
      order: { provider: 'ASC' },
    });
    return records.map((r) => this.sanitize(r));
  }

  async getIntegration(tenantId: string, provider: string): Promise<IntegrationProvider> {
    const record = await this.integrationRepository.findOne({
      where: { tenant_id: tenantId, provider },
    });
    if (!record) throw new NotFoundException(`Integration "${provider}" not configured for this tenant`);
    return this.sanitize(record);
  }

  // Called by an integration adapter when a request succeeds — resets circuit
  async recordSuccess(tenantId: string, provider: string): Promise<void> {
    await this.integrationRepository.update(
      { tenant_id: tenantId, provider },
      {
        consecutive_failures: 0,
        circuit_open_until: null,
        last_health_check_at: new Date(),
        last_health_check_ok: true,
        last_error: null,
      },
    );
  }

  // Called by an integration adapter when a request fails
  async recordFailure(tenantId: string, provider: string, error: string): Promise<void> {
    const record = await this.integrationRepository.findOne({
      where: { tenant_id: tenantId, provider },
    });
    if (!record) return;

    record.consecutive_failures += 1;
    record.last_health_check_at = new Date();
    record.last_health_check_ok = false;
    record.last_error = error.slice(0, 1000);

    if (record.consecutive_failures >= CIRCUIT_FAILURE_THRESHOLD) {
      record.circuit_open_until = new Date(Date.now() + CIRCUIT_OPEN_DURATION_MS);
      record.status = 'error';
      this.logger.warn(
        `Circuit opened for integration "${provider}" on tenant ${tenantId} after ${record.consecutive_failures} failures.`,
      );
    }

    await this.integrationRepository.save(record);
  }

  // Guards: throws if integration is not available (disabled, error, circuit open)
  async assertIntegrationAvailable(tenantId: string, provider: string): Promise<void> {
    const record = await this.integrationRepository.findOne({
      where: { tenant_id: tenantId, provider },
    });

    if (!record || record.status === 'disabled') {
      throw new ForbiddenException(`Integration "${provider}" is not enabled for this tenant`);
    }

    if (record.circuit_open_until && record.circuit_open_until > new Date()) {
      const secondsLeft = Math.ceil(
        (record.circuit_open_until.getTime() - Date.now()) / 1000,
      );
      throw new ForbiddenException(
        `Integration "${provider}" is temporarily unavailable (circuit open, retry in ${secondsLeft}s)`,
      );
    }
  }

  // Strip credential_refs from outbound responses — internal references must not leak
  private sanitize(record: IntegrationProvider): IntegrationProvider {
    return { ...record, credential_refs: null, webhook_secret_ref: null };
  }
}
