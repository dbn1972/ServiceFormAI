/**
 * useAuth Hook
 * Provides authentication state and methods
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/api/index';
import type { TenantUser, ConsumerUser } from '../types';

export function useAuth() {
  const [user, setUser] = useState<TenantUser | ConsumerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(authService.isAuthenticated());
    setLoading(false);
  }, []);

  // Login
  const login = useCallback(async (
    email: string,
    password: string,
    userType: 'tenant' | 'consumer'
  ) => {
    try {
      const response = userType === 'tenant'
        ? await authService.loginTenant({ email, password })
        : await authService.loginConsumer({
            identifier: email,
            password,
            method: email.includes('@') ? 'email' : 'mobile',
          });

      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Register tenant
  const registerTenant = useCallback(async (data: any) => {
    const response = await authService.registerTenant(data);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  }, []);

  // Register consumer
  const registerConsumer = useCallback(async (data: any) => {
    const response = await authService.registerConsumer(data);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  }, []);

  // Check user role
  const hasRole = useCallback((role: string) => {
    if (!user || !('role' in user)) return false;
    return (user as TenantUser).role === role;
  }, [user]);

  // Check if user is tenant
  const isTenant = useCallback(() => {
    return authService.isTenantUser();
  }, []);

  // Check if user is consumer
  const isConsumer = useCallback(() => {
    return authService.isConsumerUser();
  }, []);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    registerTenant,
    registerConsumer,
    hasRole,
    isTenant,
    isConsumer,
  };
}
