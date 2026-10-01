import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { SSOProvider } from '../services/sso';
import { authService, apiService } from '../services/api/index';
import { clearPendingOnboardingIdentity } from '../utils/onboarding';

// Types
export interface User {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  mobile: string;
  role: 'citizen' | 'officer' | 'admin' | 'reviewer' | 'approver';
  avatar?: string;
  aadhaar?: string;
}

export interface Application {
  id: string;
  serviceType: string;
  status: 'draft' | 'submitted' | 'under-review' | 'deficiency' | 'approved' | 'rejected';
  submittedDate: string;
  lastUpdated: string;
  officerAssigned?: string;
  documents: any[];
  formData: any;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface AppContextType {
  // User state
  user: User | null;
  login: (email: string, password: string, method: 'email' | 'mobile') => Promise<User | null>;
  loginWithOtp: (challengeId: string, mobile: string, code: string) => Promise<User | null>;
  loginWithKeycloak: (accessToken: string) => Promise<User | null>;
  loginWithSSO: (provider: SSOProvider, profile: any) => Promise<User | null>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  
  // Applications state
  applications: Application[];
  addApplication: (app: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
  
  // Notifications state
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // DigiLocker documents
  digiLockerDocuments: any[];
  addDigiLockerDocument: (doc: any) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const normalizeUser = (storedUser: any): User | null => {
  if (!storedUser || typeof storedUser !== 'object') {
    return null;
  }

  const name =
    storedUser.name ||
    [storedUser.firstName, storedUser.lastName].filter(Boolean).join(' ').trim() ||
    'Citizen User';

  return {
    id: storedUser.id || 'unknown',
    tenantId: typeof storedUser.tenantId === 'string' ? storedUser.tenantId : undefined,
    name,
    email: storedUser.email || '',
    mobile: storedUser.mobile || storedUser.phone || '',
    role: !storedUser.tenantId
      ? 'citizen'
      : storedUser.role === 'admin' || storedUser.role === 'platform_admin'
        ? 'admin'
        : storedUser.role === 'reviewer'
          ? 'reviewer'
          : storedUser.role === 'approver'
            ? 'approver'
            : 'officer',
    avatar: storedUser.avatar,
    aadhaar: storedUser.aadhaar,
  };
};

export function AppProvider({ children }: { children: ReactNode }) {
  // Load from localStorage
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem('applications');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [digiLockerDocuments, setDigiLockerDocuments] = useState<any[]>(() => {
    const saved = localStorage.getItem('digiLockerDocuments');
    return saved ? JSON.parse(saved) : [];
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('digiLockerDocuments', JSON.stringify(digiLockerDocuments));
  }, [digiLockerDocuments]);

  // User functions
  const login = async (email: string, password: string, method: 'email' | 'mobile'): Promise<User | null> => {
    try {
      const response = await authService.loginConsumer({
        identifier: email,
        password,
        method,
      });

      const normalizedUser = normalizeUser(response.user);

      if (!normalizedUser) {
        return null;
      }

      setUser(normalizedUser);

      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: `Logged in successfully as ${normalizedUser.name}`,
        timestamp: new Date().toISOString(),
        read: false
      });

      return normalizedUser;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const loginWithOtp = async (challengeId: string, mobile: string, code: string): Promise<User | null> => {
    const response = await authService.verifyCitizenOtp({ challengeId, mobile, code });
    const normalizedUser = normalizeUser(response.user);
    if (!normalizedUser) {
      return null;
    }
    setUser(normalizedUser);
    return normalizedUser;
  };

  const loginWithKeycloak = async (accessToken: string): Promise<User | null> => {
    const response = await authService.exchangeKeycloakToken(accessToken);
    const normalizedUser = normalizeUser(response.user);
    if (!normalizedUser) {
      return null;
    }
    setUser(normalizedUser);
    return normalizedUser;
  };

  const loginWithSSO = async (provider: SSOProvider, profile: any): Promise<User | null> => {
    // Simulate API call to backend to create/update user with SSO profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Store access token securely
    if (profile.accessToken) {
      sessionStorage.setItem(`${provider}_access_token`, profile.accessToken);
    }
    if (profile.refreshToken) {
      sessionStorage.setItem(`${provider}_refresh_token`, profile.refreshToken);
    }

    // Create user object from SSO profile
    const ssoUser: User = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      mobile: profile.mobile || '',
      role: 'citizen',
      avatar: profile.picture,
      aadhaar: profile.aadhaar, // Only for DigiLocker
    };

    setUser(ssoUser);

    // Add welcome notification
    addNotification({
      type: 'success',
      title: 'Welcome!',
      message: `Logged in successfully with ${getProviderDisplayName(provider)}`,
      timestamp: new Date().toISOString(),
      read: false
    });

    return ssoUser;
  };

  const logout = () => {
    setUser(null);
    void authService.logout().catch(() => undefined);
    apiService.clearTokens();
    clearPendingOnboardingIdentity();
    localStorage.removeItem('lastLoginIdentifier');
    localStorage.removeItem('lastLoginName');
    localStorage.removeItem('applications');
    localStorage.removeItem('notifications');
    localStorage.removeItem('digiLockerDocuments');
    sessionStorage.clear(); // Clear SSO tokens
    setApplications([]);
    setNotifications([]);
    setDigiLockerDocuments([]);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      apiService.saveUser(updatedUser);
    }
  };

  // Application functions
  const addApplication = (app: Application) => {
    setApplications(prev => [...prev, app]);
    addNotification({
      type: 'success',
      title: 'Application Submitted',
      message: `Application ${app.id} for ${app.serviceType} has been submitted successfully.`,
      timestamp: new Date().toISOString(),
      read: false,
      link: `/applications/${app.id}`
    });
  };

  const updateApplication = (id: string, updates: Partial<Application>) => {
    setApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, ...updates } : app))
    );
  };

  const deleteApplication = (id: string) => {
    setApplications(prev => prev.filter(app => app.id !== id));
  };

  // Notification functions
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // DigiLocker functions
  const addDigiLockerDocument = (doc: any) => {
    setDigiLockerDocuments(prev => [...prev, doc]);
  };

  // Helper function to get provider display name
  const getProviderDisplayName = (provider: SSOProvider): string => {
    const names: Record<SSOProvider, string> = {
      google: 'Google',
      microsoft: 'Microsoft',
      digilocker: 'DigiLocker',
      aadhaar: 'Aadhaar',
    };
    return names[provider];
  };

  const value: AppContextType = {
    user,
    login,
    loginWithOtp,
    loginWithKeycloak,
    loginWithSSO,
    logout,
    updateUser,
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    notifications,
    addNotification,
    markNotificationRead,
    clearAllNotifications,
    sidebarOpen,
    setSidebarOpen,
    digiLockerDocuments,
    addDigiLockerDocument
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
