/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { apiService } from './base.service';
import { API_ENDPOINTS } from '../../shared/config/api.config';
import type {
  LoginDto,
  LoginConsumerDto,
  RegisterTenantDto,
  RegisterConsumerDto,
  RefreshTokenDto,
  AuthTokens,
  LoginResponse,
  IssueCitizenOtpResponse,
  VerifyCitizenOtpDto,
  TenantOnboardingRequest,
  TenantOnboardingResponse,
} from '../../shared/types';

export class AuthService {
  async submitTenantOnboarding(data: TenantOnboardingRequest): Promise<TenantOnboardingResponse> {
    return apiService.postPublic<TenantOnboardingResponse>(
      API_ENDPOINTS.tenant.onboarding,
      data,
    );
  }

  /**
   * Register a new tenant (producer)
   */
  async registerTenant(data: RegisterTenantDto): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      API_ENDPOINTS.auth.registerTenant,
      data
    );

    // Save tokens and user
    apiService.saveTokens(response.tokens.accessToken, response.tokens.refreshToken);
    apiService.saveUser(response.user);

    return response;
  }

  /**
   * Register a new consumer (citizen)
   */
  async registerConsumer(data: RegisterConsumerDto): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      API_ENDPOINTS.auth.registerConsumer,
      data
    );

    // Save tokens and user
    apiService.saveTokens(response.tokens.accessToken, response.tokens.refreshToken);
    apiService.saveUser(response.user);

    return response;
  }

  /**
   * Login as tenant user
   */
  async loginTenant(data: LoginDto): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      API_ENDPOINTS.auth.loginTenant,
      data
    );

    // Save tokens and user
    apiService.saveTokens(response.tokens.accessToken, response.tokens.refreshToken);
    apiService.saveUser(response.user);

    return response;
  }

  /**
   * Login as consumer user
   */
  async loginConsumer(data: LoginConsumerDto): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      API_ENDPOINTS.auth.loginConsumer,
      data
    );

    // Save tokens and user
    apiService.saveTokens(response.tokens.accessToken, response.tokens.refreshToken);
    apiService.saveUser(response.user);

    return response;
  }

  async issueCitizenOtp(mobile: string): Promise<IssueCitizenOtpResponse> {
    return apiService.postPublic<IssueCitizenOtpResponse>(
      API_ENDPOINTS.auth.issueCitizenOtp,
      { mobile },
    );
  }

  async verifyCitizenOtp(data: VerifyCitizenOtpDto): Promise<LoginResponse> {
    const response = await apiService.postPublic<LoginResponse>(
      API_ENDPOINTS.auth.verifyCitizenOtp,
      data,
    );

    apiService.saveTokens(response.tokens.accessToken, response.tokens.refreshToken);
    apiService.saveUser(response.user);
    return response;
  }

  async exchangeKeycloakToken(keycloakAccessToken: string): Promise<LoginResponse> {
    const response = await apiService.postPublic<LoginResponse>(
      API_ENDPOINTS.auth.staffSession,
      {},
      { Authorization: `Bearer ${keycloakAccessToken}` },
    );
    apiService.saveTokens(response.tokens.accessToken, response.tokens.refreshToken);
    apiService.saveUser(response.user);
    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post<{ tokens: AuthTokens }>(
      API_ENDPOINTS.auth.refresh,
      { refreshToken } as RefreshTokenDto
    );

    // Update tokens
    apiService.saveTokens(response.tokens.accessToken, response.tokens.refreshToken);

    return response.tokens;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.auth.logout);
    } finally {
      // Clear tokens regardless of API response
      apiService.clearTokens();
    }
  }

  /**
   * Request a password reset link for the given email
   */
  async forgotPassword(email: string, tenantId?: string): Promise<{ resetToken: string }> {
    const response = await apiService.post<{ resetToken: string }>(
      API_ENDPOINTS.auth.forgotPassword,
      { email, tenantId },
    );
    return response;
  }

  /**
   * Verify a password reset token (from the URL)
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const response = await apiService.get<{ valid: boolean; email?: string }>(
      API_ENDPOINTS.auth.verifyResetToken,
      { token },
    );
    return response;
  }

  /**
   * Reset password using a valid reset token
   */
  async resetPassword(token: string, password: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.auth.resetPassword, { token, password });
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    return apiService.getUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * Get user role
   */
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  /**
   * Check if user is tenant (producer)
   */
  isTenantUser(): boolean {
    const user = this.getCurrentUser();
    return !!user?.tenantId;
  }

  /**
   * Check if user is consumer (citizen)
   */
  isConsumerUser(): boolean {
    const user = this.getCurrentUser();
    return !user?.tenantId;
  }
}

// Export singleton instance
export const authService = new AuthService();
