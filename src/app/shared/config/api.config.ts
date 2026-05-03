/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

// Backend API base URL - change this to your deployed backend URL
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api/v1';

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    registerTenant: '/auth/register/tenant',
    registerConsumer: '/auth/register/consumer',
    loginTenant: '/auth/login/tenant',
    loginConsumer: '/auth/login/consumer',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    verifyResetToken: '/auth/reset-password/verify',
    resetPassword: '/auth/reset-password',
  },

  // Consumer APIs
  consumer: {
    services: '/consumer/services',
    serviceById: (id: string) => `/consumer/services/${id}`,
    submitApplication: '/consumer/applications',
    myApplications: '/consumer/my-applications',
    applicationById: (id: string) => `/consumer/applications/${id}`,
    applicationTracking: (trackingNumber: string) => `/consumer/applications/track/${trackingNumber}`,
    updateDraft: (id: string) => `/consumer/applications/${id}`,
    // Profile
    profile: '/consumer/profile',
    // Notifications
    notifications: '/consumer/notifications',
    markNotificationRead: (id: string) => `/consumer/notifications/${id}/read`,
    markAllNotificationsRead: '/consumer/notifications/read-all',
    // Grievances
    grievances: '/consumer/grievances',
    grievanceById: (id: string) => `/consumer/grievances/${id}`,
    grievanceComments: (id: string) => `/consumer/grievances/${id}/comments`,
    // Feedback
    feedback: '/consumer/feedback',
  },

  // Producer APIs
  producer: {
    // Services
    services: '/producer/services',
    serviceById: (id: string) => `/producer/services/${id}`,
    publishService: (id: string) => `/producer/services/${id}/publish`,
    unpublishService: (id: string) => `/producer/services/${id}/unpublish`,
    
    // Applications
    applications: '/producer/applications',
    applicationById: (id: string) => `/producer/applications/${id}`,
    updateApplicationStatus: (id: string) => `/producer/applications/${id}/status`,
    assignApplication: (id: string) => `/producer/applications/${id}/assign`,
    
    // Analytics
    analytics: '/producer/analytics',
    serviceAnalytics: (id: string) => `/producer/analytics/services/${id}`,
    
    // Tenant Management
    tenantUsers: '/producer/users',
    tenantSettings: '/producer/settings',
  },

  // Audit
  audit: {
    logs: '/audit/logs',
  },

  // Admin scalability controls
  admin: {
    scalabilitySummary: '/admin/scalability/summary',
    scalabilityConfig: '/admin/scalability/config',
    scalabilityViolations: '/admin/scalability/violations',
    scalabilityExport: '/admin/scalability/export',
    pauseQueue: '/admin/scalability/queue/pause',
    resumeQueue: '/admin/scalability/queue/resume',
    retryFailedQueue: '/admin/scalability/queue/retry-failed',
  },

  // Health & Enterprise Readiness
  health: {
    health: '/health',
    ready: '/ready',
    live: '/live',
    metrics: '/metrics',
    readinessScore: '/readiness-score',
  },

  // File Upload
  upload: {
    document: '/upload/document',
    image: '/upload/image',
  },
} as const;

// HTTP headers configuration
export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Multi-tenant headers
export const getTenantHeaders = (tenantId?: string): Record<string, string> => {
  if (!tenantId) return {};
  
  return {
    'X-Tenant-Id': tenantId,
  };
};
