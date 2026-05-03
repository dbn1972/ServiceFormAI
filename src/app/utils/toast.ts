/**
 * Toast notification utilities
 * Wraps sonner toast with app-specific defaults and types
 */

import { toast as sonnerToast, ExternalToast } from 'sonner';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
void (null as unknown as ToastType); // type is exported for consumers

interface ToastOptions extends ExternalToast {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show success toast
 */
export function success(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, {
    duration: options?.duration || 4000,
    ...options,
  });
}

/**
 * Show error toast
 */
export function error(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, {
    duration: options?.duration || 6000,
    ...options,
  });
}

/**
 * Show warning toast
 */
export function warning(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, {
    duration: options?.duration || 5000,
    ...options,
  });
}

/**
 * Show info toast
 */
export function info(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, {
    duration: options?.duration || 4000,
    ...options,
  });
}

/**
 * Show loading toast (returns ID to dismiss later)
 */
export function loading(message: string, options?: ToastOptions) {
  return sonnerToast.loading(message, {
    duration: Infinity, // Don't auto-dismiss loading toasts
    ...options,
  });
}

/**
 * Dismiss a toast by ID
 */
export function dismiss(toastId?: string | number) {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAll() {
  sonnerToast.dismiss();
}

/**
 * Promise-based toast (shows loading, then success/error)
 */
export function promise<T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  return sonnerToast.promise(promise, options);
}

/**
 * App-specific toast helpers
 */
export const toast = {
  success,
  error,
  warning,
  info,
  loading,
  dismiss,
  dismissAll,
  promise,

  // Common app scenarios
  saved: () => success('Changes saved successfully'),
  deleted: () => success('Deleted successfully'),
  published: () => success('Published successfully', { duration: 5000 }),
  copied: () => success('Copied to clipboard'),

  apiError: (error: any) => {
    const message = error?.message || error?.error || 'An error occurred';
    return toast.error(message, {
      description: 'Please try again or contact support if the problem persists',
    });
  },

  networkError: () => {
    return error('Network error', {
      description: 'Please check your internet connection and try again',
      duration: 6000,
    });
  },

  validationError: (message: string) => {
    return error(message, {
      description: 'Please fix the errors and try again',
    });
  },

  sessionExpired: () => {
    return warning('Session expired', {
      description: 'Please log in again to continue',
      duration: 8000,
      action: {
        label: 'Log in',
        onClick: () => window.location.href = '/login',
      },
    });
  },
};

export default toast;
