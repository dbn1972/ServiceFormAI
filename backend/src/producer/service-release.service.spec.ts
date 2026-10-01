import { ConflictException, ForbiddenException } from '@nestjs/common';
import { TenantService } from '../database/entities/tenant-service.entity';
import { TenantServiceRelease } from '../database/entities/tenant-service-release.entity';
import { ServicePublicationApproval } from '../database/entities/service-publication-approval.entity';
import { ProducerService } from './producer.service';
import { getCertifiedServiceTemplate } from './service-template.catalog';

describe('ProducerService immutable releases', () => {
  const serviceRecord: any = {
    id: 'service-1',
    tenant_id: 'tenant-1',
    name: 'Income Certificate',
    category: 'certificates',
    description: 'Income certification',
    service_scope: { state_name: 'Maharashtra' },
    form_schema: { fields: [{ id: 'income', type: 'number' }] },
    workflow_config: { stages: [{ name: 'Submitted' }] },
    eligibility_rules: { rules: [] },
    required_documents: [],
    backend_api_config: null,
    manifest: { version: '1' },
    published: false,
    current_release_id: null,
    schema_version: 1,
    sla_days: 7,
    fees: 0,
  };

  const releases: any[] = [];
  const approvals: any[] = [];
  const transactionServiceRepository = {
    findOne: jest.fn(async () => serviceRecord),
    save: jest.fn(async (value) => Object.assign(serviceRecord, value)),
  };
  const releaseRepository = {
    findOne: jest.fn(async () => releases.at(-1) ?? null),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      const release = { id: `release-${releases.length + 1}`, ...value };
      releases.push(release);
      return release;
    }),
  };
  const approvalRepository = {
    findOne: jest.fn(async () => approvals.find((approval) => approval.status === 'pending') ?? null),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      if (!value.id) value.id = `approval-${approvals.length + 1}`;
      const existingIndex = approvals.findIndex((approval) => approval.id === value.id);
      if (existingIndex < 0) approvals.push(value);
      else approvals[existingIndex] = value;
      return value;
    }),
    find: jest.fn(async () => approvals.filter((approval) => approval.status === 'pending')),
  };
  const dataSource = {
    transaction: jest.fn(async (callback) => callback({
      getRepository: (entity) => entity === TenantService
        ? transactionServiceRepository
        : entity === TenantServiceRelease
          ? releaseRepository
          : approvalRepository,
    })),
  } as any;
  const serviceRepository = {
    findOne: jest.fn(async () => serviceRecord),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const queue = {
    isWritePathEnabled: jest.fn(() => false),
    recordDirectWriteBypass: jest.fn(),
    publishShadowWriteEvent: jest.fn(),
  };
  const cache = {
    invalidateByPrefix: jest.fn(),
    invalidate: jest.fn(),
  };

  let producerService: ProducerService;

  beforeEach(() => {
    jest.clearAllMocks();
    releases.splice(0);
    approvals.splice(0);
    Object.assign(serviceRecord, {
      published: false,
      current_release_id: null,
      schema_version: 1,
      form_schema: getCertifiedServiceTemplate('income-cert')?.formSchema,
      workflow_config: getCertifiedServiceTemplate('income-cert')?.workflowConfig,
      required_documents: getCertifiedServiceTemplate('income-cert')?.requiredDocuments,
      manifest: getCertifiedServiceTemplate('income-cert')?.manifest,
    });
    producerService = new ProducerService(
      serviceRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      cache as any,
      queue as any,
      dataSource,
    );
  });

  it('publishes a content-hashed immutable snapshot and reuses it when unchanged', async () => {
    const first = await producerService.setServicePublished('tenant-1', 'service-1', true);
    const originalSnapshot = structuredClone(releases[0].snapshot);

    expect(first).toMatchObject({ published: true, release_id: 'release-1' });
    expect(releases[0]).toMatchObject({
      tenant_id: 'tenant-1',
      service_id: 'service-1',
      version: 1,
    });
    expect(releases[0].content_hash).toMatch(/^[a-f0-9]{64}$/);

    await producerService.setServicePublished('tenant-1', 'service-1', true);

    expect(releases).toHaveLength(1);
    expect(releases[0].snapshot).toEqual(originalSnapshot);
  });

  it('lists certified reference templates and clones one into an unpublished tenant draft', async () => {
    const templates = producerService.getCertifiedServiceTemplates();
    expect(templates.map((template) => template.id)).toEqual([
      'income-cert',
      'trade-license',
      'birth-cert',
    ]);
    expect(templates.every((template) => template.certificationStatus === 'certified')).toBe(true);

    const clone = await producerService.cloneCertifiedServiceTemplate('tenant-1', 'income-cert', {
      name: 'District Income Certificate',
      workflowConfig: { slaDays: 3 },
    });

    expect(clone.published).toBe(false);
    expect(serviceRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      tenant_id: 'tenant-1',
      name: 'District Income Certificate',
      published: false,
      workflow_config: expect.objectContaining({ stages: expect.any(Array), slaDays: 3 }),
      manifest: expect.objectContaining({
        serviceType: 'certificate',
        requiredDocuments: expect.any(Array),
        sourceTemplate: expect.objectContaining({ id: 'income-cert', version: 1 }),
      }),
    }));
    const createdDraft = serviceRepository.create.mock.calls.at(-1)?.[0];
    expect(createdDraft.workflow_config.stages).toEqual(getCertifiedServiceTemplate('income-cert')?.workflowConfig.stages);
    expect(createdDraft.manifest.workflow.stages).toEqual(getCertifiedServiceTemplate('income-cert')?.workflowConfig.stages);
  });

  it('keeps the certified template service type when a caller supplies a conflicting manifest type', async () => {
    await producerService.cloneCertifiedServiceTemplate('tenant-1', 'trade-license', {
      manifest: { serviceType: 'certificate' },
    });

    expect(serviceRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      manifest: expect.objectContaining({
        serviceType: 'license',
        sourceTemplate: expect.objectContaining({ id: 'trade-license' }),
      }),
    }));
  });

  it('certifies selectable business activities for the Trade Licence journey', () => {
    const template = getCertifiedServiceTemplate('trade-license')!;
    const fields = template.formSchema.fields as Array<Record<string, any>>;
    const activity = fields.find((field) => field.id === 'business_activity');

    expect(activity).toMatchObject({ type: 'select', required: true });
    expect(activity?.options).toEqual([
      { label: 'Retail shop', value: 'retail_shop' },
      { label: 'Food service', value: 'food_service' },
      { label: 'Manufacturing', value: 'manufacturing' },
      { label: 'Professional services', value: 'professional_services' },
      { label: 'Other commercial activity', value: 'other' },
    ]);
  });

  it('defines a complete human-reviewed Income Certificate intake and evidence workflow', () => {
    const template = getCertifiedServiceTemplate('income-cert')!;
    const fields = (template.formSchema as any).fields;

    expect(fields.map((field: any) => field.id)).toEqual(expect.arrayContaining([
      'applicant_name',
      'guardian_name',
      'date_of_birth',
      'relationship_to_applicant',
      'residence_address',
      'residence_district',
      'residence_duration_years',
      'occupation',
      'annual_income',
      'assessment_year',
      'purpose',
    ]));
    expect(fields.find((field: any) => field.id === 'annual_income').validation).toEqual({ min: 0, max: 100000000 });
    expect(template.requiredDocuments.map((document: any) => [document.name, document.required])).toEqual([
      ['Identity proof', true],
      ['Residence proof', true],
      ['Income evidence', true],
      ['Relationship proof', true],
    ]);
    expect(template.eligibilityRules).toMatchObject({ mode: 'human_review', rules: [] });
    expect(template.certificationAuthority).toBe('ServiceFormAI Platform');
    expect(template.certificationScope).toContain('not statutory approval');
    expect(template.manifest).toMatchObject({
      citizenJourney: { supportsDrafts: true, supportsDeficiencyResubmission: true },
      workflow: { stages: expect.arrayContaining([
        expect.objectContaining({ id: 'field_verification', role: 'officer' }),
        expect.objectContaining({ id: 'authority_decision', role: 'approver' }),
        expect.objectContaining({ id: 'certificate_issued', role: 'system' }),
      ]) },
    });
  });

  it('passes positive and missing-required-field simulations for a certified draft', async () => {
    serviceRecord.published = false;
    serviceRecord.archived = false;
    serviceRecord.manifest = getCertifiedServiceTemplate('income-cert')?.manifest;
    serviceRecord.required_documents = getCertifiedServiceTemplate('income-cert')?.requiredDocuments;

    const result = await producerService.simulateServiceDraft('tenant-1', 'service-1');

    expect(result.passed).toBe(true);
    expect(result.checks.map((check) => check.id)).toEqual([
      'manifest-valid',
      'workflow-has-stages',
      'runtime-form-matches-manifest',
      'runtime-workflow-matches-manifest',
      'runtime-documents-match-manifest',
      'valid-submission-fixture',
      'missing-required-field-fixture',
    ]);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it('fails simulation when the manifest no longer has required fields', async () => {
    serviceRecord.published = false;
    serviceRecord.archived = false;
    serviceRecord.manifest = {
      ...getCertifiedServiceTemplate('income-cert')?.manifest,
      service: {
        ...(getCertifiedServiceTemplate('income-cert')?.manifest as any).service,
        formSchema: { title: 'Broken draft', fields: [] },
      },
    };

    const result = await producerService.simulateServiceDraft('tenant-1', 'service-1');

    expect(result.passed).toBe(false);
    expect(result.checks.find((check) => check.id === 'manifest-valid')?.passed).toBe(false);
  });

  it('fails simulation when runtime document requirements diverge from the manifest', async () => {
    const template = getCertifiedServiceTemplate('income-cert')!;
    serviceRecord.published = false;
    serviceRecord.archived = false;
    serviceRecord.manifest = template.manifest;
    serviceRecord.required_documents = [{ name: 'Different evidence', required: true }];

    const result = await producerService.simulateServiceDraft('tenant-1', 'service-1');

    expect(result.passed).toBe(false);
    expect(result.checks.find((check) => check.id === 'runtime-documents-match-manifest')?.passed).toBe(false);
  });

  it('blocks direct publication when the runtime form differs from the manifest', async () => {
    serviceRecord.published = false;
    serviceRecord.archived = false;
    serviceRecord.manifest = getCertifiedServiceTemplate('income-cert')?.manifest;
    serviceRecord.form_schema = { version: '1.0', title: 'Different runtime form', fields: [] };

    await expect(
      producerService.setServicePublished('tenant-1', 'service-1', true),
    ).rejects.toThrow('must pass simulation');
    expect(releases).toHaveLength(0);
    expect(serviceRecord.published).toBe(false);
  });

  it('fails simulation when a field constraint makes the generated fixture invalid', async () => {
    const certifiedManifest = getCertifiedServiceTemplate('income-cert')?.manifest as any;
    serviceRecord.published = false;
    serviceRecord.archived = false;
    serviceRecord.manifest = {
      ...certifiedManifest,
      service: {
        ...certifiedManifest.service,
        formSchema: {
          ...certifiedManifest.service.formSchema,
          fields: [{
            id: 'annual_income',
            type: 'number',
            label: 'Annual income',
            required: true,
            validation: { min: 100, max: 10 },
          }],
        },
      },
    };

    const result = await producerService.simulateServiceDraft('tenant-1', 'service-1');

    expect(result.passed).toBe(false);
    expect(result.checks.find((check) => check.id === 'valid-submission-fixture')?.passed).toBe(false);
  });

  it('rejects edits to a published service and publishes draft edits as a new version', async () => {
    await producerService.setServicePublished('tenant-1', 'service-1', true);
    const originalSnapshot = structuredClone(releases[0].snapshot);

    await expect(
      producerService.updateService('tenant-1', 'service-1', {
        formSchema: { fields: [{ id: 'new-field', type: 'text' }] },
      }),
    ).rejects.toThrow(ForbiddenException);

    await producerService.setServicePublished('tenant-1', 'service-1', false);
    const customizedManifest = structuredClone(getCertifiedServiceTemplate('income-cert')?.manifest) as any;
    customizedManifest.service.formSchema = {
      version: '1.0',
      title: 'Income Certificate',
      fields: [{ id: 'new-field', name: 'new-field', type: 'text', label: 'New field', required: true }],
    };
    await producerService.updateService('tenant-1', 'service-1', {
      formSchema: customizedManifest.service.formSchema,
      manifest: customizedManifest,
    });
    await producerService.setServicePublished('tenant-1', 'service-1', true);

    expect(releases).toHaveLength(2);
    expect(releases[0].version).toBe(1);
    expect(releases[1].version).toBe(2);
    expect(releases[0].snapshot).toEqual(originalSnapshot);
    expect(releases[1].snapshot.form_schema).toEqual({
      version: '1.0',
      title: 'Income Certificate',
      fields: [{ id: 'new-field', name: 'new-field', type: 'text', label: 'New field', required: true }],
    });
  });

  it('preserves template lineage when a draft manifest is edited', async () => {
    const lineage = {
      id: 'income-cert',
      version: 1,
      certificationStatus: 'certified',
      certifiedAt: '2026-09-27T00:00:00.000Z',
    };
    serviceRecord.manifest = { ...getCertifiedServiceTemplate('income-cert')?.manifest, sourceTemplate: lineage };
    serviceRecord.published = false;
    const customizedManifest = structuredClone(getCertifiedServiceTemplate('income-cert')?.manifest);
    (customizedManifest as any).service.name = 'Customized income form';

    await producerService.updateService('tenant-1', 'service-1', {
      manifest: customizedManifest,
    });

    expect(serviceRecord.manifest.sourceTemplate).toEqual(lineage);
  });

  it('requires a distinct maker-checker approver and publishes the approved content hash', async () => {
    const requested = await producerService.requestServicePublication('tenant-1', 'service-1', 'maker-1');
    expect(requested).toMatchObject({ status: 'pending', requested_by_id: 'maker-1' });

    await expect(
      producerService.approveServicePublication('tenant-1', 'service-1', 'maker-1'),
    ).rejects.toThrow(ForbiddenException);

    const publication = await producerService.approveServicePublication('tenant-1', 'service-1', 'checker-1');
    expect(publication).toMatchObject({ published: true, version: 1, release_id: 'release-1' });
    expect(serviceRecord.published).toBe(true);
    expect(approvals[0]).toMatchObject({
      status: 'approved',
      requested_by_id: 'maker-1',
      approved_by_id: 'checker-1',
    });
  });

  it('refuses approval if the draft changes after the request was submitted', async () => {
    await producerService.requestServicePublication('tenant-1', 'service-1', 'maker-1');
    serviceRecord.description = 'Changed after request';

    await expect(
      producerService.approveServicePublication('tenant-1', 'service-1', 'checker-1'),
    ).rejects.toThrow(ConflictException);
    expect(serviceRecord.published).toBe(false);
    expect(releases).toHaveLength(0);
  });
});