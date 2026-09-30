/**
 * Unit tests for camera capture validators.
 */

import { describe, it, expect } from 'vitest';
import { cameraPhotoValidator, cameraDocumentValidator } from '../validators';
import type { FormField } from '@serviceformai/form-engine-core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeField(overrides: Partial<FormField> = {}): FormField {
  return {
    id: 'test_field',
    type: 'camera_photo',
    label: 'Test Photo',
    required: true,
    ...overrides,
  };
}

function makeDocumentField(overrides: Partial<FormField> = {}): FormField {
  return {
    id: 'test_doc',
    type: 'camera_document',
    label: 'Test Document',
    required: true,
    ...overrides,
  };
}

function makeValidCapture(overrides: Record<string, unknown> = {}) {
  return {
    base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    width: 640,
    height: 480,
    sizeBytes: 50000,
    mimeType: 'image/jpeg' as const,
    capturedAt: '2024-01-15T10:30:00.000Z',
    jpegQuality: 0.8,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// cameraPhotoValidator
// ---------------------------------------------------------------------------

describe('cameraPhotoValidator', () => {
  it('returns empty array for valid CaptureResult', () => {
    const field = makeField();
    const result = cameraPhotoValidator(makeValidCapture(), {}, field);
    expect(result).toEqual([]);
  });

  it('returns empty array for null value (required check handled elsewhere)', () => {
    const field = makeField();
    const result = cameraPhotoValidator(null, {}, field);
    expect(result).toEqual([]);
  });

  it('returns empty array for undefined value', () => {
    const field = makeField();
    const result = cameraPhotoValidator(undefined, {}, field);
    expect(result).toEqual([]);
  });

  it('returns INVALID_CAPTURE for missing base64', () => {
    const field = makeField();
    const capture = makeValidCapture({ base64: '' });
    const result = cameraPhotoValidator(capture, {}, field);
    expect(result).toHaveLength(1);
    expect(result[0].errorCode).toBe('INVALID_CAPTURE');
  });

  it('returns INVALID_CAPTURE for non-object value', () => {
    const field = makeField();
    const result = cameraPhotoValidator('not-an-object', {}, field);
    expect(result).toHaveLength(1);
    expect(result[0].errorCode).toBe('INVALID_CAPTURE');
    expect(result[0].message).toContain('missing or corrupted');
  });

  it('returns INVALID_CAPTURE for dimensions below minimum', () => {
    const field = makeField();
    const capture = makeValidCapture({ width: 100, height: 100 });
    const result = cameraPhotoValidator(capture, {}, field);
    expect(result).toHaveLength(1);
    expect(result[0].errorCode).toBe('INVALID_CAPTURE');
    expect(result[0].message).toContain('dimensions');
  });

  it('returns INVALID_CAPTURE for size exceeding maximum', () => {
    const field = makeField();
    // Default maxFileSizeMB is 2, so 2 * 1024 * 1024 = 2097152 bytes
    const capture = makeValidCapture({ sizeBytes: 3000000 });
    const result = cameraPhotoValidator(capture, {}, field);
    expect(result).toHaveLength(1);
    expect(result[0].errorCode).toBe('INVALID_CAPTURE');
    expect(result[0].message).toContain('size exceeds');
  });

  it('respects custom config thresholds', () => {
    const field = makeField({
      customConfig: { minWidth: 100, minHeight: 100, maxFileSizeMB: 5 },
    });
    const capture = makeValidCapture({ width: 150, height: 150, sizeBytes: 4000000 });
    const result = cameraPhotoValidator(capture, {}, field);
    expect(result).toEqual([]);
  });

  it('is synchronous (returns value, not a Promise)', () => {
    const field = makeField();
    const result = cameraPhotoValidator(makeValidCapture(), {}, field);
    // If it were a Promise, it would be truthy but not an array
    expect(Array.isArray(result)).toBe(true);
  });

  it('accepts raw base64 starting with /9j/', () => {
    const field = makeField();
    const capture = makeValidCapture({ base64: '/9j/4AAQSkZJRgABAQ==' });
    const result = cameraPhotoValidator(capture, {}, field);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// cameraDocumentValidator
// ---------------------------------------------------------------------------

describe('cameraDocumentValidator', () => {
  it('returns empty array for valid single CaptureResult', () => {
    const field = makeDocumentField();
    const capture = makeValidCapture({ width: 800, height: 600 });
    const result = cameraDocumentValidator(capture, {}, field);
    expect(result).toEqual([]);
  });

  it('returns empty array for null value', () => {
    const field = makeDocumentField();
    const result = cameraDocumentValidator(null, {}, field);
    expect(result).toEqual([]);
  });

  it('validates array length for multi-image fields', () => {
    const field = makeDocumentField({
      customValidation: {
        validatorName: 'camera_document_validator',
        params: { requiredImageCount: 2 },
      },
    });
    const captures = [makeValidCapture({ width: 800, height: 600 })];
    const result = cameraDocumentValidator(captures, {}, field);
    expect(result).toHaveLength(1);
    expect(result[0].errorCode).toBe('INVALID_CAPTURE');
    expect(result[0].message).toContain('Expected 2 images but received 1');
  });

  it('validates each element in array for multi-image fields', () => {
    const field = makeDocumentField({
      customValidation: {
        validatorName: 'camera_document_validator',
        params: { requiredImageCount: 2 },
      },
    });
    const captures = [
      makeValidCapture({ width: 800, height: 600 }),
      makeValidCapture({ width: 100, height: 100 }), // too small
    ];
    const result = cameraDocumentValidator(captures, {}, field);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((e) => e.errorCode === 'INVALID_CAPTURE')).toBe(true);
  });

  it('returns INVALID_CAPTURE when multi-image field receives non-array', () => {
    const field = makeDocumentField({
      customValidation: {
        validatorName: 'camera_document_validator',
        params: { requiredImageCount: 2 },
      },
    });
    const result = cameraDocumentValidator(makeValidCapture({ width: 800, height: 600 }), {}, field);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('single value');
  });

  it('accepts valid multi-image array', () => {
    const field = makeDocumentField({
      customValidation: {
        validatorName: 'camera_document_validator',
        params: { requiredImageCount: 2 },
      },
    });
    const captures = [
      makeValidCapture({ width: 800, height: 600 }),
      makeValidCapture({ width: 800, height: 600 }),
    ];
    const result = cameraDocumentValidator(captures, {}, field);
    expect(result).toEqual([]);
  });

  it('uses document defaults (600x400) for dimension checks', () => {
    const field = makeDocumentField();
    const capture = makeValidCapture({ width: 400, height: 300 });
    const result = cameraDocumentValidator(capture, {}, field);
    expect(result).toHaveLength(1);
    expect(result[0].errorCode).toBe('INVALID_CAPTURE');
    expect(result[0].message).toContain('dimensions');
  });

  it('is synchronous (returns value, not a Promise)', () => {
    const field = makeDocumentField();
    const result = cameraDocumentValidator(makeValidCapture({ width: 800, height: 600 }), {}, field);
    expect(Array.isArray(result)).toBe(true);
  });
});
