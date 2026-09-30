/**
 * ValidationRuleBuilder — Visual validation rule configuration.
 *
 * Displays type-appropriate inputs: required toggle, minLength/maxLength
 * for text types, min/max for numbers, date pickers for dates,
 * file constraints, pattern with live test, validatorType dropdown,
 * and custom error message.
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { BuilderField, BuilderFieldValidation, ValidatorType } from './types';

interface ValidationRuleBuilderProps {
  field: BuilderField;
  onUpdate: (validation: BuilderFieldValidation) => void;
}

const VALIDATOR_TYPES: { value: ValidatorType; label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar Number' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'mobile_in', label: 'Indian Mobile' },
  { value: 'ifsc', label: 'IFSC Code' },
  { value: 'pincode_in', label: 'Indian PIN Code' },
  { value: 'email', label: 'Email' },
  { value: 'bank_account_in', label: 'Bank Account (India)' },
];

const TEXT_TYPES = ['text', 'email', 'phone', 'textarea'];

export default function ValidationRuleBuilder({
  field,
  onUpdate,
}: ValidationRuleBuilderProps) {
  const validation = field.validation || {};
  const [patternTestValue, setPatternTestValue] = useState('');

  const update = (updates: Partial<BuilderFieldValidation>) => {
    onUpdate({ ...validation, ...updates });
  };

  // Pattern test result
  let patternMatch: boolean | null = null;
  if (validation.pattern && patternTestValue) {
    try {
      const regex = new RegExp(validation.pattern);
      patternMatch = regex.test(patternTestValue);
    } catch {
      patternMatch = false;
    }
  }

  return (
    <div className="space-y-3">
      {/* minLength / maxLength for text types */}
      {TEXT_TYPES.includes(field.type) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Min Length
            </label>
            <input
              type="number"
              min={0}
              value={validation.minLength ?? ''}
              onChange={(e) =>
                update({
                  minLength: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Minimum length"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Max Length
            </label>
            <input
              type="number"
              min={0}
              value={validation.maxLength ?? ''}
              onChange={(e) =>
                update({
                  maxLength: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Maximum length"
            />
          </div>
        </div>
      )}

      {/* min / max for number */}
      {field.type === 'number' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Min Value
            </label>
            <input
              type="number"
              value={validation.min ?? ''}
              onChange={(e) =>
                update({
                  min: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Minimum value"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Max Value
            </label>
            <input
              type="number"
              value={validation.max ?? ''}
              onChange={(e) =>
                update({
                  max: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Maximum value"
            />
          </div>
        </div>
      )}

      {/* minDate / maxDate for date */}
      {field.type === 'date' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Min Date
            </label>
            <input
              type="date"
              value={validation.minDate ?? ''}
              onChange={(e) =>
                update({ minDate: e.target.value || undefined })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Minimum date"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Max Date
            </label>
            <input
              type="date"
              value={validation.maxDate ?? ''}
              onChange={(e) =>
                update({ maxDate: e.target.value || undefined })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Maximum date"
            />
          </div>
        </div>
      )}

      {/* File constraints */}
      {field.type === 'file' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Max File Size (MB)
            </label>
            <input
              type="number"
              min={0}
              value={validation.maxSizeMB ?? ''}
              onChange={(e) =>
                update({
                  maxSizeMB: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Maximum file size in MB"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Allowed MIME Types
            </label>
            <input
              type="text"
              value={(validation.allowedMimeTypes || []).join(', ')}
              onChange={(e) =>
                update({
                  allowedMimeTypes: e.target.value
                    ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    : undefined,
                })
              }
              placeholder="application/pdf, image/jpeg"
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Allowed MIME types (comma-separated)"
            />
          </div>
        </div>
      )}

      {/* Pattern */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Pattern (Regex)
        </label>
        <input
          type="text"
          value={validation.pattern ?? ''}
          onChange={(e) =>
            update({ pattern: e.target.value || undefined })
          }
          placeholder="e.g., ^[A-Z]{5}[0-9]{4}[A-Z]$"
          className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Validation pattern (regex)"
        />
        {validation.pattern && (
          <div className="mt-1">
            <input
              type="text"
              value={patternTestValue}
              onChange={(e) => setPatternTestValue(e.target.value)}
              placeholder="Test value..."
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Test value for pattern"
            />
            {patternTestValue && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                {patternMatch ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">Matches</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    <span className="text-destructive">Does not match</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validator Type */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Document Validator
        </label>
        <select
          value={field.validatorType || ''}
          onChange={() => {
            // validatorType is on the field, not validation
            // This is handled by the parent via onUpdate
          }}
          className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Document validator type"
        >
          <option value="">None</option>
          {VALIDATOR_TYPES.map((vt) => (
            <option key={vt.value} value={vt.value}>
              {vt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom error message */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Custom Error Message
        </label>
        <input
          type="text"
          value={validation.message ?? ''}
          onChange={(e) =>
            update({ message: e.target.value || undefined })
          }
          placeholder="e.g., Please enter a valid Aadhaar number"
          className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Custom validation error message"
        />
      </div>
    </div>
  );
}
