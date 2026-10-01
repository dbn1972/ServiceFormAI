import { validateServiceManifest } from '@serviceformai/service-manifest';
import type { ServiceManifest } from '@serviceformai/service-manifest';
import type { CreateServiceDto } from '../shared/types';
import type { BuilderState } from '../components/form-builder/types';
import { exportSchema } from './schemaExporter';

const DEFAULT_WORKFLOW_STAGES: NonNullable<ServiceManifest['workflow']>['stages'] = [
  {
    id: 'submitted',
    name: 'Submitted',
    assignedRole: 'SYSTEM',
    actions: ['submit'],
    nextStages: ['review'],
    slaHours: 24,
  },
  {
    id: 'review',
    name: 'Review',
    assignedRole: 'OFFICER',
    actions: ['forward', 'raise_deficiency'],
    nextStages: ['approval', 'pending_documents'],
    slaHours: 72,
  },
  {
    id: 'approval',
    name: 'Approval',
    assignedRole: 'APPROVER',
    actions: ['approve', 'reject', 'raise_deficiency'],
    nextStages: ['completed', 'pending_documents', 'rejected'],
    slaHours: 48,
  },
  {
    id: 'pending_documents',
    name: 'Additional information required',
    assignedRole: 'CITIZEN',
    actions: ['submit_evidence'],
    nextStages: ['review'],
    slaHours: 168,
  },
  { id: 'completed', name: 'Completed', assignedRole: 'SYSTEM', actions: [], nextStages: [] },
  { id: 'rejected', name: 'Rejected', assignedRole: 'SYSTEM', actions: [], nextStages: [] },
];

function serviceTypeFor(name: string, category: string): ServiceManifest['serviceType'] {
  const descriptor = `${name} ${category}`.toLowerCase();
  if (descriptor.includes('licence') || descriptor.includes('license')) return 'license';
  if (descriptor.includes('scheme') || descriptor.includes('scholarship') || descriptor.includes('benefit')) {
    return 'scheme';
  }
  return 'certificate';
}

export function buildServiceDefinition(state: BuilderState): CreateServiceDto {
  const name = state.metadata.serviceName.trim();
  const category = state.metadata.category.trim();
  const description = state.metadata.description.trim();
  if (!name || !category) {
    throw new Error('Service name and category are required.');
  }
  if (state.fields.length === 0) {
    throw new Error('Add at least one field before saving the service.');
  }

  const schema = exportSchema(state);
  const sections = state.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    fieldIds: [...section.fieldIds],
  }));
  const canonicalFormSchema = {
    ...schema,
    title: name,
    description,
    fields: schema.fields.map((field) => ({ ...field, name: field.id })),
    sections,
    crossFieldRules: state.crossFieldRules.map((rule) => ({ ...rule })),
  };
  const manifest: ServiceManifest = {
    manifestVersion: '1.0.0',
    serviceType: serviceTypeFor(name, category),
    service: {
      id: state.metadata.serviceId || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name,
      category,
      description,
      slaDays: state.metadata.slaDays ?? 30,
      formSchema: canonicalFormSchema,
    },
    eligibility: { mode: 'human_review', rules: [] },
    requiredDocuments: [],
    workflow: { stages: DEFAULT_WORKFLOW_STAGES },
    payment: { required: false, feeAmount: 0, currency: 'INR' },
    output: {
      type: serviceTypeFor(name, category),
      format: 'PDF',
      supportsDigitalSignature: false,
      verification: { mode: 'verification-code' },
    },
    localization: { defaultLanguage: 'en', supportedLanguages: ['en', 'hi'] },
  };

  const validation = validateServiceManifest(manifest);
  if (!validation.valid) {
    throw new Error(validation.errors.map((error) => `${error.path}: ${error.message}`).join('; '));
  }

  return {
    name,
    category,
    description,
    formSchema: canonicalFormSchema as unknown as CreateServiceDto['formSchema'],
    workflowConfig: { stages: manifest.workflow?.stages ?? DEFAULT_WORKFLOW_STAGES },
    eligibilityRules: manifest.eligibility,
    requiredDocuments: manifest.requiredDocuments,
    manifest: manifest as unknown as Record<string, any>,
    slaDays: manifest.service.slaDays,
    fees: manifest.payment?.feeAmount ?? 0,
  };
}