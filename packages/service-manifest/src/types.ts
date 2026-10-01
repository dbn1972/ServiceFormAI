export type ServiceManifestType = 'certificate' | 'license' | 'scheme' | 'benefit' | 'grievance';

export type ManifestChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP';

export interface ManifestFieldOption {
  label: string;
  value: string;
}

export interface ManifestFormField {
  id: string;
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: ManifestFieldOption[];
  validation?: Record<string, unknown>;
}

export interface ManifestFormSchema {
  version?: string;
  title: string;
  description?: string;
  fields: ManifestFormField[];
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    fieldIds: string[];
  }>;
  crossFieldRules?: Array<{
    type: string;
    fields: string[];
    targetField?: string;
    targetValue?: unknown;
    message?: string;
  }>;
}

export interface ManifestWorkflowStage {
  id: string;
  name: string;
  assignedRole: string;
  actions: string[];
  nextStages: string[];
  slaHours?: number;
}

export interface ManifestDocumentRequirement {
  id: string;
  name: string;
  required: boolean;
  description?: string;
  acceptedSources: Array<'digilocker' | 'upload' | 'api'>;
  digilockerTypes?: string[];
}

export interface ManifestNotificationTrigger {
  event: string;
  channels: ManifestChannel[];
}

export interface ServiceManifest {
  manifestVersion: string;
  serviceType: ServiceManifestType;
  service: {
    id: string;
    name: string;
    category: string;
    description: string;
    slaDays?: number;
    formSchema: ManifestFormSchema;
  };
  tenant?: {
    type?: string;
    allowedJurisdictions?: string[];
    brandingConfigurable?: boolean;
  };
  citizenJourney?: {
    supportsDigilockerLogin?: boolean;
    requiresConsent?: boolean;
    supportsDrafts?: boolean;
    supportsDeficiencyResubmission?: boolean;
    supportsRecommendationFeed?: boolean;
  };
  digilockerMappings?: Array<{
    fieldId: string;
    source: string;
    prefill?: boolean;
    editable?: boolean;
  }>;
  eligibility?: {
    mode?: 'rule-based' | 'hybrid' | 'human_review';
    recommendationSignals?: string[];
    rules?: Array<{
      field: string;
      operator: string;
      value: unknown;
      message?: string;
    }>;
  };
  requiredDocuments?: ManifestDocumentRequirement[];
  workflow?: {
    stages: ManifestWorkflowStage[];
  };
  payment?: {
    required: boolean;
    feeAmount: number;
    currency: string;
    waiverRules?: Array<{
      condition: string;
      message?: string;
    }>;
  };
  notifications?: {
    triggers: ManifestNotificationTrigger[];
  };
  output?: {
    type: string;
    format: string;
    supportsDigitalSignature?: boolean;
    supportsDigilockerDelivery?: boolean;
    artifacts?: string[];
    verification?: {
      mode: string;
    };
  };
  localization?: {
    defaultLanguage: string;
    supportedLanguages: string[];
  };
}

export interface ServiceManifestValidationError {
  path: string;
  message: string;
}

export interface ServiceManifestValidationResult {
  valid: boolean;
  errors: ServiceManifestValidationError[];
}