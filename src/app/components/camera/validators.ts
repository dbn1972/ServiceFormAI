/**
 * Custom validators for camera capture fields.
 *
 * These validators integrate with the CustomValidatorRegistry from the
 * validation engine. They validate CaptureResult structures produced by
 * CameraPhotoCapture and CameraDocumentCapture components.
 *
 * Both validators are pure synchronous functions compatible with
 * CustomValidatorFn type.
 */

import type { FormField } from '@serviceformai/form-engine-core';
import type { CaptureResult, CameraConfig } from './types';
import { DEFAULT_PHOTO_CONFIG, DEFAULT_DOCUMENT_CONFIG } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidationError {
  field: string;
  errorCode: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a value looks like a valid CaptureResult.
 */
function isCaptureResult(value: unknown): value is CaptureResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.base64 === 'string' &&
    typeof v.width === 'number' &&
    typeof v.height === 'number' &&
    typeof v.sizeBytes === 'number'
  );
}

/**
 * Check if a base64 string looks like valid JPEG data.
 * Accepts both data URI format and raw base64.
 */
function isValidJpegBase64(base64: string): boolean {
  if (!base64 || base64.length === 0) return false;
  // Data URI format
  if (base64.startsWith('data:image/jpeg;base64,')) return true;
  if (base64.startsWith('data:image/jpg;base64,')) return true;
  // Raw base64 starting with JPEG magic bytes (/9j/)
  if (base64.startsWith('/9j/')) return true;
  // Accept any non-empty base64 string (could be from canvas.toDataURL)
  if (base64.startsWith('data:image/')) return true;
  return false;
}

/**
 * Read config thresholds from field.customConfig with fallback to defaults.
 */
function getConfigThresholds(
  field: FormField,
  defaults: CameraConfig,
): { minWidth: number; minHeight: number; maxFileSizeBytes: number } {
  const customConfig = (field.customConfig ?? {}) as Partial<CameraConfig>;
  const minWidth = customConfig.minWidth ?? defaults.minWidth;
  const minHeight = customConfig.minHeight ?? defaults.minHeight;
  const maxFileSizeMB = customConfig.maxFileSizeMB ?? defaults.maxFileSizeMB;
  return {
    minWidth,
    minHeight,
    maxFileSizeBytes: maxFileSizeMB * 1024 * 1024,
  };
}

/**
 * Validate a single CaptureResult against thresholds.
 */
function validateSingleCapture(
  value: unknown,
  fieldId: string,
  thresholds: { minWidth: number; minHeight: number; maxFileSizeBytes: number },
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isCaptureResult(value)) {
    errors.push({
      field: fieldId,
      errorCode: 'INVALID_CAPTURE',
      message: 'Captured image data is missing or corrupted',
    });
    return errors;
  }

  const capture = value as CaptureResult;

  if (!capture.base64 || !isValidJpegBase64(capture.base64)) {
    errors.push({
      field: fieldId,
      errorCode: 'INVALID_CAPTURE',
      message: 'Captured image data is corrupted',
    });
    return errors;
  }

  if (capture.width < thresholds.minWidth || capture.height < thresholds.minHeight) {
    errors.push({
      field: fieldId,
      errorCode: 'INVALID_CAPTURE',
      message: `Captured image dimensions are below minimum (${capture.width}x${capture.height}, required ${thresholds.minWidth}x${thresholds.minHeight})`,
    });
  }

  if (capture.sizeBytes > thresholds.maxFileSizeBytes) {
    errors.push({
      field: fieldId,
      errorCode: 'INVALID_CAPTURE',
      message: `Captured image size exceeds maximum (${capture.sizeBytes} bytes, limit ${thresholds.maxFileSizeBytes} bytes)`,
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Validates a CaptureResult from a camera_photo field.
 *
 * Checks:
 * - base64 string present and valid JPEG
 * - dimensions >= configured minimum
 * - size <= configured maximum
 *
 * Returns empty array for null/undefined values (required check is handled
 * by the validation engine's built-in required validator).
 */
export function cameraPhotoValidator(
  value: unknown,
  _formData: Record<string, unknown>,
  field: FormField,
): ValidationError[] {
  // Skip validation for empty values — the required validator handles that
  if (value === null || value === undefined || value === '') {
    return [];
  }

  const thresholds = getConfigThresholds(field, DEFAULT_PHOTO_CONFIG);
  return validateSingleCapture(value, field.id, thresholds);
}

/**
 * Validates a CaptureResult (or CaptureResult[]) from a camera_document field.
 *
 * Checks:
 * - base64 string present and valid JPEG
 * - dimensions >= configured minimum
 * - size <= configured maximum
 * - For multi-image fields: array length matches requiredImageCount
 *
 * Returns empty array for null/undefined values.
 */
export function cameraDocumentValidator(
  value: unknown,
  _formData: Record<string, unknown>,
  field: FormField,
): ValidationError[] {
  // Skip validation for empty values
  if (value === null || value === undefined || value === '') {
    return [];
  }

  const thresholds = getConfigThresholds(field, DEFAULT_DOCUMENT_CONFIG);
  const requiredImageCount =
    (field.customValidation?.params?.requiredImageCount as number) ?? 0;

  // Multi-image validation
  if (requiredImageCount > 1) {
    const errors: ValidationError[] = [];

    if (!Array.isArray(value)) {
      errors.push({
        field: field.id,
        errorCode: 'INVALID_CAPTURE',
        message: `Expected ${requiredImageCount} images but received a single value`,
      });
      return errors;
    }

    if (value.length !== requiredImageCount) {
      errors.push({
        field: field.id,
        errorCode: 'INVALID_CAPTURE',
        message: `Expected ${requiredImageCount} images but received ${value.length}`,
      });
      return errors;
    }

    // Validate each element
    for (let i = 0; i < value.length; i++) {
      const elementErrors = validateSingleCapture(value[i], field.id, thresholds);
      errors.push(...elementErrors);
    }

    return errors;
  }

  // Single image validation (or array with single element)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }
    // Validate each element in the array
    const errors: ValidationError[] = [];
    for (const item of value) {
      errors.push(...validateSingleCapture(item, field.id, thresholds));
    }
    return errors;
  }

  return validateSingleCapture(value, field.id, thresholds);
}
