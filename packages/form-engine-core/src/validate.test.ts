import { validate } from './validate';
import type {
  FormSchema,
  FormData,
  FormField,
  FormStep,
  CrossFieldRule,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSchema(
  fields: FormField[],
  crossFieldRules?: CrossFieldRule[],
  steps?: FormStep[],
): FormSchema {
  return {
    version: '1.0',
    fields,
    ...(crossFieldRules ? { crossFieldRules } : {}),
    ...(steps ? { steps } : {}),
  };
}

function textField(id: string, label: string, overrides: Partial<FormField> = {}): FormField {
  return { id, type: 'text', label, required: false, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validate()', () => {
  describe('valid data produces valid result', () => {
    it('returns valid: true and empty errors for an empty schema', () => {
      const schema = makeSchema([]);
      const result = validate(schema, {});

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns valid: true when all required fields are present', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
        textField('email', 'Email', { required: true }),
      ]);
      const data: FormData = { name: 'Alice', email: 'alice@example.com' };
      const result = validate(schema, data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns valid: true when optional fields are absent', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
        textField('bio', 'Bio', { required: false }),
      ]);
      const data: FormData = { name: 'Alice' };
      const result = validate(schema, data);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('invalid data produces invalid result', () => {
    it('returns valid: false when a required field is missing', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
      ]);
      const result = validate(schema, {});

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('name');
      expect(result.errors['name']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'REQUIRED' }),
        ]),
      );
    });

    it('returns valid: false when a required field is empty string', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
      ]);
      const result = validate(schema, { name: '' });

      expect(result.valid).toBe(false);
      expect(result.errors['name']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'REQUIRED' }),
        ]),
      );
    });

    it('returns valid: false when a required field is null', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
      ]);
      const result = validate(schema, { name: null });

      expect(result.valid).toBe(false);
      expect(result.errors['name']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'REQUIRED' }),
        ]),
      );
    });
  });

  describe('collects all errors (no short-circuiting)', () => {
    it('reports errors for multiple failing fields', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
        textField('email', 'Email', { required: true }),
        textField('phone', 'Phone', { required: true }),
      ]);
      const result = validate(schema, {});

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(3);
      expect(result.errors).toHaveProperty('name');
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('phone');
    });

    it('only includes fields with errors in the errors map', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
        textField('bio', 'Bio', { required: false }),
        textField('email', 'Email', { required: true }),
      ]);
      const data: FormData = { name: 'Alice' };
      const result = validate(schema, data);

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(1);
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).not.toHaveProperty('name');
      expect(result.errors).not.toHaveProperty('bio');
    });
  });

  describe('fieldId option (single-field validation)', () => {
    it('validates only the specified field when fieldId is provided', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
        textField('email', 'Email', { required: true }),
      ]);
      const result = validate(schema, {}, { fieldId: 'email' });

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(1);
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).not.toHaveProperty('name');
    });

    it('returns valid: true when the specified field passes', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
        textField('email', 'Email', { required: true }),
      ]);
      const result = validate(schema, { email: 'test@example.com' }, { fieldId: 'email' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns valid: true when fieldId does not match any field', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
      ]);
      const result = validate(schema, {}, { fieldId: 'nonexistent' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('field-level constraint forwarding', () => {
    it('reports MIN_LENGTH errors through validate()', () => {
      const schema = makeSchema([
        textField('name', 'Name', {
          required: false,
          validation: { minLength: 5 },
        }),
      ]);
      const result = validate(schema, { name: 'ab' });

      expect(result.valid).toBe(false);
      expect(result.errors['name']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'MIN_LENGTH' }),
        ]),
      );
    });

    it('reports MAX_LENGTH errors through validate()', () => {
      const schema = makeSchema([
        textField('name', 'Name', {
          required: false,
          validation: { maxLength: 3 },
        }),
      ]);
      const result = validate(schema, { name: 'toolong' });

      expect(result.valid).toBe(false);
      expect(result.errors['name']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'MAX_LENGTH' }),
        ]),
      );
    });

    it('reports PATTERN_MISMATCH errors through validate()', () => {
      const schema = makeSchema([
        textField('code', 'Code', {
          required: false,
          validation: { pattern: '^[A-Z]+$' },
        }),
      ]);
      const result = validate(schema, { code: 'abc' });

      expect(result.valid).toBe(false);
      expect(result.errors['code']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'PATTERN_MISMATCH' }),
        ]),
      );
    });
  });

  describe('determinism', () => {
    it('produces identical results when called twice with the same inputs', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
        textField('email', 'Email', {
          required: true,
          validation: { minLength: 5 },
        }),
      ]);
      const data: FormData = { name: '', email: 'ab' };

      const result1 = validate(schema, data);
      const result2 = validate(schema, data);

      expect(result1).toEqual(result2);
    });
  });

  describe('Indian document validator integration', () => {
    it('validates Aadhaar via validatorType and reports INVALID_AADHAAR with correct field ID', () => {
      const schema = makeSchema([
        textField('aadhaar', 'Aadhaar Number', {
          required: true,
          validatorType: 'aadhaar',
        }),
      ]);
      const result = validate(schema, { aadhaar: '123456789012' });

      expect(result.valid).toBe(false);
      expect(result.errors['aadhaar']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'aadhaar',
            errorCode: 'INVALID_AADHAAR',
          }),
        ]),
      );
    });

    it('validates PAN via validatorType and reports INVALID_PAN with correct field ID', () => {
      const schema = makeSchema([
        textField('pan', 'PAN Number', {
          required: true,
          validatorType: 'pan',
        }),
      ]);
      const result = validate(schema, { pan: 'INVALID' });

      expect(result.valid).toBe(false);
      expect(result.errors['pan']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'pan',
            errorCode: 'INVALID_PAN',
          }),
        ]),
      );
    });

    it('passes valid PAN through without errors', () => {
      const schema = makeSchema([
        textField('pan', 'PAN Number', {
          required: true,
          validatorType: 'pan',
        }),
      ]);
      const result = validate(schema, { pan: 'ABCDE1234F' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates Indian mobile via validatorType and reports INVALID_MOBILE_IN', () => {
      const schema = makeSchema([
        textField('mobile', 'Mobile Number', {
          required: true,
          validatorType: 'mobile_in',
        }),
      ]);
      const result = validate(schema, { mobile: '1234567890' });

      expect(result.valid).toBe(false);
      expect(result.errors['mobile']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'mobile',
            errorCode: 'INVALID_MOBILE_IN',
          }),
        ]),
      );
    });

    it('passes valid Indian mobile through without errors', () => {
      const schema = makeSchema([
        textField('mobile', 'Mobile Number', {
          required: true,
          validatorType: 'mobile_in',
        }),
      ]);
      const result = validate(schema, { mobile: '9876543210' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates IFSC via validatorType and reports INVALID_IFSC', () => {
      const schema = makeSchema([
        textField('ifsc', 'IFSC Code', {
          required: true,
          validatorType: 'ifsc',
        }),
      ]);
      const result = validate(schema, { ifsc: 'INVALID' });

      expect(result.valid).toBe(false);
      expect(result.errors['ifsc']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'ifsc',
            errorCode: 'INVALID_IFSC',
          }),
        ]),
      );
    });

    it('passes valid IFSC through without errors', () => {
      const schema = makeSchema([
        textField('ifsc', 'IFSC Code', {
          required: true,
          validatorType: 'ifsc',
        }),
      ]);
      const result = validate(schema, { ifsc: 'SBIN0001234' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates pincode via validatorType and reports INVALID_PINCODE_IN', () => {
      const schema = makeSchema([
        textField('pincode', 'Pincode', {
          required: true,
          validatorType: 'pincode_in',
        }),
      ]);
      const result = validate(schema, { pincode: '123' });

      expect(result.valid).toBe(false);
      expect(result.errors['pincode']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'pincode',
            errorCode: 'INVALID_PINCODE_IN',
          }),
        ]),
      );
    });

    it('passes valid pincode through without errors', () => {
      const schema = makeSchema([
        textField('pincode', 'Pincode', {
          required: true,
          validatorType: 'pincode_in',
        }),
      ]);
      const result = validate(schema, { pincode: '560001' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates email via validatorType and reports INVALID_EMAIL', () => {
      const schema = makeSchema([
        textField('email', 'Email', {
          required: true,
          validatorType: 'email',
        }),
      ]);
      const result = validate(schema, { email: 'not-an-email' });

      expect(result.valid).toBe(false);
      expect(result.errors['email']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            errorCode: 'INVALID_EMAIL',
          }),
        ]),
      );
    });

    it('passes valid email through without errors', () => {
      const schema = makeSchema([
        textField('email', 'Email', {
          required: true,
          validatorType: 'email',
        }),
      ]);
      const result = validate(schema, { email: 'user@example.com' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates bank account via validatorType and reports INVALID_BANK_ACCOUNT_IN', () => {
      const schema = makeSchema([
        textField('bank', 'Bank Account', {
          required: true,
          validatorType: 'bank_account_in',
        }),
      ]);
      const result = validate(schema, { bank: '12345' });

      expect(result.valid).toBe(false);
      expect(result.errors['bank']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'bank',
            errorCode: 'INVALID_BANK_ACCOUNT_IN',
          }),
        ]),
      );
    });

    it('passes valid bank account through without errors', () => {
      const schema = makeSchema([
        textField('bank', 'Bank Account', {
          required: true,
          validatorType: 'bank_account_in',
        }),
      ]);
      const result = validate(schema, { bank: '123456789012' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('does not run Indian validator when value is empty and field is optional', () => {
      const schema = makeSchema([
        textField('pan', 'PAN Number', {
          required: false,
          validatorType: 'pan',
        }),
      ]);
      const result = validate(schema, {});

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('does not run Indian validator when value is null', () => {
      const schema = makeSchema([
        textField('pan', 'PAN Number', {
          required: false,
          validatorType: 'pan',
        }),
      ]);
      const result = validate(schema, { pan: null });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('does not run Indian validator when value is empty string and field is optional', () => {
      const schema = makeSchema([
        textField('pan', 'PAN Number', {
          required: false,
          validatorType: 'pan',
        }),
      ]);
      const result = validate(schema, { pan: '' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('collects both field-level and Indian validator errors', () => {
      const schema = makeSchema([
        textField('aadhaar', 'Aadhaar Number', {
          required: true,
          validatorType: 'aadhaar',
          validation: { minLength: 20 },
        }),
      ]);
      // Value is present but too short for minLength AND invalid Aadhaar
      const result = validate(schema, { aadhaar: '123456789012' });

      expect(result.valid).toBe(false);
      const aadhaarErrors = result.errors['aadhaar'];
      const errorCodes = aadhaarErrors.map((e) => e.errorCode);
      expect(errorCodes).toContain('MIN_LENGTH');
      expect(errorCodes).toContain('INVALID_AADHAAR');
    });

    it('works with fieldId option for single-field validation', () => {
      const schema = makeSchema([
        textField('pan', 'PAN Number', {
          required: true,
          validatorType: 'pan',
        }),
        textField('name', 'Name', { required: true }),
      ]);
      const result = validate(schema, { pan: 'INVALID' }, { fieldId: 'pan' });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('pan');
      expect(result.errors).not.toHaveProperty('name');
      expect(result.errors['pan']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'pan',
            errorCode: 'INVALID_PAN',
          }),
        ]),
      );
    });
  });

  describe('cross-field validation integration', () => {
    it('evaluates date_after rule and reports DATE_ORDER_VIOLATION', () => {
      const schema = makeSchema(
        [
          { id: 'startDate', type: 'date', label: 'Start Date', required: false },
          { id: 'endDate', type: 'date', label: 'End Date', required: false },
        ],
        [{ type: 'date_after', fields: ['endDate', 'startDate'] }],
      );
      const result = validate(schema, { startDate: '2024-06-01', endDate: '2024-01-01' });

      expect(result.valid).toBe(false);
      expect(result.errors['endDate']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'DATE_ORDER_VIOLATION' }),
        ]),
      );
    });

    it('passes when date_after rule is satisfied', () => {
      const schema = makeSchema(
        [
          { id: 'startDate', type: 'date', label: 'Start Date', required: false },
          { id: 'endDate', type: 'date', label: 'End Date', required: false },
        ],
        [{ type: 'date_after', fields: ['endDate', 'startDate'] }],
      );
      const result = validate(schema, { startDate: '2024-01-01', endDate: '2024-06-01' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('evaluates required_if rule and reports CONDITIONAL_REQUIRED', () => {
      const schema = makeSchema(
        [
          textField('applicantType', 'Applicant Type', { required: true }),
          textField('guardianName', 'Guardian Name'),
        ],
        [{ type: 'required_if', fields: ['guardianName', 'applicantType'], targetValue: 'minor' }],
      );
      const result = validate(schema, { applicantType: 'minor' });

      expect(result.valid).toBe(false);
      expect(result.errors['guardianName']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'CONDITIONAL_REQUIRED' }),
        ]),
      );
    });

    it('passes required_if when condition is not met', () => {
      const schema = makeSchema(
        [
          textField('applicantType', 'Applicant Type', { required: true }),
          textField('guardianName', 'Guardian Name'),
        ],
        [{ type: 'required_if', fields: ['guardianName', 'applicantType'], targetValue: 'minor' }],
      );
      const result = validate(schema, { applicantType: 'adult' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('evaluates sum_equals rule and reports SUM_MISMATCH', () => {
      const schema = makeSchema(
        [
          { id: 'partA', type: 'number' as const, label: 'Part A', required: false },
          { id: 'partB', type: 'number' as const, label: 'Part B', required: false },
        ],
        [{ type: 'sum_equals', fields: ['partA', 'partB'], targetValue: 100 }],
      );
      const result = validate(schema, { partA: 30, partB: 50 });

      expect(result.valid).toBe(false);
      expect(result.errors['partA']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'SUM_MISMATCH' }),
        ]),
      );
    });

    it('passes sum_equals when fields sum to target', () => {
      const schema = makeSchema(
        [
          { id: 'partA', type: 'number' as const, label: 'Part A', required: false },
          { id: 'partB', type: 'number' as const, label: 'Part B', required: false },
        ],
        [{ type: 'sum_equals', fields: ['partA', 'partB'], targetValue: 100 }],
      );
      const result = validate(schema, { partA: 60, partB: 40 });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('evaluates mutually_exclusive rule and reports MUTUALLY_EXCLUSIVE_VIOLATION', () => {
      const schema = makeSchema(
        [
          textField('optionA', 'Option A'),
          textField('optionB', 'Option B'),
          textField('optionC', 'Option C'),
        ],
        [{ type: 'mutually_exclusive', fields: ['optionA', 'optionB', 'optionC'] }],
      );
      const result = validate(schema, { optionA: 'yes', optionB: 'yes' });

      expect(result.valid).toBe(false);
      expect(result.errors['optionA']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'MUTUALLY_EXCLUSIVE_VIOLATION' }),
        ]),
      );
      expect(result.errors['optionB']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'MUTUALLY_EXCLUSIVE_VIOLATION' }),
        ]),
      );
    });

    it('evaluates match rule and reports FIELD_MISMATCH', () => {
      const schema = makeSchema(
        [
          textField('password', 'Password', { required: true }),
          textField('confirmPassword', 'Confirm Password', { required: true }),
        ],
        [{ type: 'match', fields: ['confirmPassword', 'password'] }],
      );
      const result = validate(schema, { password: 'secret123', confirmPassword: 'secret456' });

      expect(result.valid).toBe(false);
      expect(result.errors['confirmPassword']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'FIELD_MISMATCH' }),
        ]),
      );
    });

    it('passes match rule when fields are equal', () => {
      const schema = makeSchema(
        [
          textField('password', 'Password', { required: true }),
          textField('confirmPassword', 'Confirm Password', { required: true }),
        ],
        [{ type: 'match', fields: ['confirmPassword', 'password'] }],
      );
      const result = validate(schema, { password: 'secret123', confirmPassword: 'secret123' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('merges cross-field errors with field-level errors on the same field', () => {
      const schema = makeSchema(
        [
          textField('password', 'Password', { required: true, validation: { minLength: 8 } }),
          textField('confirmPassword', 'Confirm Password', { required: true }),
        ],
        [{ type: 'match', fields: ['password', 'confirmPassword'] }],
      );
      // password is too short (field-level) AND doesn't match confirmPassword (cross-field)
      const result = validate(schema, { password: 'abc', confirmPassword: 'xyz' });

      expect(result.valid).toBe(false);
      const passwordErrors = result.errors['password'];
      const errorCodes = passwordErrors.map((e) => e.errorCode);
      expect(errorCodes).toContain('MIN_LENGTH');
      expect(errorCodes).toContain('FIELD_MISMATCH');
    });

    it('does NOT run cross-field rules when fieldId option is set (single-field validation)', () => {
      const schema = makeSchema(
        [
          textField('password', 'Password', { required: true }),
          textField('confirmPassword', 'Confirm Password', { required: true }),
        ],
        [{ type: 'match', fields: ['confirmPassword', 'password'] }],
      );
      // Single-field validation for confirmPassword — cross-field rules should be skipped
      const result = validate(schema, { password: 'abc', confirmPassword: 'xyz' }, { fieldId: 'confirmPassword' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('does not run cross-field rules when schema has no crossFieldRules', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
      ]);
      const result = validate(schema, { name: 'Alice' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('supports targetField to attach error to a specific field', () => {
      const schema = makeSchema(
        [
          { id: 'startDate', type: 'date', label: 'Start Date', required: false },
          { id: 'endDate', type: 'date', label: 'End Date', required: false },
        ],
        [{ type: 'date_after', fields: ['endDate', 'startDate'], targetField: 'startDate' }],
      );
      const result = validate(schema, { startDate: '2024-06-01', endDate: '2024-01-01' });

      expect(result.valid).toBe(false);
      // Error should be on startDate (targetField), not endDate
      expect(result.errors['startDate']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'DATE_ORDER_VIOLATION' }),
        ]),
      );
    });

    it('uses custom message from cross-field rule', () => {
      const schema = makeSchema(
        [
          textField('password', 'Password', { required: true }),
          textField('confirmPassword', 'Confirm Password', { required: true }),
        ],
        [{ type: 'match', fields: ['confirmPassword', 'password'], message: 'Passwords must match' }],
      );
      const result = validate(schema, { password: 'abc', confirmPassword: 'xyz' });

      expect(result.valid).toBe(false);
      expect(result.errors['confirmPassword']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            errorCode: 'FIELD_MISMATCH',
            message: 'Passwords must match',
          }),
        ]),
      );
    });
  });

  describe('conditional visibility integration', () => {
    it('does not validate hidden fields — no errors even if required', () => {
      const schema = makeSchema([
        textField('employmentType', 'Employment Type', { required: true }),
        textField('companyName', 'Company Name', {
          required: true,
          conditional: { field: 'employmentType', operator: 'equals', value: 'employed' },
        }),
      ]);
      // employmentType is 'unemployed', so companyName should be hidden and not validated
      const result = validate(schema, { employmentType: 'unemployed' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.errors).not.toHaveProperty('companyName');
    });

    it('validates visible conditional fields', () => {
      const schema = makeSchema([
        textField('employmentType', 'Employment Type', { required: true }),
        textField('companyName', 'Company Name', {
          required: true,
          conditional: { field: 'employmentType', operator: 'equals', value: 'employed' },
        }),
      ]);
      // employmentType is 'employed', so companyName is visible and required
      const result = validate(schema, { employmentType: 'employed' });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('companyName');
      expect(result.errors['companyName']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'REQUIRED' }),
        ]),
      );
    });

    it('cross-field rules only run for visible fields', () => {
      const schema = makeSchema(
        [
          textField('showExtra', 'Show Extra', { required: true }),
          textField('password', 'Password', {
            required: true,
            conditional: { field: 'showExtra', operator: 'equals', value: 'yes' },
          }),
          textField('confirmPassword', 'Confirm Password', {
            required: true,
            conditional: { field: 'showExtra', operator: 'equals', value: 'yes' },
          }),
        ],
        [{ type: 'match', fields: ['confirmPassword', 'password'] }],
      );
      // showExtra is 'no', so password and confirmPassword are hidden.
      // The match cross-field rule should NOT run because both fields are hidden.
      const result = validate(schema, { showExtra: 'no', password: 'abc', confirmPassword: 'xyz' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('cross-field rules run when all referenced fields are visible', () => {
      const schema = makeSchema(
        [
          textField('showExtra', 'Show Extra', { required: true }),
          textField('password', 'Password', {
            required: true,
            conditional: { field: 'showExtra', operator: 'equals', value: 'yes' },
          }),
          textField('confirmPassword', 'Confirm Password', {
            required: true,
            conditional: { field: 'showExtra', operator: 'equals', value: 'yes' },
          }),
        ],
        [{ type: 'match', fields: ['confirmPassword', 'password'] }],
      );
      // showExtra is 'yes', so both fields are visible and the match rule should run
      const result = validate(schema, { showExtra: 'yes', password: 'abc', confirmPassword: 'xyz' });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('confirmPassword');
      expect(result.errors['confirmPassword']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'FIELD_MISMATCH' }),
        ]),
      );
    });

    it('single-field validation respects visibility — hidden field returns valid', () => {
      const schema = makeSchema([
        textField('toggle', 'Toggle', { required: true }),
        textField('details', 'Details', {
          required: true,
          conditional: { field: 'toggle', operator: 'equals', value: 'show' },
        }),
      ]);
      // toggle is 'hide', so details is hidden — single-field validation should return valid
      const result = validate(schema, { toggle: 'hide' }, { fieldId: 'details' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('single-field validation validates visible conditional field', () => {
      const schema = makeSchema([
        textField('toggle', 'Toggle', { required: true }),
        textField('details', 'Details', {
          required: true,
          conditional: { field: 'toggle', operator: 'equals', value: 'show' },
        }),
      ]);
      // toggle is 'show', so details is visible — single-field validation should validate it
      const result = validate(schema, { toggle: 'show' }, { fieldId: 'details' });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('details');
      expect(result.errors['details']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'REQUIRED' }),
        ]),
      );
    });
  });

  describe('step-scoped validation', () => {
    const step1Fields: FormField[] = [
      textField('firstName', 'First Name', { required: true }),
      textField('lastName', 'Last Name', { required: true }),
    ];
    const step2Fields: FormField[] = [
      textField('email', 'Email', { required: true }),
      textField('phone', 'Phone', { required: true }),
    ];
    const allFields = [...step1Fields, ...step2Fields];
    const steps: FormStep[] = [
      { id: 'personal', label: 'Personal Info', fieldIds: ['firstName', 'lastName'] },
      { id: 'contact', label: 'Contact Info', fieldIds: ['email', 'phone'] },
    ];

    it('validates only the step\'s fields when stepId is provided', () => {
      const schema = makeSchema(allFields, undefined, steps);
      // All fields are empty — but only step 1 fields should be validated
      const result = validate(schema, {}, { stepId: 'personal' });

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(2);
      expect(result.errors).toHaveProperty('firstName');
      expect(result.errors).toHaveProperty('lastName');
      expect(result.errors).not.toHaveProperty('email');
      expect(result.errors).not.toHaveProperty('phone');
    });

    it('validates all fields across all steps when stepId is absent', () => {
      const schema = makeSchema(allFields, undefined, steps);
      // All fields are empty — all should be validated
      const result = validate(schema, {});

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(4);
      expect(result.errors).toHaveProperty('firstName');
      expect(result.errors).toHaveProperty('lastName');
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('phone');
    });

    it('returns UNKNOWN_STEP error for non-existent step ID', () => {
      const schema = makeSchema(allFields, undefined, steps);
      const result = validate(schema, {}, { stepId: 'nonexistent' });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('_step');
      expect(result.errors['_step']).toEqual([
        {
          field: '_step',
          errorCode: 'UNKNOWN_STEP',
          message: 'Unknown step: nonexistent',
        },
      ]);
    });

    it('does NOT evaluate cross-field rules spanning multiple steps during single-step validation', () => {
      // Cross-field rule references fields from both steps
      const crossFieldRules: CrossFieldRule[] = [
        { type: 'match', fields: ['email', 'firstName'] },
      ];
      const schema = makeSchema(allFields, crossFieldRules, steps);
      // Provide different values for firstName and email — the match rule
      // should NOT fire when validating only step 1
      const data: FormData = {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'different@example.com',
        phone: '1234567890',
      };
      const result = validate(schema, data, { stepId: 'personal' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('evaluates cross-field rules within a single step', () => {
      // Cross-field rule references fields within step 1 only
      const crossFieldRules: CrossFieldRule[] = [
        { type: 'match', fields: ['lastName', 'firstName'] },
      ];
      const schema = makeSchema(allFields, crossFieldRules, steps);
      // firstName and lastName differ — the match rule should fire
      const data: FormData = {
        firstName: 'Alice',
        lastName: 'Bob',
        email: 'alice@example.com',
        phone: '1234567890',
      };
      const result = validate(schema, data, { stepId: 'personal' });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('lastName');
      expect(result.errors['lastName']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorCode: 'FIELD_MISMATCH' }),
        ]),
      );
    });

    it('returns valid: true when all step fields pass', () => {
      const schema = makeSchema(allFields, undefined, steps);
      const data: FormData = {
        firstName: 'Alice',
        lastName: 'Smith',
      };
      const result = validate(schema, data, { stepId: 'personal' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('fieldId takes precedence over stepId — only validates the single field', () => {
      const schema = makeSchema(allFields, undefined, steps);
      // Both fieldId and stepId are set — fieldId should win
      const result = validate(schema, {}, { stepId: 'personal', fieldId: 'firstName' });

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(1);
      expect(result.errors).toHaveProperty('firstName');
      expect(result.errors).not.toHaveProperty('lastName');
    });

    it('returns UNKNOWN_STEP when schema has no steps array', () => {
      const schema = makeSchema(allFields);
      // No steps defined — any stepId should be unknown
      const result = validate(schema, {}, { stepId: 'personal' });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty('_step');
      expect(result.errors['_step']).toEqual([
        {
          field: '_step',
          errorCode: 'UNKNOWN_STEP',
          message: 'Unknown step: personal',
        },
      ]);
    });
  });

  describe('localised error messages', () => {
    it('default English messages use field labels', () => {
      const schema = makeSchema([
        textField('fullName', 'Full Name', { required: true }),
      ]);
      const result = validate(schema, {});

      expect(result.valid).toBe(false);
      const err = result.errors['fullName'][0];
      expect(err.field).toBe('fullName');
      expect(err.errorCode).toBe('REQUIRED');
      expect(err.message).toBe('Full Name is required');
    });

    it('custom validation.message overrides the default localised message', () => {
      const schema = makeSchema([
        textField('age', 'Age', {
          required: true,
          type: 'number',
          validation: { min: 18, message: 'You must be at least 18 years old' },
        } as Partial<FormField>),
      ]);
      const result = validate(schema, { age: 10 });

      expect(result.valid).toBe(false);
      const ageErrors = result.errors['age'];
      // All errors for this field should use the custom message
      for (const err of ageErrors) {
        expect(err.message).toBe('You must be at least 18 years old');
      }
    });

    it('locale option produces localised messages (Hindi)', () => {
      const schema = makeSchema([
        textField('name', 'नाम', { required: true }),
      ]);
      const result = validate(schema, {}, { locale: 'hi' });

      expect(result.valid).toBe(false);
      const err = result.errors['name'][0];
      expect(err.errorCode).toBe('REQUIRED');
      expect(err.message).toBe('नाम आवश्यक है');
    });

    it('locale option produces localised messages (Tamil)', () => {
      const schema = makeSchema([
        textField('name', 'பெயர்', { required: true }),
      ]);
      const result = validate(schema, {}, { locale: 'ta' });

      expect(result.valid).toBe(false);
      const err = result.errors['name'][0];
      expect(err.errorCode).toBe('REQUIRED');
      expect(err.message).toBe('பெயர் தேவை');
    });

    it('schema defaultLocale is used when no locale option is provided', () => {
      const schema: FormSchema = {
        version: '1.0',
        fields: [
          textField('name', 'పేరు', { required: true }),
        ],
        defaultLocale: 'te',
      };
      const result = validate(schema, {});

      expect(result.valid).toBe(false);
      const err = result.errors['name'][0];
      expect(err.errorCode).toBe('REQUIRED');
      expect(err.message).toBe('పేరు అవసరం');
    });

    it('options.locale takes precedence over schema.defaultLocale', () => {
      const schema: FormSchema = {
        version: '1.0',
        fields: [
          textField('name', 'নাম', { required: true }),
        ],
        defaultLocale: 'te',
      };
      // options.locale = 'bn' should override schema.defaultLocale = 'te'
      const result = validate(schema, {}, { locale: 'bn' });

      expect(result.valid).toBe(false);
      const err = result.errors['name'][0];
      expect(err.errorCode).toBe('REQUIRED');
      expect(err.message).toBe('নাম আবশ্যক');
    });

    it('falls back to en when neither options.locale nor schema.defaultLocale is set', () => {
      const schema = makeSchema([
        textField('email', 'Email Address', { required: true }),
      ]);
      const result = validate(schema, {});

      expect(result.valid).toBe(false);
      const err = result.errors['email'][0];
      expect(err.message).toBe('Email Address is required');
    });

    it('every ValidationError has non-empty field, errorCode, and message', () => {
      const schema = makeSchema([
        textField('name', 'Name', { required: true }),
        textField('bio', 'Bio', {
          required: false,
          validation: { minLength: 10, maxLength: 5 },
        }),
        textField('code', 'Code', {
          required: true,
          validation: { pattern: '^[A-Z]+$' },
        }),
      ]);
      const result = validate(schema, { bio: 'hello!!', code: 'abc' });

      expect(result.valid).toBe(false);
      for (const [fieldId, fieldErrors] of Object.entries(result.errors)) {
        for (const err of fieldErrors) {
          expect(err.field).toBeTruthy();
          expect(err.field.length).toBeGreaterThan(0);
          expect(err.errorCode).toBeTruthy();
          expect(err.errorCode.length).toBeGreaterThan(0);
          expect(err.message).toBeTruthy();
          expect(err.message.length).toBeGreaterThan(0);
        }
      }
    });

    it('localised messages work for Indian validator errors', () => {
      const schema = makeSchema([
        textField('pan', 'पैन नंबर', {
          required: true,
          validatorType: 'pan',
        }),
      ]);
      const result = validate(schema, { pan: 'INVALID' }, { locale: 'hi' });

      expect(result.valid).toBe(false);
      const panErrors = result.errors['pan'];
      const panError = panErrors.find((e) => e.errorCode === 'INVALID_PAN');
      expect(panError).toBeDefined();
      expect(panError!.message).toBe('पैन नंबर एक मान्य पैन नहीं है');
    });

    it('cross-field rule custom message is preserved through localisation', () => {
      const schema = makeSchema(
        [
          textField('password', 'Password', { required: true }),
          textField('confirmPassword', 'Confirm Password', { required: true }),
        ],
        [{ type: 'match', fields: ['confirmPassword', 'password'], message: 'Passwords must match exactly' }],
      );
      const result = validate(schema, { password: 'abc', confirmPassword: 'xyz' }, { locale: 'hi' });

      expect(result.valid).toBe(false);
      const err = result.errors['confirmPassword'].find((e) => e.errorCode === 'FIELD_MISMATCH');
      expect(err).toBeDefined();
      expect(err!.message).toBe('Passwords must match exactly');
    });

    it('cross-field rule without custom message gets localised default', () => {
      const schema = makeSchema(
        [
          textField('password', 'Password', { required: true }),
          textField('confirmPassword', 'Confirm Password', { required: true }),
        ],
        [{ type: 'match', fields: ['confirmPassword', 'password'] }],
      );
      const result = validate(schema, { password: 'abc', confirmPassword: 'xyz' }, { locale: 'hi' });

      expect(result.valid).toBe(false);
      const err = result.errors['confirmPassword'].find((e) => e.errorCode === 'FIELD_MISMATCH');
      expect(err).toBeDefined();
      // Hindi localised message for FIELD_MISMATCH with label 'Confirm Password'
      expect(err!.message).toBe('Confirm Password मेल नहीं खाता');
    });
  });
});
