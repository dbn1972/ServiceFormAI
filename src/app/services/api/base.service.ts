/**
 * Base API Service
 * Handles common API operations with authentication and error handling
 */

import { API_BASE_URL, getAuthHeaders, getTenantHeaders, REQUEST_TIMEOUT } from '../../shared/config/api.config';
import type { ApiResponse } from '../../shared/types';

export class ApiService {
  private baseUrl: string;
  private isRefreshing = false;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get auth token from localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get tenant ID from localStorage
   */
  private getTenantId(): string | null {
    return localStorage.getItem('tenantId');
  }

  /**
   * Save auth tokens to localStorage
   */
  public saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Clear auth tokens from localStorage
   */
  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
  }

  /**
   * Save user data to localStorage
   */
  public saveUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
    if (user.tenantId) {
      localStorage.setItem('tenantId', user.tenantId);
    }
  }

  /**
   * Get user data from localStorage
   */
  public getUser(): any | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * Returns true if the refresh succeeded and new tokens were saved.
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing) return false;
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    this.isRefreshing = true;
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const payload = await response.json().catch(() => null);
      const tokens = payload?.data?.tokens ?? payload?.tokens;
      if (!tokens?.accessToken) return false;

      this.saveTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuthentication = true,
  ): Promise<T> {
    const token = includeAuthentication ? this.getToken() : null;
    const tenantId = includeAuthentication ? this.getTenantId() : null;

    const headers: HeadersInit = {
      ...getAuthHeaders(token || undefined),
      ...getTenantHeaders(tenantId || undefined),
      ...(options.headers as Record<string, string> | undefined),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response status codes
      if (response.status === 401) {
        if (!includeAuthentication) {
          const body = await response.json().catch(() => null);
          throw new Error((body as any)?.message || 'Authentication failed');
        }
        // Attempt a token refresh, then retry once
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          const newToken = this.getToken();
          const retryHeaders: HeadersInit = {
            ...getAuthHeaders(newToken || undefined),
            ...getTenantHeaders(tenantId || undefined),
            ...(options.headers as Record<string, string> | undefined),
          };
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: retryHeaders,
          });
          if (retryResponse.status === 401) {
            this.clearTokens();
            window.location.href = '/login';
            throw new Error('Session expired — please login again');
          }
          if (!retryResponse.ok) {
            const err = await retryResponse.json().catch(() => null);
            const msg = (err as any)?.error?.message || (err as any)?.message || `Request failed with status ${retryResponse.status}`;
            throw new Error(msg);
          }
          if (retryResponse.status === 204) return {} as T;
          const retryPayload = await retryResponse.json();
          if (retryPayload && typeof retryPayload === 'object' && 'success' in retryPayload) {
            const ar = retryPayload as ApiResponse<T>;
            if (!ar.success) throw new Error(ar.error?.message || ar.message || 'Request failed');
            return (ar.data ?? {}) as T;
          }
          return retryPayload as T;
        }
        // Refresh failed — clear session and redirect
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired — please login again');
      }

      if (response.status === 403) {
        throw new Error('Forbidden - you do not have permission to perform this action');
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        // Support both { error: { message } } and { message } and plain strings
        const message =
          (body as any)?.error?.message ||
          (body as any)?.message ||
          `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const payload = await response.json();

      if (
        payload &&
        typeof payload === 'object' &&
        'success' in payload &&
        typeof payload.success === 'boolean'
      ) {
        const apiResponse = payload as ApiResponse<T>;

        if (!apiResponse.success) {
          throw new Error(apiResponse.error?.message || apiResponse.message || 'Request failed');
        }

        return (apiResponse.data ?? {}) as T;
      }

      return payload as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';

    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, data?: any, extraHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: extraHeaders,
    });
  }

  public async postPublic<T>(
    endpoint: string,
    data?: any,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: extraHeaders,
    }, false);
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  public async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Upload file
   */
  public async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const token = this.getToken();
    const tenantId = this.getTenantId();

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Upload failed',
      }));
      throw new Error(error.message);
    }

    const payload = await response.json();

    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      typeof payload.success === 'boolean'
    ) {
      const apiResponse = payload as ApiResponse<T>;

      if (!apiResponse.success) {
        throw new Error(apiResponse.error?.message || apiResponse.message || 'Upload failed');
      }

      return (apiResponse.data ?? {}) as T;
    }

    return payload as T;
  }
}

// Export singleton instance
export const apiService = new ApiService();
