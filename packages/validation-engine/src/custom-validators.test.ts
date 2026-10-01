import {
  CustomValidatorRegistry,
  customValidatorRegistry,
} from './custom-validators';
import type { CustomValidatorFn } from './custom-validators.js';
import { validate } from './validate.js';
import type { FormSchema, FormField, FormData, ValidationError } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSchema(fields: FormField[]): FormSchema {
  return { version: '1.0', fields };
}

function customField(
  id: string,
  label: string,
  validatorName: string,
  overrides: Partial<FormField> = {},
): FormField {
  return {
    id,
    type: 'custom_widget',
    label,
    required: false,
    customValidation: { validatorName },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// CustomValidatorRegistry — register / get / remove / list
// ---------------------------------------------------------------------------

describe('CustomValidatorRegistry', () => {
  let registry: CustomValidatorRegistry;

  beforeEach(() => {
    registry = new CustomValidatorRegistry();
  });

  it('registers and retrieves a validator by name', () => {
    const fn: CustomValidatorFn = () => [];
    registry.register('my_validator', fn);
    expect(registry.getValidator('my_validator')).toBe(fn);
  });

  it('returns undefined for an unregistered name', () => {
    expect(registry.getValidator('nonexistent')).toBeUndefined();
  });

  it('replaces an existing validator on re-registration', () => {
    const fn1: CustomValidatorFn = () => [];
    const fn2: CustomValidatorFn = () => [{ field: 'x', errorCode: 'E', message: 'm' }];
    registry.register('v', fn1);
    registry.register('v', fn2);
    expect(registry.getValidator('v')).toBe(fn2);
  });

  it('removes a registered validator and returns true', () => {
    registry.register('v', () => []);
    expect(registry.remove('v')).toBe(true);
    expect(registry.getValidator('v')).toBeUndefined();
  });

  it('returns false when removing an unregistered validator', () => {
    expect(registry.remove('nonexistent')).toBe(false);
  });

  it('lists all registered validator names', () => {
    registry.register('alpha', () => []);
    registry.register('beta', () => []);
    registry.register('gamma', () => []);
    expect(registry.listRegistered().sort()).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('listRegistered returns empty array when nothing is registered', () => {
    expect(registry.listRegistered()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

describe('customValidatorRegistry singleton', () => {
  it('is an instance of CustomValidatorRegistry', () => {
    expect(customValidatorRegistry).toBeInstanceOf(CustomValidatorRegistry);
  });
});

// ---------------------------------------------------------------------------
// Custom validator invocation through validate()
// ---------------------------------------------------------------------------

describe('validate() with custom validators', () => {
  beforeEach(() => {
    // Clear any previously registered validators on the singleton
    for (const name of customValidatorRegistry.listRegistered()) {
      customValidatorRegistry.remove(name);
    }
  });

  afterAll(() => {
    // Clean up
    for (const name of customValidatorRegistry.listRegistered()) {
      customValidatorRegistry.remove(name);
    }
  });

  it('invokes a registered custom validator and appends its errors', () => {
    const customError: ValidationError = {
      field: 'addr',
      errorCode: 'MISSING_POSTAL_CODE',
      message: 'Postal code is required',
    };
    customValidatorRegistry.register('address_structure', () => [customError]);

    const schema = makeSchema([
      customField('addr', 'Address', 'address_structure'),
    ]);
    const result = validate(schema, { addr: { street: '123 Main' } });

    expect(result.valid).toBe(false);
    expect(result.errors['addr']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'MISSING_POSTAL_CODE' }),
      ]),
    );
  });

  it('does not add errors when custom validator returns empty array', () => {
    customValidatorRegistry.register('always_valid', () => []);

    const schema = makeSchema([
      customField('widget', 'Widget', 'always_valid'),
    ]);
    const result = validate(schema, { widget: 'anything' });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('passes (value, formData, field) to the custom validator', () => {
    const spy = jest.fn<ValidationError[], [unknown, FormData, FormField]>(() => []);
    customValidatorRegistry.register('spy_validator', spy);

    const field = customField('myField', 'My Field', 'spy_validator');
    const schema = makeSchema([field]);
    const data: FormData = { myField: 'hello', other: 42 };
    validate(schema, data);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('hello', data, expect.objectContaining({ id: 'myField' }));
  });

  it('appends custom errors after built-in errors', () => {
    const customError: ValidationError = {
      field: 'name',
      errorCode: 'CUSTOM_CHECK',
      message: 'Custom check failed',
    };
    customValidatorRegistry.register('name_check', () => [customError]);

    const schema = makeSchema([
      customField('name', 'Name', 'name_check', {
        type: 'text',
        required: true,
        validation: { minLength: 100 },
      }),
    ]);
    const result = validate(schema, { name: 'short' });

    expect(result.valid).toBe(false);
    const errorCodes = result.errors['name'].map((e) => e.errorCode);
    expect(errorCodes).toContain('MIN_LENGTH');
    expect(errorCodes).toContain('CUSTOM_CHECK');
  });

  it('silently skips when validatorName is not registered', () => {
    const schema = makeSchema([
      customField('widget', 'Widget', 'nonexistent_validator'),
    ]);
    const result = validate(schema, { widget: 'value' });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('catches throwing validator and produces CUSTOM_VALIDATOR_ERROR', () => {
    customValidatorRegistry.register('boom', () => {
      throw new Error('Kaboom!');
    });

    const schema = makeSchema([
      customField('widget', 'Widget', 'boom'),
    ]);
    const result = validate(schema, { widget: 'value' });

    expect(result.valid).toBe(false);
    expect(result.errors['widget']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'widget',
          errorCode: 'CUSTOM_VALIDATOR_ERROR',
        }),
      ]),
    );
  });

  it('continues validating remaining fields after a throwing validator', () => {
    customValidatorRegistry.register('boom', () => {
      throw new Error('Kaboom!');
    });

    const schema = makeSchema([
      customField('field1', 'Field 1', 'boom'),
      {
        id: 'field2',
        type: 'text',
        label: 'Field 2',
        required: true,
      },
    ]);
    const result = validate(schema, { field1: 'value' });

    // field1 should have CUSTOM_VALIDATOR_ERROR
    expect(result.errors['field1']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'CUSTOM_VALIDATOR_ERROR' }),
      ]),
    );
    // field2 should have REQUIRED error (no short-circuiting)
    expect(result.errors['field2']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ errorCode: 'REQUIRED' }),
      ]),
    );
  });

  it('does not invoke custom validator when field has no customValidation', () => {
    const spy = jest.fn(() => []);
    customValidatorRegistry.register('should_not_run', spy);

    const schema = makeSchema([
      { id: 'plain', type: 'text', label: 'Plain', required: false },
    ]);
    validate(schema, { plain: 'value' });

    expect(spy).not.toHaveBeenCalled();
  });
});
