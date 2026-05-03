/**
 * TypeScript types matching the NestJS backend entities
 * These ensure type safety between frontend and backend
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OFFICER' | 'VIEWER';
  tenantId: string;
  tenant?: Tenant;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  aadhaarHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: TenantUser | ConsumerUser;
  tokens: AuthTokens;
}

// ============================================================================
// Tenant Types (Producer Side)
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  type: 'MUNICIPALITY' | 'STATE_OFFICE' | 'UNIVERSITY' | 'DEPARTMENT';
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services?: TenantService[];
  users?: TenantUser[];
}

export interface TenantService {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: string;
  formSchema: FormSchema;
  workflowConfig?: WorkflowConfig;
  eligibilityRules?: string[] | Record<string, any>;
  requiredDocuments?: Array<string | { name: string; type?: string; source?: string; required?: boolean }>;
  isPublished: boolean;
  slaDays?: number;
  fees?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  applications?: Application[];
}

// ============================================================================
// Form Schema Types (Dynamic Form Engine)
// ============================================================================

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
  sections?: FormSection[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: string[]; // Array of field IDs
  conditional?: ConditionalRule;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'tel' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'aadhaar' | 'pan';
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  conditional?: ConditionalRule;
  helpText?: string;
  defaultValue?: any;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}

// ============================================================================
// Workflow Configuration Types
// ============================================================================

export interface WorkflowConfig {
  stages: WorkflowStage[];
  slaHours?: number;
  notifications?: NotificationConfig[];
}

export interface WorkflowStage {
  id: string;
  name: string;
  description?: string;
  assignedRole?: string;
  actions: string[];
  nextStages: string[];
  slaHours?: number;
}

export interface NotificationConfig {
  trigger: 'STAGE_CHANGE' | 'SLA_WARNING' | 'APPROVAL' | 'REJECTION';
  channels: ('EMAIL' | 'SMS' | 'PUSH')[];
  template: string;
}

export interface ServiceSchemaResponse {
  service_id: string;
  service_name: string;
  category: string;
  form_schema: FormSchema;
}

// ============================================================================
// Application Types (Consumer Side)
// ============================================================================

export interface Application {
  id: string;
  serviceId: string;
  consumerUserId: string;
  tenantId: string;
  formData: Record<string, any>;
  status: ApplicationStatus;
  currentStage?: string;
  trackingNumber: string;
  submittedAt: string;
  updatedAt: string;
  completedAt?: string;
  service?: TenantService;
  consumerUser?: ConsumerUser;
  tenant?: Tenant;
  statusHistory?: ApplicationStatusHistory[];
  documents?: ApplicationDocument[];
}

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_DOCUMENTS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  stage?: string;
  notes?: string;
  changedBy: string;
  changedAt: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

// ============================================================================
// API Request/Response DTOs
// ============================================================================

// Auth DTOs
export interface RegisterTenantDto {
  email: string;
  password: string;
  name: string;
  tenantName: string;
  tenantType: Tenant['type'];
  subdomain: string;
}

export interface RegisterConsumerDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginConsumerDto {
  identifier: string;
  password: string;
  method: 'email' | 'mobile';
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// ============================================================================
// Scalability & Admin Operability Types
// ============================================================================

export type ScalabilityViolationType =
  | 'Direct DB read without cache'
  | 'Direct DB write without queue'
  | 'Unsafe cache fallback'
  | 'Missing cache repopulation'
  | 'Missing cache invalidation'
  | 'Missing queue retry'
  | 'Missing DLQ'
  | 'Missing idempotency'
  | 'Missing monitoring'
  | 'Missing admin control'
  | 'Missing rate limit'
  | 'Missing backpressure'
  | 'Database bottleneck'
  | 'Infrastructure bottleneck';

export interface DomainCacheConfig {
  enabled: boolean;
  ttlMs: number;
  staleWhileRevalidateMs: number;
  negativeTtlMs: number;
}

export interface QueueConfig {
  enabled: boolean;
  provider: 'redis' | 'database' | 'disabled';
  retryLimit: number;
  backoffMs: number;
  dlqEnabled: boolean;
  consumersPaused: boolean;
  queueName?: string;
  dlqName?: string;
}

export interface DbFallbackConfig {
  enabled: boolean;
  maxFallbacksPerMinute: number;
}

export interface ScalabilityConfig {
  cache: {
    enabled: boolean;
    domains: Record<string, DomainCacheConfig>;
  };
  queue: QueueConfig;
  dbFallback: DbFallbackConfig;
  featureFlags: Record<string, boolean>;
}

export interface ScalabilityViolationRecord {
  timestamp: string;
  type: ScalabilityViolationType;
  module: string;
  detail: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface ScalabilitySummary {
  startedAt: string;
  cache: {
    hits: number;
    misses: number;
    errors: number;
    staleServed: number;
    fallbackToDb: number;
    repopulations: number;
    repopulationFailures: number;
    invalidations: number;
    hitRate: number;
    byEndpoint: Record<string, { hits: number; misses: number; fallbackToDb: number }>;
  };
  queue: {
    availability?: 'redis' | 'database' | 'memory-disabled' | 'missing' | 'disabled';
    depth: number;
    lag: number;
    oldestMessageAgeMs: number;
    processingRate: number;
    errorRate: number;
    retryCount: number;
    dlqCount: number;
    processed: number;
    duplicates: number;
    poisonMessages: number;
    directWriteBypasses: number;
    enqueued?: number;
  };
  database: {
    directReadViolations: number;
    directWriteViolations: number;
    fallbackReads: number;
  };
  violations: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ScalabilitySummaryResponse {
  summary: ScalabilitySummary;
  config: ScalabilityConfig;
}

// Service DTOs
export interface CreateServiceDto {
  name: string;
  description: string;
  category: string;
  formSchema: FormSchema;
  workflowConfig?: WorkflowConfig;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  category?: string;
  formSchema?: FormSchema;
  workflowConfig?: WorkflowConfig;
  isPublished?: boolean;
}

// Application DTOs
export interface SubmitApplicationDto {
  serviceId: string;
  formData: Record<string, any>;
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
  stage?: string;
  notes?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// Filter & Query Types
// ============================================================================

export interface ServiceFilters {
  category?: string;
  tenantId?: string;
  search?: string;
  isPublished?: boolean;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  serviceId?: string;
  tenantId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface TenantAnalytics {
  totalApplications: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  applicationsByService: Array<{ serviceId: string; serviceName: string; count: number }>;
  avgProcessingTime: number;
  slaCompliance: number;
  trendData: Array<{ date: string; count: number }>;
}

export interface ServiceAnalytics {
  serviceId: string;
  serviceName: string;
  totalApplications: number;
  completionRate: number;
  avgProcessingTime: number;
  dropoffRate: number;
  popularFields: Array<{ field: string; usage: number }>;
}
