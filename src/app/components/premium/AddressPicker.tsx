/**
 * AddressPicker — Premium custom component for structured address input.
 *
 * Renders address fields (street, city, state, postal code, country) and
 * emits a structured address object as the field value. Reads map provider
 * configuration from the `config` prop.
 *
 * Implements CustomFieldProps interface.
 * Registers an `address_structure` custom validator.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CustomFieldProps } from '../../types/customComponent';
import { AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Address value type
// ---------------------------------------------------------------------------

export interface AddressValue {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const EMPTY_ADDRESS: AddressValue = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validates that an address value has all required fields populated.
 * Registered as `address_structure` in the CustomValidatorRegistry.
 */
export function addressStructureValidator(
  value: unknown,
): Array<{ field: string; errorCode: string; message: string }> {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  const errors: Array<{ field: string; errorCode: string; message: string }> = [];
  const addr = value as Record<string, unknown>;

  const requiredFields = ['street', 'city', 'state', 'postalCode', 'country'];
  for (const key of requiredFields) {
    if (!addr[key] || (typeof addr[key] === 'string' && (addr[key] as string).trim() === '')) {
      errors.push({
        field: key,
        errorCode: 'ADDRESS_MISSING_FIELD',
        message: `Address is missing required field: ${key}`,
      });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AddressPicker({
  field,
  fieldId,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  config,
}: CustomFieldProps) {
  const address: AddressValue =
    value && typeof value === 'object' ? { ...EMPTY_ADDRESS, ...(value as AddressValue) } : { ...EMPTY_ADDRESS };

  const [configError, setConfigError] = useState<string | null>(null);
  const blurCountRef = useRef(0);

  // Check for required config
  useEffect(() => {
    if (config.mapProvider && !config.apiKey) {
      setConfigError(`Map API key required for provider "${config.mapProvider}"`);
    } else {
      setConfigError(null);
    }
  }, [config]);

  const handleFieldChange = useCallback(
    (key: keyof AddressValue, fieldValue: string) => {
      const updated = { ...address, [key]: fieldValue };
      onChange(updated);
    },
    [address, onChange],
  );

  const handleFieldBlur = useCallback(() => {
    blurCountRef.current += 1;
    // Only trigger onBlur after user has interacted with at least one sub-field
    onBlur();
  }, [onBlur]);

  if (configError) {
    return (
      <div
        className="border border-destructive/50 rounded-lg p-4 bg-destructive/5"
        role="alert"
        aria-label="Address picker configuration error"
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-medium">{configError}</span>
        </div>
      </div>
    );
  }

  const inputClass = (hasErr: boolean) =>
    `w-full px-3 py-2 border rounded-lg outline-none transition-colors text-sm min-h-[40px] ${
      hasErr
        ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
    }`;

  const hasError = !!error;

  return (
    <fieldset
      aria-label={field.label}
      aria-describedby={error ? `${fieldId}-error` : undefined}
      disabled={disabled}
      className="space-y-3"
    >
      <legend className="block text-sm font-medium mb-2">
        {field.label}
        {field.required && (
          <span className="text-destructive ml-1" aria-label="required">*</span>
        )}
      </legend>

      {field.helpText && (
        <p id={`${fieldId}-help`} className="text-sm text-muted-foreground mb-2">
          {field.helpText}
        </p>
      )}

      <div>
        <label htmlFor={`${fieldId}-street`} className="block text-xs text-muted-foreground mb-1">
          Street Address
        </label>
        <input
          id={`${fieldId}-street`}
          type="text"
          value={address.street}
          onChange={(e) => handleFieldChange('street', e.target.value)}
          onBlur={handleFieldBlur}
          placeholder="Street address"
          disabled={disabled}
          aria-label="Street address"
          aria-invalid={hasError}
          className={inputClass(hasError)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${fieldId}-city`} className="block text-xs text-muted-foreground mb-1">
            City
          </label>
          <input
            id={`${fieldId}-city`}
            type="text"
            value={address.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            onBlur={handleFieldBlur}
            placeholder="City"
            disabled={disabled}
            aria-label="City"
            aria-invalid={hasError}
            className={inputClass(hasError)}
          />
        </div>
        <div>
          <label htmlFor={`${fieldId}-state`} className="block text-xs text-muted-foreground mb-1">
            State
          </label>
          <input
            id={`${fieldId}-state`}
            type="text"
            value={address.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            onBlur={handleFieldBlur}
            placeholder="State"
            disabled={disabled}
            aria-label="State"
            aria-invalid={hasError}
            className={inputClass(hasError)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${fieldId}-postalCode`} className="block text-xs text-muted-foreground mb-1">
            Postal Code
          </label>
          <input
            id={`${fieldId}-postalCode`}
            type="text"
            value={address.postalCode}
            onChange={(e) => handleFieldChange('postalCode', e.target.value)}
            onBlur={handleFieldBlur}
            placeholder="Postal code"
            disabled={disabled}
            aria-label="Postal code"
            aria-invalid={hasError}
            className={inputClass(hasError)}
          />
        </div>
        <div>
          <label htmlFor={`${fieldId}-country`} className="block text-xs text-muted-foreground mb-1">
            Country
          </label>
          <input
            id={`${fieldId}-country`}
            type="text"
            value={address.country}
            onChange={(e) => handleFieldChange('country', e.target.value)}
            onBlur={handleFieldBlur}
            placeholder="Country"
            disabled={disabled}
            aria-label="Country"
            aria-invalid={hasError}
            className={inputClass(hasError)}
          />
        </div>
      </div>

      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-destructive mt-1 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}
