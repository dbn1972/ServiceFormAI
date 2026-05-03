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

  /**
   * Get all services for the tenant
   */
  async getServices(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<TenantService>> {
    return apiService.get<PaginatedResponse<TenantService>>(
      API_ENDPOINTS.producer.services,
      pagination
    );
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
  async publishService(id: string): Promise<TenantService> {
    return apiService.post<TenantService>(
      API_ENDPOINTS.producer.publishService(id)
    );
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
      data
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
  }): Promise<any> {
    return apiService.patch(API_ENDPOINTS.producer.tenantSettings, data);
  }
}

// Export singleton instance
export const producerService = new ProducerService();
