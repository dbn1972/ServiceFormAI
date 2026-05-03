/**
 * Dynamic Form Renderer
 * Automatically generates forms from ServiceFormSchema JSON
 */

import { useState, useEffect } from 'react';
import { ServiceFormSchema, FormField } from '../types/externalAPI';
import { Calendar, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from '../utils/toast';
import { handleError } from '../utils/errorHandling';

interface DynamicFormRendererProps {
  schema: ServiceFormSchema;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onValidate?: (data: Record<string, any>) => Promise<Record<string, string>>;
}

export default function DynamicFormRenderer({
  schema,
  onSubmit,
  onValidate,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with default values
  useEffect(() => {
    const initialData: Record<string, any> = {};
    schema.fields.forEach((field) => {
      if (field.type === 'checkbox') {
        initialData[field.id] = false;
      } else {
        initialData[field.id] = '';
      }
    });
    setFormData(initialData);
  }, [schema]);

  // Validate field
  const validateField = (field: FormField, value: any): string | null => {
    // Required validation
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    // Pattern validation
    if (field.validation?.pattern && value) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return `${field.label} is invalid`;
      }
    }

    // Length validation
    if (field.validation?.minLength && value && value.length < field.validation.minLength) {
      return `${field.label} must be at least ${field.validation.minLength} characters`;
    }

    if (field.validation?.maxLength && value && value.length > field.validation.maxLength) {
      return `${field.label} must be at most ${field.validation.maxLength} characters`;
    }

    // Number validation
    if (field.type === 'number') {
      const num = parseFloat(value);
      if (field.validation?.min !== undefined && num < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && num > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max}`;
      }
    }

    return null;
  };

  // Handle field change
  const handleChange = (field: FormField, value: any) => {
    setFormData((prev) => ({ ...prev, [field.id]: value }));

    // Validate on change if field was touched
    if (touched[field.id]) {
      const error = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field.id]: error || '',
      }));
    }
  };

  // Handle field blur
  const handleBlur = (field: FormField) => {
    setTouched((prev) => ({ ...prev, [field.id]: true }));

    const error = validateField(field, formData[field.id]);
    setErrors((prev) => ({
      ...prev,
      [field.id]: error || '',
    }));
  };

  // Check if field should be shown (conditional logic)
  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditional) return true;

    const conditionValue = formData[field.conditional.field];

    switch (field.conditional.operator) {
      case 'equals':
        return conditionValue === field.conditional.value;
      case 'not_equals':
        return conditionValue !== field.conditional.value;
      case 'contains':
        return String(conditionValue).includes(String(field.conditional.value));
      case 'greater_than':
        return parseFloat(conditionValue) > parseFloat(String(field.conditional.value));
      case 'less_than':
        return parseFloat(conditionValue) < parseFloat(String(field.conditional.value));
      default:
        return true;
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // Prevent double submission

    try {
      // Validate all visible fields
      const newErrors: Record<string, string> = {};
      const visibleFields = schema.fields.filter(shouldShowField);

      visibleFields.forEach((field) => {
        const error = validateField(field, formData[field.id]);
        if (error) {
          newErrors[field.id] = error;
        }
      });

      // Custom validation
      if (onValidate) {
        try {
          const customErrors = await onValidate(formData);
          Object.assign(newErrors, customErrors);
        } catch (error: any) {
          toast.error('Validation failed', {
            description: error.message || 'An error occurred during validation',
          });
          return;
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        const errorCount = Object.keys(newErrors).length;
        toast.error(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''}`, {
          description: 'Check the form fields highlighted in red',
        });

        // Scroll to first error
        const firstErrorField = Object.keys(newErrors)[0];
        const element = document.getElementById(`field-${firstErrorField}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      setSubmitting(true);

      // Call onSubmit (may be async)
      await Promise.resolve(onSubmit(formData));

      // Success - clear form if needed
      toast.success('Form submitted successfully', {
        description: schema.serviceName || 'Your application has been submitted',
      });
    } catch (error: any) {
      // Handle submission errors
      const classified = handleError(error, {
        context: `Form submission: ${schema.serviceName}`,
        showToast: false, // We'll show custom toast below
      });

      // Check if it's a validation error from server
      if (error.validationErrors) {
        setErrors(error.validationErrors);
        toast.error('Server validation failed', {
          description: 'Please check the form fields and try again',
        });
      } else {
        toast.error('Submission failed', {
          description: classified.userDescription || 'An error occurred. Please try again.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render field based on type
  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null;

    const hasError = !!(errors[field.id] && touched[field.id]);

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
              value={formData[field.id] || ''}
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
                <span>{errors[field.id]}</span>
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
              value={formData[field.id] || ''}
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
                <span>{errors[field.id]}</span>
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
                value={formData[field.id] || ''}
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
                <span>{errors[field.id]}</span>
              </p>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <select
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors ${
                hasError
                  ? 'border-destructive focus:border-destructive'
                  : 'border-border focus:border-primary'
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
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.id]}
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={formData[field.id] === option.value}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {hasError && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.id]}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData[field.id] || false}
                onChange={(e) => handleChange(field, e.target.checked)}
                className="w-5 h-5 mt-0.5 flex-shrink-0"
              />
              <div>
                <span className="font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </span>
                {field.helpText && (
                  <p className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
                )}
              </div>
            </label>
            {hasError && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1 ml-8">
                <AlertCircle className="w-4 h-4" />
                {errors[field.id]}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <textarea
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors resize-none ${
                hasError
                  ? 'border-destructive focus:border-destructive'
                  : 'border-border focus:border-primary'
              }`}
            />
            {hasError && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.id]}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-sm text-muted-foreground mb-2">{field.helpText}</p>
            )}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-sm text-primary font-medium">Choose file</span>
                <input
                  type="file"
                  onChange={(e) => handleChange(field, e.target.files?.[0])}
                  onBlur={() => handleBlur(field)}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                {formData[field.id]?.name || 'No file selected'}
              </p>
            </div>
            {hasError && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.id]}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl"
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

      {/* Form Fields */}
      {schema.fields.map(renderField)}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            Submitting...
          </>
        ) : (
          'Submit Application'
        )}
      </button>
    </form>
  );
}
