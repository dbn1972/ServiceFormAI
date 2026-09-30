import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomComponentConfig } from '../database/entities/custom-component-config.entity';
import { TenantService } from '../database/entities/tenant-service.entity';
import { AuditService } from '../audit/audit.service';
import { CreateCustomComponentDto } from './dto/create-custom-component.dto';
import { UpdateCustomComponentDto } from './dto/update-custom-component.dto';

const RESERVED_TYPES = new Set([
  'text',
  'number',
  'email',
  'phone',
  'date',
  'dropdown',
  'radio',
  'checkbox',
  'file',
  'textarea',
]);

const FIELD_TYPE_REGEX = /^[a-z][a-z0-9_-]{2,49}$/;

function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

@Injectable()
export class CustomComponentService {
  private readonly logger = new Logger(CustomComponentService.name);

  constructor(
    @InjectRepository(CustomComponentConfig)
    private readonly componentRepository: Repository<CustomComponentConfig>,
    @InjectRepository(TenantService)
    private readonly tenantServiceRepository: Repository<TenantService>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateCustomComponentDto,
  ): Promise<CustomComponentConfig> {
    this.validateFieldType(dto.fieldType);

    const component = this.componentRepository.create({
      tenant_id: tenantId,
      field_type: dto.fieldType,
      display_name: dto.displayName,
      version: dto.version,
      description: dto.description ?? null,
      bundle_url: dto.bundleUrl ?? null,
      validators: dto.validators ?? null,
      default_config: dto.defaultConfig ?? null,
      allowed_domains: dto.allowedDomains ?? null,
      active: true,
    });

    const saved = await this.componentRepository.save(component);

    try {
      await this.auditService.log({
        eventType: 'component.created',
        tenantId,
        resourceType: 'custom_component',
        resourceId: saved.id,
        metadata: { fieldType: dto.fieldType, displayName: dto.displayName },
      });
    } catch (err) {
      this.logger.warn(
        `Audit log failed for component.created: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return saved;
  }

  async findAll(tenantId: string): Promise<CustomComponentConfig[]> {
    return this.componentRepository.find({
      where: { tenant_id: tenantId, active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<CustomComponentConfig> {
    const component = await this.componentRepository.findOne({
      where: { id, tenant_id: tenantId, active: true },
    });

    if (!component) {
      throw new NotFoundException('Custom component not found');
    }

    return component;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCustomComponentDto,
  ): Promise<CustomComponentConfig> {
    const component = await this.componentRepository.findOne({
      where: { id, tenant_id: tenantId, active: true },
    });

    if (!component) {
      throw new NotFoundException('Custom component not found');
    }

    const changedFields: string[] = [];

    if (dto.displayName !== undefined) {
      component.display_name = dto.displayName;
      changedFields.push('displayName');
    }
    if (dto.version !== undefined) {
      component.version = dto.version;
      changedFields.push('version');
    }
    if (dto.description !== undefined) {
      component.description = dto.description;
      changedFields.push('description');
    }
    if (dto.bundleUrl !== undefined) {
      component.bundle_url = dto.bundleUrl;
      changedFields.push('bundleUrl');
    }
    if (dto.validators !== undefined) {
      component.validators = dto.validators;
      changedFields.push('validators');
    }
    if (dto.defaultConfig !== undefined) {
      component.default_config = dto.defaultConfig;
      changedFields.push('defaultConfig');
    }
    if (dto.allowedDomains !== undefined) {
      component.allowed_domains = dto.allowedDomains;
      changedFields.push('allowedDomains');
    }

    const saved = await this.componentRepository.save(component);

    try {
      await this.auditService.log({
        eventType: 'component.updated',
        tenantId,
        resourceType: 'custom_component',
        resourceId: saved.id,
        metadata: {
          fieldType: component.field_type,
          changedFields,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Audit log failed for component.updated: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return saved;
  }

  async remove(tenantId: string, id: string): Promise<CustomComponentConfig> {
    const component = await this.componentRepository.findOne({
      where: { id, tenant_id: tenantId, active: true },
    });

    if (!component) {
      throw new NotFoundException('Custom component not found');
    }

    // Check for active schema references in tenant services
    const referencingServices = await this.findServicesReferencingFieldType(
      tenantId,
      component.field_type,
    );

    if (referencingServices.length > 0) {
      throw new ConflictException({
        success: false,
        error: `Cannot delete component: field type "${component.field_type}" is referenced by ${referencingServices.length} active service(s)`,
        affectedServices: referencingServices.map((s) => s.id),
      });
    }

    // Soft-delete by setting active to false
    component.active = false;
    const saved = await this.componentRepository.save(component);

    try {
      await this.auditService.log({
        eventType: 'component.deleted',
        tenantId,
        resourceType: 'custom_component',
        resourceId: saved.id,
        metadata: { fieldType: component.field_type },
      });
    } catch (err) {
      this.logger.warn(
        `Audit log failed for component.deleted: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return saved;
  }

  /**
   * Find tenant services whose form_schema references the given field type.
   */
  private async findServicesReferencingFieldType(
    tenantId: string,
    fieldType: string,
  ): Promise<TenantService[]> {
    // Search for services where the form_schema JSONB contains the field type string.
    // This uses a JSONB text search to find references in nested field definitions.
    const escapedFieldType = escapeLikePattern(fieldType);
    const services = await this.tenantServiceRepository
      .createQueryBuilder('s')
      .where('s.tenant_id = :tenantId', { tenantId })
      .andWhere(`s.form_schema::text LIKE :pattern`, {
        pattern: `%"${escapedFieldType}"%`,
      })
      .getMany();

    return services;
  }

  private validateFieldType(fieldType: string): void {
    if (!FIELD_TYPE_REGEX.test(fieldType)) {
      throw new BadRequestException(
        'Invalid fieldType format: must be 3-50 characters, start with a lowercase letter, and contain only lowercase alphanumeric characters, hyphens, and underscores',
      );
    }

    if (RESERVED_TYPES.has(fieldType)) {
      throw new BadRequestException(
        `fieldType "${fieldType}" is reserved as a built-in field type`,
      );
    }
  }
}
