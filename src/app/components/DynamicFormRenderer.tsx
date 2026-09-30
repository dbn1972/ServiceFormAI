/**
 * Dynamic Form Renderer
 * Automatically generates forms from ServiceFormSchema JSON
 * Uses the useFormEngine hook from @serviceformai/form-engine-react
 * for consistent state management and validation.
 *
 * Supports custom field types via the ComponentRegistry. Premium
 * (platform) components render directly; third-party components
 * render inside a ComponentSandbox iframe.
 */

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react';
import { ServiceFormSchema, FormField } from '../types/externalAPI';
import type { ExtendedFormSchema, ExtendedFormField, TenantTheme } from '../types/layoutTypes';
import { useFormEngine } from '@serviceformai/form-engine-react';
import type { FormSchema as EngineFormSchema } from '@serviceformai/form-engine-react';
import { Calendar, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from '../utils/toast';
import { handleError } from '../utils/errorHandling';
import {
  componentRegistry,
  PLATFORM_TENANT,
} from '../services/componentRegistry';
import type { CustomFieldProps } from '../types/customComponent';
import ComponentSandbox from './ComponentSandbox';
import PaymentField from './PaymentField';
import ThemeProvider from './layout/ThemeProvider';
import LayoutEngine from './layout/LayoutEngine';
import { ActionEngine } from '../actions/action-engine';
import type { ActionDefinition } from '@serviceformai/validation-engine';
import type { OfflineStore } from '../services/offlineStore';
import { QuotaExceededError } from '../services/offlineStore';
import type { EncryptionService } from '../services/encryptionService';
import type { SyncManager } from '../services/syncManager';
import { connectivityMonitor } from '../services/connectivityMonitor';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

interface DynamicFormRendererProps {
  schema: ServiceFormSchema | ExtendedFormSchema;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onValidate?: (data: Record<string, any>) => Promise<Record<string, string>>;
  /** Tenant ID for resolving custom components. Defaults to '__platform__'. */
  tenantId?: string;
  /** Tenant theme for CSS custom property injection. */
  theme?: TenantTheme;
  /** Fetch domain allowlist for action sandbox. */
  fetchAllowlist?: string[];
  /** Service ID for action audit logging. */
  serviceId?: string;
  /** Action definitions from the FormSchema. */
  actions?: ActionDefinition[];
  /** Consumer ID for offline draft saving. */
  consumerId?: string;
  /** OfflineStore instance for draft persistence. */
  offlineStore?: OfflineStore;
  /** EncryptionService instance for encrypting drafts. */
  encryptionService?: EncryptionService;
  /** SyncManager instance for offline submission queuing. */
  syncManager?: SyncManager;
  /** Schema version for draft versioning. */
  schemaVersion?: number;
}

/**
 * Convert the frontend's ServiceFormSchema to the validation engine's FormSchema.
 * The engine expects { version, fields } at the top level. The field shapes are
 * compatible — the frontend's FormField has the same validation/conditional/options
 * structure the engine uses. Extra frontend-only properties (digilockerMapping,
 * apiMapping, etc.) are harmless and ignored by the engine.
 */
function toEngineSchema(schema: ServiceFormSchema): EngineFormSchema {
  return {
    version: schema.version,
    fields: schema.fields.map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      required: f.required,
      placeholder: f.placeholder,
      helpText: f.helpText,
      validation: f.validation,
      options: f.options,
      conditional: f.conditional,
    })),
  };
}

// ---------------------------------------------------------------------------
// Custom component helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a registration is a platform (premium) component.
 * Premium components are registered under the __platform__ tenant scope
 * and can render directly without a sandbox.
 */
function isPlatformComponent(
  fieldType: string,
  tenantId: string,
): boolean {
  return componentRegistry.isPlatformComponent(fieldType, tenantId);
}

/** Loading skeleton for custom components. */
function CustomFieldSkeleton({ fieldType }: { fieldType: string }) {
  return (
    <div
      className="animate-pulse bg-muted rounded-lg p-4 min-h-[80px]"
      aria-busy="true"
      aria-label={`Loading custom component: ${fieldType}`}
      role="status"
    >
      <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-3" />
      <div className="h-10 bg-muted-foreground/20 rounded" />
    </div>
  );
}

/** Error fallback for unsupported or failed custom fields. */
function CustomFieldError({ message }: { message: string }) {
  return (
    <div
      className="border border-destructive/50 rounded-lg p-4 bg-destructive/5"
      role="alert"
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export default function DynamicFormRenderer({
  schema,
  onSubmit,
  onValidate,
  tenantId = PLATFORM_TENANT,
  theme,
  fetchAllowlist = [],
  serviceId = '',
  actions: actionsProp,
  consumerId,
  offlineStore,
  encryptionService,
  syncManager,
  schemaVersion,
}: DynamicFormRendererProps) {
  const [errorAnnouncement, setErrorAnnouncement] = useState('');
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>({});
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());
  const [actionsWarning, setActionsWarning] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isOffline, setIsOffline] = useState(!connectivityMonitor.isOnline);

  // Ref to hold the ActionEngine instance
  const actionEngineRef = useRef<ActionEngine | null>(null);

  // Extract actions from schema or props
  const actions = actionsProp ?? (schema as any).actions ?? [];

  // Pre-compute the engine schema when the service schema changes
  const engineSchema = useMemo(() => toEngineSchema(schema), [schema]);

  // Use the form engine hook for state management
  const engine = useFormEngine(engineSchema);

  // ── Action Engine lifecycle ─────────────────────────────────────────────

  useEffect(() => {
    // Only initialise if there are actions to process
    if (!actions || actions.length === 0) return;

    // Graceful degradation: check for Web Worker support
    if (typeof Worker === 'undefined') {
      setActionsWarning('Custom actions are not supported in this browser (Web Workers unavailable).');
      console.warn('[DynamicFormRenderer] Web Workers not supported. Rendering form without actions.');
      return;
    }

    const actionEngine = new ActionEngine(actions, {
      tenantId: tenantId,
      serviceId: serviceId,
      fetchAllowlist: fetchAllowlist,
      onFieldUpdate: (fieldId: string, value: unknown) => {
        // Actions cannot modify validation, required, conditional, or crossFieldRules
        // setFieldValue only updates the value — safe by design
        engine.setFieldValue(fieldId, value);
      },
      onFieldVisibility: (fieldId: string, visible: boolean) => {
        setFieldVisibility((prev) => {
          if (prev[fieldId] === visible) return prev;
          return { ...prev, [fieldId]: visible };
        });
      },
      onShowMessage: (text: string, type: 'info' | 'warning' | 'error' | 'success') => {
        switch (type) {
          case 'error':
            toast.error(text);
            break;
          case 'warning':
            toast.warning(text);
            break;
          case 'success':
            toast.success(text);
            break;
          case 'info':
          default:
            toast.info(text);
            break;
        }
      },
    });

    actionEngine.init();
    actionEngineRef.current = actionEngine;

    // Dispatch onFormLoad after initialisation
    actionEngine.dispatch('onFormLoad', { formValues: engine.values });

    return () => {
      actionEngine.destroy();
      actionEngineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.length, tenantId, serviceId]);

  // ── Connectivity monitoring ─────────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    connectivityMonitor.addEventListener('online', handleOnline);
    connectivityMonitor.addEventListener('offline', handleOffline);
    return () => {
      connectivityMonitor.removeEventListener('online', handleOnline);
      connectivityMonitor.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Draft restore on mount ──────────────────────────────────────────────────

  useEffect(() => {
    if (!offlineStore || !encryptionService || !consumerId || !serviceId) return;

    let cancelled = false;
    (async () => {
      try {
        const draft = await offlineStore.getDraft(serviceId, consumerId);
        if (!draft || cancelled) return;
        const values = await encryptionService.decrypt<Record<string, unknown>>(
          consumerId,
          draft.encryptedData,
          draft.iv,
        );
        if (cancelled) return;
        for (const [fieldId, value] of Object.entries(values)) {
          engine.setFieldValue(fieldId, value);
        }
        setHasDraft(true);
        toast.info('Draft restored — continuing from where you left off');
      } catch {
        // Silently ignore draft restore errors
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineStore, encryptionService, consumerId, serviceId]);

  // ── Auto-save interval ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!offlineStore || !encryptionService || !consumerId || !serviceId || schemaVersion === undefined) return;

    const intervalId = setInterval(async () => {
      const values = engine.values;
      const hasValues = Object.values(values).some((v) => v !== '' && v !== null && v !== undefined);
      if (!hasValues) return;

      try {
        const { ciphertext, iv } = await encryptionService.encrypt(consumerId, values);
        await offlineStore.saveDraft(serviceId, consumerId, ciphertext, iv, true, schemaVersion);
        setHasDraft(true);
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          toast.warning('Auto-save unavailable — device storage is full');
        }
      }
    }, 10_000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineStore, encryptionService, consumerId, serviceId, schemaVersion]);

  // Handle field change
  const handleChange = useCallback(
    (field: FormField, value: any) => {
      const previousValue = engine.values[field.id];
      engine.setFieldValue(field.id, value);

      // Dispatch onFieldChange to the Action Engine
      if (actionEngineRef.current) {
        setLoadingFields((prev) => new Set(prev).add(field.id));
        actionEngineRef.current
          .dispatch('onFieldChange', {
            fieldId: field.id,
            value,
            previousValue,
            formValues: { ...engine.values, [field.id]: value },
          })
          .finally(() => {
            setLoadingFields((prev) => {
              const next = new Set(prev);
              next.delete(field.id);
              return next;
            });
          });
      }
    },
    [engine.setFieldValue, engine.values],
  );

  // Handle field blur
  const handleBlur = useCallback(
    (field: FormField) => {
      engine.touchField(field.id);

      // Dispatch onFieldBlur to the Action Engine
      if (actionEngineRef.current) {
        setLoadingFields((prev) => new Set(prev).add(field.id));
        actionEngineRef.current
          .dispatch('onFieldBlur', {
            fieldId: field.id,
            value: engine.values[field.id],
            formValues: engine.values,
          })
          .finally(() => {
            setLoadingFields((prev) => {
              const next = new Set(prev);
              next.delete(field.id);
              return next;
            });
          });
      }
    },
    [engine.touchField, engine.values],
  );

  // Check if field should be shown (use engine's visibleFields)
  const visibleFieldIdSet = useMemo(
    () => new Set(engine.visibleFields.map((f) => f.id)),
    [engine.visibleFields],
  );

  const shouldShowField = useCallback(
    (field: FormField): boolean => {
      // Action-driven visibility overrides: always render the field so CSS
      // transitions can animate it in/out. The wrapper applies opacity 0
      // and pointer-events: none when hidden.
      if (fieldVisibility[field.id] !== undefined) {
        return true;
      }
      return visibleFieldIdSet.has(field.id);
    },
    [visibleFieldIdSet, fieldVisibility],
  );

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (engine.submitting) return; // Prevent double submission

    // If offline and syncManager is provided, queue the submission
    if (isOffline && syncManager && serviceId && consumerId && schemaVersion !== undefined) {
      try {
        await syncManager.enqueue(serviceId, consumerId, engine.values, schemaVersion);
        toast.info('Submission saved — will sync when you are back online');
      } catch {
        toast.error('Failed to queue submission. Please try again.');
      }
      return;
    }

    try {
      // We use engine.handleSubmit which validates all visible fields,
      // but we need to handle onValidate and 422 errors specially.
      // So we orchestrate submission manually using engine state.

      // First, trigger full validation via engine.handleSubmit
      // We wrap the actual submission logic inside the callback
      let submitSucceeded = false;

      await engine.handleSubmit(async (data) => {
        // At this point, engine validation has passed.

        // Execute onFormSubmit actions (after validation passes)
        if (actionEngineRef.current) {
          const actionsAllowed = await actionEngineRef.current.dispatch(
            'onFormSubmit',
            { formValues: data },
          );
          if (!actionsAllowed) {
            // An action showed an error message — block submission
            return;
          }
        }

        // Run custom validation (if provided)
        const customErrors: Record<string, string> = {};

        if (onValidate) {
          try {
            const result = await onValidate(data);
            Object.assign(customErrors, result);
          } catch (error: any) {
            toast.error('Validation failed', {
              description: error.message || 'An error occurred during validation',
            });
            return;
          }
        }

        if (Object.keys(customErrors).length > 0) {
          // Set custom validation errors via engine
          engine.setServerErrors(customErrors);

          const errorCount = Object.keys(customErrors).length;

          // Announce error count to screen readers via aria-live region
          setErrorAnnouncement(
            `${errorCount} validation error${errorCount > 1 ? 's' : ''} found. Please correct the highlighted fields.`,
          );

          toast.error(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''}`, {
            description: 'Check the form fields highlighted in red',
          });

          // Scroll to first error
          const firstErrorField = Object.keys(customErrors)[0];
          const element = document.getElementById(`field-${firstErrorField}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        // Clear any previous error announcement on successful validation
        setErrorAnnouncement('');

        // Call onSubmit (may be async)
        await Promise.resolve(onSubmit(data));
        submitSucceeded = true;
      });

      // If engine validation failed (handleSubmit didn't call our callback),
      // we need to handle the error display
      if (!submitSucceeded) {
        const errorCount = Object.keys(engine.errors).length;
        if (errorCount > 0) {
          // Announce error count to screen readers via aria-live region
          setErrorAnnouncement(
            `${errorCount} validation error${errorCount > 1 ? 's' : ''} found. Please correct the highlighted fields.`,
          );

          toast.error(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''}`, {
            description: 'Check the form fields highlighted in red',
          });

          // Scroll to first error
          const firstErrorField = Object.keys(engine.errors)[0];
          const element = document.getElementById(`field-${firstErrorField}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Success
      toast.success('Form submitted successfully', {
        description: schema.serviceName || 'Your application has been submitted',
      });
    } catch (error: any) {
      // Handle submission errors
      const classified = handleError(error, {
        context: `Form submission: ${schema.serviceName}`,
        showToast: false, // We'll show custom toast below
      });

      // Check if it's a validation error from server (HTTP 422)
      if (error.validationErrors) {
        // Server returns { validationErrors: Record<string, ValidationError[]> }
        // Extract first error message per field, same as engine format
        const serverErrors: Record<string, string> = {};
        for (const [fieldId, fieldErrs] of Object.entries(error.validationErrors)) {
          if (Array.isArray(fieldErrs) && fieldErrs.length > 0) {
            serverErrors[fieldId] = (fieldErrs[0] as any).message || String(fieldErrs[0]);
          } else if (typeof fieldErrs === 'string') {
            // Fallback: server may return plain strings
            serverErrors[fieldId] = fieldErrs;
          }
        }

        // Merge server errors into engine state
        engine.setServerErrors(serverErrors);

        toast.error('Server validation failed', {
          description: 'Please check the form fields and try again',
        });
      } else {
        toast.error('Submission failed', {
          description: classified.userDescription || 'An error occurred. Please try again.',
        });
      }
    }
  };

  // Render field based on type
  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null;

    const hasError = !!(engine.errors[field.id] && engine.touched[field.id]);
    const isLoading = loadingFields.has(field.id);

    // Wrap field in a container with CSS transition for visibility and loading indicator
    const fieldContent = (() => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} id={`field-${field.id}`} className="mb-6">
            <label htmlFor={field.id} className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </label>
            {field.helpText && (
              <p id={`${field.id}-help`} className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            {field.digilockerMapping && (
              <div className="mb-2 flex items-center gap-2 text-sm text-success" role="status">
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                <span>Auto-filled from DigiLocker ({field.digilockerMapping.source})</span>
              </div>
            )}
            <input
              id={field.id}
              name={field.id}
              type={field.type as React.HTMLInputTypeAttribute}
              value={engine.values[field.id] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={field.placeholder}
              required={field.required}
              aria-required={field.required}
              aria-invalid={hasError}
              aria-describedby={`${field.helpText ? `${field.id}-help` : ''} ${hasError ? `${field.id}-error` : ''}`.trim() || undefined}
              className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors min-h-[44px] touch-manipulation ${
                hasError
                  ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            {hasError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive mt-1 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{engine.errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} id={`field-${field.id}`} className="mb-6">
            <label htmlFor={field.id} className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </label>
            {field.helpText && (
              <p id={`${field.id}-help`} className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <input
              id={field.id}
              name={field.id}
              type="number"
              value={engine.values[field.id] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              required={field.required}
              aria-required={field.required}
              aria-invalid={hasError}
              aria-describedby={`${field.helpText ? `${field.id}-help` : ''} ${hasError ? `${field.id}-error` : ''}`.trim() || undefined}
              className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors min-h-[44px] touch-manipulation ${
                hasError
                  ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            {hasError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive mt-1 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{engine.errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} id={`field-${field.id}`} className="mb-6">
            <label htmlFor={field.id} className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </label>
            {field.helpText && (
              <p id={`${field.id}-help`} className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <div className="relative">
              <input
                id={field.id}
                name={field.id}
                type="date"
                value={engine.values[field.id] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                onBlur={() => handleBlur(field)}
                required={field.required}
                aria-required={field.required}
                aria-invalid={hasError}
                aria-describedby={`${field.helpText ? `${field.id}-help` : ''} ${hasError ? `${field.id}-error` : ''}`.trim() || undefined}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors min-h-[44px] touch-manipulation ${
                  hasError
                    ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                    : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            </div>
            {hasError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive mt-1 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{engine.errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} id={`field-${field.id}`} className="mb-6">
            <label htmlFor={field.id} className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </label>
            {field.helpText && (
              <p id={`${field.id}-help`} className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <select
              id={field.id}
              value={engine.values[field.id] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              aria-required={field.required}
              aria-invalid={hasError}
              aria-describedby={`${field.helpText ? `${field.id}-help` : ''} ${hasError ? `${field.id}-error` : ''}`.trim() || undefined}
              className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors ${
                hasError
                  ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive mt-1 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{engine.errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} id={`field-${field.id}`} className="mb-6">
            <label id={`${field.id}-label`} className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </label>
            {field.helpText && (
              <p id={`${field.id}-help`} className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <div
              role="radiogroup"
              aria-labelledby={`${field.id}-label`}
              aria-required={field.required}
              aria-invalid={hasError}
              aria-describedby={`${field.helpText ? `${field.id}-help` : ''} ${hasError ? `${field.id}-error` : ''}`.trim() || undefined}
              className="space-y-2"
            >
              {field.options?.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={engine.values[field.id] === option.value}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {hasError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive mt-1 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{engine.errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} id={`field-${field.id}`} className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={engine.values[field.id] || false}
                onChange={(e) => handleChange(field, e.target.checked)}
                aria-invalid={hasError}
                aria-describedby={`${field.helpText ? `${field.id}-help` : ''} ${hasError ? `${field.id}-error` : ''}`.trim() || undefined}
                className="w-5 h-5 mt-0.5 flex-shrink-0"
              />
              <div>
                <span className="font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
                </span>
                {field.helpText && (
                  <p id={`${field.id}-help`} className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
                )}
              </div>
            </label>
            {hasError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive mt-1 flex items-center gap-1 ml-8" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{engine.errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} id={`field-${field.id}`} className="mb-6">
            <label htmlFor={field.id} className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </label>
            {field.helpText && (
              <p id={`${field.id}-help`} className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <textarea
              id={field.id}
              value={engine.values[field.id] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={field.placeholder}
              rows={4}
              aria-required={field.required}
              aria-invalid={hasError}
              aria-describedby={`${field.helpText ? `${field.id}-help` : ''} ${hasError ? `${field.id}-error` : ''}`.trim() || undefined}
              className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors resize-none ${
                hasError
                  ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                  : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            {hasError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive mt-1 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{engine.errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={field.id} id={`field-${field.id}`} className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
            </label>
            {field.helpText && (
              <p id={`${field.id}-help`} className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              hasError
                ? 'border-destructive hover:border-destructive'
                : 'border-border hover:border-primary'
            }`}>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
              <label className="cursor-pointer">
                <span className="text-sm text-primary font-medium">Choose file</span>
                <input
                  type="file"
                  onChange={(e) => handleChange(field, e.target.files?.[0])}
                  onBlur={() => handleBlur(field)}
                  aria-invalid={hasError}
                  aria-describedby={`${field.helpText ? `${field.id}-help` : ''} ${hasError ? `${field.id}-error` : ''}`.trim() || undefined}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                {engine.values[field.id]?.name || 'No file selected'}
              </p>
            </div>
            {hasError && (
              <p id={`${field.id}-error`} className="text-sm text-destructive mt-1 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{engine.errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'payment':
        return (
          <PaymentField
            key={field.id}
            field={field as any}
            formData={engine.values}
            onPaymentComplete={(details) => {
              engine.setFieldValue(field.id, details);
            }}
            serviceId={serviceId}
            tenantId={tenantId}
            disabled={engine.submitting}
          />
        );

      default:
        // Not a built-in type — attempt to render as a custom component
        return renderCustomField(field, hasError);
    }
    })();

    // Wrap with loading indicator and CSS transition for visibility
    const isActionHidden = fieldVisibility[field.id] === false;
    return (
      <div
        key={field.id}
        className="transition-opacity duration-200 relative"
        style={{
          opacity: isActionHidden ? 0 : 1,
          pointerEvents: isActionHidden ? 'none' : undefined,
          height: isActionHidden ? 0 : undefined,
          overflow: isActionHidden ? 'hidden' : undefined,
        }}
        aria-hidden={isActionHidden || undefined}
      >
        {isLoading && (
          <div className="absolute top-2 right-2 z-10" aria-label="Action running">
            <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
          </div>
        )}
        {fieldContent}
      </div>
    );
  };

  // Render a custom (non-built-in) field type
  const renderCustomField = (field: FormField, hasError: boolean) => {
    const registration = componentRegistry.getComponent(field.type, tenantId);

    if (!registration) {
      return (
        <div key={field.id} id={`field-${field.id}`} className="mb-6">
          <CustomFieldError message={`Unsupported field type: ${field.type}`} />
        </div>
      );
    }

    const customFieldProps: CustomFieldProps = {
      field: field as any,
      fieldId: field.id,
      value: engine.values[field.id],
      onChange: (value: unknown) => handleChange(field, value),
      onBlur: () => handleBlur(field),
      error: hasError ? engine.errors[field.id] : undefined,
      disabled: false,
      config: (field as any).customConfig ?? registration.manifest.defaultConfig ?? {},
    };

    // Check if this is a platform (premium) component — render directly
    const isPlatform = isPlatformComponent(field.type, tenantId);

    if (isPlatform) {
      const PremiumComponent = registration.component;
      return (
        <div key={field.id} id={`field-${field.id}`} className="mb-6">
          <PremiumComponent {...customFieldProps} />
          {hasError && (
            <p
              id={`${field.id}-error`}
              className="text-sm text-destructive mt-1 flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              <span>{engine.errors[field.id]}</span>
            </p>
          )}
        </div>
      );
    }

    // Third-party component — render inside sandbox
    return (
      <div key={field.id} id={`field-${field.id}`} className="mb-6">
        <label className="block text-sm font-medium mb-2">
          {field.label}
          {field.required && (
            <span className="text-destructive ml-1" aria-label="required">*</span>
          )}
        </label>
        {field.helpText && (
          <p id={`${field.id}-help`} className="text-sm text-muted-foreground mb-2">
            {field.helpText}
          </p>
        )}
        <Suspense fallback={<CustomFieldSkeleton fieldType={field.type} />}>
          <ComponentSandbox
            manifest={registration.manifest}
            tenantId={tenantId}
            fieldProps={customFieldProps}
            onChange={(value: unknown) => handleChange(field, value)}
            onBlur={() => handleBlur(field)}
            onError={(errorMsg: string) => {
              console.error(
                `[DynamicFormRenderer] Custom component error for "${field.type}":`,
                errorMsg,
              );
            }}
          />
        </Suspense>
        {hasError && (
          <p
            id={`${field.id}-error`}
            className="text-sm text-destructive mt-1 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span>{engine.errors[field.id]}</span>
          </p>
        )}
      </div>
    );
  };

  // Check if schema has layout configuration (ExtendedFormSchema)
  const extendedSchema = schema as ExtendedFormSchema;
  const hasLayout = !!extendedSchema.layout;
  const direction = theme?.direction ?? 'ltr';

  // Adapter: renderField for LayoutEngine receives ExtendedFormField
  const renderFieldForLayout = useCallback(
    (field: ExtendedFormField) => renderField(field as FormField),
    [renderField, shouldShowField, engine.errors, engine.touched, engine.values],
  );

  return (
    <ThemeProvider theme={theme}>
      <form
        onSubmit={handleSubmit}
        className={hasLayout ? '' : 'max-w-2xl'}
        aria-label={`${schema.serviceName} application form`}
        noValidate
      >
        {/* Service Header */}
        <div className="mb-8">
          <h2 id="form-title" className="text-2xl font-bold mb-2">{schema.serviceName}</h2>
          <p id="form-description" className="text-muted-foreground mb-4">{schema.metadata.description}</p>

          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Department:</span>
              <span className="font-medium ml-2">{schema.department}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Processing Time:</span>
              <span className="font-medium ml-2">{schema.metadata.sla}</span>
            </div>
            {schema.metadata.fees && (
              <div>
                <span className="text-muted-foreground">Fees:</span>
                <span className="font-medium ml-2">₹{schema.metadata.fees}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions warning banner (graceful degradation) */}
        {actionsWarning && (
          <div
            className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning-foreground flex items-center gap-2"
            role="status"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{actionsWarning}</span>
          </div>
        )}

        {/* Form Fields — use LayoutEngine when layout is present */}
        {hasLayout ? (
          <LayoutEngine
            schema={extendedSchema}
            formData={engine.values}
            renderField={renderFieldForLayout}
            direction={direction}
          />
        ) : (
          schema.fields.map(renderField)
        )}

        {/* Visually hidden aria-live region for error count announcements */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {errorAnnouncement}
        </div>

        {/* Discard Draft button — shown only when a draft exists */}
        {hasDraft && offlineStore && serviceId && consumerId && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowDiscardDialog(true)}
              className="text-sm text-muted-foreground hover:text-destructive underline"
            >
              Discard Draft
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={engine.submitting}
          aria-disabled={isOffline && !!syncManager ? true : undefined}
          title={isOffline && syncManager ? 'Submit requires internet connection' : undefined}
          className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 submit-button"
        >
          {engine.submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Submitting...
            </>
          ) : isOffline && syncManager ? (
            'Save for Later (Offline)'
          ) : (
            'Submit Application'
          )}
        </button>

        {/* Discard Draft Confirmation Dialog */}
        {showDiscardDialog && (
          <AlertDialogPrimitive.Root open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
            <AlertDialogPrimitive.Portal>
              <AlertDialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-xl p-6 max-w-md w-full shadow-xl">
                <AlertDialogPrimitive.Title className="text-lg font-semibold mb-2">
                  Discard Draft?
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="text-sm text-muted-foreground mb-6">
                  Discard your saved draft? This cannot be undone.
                </AlertDialogPrimitive.Description>
                <div className="flex gap-3 justify-end">
                  <AlertDialogPrimitive.Cancel asChild>
                    <button className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80">
                      Cancel
                    </button>
                  </AlertDialogPrimitive.Cancel>
                  <AlertDialogPrimitive.Action asChild>
                    <button
                      className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90"
                      onClick={async () => {
                        if (offlineStore && serviceId && consumerId) {
                          await offlineStore.deleteDraft(serviceId, consumerId);
                          engine.reset?.();
                          setHasDraft(false);
                        }
                        setShowDiscardDialog(false);
                      }}
                    >
                      Discard Draft
                    </button>
                  </AlertDialogPrimitive.Action>
                </div>
              </AlertDialogPrimitive.Content>
            </AlertDialogPrimitive.Portal>
          </AlertDialogPrimitive.Root>
        )}
      </form>
    </ThemeProvider>
  );
}
