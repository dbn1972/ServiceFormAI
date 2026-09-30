/**
 * Consumer API Service
 * Handles all consumer-facing API calls (citizen side)
 */

import { apiService } from './base.service';
import { API_ENDPOINTS } from '../../shared/config/api.config';
import type {
  TenantService,
  Application,
  ApplicationDeficiency,
  ApplicationStatusHistory,
  ConsentRecord,
  ServiceSchemaResponse,
  SubmitApplicationDto,
  PaginatedResponse,
  ServiceFilters,
  ApplicationFilters,
  PaginationParams,
  SaveApplicationDraftDto,
  SaveApplicationDraftResponse,
} from '../../shared/types';

interface ConsumerServicesResponse {
  services: Array<{
    id: string;
    tenant_id: string;
    tenant_name?: string;
    name: string;
    category: string;
    description: string;
    sla_days?: number;
    fees?: number;
  }>;
  count: number;
}

interface ConsumerApplicationsResponse {
  applications: Array<{
    application_id: string;
    tracking_number: string;
    status: string;
    current_stage?: string;
    service_name?: string;
    tenant_name?: string;
    submitted_at: string;
    last_updated?: string;
    status_history?: Array<Record<string, any>>;
    deficiencies?: Array<Record<string, any>>;
  }>;
  count: number;
}

interface ConsumerApplicationStatusResponse {
  application_id: string;
  service_id?: string;
  tenant_id?: string;
  tracking_number: string;
  status: string;
  current_stage?: string;
  service_name?: string;
  tenant_name?: string;
  submitted_at: string;
  last_updated?: string;
  status_history?: Array<Record<string, any>>;
  deficiencies?: Array<Record<string, any>>;
}

interface ApplicationDocumentResponse {
  id: string;
  applicationId: string;
  documentId: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  status: string;
}

interface ConsumerServiceDetailResponse {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  name: string;
  category: string;
  description: string;
  sla_days?: number;
  fees?: number;
  form_schema?: TenantService['formSchema'];
  workflow_config?: TenantService['workflowConfig'];
  eligibility_rules?: TenantService['eligibilityRules'];
  required_documents?: TenantService['requiredDocuments'];
  manifest?: TenantService['manifest'];
  service_release_id?: string;
  schema_version?: number;
}

export class ConsumerService {
  private normalizeService(
    service: ConsumerServicesResponse['services'][number] | ConsumerServiceDetailResponse
  ): TenantService {
    const detail = service as ConsumerServiceDetailResponse;
    return {
      id: service.id,
      tenantId: service.tenant_id,
      name: service.name,
      description: service.description,
      category: service.category,
      formSchema: detail.form_schema || { title: service.name, fields: [] },
      workflowConfig: detail.workflow_config,
      eligibilityRules: detail.eligibility_rules,
      requiredDocuments: detail.required_documents,
      manifest: detail.manifest,
      isPublished: true,
      slaDays: service.sla_days,
      fees: typeof service.fees === 'number' ? service.fees : undefined,
      createdAt: '',
      updatedAt: '',
      tenant: service.tenant_name
        ? {
            id: service.tenant_id,
            name: service.tenant_name,
            subdomain: '',
            type: 'DEPARTMENT',
            isActive: true,
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
    };
  }

  private normalizeApplication(
    application: ConsumerApplicationsResponse['applications'][number] | ConsumerApplicationStatusResponse
  ): Application {
    const rawStatusHistory = 'status_history' in application ? application.status_history : undefined;
    const rawDeficiencies = 'deficiencies' in application ? application.deficiencies : undefined;

    return {
      id: application.application_id,
      serviceId: 'service_id' in application && application.service_id
        ? application.service_id
        : application.service_name || application.tracking_number,
      consumerUserId: '',
      tenantId: 'tenant_id' in application && application.tenant_id ? application.tenant_id : '',
      formData: application.service_name
        ? { serviceName: application.service_name }
        : {},
      status: this.normalizeStatus(application.status),
      currentStage: application.current_stage,
      trackingNumber: application.tracking_number,
      submittedAt: application.submitted_at,
      updatedAt: application.last_updated || application.submitted_at,
      statusHistory: Array.isArray(rawStatusHistory)
        ? rawStatusHistory.map((item: any) => ({
            id: String(item.id),
            applicationId: String(item.application_id || item.applicationId || application.application_id),
            status: this.normalizeStatus(String(item.to_status || item.status || application.status)),
            stage: item.stage || undefined,
            notes: item.notes || undefined,
            changedBy: String(item.actor_id || item.changed_by || 'system'),
            changedAt: String(item.created_at || item.changed_at || application.last_updated || application.submitted_at),
          } satisfies ApplicationStatusHistory))
        : undefined,
      deficiencies: Array.isArray(rawDeficiencies)
        ? rawDeficiencies.map((item: any) => ({
            id: String(item.id),
            applicationId: String(item.application_id || item.applicationId || application.application_id),
            title: String(item.title || 'Deficiency'),
            description: String(item.description || ''),
            status: String(item.status || 'open'),
            dueAt: item.due_at || item.dueAt || null,
            resolvedAt: item.resolved_at || item.resolvedAt || null,
            resolutionNotes: item.resolution_notes || item.resolutionNotes || null,
            createdAt: item.created_at || item.createdAt || undefined,
            updatedAt: item.updated_at || item.updatedAt || undefined,
          } satisfies ApplicationDeficiency))
        : undefined,
    };
  }

  private normalizeStatus(status: string): Application['status'] {
    const normalized = status.toUpperCase().replace(/-/g, '_');
    switch (normalized) {
      case 'DRAFT':
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'PENDING_DOCUMENTS':
      case 'APPROVED':
      case 'REJECTED':
      case 'COMPLETED':
      case 'CANCELLED':
        return normalized;
      default:
        return 'SUBMITTED';
    }
  }

  /**
   * Get all published services (with optional filters)
   */
  async getServices(
    filters?: ServiceFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<TenantService>> {
    const params = {
      ...filters,
      ...pagination,
    };

    const response = await apiService.get<ConsumerServicesResponse>(
      API_ENDPOINTS.consumer.services,
      params
    );

    return {
      data: response.services.map((service) => this.normalizeService(service)),
      total: response.count,
      page: pagination?.page || 1,
      limit: pagination?.limit || response.count || 0,
      totalPages: 1,
    };
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<TenantService> {
    const response = await apiService.get<ConsumerServiceDetailResponse>(
      API_ENDPOINTS.consumer.serviceById(id)
    );

    return this.normalizeService(response);
  }

  /**
   * Get service schema by ID
   */
  async getFormSchema(serviceId: string): Promise<ServiceSchemaResponse> {
    return apiService.get<ServiceSchemaResponse>(
      `${API_ENDPOINTS.consumer.serviceById(serviceId)}/schema`
    );
  }

  async getServiceDraft(serviceId: string): Promise<SaveApplicationDraftResponse | null> {
    const response = await apiService.get<SaveApplicationDraftResponse | null>(
      API_ENDPOINTS.consumer.serviceDraft(serviceId),
    );
    return response?.application_id ? response : null;
  }

  async saveServiceDraft(serviceId: string, data: SaveApplicationDraftDto): Promise<SaveApplicationDraftResponse> {
    return apiService.post(API_ENDPOINTS.consumer.serviceDraft(serviceId), data);
  }

  async getApplicationDocuments(applicationId: string): Promise<ApplicationDocumentResponse[]> {
    return apiService.get(API_ENDPOINTS.upload.applicationDocuments(applicationId));
  }

  async getApplicationOutput(applicationId: string): Promise<{
    id: string;
    certificate_number: string;
    status: string;
    format: string;
    storage_key: string | null;
    download_url: string | null;
    verification_code: string;
    issued_at: string;
    metadata: Record<string, unknown>;
  }> {
    return apiService.get(API_ENDPOINTS.consumer.applicationOutput(applicationId));
  }

  async uploadApplicationDocument(
    applicationId: string,
    documentType: string,
    file: File,
  ): Promise<ApplicationDocumentResponse> {
    return apiService.upload<ApplicationDocumentResponse>(
      API_ENDPOINTS.upload.document,
      file,
      { applicationId, documentType },
    );
  }

  /**
   * Submit a new application with idempotency key to prevent duplicate submissions.
   */
  async submitApplication(data: SubmitApplicationDto): Promise<Application> {
    // Generate a per-form idempotency key so repeated submits return the existing record
    const idempotencyKey = `${data.serviceId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const response = await apiService.post<{
      application_id: string;
      tracking_number: string;
      status: string;
      submitted_at: string;
      idempotent?: boolean;
    }>(
      API_ENDPOINTS.consumer.submitApplication,
      data,
      {
        'x-idempotency-key': idempotencyKey,
        ...(data.schemaVersion ? { 'x-schema-version': String(data.schemaVersion) } : {}),
      }
    );

    return this.normalizeApplication(response);
  }

  /**
   * Get my applications
   */
  async getMyApplications(
    filters?: ApplicationFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Application>> {
    const params = {
      ...filters,
      ...pagination,
    };

    const response = await apiService.get<ConsumerApplicationsResponse>(
      API_ENDPOINTS.consumer.myApplications,
      params
    );

    return {
      data: response.applications.map((application) => this.normalizeApplication(application)),
      total: response.count,
      page: pagination?.page || 1,
      limit: pagination?.limit || response.count || 0,
      totalPages: 1,
    };
  }

  /**
   * Get application by ID
   */
  async getApplicationById(id: string): Promise<Application> {
    const response = await apiService.get<ConsumerApplicationStatusResponse>(
      API_ENDPOINTS.consumer.applicationById(id)
    );

    return this.normalizeApplication(response);
  }

  /**
   * Track application by tracking number
   */
  async trackApplication(trackingNumber: string): Promise<Application> {
    return apiService.get<Application>(
      API_ENDPOINTS.consumer.applicationTracking(trackingNumber)
    );
  }

  /**
   * Save application as draft
   */
  async saveDraft(serviceId: string, formData: Record<string, any>): Promise<Application> {
    return apiService.post<Application>(
      API_ENDPOINTS.consumer.submitApplication,
      {
        serviceId,
        formData,
        isDraft: true,
      }
    );
  }

  /**
   * Update draft application
   */
  async updateDraft(id: string, formData: Record<string, any>): Promise<Application> {
    return apiService.patch<Application>(
      API_ENDPOINTS.consumer.applicationById(id),
      { formData }
    );
  }

  async submitDeficiencyResponse(
    applicationId: string,
    data: { notes?: string; formData?: Record<string, any> }
  ): Promise<Application> {
    return apiService.post<Application>(
      `${API_ENDPOINTS.consumer.applicationById(applicationId)}/deficiency-response`,
      data
    );
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  async getProfile(): Promise<{ id: string; name: string | null; email: string | null; phone: string | null; consumer_source: string; created_at: string }> {
    return apiService.get(API_ENDPOINTS.consumer.profile);
  }

  async updateProfile(data: { name?: string; email?: string; phone?: string }): Promise<{ id: string; name: string | null; email: string | null; phone: string | null }> {
    return apiService.patch(API_ENDPOINTS.consumer.profile, data);
  }

  // ─── Consent ─────────────────────────────────────────────────────────────

  async getActiveConsents(): Promise<{ records: ConsentRecord[]; count: number }> {
    return apiService.get(API_ENDPOINTS.consumer.consentActive);
  }

  async getConsentHistory(): Promise<{ records: ConsentRecord[]; count: number }> {
    return apiService.get(API_ENDPOINTS.consumer.consentHistory);
  }

  async revokeConsent(consentId: string): Promise<ConsentRecord> {
    return apiService.patch(API_ENDPOINTS.consumer.revokeConsent(consentId), {});
  }

  async withdrawConsent(consentId: string): Promise<ConsentRecord> {
    return apiService.patch(API_ENDPOINTS.consumer.withdrawConsent(consentId), {});
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  async getNotifications(page = 1, limit = 20): Promise<{ data: NotificationItem[]; total: number; page: number; limit: number }> {
    return apiService.get(API_ENDPOINTS.consumer.notifications, { page, limit });
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    return apiService.patch(API_ENDPOINTS.consumer.markNotificationRead(notificationId), {});
  }

  async markAllNotificationsRead(): Promise<void> {
    return apiService.patch(API_ENDPOINTS.consumer.markAllNotificationsRead, {});
  }

  // ─── Grievances ───────────────────────────────────────────────────────────

  async getGrievances(params?: { status?: string; page?: number; limit?: number }): Promise<{ data: GrievanceItem[]; total: number }> {
    const response = await apiService.get<{ data: any[]; total: number }>(API_ENDPOINTS.consumer.grievances, params as Record<string, any>);
    return { ...response, data: response.data.map((item) => this.normalizeGrievance(item)) };
  }

  async getGrievanceById(id: string): Promise<GrievanceItem> {
    const response = await apiService.get<any>(API_ENDPOINTS.consumer.grievanceById(id));
    return this.normalizeGrievance(response);
  }

  async createGrievance(dto: { applicationId: string; category: string; subject: string; description: string }): Promise<GrievanceItem> {
    const response = await apiService.post<any>(API_ENDPOINTS.consumer.grievances, dto);
    return this.normalizeGrievance(response);
  }

  async addGrievanceComment(grievanceId: string, comment: string): Promise<void> {
    return apiService.post(API_ENDPOINTS.consumer.grievanceComments(grievanceId), { comment });
  }

  async reopenGrievance(grievanceId: string, reason: string): Promise<GrievanceItem> {
    const response = await apiService.post<any>(`${API_ENDPOINTS.consumer.grievanceById(grievanceId)}/reopen`, { reason });
    return this.normalizeGrievance(response);
  }

  async createAppeal(applicationId: string, grounds: string, statement: string): Promise<Record<string, any>> {
    return apiService.post(`${API_ENDPOINTS.consumer.applicationById(applicationId)}/appeals`, { grounds, statement });
  }

  async getAppeals(applicationId?: string): Promise<Array<Record<string, any>>> {
    return applicationId
      ? apiService.get(`${API_ENDPOINTS.consumer.applicationById(applicationId)}/appeals`)
      : apiService.get('/consumer/appeals');
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────

  async submitFeedback(dto: { applicationId: string; rating: number; comment?: string; tags?: string[] }): Promise<void> {
    return apiService.post(API_ENDPOINTS.consumer.feedback, dto);
  }

  async getCitizenFeedback(applicationId?: string): Promise<Array<Record<string, any>>> {
    return apiService.get(API_ENDPOINTS.consumer.feedback, applicationId ? { applicationId } : undefined);
  }

  private normalizeGrievance(raw: any): GrievanceItem {
    const timeline = Array.isArray(raw.timeline) ? raw.timeline : [];
    const status = String(raw.status || 'submitted').toLowerCase();
    const displayStatus = status === 'resolved' ? 'RESOLVED'
      : status === 'closed' ? 'CLOSED'
        : status === 'reopened' ? 'REOPENED'
          : ['assigned', 'in_review'].includes(status) ? 'ASSIGNED'
            : 'SUBMITTED';
    return {
      id: raw.id,
      applicationId: raw.application_id ?? raw.applicationId,
      subject: raw.subject,
      description: raw.description,
      category: raw.category,
      status: displayStatus,
      resolution: raw.resolution,
      dueAt: raw.due_at,
      created_at: raw.created_at,
      comments: timeline.filter((entry: any) => entry.event === 'citizen_comment').map((entry: any) => ({
        id: `${entry.at}:${entry.actorId}`,
        text: entry.comment,
        created_at: entry.at,
      })),
    };
  }
}

// ─── Helper types ────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  meta?: { applicationId?: string; trackingNumber?: string; status?: string };
}

export interface GrievanceItem {
  id: string;
  subject: string;
  description: string;
  status: string;
  category?: string;
  resolution?: string | null;
  dueAt?: string | null;
  created_at: string;
  applicationId?: string;
  trackingNumber?: string;
  comments?: Array<{ id: string; text: string; created_at: string }>;
}

// Export singleton instance
export const consumerService = new ConsumerService();
