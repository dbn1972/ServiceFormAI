import { validateSchema } from './schema-validator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid schema factory. */
function validSchema(overrides: Record<string, unknown> = {}) {
  return {
    version: '1.0',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
    ],
    ...overrides,
  };
}

/** Minimal valid field factory. */
function field(overrides: Record<string, unknown> = {}) {
  return { id: 'f1', type: 'text', label: 'Field 1', required: false, ...overrides };
}

// ---------------------------------------------------------------------------
// Top-level property checks
// ---------------------------------------------------------------------------

describe('required top-level properties', () => {
  it('returns valid for a minimal valid schema', () => {
    const result = validateSchema(validSchema());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects null input', () => {
    const result = validateSchema(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_MISSING_PROPERTY' }),
      ]),
    );
  });

  it('rejects non-object input (string)', () => {
    const result = validateSchema('not an object');
    expect(result.valid).toBe(false);
    expect(result.errors[0].errorCode).toBe('SCHEMA_MISSING_PROPERTY');
  });

  it('rejects non-object input (array)', () => {
    const result = validateSchema([]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].errorCode).toBe('SCHEMA_MISSING_PROPERTY');
  });

  it('rejects schema missing "version"', () => {
    const result = validateSchema({ fields: [field()] });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_MISSING_PROPERTY',
          message: expect.stringContaining('version'),
        }),
      ]),
    );
  });

  it('rejects schema with empty string "version"', () => {
    const result = validateSchema({ version: '', fields: [field()] });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_MISSING_PROPERTY',
          message: expect.stringContaining('version'),
        }),
      ]),
    );
  });

  it('rejects schema missing "fields"', () => {
    const result = validateSchema({ version: '1.0' });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_MISSING_PROPERTY',
          message: expect.stringContaining('fields'),
        }),
      ]),
    );
  });

  it('rejects schema where "fields" is not an array', () => {
    const result = validateSchema({ version: '1.0', fields: 'not-array' });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_MISSING_PROPERTY',
          message: expect.stringContaining('fields'),
        }),
      ]),
    );
  });

  it('reports both missing version and missing fields', () => {
    const result = validateSchema({});
    expect(result.valid).toBe(false);
    const codes = result.errors.map((e) => e.errorCode);
    expect(codes.filter((c) => c === 'SCHEMA_MISSING_PROPERTY').length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Field-level structural checks
// ---------------------------------------------------------------------------

describe('field structural validation', () => {
  it('rejects field missing "id"', () => {
    const result = validateSchema(validSchema({
      fields: [{ type: 'text', label: 'Name', required: true }],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_INVALID_FIELD' }),
      ]),
    );
  });

  it('rejects field with empty "id"', () => {
    const result = validateSchema(validSchema({
      fields: [{ id: '', type: 'text', label: 'Name', required: true }],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_INVALID_FIELD' }),
      ]),
    );
  });

  it('rejects field missing "type"', () => {
    const result = validateSchema(validSchema({
      fields: [{ id: 'f1', label: 'Name', required: true }],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_INVALID_FIELD' }),
      ]),
    );
  });

  it('rejects field with unsupported "type"', () => {
    const result = validateSchema(validSchema({
      fields: [{ id: 'f1', type: 'color', label: 'Colour', required: false }],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_INVALID_FIELD',
          fieldId: 'f1',
        }),
      ]),
    );
  });

  it('rejects field missing "label"', () => {
    const result = validateSchema(validSchema({
      fields: [{ id: 'f1', type: 'text', required: true }],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_INVALID_FIELD' }),
      ]),
    );
  });

  it('rejects field with empty "label"', () => {
    const result = validateSchema(validSchema({
      fields: [{ id: 'f1', type: 'text', label: '  ', required: true }],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_INVALID_FIELD' }),
      ]),
    );
  });

  it('rejects non-object field entries', () => {
    const result = validateSchema(validSchema({
      fields: ['not-a-field'],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_INVALID_FIELD' }),
      ]),
    );
  });

  it('collects multiple field errors without short-circuiting', () => {
    const result = validateSchema(validSchema({
      fields: [
        { id: '', type: 'unknown', label: '' },
        { id: 'f2', type: 'text', label: '' },
      ],
    }));
    expect(result.valid).toBe(false);
    // At least 3 errors: empty id, unsupported type, empty label for first field + empty label for second
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('accepts all supported field types', () => {
    const types = ['text', 'number', 'email', 'phone', 'date', 'dropdown', 'radio', 'checkbox', 'file', 'textarea'];
    const fields = types.map((t, i) => ({
      id: `f${i}`,
      type: t,
      label: `Field ${i}`,
      required: false,
    }));
    const result = validateSchema({ version: '1.0', fields });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Duplicate field IDs
// ---------------------------------------------------------------------------

describe('duplicate field IDs', () => {
  it('detects duplicate field IDs', () => {
    const result = validateSchema(validSchema({
      fields: [
        field({ id: 'dup' }),
        field({ id: 'dup' }),
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_DUPLICATE_FIELD_ID',
          fieldId: 'dup',
        }),
      ]),
    );
  });

  it('allows unique field IDs', () => {
    const result = validateSchema(validSchema({
      fields: [
        field({ id: 'a' }),
        field({ id: 'b' }),
      ],
    }));
    expect(result.valid).toBe(true);
  });

  it('reports each duplicate occurrence', () => {
    const result = validateSchema(validSchema({
      fields: [
        field({ id: 'x' }),
        field({ id: 'x' }),
        field({ id: 'x' }),
      ],
    }));
    const dupErrors = result.errors.filter((e) => e.errorCode === 'SCHEMA_DUPLICATE_FIELD_ID');
    // Second and third occurrences are flagged
    expect(dupErrors.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Conditional clause references
// ---------------------------------------------------------------------------

describe('conditional clause references', () => {
  it('rejects conditional referencing non-existent field', () => {
    const result = validateSchema(validSchema({
      fields: [
        field({ id: 'f1', conditional: { field: 'ghost', operator: 'equals', value: 'yes' } }),
      ],
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_INVALID_CONDITIONAL_REF',
          fieldId: 'f1',
        }),
      ]),
    );
  });

  it('accepts conditional referencing existing field', () => {
    const result = validateSchema(validSchema({
      fields: [
        field({ id: 'trigger' }),
        field({ id: 'dependent', conditional: { field: 'trigger', operator: 'equals', value: 'yes' } }),
      ],
    }));
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cross-field rule references
// ---------------------------------------------------------------------------

describe('cross-field rule references', () => {
  it('rejects cross-field rule referencing non-existent field in fields array', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [field({ id: 'a' })],
      crossFieldRules: [
        { type: 'match', fields: ['a', 'ghost'] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_INVALID_CROSS_FIELD_REF' }),
      ]),
    );
  });

  it('rejects cross-field rule with non-existent targetField', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [field({ id: 'a' }), field({ id: 'b' })],
      crossFieldRules: [
        { type: 'match', fields: ['a', 'b'], targetField: 'missing' },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'SCHEMA_INVALID_CROSS_FIELD_REF' }),
      ]),
    );
  });

  it('accepts cross-field rules referencing existing fields', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [field({ id: 'a' }), field({ id: 'b' })],
      crossFieldRules: [
        { type: 'match', fields: ['a', 'b'], targetField: 'a' },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('skips cross-field rule validation when crossFieldRules is absent', () => {
    const result = validateSchema(validSchema());
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Step field references
// ---------------------------------------------------------------------------

describe('step field references', () => {
  it('rejects step referencing non-existent field', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [field({ id: 'a' })],
      steps: [
        { id: 'step1', label: 'Step 1', fieldIds: ['a', 'ghost'] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_STEP_FIELD_NOT_FOUND',
        }),
      ]),
    );
  });

  it('accepts steps referencing existing fields', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [field({ id: 'a' }), field({ id: 'b' })],
      steps: [
        { id: 'step1', label: 'Step 1', fieldIds: ['a', 'b'] },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('skips step validation when steps is absent', () => {
    const result = validateSchema(validSchema());
    expect(result.valid).toBe(true);
  });

  it('reports multiple missing step field references', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [field({ id: 'a' })],
      steps: [
        { id: 'step1', label: 'Step 1', fieldIds: ['missing1', 'missing2'] },
      ],
    });
    const stepErrors = result.errors.filter((e) => e.errorCode === 'SCHEMA_STEP_FIELD_NOT_FOUND');
    expect(stepErrors.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Collects ALL errors (no short-circuiting)
// ---------------------------------------------------------------------------

describe('collects all errors', () => {
  it('reports field errors, duplicate IDs, bad conditional refs, bad cross-field refs, and bad step refs together', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [
        { id: 'a', type: 'text', label: 'A', required: false },
        { id: 'a', type: 'text', label: 'A dup', required: false }, // duplicate
        { id: 'b', type: 'text', label: 'B', required: false, conditional: { field: 'nope', operator: 'equals', value: 'x' } }, // bad conditional
        { id: '', type: 'unknown', label: '' }, // invalid field (3 errors: id, type, label)
      ],
      crossFieldRules: [
        { type: 'match', fields: ['a', 'phantom'] }, // bad cross-field ref
      ],
      steps: [
        { id: 's1', label: 'S1', fieldIds: ['a', 'vanished'] }, // bad step ref
      ],
    });

    expect(result.valid).toBe(false);

    const codes = result.errors.map((e) => e.errorCode);
    expect(codes).toContain('SCHEMA_DUPLICATE_FIELD_ID');
    expect(codes).toContain('SCHEMA_INVALID_CONDITIONAL_REF');
    expect(codes).toContain('SCHEMA_INVALID_CROSS_FIELD_REF');
    expect(codes).toContain('SCHEMA_STEP_FIELD_NOT_FOUND');
    expect(codes).toContain('SCHEMA_INVALID_FIELD');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('accepts schema with empty fields array (no fields to validate)', () => {
    const result = validateSchema({ version: '1.0', fields: [] });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('handles undefined input', () => {
    const result = validateSchema(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors[0].errorCode).toBe('SCHEMA_MISSING_PROPERTY');
  });

  it('handles numeric input', () => {
    const result = validateSchema(42);
    expect(result.valid).toBe(false);
  });

  it('error messages are non-empty strings', () => {
    const result = validateSchema({});
    for (const err of result.errors) {
      expect(typeof err.errorCode).toBe('string');
      expect(err.errorCode.length).toBeGreaterThan(0);
      expect(typeof err.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
    }
  });
});


// ---------------------------------------------------------------------------
// Custom field type validation (registeredCustomTypes parameter)
// ---------------------------------------------------------------------------

describe('custom field type validation with registeredCustomTypes', () => {
  it('accepts a registered custom field type', () => {
    const customTypes = new Set(['address_picker']);
    const result = validateSchema(
      {
        version: '1.0',
        fields: [
          { id: 'addr', type: 'address_picker', label: 'Address', required: true },
        ],
      },
      customTypes,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an unregistered custom field type with SCHEMA_UNKNOWN_CUSTOM_FIELD_TYPE', () => {
    const customTypes = new Set(['address_picker']);
    const result = validateSchema(
      {
        version: '1.0',
        fields: [
          { id: 'sig', type: 'signature_pad', label: 'Signature', required: false },
        ],
      },
      customTypes,
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_UNKNOWN_CUSTOM_FIELD_TYPE',
          fieldId: 'sig',
        }),
      ]),
    );
  });

  it('still accepts built-in types when registeredCustomTypes is provided', () => {
    const customTypes = new Set(['address_picker']);
    const result = validateSchema(
      {
        version: '1.0',
        fields: [
          { id: 'name', type: 'text', label: 'Name', required: true },
          { id: 'addr', type: 'address_picker', label: 'Address', required: true },
        ],
      },
      customTypes,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts mix of built-in and registered custom types', () => {
    const customTypes = new Set(['address_picker', 'signature_pad']);
    const result = validateSchema(
      {
        version: '1.0',
        fields: [
          { id: 'name', type: 'text', label: 'Name', required: true },
          { id: 'addr', type: 'address_picker', label: 'Address', required: true },
          { id: 'sig', type: 'signature_pad', label: 'Signature', required: false },
        ],
      },
      customTypes,
    );
    expect(result.valid).toBe(true);
  });

  it('rejects unregistered custom type with empty registeredCustomTypes set', () => {
    const customTypes = new Set<string>();
    const result = validateSchema(
      {
        version: '1.0',
        fields: [
          { id: 'f1', type: 'custom_widget', label: 'Widget', required: false },
        ],
      },
      customTypes,
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_UNKNOWN_CUSTOM_FIELD_TYPE',
        }),
      ]),
    );
  });

  it('without registeredCustomTypes, unknown types are rejected with SCHEMA_INVALID_FIELD (backward compat)', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [
        { id: 'f1', type: 'color', label: 'Colour', required: false },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_INVALID_FIELD',
          fieldId: 'f1',
        }),
      ]),
    );
  });

  it('includes field ID in SCHEMA_UNKNOWN_CUSTOM_FIELD_TYPE error', () => {
    const customTypes = new Set<string>();
    const result = validateSchema(
      {
        version: '1.0',
        fields: [
          { id: 'my_field', type: 'unknown_custom', label: 'Unknown', required: false },
        ],
      },
      customTypes,
    );
    const customError = result.errors.find(
      (e) => e.errorCode === 'SCHEMA_UNKNOWN_CUSTOM_FIELD_TYPE',
    );
    expect(customError).toBeDefined();
    expect(customError!.fieldId).toBe('my_field');
    expect(customError!.message).toContain('unknown_custom');
  });
});

// ---------------------------------------------------------------------------
// Custom field properties in schema (customConfig, customValidation)
// ---------------------------------------------------------------------------

describe('schemas with custom field properties', () => {
  it('accepts schema with customConfig and customValidation on custom fields', () => {
    const customTypes = new Set(['address_picker']);
    const result = validateSchema(
      {
        version: '1.0',
        fields: [
          {
            id: 'addr',
            type: 'address_picker',
            label: 'Address',
            required: true,
            customConfig: { mapProvider: 'google', country: 'IN' },
            customValidation: {
              validatorName: 'address_structure',
              params: { requirePostalCode: true },
            },
          },
        ],
      },
      customTypes,
    );
    expect(result.valid).toBe(true);
  });
});
