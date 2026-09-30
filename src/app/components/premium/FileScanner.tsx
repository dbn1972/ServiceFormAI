/**
 * FileScanner — Premium custom component for camera-based document scanning.
 *
 * Renders a camera capture interface and emits the scanned image as a
 * base64-encoded string with metadata (file size, MIME type) as the field value.
 *
 * Implements CustomFieldProps interface.
 * Registers a `file_scan_format` custom validator.
 */

import { useRef, useState, useCallback } from 'react';
import type { CustomFieldProps } from '../../types/customComponent';
import { AlertCircle, Camera, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Scan result type
// ---------------------------------------------------------------------------

export interface ScanResult {
  data: string; // base64-encoded image data
  mimeType: string;
  fileSize: number; // bytes
  capturedAt: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validates that a file scan value has the expected structure.
 * Registered as `file_scan_format` in the CustomValidatorRegistry.
 */
export function fileScanFormatValidator(
  value: unknown,
): Array<{ field: string; errorCode: string; message: string }> {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (typeof value !== 'object') {
    return [
      {
        field: '',
        errorCode: 'FILE_SCAN_INVALID_FORMAT',
        message: 'Scanned file must be an object with data, mimeType, and fileSize',
      },
    ];
  }

  const scan = value as Record<string, unknown>;
  const errors: Array<{ field: string; errorCode: string; message: string }> = [];

  if (typeof scan.data !== 'string' || !scan.data) {
    errors.push({
      field: '',
      errorCode: 'FILE_SCAN_MISSING_DATA',
      message: 'Scanned file is missing image data',
    });
  }

  if (typeof scan.mimeType !== 'string' || !scan.mimeType) {
    errors.push({
      field: '',
      errorCode: 'FILE_SCAN_MISSING_MIME',
      message: 'Scanned file is missing MIME type',
    });
  }

  if (typeof scan.fileSize !== 'number' || scan.fileSize <= 0) {
    errors.push({
      field: '',
      errorCode: 'FILE_SCAN_INVALID_SIZE',
      message: 'Scanned file has invalid file size',
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FileScanner({
  field,
  fieldId,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: CustomFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(
    value && typeof value === 'object' ? (value as ScanResult).data ?? null : null,
  );
  const [capturing, setCapturing] = useState(false);

  const handleCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setCapturing(true);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const scanResult: ScanResult = {
          data: base64,
          mimeType: file.type || 'image/jpeg',
          fileSize: file.size,
          capturedAt: new Date().toISOString(),
        };

        setPreview(base64);
        onChange(scanResult);
        onBlur();
        setCapturing(false);
      };
      reader.onerror = () => {
        setCapturing(false);
      };
      reader.readAsDataURL(file);
    },
    [onChange, onBlur],
  );

  const clearCapture = useCallback(() => {
    setPreview(null);
    onChange(null);
    onBlur();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange, onBlur]);

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

      {preview ? (
        <div className="relative border rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Scanned document preview"
            className="w-full max-h-64 object-contain bg-muted"
          />
          <button
            type="button"
            onClick={clearCapture}
            disabled={disabled}
            className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
            aria-label="Remove scanned document"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            hasError
              ? 'border-destructive hover:border-destructive'
              : 'border-border hover:border-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Camera
            className="w-10 h-10 text-muted-foreground mx-auto mb-3"
            aria-hidden="true"
          />
          <label className="cursor-pointer">
            <span className="text-sm text-primary font-medium">
              {capturing ? 'Processing...' : 'Capture Document'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              disabled={disabled || capturing}
              aria-label="Capture document using camera"
              aria-describedby={field.helpText ? `${fieldId}-help` : undefined}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Use your camera to scan a document
          </p>
        </div>
      )}

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
