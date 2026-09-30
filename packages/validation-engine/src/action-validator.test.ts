import { validateActions } from './action-validator';
import { validateSchema } from './schema-validator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fieldIds = new Set(['field1', 'field2', 'field3', 'btn1']);

/** Minimal valid action factory. */
function validAction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'action1',
    event: 'onFieldChange',
    targetId: 'field1',
    code: 'setFieldValue("field2", 42)',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Valid actions
// ---------------------------------------------------------------------------

describe('validateActions — valid actions', () => {
  it('accepts a minimal valid action', () => {
    const result = validateActions([validAction()], fieldIds);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts onFormLoad without targetId', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code: 'setFieldValue("field1", "hello")' },
    ], fieldIds);
    expect(result.valid).toBe(true);
  });

  it('accepts onFormSubmit without targetId', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFormSubmit', code: 'setFieldValue("field1", "hello")' },
    ], fieldIds);
    expect(result.valid).toBe(true);
  });

  it('accepts multiple valid actions with unique IDs', () => {
    const result = validateActions([
      validAction({ id: 'a1', targetId: 'field1' }),
      validAction({ id: 'a2', targetId: 'field2' }),
    ], fieldIds);
    expect(result.valid).toBe(true);
  });

  it('accepts all five event types', () => {
    const actions = [
      { id: 'a1', event: 'onFieldChange', targetId: 'field1', code: 'var x = 1' },
      { id: 'a2', event: 'onFieldBlur', targetId: 'field2', code: 'var x = 2' },
      { id: 'a3', event: 'onFormLoad', code: 'var x = 3' },
      { id: 'a4', event: 'onFormSubmit', code: 'var x = 4' },
      { id: 'a5', event: 'onButtonClick', targetId: 'btn1', code: 'var x = 5' },
    ];
    const result = validateActions(actions, fieldIds);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Required property checks
// ---------------------------------------------------------------------------

describe('validateActions — required properties', () => {
  it('rejects action missing id', () => {
    const result = validateActions([
      { event: 'onFormLoad', code: 'var x = 1' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining('missing a non-empty "id"') }),
      ]),
    );
  });

  it('rejects action with empty id', () => {
    const result = validateActions([
      { id: '', event: 'onFormLoad', code: 'var x = 1' },
    ], fieldIds);
    expect(result.valid).toBe(false);
  });

  it('rejects action missing event', () => {
    const result = validateActions([
      { id: 'a1', code: 'var x = 1' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'INVALID_ACTION_EVENT' }),
      ]),
    );
  });

  it('rejects action missing code', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'ACTION_SYNTAX_ERROR' }),
      ]),
    );
  });

  it('rejects non-object action entries', () => {
    const result = validateActions(['not-an-object', 42, null] as unknown[], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Duplicate ID detection
// ---------------------------------------------------------------------------

describe('validateActions — duplicate IDs', () => {
  it('detects duplicate action IDs', () => {
    const result = validateActions([
      validAction({ id: 'dup' }),
      validAction({ id: 'dup' }),
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'DUPLICATE_ACTION_ID',
          actionId: 'dup',
        }),
      ]),
    );
  });

  it('reports each duplicate occurrence', () => {
    const result = validateActions([
      validAction({ id: 'x' }),
      validAction({ id: 'x' }),
      validAction({ id: 'x' }),
    ], fieldIds);
    const dupErrors = result.errors.filter(e => e.errorCode === 'DUPLICATE_ACTION_ID');
    expect(dupErrors.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Event validation
// ---------------------------------------------------------------------------

describe('validateActions — event validation', () => {
  it('rejects invalid event type', () => {
    const result = validateActions([
      { id: 'a1', event: 'onHover', code: 'var x = 1' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'INVALID_ACTION_EVENT' }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// Target ID validation
// ---------------------------------------------------------------------------

describe('validateActions — targetId validation', () => {
  it('rejects onFieldChange with missing targetId', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFieldChange', code: 'var x = 1' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'ACTION_TARGET_NOT_FOUND' }),
      ]),
    );
  });

  it('rejects onFieldBlur with non-existent targetId', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFieldBlur', targetId: 'ghost', code: 'var x = 1' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'ACTION_TARGET_NOT_FOUND' }),
      ]),
    );
  });

  it('rejects onButtonClick with non-existent targetId', () => {
    const result = validateActions([
      { id: 'a1', event: 'onButtonClick', targetId: 'nonexistent', code: 'var x = 1' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'ACTION_TARGET_NOT_FOUND' }),
      ]),
    );
  });

  it('ignores targetId for onFormLoad', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', targetId: 'ghost', code: 'var x = 1' },
    ], fieldIds);
    // Should not produce ACTION_TARGET_NOT_FOUND for onFormLoad
    const targetErrors = result.errors.filter(e => e.errorCode === 'ACTION_TARGET_NOT_FOUND');
    expect(targetErrors).toHaveLength(0);
  });

  it('ignores targetId for onFormSubmit', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFormSubmit', targetId: 'ghost', code: 'var x = 1' },
    ], fieldIds);
    const targetErrors = result.errors.filter(e => e.errorCode === 'ACTION_TARGET_NOT_FOUND');
    expect(targetErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Code length validation
// ---------------------------------------------------------------------------

describe('validateActions — code length', () => {
  it('rejects code exceeding 10,000 characters', () => {
    const longCode = 'var x = 1;\n'.repeat(1500); // well over 10k
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code: longCode },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'ACTION_CODE_TOO_LONG' }),
      ]),
    );
  });

  it('accepts code at exactly 10,000 characters', () => {
    const code = 'x'.repeat(10_000);
    // This is syntactically valid JS (just an identifier expression)
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code },
    ], fieldIds);
    const lengthErrors = result.errors.filter(e => e.errorCode === 'ACTION_CODE_TOO_LONG');
    expect(lengthErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Syntax validation
// ---------------------------------------------------------------------------

describe('validateActions — syntax validation', () => {
  it('rejects syntactically invalid JavaScript', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code: 'function( { broken' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'ACTION_SYNTAX_ERROR',
          details: expect.any(String),
        }),
      ]),
    );
  });

  it('accepts syntactically valid JavaScript', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code: 'var x = 1; if (x > 0) { x = 2; }' },
    ], fieldIds);
    const syntaxErrors = result.errors.filter(e => e.errorCode === 'ACTION_SYNTAX_ERROR');
    expect(syntaxErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Prohibited construct detection
// ---------------------------------------------------------------------------

describe('validateActions — prohibited constructs', () => {
  const prohibitedIds = [
    'eval', 'Function', 'XMLHttpRequest', 'fetch', 'importScripts',
    'postMessage', 'localStorage', 'sessionStorage', 'document', 'window',
    'globalThis', 'self', 'top', 'parent', 'frames', 'navigator',
    'location', 'history', 'crypto', 'WebSocket', 'Worker',
    'SharedWorker', 'ServiceWorker',
  ];

  it.each(prohibitedIds)('detects prohibited identifier: %s', (identifier) => {
    const code = `var result = ${identifier};`;
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code },
    ], fieldIds);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'ACTION_PROHIBITED_CONSTRUCT',
          details: identifier,
        }),
      ]),
    );
  });

  it('does not flag identifiers that are substrings of allowed words', () => {
    // "fetchData" contains "fetch" but should not be flagged
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code: 'var fetchData = 1; var evaluator = 2;' },
    ], fieldIds);
    const prohibitedErrors = result.errors.filter(e => e.errorCode === 'ACTION_PROHIBITED_CONSTRUCT');
    expect(prohibitedErrors).toHaveLength(0);
  });

  it('detects multiple prohibited identifiers in one action', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code: 'var a = window; var b = document;' },
    ], fieldIds);
    const prohibitedErrors = result.errors.filter(e => e.errorCode === 'ACTION_PROHIBITED_CONSTRUCT');
    expect(prohibitedErrors.length).toBeGreaterThanOrEqual(2);
    const details = prohibitedErrors.map(e => e.details);
    expect(details).toContain('window');
    expect(details).toContain('document');
  });
});

// ---------------------------------------------------------------------------
// Injection pattern detection
// ---------------------------------------------------------------------------

describe('validateActions — injection patterns', () => {
  it('detects encoded prohibited identifiers in string literals', () => {
    // \x65val decodes to "eval"
    const code = 'var x = "\\x65val"';
    const result = validateActions([
      { id: 'a1', event: 'onFormLoad', code },
    ], fieldIds);
    const prohibitedErrors = result.errors.filter(e => e.errorCode === 'ACTION_PROHIBITED_CONSTRUCT');
    expect(prohibitedErrors.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Collects all errors
// ---------------------------------------------------------------------------

describe('validateActions — collects all errors', () => {
  it('reports multiple error types without short-circuiting', () => {
    const result = validateActions([
      { id: 'a1', event: 'onFieldChange', targetId: 'ghost', code: 'var x = window;' },
      { id: 'a1', event: 'badEvent', code: 'function( {' },
    ], fieldIds);
    expect(result.valid).toBe(false);
    const codes = result.errors.map(e => e.errorCode);
    expect(codes).toContain('ACTION_TARGET_NOT_FOUND');
    expect(codes).toContain('ACTION_PROHIBITED_CONSTRUCT');
    expect(codes).toContain('DUPLICATE_ACTION_ID');
    expect(codes).toContain('INVALID_ACTION_EVENT');
  });
});

// ---------------------------------------------------------------------------
// Integration with validateSchema
// ---------------------------------------------------------------------------

describe('validateSchema — action validation integration', () => {
  function schemaWithActions(actions: unknown[]) {
    return {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
      ],
      actions,
    };
  }

  it('accepts schema with valid actions', () => {
    const result = validateSchema(schemaWithActions([
      { id: 'a1', event: 'onFieldChange', targetId: 'name', code: 'var x = 1' },
    ]));
    expect(result.valid).toBe(true);
  });

  it('rejects schema with invalid action event', () => {
    const result = validateSchema(schemaWithActions([
      { id: 'a1', event: 'onHover', code: 'var x = 1' },
    ]));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'INVALID_ACTION_EVENT' }),
      ]),
    );
  });

  it('rejects schema with prohibited construct in action code', () => {
    const result = validateSchema(schemaWithActions([
      { id: 'a1', event: 'onFormLoad', code: 'var x = window;' },
    ]));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'ACTION_PROHIBITED_CONSTRUCT' }),
      ]),
    );
  });

  it('validates schema without actions normally', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('merges action errors with field errors', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [
        { id: '', type: 'text', label: 'Name', required: true }, // invalid field
      ],
      actions: [
        { id: 'a1', event: 'onHover', code: 'var x = 1' }, // invalid event
      ],
    });
    expect(result.valid).toBe(false);
    const codes = result.errors.map((e: { errorCode: string }) => e.errorCode);
    expect(codes).toContain('SCHEMA_INVALID_FIELD');
    expect(codes).toContain('INVALID_ACTION_EVENT');
  });
});
