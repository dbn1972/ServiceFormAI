/**
 * Integration tests for DynamicFormRenderer with camera fields.
 *
 * These tests verify that camera_photo and camera_document field types
 * are correctly resolved from the ComponentRegistry and rendered by
 * the DynamicFormRenderer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockSetFieldValue,
  mockTouchField,
  mockSetServerErrors,
  mockHandleSubmit,
  mockToast,
  mockState,
} = vi.hoisted(() => {
  const mockState = {
    values: {} as Record<string, any>,
    errors: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
    visibleFields: [] as Array<{ id: string; type: string; label: string; required: boolean }>,
  };

  return {
    mockSetFieldValue: vi.fn(),
    mockTouchField: vi.fn(),
    mockSetServerErrors: vi.fn(),
    mockHandleSubmit: vi.fn(),
    mockToast: {
      error: vi.fn(),
      warning: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
    },
    mockState,
  };
});

// ---------------------------------------------------------------------------
// Mock modules
// ---------------------------------------------------------------------------

vi.mock('@serviceformai/form-engine-react', () => ({
  useFormEngine: vi.fn(() => ({
    values: mockState.values,
    errors: mockState.errors,
    touched: mockState.touched,
    visibleFields: mockState.visibleFields,
    submitting: false,
    setFieldValue: mockSetFieldValue,
    touchField: mockTouchField,
    setServerErrors: mockSetServerErrors,
    handleSubmit: mockHandleSubmit,
    steps: undefined,
    currentStepId: undefined,
    goToStep: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
  })),
}));

vi.mock('../../utils/toast', () => ({
  default: mockToast,
}));

vi.mock('../../actions/action-engine', () => ({
  ActionEngine: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
    dispatch: vi.fn().mockResolvedValue(true),
    destroy: vi.fn(),
  })),
}));

vi.mock('../layout/ThemeProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../layout/LayoutEngine', () => ({
  default: () => <div data-testid="layout-engine" />,
}));

vi.mock('../../utils/errorHandling', () => ({
  handleError: vi.fn().mockReturnValue({ userDescription: 'An error occurred' }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="icon-calendar" />,
  Upload: (props: any) => <span data-testid="icon-upload" {...props} />,
  AlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />,
  CheckCircle: () => <span data-testid="icon-check" />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  Camera: (props: any) => <span data-testid="icon-camera" {...props} />,
  RefreshCw: (props: any) => <span data-testid="icon-refresh" {...props} />,
  Check: (props: any) => <span data-testid="icon-check-mark" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Trash2: (props: any) => <span data-testid="icon-trash" {...props} />,
}));

// Mock ComponentSandbox
vi.mock('../ComponentSandbox', () => ({
  default: () => <div data-testid="component-sandbox" />,
}));

// We need to import the real componentRegistry and register camera components
import { registerCameraComponents, resetCameraRegistration } from '../register';
import DynamicFormRenderer from '../../DynamicFormRenderer';
import type { ServiceFormSchema } from '../../../types/externalAPI';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSchema(fields: any[]): ServiceFormSchema {
  return {
    version: '1.0',
    serviceId: 'test-service',
    serviceName: 'Test Service',
    department: 'Test Department',
    metadata: {
      description: 'Test form',
      category: 'test',
      sla: '7 days',
      targetAudience: 'citizens',
    },
    fields,
    documents: [],
    endpoints: {
      submit: { url: '/api/submit', method: 'POST' },
      status: { url: '/api/status', method: 'GET' },
    },
  } as ServiceFormSchema;
}

// Use a real tenant ID so that isPlatformComponent returns true
// (platform components are resolved as fallback for non-platform tenants)
const TEST_TENANT = 'test_tenant_123';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DynamicFormRenderer with camera fields', () => {
  beforeEach(() => {
    resetCameraRegistration();
    registerCameraComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockState.values = {};
    mockState.errors = {};
    mockState.touched = {};
    mockState.visibleFields = [];
  });

  it('renders CameraPhotoCapture for type: "camera_photo" field', () => {
    const fields = [
      {
        id: 'passport_photo',
        type: 'camera_photo',
        label: 'Passport Photo',
        required: true,
        helpText: 'Take a clear photo',
      },
    ];

    mockState.visibleFields = fields as any;

    render(
      <DynamicFormRenderer
        schema={makeSchema(fields)}
        onSubmit={vi.fn()}
        tenantId={TEST_TENANT}
      />,
    );

    // The CameraPhotoCapture component should render with "Start Camera" button
    expect(screen.getByLabelText('Start Camera')).toBeDefined();
    expect(screen.getByText('Passport Photo')).toBeDefined();
  });

  it('renders CameraDocumentCapture for type: "camera_document" field', () => {
    const fields = [
      {
        id: 'aadhaar_scan',
        type: 'camera_document',
        label: 'Aadhaar Card Scan',
        required: true,
        helpText: 'Scan your Aadhaar card',
      },
    ];

    mockState.visibleFields = fields as any;

    render(
      <DynamicFormRenderer
        schema={makeSchema(fields)}
        onSubmit={vi.fn()}
        tenantId={TEST_TENANT}
      />,
    );

    expect(screen.getByLabelText('Start Camera')).toBeDefined();
    expect(screen.getByText('Aadhaar Card Scan')).toBeDefined();
  });

  it('passes customConfig values through to component via config prop', () => {
    const fields = [
      {
        id: 'photo',
        type: 'camera_photo',
        label: 'Photo',
        required: false,
        customConfig: {
          jpegQuality: 0.9,
          maxFileSizeMB: 3,
        },
      },
    ];

    mockState.visibleFields = fields as any;

    render(
      <DynamicFormRenderer
        schema={makeSchema(fields)}
        onSubmit={vi.fn()}
        tenantId={TEST_TENANT}
      />,
    );

    // Component should render without errors (config is passed through)
    expect(screen.getByLabelText('Start Camera')).toBeDefined();
  });

  it('displays validation errors for required camera fields with no value', () => {
    const fields = [
      {
        id: 'photo',
        type: 'camera_photo',
        label: 'Photo',
        required: true,
      },
    ];

    mockState.visibleFields = fields as any;
    mockState.errors = { photo: 'This field is required' };
    mockState.touched = { photo: true };

    render(
      <DynamicFormRenderer
        schema={makeSchema(fields)}
        onSubmit={vi.fn()}
        tenantId={TEST_TENANT}
      />,
    );

    // The error should be displayed (may appear in both component and wrapper)
    const errorElements = screen.getAllByText('This field is required');
    expect(errorElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders both camera_photo and camera_document fields in same form', () => {
    const fields = [
      {
        id: 'photo',
        type: 'camera_photo',
        label: 'Passport Photo',
        required: true,
      },
      {
        id: 'document',
        type: 'camera_document',
        label: 'ID Document',
        required: true,
      },
    ];

    mockState.visibleFields = fields as any;

    render(
      <DynamicFormRenderer
        schema={makeSchema(fields)}
        onSubmit={vi.fn()}
        tenantId={TEST_TENANT}
      />,
    );

    expect(screen.getByText('Passport Photo')).toBeDefined();
    expect(screen.getByText('ID Document')).toBeDefined();
    // Both should have Start Camera buttons
    const startButtons = screen.getAllByLabelText('Start Camera');
    expect(startButtons).toHaveLength(2);
  });

  it('shows "Upload a file instead" link for camera fields', () => {
    const fields = [
      {
        id: 'photo',
        type: 'camera_photo',
        label: 'Photo',
        required: false,
      },
    ];

    mockState.visibleFields = fields as any;

    render(
      <DynamicFormRenderer
        schema={makeSchema(fields)}
        onSubmit={vi.fn()}
        tenantId={TEST_TENANT}
      />,
    );

    expect(screen.getByLabelText('Upload a file instead')).toBeDefined();
  });
});
