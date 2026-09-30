import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ActionDefinition } from '@serviceformai/validation-engine';

// ---------------------------------------------------------------------------
// Hoisted variables for use inside vi.mock factories
// ---------------------------------------------------------------------------

const {
  mockSetFieldValue,
  mockTouchField,
  mockSetServerErrors,
  mockHandleSubmit,
  mockToast,
  MockActionEngine,
  mockState,
} = vi.hoisted(() => {
  const mockState = {
    values: {} as Record<string, any>,
    errors: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
    visibleFields: [] as Array<{ id: string }>,
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
    MockActionEngine: vi.fn(),
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

let mockActionEngineInstance: {
  init: ReturnType<typeof vi.fn>;
  dispatch: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

MockActionEngine.mockImplementation(() => {
  mockActionEngineInstance = {
    init: vi.fn(),
    dispatch: vi.fn().mockResolvedValue(true),
    destroy: vi.fn(),
  };
  return mockActionEngineInstance;
});

vi.mock('../actions/action-engine', () => ({
  ActionEngine: MockActionEngine,
}));

vi.mock('../utils/toast', () => ({
  default: mockToast,
}));

vi.mock('../services/componentRegistry', () => ({
  componentRegistry: {
    getComponent: vi.fn().mockReturnValue(null),
    isPlatformComponent: vi.fn().mockReturnValue(false),
  },
  PLATFORM_TENANT: '__platform__',
}));

vi.mock('./ComponentSandbox', () => ({
  default: () => <div data-testid="component-sandbox" />,
}));

vi.mock('./layout/ThemeProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./layout/LayoutEngine', () => ({
  default: () => <div data-testid="layout-engine" />,
}));

vi.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="icon-calendar" />,
  Upload: () => <span data-testid="icon-upload" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

vi.mock('../utils/errorHandling', () => ({
  handleError: vi.fn().mockReturnValue({ userDescription: 'An error occurred' }),
}));

// Now import the component under test
import DynamicFormRenderer from './DynamicFormRenderer';
import type { ServiceFormSchema } from '../types/externalAPI';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSchema(overrides?: Partial<ServiceFormSchema>): ServiceFormSchema {
  return {
    version: '1.0',
    serviceName: 'Test Service',
    department: 'Test Department',
    metadata: {
      description: 'Test form',
      sla: '7 days',
    },
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your name',
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: false,
        placeholder: 'Enter email',
      },
    ],
    ...overrides,
  } as ServiceFormSchema;
}

function makeAction(overrides?: Partial<ActionDefinition>): ActionDefinition {
  return {
    id: 'action-1',
    event: 'onFieldChange',
    targetId: 'name',
    code: 'setFieldValue("email", "auto@test.com")',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DynamicFormRenderer — Action Engine Integration', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockState.values = {};
    mockState.errors = {};
    mockState.touched = {};
    mockState.visibleFields = [{ id: 'name' }, { id: 'email' }];

    // Reset the ActionEngine mock implementation
    MockActionEngine.mockImplementation(() => {
      mockActionEngineInstance = {
        init: vi.fn(),
        dispatch: vi.fn().mockResolvedValue(true),
        destroy: vi.fn(),
      };
      return mockActionEngineInstance;
    });

    // Ensure Worker is defined
    if (typeof globalThis.Worker === 'undefined') {
      (globalThis as any).Worker = class MockWorker {};
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Action Engine Initialisation ──────────────────────────────────────

  describe('Action Engine initialisation', () => {
    it('creates and initialises ActionEngine when schema has actions', () => {
      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
          tenantId="tenant-1"
          serviceId="service-1"
          fetchAllowlist={['api.example.gov.in']}
        />,
      );

      expect(MockActionEngine).toHaveBeenCalledWith(
        actions,
        expect.objectContaining({
          tenantId: 'tenant-1',
          serviceId: 'service-1',
          fetchAllowlist: ['api.example.gov.in'],
        }),
      );

      expect(mockActionEngineInstance.init).toHaveBeenCalled();
    });

    it('dispatches onFormLoad after initialisation', () => {
      const actions = [makeAction({ event: 'onFormLoad', targetId: undefined })];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      expect(mockActionEngineInstance.dispatch).toHaveBeenCalledWith(
        'onFormLoad',
        expect.objectContaining({ formValues: expect.any(Object) }),
      );
    });

    it('does not create ActionEngine when no actions are provided', () => {
      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
        />,
      );

      expect(MockActionEngine).not.toHaveBeenCalled();
    });

    it('does not create ActionEngine when actions array is empty', () => {
      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={[]}
        />,
      );

      expect(MockActionEngine).not.toHaveBeenCalled();
    });
  });

  // ── Event Hooks ───────────────────────────────────────────────────────

  describe('event hooks', () => {
    it('dispatches onFieldChange when a field value changes', async () => {
      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter your name');

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'John' } });
      });

      expect(mockActionEngineInstance.dispatch).toHaveBeenCalledWith(
        'onFieldChange',
        expect.objectContaining({
          fieldId: 'name',
          value: 'John',
        }),
      );
    });

    it('dispatches onFieldBlur when a field loses focus', async () => {
      const actions = [makeAction({ event: 'onFieldBlur' })];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter your name');

      await act(async () => {
        fireEvent.blur(nameInput);
      });

      expect(mockActionEngineInstance.dispatch).toHaveBeenCalledWith(
        'onFieldBlur',
        expect.objectContaining({
          fieldId: 'name',
        }),
      );
    });

    it('passes previousValue in onFieldChange dispatch', async () => {
      mockState.values = { name: 'OldValue' };
      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter your name');

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'NewValue' } });
      });

      expect(mockActionEngineInstance.dispatch).toHaveBeenCalledWith(
        'onFieldChange',
        expect.objectContaining({
          fieldId: 'name',
          value: 'NewValue',
          previousValue: 'OldValue',
        }),
      );
    });
  });

  // ── onFormSubmit ──────────────────────────────────────────────────────

  describe('onFormSubmit', () => {
    it('dispatches onFormSubmit actions during form submission after validation passes', async () => {
      const actions = [makeAction({ event: 'onFormSubmit', targetId: undefined })];

      mockHandleSubmit.mockImplementation(async (cb: (data: any) => Promise<void>) => {
        await cb({ name: 'John' });
      });

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      const dispatchCalls = mockActionEngineInstance.dispatch.mock.calls;
      const submitCall = dispatchCalls.find(
        (call: any[]) => call[0] === 'onFormSubmit',
      );
      expect(submitCall).toBeDefined();
    });

    it('blocks submission when action dispatch returns false', async () => {
      const actions = [makeAction({ event: 'onFormSubmit', targetId: undefined })];

      MockActionEngine.mockImplementation(() => {
        mockActionEngineInstance = {
          init: vi.fn(),
          dispatch: vi.fn().mockImplementation(async (event: string) => {
            if (event === 'onFormSubmit') return false;
            return true;
          }),
          destroy: vi.fn(),
        };
        return mockActionEngineInstance;
      });

      mockHandleSubmit.mockImplementation(async (cb: (data: any) => Promise<void>) => {
        await cb({ name: 'John' });
      });

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('skips actions when validation fails', async () => {
      const actions = [makeAction({ event: 'onFormSubmit', targetId: undefined })];

      mockHandleSubmit.mockImplementation(async () => {
        // Don't call the callback — validation failed
      });

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      const dispatchCalls = mockActionEngineInstance.dispatch.mock.calls;
      const submitCall = dispatchCalls.find(
        (call: any[]) => call[0] === 'onFormSubmit',
      );
      expect(submitCall).toBeUndefined();
    });
  });

  // ── Callbacks ─────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('onFieldUpdate callback calls engine.setFieldValue to trigger re-validation', () => {
      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const config = MockActionEngine.mock.calls[0][1];

      act(() => {
        config.onFieldUpdate('email', 'test@example.com');
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('email', 'test@example.com');
    });

    it('onFieldVisibility callback is provided', () => {
      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const config = MockActionEngine.mock.calls[0][1];
      expect(config.onFieldVisibility).toBeTypeOf('function');
    });

    it('onShowMessage callback displays toast for each message type', () => {
      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const config = MockActionEngine.mock.calls[0][1];

      config.onShowMessage('Error msg', 'error');
      expect(mockToast.error).toHaveBeenCalledWith('Error msg');

      config.onShowMessage('Warning msg', 'warning');
      expect(mockToast.warning).toHaveBeenCalledWith('Warning msg');

      config.onShowMessage('Success msg', 'success');
      expect(mockToast.success).toHaveBeenCalledWith('Success msg');

      config.onShowMessage('Info msg', 'info');
      expect(mockToast.info).toHaveBeenCalledWith('Info msg');
    });

    it('onFieldUpdate only updates value, not validation/required/conditional properties', () => {
      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const config = MockActionEngine.mock.calls[0][1];

      act(() => {
        config.onFieldUpdate('name', 'new value');
      });

      // Only setFieldValue should be called — no other engine methods
      expect(mockSetFieldValue).toHaveBeenCalledWith('name', 'new value');
      expect(mockSetFieldValue).toHaveBeenCalledTimes(1);
    });
  });

  // ── Cleanup ───────────────────────────────────────────────────────────

  describe('cleanup', () => {
    it('calls actionEngine.destroy() on unmount', () => {
      const actions = [makeAction()];

      const { unmount } = render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const destroyFn = mockActionEngineInstance.destroy;
      unmount();

      expect(destroyFn).toHaveBeenCalled();
    });
  });

  // ── Graceful Degradation ──────────────────────────────────────────────

  describe('graceful degradation', () => {
    it('shows warning when Web Workers are not supported', () => {
      const originalWorker = globalThis.Worker;
      delete (globalThis as any).Worker;

      MockActionEngine.mockClear();

      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      expect(
        screen.getByText(/custom actions are not supported/i),
      ).toBeInTheDocument();

      expect(MockActionEngine).not.toHaveBeenCalled();

      (globalThis as any).Worker = originalWorker;
    });

    it('renders form normally without actions when Workers unavailable', () => {
      const originalWorker = globalThis.Worker;
      delete (globalThis as any).Worker;

      const actions = [makeAction()];

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();

      (globalThis as any).Worker = originalWorker;
    });
  });

  // ── Field Visibility with CSS Transition ──────────────────────────────

  describe('field visibility', () => {
    it('applies opacity 0 when field is hidden via onFieldVisibility', () => {
      const actions = [makeAction()];

      const { container } = render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const config = MockActionEngine.mock.calls[0][1];

      act(() => {
        config.onFieldVisibility('name', false);
      });

      const transitionDivs = container.querySelectorAll('.transition-opacity');
      const nameWrapper = Array.from(transitionDivs).find((div) => {
        return div.querySelector('#name') !== null;
      });

      expect(nameWrapper).toBeTruthy();
      expect((nameWrapper as HTMLElement).style.opacity).toBe('0');
    });

    it('applies opacity 1 when field is shown via onFieldVisibility', () => {
      const actions = [makeAction()];

      const { container } = render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const config = MockActionEngine.mock.calls[0][1];

      act(() => {
        config.onFieldVisibility('name', false);
      });
      act(() => {
        config.onFieldVisibility('name', true);
      });

      const transitionDivs = container.querySelectorAll('.transition-opacity');
      const nameWrapper = Array.from(transitionDivs).find((div) => {
        return div.querySelector('#name') !== null;
      });

      expect(nameWrapper).toBeTruthy();
      const opacity = (nameWrapper as HTMLElement).style.opacity;
      expect(opacity === '1' || opacity === '').toBe(true);
    });
  });

  // ── Loading Indicator ─────────────────────────────────────────────────

  describe('loading indicator', () => {
    it('shows loading indicator while action is executing on a field', async () => {
      let resolveDispatch!: (value: boolean) => void;
      const pendingDispatch = new Promise<boolean>((resolve) => {
        resolveDispatch = resolve;
      });

      const actions = [makeAction()];

      MockActionEngine.mockImplementation(() => {
        mockActionEngineInstance = {
          init: vi.fn(),
          dispatch: vi.fn().mockImplementation((event: string) => {
            if (event === 'onFormLoad') return Promise.resolve(true);
            return pendingDispatch;
          }),
          destroy: vi.fn(),
        };
        return mockActionEngineInstance;
      });

      render(
        <DynamicFormRenderer
          schema={makeSchema()}
          onSubmit={mockOnSubmit}
          actions={actions}
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter your name');

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'John' } });
      });

      // Loading indicator should be visible
      const loaders = screen.queryAllByTestId('icon-loader');
      expect(loaders.length).toBeGreaterThan(0);

      // Resolve the dispatch
      await act(async () => {
        resolveDispatch(true);
      });
    });
  });
});
