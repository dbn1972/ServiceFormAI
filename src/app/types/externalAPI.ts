/**
 * External API Integration Types
 * Standards for integrating third-party government services
 */

// Standard JSON Schema for External Service Integration
export interface ServiceFormSchema {
  version: '1.0';
  serviceId: string;
  serviceName: string;
  department: string;

  // Form metadata
  metadata: {
    description: string;
    category: string;
    sla: string;
    fees?: number;
    targetAudience: string;
    helpUrl?: string;
  };

  // Form fields (follows JSON Schema standard)
  fields: FormField[];

  // Document requirements
  documents: DocumentRequirement[];

  // Eligibility rules
  eligibility?: EligibilityRule[];

  // API endpoints
  endpoints: {
    submit: APIEndpoint;
    status: APIEndpoint;
    download?: APIEndpoint;
    cancel?: APIEndpoint;
  };

  // Validation rules
  validation?: ValidationRule[];
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'dropdown' | 'radio' | 'checkbox' | 'file' | 'textarea';
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;

  // Validation
  validation?: {
    pattern?: string; // Regex pattern
    minLength?: number;
    maxLength?: number;
    min?: number; // For numbers
    max?: number;
  };

  // For dropdown/radio
  options?: Array<{
    value: string;
    label: string;
  }>;

  // Conditional display
  conditional?: {
    field: string; // Field ID to check
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
  };

  // DigiLocker mapping
  digilockerMapping?: {
    source: 'aadhaar' | 'pan' | 'driving_license' | 'voter_id' | 'passport';
    field: string;
    autoFill: boolean;
  };

  // API field mapping
  apiMapping?: {
    requestField: string; // Field name in API request
    responseField?: string; // Field name in API response
    transform?: 'uppercase' | 'lowercase' | 'date_format' | 'phone_format';
  };
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  format: string[]; // ['pdf', 'jpg', 'png']
  maxSize: number; // in MB

  // DigiLocker integration
  digilocker?: {
    issuer: string;
    documentType: string;
    autoFetch: boolean;
  };

  // API mapping
  apiMapping?: {
    requestField: string;
    encoding: 'base64' | 'multipart' | 'url';
  };
}

export interface EligibilityRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
  message: string; // Error message if not eligible
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;

  // Authentication
  auth: {
    type: 'none' | 'api_key' | 'bearer' | 'oauth2' | 'basic';
    config: {
      apiKey?: string;
      headerName?: string; // For API key
      token?: string; // For bearer
      username?: string; // For basic
      password?: string; // For basic
      oauth?: {
        authUrl: string;
        tokenUrl: string;
        clientId: string;
        clientSecret: string;
        scopes: string[];
      };
    };
  };

  // Headers
  headers?: Record<string, string>;

  // Request mapping
  requestMapping?: {
    bodyTemplate?: 'json' | 'form_data' | 'xml' | 'custom';
    customTemplate?: string; // Handlebars template
    fieldMappings: Record<string, string>; // internal field -> API field
  };

  // Response mapping
  responseMapping?: {
    successField?: string; // JSON path to success indicator
    successValue?: any; // Expected success value
    errorField?: string; // JSON path to error message
    dataField?: string; // JSON path to response data
    fieldMappings?: Record<string, string>; // API field -> internal field
  };

  // Retry configuration
  retry?: {
    maxAttempts: number;
    backoffMs: number;
    retryOn: number[]; // HTTP status codes to retry
  };

  // Timeout
  timeout?: number; // milliseconds
}

export interface ValidationRule {
  id: string;
  type: 'required' | 'pattern' | 'custom' | 'api';
  field: string;
  message: string;

  // For pattern validation
  pattern?: string;

  // For custom validation
  customValidator?: string; // JavaScript function as string

  // For API validation
  apiEndpoint?: APIEndpoint;
}

// Webhook configuration for external callbacks
export interface WebhookConfig {
  id: string;
  name: string;
  enabled: boolean;

  // Webhook URL
  url: string;
  method: 'POST' | 'PUT';

  // Events to trigger on
  events: Array<
    | 'application_submitted'
    | 'application_approved'
    | 'application_rejected'
    | 'application_pending'
    | 'document_uploaded'
    | 'payment_completed'
  >;

  // Payload template
  payloadTemplate?: string; // Handlebars template

  // Headers
  headers?: Record<string, string>;

  // Authentication
  auth?: {
    type: 'api_key' | 'bearer' | 'hmac';
    config: Record<string, string>;
  };

  // Retry configuration
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

// API Test Result
export interface APITestResult {
  success: boolean;
  statusCode?: number;
  responseTime: number; // milliseconds
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  timestamp: string;
}

// External Service Integration Config
export interface ExternalServiceIntegration {
  id: string;
  name: string;
  description: string;
  department: string;

  // Form schema (can be URL or inline)
  schema: ServiceFormSchema | { url: string };

  // Integration status
  status: 'draft' | 'testing' | 'active' | 'inactive' | 'error';

  // Test results
  lastTestResult?: APITestResult;
  lastTestDate?: string;

  // Webhooks
  webhooks?: WebhookConfig[];

  // Monitoring
  monitoring: {
    enabled: boolean;
    alertEmail?: string;
    healthCheckInterval?: number; // minutes
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
