/**
 * Error Handling Utilities
 * Comprehensive error handling, retry logic, and network detection
 */

import toast from './toast';

// ============================================================================
// NETWORK STATUS DETECTION
// ============================================================================

export class NetworkStatusDetector {
  private listeners: Set<(online: boolean) => void> = new Set();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners();
    toast.success('Connection restored', {
      description: 'You are back online',
    });
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners();
    toast.error('No internet connection', {
      description: 'Please check your network connection',
      duration: 10000,
    });
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public subscribe(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public cleanup() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

export const networkStatus = new NetworkStatusDetector();

// ============================================================================
// RETRY LOGIC
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  shouldRetry: (error: any) => {
    // Retry on network errors and 5xx server errors
    if (!navigator.onLine) return false; // Don't retry if offline
    if (error?.status >= 500 && error?.status < 600) return true;
    if (error?.message?.includes('network') || error?.message?.includes('timeout')) return true;
    return false;
  },
  onRetry: () => {},
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error, attempt)) {
        throw error;
      }

      // Notify about retry
      opts.onRetry(error, attempt);

      // Wait before retrying
      await sleep(delay);

      // Exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    timeout: number = 60000, // 1 minute - reserved for future use
    private resetTime: number = 30000 // 30 seconds
  ) {
    void timeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTime) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - service temporarily unavailable');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      toast.error('Service temporarily unavailable', {
        description: 'We are experiencing technical difficulties. Please try again later.',
        duration: 10000,
      });
    }
  }

  private reset() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  getState() {
    return this.state;
  }
}

// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  originalError: any;
  statusCode?: number;
  retryable: boolean;
  userMessage: string;
  userDescription?: string;
}

export function classifyError(error: any): ClassifiedError {
  // Network errors
  if (!navigator.onLine || error?.message?.includes('network')) {
    return {
      type: ErrorType.NETWORK,
      message: error?.message || 'Network error',
      originalError: error,
      retryable: true,
      userMessage: 'Connection lost',
      userDescription: 'Please check your internet connection and try again',
    };
  }

  // Timeout errors
  if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
    return {
      type: ErrorType.TIMEOUT,
      message: error.message,
      originalError: error,
      retryable: true,
      userMessage: 'Request timed out',
      userDescription: 'The operation took too long. Please try again.',
    };
  }

  // HTTP errors
  const statusCode = error?.status || error?.statusCode;

  if (statusCode === 401) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: 'Authentication required',
      originalError: error,
      statusCode,
      retryable: false,
      userMessage: 'Session expired',
      userDescription: 'Please log in again to continue',
    };
  }

  if (statusCode === 403) {
    return {
      type: ErrorType.AUTHORIZATION,
      message: 'Access denied',
      originalError: error,
      statusCode,
      retryable: false,
      userMessage: 'Access denied',
      userDescription: 'You do not have permission to perform this action',
    };
  }

  if (statusCode === 404) {
    return {
      type: ErrorType.NOT_FOUND,
      message: 'Resource not found',
      originalError: error,
      statusCode,
      retryable: false,
      userMessage: 'Not found',
      userDescription: 'The requested resource could not be found',
    };
  }

  if (statusCode === 429) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: 'Rate limit exceeded',
      originalError: error,
      statusCode,
      retryable: true,
      userMessage: 'Too many requests',
      userDescription: 'Please wait a moment before trying again',
    };
  }

  if (statusCode >= 400 && statusCode < 500) {
    return {
      type: ErrorType.VALIDATION,
      message: error?.message || 'Validation error',
      originalError: error,
      statusCode,
      retryable: false,
      userMessage: 'Invalid request',
      userDescription: error?.message || 'Please check your input and try again',
    };
  }

  if (statusCode >= 500) {
    return {
      type: ErrorType.SERVER,
      message: 'Server error',
      originalError: error,
      statusCode,
      retryable: true,
      userMessage: 'Server error',
      userDescription: 'We are experiencing technical difficulties. Please try again later.',
    };
  }

  // Validation errors
  if (error?.name === 'ValidationError' || error?.type === 'validation') {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      originalError: error,
      retryable: false,
      userMessage: 'Validation failed',
      userDescription: error.message,
    };
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN,
    message: error?.message || 'An error occurred',
    originalError: error,
    retryable: false,
    userMessage: 'Something went wrong',
    userDescription: 'An unexpected error occurred. Please try again or contact support.',
  };
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

export function handleError(error: any, options?: { showToast?: boolean; context?: string }) {
  const classified = classifyError(error);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error Handler] ${options?.context || 'Unknown context'}:`, classified);
  }

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // window.Sentry?.captureException(classified.originalError, {
    //   tags: { type: classified.type, context: options?.context },
    //   extra: { classified },
    // });
  }

  // Show toast notification
  if (options?.showToast !== false) {
    if (classified.type === ErrorType.AUTHENTICATION) {
      toast.sessionExpired();
    } else if (classified.type === ErrorType.NETWORK) {
      toast.networkError();
    } else {
      toast.error(classified.userMessage, {
        description: classified.userDescription,
      });
    }
  }

  return classified;
}

// ============================================================================
// ASYNC ERROR WRAPPER
// ============================================================================

export function asyncErrorWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, { context });
      throw error;
    }
  }) as T;
}

// ============================================================================
// FILE UPLOAD ERROR HANDLING
// ============================================================================

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidationResult {
  const { maxSizeMB = 10, allowedTypes, allowedExtensions } = options;

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  if (allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ".${extension}" is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}
