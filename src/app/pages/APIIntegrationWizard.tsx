/**
 * API Integration Wizard
 * Configure external service APIs with testing and validation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code,
  Settings,
  TestTube,
  Webhook,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
} from 'lucide-react';
import { ServiceFormSchema, APITestResult } from '../types/externalAPI';
import toast from '../utils/toast';
import { validateFile, withTimeout, handleError } from '../utils/errorHandling';

const WIZARD_STEPS = [
  { id: 1, label: 'Import Schema', icon: Upload },
  { id: 2, label: 'Configure API', icon: Settings },
  { id: 3, label: 'Map Fields', icon: Code },
  { id: 4, label: 'Test Integration', icon: TestTube },
  { id: 5, label: 'Webhooks', icon: Webhook },
];

const AUTH_TYPES = [
  { value: 'none', label: 'No Authentication' },
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'basic', label: 'Basic Auth' },
];
void AUTH_TYPES; // available for step 2 config panel
export default function APIIntegrationWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [schema, setSchema] = useState<Partial<ServiceFormSchema>>({
    version: '1.0',
    fields: [],
    documents: [],
    endpoints: {} as any,
  });
  const [testResults, setTestResults] = useState<APITestResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Sample schema for demo
  const sampleSchema: ServiceFormSchema = {
    version: '1.0',
    serviceId: 'ext-passport-001',
    serviceName: 'Passport Application',
    department: 'Ministry of External Affairs',
    metadata: {
      description: 'Apply for new passport or renewal',
      category: 'Identity Documents',
      sla: '30 days',
      fees: 1500,
      targetAudience: 'Indian Citizens',
      helpUrl: 'https://passportindia.gov.in/help',
    },
    fields: [
      {
        id: 'full_name',
        type: 'text',
        label: 'Full Name (as per Aadhaar)',
        required: true,
        digilockerMapping: {
          source: 'aadhaar',
          field: 'name',
          autoFill: true,
        },
        apiMapping: {
          requestField: 'applicant_name',
          transform: 'uppercase',
        },
      },
      {
        id: 'dob',
        type: 'date',
        label: 'Date of Birth',
        required: true,
        digilockerMapping: {
          source: 'aadhaar',
          field: 'dob',
          autoFill: true,
        },
        apiMapping: {
          requestField: 'date_of_birth',
          transform: 'date_format',
        },
      },
      {
        id: 'passport_type',
        type: 'dropdown',
        label: 'Passport Type',
        required: true,
        options: [
          { value: 'ordinary', label: 'Ordinary' },
          { value: 'official', label: 'Official' },
          { value: 'diplomatic', label: 'Diplomatic' },
        ],
        apiMapping: {
          requestField: 'type',
        },
      },
    ],
    documents: [
      {
        id: 'aadhaar',
        name: 'Aadhaar Card',
        description: 'Identity proof',
        required: true,
        format: ['pdf'],
        maxSize: 2,
        digilocker: {
          issuer: 'UIDAI',
          documentType: 'ADHAR',
          autoFetch: true,
        },
        apiMapping: {
          requestField: 'identity_proof',
          encoding: 'base64',
        },
      },
    ],
    eligibility: [
      {
        id: 'age',
        field: 'dob',
        operator: 'less_than',
        value: '18 years ago',
        message: 'Applicant must be 18 years or older',
      },
    ],
    endpoints: {
      submit: {
        method: 'POST',
        url: 'https://api.passportindia.gov.in/v1/applications',
        auth: {
          type: 'oauth2',
          config: {
            oauth: {
              authUrl: 'https://auth.passportindia.gov.in/oauth/authorize',
              tokenUrl: 'https://auth.passportindia.gov.in/oauth/token',
              clientId: 'YOUR_CLIENT_ID',
              clientSecret: 'YOUR_CLIENT_SECRET',
              scopes: ['application.submit', 'application.read'],
            },
          },
        },
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': '1.0',
        },
        requestMapping: {
          bodyTemplate: 'json',
          fieldMappings: {
            full_name: 'applicant_name',
            dob: 'date_of_birth',
            passport_type: 'type',
          },
        },
        responseMapping: {
          successField: 'status',
          successValue: 'success',
          errorField: 'error.message',
          dataField: 'data',
          fieldMappings: {
            application_id: 'id',
            reference_number: 'reference',
          },
        },
        retry: {
          maxAttempts: 3,
          backoffMs: 1000,
          retryOn: [500, 502, 503, 504],
        },
        timeout: 30000,
      },
      status: {
        method: 'GET',
        url: 'https://api.passportindia.gov.in/v1/applications/{id}/status',
        auth: {
          type: 'oauth2',
          config: {
            oauth: {
              authUrl: 'https://auth.passportindia.gov.in/oauth/authorize',
              tokenUrl: 'https://auth.passportindia.gov.in/oauth/token',
              clientId: 'YOUR_CLIENT_ID',
              clientSecret: 'YOUR_CLIENT_SECRET',
              scopes: ['application.read'],
            },
          },
        },
        headers: {
          'Content-Type': 'application/json',
        },
        responseMapping: {
          successField: 'status',
          successValue: 'success',
          dataField: 'data',
          fieldMappings: {
            status: 'application_status',
            updated_at: 'last_updated',
          },
        },
        timeout: 10000,
      },
    },
  };

  const loadSampleSchema = () => {
    setSchema(sampleSchema);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['application/json', 'text/plain'],
      allowedExtensions: ['json'],
    });

    if (!validation.valid) {
      toast.error('Invalid file', { description: validation.error });
      event.target.value = ''; // Reset file input
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);

        // Validate schema structure
        if (!json.version || !json.serviceId || !json.fields) {
          throw new Error('Invalid schema format: missing required fields (version, serviceId, fields)');
        }

        if (json.version !== '1.0') {
          toast.warning('Schema version mismatch', {
            description: `Expected version 1.0, got ${json.version}. The schema may not work correctly.`,
          });
        }

        setSchema(json);
        toast.success('Schema imported successfully', {
          description: `Loaded ${json.serviceName || 'service'} configuration`,
        });
      } catch (error: any) {
        toast.error('Failed to import schema', {
          description: error.message || 'The file contains invalid JSON or schema format',
        });
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file', {
        description: 'An error occurred while reading the file',
      });
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleTestAPI = async () => {
    if (!schema || !schema.endpoints?.submit) {
      toast.error('No API configured', {
        description: 'Please configure the submit endpoint first',
      });
      return;
    }

    setTesting(true);
    const startTime = Date.now();
    const testData: Record<string, unknown> = {};

    try {
      const endpoint = schema.endpoints.submit;
      // testData already declared above

      // Generate test data from schema fields
      schema.fields?.forEach(field => {
        if (field.type === 'text') testData[field.id] = 'TEST_VALUE';
        if (field.type === 'email') testData[field.id] = 'test@example.com';
        if (field.type === 'phone') testData[field.id] = '+91 1234567890';
        if (field.type === 'date') testData[field.id] = '2026-04-30';
        if (field.type === 'number') testData[field.id] = 123;
        if (field.type === 'dropdown') testData[field.id] = (field.validation as any)?.options?.[0] ?? '';
      });

      // For production, make actual API call
      const USE_MOCK = true; // Set to false when ready for real API testing

      if (USE_MOCK) {
        // Simulate API test with realistic delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const mockResult: APITestResult = {
          success: true,
          statusCode: 200,
          responseTime: Date.now() - startTime,
          request: {
            method: endpoint.method,
            url: endpoint.url,
            headers: {
              'Content-Type': 'application/json',
              ...(endpoint.auth?.type === 'bearer' ? { Authorization: 'Bearer ***' } : {}),
            },
            body: testData,
          },
          response: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              status: 'success',
              data: {
                application_id: 'APP-2026-001234',
                reference_number: 'REF-XYZ-789',
                submitted_at: new Date().toISOString(),
              },
            },
          },
          timestamp: new Date().toISOString(),
        };

        setTestResults(mockResult);
        toast.success('API test successful', {
          description: `Response time: ${mockResult.responseTime}ms`,
        });
      } else {
        // Real API call
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...endpoint.headers,
        };

        // Add authentication
        if (endpoint.auth?.type === 'bearer' && endpoint.auth.config?.token) {
          headers['Authorization'] = `Bearer ${endpoint.auth.config.token}`;
        } else if (endpoint.auth?.type === 'api_key' && endpoint.auth.config?.apiKey && endpoint.auth.config?.headerName) {
          headers[endpoint.auth.config.headerName] = endpoint.auth.config.apiKey;
        }

        const response = await withTimeout(
          fetch(endpoint.url, {
            method: endpoint.method,
            headers,
            body: JSON.stringify(testData),
          }),
          endpoint.timeout || 30000,
          'API request timed out'
        );

        const responseBody = await response.json().catch(() => null);
        const responseTime = Date.now() - startTime;

        const result: APITestResult = {
          success: response.ok,
          statusCode: response.status,
          responseTime,
          request: {
            method: endpoint.method,
            url: endpoint.url,
            headers: { ...headers, ...(headers['Authorization'] ? { Authorization: '***' } : {}) },
            body: testData,
          },
          response: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody,
          },
          timestamp: new Date().toISOString(),
        };

        setTestResults(result);

        if (result.success) {
          toast.success('API test successful', {
            description: `Response time: ${responseTime}ms`,
          });
        } else {
          toast.error('API test failed', {
            description: `HTTP ${response.status}: ${response.statusText}`,
          });
        }
      }
    } catch (error: any) {
      const errorResult: APITestResult = {
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        request: {
          method: schema.endpoints.submit.method,
          url: schema.endpoints.submit.url,
          headers: {},
          body: testData,
        },
        response: {
          status: 0,
          headers: {},
          body: null,
        },
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error',
      };

      setTestResults(errorResult);
      handleError(error, {
        context: 'API Integration Test',
        showToast: true,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(schema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.serviceId || 'service'}-schema.json`;
    a.click();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return schema.serviceId && schema.serviceName;
      case 2:
        return schema.endpoints?.submit?.url;
      case 3:
        return schema.fields && schema.fields.length > 0;
      case 4:
        return testResults?.success;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/tenant/dashboard')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">API Integration Wizard</h1>
              <p className="text-sm text-muted-foreground">
                Connect external government service APIs
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : isCompleted
                        ? 'border-success bg-success/5'
                        : 'border-border bg-muted'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.label}</p>
                    </div>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-6xl mx-auto">
        {/* Step 1: Import Schema */}
        {currentStep === 1 && (
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4">Import Service Schema</h2>
            <p className="text-muted-foreground mb-6">
              Import a JSON schema that defines the external service's form fields, API endpoints, and validation rules.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Upload JSON */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Upload JSON Schema</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import from ServiceFormAI standard JSON
                </p>
                <label className="px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer inline-block hover:bg-primary/90">
                  Choose File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Load Sample */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Load Sample Schema</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start with a pre-built example (Passport)
                </p>
                <button
                  onClick={loadSampleSchema}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Load Sample
                </button>
              </div>
            </div>

            {/* Schema Preview */}
            {schema.serviceId && (
              <div className="bg-muted rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Schema Preview</h3>
                  <button
                    onClick={handleExportJSON}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Service ID</p>
                    <p className="font-medium">{schema.serviceId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Service Name</p>
                    <p className="font-medium">{schema.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{schema.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fields</p>
                    <p className="font-medium">{schema.fields?.length || 0} fields</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Configure API */}
        {currentStep === 2 && schema.endpoints?.submit && (
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4">Configure API Endpoints</h2>
            <p className="text-muted-foreground mb-6">
              Review and configure the external API endpoints for submission, status tracking, and downloads.
            </p>

            {/* Submit Endpoint */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Submit Endpoint</h3>
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-success text-success-foreground rounded text-xs font-medium">
                    {schema.endpoints.submit.method}
                  </span>
                  <code className="flex-1 text-sm">{schema.endpoints.submit.url}</code>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Authentication</p>
                    <p className="font-medium">{schema.endpoints.submit.auth.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Timeout</p>
                    <p className="font-medium">{schema.endpoints.submit.timeout}ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Endpoint */}
            {schema.endpoints.status && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Status Endpoint</h3>
                <div className="bg-muted rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-info text-info-foreground rounded text-xs font-medium">
                      {schema.endpoints.status.method}
                    </span>
                    <code className="flex-1 text-sm">{schema.endpoints.status.url}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Map Fields */}
        {currentStep === 3 && (
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4">Field Mapping</h2>
            <p className="text-muted-foreground mb-6">
              Map form fields to external API request/response fields.
            </p>

            <div className="space-y-4">
              {schema.fields?.map((field) => (
                <div key={field.id} className="bg-muted rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Form Field</p>
                      <p className="font-medium">{field.label}</p>
                      <p className="text-xs text-muted-foreground">({field.type})</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">API Field</p>
                      <p className="font-medium font-mono text-sm">
                        {field.apiMapping?.requestField || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Transform</p>
                      <p className="font-medium text-sm">
                        {field.apiMapping?.transform || 'None'}
                      </p>
                    </div>
                  </div>
                  {field.digilockerMapping && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-success">
                        ✓ DigiLocker: Auto-fill from {field.digilockerMapping.source}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Test Integration */}
        {currentStep === 4 && (
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4">Test API Integration</h2>
            <p className="text-muted-foreground mb-6">
              Test the API connection with sample data before going live.
            </p>

            <button
              onClick={handleTestAPI}
              disabled={testing}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 mb-6 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Test
                </>
              )}
            </button>

            {testResults && (
              <div className="space-y-4">
                {/* Test Result Summary */}
                <div
                  className={`rounded-xl p-4 flex items-start gap-4 ${
                    testResults.success
                      ? 'bg-success/10 border border-success/30'
                      : 'bg-destructive/10 border border-destructive/30'
                  }`}
                >
                  {testResults.success ? (
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {testResults.success ? 'Test Passed ✓' : 'Test Failed ✗'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Status: {testResults.statusCode} | Response Time: {testResults.responseTime}ms
                    </p>
                  </div>
                </div>

                {/* Request/Response Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-xl p-4">
                    <h4 className="font-semibold mb-2 text-sm">Request</h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(testResults.request, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-muted rounded-xl p-4">
                    <h4 className="font-semibold mb-2 text-sm">Response</h4>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(testResults.response?.body, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Webhooks */}
        {currentStep === 5 && (
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4">Configure Webhooks (Optional)</h2>
            <p className="text-muted-foreground mb-6">
              Set up webhooks to notify external systems about application status changes.
            </p>

            <div className="bg-muted rounded-xl p-6 text-center">
              <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Webhook Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure callback URLs for real-time notifications
              </p>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Add Webhook
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          {currentStep < WIZARD_STEPS.length ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/tenant/dashboard')}
              className="px-6 py-3 bg-success text-success-foreground rounded-lg font-semibold hover:bg-success/90 transition-colors flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Activate Integration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
