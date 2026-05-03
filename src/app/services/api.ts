/**
 * API Service Layer
 *
 * This module provides a clean abstraction for all API calls.
 * Currently uses mock data, but structured to easily swap in real backend.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Circuit breaker for fault tolerance
 * - Network status detection
 * - Comprehensive error classification
 */

import { withRetry, withTimeout, CircuitBreaker, handleError, networkStatus } from '../utils/errorHandling';
import toast from '../utils/toast';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';
const USE_MOCK_DATA = !(import.meta as any).env?.VITE_API_URL; // Auto-detect
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

// Circuit breaker for API calls
const apiCircuitBreaker = new CircuitBreaker(5, 60000, 30000);

// Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication token management
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('auth_token', token);
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('auth_token');
}

// Base fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { timeout?: number; skipRetry?: boolean } = {}
): Promise<ApiResponse<T>> {
  if (USE_MOCK_DATA) {
    // Mock delay to simulate network
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockApiCall<T>(endpoint, options);
  }

  // Check network status
  if (!networkStatus.getStatus()) {
    return {
      data: null as any,
      success: false,
      error: 'No internet connection',
    };
  }

  const { timeout = DEFAULT_TIMEOUT_MS, skipRetry = false, ...fetchOptions } = options;

  const fetchFn = async (): Promise<ApiResponse<T>> => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...fetchOptions.headers,
      };

      // Execute with circuit breaker and timeout
      const response = await apiCircuitBreaker.execute(() =>
        withTimeout(
          fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
          }),
          timeout,
          'Request timed out'
        )
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        const error: any = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const data = await response.json();
      return {
        data: data.data || data,
        success: true,
        message: data.message,
      };
    } catch (error: any) {
      // Handle authentication errors
      if (error?.status === 401) {
        clearAuthToken();
        toast.sessionExpired();
      }

      const classified = handleError(error, {
        context: `API ${fetchOptions.method || 'GET'} ${endpoint}`,
        showToast: false, // We'll handle toast in the calling code
      });

      return {
        data: null as any,
        success: false,
        error: classified.userMessage,
        message: classified.userDescription,
      };
    }
  };

  // Apply retry logic for GET requests (idempotent)
  if (!skipRetry && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    return withRetry(fetchFn, {
      maxAttempts: 3,
      onRetry: (_error: unknown, attempt: number) => {
        console.log(`Retrying API call (attempt ${attempt}):`, endpoint);
      },
    });
  }

  return fetchFn();
}

// Mock API implementation (to be replaced with real backend)
async function mockApiCall<T>(endpoint: string, options: RequestInit): Promise<ApiResponse<T>> {
  console.log(`[MOCK API] ${options.method || 'GET'} ${endpoint}`, options.body);

  // Simulate successful responses
  const mockResponses: Record<string, any> = {
    '/service-templates': {
      data: [], // Would return ALL_SERVICE_TEMPLATES
      success: true,
    },
    '/tenant/': {
      data: { id: 'tenant_123', name: 'Test Tenant' },
      success: true,
    },
  };

  // Match endpoint pattern
  for (const [pattern, response] of Object.entries(mockResponses)) {
    if (endpoint.includes(pattern)) {
      return response as ApiResponse<T>;
    }
  }

  // Default successful response
  return {
    data: {} as T,
    success: true,
    message: 'Mock API call successful',
  };
}

// ============================================================================
// API METHODS
// ============================================================================

// Authentication
export const AuthAPI = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => {
    clearAuthToken();
    return Promise.resolve({ data: null, success: true });
  },

  getCurrentUser: () =>
    apiFetch<any>('/auth/me'),
};

// Service Templates
export const TemplatesAPI = {
  getAll: () =>
    apiFetch<any[]>('/service-templates'),

  getById: (id: string) =>
    apiFetch<any>(`/service-templates/${id}`),

  search: (query: string) =>
    apiFetch<any[]>(`/service-templates?search=${encodeURIComponent(query)}`),
};

// Tenant Services
export const ServicesAPI = {
  getAll: (tenantId: string) =>
    apiFetch<any[]>(`/tenant/${tenantId}/services`),

  getById: (tenantId: string, serviceId: string) =>
    apiFetch<any>(`/tenant/${tenantId}/services/${serviceId}`),

  create: (tenantId: string, serviceData: any) =>
    apiFetch<any>(`/tenant/${tenantId}/services`, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    }),

  createFromTemplate: (tenantId: string, templateId: string, customizations?: any) =>
    apiFetch<any>(`/tenant/${tenantId}/service/create-from-template`, {
      method: 'POST',
      body: JSON.stringify({ templateId, customizations }),
    }),

  update: (tenantId: string, serviceId: string, serviceData: any) =>
    apiFetch<any>(`/tenant/${tenantId}/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    }),

  delete: (tenantId: string, serviceId: string) =>
    apiFetch<void>(`/tenant/${tenantId}/services/${serviceId}`, {
      method: 'DELETE',
    }),

  publish: (tenantId: string, serviceId: string) =>
    apiFetch<any>(`/tenant/${tenantId}/services/${serviceId}/publish`, {
      method: 'POST',
    }),

  publishBatch: (tenantId: string, serviceIds: string[]) =>
    apiFetch<any>(`/tenant/${tenantId}/services/publish-batch`, {
      method: 'POST',
      body: JSON.stringify({ serviceIds }),
    }),
};

// Workflow Configuration
export const WorkflowAPI = {
  get: (tenantId: string, serviceId: string) =>
    apiFetch<any>(`/tenant/${tenantId}/services/${serviceId}/workflow`),

  update: (tenantId: string, serviceId: string, workflowData: any) =>
    apiFetch<any>(`/tenant/${tenantId}/services/${serviceId}/workflow`, {
      method: 'PUT',
      body: JSON.stringify(workflowData),
    }),
};

// Analytics
export const AnalyticsAPI = {
  getDashboard: (tenantId: string, timeRange?: string) =>
    apiFetch<any>(`/tenant/${tenantId}/analytics/dashboard?range=${timeRange || '30days'}`),

  getServiceMetrics: (tenantId: string, serviceId: string) =>
    apiFetch<any>(`/tenant/${tenantId}/analytics/services/${serviceId}`),

  getCategoryMetrics: (tenantId: string, category: string) =>
    apiFetch<any>(`/tenant/${tenantId}/analytics/categories/${encodeURIComponent(category)}`),

  exportReport: (tenantId: string, format: 'pdf' | 'csv', filters: any) =>
    apiFetch<Blob>(`/tenant/${tenantId}/analytics/export`, {
      method: 'POST',
      body: JSON.stringify({ format, filters }),
    }),
};

// File Upload
export const FileAPI = {
  upload: async (
    file: File,
    options?: {
      onProgress?: (progress: number) => void;
      maxSizeMB?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    }
  ): Promise<ApiResponse<{ url: string; id: string }>> => {
    const { onProgress, maxSizeMB, allowedTypes, allowedExtensions } = options || {};

    // Import validation function
    const { validateFile } = await import('../utils/errorHandling');

    // Validate file before upload
    const validation = validateFile(file, { maxSizeMB, allowedTypes, allowedExtensions });
    if (!validation.valid) {
      toast.error('Invalid file', { description: validation.error });
      return {
        data: null as any,
        success: false,
        error: validation.error,
      };
    }

    if (USE_MOCK_DATA) {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress?.(i);
      }

      return {
        data: {
          url: URL.createObjectURL(file),
          id: `file_${Date.now()}`,
        },
        success: true,
      };
    }

    // Check network status
    if (!networkStatus.getStatus()) {
      toast.networkError();
      return {
        data: null as any,
        success: false,
        error: 'No internet connection',
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve) => {
      // Progress handler
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      });

      // Success handler
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              data: response.data,
              success: true,
            });
          } catch (error) {
            resolve({
              data: null as any,
              success: false,
              error: 'Invalid response from server',
            });
          }
        } else {
          const errorMessage = xhr.status === 413
            ? 'File too large'
            : xhr.status === 415
            ? 'File type not supported'
            : `Upload failed (${xhr.status})`;

          resolve({
            data: null as any,
            success: false,
            error: errorMessage,
          });
        }
      });

      // Error handler
      xhr.addEventListener('error', () => {
        resolve({
          data: null as any,
          success: false,
          error: 'Network error during upload',
        });
      });

      // Timeout handler
      xhr.addEventListener('timeout', () => {
        resolve({
          data: null as any,
          success: false,
          error: 'Upload timed out',
        });
      });

      // Abort handler
      xhr.addEventListener('abort', () => {
        resolve({
          data: null as any,
          success: false,
          error: 'Upload cancelled',
        });
      });

      xhr.open('POST', `${API_BASE_URL}/files/upload`);
      xhr.timeout = 120000; // 2 minutes for file uploads

      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },
};

// Tenant Onboarding
export const OnboardingAPI = {
  saveProgress: (sessionId: string, step: number, data: any) =>
    apiFetch<void>('/tenant/onboarding/save-progress', {
      method: 'POST',
      body: JSON.stringify({ sessionId, step, data }),
    }),

  complete: (onboardingData: any) =>
    apiFetch<{ tenantId: string; adminToken: string }>('/tenant/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(onboardingData),
    }),
};

// Export all APIs
export const API = {
  Auth: AuthAPI,
  Templates: TemplatesAPI,
  Services: ServicesAPI,
  Workflow: WorkflowAPI,
  Analytics: AnalyticsAPI,
  File: FileAPI,
  Onboarding: OnboardingAPI,
};

export default API;
