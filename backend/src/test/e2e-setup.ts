import { createHash } from 'crypto';
import 'reflect-metadata';
import { AppDataSource } from '../database/data-source';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantService } from '../database/entities/tenant-service.entity';
import { TenantServiceRelease } from '../database/entities/tenant-service-release.entity';
import { CERTIFIED_SERVICE_TEMPLATES } from '../producer/service-template.catalog';

const tenantName = 'ServiceFormAI E2E Revenue Department';
const tenantSubdomain = 'e2e-revenue';

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function setup() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const tenantRepository = AppDataSource.getRepository(Tenant);
  const serviceRepository = AppDataSource.getRepository(TenantService);
  const releaseRepository = AppDataSource.getRepository(TenantServiceRelease);
  let tenant = await tenantRepository.findOne({ where: { subdomain: tenantSubdomain } });
  if (!tenant) {
    tenant = tenantRepository.create({
      name: tenantName,
      subdomain: tenantSubdomain,
      type: 'government',
      status: 'active',
      contact_email: 'e2e@serviceformai.local',
      branding: null,
      auth_policy: null,
      consent_policy: null,
      governance_scope: null,
      onboarding_metadata: null,
    });
  } else {
    tenant.status = 'active';
  }
  tenant = await tenantRepository.save(tenant);

  for (const template of CERTIFIED_SERVICE_TEMPLATES) {
    let service = await serviceRepository.findOne({
      where: { tenant_id: tenant.id, name: template.name },
    });
    if (!service) {
      service = serviceRepository.create({
        tenant_id: tenant.id,
        name: template.name,
        category: template.category,
        description: template.description,
        form_schema: template.formSchema,
        workflow_config: template.workflowConfig,
        eligibility_rules: template.eligibilityRules,
        required_documents: template.requiredDocuments,
        backend_api_config: null,
        service_scope: null,
        manifest: template.manifest,
        published: true,
        archived: false,
        sla_days: template.slaDays,
        fees: null,
        schema_version: 1,
        schema_version_history: [],
      });
    } else {
      Object.assign(service, {
        category: template.category,
        description: template.description,
        form_schema: template.formSchema,
        workflow_config: template.workflowConfig,
        eligibility_rules: template.eligibilityRules,
        required_documents: template.requiredDocuments,
        manifest: template.manifest,
        published: true,
        archived: false,
        sla_days: template.slaDays,
      });
    }

    service = await serviceRepository.save(service);
    const snapshot = {
      id: service.id,
      tenant_id: service.tenant_id,
      name: service.name,
      category: service.category,
      description: service.description,
      service_scope: service.service_scope,
      form_schema: service.form_schema,
      workflow_config: service.workflow_config,
      eligibility_rules: service.eligibility_rules,
      required_documents: service.required_documents,
      backend_api_config: service.backend_api_config,
      manifest: service.manifest,
      sla_days: service.sla_days,
      fees: service.fees,
      schema_version: service.schema_version,
    };
    const contentHash = createHash('sha256').update(stableJson(snapshot)).digest('hex');
    const currentRelease = service.current_release_id
      ? await releaseRepository.findOne({ where: { id: service.current_release_id } })
      : null;

    if (!currentRelease || currentRelease.content_hash !== contentHash) {
      const latestRelease = await releaseRepository.findOne({
        where: { service_id: service.id },
        order: { version: 'DESC' },
      });
      const release = await releaseRepository.save(releaseRepository.create({
        tenant_id: tenant.id,
        service_id: service.id,
        version: (latestRelease?.version ?? 0) + 1,
        snapshot,
        content_hash: contentHash,
      }));
      service.current_release_id = release.id;
      await serviceRepository.save(service);
    }
  }

  await AppDataSource.destroy();
}

setup().catch(async (error) => {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  console.error(error);
  process.exitCode = 1;
});