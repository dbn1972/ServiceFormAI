import {
  createFormState,
  setFieldValue,
  validateFormState,
  getDirtyFields,
  resetFormState,
} from './state.js';
import type { FormSchema } from './types.js';

describe('createFormState', () => {
  it('produces empty state for an empty schema', () => {
    const schema: FormSchema = { version: '1.0', fields: [] };
    const state = createFormState(schema);

    expect(state.values).toEqual({});
    expect(state.touched).toEqual({});
    expect(state.errors).toEqual({});
    expect(state.visibleFieldIds).toEqual([]);
  });

  it('defaults checkbox fields to false', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'agree', type: 'checkbox', label: 'Agree', required: false },
        { id: 'subscribe', type: 'checkbox', label: 'Subscribe', required: false },
      ],
    };
    const state = createFormState(schema);

    expect(state.values.agree).toBe(false);
    expect(state.values.subscribe).toBe(false);
  });

  it('defaults text fields to empty string', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: false },
        { id: 'phone', type: 'phone', label: 'Phone', required: false },
        { id: 'notes', type: 'textarea', label: 'Notes', required: false },
      ],
    };
    const state = createFormState(schema);

    expect(state.values.name).toBe('');
    expect(state.values.email).toBe('');
    expect(state.values.phone).toBe('');
    expect(state.values.notes).toBe('');
  });

  it('overlays initialValues on top of defaults', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'age', type: 'number', label: 'Age', required: false },
        { id: 'agree', type: 'checkbox', label: 'Agree', required: false },
      ],
    };
    const state = createFormState(schema, { name: 'Alice', agree: true });

    expect(state.values.name).toBe('Alice');
    expect(state.values.age).toBe('');
    expect(state.values.agree).toBe(true);
  });

  it('computes visibleFieldIds correctly for conditional fields', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'country', type: 'dropdown', label: 'Country', required: true, options: [{ value: 'IN', label: 'India' }, { value: 'US', label: 'USA' }] },
        {
          id: 'state_in',
          type: 'text',
          label: 'Indian State',
          required: false,
          conditional: { field: 'country', operator: 'equals', value: 'IN' },
        },
        {
          id: 'state_us',
          type: 'text',
          label: 'US State',
          required: false,
          conditional: { field: 'country', operator: 'equals', value: 'US' },
        },
      ],
    };

    // No initial value for country — defaults to empty string
    const stateDefault = createFormState(schema);
    expect(stateDefault.visibleFieldIds).toContain('country');
    expect(stateDefault.visibleFieldIds).not.toContain('state_in');
    expect(stateDefault.visibleFieldIds).not.toContain('state_us');

    // With country = 'IN'
    const stateIN = createFormState(schema, { country: 'IN' });
    expect(stateIN.visibleFieldIds).toContain('country');
    expect(stateIN.visibleFieldIds).toContain('state_in');
    expect(stateIN.visibleFieldIds).not.toContain('state_us');

    // With country = 'US'
    const stateUS = createFormState(schema, { country: 'US' });
    expect(stateUS.visibleFieldIds).toContain('country');
    expect(stateUS.visibleFieldIds).not.toContain('state_in');
    expect(stateUS.visibleFieldIds).toContain('state_us');
  });

  it('returns a frozen (immutable) state object', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
      ],
    };
    const state = createFormState(schema);

    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.values)).toBe(true);
    expect(Object.isFrozen(state.touched)).toBe(true);
    expect(Object.isFrozen(state.errors)).toBe(true);
    expect(Object.isFrozen(state.visibleFieldIds)).toBe(true);
  });

  it('has empty touched and errors on initial state', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'agree', type: 'checkbox', label: 'Agree', required: false },
      ],
    };
    const state = createFormState(schema);

    expect(Object.keys(state.touched)).toHaveLength(0);
    expect(Object.keys(state.errors)).toHaveLength(0);
  });

  it('defaults all non-checkbox field types to empty string', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'f1', type: 'number', label: 'Number', required: false },
        { id: 'f2', type: 'date', label: 'Date', required: false },
        { id: 'f3', type: 'dropdown', label: 'Dropdown', required: false },
        { id: 'f4', type: 'radio', label: 'Radio', required: false },
        { id: 'f5', type: 'file', label: 'File', required: false },
      ],
    };
    const state = createFormState(schema);

    expect(state.values.f1).toBe('');
    expect(state.values.f2).toBe('');
    expect(state.values.f3).toBe('');
    expect(state.values.f4).toBe('');
    expect(state.values.f5).toBe('');
  });
});

// ---------------------------------------------------------------------------
// setFieldValue
// ---------------------------------------------------------------------------

describe('setFieldValue', () => {
  const schema: FormSchema = {
    version: '1.0',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: false },
      { id: 'agree', type: 'checkbox', label: 'Agree', required: false },
    ],
  };

  it('updates the specified field value', () => {
    const state = createFormState(schema);
    const newState = setFieldValue(schema, state, 'name', 'Alice');

    expect(newState.values.name).toBe('Alice');
    expect(newState.values.email).toBe('');
    expect(newState.values.agree).toBe(false);
  });

  it('returns a new state object (does not mutate original)', () => {
    const state = createFormState(schema);
    const newState = setFieldValue(schema, state, 'name', 'Bob');

    expect(newState).not.toBe(state);
    expect(state.values.name).toBe('');
    expect(newState.values.name).toBe('Bob');
  });

  it('preserves existing touched and errors', () => {
    // Create a state with some touched/errors by building manually
    const initial = createFormState(schema);
    // Simulate a state that has touched and errors via validateFormState
    const validated = validateFormState(schema, initial);
    const withValue = setFieldValue(schema, validated, 'name', 'Alice');

    // touched and errors references should be preserved
    expect(withValue.touched).toBe(validated.touched);
    expect(withValue.errors).toBe(validated.errors);
  });

  it('returns state unchanged when fieldId does not exist in schema', () => {
    const state = createFormState(schema);
    const result = setFieldValue(schema, state, 'nonexistent', 'value');

    expect(result).toBe(state);
  });

  it('re-computes visibility when value changes affect conditionals', () => {
    const conditionalSchema: FormSchema = {
      version: '1.0',
      fields: [
        {
          id: 'country',
          type: 'dropdown',
          label: 'Country',
          required: true,
          options: [
            { value: 'IN', label: 'India' },
            { value: 'US', label: 'USA' },
          ],
        },
        {
          id: 'state_in',
          type: 'text',
          label: 'Indian State',
          required: false,
          conditional: { field: 'country', operator: 'equals', value: 'IN' },
        },
      ],
    };

    const state = createFormState(conditionalSchema);
    expect(state.visibleFieldIds).not.toContain('state_in');

    const newState = setFieldValue(conditionalSchema, state, 'country', 'IN');
    expect(newState.visibleFieldIds).toContain('state_in');
  });

  it('returns a frozen state object', () => {
    const state = createFormState(schema);
    const newState = setFieldValue(schema, state, 'name', 'Alice');

    expect(Object.isFrozen(newState)).toBe(true);
    expect(Object.isFrozen(newState.values)).toBe(true);
    expect(Object.isFrozen(newState.visibleFieldIds)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateFormState
// ---------------------------------------------------------------------------

describe('validateFormState', () => {
  it('returns errors for required fields with empty values', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
      ],
    };
    const state = createFormState(schema);
    const validated = validateFormState(schema, state);

    expect(validated.errors.name).toBeDefined();
    expect(typeof validated.errors.name).toBe('string');
    expect(validated.errors.email).toBeDefined();
    expect(typeof validated.errors.email).toBe('string');
  });

  it('returns no errors when all required fields have values', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
      ],
    };
    const state = createFormState(schema, { name: 'Alice' });
    const validated = validateFormState(schema, state);

    expect(Object.keys(validated.errors)).toHaveLength(0);
  });

  it('preserves values, touched, and visibleFieldIds', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
      ],
    };
    const state = createFormState(schema, { name: 'Alice' });
    const validated = validateFormState(schema, state);

    expect(validated.values).toBe(state.values);
    expect(validated.touched).toBe(state.touched);
    expect(validated.visibleFieldIds).toBe(state.visibleFieldIds);
  });

  it('extracts only the first error message per field', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
          validation: { pattern: '^[a-z]+@[a-z]+\\.[a-z]+$' },
        },
      ],
    };
    // Empty value triggers both REQUIRED and possibly pattern errors
    const state = createFormState(schema);
    const validated = validateFormState(schema, state);

    // Should have exactly one string error for email, not an array
    expect(typeof validated.errors.email).toBe('string');
  });

  it('supports single-field validation via options.fieldId', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true },
      ],
    };
    const state = createFormState(schema);
    const validated = validateFormState(schema, state, { fieldId: 'name' });

    // Only name should have an error, email should not be validated
    expect(validated.errors.name).toBeDefined();
    expect(validated.errors.email).toBeUndefined();
  });

  it('returns a frozen state object', () => {
    const schema: FormSchema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
      ],
    };
    const state = createFormState(schema);
    const validated = validateFormState(schema, state);

    expect(Object.isFrozen(validated)).toBe(true);
    expect(Object.isFrozen(validated.errors)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getDirtyFields
// ---------------------------------------------------------------------------

describe('getDirtyFields', () => {
  const schema: FormSchema = {
    version: '1.0',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: false },
      { id: 'agree', type: 'checkbox', label: 'Agree', required: false },
    ],
  };

  it('returns empty array when states are identical', () => {
    const state = createFormState(schema);
    const dirty = getDirtyFields(state, state);

    expect(dirty).toEqual([]);
  });

  it('returns changed field IDs', () => {
    const initial = createFormState(schema);
    const updated = setFieldValue(schema, initial, 'name', 'Alice');
    const dirty = getDirtyFields(updated, initial);

    expect(dirty).toContain('name');
    expect(dirty).not.toContain('email');
    expect(dirty).not.toContain('agree');
  });

  it('detects multiple dirty fields', () => {
    const initial = createFormState(schema);
    let updated = setFieldValue(schema, initial, 'name', 'Alice');
    updated = setFieldValue(schema, updated, 'agree', true);
    const dirty = getDirtyFields(updated, initial);

    expect(dirty).toContain('name');
    expect(dirty).toContain('agree');
    expect(dirty).not.toContain('email');
    expect(dirty).toHaveLength(2);
  });

  it('uses shallow inequality (===) for comparison', () => {
    const initial = createFormState(schema, { name: 'Alice' });
    // Set to the same string value — should NOT be dirty
    const updated = setFieldValue(schema, initial, 'name', 'Alice');
    const dirty = getDirtyFields(updated, initial);

    expect(dirty).not.toContain('name');
  });
});

// ---------------------------------------------------------------------------
// resetFormState
// ---------------------------------------------------------------------------

describe('resetFormState', () => {
  const schema: FormSchema = {
    version: '1.0',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: false },
      { id: 'agree', type: 'checkbox', label: 'Agree', required: false },
    ],
  };

  it('produces the same result as createFormState', () => {
    const created = createFormState(schema);
    const reset = resetFormState(schema);

    expect(reset).toEqual(created);
  });

  it('produces the same result as createFormState with initialValues', () => {
    const initialValues = { name: 'Alice', agree: true };
    const created = createFormState(schema, initialValues);
    const reset = resetFormState(schema, initialValues);

    expect(reset).toEqual(created);
  });

  it('resets dirty state after modifications', () => {
    const initial = createFormState(schema);
    const modified = setFieldValue(schema, initial, 'name', 'Bob');
    const reset = resetFormState(schema);

    expect(reset).toEqual(initial);
    expect(getDirtyFields(reset, initial)).toEqual([]);
  });

  it('returns a frozen state object', () => {
    const state = resetFormState(schema);

    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.values)).toBe(true);
    expect(Object.isFrozen(state.touched)).toBe(true);
    expect(Object.isFrozen(state.errors)).toBe(true);
  });
});
