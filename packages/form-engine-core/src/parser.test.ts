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
