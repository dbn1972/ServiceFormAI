/**
 * Consumer API Service
 * Handles all consumer-facing API calls (citizen side)
 */

import { apiService } from './base.service';
import { API_ENDPOINTS } from '../../shared/config/api.config';
import type {
  TenantService,
  Application,
  ServiceSchemaResponse,
  SubmitApplicationDto,
  PaginatedResponse,
  ServiceFilters,
  ApplicationFilters,
  PaginationParams,
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
  }>;
  count: number;
}

interface ConsumerApplicationStatusResponse {
  application_id: string;
  tracking_number: string;
  status: string;
  current_stage?: string;
  service_name?: string;
  tenant_name?: string;
  submitted_at: string;
  last_updated?: string;
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
    return {
      id: application.application_id,
      serviceId: application.service_name || application.tracking_number,
      consumerUserId: '',
      tenantId: '',
      formData: application.service_name
        ? { serviceName: application.service_name }
        : {},
      status: this.normalizeStatus(application.status),
      currentStage: application.current_stage,
      trackingNumber: application.tracking_number,
      submittedAt: application.submitted_at,
      updatedAt: application.last_updated || application.submitted_at,
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
      { 'x-idempotency-key': idempotencyKey }
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

  /**
   * Upload document for application
   */
  async uploadDocument(
    applicationId: string,
    file: File,
    documentType: string
  ): Promise<{ url: string; documentId: string }> {
    return apiService.upload(
      API_ENDPOINTS.upload.document,
      file,
      { applicationId, documentType }
    );
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  async getProfile(): Promise<{ id: string; name: string | null; email: string | null; phone: string | null; consumer_source: string; created_at: string }> {
    return apiService.get(API_ENDPOINTS.consumer.profile);
  }

  async updateProfile(data: { name?: string; email?: string; phone?: string }): Promise<{ id: string; name: string | null; email: string | null; phone: string | null }> {
    return apiService.patch(API_ENDPOINTS.consumer.profile, data);
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
    return apiService.get(API_ENDPOINTS.consumer.grievances, params as Record<string, any>);
  }

  async getGrievanceById(id: string): Promise<GrievanceItem> {
    return apiService.get(API_ENDPOINTS.consumer.grievanceById(id));
  }

  async createGrievance(dto: { applicationId: string; subject: string; description: string }): Promise<GrievanceItem> {
    return apiService.post(API_ENDPOINTS.consumer.grievances, dto);
  }

  async addGrievanceComment(grievanceId: string, comment: string): Promise<void> {
    return apiService.post(API_ENDPOINTS.consumer.grievanceComments(grievanceId), { comment });
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────

  async submitFeedback(dto: { applicationId: string; rating: number; comment?: string; tags?: string[] }): Promise<void> {
    return apiService.post(API_ENDPOINTS.consumer.feedback, dto);
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
  created_at: string;
  applicationId?: string;
  trackingNumber?: string;
  comments?: Array<{ id: string; text: string; created_at: string }>;
}

// Export singleton instance
export const consumerService = new ConsumerService();
