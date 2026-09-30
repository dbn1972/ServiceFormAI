import type { ManifestWorkflowStage, ServiceManifest } from '@serviceformai/service-manifest';

type DraftField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  prefillable: boolean;
  mapping?: string;
  options?: Array<string | { label: string; value: string }>;
  validation?: Record<string, unknown>;
  placeholder?: string;
  helpText?: string;
};

type DraftRule = {
  field: string;
  operator: string;
  value: string;
};

type DraftDocument = {
  name: string;
  digilocker: string;
  required: boolean;
  description?: string;
};

type ServiceDraft = {
  template?: string;
  name: string;
  category: string;
  description: string;
  sla: string;
  fields: DraftField[];
  eligibilityRules: DraftRule[];
  documents: DraftDocument[];
  formSections?: Array<{ id: string; title: string; fieldIds: string[] }>;
  workflowStages?: ManifestWorkflowStage[];
};

function parseSlaDays(raw: string): number | undefined {
  const value = parseInt(raw.replace(/\D/g, ''), 10);
  return Number.isNaN(value) ? undefined : value;
}

function buildFormSections(draft: ServiceDraft) {
  const prefillFieldIds = draft.fields.filter((field) => field.prefillable).map((field) => field.id);
  const manualFieldIds = draft.fields.filter((field) => !field.prefillable).map((field) => field.id);
  const sections: Array<{ id: string; title: string; description?: string; fieldIds: string[] }> = [];

  if (prefillFieldIds.length > 0) {
    sections.push({
      id: 'prefilled-details',
      title: 'Prefilled Details',
      description: 'Review values sourced from DigiLocker or profile signals.',
      fieldIds: prefillFieldIds,
    });
  }

  if (manualFieldIds.length > 0) {
    sections.push({
      id: 'application-details',
      title: 'Application Details',
      description: 'Complete the remaining application fields.',
      fieldIds: manualFieldIds,
    });
  }

  if (sections.length === 0 && draft.fields.length > 0) {
    sections.push({
      id: 'application-details',
      title: 'Application Details',
      fieldIds: draft.fields.map((field) => field.id),
    });
  }

  return sections;
}

export function buildManifestFromServiceDraft(draft: ServiceDraft): ServiceManifest {
  const serviceId = (draft.template || draft.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const sections = buildFormSections(draft);

  return {
    manifestVersion: '1.0.0',
    serviceType: draft.template === 'trade-license'
      ? 'license'
      : draft.category.toLowerCase().includes('scheme') || draft.template === 'scholarship'
        ? 'scheme'
        : 'certificate',
    service: {
      id: serviceId || 'service-draft',
      name: draft.name,
      category: draft.category,
      description: draft.description,
      slaDays: parseSlaDays(draft.sla),
      formSchema: {
        version: '1.0',
        title: draft.name,
        description: draft.description,
        fields: draft.fields.map((field) => ({
          id: field.id,
          name: field.id,
          type: field.type,
          label: field.label,
          required: field.required,
          options: field.options?.map((option) => typeof option === 'string'
            ? { label: option, value: option }
            : option),
          validation: field.validation,
          placeholder: field.placeholder,
          helpText: field.helpText,
        })),
        sections: draft.formSections ?? sections,
      },
    },
    citizenJourney: {
      supportsDigilockerLogin: true,
      requiresConsent: true,
      supportsDrafts: true,
      supportsDeficiencyResubmission: true,
    },
    digilockerMappings: draft.fields
      .filter((field) => field.prefillable && field.mapping)
      .map((field) => ({
        fieldId: field.id,
        source: field.mapping || '',
        prefill: true,
        editable: true,
      })),
    eligibility: {
      mode: 'rule-based',
      rules: draft.eligibilityRules.map((rule) => ({
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
      })),
    },
    requiredDocuments: draft.documents.map((document, index) => ({
      id: `document-${index + 1}`,
      name: document.name,
      required: document.required,
      description: document.description,
      acceptedSources: document.digilocker ? ['digilocker', 'upload'] : ['upload'],
      digilockerTypes: document.digilocker ? document.digilocker.split(',').map((item) => item.trim()) : [],
    })),
    workflow: {
      stages: draft.workflowStages ?? [
        {
          id: 'submitted',
          name: 'Submitted',
          assignedRole: 'SYSTEM',
          actions: ['acknowledge'],
          nextStages: ['review'],
          slaHours: 2,
        },
        {
          id: 'review',
          name: 'Review',
          assignedRole: 'OFFICER',
          actions: ['approve', 'raise_deficiency', 'reject'],
          nextStages: ['completed', 'deficiency', 'rejected'],
          slaHours: 72,
        },
      ],
    },
    payment: {
      required: false,
      feeAmount: 0,
      currency: 'INR',
    },
    notifications: {
      triggers: [
        { event: 'submitted', channels: ['SMS', 'EMAIL', 'PUSH'] },
        { event: 'approved', channels: ['SMS', 'EMAIL', 'PUSH'] },
      ],
    },
    output: {
      type: draft.template === 'trade-license' ? 'license' : 'certificate',
      format: 'pdf',
      supportsDigitalSignature: true,
      supportsDigilockerDelivery: true,
      verification: {
        mode: 'qr_and_url',
      },
    },
    localization: {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'hi'],
    },
  };
}

export function buildScholarshipManifestPreview(params: {
  name: string;
  category: string;
  description: string;
}): ServiceManifest {
  return {
    manifestVersion: '1.0.0',
    serviceType: 'scheme',
    service: {
      id: params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name: params.name,
      category: params.category,
      description: params.description,
      slaDays: 45,
      formSchema: {
        version: '1.0',
        title: params.name,
        description: params.description,
        fields: [
          { id: 'fullName', name: 'fullName', type: 'text', label: 'Full Name', required: true },
          { id: 'dateOfBirth', name: 'dateOfBirth', type: 'date', label: 'Date of Birth', required: true },
          { id: 'institutionName', name: 'institutionName', type: 'text', label: 'Institution Name', required: true },
          { id: 'annualFamilyIncome', name: 'annualFamilyIncome', type: 'number', label: 'Annual Family Income', required: true }
        ],
        sections: [
          {
            id: 'applicant-details',
            title: 'Applicant Details',
            description: 'Review identity details and personal information.',
            fieldIds: ['fullName', 'dateOfBirth'],
          },
          {
            id: 'scholarship-details',
            title: 'Scholarship Details',
            description: 'Provide institution and financial information.',
            fieldIds: ['institutionName', 'annualFamilyIncome'],
          },
        ],
      },
    },
    citizenJourney: {
      supportsDigilockerLogin: true,
      requiresConsent: true,
      supportsDrafts: true,
      supportsDeficiencyResubmission: true,
      supportsRecommendationFeed: true,
    },
    digilockerMappings: [
      { fieldId: 'fullName', source: 'AADHAAR.name', prefill: true, editable: false },
      { fieldId: 'dateOfBirth', source: 'AADHAAR.dob', prefill: true, editable: false },
    ],
    eligibility: {
      mode: 'rule-based',
      recommendationSignals: ['age', 'educationStatus', 'incomeBand'],
      rules: [
        { field: 'citizen.age', operator: '>=', value: 16, message: 'Applicant must be at least 16 years old.' },
        { field: 'household.income', operator: '<=', value: 250000, message: 'Annual family income must not exceed 2,50,000.' },
      ],
    },
    requiredDocuments: [
      { id: 'aadhaar', name: 'Identity Proof', required: true, acceptedSources: ['digilocker', 'upload'], digilockerTypes: ['AADHAAR'] },
      { id: 'income-certificate', name: 'Income Certificate', required: true, acceptedSources: ['digilocker', 'upload'], digilockerTypes: ['INCOME_CERTIFICATE'] },
    ],
    workflow: {
      stages: [
        { id: 'submitted', name: 'Submitted', assignedRole: 'SYSTEM', actions: ['acknowledge'], nextStages: ['eligibility_check'], slaHours: 4 },
        { id: 'eligibility_check', name: 'Eligibility Check', assignedRole: 'OFFICER', actions: ['approve', 'raise_deficiency', 'reject'], nextStages: ['completed', 'deficiency', 'rejected'], slaHours: 120 },
      ],
    },
    payment: {
      required: false,
      feeAmount: 0,
      currency: 'INR',
    },
    notifications: {
      triggers: [
        { event: 'submitted', channels: ['SMS', 'EMAIL', 'PUSH'] },
        { event: 'approved', channels: ['SMS', 'EMAIL', 'PUSH'] },
      ],
    },
    output: {
      type: 'benefit_outcome',
      format: 'pdf',
      supportsDigitalSignature: true,
      supportsDigilockerDelivery: false,
      artifacts: ['sanction_letter'],
    },
    localization: {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'hi'],
    },
  };
}