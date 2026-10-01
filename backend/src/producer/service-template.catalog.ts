export interface CertifiedServiceTemplate {
  id: string;
  version: number;
  certificationStatus: 'certified';
  certifiedAt: string;
  certificationAuthority: string;
  certificationScope: string;
  name: string;
  category: string;
  description: string;
  slaDays: number;
  formSchema: Record<string, unknown>;
  workflowConfig: Record<string, unknown>;
  eligibilityRules: Record<string, unknown>;
  requiredDocuments: Array<Record<string, unknown>>;
  manifest: Record<string, unknown>;
}

const certifiedAt = '2026-09-27T00:00:00.000Z';
const certificationAuthority = 'ServiceFormAI Platform';
const certificationScope = 'Manifest validity, required-schema completeness, and automated simulation; not statutory approval.';

type TemplateField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: Record<string, unknown>;
};

type TemplateStage = {
  id: string;
  name: string;
  role: string;
  assignedRole?: string;
  actions?: string[];
  nextStages?: string[];
  slaHours?: number;
};

function makeTemplate(input: {
  id: string;
  name: string;
  category: string;
  description: string;
  slaDays: number;
  fields: TemplateField[];
  documents: Array<string | { name: string; required?: boolean; description?: string }>;
  sections?: Array<{ id: string; title: string; fieldIds: string[] }>;
  workflowStages?: TemplateStage[];
  citizenJourney?: Record<string, unknown>;
}): CertifiedServiceTemplate {
  const formSchema = {
    version: '1.0',
    title: input.name,
    description: input.description,
    fields: input.fields.map((field) => ({ ...field, name: field.id })),
    ...(input.sections ? { sections: input.sections } : {}),
  };
  const workflowStages = input.workflowStages ?? [
      { id: 'submitted', name: 'Submitted', role: 'system', assignedRole: 'system', actions: ['submit'], nextStages: ['review'], slaHours: 24 },
      { id: 'review', name: 'Review', role: 'officer', assignedRole: 'officer', actions: ['forward', 'raise_deficiency'], nextStages: ['approval', 'pending_documents'], slaHours: 72 },
      { id: 'approval', name: 'Approval', role: 'approver', assignedRole: 'approver', actions: ['approve', 'reject', 'raise_deficiency'], nextStages: ['completed', 'pending_documents', 'rejected'], slaHours: 48 },
      { id: 'pending_documents', name: 'Additional information required', role: 'citizen', assignedRole: 'citizen', actions: ['submit_evidence'], nextStages: ['review'], slaHours: 168 },
      { id: 'completed', name: 'Completed', role: 'system', assignedRole: 'system', actions: [], nextStages: [] },
      { id: 'rejected', name: 'Rejected', role: 'system', assignedRole: 'system', actions: [], nextStages: [] },
    ];
  const workflowConfig = { stages: workflowStages };
  const requiredDocuments = input.documents.map((document) => ({
    ...(typeof document === 'string' ? { name: document } : document),
    required: typeof document === 'string' ? true : document.required ?? true,
    acceptedSources: ['upload'],
  }));
  const manifest = {
    manifestVersion: '1.0.0',
    serviceType: input.id === 'trade-license' ? 'license' : 'certificate',
    service: {
      id: input.id,
      name: input.name,
      category: input.category,
      description: input.description,
      formSchema,
      slaDays: input.slaDays,
    },
    workflow: {
      stages: workflowConfig.stages,
    },
    requiredDocuments,
    ...(input.citizenJourney ? { citizenJourney: input.citizenJourney } : {}),
    localization: {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'hi'],
    },
  };

  return {
    ...input,
    version: 1,
    certificationStatus: 'certified',
    certifiedAt,
    certificationAuthority,
    certificationScope,
    formSchema,
    workflowConfig,
    eligibilityRules: { mode: 'human_review', rules: [] },
    requiredDocuments,
    manifest,
  };
}

export const CERTIFIED_SERVICE_TEMPLATES: CertifiedServiceTemplate[] = [
  makeTemplate({
    id: 'income-cert',
    name: 'Income Certificate',
    category: 'Revenue',
    description: 'Reference application workflow for a tenant-configured income certificate issuing authority.',
    slaDays: 14,
    sections: [
      { id: 'applicant', title: 'Applicant details', fieldIds: ['applicant_name', 'guardian_name', 'date_of_birth', 'relationship_to_applicant'] },
      { id: 'residence', title: 'Residence details', fieldIds: ['residence_address', 'residence_district', 'residence_duration_years'] },
      { id: 'income', title: 'Household income', fieldIds: ['occupation', 'annual_income', 'assessment_year', 'purpose'] },
    ],
    fields: [
      { id: 'applicant_name', type: 'text', label: 'Applicant full name', required: true, placeholder: 'As shown on identity proof', validation: { minLength: 2, maxLength: 120 } },
      { id: 'guardian_name', type: 'text', label: 'Parent, spouse, or guardian name', required: true, validation: { minLength: 2, maxLength: 120 } },
      { id: 'date_of_birth', type: 'date', label: 'Date of birth', required: true },
      { id: 'relationship_to_applicant', type: 'select', label: 'Applicant relationship', required: true, options: [
        { label: 'Self', value: 'self' },
        { label: 'Child or dependent', value: 'dependent' },
        { label: 'Spouse', value: 'spouse' },
        { label: 'Other', value: 'other' },
      ] },
      { id: 'residence_address', type: 'textarea', label: 'Current residential address', required: true, validation: { minLength: 10, maxLength: 500 } },
      { id: 'residence_district', type: 'text', label: 'District of residence', required: true, validation: { minLength: 2, maxLength: 100 } },
      { id: 'residence_duration_years', type: 'number', label: 'Years at current residence', required: true, validation: { min: 0, max: 100 } },
      { id: 'occupation', type: 'textarea', label: 'Occupation and income sources of household members', required: true, validation: { minLength: 5, maxLength: 1000 } },
      { id: 'annual_income', type: 'number', label: 'Total annual household income', required: true, helpText: 'Enter the total income for the assessment year. The issuing authority will verify supporting evidence.', validation: { min: 0, max: 100000000 } },
      { id: 'assessment_year', type: 'select', label: 'Income assessment year', required: true, options: [
        { label: '2024-25', value: '2024-25' },
        { label: '2025-26', value: '2025-26' },
        { label: '2026-27', value: '2026-27' },
      ] },
      { id: 'purpose', type: 'select', label: 'Purpose of certificate', required: true, options: [
        { label: 'Scholarship or education support', value: 'education' },
        { label: 'Fee concession', value: 'fee_concession' },
        { label: 'Government scheme', value: 'government_scheme' },
        { label: 'Other', value: 'other' },
      ] },
    ],
    documents: [
      { name: 'Identity proof', description: 'Government-issued identity document for the applicant.' },
      { name: 'Residence proof', description: 'Current address proof for the declared residence.' },
      { name: 'Income evidence', description: 'Evidence appropriate to declared income sources, such as salary, pension, tax, or agricultural records.' },
      { name: 'Relationship proof', description: 'Evidence of the applicant relationship declared in this application.' },
    ],
    citizenJourney: {
      supportsDrafts: true,
      supportsDeficiencyResubmission: true,
      requiresConsent: true,
    },
    workflowStages: [
      { id: 'submitted', name: 'Submitted', role: 'system', assignedRole: 'system', actions: ['submit'], nextStages: ['document_scrutiny'], slaHours: 24 },
      { id: 'document_scrutiny', name: 'Document scrutiny', role: 'officer', assignedRole: 'officer', actions: ['verify_documents', 'raise_deficiency', 'forward'], nextStages: ['field_verification', 'pending_documents'], slaHours: 48 },
      { id: 'field_verification', name: 'Residence and income verification', role: 'officer', assignedRole: 'officer', actions: ['record_verification', 'raise_deficiency', 'recommend'], nextStages: ['authority_decision', 'pending_documents'], slaHours: 120 },
      { id: 'authority_decision', name: 'Competent authority decision', role: 'approver', assignedRole: 'approver', actions: ['approve', 'reject', 'raise_deficiency'], nextStages: ['certificate_issued', 'rejected', 'pending_documents'], slaHours: 48 },
      { id: 'pending_documents', name: 'Additional evidence requested', role: 'citizen', assignedRole: 'citizen', actions: ['submit_evidence'], nextStages: ['document_scrutiny'], slaHours: 168 },
      { id: 'certificate_issued', name: 'Certificate issued', role: 'system', assignedRole: 'system', actions: ['issue_certificate'], nextStages: [] },
      { id: 'rejected', name: 'Application rejected', role: 'system', assignedRole: 'system', actions: [], nextStages: [] },
    ],
  }),
  makeTemplate({
    id: 'trade-license',
    name: 'Trade Licence',
    category: 'Municipal',
    description: 'Apply for a municipal trade licence with premises and business details.',
    slaDays: 30,
    fields: [
      { id: 'business_name', type: 'text', label: 'Business name', required: true },
      { id: 'business_address', type: 'textarea', label: 'Business premises address', required: true },
      { id: 'business_activity', type: 'select', label: 'Business activity', required: true, options: [
        { label: 'Retail shop', value: 'retail_shop' },
        { label: 'Food service', value: 'food_service' },
        { label: 'Manufacturing', value: 'manufacturing' },
        { label: 'Professional services', value: 'professional_services' },
        { label: 'Other commercial activity', value: 'other' },
      ] },
    ],
    documents: ['Identity proof', 'Premises proof', 'Business registration evidence'],
  }),
  makeTemplate({
    id: 'birth-cert',
    name: 'Birth Certificate',
    category: 'Civil Records',
    description: 'Apply for a birth certificate with event, child, and parent details.',
    slaDays: 7,
    fields: [
      { id: 'child_name', type: 'text', label: 'Child full name', required: true },
      { id: 'date_of_birth', type: 'date', label: 'Date of birth', required: true },
      { id: 'place_of_birth', type: 'text', label: 'Place of birth', required: true },
      { id: 'parent_names', type: 'text', label: 'Parent or guardian names', required: true },
    ],
    documents: ['Hospital or birth event evidence', 'Parent identity proof'],
  }),
];

export function getCertifiedServiceTemplate(id: string) {
  return CERTIFIED_SERVICE_TEMPLATES.find((template) => template.id === id);
}