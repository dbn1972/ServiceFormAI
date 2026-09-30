import { validateField } from './field-validators';
import type { FormField } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal text field factory. */
function textField(overrides: Partial<FormField> = {}): FormField {
  return {
    id: 'name',
    type: 'text',
    label: 'Name',
    required: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// required
// ---------------------------------------------------------------------------

describe('required check', () => {
  const field = textField({ required: true });

  it('returns REQUIRED when value is undefined', () => {
    const errors = validateField(field, undefined);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'REQUIRED' }),
      ]),
    );
  });

  it('returns REQUIRED when value is null', () => {
    const errors = validateField(field, null);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'REQUIRED' }),
      ]),
    );
  });

  it('returns REQUIRED when value is empty string', () => {
    const errors = validateField(field, '');
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'REQUIRED' }),
      ]),
    );
  });

  it('does not return REQUIRED when value is present', () => {
    const errors = validateField(field, 'Alice');
    expect(errors.find((e) => e.errorCode === 'REQUIRED')).toBeUndefined();
  });

  it('does not return REQUIRED when field is not required and value is empty', () => {
    const optional = textField({ required: false });
    const errors = validateField(optional, '');
    expect(errors).toHaveLength(0);
  });

  it('includes the field label in the error message', () => {
    const errors = validateField(field, null);
    expect(errors[0].message).toContain('Name');
  });
});

// ---------------------------------------------------------------------------
// minLength / maxLength
// ---------------------------------------------------------------------------

describe('minLength / maxLength', () => {
  const field = textField({
    validation: { minLength: 3, maxLength: 10 },
  });

  it('returns MIN_LENGTH when string is too short', () => {
    const errors = validateField(field, 'ab');
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'MIN_LENGTH' }),
      ]),
    );
  });

  it('returns MAX_LENGTH when string is too long', () => {
    const errors = validateField(field, 'a'.repeat(11));
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'MAX_LENGTH' }),
      ]),
    );
  });

  it('passes when string length is within bounds', () => {
    const errors = validateField(field, 'hello');
    expect(errors).toHaveLength(0);
  });

  it('passes at exact minLength boundary', () => {
    const errors = validateField(field, 'abc');
    expect(errors).toHaveLength(0);
  });

  it('passes at exact maxLength boundary', () => {
    const errors = validateField(field, 'a'.repeat(10));
    expect(errors).toHaveLength(0);
  });

  it('skips length checks when value is empty and field is optional', () => {
    const errors = validateField(field, '');
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// min / max (numeric)
// ---------------------------------------------------------------------------

describe('min / max numeric checks', () => {
  const field: FormField = {
    id: 'age',
    type: 'number',
    label: 'Age',
    required: false,
    validation: { min: 18, max: 120 },
  };

  it('returns MIN_VALUE when number is below min', () => {
    const errors = validateField(field, 10);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'MIN_VALUE' }),
      ]),
    );
  });

  it('returns MAX_VALUE when number is above max', () => {
    const errors = validateField(field, 200);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'MAX_VALUE' }),
      ]),
    );
  });

  it('passes when number is within range', () => {
    const errors = validateField(field, 25);
    expect(errors).toHaveLength(0);
  });

  it('passes at exact min boundary', () => {
    const errors = validateField(field, 18);
    expect(errors).toHaveLength(0);
  });

  it('passes at exact max boundary', () => {
    const errors = validateField(field, 120);
    expect(errors).toHaveLength(0);
  });

  it('returns MIN_VALUE for NaN input when min is set', () => {
    const errors = validateField(field, 'not-a-number');
    expect(errors.some((e) => e.errorCode === 'MIN_VALUE')).toBe(true);
  });

  it('handles string numbers correctly', () => {
    const errors = validateField(field, '25');
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// pattern (regex)
// ---------------------------------------------------------------------------

describe('pattern check', () => {
  const field = textField({
    validation: { pattern: '^[A-Z]+$' },
  });

  it('returns PATTERN_MISMATCH when value does not match', () => {
    const errors = validateField(field, 'abc');
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'PATTERN_MISMATCH' }),
      ]),
    );
  });

  it('passes when value matches the pattern', () => {
    const errors = validateField(field, 'ABC');
    expect(errors).toHaveLength(0);
  });

  it('returns PATTERN_MISMATCH for invalid regex gracefully', () => {
    const badField = textField({
      validation: { pattern: '[invalid(' },
    });
    const errors = validateField(badField, 'anything');
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'PATTERN_MISMATCH' }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// options (dropdown / radio)
// ---------------------------------------------------------------------------

describe('options check', () => {
  const field: FormField = {
    id: 'color',
    type: 'dropdown',
    label: 'Favourite Colour',
    required: false,
    options: [
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
    ],
  };

  it('returns INVALID_OPTION when value is not in options', () => {
    const errors = validateField(field, 'green');
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'INVALID_OPTION' }),
      ]),
    );
  });

  it('passes when value is a valid option', () => {
    const errors = validateField(field, 'red');
    expect(errors).toHaveLength(0);
  });

  it('works for radio type as well', () => {
    const radioField: FormField = { ...field, type: 'radio' };
    const errors = validateField(radioField, 'green');
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'INVALID_OPTION' }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// minDate / maxDate
// ---------------------------------------------------------------------------

describe('date range check', () => {
  const field: FormField = {
    id: 'dob',
    type: 'date',
    label: 'Date of Birth',
    required: false,
    validation: {
      minDate: '2000-01-01',
      maxDate: '2024-12-31',
    },
  };

  it('returns DATE_OUT_OF_RANGE when date is before minDate', () => {
    const errors = validateField(field, '1999-06-15');
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'DATE_OUT_OF_RANGE' }),
      ]),
    );
  });

  it('returns DATE_OUT_OF_RANGE when date is after maxDate', () => {
    const errors = validateField(field, '2025-03-01');
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'DATE_OUT_OF_RANGE' }),
      ]),
    );
  });

  it('passes when date is within range', () => {
    const errors = validateField(field, '2020-06-15');
    expect(errors).toHaveLength(0);
  });

  it('passes at exact minDate boundary', () => {
    const errors = validateField(field, '2000-01-01');
    expect(errors).toHaveLength(0);
  });

  it('passes at exact maxDate boundary', () => {
    const errors = validateField(field, '2024-12-31');
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// file: maxSizeMB / allowedMimeTypes
// ---------------------------------------------------------------------------

describe('file validation', () => {
  const field: FormField = {
    id: 'doc',
    type: 'file',
    label: 'Document',
    required: false,
    validation: {
      maxSizeMB: 5,
      allowedMimeTypes: ['application/pdf', 'image/png'],
    },
  };

  it('returns FILE_TOO_LARGE when file exceeds maxSizeMB', () => {
    const file = { size: 6 * 1024 * 1024, type: 'application/pdf' };
    const errors = validateField(field, file);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'FILE_TOO_LARGE' }),
      ]),
    );
  });

  it('returns INVALID_FILE_TYPE when MIME type is not allowed', () => {
    const file = { size: 1024, type: 'text/plain' };
    const errors = validateField(field, file);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'INVALID_FILE_TYPE' }),
      ]),
    );
  });

  it('passes when file is within size and has allowed MIME type', () => {
    const file = { size: 1024, type: 'application/pdf' };
    const errors = validateField(field, file);
    expect(errors).toHaveLength(0);
  });

  it('returns both FILE_TOO_LARGE and INVALID_FILE_TYPE when both violated', () => {
    const file = { size: 10 * 1024 * 1024, type: 'text/plain' };
    const errors = validateField(field, file);
    expect(errors.some((e) => e.errorCode === 'FILE_TOO_LARGE')).toBe(true);
    expect(errors.some((e) => e.errorCode === 'INVALID_FILE_TYPE')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// No short-circuiting — collect ALL errors
// ---------------------------------------------------------------------------

describe('no short-circuiting', () => {
  it('collects multiple errors for a single field', () => {
    const field = textField({
      required: true,
      validation: { minLength: 5, pattern: '^[A-Z]+$' },
    });
    // Value "ab" violates minLength AND pattern
    const errors = validateField(field, 'ab');
    expect(errors.some((e) => e.errorCode === 'MIN_LENGTH')).toBe(true);
    expect(errors.some((e) => e.errorCode === 'PATTERN_MISMATCH')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('returns empty errors for optional field with no value', () => {
    const field = textField({ required: false });
    expect(validateField(field, undefined)).toHaveLength(0);
    expect(validateField(field, null)).toHaveLength(0);
    expect(validateField(field, '')).toHaveLength(0);
  });

  it('field id is included in every error', () => {
    const field = textField({ id: 'myField', required: true });
    const errors = validateField(field, null);
    errors.forEach((e) => expect(e.field).toBe('myField'));
  });
});
