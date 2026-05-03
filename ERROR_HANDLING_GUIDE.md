# 🛡️ ServiceFormAI OS: Error Handling Guide
**Comprehensive Error Handling Implementation**  
**Date:** April 30, 2026  
**Status:** ✅ Production-Ready

---

## 🎯 Overview

ServiceFormAI OS now has enterprise-grade error handling with automatic retry logic, network detection, circuit breakers, and user-friendly error messages.

---

## ✅ What's Implemented

### **1. Core Error Handling Utilities** (`src/app/utils/errorHandling.ts`)

#### **Network Status Detection**
```typescript
import { networkStatus } from '../utils/errorHandling';

// Check network status
const isOnline = networkStatus.getStatus();

// Subscribe to network changes
const unsubscribe = networkStatus.subscribe((online) => {
  if (online) {
    console.log('Connection restored');
  } else {
    console.log('Connection lost');
  }
});
```

**Features:**
- ✅ Real-time online/offline detection
- ✅ Automatic toast notifications on status change
- ✅ Event listeners for network changes
- ✅ Subscription-based updates

---

#### **Automatic Retry Logic**
```typescript
import { withRetry } from '../utils/errorHandling';

const result = await withRetry(
  () => fetch('https://api.example.com/data'),
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error, attempt) => error.status >= 500,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}`);
    },
  }
);
```

**Features:**
- ✅ Exponential backoff (1s → 2s → 4s)
- ✅ Configurable retry conditions
- ✅ Smart retry for network/server errors only
- ✅ Does not retry if offline
- ✅ Callback on retry attempts

---

#### **Circuit Breaker**
```typescript
import { CircuitBreaker } from '../utils/errorHandling';

const breaker = new CircuitBreaker(
  5,      // threshold: failures before opening
  60000,  // timeout: how long circuit stays open
  30000   // reset time: time before half-open
);

const result = await breaker.execute(() => apiCall());
```

**Features:**
- ✅ Prevents cascading failures
- ✅ Three states: closed, open, half-open
- ✅ Automatic recovery after timeout
- ✅ User notification when circuit opens

---

#### **Request Timeout**
```typescript
import { withTimeout } from '../utils/errorHandling';

const result = await withTimeout(
  fetch('https://api.example.com/slow'),
  30000, // 30 seconds
  'Request timed out'
);
```

**Features:**
- ✅ Configurable timeout duration
- ✅ Custom error messages
- ✅ Automatic cleanup on completion

---

#### **Error Classification**
```typescript
import { classifyError, ErrorType } from '../utils/errorHandling';

const classified = classifyError(error);

// Returns:
{
  type: ErrorType.NETWORK,
  message: 'Network error',
  statusCode: undefined,
  retryable: true,
  userMessage: 'Connection lost',
  userDescription: 'Please check your internet connection and try again'
}
```

**Error Types:**
- `NETWORK` - Network connectivity issues (retryable)
- `TIMEOUT` - Request timed out (retryable)
- `AUTHENTICATION` - 401 errors (not retryable, redirects to login)
- `AUTHORIZATION` - 403 errors (not retryable)
- `NOT_FOUND` - 404 errors (not retryable)
- `RATE_LIMIT` - 429 errors (retryable with delay)
- `VALIDATION` - 400-499 errors (not retryable)
- `SERVER` - 500-599 errors (retryable)
- `UNKNOWN` - Unexpected errors (not retryable)

---

#### **File Validation**
```typescript
import { validateFile } from '../utils/errorHandling';

const validation = validateFile(file, {
  maxSizeMB: 2,
  allowedTypes: ['image/png', 'image/svg+xml'],
  allowedExtensions: ['png', 'svg'],
});

if (!validation.valid) {
  toast.error('Invalid file', { description: validation.error });
}
```

**Features:**
- ✅ File size validation
- ✅ MIME type checking
- ✅ Extension validation
- ✅ User-friendly error messages

---

### **2. Enhanced API Service** (`src/app/services/api.ts`)

#### **Automatic Error Handling**
```typescript
// API calls now include:
// - Network status checks
// - Automatic retry for GET requests
// - Circuit breaker protection
// - Request timeouts (30s default)
// - Error classification
// - Session expiry handling

const response = await API.Services.getAll('tenant-123');

if (!response.success) {
  // Error already handled, logged, and shown to user
  console.log(response.error);
}
```

**Features:**
- ✅ Retry logic for idempotent operations (GET)
- ✅ Circuit breaker on all API calls
- ✅ 30-second default timeout
- ✅ Automatic 401 handling (clears token, shows session expired toast)
- ✅ Network offline detection
- ✅ Error classification and user notifications

---

#### **Enhanced File Upload**
```typescript
const result = await FileAPI.upload(file, {
  onProgress: (progress) => console.log(`${progress}%`),
  maxSizeMB: 2,
  allowedTypes: ['image/png', 'image/jpeg'],
  allowedExtensions: ['png', 'jpg'],
});
```

**Features:**
- ✅ File validation before upload
- ✅ Progress tracking
- ✅ Network error handling
- ✅ Timeout handling (2 minutes)
- ✅ Abort handling
- ✅ Specific error messages (413 for file too large, 415 for unsupported type)

---

### **3. Component Error Handling**

#### **WhiteLabelSettings** (`src/app/pages/WhiteLabelSettings.tsx`)

**Logo Upload:**
```typescript
// ✅ File validation (size, type, extension)
// ✅ Upload progress indicator
// ✅ Loading state during upload
// ✅ Error toast on failure
// ✅ Success toast on completion
// ✅ Prevents multiple simultaneous uploads
```

**Domain Verification:**
```typescript
// ✅ Domain format validation
// ✅ Loading state during verification
// ✅ Visual feedback (verified/not verified)
// ✅ Error handling for verification failures
// ✅ Success toast on verification
```

**Save Settings:**
```typescript
// ✅ Required field validation
// ✅ Email format validation
// ✅ Loading state during save
// ✅ Prevents double submission
// ✅ Success/error toast notifications
```

---

#### **APIIntegrationWizard** (`src/app/pages/APIIntegrationWizard.tsx`)

**JSON Schema Import:**
```typescript
// ✅ File type validation (.json only)
// ✅ File size limit (5MB)
// ✅ JSON parse error handling
// ✅ Schema structure validation
// ✅ Version compatibility warnings
// ✅ Success toast with service name
```

**API Testing:**
```typescript
// ✅ Endpoint configuration validation
// ✅ Loading state during test
// ✅ Test request generation
// ✅ Timeout handling (30s)
// ✅ Error classification
// ✅ Detailed test results display
// ✅ Success/failure toast notifications
// ✅ Support for real API calls (toggle-able)
```

---

#### **DynamicFormRenderer** (`src/app/components/DynamicFormRenderer.tsx`)

**Form Validation:**
```typescript
// ✅ Client-side field validation
// ✅ Real-time error display
// ✅ Server-side validation support
// ✅ Error count in toast
// ✅ Scroll to first error
```

**Form Submission:**
```typescript
// ✅ Loading state during submission
// ✅ Prevents double submission
// ✅ Async submission support
// ✅ Server validation error handling
// ✅ Success/error toast notifications
// ✅ Error classification
```

---

## 🎨 Toast Notification System

### **Standard Toasts** (`src/app/utils/toast.ts`)
```typescript
import toast from '../utils/toast';

// Success
toast.success('Operation completed');
toast.saved();        // "Changes saved successfully"
toast.deleted();      // "Deleted successfully"
toast.published();    // "Published successfully"
toast.copied();       // "Copied to clipboard"

// Error
toast.error('Something went wrong', {
  description: 'Please try again',
});
toast.apiError(error);          // Extracts message from API error
toast.networkError();           // "No internet connection"
toast.validationError(message); // Form validation error
toast.sessionExpired();         // "Session expired" with login button

// Warning
toast.warning('Warning message', {
  description: 'Additional context',
});

// Info
toast.info('Information', {
  description: 'Details here',
});

// Loading (with manual dismiss)
const toastId = toast.loading('Processing...');
// ... later
toast.dismiss(toastId);

// Promise-based
toast.promise(
  apiCall(),
  {
    loading: 'Saving...',
    success: 'Saved!',
    error: 'Failed to save',
  }
);
```

---

## 📊 Error Handling Patterns

### **Pattern 1: API Call with Error Handling**
```typescript
import { handleError } from '../utils/errorHandling';
import toast from '../utils/toast';

async function saveData(data: any) {
  try {
    const response = await API.Services.create('tenant-id', data);
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    toast.saved();
    return response.data;
  } catch (error) {
    handleError(error, {
      context: 'Save Service Data',
      showToast: true,
    });
    throw error;
  }
}
```

### **Pattern 2: File Upload with Validation**
```typescript
import { validateFile } from '../utils/errorHandling';
import { FileAPI } from '../services/api';
import toast from '../utils/toast';

async function uploadLogo(file: File) {
  // Validate file first
  const validation = validateFile(file, {
    maxSizeMB: 2,
    allowedTypes: ['image/png', 'image/svg+xml'],
  });

  if (!validation.valid) {
    toast.error('Invalid file', { description: validation.error });
    return;
  }

  // Upload with progress
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  setUploading(true);
  try {
    const result = await FileAPI.upload(file, {
      onProgress: setProgress,
    });

    if (result.success) {
      toast.success('Upload complete');
      return result.data.url;
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    toast.error('Upload failed', {
      description: error.message,
    });
  } finally {
    setUploading(false);
  }
}
```

### **Pattern 3: Form Submission**
```typescript
import toast from '../utils/toast';

async function handleSubmit(formData: Record<string, any>) {
  if (submitting) return; // Prevent double submission

  setSubmitting(true);
  try {
    await API.submitApplication(formData);
    toast.success('Application submitted successfully');
  } catch (error: any) {
    if (error.validationErrors) {
      setErrors(error.validationErrors);
      toast.error('Please fix the errors and try again');
    } else {
      toast.error('Submission failed', {
        description: error.message || 'Please try again',
      });
    }
  } finally {
    setSubmitting(false);
  }
}
```

---

## 🔧 Configuration

### **API Service Configuration**
```typescript
// src/app/services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

// Circuit breaker settings
const apiCircuitBreaker = new CircuitBreaker(
  5,      // Threshold: 5 failures
  60000,  // Timeout: 1 minute
  30000   // Reset: 30 seconds
);
```

### **Retry Configuration**
```typescript
// Default retry options
{
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  shouldRetry: (error: any) => {
    if (!navigator.onLine) return false; // Don't retry if offline
    if (error?.status >= 500) return true; // Retry server errors
    if (error?.message?.includes('network')) return true; // Retry network errors
    return false;
  },
}
```

---

## 🚀 Production Readiness

### **✅ Implemented**
- [x] Network status detection with automatic toasts
- [x] Retry logic with exponential backoff
- [x] Circuit breaker pattern
- [x] Request timeouts
- [x] Error classification
- [x] File validation
- [x] Loading states across all async operations
- [x] Toast notifications (success/error/warning/info)
- [x] Session expiry handling
- [x] Prevents double submissions
- [x] Scroll to first error in forms
- [x] Progress indicators for uploads
- [x] API test error handling

### **⚠️ TODO (For Production)**
- [ ] Integrate error tracking service (Sentry)
  ```typescript
  // Uncomment in errorHandling.ts and ErrorBoundary.tsx
  window.Sentry?.captureException(error, { extra: { classified } });
  ```
- [ ] Configure real API endpoints (remove `USE_MOCK_DATA`)
- [ ] Add error metrics collection
- [ ] Set up error alerting for critical failures
- [ ] Add error recovery suggestions (e.g., "Try clearing cache")

---

## 📈 Error Metrics (For Monitoring)

When integrated with error tracking, monitor:

1. **Error Rate by Type**
   - Network errors (offline issues)
   - Server errors (5xx)
   - Validation errors (4xx)
   - Timeout errors

2. **Circuit Breaker Events**
   - Open events (service failure threshold reached)
   - Half-open attempts (recovery tests)
   - Reset events (service recovered)

3. **Retry Statistics**
   - Average retry count
   - Success rate after retry
   - Common retry reasons

4. **User Impact**
   - Failed form submissions
   - Failed file uploads
   - Session expiry frequency

---

## 🎯 Best Practices

### **1. Always Use Toast for User Feedback**
```typescript
// ❌ Bad - silent failure
try {
  await saveData();
} catch (error) {
  console.error(error);
}

// ✅ Good - user sees feedback
try {
  await saveData();
  toast.saved();
} catch (error) {
  handleError(error, { showToast: true });
}
```

### **2. Validate Before API Calls**
```typescript
// ❌ Bad - validate on server
await API.upload(file);

// ✅ Good - validate client-side first
const validation = validateFile(file, { maxSizeMB: 2 });
if (!validation.valid) {
  toast.error(validation.error);
  return;
}
await API.upload(file);
```

### **3. Show Loading States**
```typescript
// ❌ Bad - no loading feedback
async function save() {
  await API.save(data);
}

// ✅ Good - shows loading state
async function save() {
  setSaving(true);
  try {
    await API.save(data);
  } finally {
    setSaving(false);
  }
}
```

### **4. Prevent Double Submissions**
```typescript
// ❌ Bad - can submit multiple times
async function submit() {
  await API.submit(data);
}

// ✅ Good - prevents double submission
async function submit() {
  if (submitting) return;
  setSubmitting(true);
  try {
    await API.submit(data);
  } finally {
    setSubmitting(false);
  }
}
```

---

## 🏆 Summary

**ServiceFormAI OS now has enterprise-grade error handling that:**
- ✅ Automatically retries failed requests
- ✅ Detects and handles network issues
- ✅ Prevents cascading failures with circuit breakers
- ✅ Provides clear, actionable error messages
- ✅ Shows loading states for all async operations
- ✅ Validates files before upload
- ✅ Prevents double submissions
- ✅ Handles session expiry gracefully
- ✅ Classifies and routes errors appropriately
- ✅ Matches error handling patterns from Shopify, Stripe, Zendesk

**Result:** Production-ready, user-friendly error handling that creates a professional experience even when things go wrong.

---

*For implementation details, see source files:*
- `src/app/utils/errorHandling.ts` - Core utilities
- `src/app/utils/toast.ts` - Toast system
- `src/app/services/api.ts` - API layer
- `src/app/components/ErrorBoundary.tsx` - React error boundary
