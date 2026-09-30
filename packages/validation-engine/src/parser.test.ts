import { parseFormSchema, prettyPrintFormSchema } from './parser.js';
import type { FormSchema, ParseError } from './types.js';

/** Type guard for ParseError. */
function isParseError(val: FormSchema | ParseError): val is ParseError {
  return (val as ParseError).error === true;
}

describe('parseFormSchema', () => {
  const validSchema: FormSchema = {
    version: '1.0',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
      },
    ],
  };

  it('parses a valid JSON string into a FormSchema', () => {
    const json = JSON.stringify(validSchema);
    const result = parseFormSchema(json);

    expect(isParseError(result)).toBe(false);
    const schema = result as FormSchema;
    expect(schema.version).toBe('1.0');
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].id).toBe('name');
  });

  it('returns ParseError for invalid JSON syntax', () => {
    const result = parseFormSchema('{ not valid json }');

    expect(isParseError(result)).toBe(true);
    const err = result as ParseError;
    expect(err.error).toBe(true);
    expect(err.message).toContain('Invalid JSON');
  });

  it('returns ParseError when version is missing', () => {
    const json = JSON.stringify({ fields: [] });
    const result = parseFormSchema(json);

    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('version');
  });

  it('returns ParseError when version is empty string', () => {
    const json = JSON.stringify({ version: '', fields: [] });
    const result = parseFormSchema(json);

    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('version');
  });

  it('returns ParseError when fields is missing', () => {
    const json = JSON.stringify({ version: '1.0' });
    const result = parseFormSchema(json);

    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('fields');
  });

  it('returns ParseError when fields is not an array', () => {
    const json = JSON.stringify({ version: '1.0', fields: 'not-an-array' });
    const result = parseFormSchema(json);

    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('fields');
  });

  it('returns ParseError when input is a JSON array', () => {
    const result = parseFormSchema('[1, 2, 3]');

    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('object');
  });

  it('returns ParseError when input is a JSON null', () => {
    const result = parseFormSchema('null');

    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('object');
  });
});

describe('prettyPrintFormSchema', () => {
  it('produces sorted keys with 2-space indentation', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
        },
      ],
    };

    const output = prettyPrintFormSchema(schema);
    const parsed = JSON.parse(output);

    // Keys at the top level should be sorted
    const topKeys = Object.keys(parsed);
    expect(topKeys).toEqual([...topKeys].sort());

    // Keys inside each field should be sorted
    const fieldKeys = Object.keys(parsed.fields[0]);
    expect(fieldKeys).toEqual([...fieldKeys].sort());

    // 2-space indentation
    expect(output).toContain('  "fields"');
  });

  it('sorts keys at all nested levels', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        {
          id: 'age',
          type: 'number',
          label: 'Age',
          required: false,
          validation: {
            min: 0,
            max: 150,
            message: 'Enter a valid age',
          },
        },
      ],
    };

    const output = prettyPrintFormSchema(schema);
    const parsed = JSON.parse(output);

    // Validation keys should be sorted
    const validationKeys = Object.keys(parsed.fields[0].validation);
    expect(validationKeys).toEqual([...validationKeys].sort());
  });
});

describe('round-trip: prettyPrint(parse(prettyPrint(schema)))', () => {
  it('produces identical output on double round-trip', () => {
    const schema: FormSchema = {
      version: '2.0',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          required: true,
          placeholder: 'Enter your name',
          validation: {
            minLength: 1,
            maxLength: 100,
          },
        },
        {
          id: 'dob',
          type: 'date',
          label: 'Date of Birth',
          required: false,
          validation: {
            minDate: '1900-01-01',
            maxDate: '2025-12-31',
          },
        },
      ],
      crossFieldRules: [
        {
          type: 'required_if',
          fields: ['name', 'dob'],
          targetField: 'dob',
          message: 'DOB is required when name is provided',
        },
      ],
    };

    const firstPrint = prettyPrintFormSchema(schema);
    const reparsed = parseFormSchema(firstPrint);
    expect(isParseError(reparsed)).toBe(false);

    const secondPrint = prettyPrintFormSchema(reparsed as FormSchema);
    expect(secondPrint).toBe(firstPrint);
  });
});


// ---------------------------------------------------------------------------
// Custom field extensions (customConfig, customValidation)
// ---------------------------------------------------------------------------

describe('round-trip with custom field extensions', () => {
  it('preserves customConfig and customValidation through parse→prettyPrint→parse', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          required: true,
        },
        {
          id: 'home_address',
          type: 'address_picker',
          label: 'Home Address',
          required: true,
          customConfig: {
            mapProvider: 'google',
            apiKey: 'test-key',
            country: 'IN',
          },
          customValidation: {
            validatorName: 'address_structure',
            params: { requirePostalCode: true },
          },
        },
      ],
    };

    const firstPrint = prettyPrintFormSchema(schema);
    const reparsed = parseFormSchema(firstPrint);
    expect(isParseError(reparsed)).toBe(false);

    const secondPrint = prettyPrintFormSchema(reparsed as FormSchema);
    expect(secondPrint).toBe(firstPrint);

    // Verify the custom properties survived
    const parsed = reparsed as FormSchema;
    const addrField = parsed.fields[1];
    expect(addrField.type).toBe('address_picker');
    expect(addrField.customConfig).toEqual({
      mapProvider: 'google',
      apiKey: 'test-key',
      country: 'IN',
    });
    expect(addrField.customValidation).toEqual({
      validatorName: 'address_structure',
      params: { requirePostalCode: true },
    });
  });

  it('prettyPrint includes customConfig and customValidation with sorted keys', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        {
          id: 'sig',
          type: 'signature_pad',
          label: 'Signature',
          required: false,
          customConfig: { zebra: 1, alpha: 2 },
          customValidation: {
            validatorName: 'signature_format',
          },
        },
      ],
    };

    const output = prettyPrintFormSchema(schema);
    const parsed = JSON.parse(output);

    // customConfig keys should be sorted
    const configKeys = Object.keys(parsed.fields[0].customConfig);
    expect(configKeys).toEqual(['alpha', 'zebra']);

    // customValidation should be present
    expect(parsed.fields[0].customValidation.validatorName).toBe('signature_format');
  });

  it('handles schema with only customConfig (no customValidation)', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        {
          id: 'otp',
          type: 'otp_input',
          label: 'OTP',
          required: true,
          customConfig: { digits: 6 },
        },
      ],
    };

    const firstPrint = prettyPrintFormSchema(schema);
    const reparsed = parseFormSchema(firstPrint) as FormSchema;
    const secondPrint = prettyPrintFormSchema(reparsed);
    expect(secondPrint).toBe(firstPrint);
    expect(reparsed.fields[0].customConfig).toEqual({ digits: 6 });
    expect(reparsed.fields[0].customValidation).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Actions parsing and pretty-printing
// ---------------------------------------------------------------------------

describe('parseFormSchema with actions', () => {
  it('parses a valid schema with actions', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
      actions: [
        { id: 'action1', event: 'onFieldChange', targetId: 'name', code: 'setFieldValue("name", "test")' },
      ],
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(false);
    const schema = result as FormSchema;
    expect(schema.actions).toHaveLength(1);
    expect(schema.actions![0].id).toBe('action1');
  });

  it('parses a valid schema without actions (backward compatible)', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(false);
    expect((result as FormSchema).actions).toBeUndefined();
  });

  it('returns ParseError when actions is not an array', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [],
      actions: 'not-an-array',
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('actions');
    expect((result as ParseError).message).toContain('array');
  });

  it('returns ParseError when action is missing "id"', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [],
      actions: [{ event: 'onFormLoad', code: 'console.log("hi")' }],
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(true);
    const err = result as ParseError;
    expect(err.message).toContain('index 0');
    expect(err.message).toContain('"id"');
  });

  it('returns ParseError when action is missing "event"', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [],
      actions: [{ id: 'a1', code: 'return 1' }],
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(true);
    const err = result as ParseError;
    expect(err.message).toContain('index 0');
    expect(err.message).toContain('"event"');
  });

  it('returns ParseError when action is missing "code"', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [],
      actions: [{ id: 'a1', event: 'onFormLoad' }],
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(true);
    const err = result as ParseError;
    expect(err.message).toContain('index 0');
    expect(err.message).toContain('"code"');
  });

  it('returns ParseError with correct index for second invalid action', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [],
      actions: [
        { id: 'a1', event: 'onFormLoad', code: 'return 1' },
        { id: 'a2', event: 'onFormLoad' }, // missing code
      ],
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('index 1');
  });

  it('returns ParseError when action entry is not an object', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [],
      actions: ['not-an-object'],
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('index 0');
    expect((result as ParseError).message).toContain('object');
  });

  it('returns ParseError when action id is empty string', () => {
    const json = JSON.stringify({
      version: '1.0',
      fields: [],
      actions: [{ id: '', event: 'onFormLoad', code: 'return 1' }],
    });
    const result = parseFormSchema(json);
    expect(isParseError(result)).toBe(true);
    expect((result as ParseError).message).toContain('"id"');
  });
});

describe('prettyPrintFormSchema with actions', () => {
  it('formats action keys in canonical order (id, event, targetId, code, description, enabled)', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [],
      actions: [
        {
          enabled: true,
          description: 'Test action',
          code: 'return 1',
          targetId: 'field1',
          event: 'onFieldChange',
          id: 'action1',
        },
      ],
    };

    const output = prettyPrintFormSchema(schema);
    const parsed = JSON.parse(output);
    const actionKeys = Object.keys(parsed.actions[0]);
    expect(actionKeys).toEqual(['id', 'event', 'targetId', 'code', 'description', 'enabled']);
  });

  it('omits absent optional keys from action output', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [],
      actions: [
        { id: 'a1', event: 'onFormLoad', code: 'return 1' },
      ],
    };

    const output = prettyPrintFormSchema(schema);
    const parsed = JSON.parse(output);
    const actionKeys = Object.keys(parsed.actions[0]);
    expect(actionKeys).toEqual(['id', 'event', 'code']);
    expect(parsed.actions[0].targetId).toBeUndefined();
    expect(parsed.actions[0].description).toBeUndefined();
    expect(parsed.actions[0].enabled).toBeUndefined();
  });

  it('preserves code property with whitespace and line breaks', () => {
    const codeWithWhitespace = '  const x = 1;\n  const y = 2;\n  setFieldValue("total", x + y);  ';
    const schema: FormSchema = {
      version: '1.0',
      fields: [],
      actions: [
        { id: 'calc', event: 'onFormLoad', code: codeWithWhitespace },
      ],
    };

    const output = prettyPrintFormSchema(schema);
    const reparsed = parseFormSchema(output) as FormSchema;
    expect(reparsed.actions![0].code).toBe(codeWithWhitespace);
  });
});

describe('round-trip with actions', () => {
  it('produces identical output on double round-trip for schema with actions', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'total', type: 'number', label: 'Total', required: false },
      ],
      actions: [
        {
          id: 'calc-total',
          event: 'onFieldChange',
          targetId: 'name',
          code: 'const v = getFieldValue("name");\nsetFieldValue("total", v.length);',
          description: 'Calculate total from name length',
          enabled: true,
        },
        {
          id: 'on-load',
          event: 'onFormLoad',
          code: 'showMessage("Welcome!", "info");',
        },
      ],
    };

    const firstPrint = prettyPrintFormSchema(schema);
    const reparsed = parseFormSchema(firstPrint);
    expect(isParseError(reparsed)).toBe(false);

    const secondPrint = prettyPrintFormSchema(reparsed as FormSchema);
    expect(secondPrint).toBe(firstPrint);
  });

  it('preserves code with special characters through round-trip', () => {
    const specialCode = 'if (getFieldValue("age") > 18) {\n  showMessage("Adult", "info");\n} else {\n  showMessage("Minor", "warning");\n}';
    const schema: FormSchema = {
      version: '1.0',
      fields: [],
      actions: [
        { id: 'check-age', event: 'onFieldBlur', targetId: 'age', code: specialCode },
      ],
    };

    const firstPrint = prettyPrintFormSchema(schema);
    const reparsed = parseFormSchema(firstPrint) as FormSchema;
    expect(reparsed.actions![0].code).toBe(specialCode);

    const secondPrint = prettyPrintFormSchema(reparsed);
    expect(secondPrint).toBe(firstPrint);
  });
});
