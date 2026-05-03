import { AlertCircle, AlertTriangle, XCircle, WifiOff, FileX, Lock, Clock, Info, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';

export default function ErrorMessagesLibrary() {
  const errorCategories = [
    {
      name: 'Form Validation Errors',
      errors: [
        {
          type: 'Required Field',
          icon: AlertCircle,
          color: 'destructive',
          message: 'This field is required',
          example: 'Please enter your full name',
          recovery: 'Fill in the required information',
        },
        {
          type: 'Invalid Format',
          icon: AlertCircle,
          color: 'destructive',
          message: 'Invalid {field} format',
          example: 'Please enter a valid 10-digit mobile number',
          recovery: 'Correct the format (show example)',
        },
        {
          type: 'Out of Range',
          icon: AlertTriangle,
          color: 'warning',
          message: '{field} must be between {min} and {max}',
          example: 'Age must be between 18 and 65 for this service',
          recovery: 'Enter a value within the allowed range',
        },
        {
          type: 'Already Exists',
          icon: Info,
          color: 'info',
          message: 'This {field} is already registered',
          example: 'An account with this email already exists. Try logging in instead.',
          recovery: 'Use different value or recover existing account',
        },
      ],
    },
    {
      name: 'Network & Connection Errors',
      errors: [
        {
          type: 'No Internet',
          icon: WifiOff,
          color: 'warning',
          message: 'No internet connection',
          example: "You're offline. Changes will be saved locally and synced when you're back online.",
          recovery: 'Check connection, enable offline mode',
        },
        {
          type: 'Request Timeout',
          icon: Clock,
          color: 'warning',
          message: 'Request timed out',
          example: 'The server is taking too long to respond. This might be due to slow connectivity.',
          recovery: 'Retry, check connection speed',
        },
        {
          type: 'Server Error',
          icon: XCircle,
          color: 'destructive',
          message: 'Something went wrong on our end',
          example: "We're experiencing technical difficulties. Your data has been saved and we'll retry automatically.",
          recovery: 'Retry after a moment, contact support if persists',
        },
      ],
    },
    {
      name: 'Authentication & Authorization',
      errors: [
        {
          type: 'Unauthorized',
          icon: Lock,
          color: 'destructive',
          message: 'You don\'t have permission to access this',
          example: 'This page is only available to government officers. Please log in with your official account.',
          recovery: 'Login with appropriate credentials',
        },
        {
          type: 'Session Expired',
          icon: Clock,
          color: 'warning',
          message: 'Your session has expired',
          example: "For your security, you've been logged out after 30 minutes of inactivity. Please log in again.",
          recovery: 'Re-authenticate, session preserved on login',
        },
        {
          type: 'Invalid Credentials',
          icon: AlertCircle,
          color: 'destructive',
          message: 'Incorrect email or password',
          example: "The credentials you entered don't match our records. Please try again.",
          recovery: 'Try again, reset password, check caps lock',
        },
      ],
    },
    {
      name: 'Document & File Errors',
      errors: [
        {
          type: 'File Too Large',
          icon: FileX,
          color: 'warning',
          message: 'File size exceeds limit',
          example: 'The file must be smaller than 5MB. Your file is 8.2MB.',
          recovery: 'Compress file, upload smaller version',
        },
        {
          type: 'Unsupported Format',
          icon: FileX,
          color: 'destructive',
          message: 'File type not supported',
          example: 'Please upload a PDF, JPG, or PNG file. .docx files are not accepted.',
          recovery: 'Convert to supported format',
        },
        {
          type: 'Virus Detected',
          icon: AlertTriangle,
          color: 'destructive',
          message: 'Security threat detected',
          example: 'This file failed our security scan and cannot be uploaded. Please scan your device for malware.',
          recovery: 'Scan file locally, upload from different source',
        },
      ],
    },
    {
      name: 'Application Processing Errors',
      errors: [
        {
          type: 'Eligibility Failed',
          icon: XCircle,
          color: 'destructive',
          message: 'You are not eligible for this service',
          example: "Based on your age (17), you don't meet the minimum requirement (18 years) for this scholarship.",
          recovery: 'Review requirements, explore alternatives',
        },
        {
          type: 'Missing Documents',
          icon: AlertTriangle,
          color: 'warning',
          message: 'Required documents missing',
          example: 'You need to upload an Income Certificate to proceed. You can get it from DigiLocker or upload manually.',
          recovery: 'Upload missing documents, link DigiLocker',
        },
        {
          type: 'Duplicate Application',
          icon: Info,
          color: 'info',
          message: 'You already have an active application',
          example: 'You submitted an application for this service on April 15, 2026 (APP-2026-8472). Track its status instead.',
          recovery: 'View existing application, withdraw to reapply',
        },
      ],
    },
  ];

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Error Messages Library</h1>
          <p className="text-muted-foreground">Comprehensive catalog of error states with recovery guidance</p>
        </div>

        {/* Writing Guidelines */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Error Message Principles</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">1. Be Human</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Write like you're talking to a person, not a machine. Avoid technical jargon.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-destructive/10 rounded">
                  <p className="text-destructive mb-1">✗ Bad:</p>
                  <p className="text-muted-foreground">Error 422: Unprocessable Entity</p>
                </div>
                <div className="p-2 bg-success/10 rounded">
                  <p className="text-success mb-1">✓ Good:</p>
                  <p className="text-muted-foreground">Please check your input and try again</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">2. Explain Why</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Tell users what went wrong and why, not just that something failed.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-destructive/10 rounded">
                  <p className="text-destructive mb-1">✗ Bad:</p>
                  <p className="text-muted-foreground">Upload failed</p>
                </div>
                <div className="p-2 bg-success/10 rounded">
                  <p className="text-success mb-1">✓ Good:</p>
                  <p className="text-muted-foreground">Upload failed: file is too large (max 5MB)</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">3. Show the Way</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Always provide clear next steps or recovery actions.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-destructive/10 rounded">
                  <p className="text-destructive mb-1">✗ Bad:</p>
                  <p className="text-muted-foreground">Invalid format</p>
                </div>
                <div className="p-2 bg-success/10 rounded">
                  <p className="text-success mb-1">✓ Good:</p>
                  <p className="text-muted-foreground">Enter mobile number as 10 digits (9876543210)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Categories */}
        {errorCategories.map((category, catIndex) => (
          <div key={catIndex} className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">{category.name}</h2>

            <div className="space-y-4">
              {category.errors.map((error, index) => {
                const Icon = error.icon;
                return (
                  <div key={index} className={`border-2 border-${error.color}/30 bg-${error.color}/5 rounded-xl p-6`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 bg-${error.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 text-${error.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{error.type}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          <strong>Pattern:</strong> {error.message}
                        </p>
                        <div className={`p-4 bg-${error.color}/10 border border-${error.color}/20 rounded-lg mb-3`}>
                          <p className="text-sm">{error.example}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowLeft className="w-4 h-4" />
                          <span className="font-medium">Recovery:</span>
                          <span className="text-muted-foreground">{error.recovery}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Error Component Examples */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Error Component Patterns</h2>

          <div className="space-y-6">
            {/* Inline Error */}
            <div>
              <h3 className="font-semibold mb-4">Inline Field Error</h3>
              <div className="max-w-md">
                <label className="block text-sm font-medium mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value="123"
                  className="w-full px-4 py-3 bg-input-background border-2 border-destructive rounded-lg"
                />
                <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Please enter a valid 10-digit mobile number
                </p>
              </div>
            </div>

            {/* Banner Error */}
            <div>
              <h3 className="font-semibold mb-4">Banner Error (Page-Level)</h3>
              <div className="border-2 border-destructive/30 bg-destructive/5 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Application Submission Failed</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      We couldn't submit your application due to a server error. Your progress has been saved as a draft.
                    </p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90">
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Try Again
                      </button>
                      <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80">
                        <HelpCircle className="w-4 h-4 inline mr-2" />
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State with Error Context */}
            <div>
              <h3 className="font-semibold mb-4">Empty State (No Results)</h3>
              <div className="border border-border rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileX className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-semibold mb-2">No Applications Found</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  You haven't applied for any services yet. Explore the catalog to find services you're eligible for.
                </p>
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
                  Browse Services
                </button>
              </div>
            </div>

            {/* Toast Notification Error */}
            <div>
              <h3 className="font-semibold mb-4">Toast Notification</h3>
              <div className="max-w-md bg-destructive text-destructive-foreground rounded-lg shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Document upload failed</p>
                    <p className="text-xs opacity-90 mt-1">File size exceeds 5MB limit</p>
                  </div>
                  <button className="text-destructive-foreground hover:opacity-80">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Severity Levels */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Error Severity Levels</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-info/30 bg-info/5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-info" />
                <h3 className="font-semibold">Info</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Informational messages that don't block progress
              </p>
              <p className="text-xs text-muted-foreground">
                Examples: Already exists, duplicate, optional suggestion
              </p>
            </div>

            <div className="p-4 border-2 border-warning/30 bg-warning/5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h3 className="font-semibold">Warning</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Issues that should be addressed but don't block
              </p>
              <p className="text-xs text-muted-foreground">
                Examples: Offline mode, missing optional field, slow connection
              </p>
            </div>

            <div className="p-4 border-2 border-destructive/30 bg-destructive/5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold">Error</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Critical issues that block user progress
              </p>
              <p className="text-xs text-muted-foreground">
                Examples: Required field empty, invalid format, server error
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
