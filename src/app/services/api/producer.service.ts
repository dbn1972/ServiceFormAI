/**
 * Producer API Service
 * Handles all producer/tenant admin API calls
 */

import { apiService } from './base.service';
import { API_ENDPOINTS } from '../../shared/config/api.config';
import type {
  TenantService,
  Application,
  CreateServiceDto,
  UpdateServiceDto,
  UpdateApplicationStatusDto,
  PaginatedResponse,
  ApplicationFilters,
  PaginationParams,
  TenantAnalytics,
  ServiceAnalytics,
  TenantUser,
} from '../../shared/types';

export class ProducerService {
  // ============================================================================
  // Service Management
  // ============================================================================

  async getCertifiedServiceTemplates(): Promise<Array<{
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
    formSchema: {
      fields: Array<{
        id: string;
        name: string;
        type: string;
        label: string;
        required?: boolean;
        placeholder?: string;
        helpText?: string;
        options?: Array<{ label: string; value: string }>;
        validation?: Record<string, unknown>;
      }>;
      sections?: Array<{ id: string; title: string; fieldIds: string[] }>;
    };
    requiredDocuments: Array<{
      name: string;
      required: boolean;
      description?: string;
      acceptedSources?: string[];
      digilockerTypes?: string[];
    }>;
    workflowConfig: {
      stages: Array<Record<string, unknown>>;
    };
  }>> {
    return apiService.get(API_ENDPOINTS.producer.serviceTemplates);
  }

  async cloneCertifiedServiceTemplate(templateId: string, data: CreateServiceDto): Promise<TenantService> {
    return apiService.post<TenantService>(
      API_ENDPOINTS.producer.cloneServiceTemplate(templateId),
      data,
    );
  }

  async simulateService(id: string): Promise<{
    serviceId: string;
    passed: boolean;
    checks: Array<{ id: string; passed: boolean; details?: unknown }>;
  }> {
    return apiService.post(API_ENDPOINTS.producer.simulateService(id));
  }

  /**
   * Get all services for the tenant
   */
  async getServices(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<TenantService>> {
    const response = await apiService.get<PaginatedResponse<any>>(
      API_ENDPOINTS.producer.services,
      pagination
    );
    return {
      ...response,
      data: (response.data ?? []).map((service: any) => ({
        ...service,
        tenantId: service.tenantId ?? service.tenant_id,
        serviceScope: service.serviceScope ?? service.service_scope ?? null,
        formSchema: service.formSchema ?? service.form_schema,
        workflowConfig: service.workflowConfig ?? service.workflow_config,
        eligibilityRules: service.eligibilityRules ?? service.eligibility_rules,
        requiredDocuments: service.requiredDocuments ?? service.required_documents,
        isPublished: service.isPublished ?? service.published ?? false,
        slaDays: service.slaDays ?? service.sla_days,
        publishedAt: service.publishedAt ?? service.published_at,
        createdAt: service.createdAt ?? service.created_at,
        updatedAt: service.updatedAt ?? service.updated_at,
      })),
    };
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<TenantService> {
    return apiService.get<TenantService>(
      API_ENDPOINTS.producer.serviceById(id)
    );
  }

  /**
   * Create a new service
   */
  async createService(data: CreateServiceDto): Promise<TenantService> {
    return apiService.post<TenantService>(
      API_ENDPOINTS.producer.services,
      data
    );
  }

  /**
   * Update service
   */
  async updateService(id: string, data: UpdateServiceDto): Promise<TenantService> {
    return apiService.put<TenantService>(
      API_ENDPOINTS.producer.serviceById(id),
      data
    );
  }

  /**
   * Delete service
   */
  async deleteService(id: string): Promise<void> {
    return apiService.delete(API_ENDPOINTS.producer.serviceById(id));
  }

  /**
   * Publish service
   */
  async publishService(id: string): Promise<{
    id: string;
    service_id: string;
    requested_by_id: string;
    status: 'pending';
    publicationStatus: 'pending_approval';
  }> {
    return apiService.post<{
      id: string;
      service_id: string;
      requested_by_id: string;
      status: 'pending';
      publicationStatus: 'pending_approval';
    }>(
      API_ENDPOINTS.producer.publishService(id)
    );
  }

  async getPendingPublicationApprovals(): Promise<Array<{
    id: string;
    tenant_id: string;
    service_id: string;
    requested_by_id: string;
    status: 'pending';
    created_at: string;
    requested_content_hash: string;
    service: {
      name: string;
      category: string;
      description: string;
      form_schema: Record<string, unknown>;
      workflow_config: Record<string, unknown>;
      manifest: Record<string, unknown>;
    } | null;
    simulation: { passed: boolean } | null;
  }>> {
    return apiService.get(API_ENDPOINTS.producer.servicePublicationApprovals);
  }

  async approveServicePublication(id: string): Promise<{
    serviceId: string;
    release_id: string;
    version: number;
    published: true;
  }> {
    return apiService.post(API_ENDPOINTS.producer.approveServicePublication(id));
  }

  async getRedressQueue(): Promise<{
    grievances: Array<Record<string, any>>;
    appeals: Array<Record<string, any>>;
    feedback: Array<Record<string, any>>;
  }> {
    return apiService.get(API_ENDPOINTS.producer.redressQueue);
  }

  async assignGrievance(id: string, staffUserId: string) {
    return apiService.post(API_ENDPOINTS.producer.assignGrievance(id), { staffUserId });
  }

  async resolveGrievance(id: string, resolution: string) {
    return apiService.patch(API_ENDPOINTS.producer.resolveGrievance(id), { resolution });
  }

  async assignAppeal(id: string, staffUserId: string) {
    return apiService.post(API_ENDPOINTS.producer.assignAppeal(id), { staffUserId });
  }

  async decideAppeal(id: string, decision: 'upheld' | 'remanded', reason: string) {
    return apiService.patch(API_ENDPOINTS.producer.decideAppeal(id), { decision, reason });
  }

  async closeCitizenFeedback(id: string, response: string) {
    return apiService.patch(API_ENDPOINTS.producer.closeFeedback(id), { response });
  }

  async assignCitizenFeedback(id: string, staffUserId: string) {
    return apiService.post(API_ENDPOINTS.producer.assignFeedback(id), { staffUserId });
  }

  /**
   * Unpublish service
   */
  async unpublishService(id: string): Promise<TenantService> {
    return apiService.post<TenantService>(
      API_ENDPOINTS.producer.unpublishService(id)
    );
  }

  // ============================================================================
  // Application Management
  // ============================================================================

  /**
   * Get all applications for the tenant
   */
  async getApplications(
    filters?: ApplicationFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Application>> {
    const params = {
      ...filters,
      ...pagination,
    };

    return apiService.get<PaginatedResponse<Application>>(
      API_ENDPOINTS.producer.applications,
      params
    );
  }

  /**
   * Get application by ID
   */
  async getApplicationById(id: string): Promise<Application> {
    return apiService.get<Application>(
      API_ENDPOINTS.producer.applicationById(id)
    );
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    id: string,
    data: UpdateApplicationStatusDto
  ): Promise<Application> {
    return apiService.patch<Application>(
      API_ENDPOINTS.producer.updateApplicationStatus(id),
      {
        ...data,
        status: data.status === 'APPROVED' ? 'approved' : data.status === 'REJECTED' ? 'rejected' : data.status,
      }
    );
  }

  /**
   * Assign application to officer
   */
  async assignApplication(id: string, officerId: string): Promise<Application> {
    return apiService.post<Application>(
      API_ENDPOINTS.producer.assignApplication(id),
      { officerId }
    );
  }

  /**
   * Get applications queue for officer review
   */
  async getApplicationsQueue(
    filters?: ApplicationFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Application>> {
    const params = {
      ...filters,
      ...pagination,
      assignedToMe: true,
    };

    return apiService.get<PaginatedResponse<Application>>(
      API_ENDPOINTS.producer.applications,
      params
    );
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get tenant analytics
   */
  async getTenantAnalytics(
    dateFrom?: string,
    dateTo?: string
  ): Promise<TenantAnalytics> {
    return apiService.get<TenantAnalytics>(
      API_ENDPOINTS.producer.analytics,
      { dateFrom, dateTo }
    );
  }

  /**
   * Get service analytics
   */
  async getServiceAnalytics(
    serviceId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ServiceAnalytics> {
    return apiService.get<ServiceAnalytics>(
      API_ENDPOINTS.producer.serviceAnalytics(serviceId),
      { dateFrom, dateTo }
    );
  }

  // ============================================================================
  // Tenant User Management
  // ============================================================================

  /**
   * Get tenant users
   */
  async getTenantUsers(): Promise<TenantUser[]> {
    return apiService.get<TenantUser[]>(API_ENDPOINTS.producer.tenantUsers);
  }

  /**
   * Create tenant user
   */
  async createTenantUser(data: {
    email: string;
    name: string;
    role: 'ADMIN' | 'OFFICER' | 'VIEWER';
  }): Promise<TenantUser> {
    return apiService.post<TenantUser>(
      API_ENDPOINTS.producer.tenantUsers,
      data
    );
  }

  /**
   * Update tenant user role
   */
  async updateTenantUserRole(
    userId: string,
    role: 'ADMIN' | 'OFFICER' | 'VIEWER'
  ): Promise<TenantUser> {
    return apiService.patch<TenantUser>(
      `${API_ENDPOINTS.producer.tenantUsers}/${userId}`,
      { role }
    );
  }

  /**
   * Delete tenant user
   */
  async deleteTenantUser(userId: string): Promise<void> {
    return apiService.delete(`${API_ENDPOINTS.producer.tenantUsers}/${userId}`);
  }

  // ============================================================================
  // Tenant Settings
  // ============================================================================

  /**
   * Get tenant settings
   */
  async getTenantSettings(): Promise<any> {
    return apiService.get(API_ENDPOINTS.producer.tenantSettings);
  }

  /**
   * Update tenant settings (branding, white-label, etc.)
   */
  async updateTenantSettings(data: {
    name?: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
    governanceScope?: Record<string, any>;
  }): Promise<any> {
    return apiService.patch(API_ENDPOINTS.producer.tenantSettings, data);
  }
}

// Export singleton instance
export const producerService = new ProducerService();
