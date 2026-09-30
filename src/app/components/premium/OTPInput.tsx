/**
 * OTPInput — Premium custom component for segmented OTP input.
 *
 * Renders a configurable number of individual digit inputs (default 6)
 * and emits the concatenated digit string as the field value.
 *
 * Implements CustomFieldProps interface.
 * Registers an `otp_format` custom validator.
 */

import { useRef, useCallback } from 'react';
import type { CustomFieldProps } from '../../types/customComponent';
import { AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validates that an OTP value is a digit string of the expected length.
 * Registered as `otp_format` in the CustomValidatorRegistry.
 */
export function otpFormatValidator(
  value: unknown,
  _formData: unknown,
  field: unknown,
): Array<{ field: string; errorCode: string; message: string }> {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (typeof value !== 'string') {
    return [
      {
        field: '',
        errorCode: 'OTP_INVALID_FORMAT',
        message: 'OTP must be a string of digits',
      },
    ];
  }

  // Get expected length from field config
  const fieldDef = field as Record<string, unknown> | undefined;
  const customConfig = fieldDef?.customConfig as Record<string, unknown> | undefined;
  const expectedLength = (customConfig?.digits as number) ?? 6;

  if (!/^\d+$/.test(value)) {
    return [
      {
        field: '',
        errorCode: 'OTP_INVALID_FORMAT',
        message: 'OTP must contain only digits',
      },
    ];
  }

  if (value.length !== expectedLength) {
    return [
      {
        field: '',
        errorCode: 'OTP_INVALID_LENGTH',
        message: `OTP must be exactly ${expectedLength} digits`,
      },
    ];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OTPInput({
  field,
  fieldId,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  config,
}: CustomFieldProps) {
  const digits = (config.digits as number) ?? 6;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Parse current value into individual digits
  const currentValue = typeof value === 'string' ? value : '';
  const digitValues = Array.from({ length: digits }, (_, i) => currentValue[i] ?? '');

  const handleDigitChange = useCallback(
    (index: number, digitValue: string) => {
      // Only accept single digits
      const digit = digitValue.replace(/\D/g, '').slice(-1);

      const newDigits = [...digitValues];
      newDigits[index] = digit;
      const combined = newDigits.join('');
      onChange(combined);

      // Auto-advance to next input
      if (digit && index < digits - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digitValues, digits, onChange],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digitValues[index] && index > 0) {
        // Move to previous input on backspace when current is empty
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < digits - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digitValues, digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits);
      if (pasted) {
        onChange(pasted);
        // Focus the input after the last pasted digit
        const focusIndex = Math.min(pasted.length, digits - 1);
        inputRefs.current[focusIndex]?.focus();
      }
    },
    [digits, onChange],
  );

  const hasError = !!error;

  return (
    <div aria-label={field.label}>
      <label className="block text-sm font-medium mb-2" id={`${fieldId}-label`}>
        {field.label}
        {field.required && (
          <span className="text-destructive ml-1" aria-label="required">*</span>
        )}
      </label>

      {field.helpText && (
        <p id={`${fieldId}-help`} className="text-sm text-muted-foreground mb-2">
          {field.helpText}
        </p>
      )}

      <div
        className="flex gap-2 justify-start"
        role="group"
        aria-labelledby={`${fieldId}-label`}
        aria-describedby={error ? `${fieldId}-error` : field.helpText ? `${fieldId}-help` : undefined}
      >
        {Array.from({ length: digits }, (_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            id={`${fieldId}-digit-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={digitValues[index]}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onBlur={onBlur}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${digits}`}
            aria-invalid={hasError}
            autoComplete="one-time-code"
            className={`w-12 h-12 text-center text-lg font-mono border rounded-lg outline-none transition-colors ${
              hasError
                ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        ))}
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
    </div>
  );
}
