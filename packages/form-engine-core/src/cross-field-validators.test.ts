import { evaluateCrossFieldRules } from './cross-field-validators';
import type { CrossFieldRule, FormData } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convenience: collect all errors from the Map into a flat array. */
function flatErrors(map: Map<string, import('./types').ValidationError[]>) {
  return [...map.values()].flat();
}

/** Convenience: get error codes for a specific field. */
function errorCodesFor(
  map: Map<string, import('./types').ValidationError[]>,
  fieldId: string,
): string[] {
  return (map.get(fieldId) ?? []).map((e) => e.errorCode);
}

// ---------------------------------------------------------------------------
// date_after
// ---------------------------------------------------------------------------

describe('evaluateCrossFieldRules — date_after', () => {
  const rule: CrossFieldRule = {
    type: 'date_after',
    fields: ['end_date', 'start_date'],
  };
  const scope = new Set(['end_date', 'start_date']);

  it('produces DATE_ORDER_VIOLATION when end_date is before start_date', () => {
    const data: FormData = { start_date: '2024-06-01', end_date: '2024-05-01' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'end_date')).toContain('DATE_ORDER_VIOLATION');
  });

  it('produces DATE_ORDER_VIOLATION when dates are equal (not strictly after)', () => {
    const data: FormData = { start_date: '2024-06-01', end_date: '2024-06-01' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'end_date')).toContain('DATE_ORDER_VIOLATION');
  });

  it('produces no error when end_date is after start_date', () => {
    const data: FormData = { start_date: '2024-06-01', end_date: '2024-07-01' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('skips when either date value is empty', () => {
    const data: FormData = { start_date: '2024-06-01', end_date: '' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('skips when either date value is null', () => {
    const data: FormData = { start_date: null, end_date: '2024-07-01' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('skips when either date is invalid (unparseable)', () => {
    const data: FormData = { start_date: 'not-a-date', end_date: '2024-07-01' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('attaches error to targetField when specified', () => {
    const ruleWithTarget: CrossFieldRule = {
      type: 'date_after',
      fields: ['end_date', 'start_date'],
      targetField: 'start_date',
    };
    const data: FormData = { start_date: '2024-06-01', end_date: '2024-05-01' };
    const result = evaluateCrossFieldRules([ruleWithTarget], data, scope);

    expect(errorCodesFor(result, 'start_date')).toContain('DATE_ORDER_VIOLATION');
    expect(result.has('end_date')).toBe(false);
  });

  it('uses custom message when provided', () => {
    const ruleWithMsg: CrossFieldRule = {
      type: 'date_after',
      fields: ['end_date', 'start_date'],
      message: 'End date must come after start date',
    };
    const data: FormData = { start_date: '2024-06-01', end_date: '2024-05-01' };
    const result = evaluateCrossFieldRules([ruleWithMsg], data, scope);

    const errors = result.get('end_date') ?? [];
    expect(errors[0].message).toBe('End date must come after start date');
  });
});

// ---------------------------------------------------------------------------
// required_if
// ---------------------------------------------------------------------------

describe('evaluateCrossFieldRules — required_if', () => {
  const rule: CrossFieldRule = {
    type: 'required_if',
    fields: ['guardian_name', 'applicant_type'],
    targetValue: 'minor',
  };
  const scope = new Set(['guardian_name', 'applicant_type']);

  it('produces CONDITIONAL_REQUIRED when trigger matches and field is empty', () => {
    const data: FormData = { applicant_type: 'minor', guardian_name: '' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'guardian_name')).toContain('CONDITIONAL_REQUIRED');
  });

  it('produces CONDITIONAL_REQUIRED when trigger matches and field is absent', () => {
    const data: FormData = { applicant_type: 'minor' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'guardian_name')).toContain('CONDITIONAL_REQUIRED');
  });

  it('produces CONDITIONAL_REQUIRED when trigger matches and field is null', () => {
    const data: FormData = { applicant_type: 'minor', guardian_name: null };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'guardian_name')).toContain('CONDITIONAL_REQUIRED');
  });

  it('produces no error when trigger matches and field has a value', () => {
    const data: FormData = { applicant_type: 'minor', guardian_name: 'John' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('produces no error when trigger does not match', () => {
    const data: FormData = { applicant_type: 'adult', guardian_name: '' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('uses custom message when provided', () => {
    const ruleWithMsg: CrossFieldRule = {
      type: 'required_if',
      fields: ['guardian_name', 'applicant_type'],
      targetValue: 'minor',
      message: 'Guardian name is required for minors',
    };
    const data: FormData = { applicant_type: 'minor', guardian_name: '' };
    const result = evaluateCrossFieldRules([ruleWithMsg], data, scope);

    const errors = result.get('guardian_name') ?? [];
    expect(errors[0].message).toBe('Guardian name is required for minors');
  });
});

// ---------------------------------------------------------------------------
// sum_equals
// ---------------------------------------------------------------------------

describe('evaluateCrossFieldRules — sum_equals', () => {
  const rule: CrossFieldRule = {
    type: 'sum_equals',
    fields: ['part_a', 'part_b', 'part_c'],
    targetValue: 100,
  };
  const scope = new Set(['part_a', 'part_b', 'part_c']);

  it('produces SUM_MISMATCH when sum does not equal target', () => {
    const data: FormData = { part_a: 30, part_b: 30, part_c: 30 };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'part_a')).toContain('SUM_MISMATCH');
  });

  it('produces no error when sum equals target', () => {
    const data: FormData = { part_a: 50, part_b: 30, part_c: 20 };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('handles string numeric values', () => {
    const data: FormData = { part_a: '50', part_b: '30', part_c: '20' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('skips when any field has a non-numeric value', () => {
    const data: FormData = { part_a: 'abc', part_b: 30, part_c: 20 };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('attaches error to targetField when specified', () => {
    const ruleWithTarget: CrossFieldRule = {
      type: 'sum_equals',
      fields: ['part_a', 'part_b', 'part_c'],
      targetValue: 100,
      targetField: 'part_c',
    };
    const data: FormData = { part_a: 10, part_b: 10, part_c: 10 };
    const result = evaluateCrossFieldRules([ruleWithTarget], data, scope);

    expect(errorCodesFor(result, 'part_c')).toContain('SUM_MISMATCH');
    expect(result.has('part_a')).toBe(false);
  });

  it('uses custom message when provided', () => {
    const ruleWithMsg: CrossFieldRule = {
      type: 'sum_equals',
      fields: ['part_a', 'part_b', 'part_c'],
      targetValue: 100,
      message: 'Parts must total 100%',
    };
    const data: FormData = { part_a: 10, part_b: 10, part_c: 10 };
    const result = evaluateCrossFieldRules([ruleWithMsg], data, scope);

    const errors = result.get('part_a') ?? [];
    expect(errors[0].message).toBe('Parts must total 100%');
  });
});

// ---------------------------------------------------------------------------
// mutually_exclusive
// ---------------------------------------------------------------------------

describe('evaluateCrossFieldRules — mutually_exclusive', () => {
  const rule: CrossFieldRule = {
    type: 'mutually_exclusive',
    fields: ['passport', 'voter_id', 'driving_license'],
  };
  const scope = new Set(['passport', 'voter_id', 'driving_license']);

  it('produces MUTUALLY_EXCLUSIVE_VIOLATION on each non-empty field when more than one is filled', () => {
    const data: FormData = { passport: 'P123', voter_id: 'V456', driving_license: '' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'passport')).toContain('MUTUALLY_EXCLUSIVE_VIOLATION');
    expect(errorCodesFor(result, 'voter_id')).toContain('MUTUALLY_EXCLUSIVE_VIOLATION');
    expect(result.has('driving_license')).toBe(false);
  });

  it('produces errors on all three when all are filled', () => {
    const data: FormData = { passport: 'P123', voter_id: 'V456', driving_license: 'DL789' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'passport')).toContain('MUTUALLY_EXCLUSIVE_VIOLATION');
    expect(errorCodesFor(result, 'voter_id')).toContain('MUTUALLY_EXCLUSIVE_VIOLATION');
    expect(errorCodesFor(result, 'driving_license')).toContain('MUTUALLY_EXCLUSIVE_VIOLATION');
  });

  it('produces no error when exactly one field is filled', () => {
    const data: FormData = { passport: 'P123', voter_id: '', driving_license: '' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('produces no error when no fields are filled', () => {
    const data: FormData = { passport: '', voter_id: '', driving_license: '' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('treats null and undefined as empty', () => {
    const data: FormData = { passport: 'P123', voter_id: null };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('uses custom message when provided', () => {
    const ruleWithMsg: CrossFieldRule = {
      type: 'mutually_exclusive',
      fields: ['passport', 'voter_id', 'driving_license'],
      message: 'Provide only one ID document',
    };
    const data: FormData = { passport: 'P123', voter_id: 'V456', driving_license: '' };
    const result = evaluateCrossFieldRules([ruleWithMsg], data, scope);

    const errors = result.get('passport') ?? [];
    expect(errors[0].message).toBe('Provide only one ID document');
  });
});

// ---------------------------------------------------------------------------
// match
// ---------------------------------------------------------------------------

describe('evaluateCrossFieldRules — match', () => {
  const rule: CrossFieldRule = {
    type: 'match',
    fields: ['confirm_email', 'email'],
  };
  const scope = new Set(['confirm_email', 'email']);

  it('produces FIELD_MISMATCH when values differ', () => {
    const data: FormData = { email: 'a@b.com', confirm_email: 'x@y.com' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'confirm_email')).toContain('FIELD_MISMATCH');
  });

  it('produces no error when values match', () => {
    const data: FormData = { email: 'a@b.com', confirm_email: 'a@b.com' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('produces FIELD_MISMATCH when one is empty and the other is not', () => {
    const data: FormData = { email: 'a@b.com', confirm_email: '' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(errorCodesFor(result, 'confirm_email')).toContain('FIELD_MISMATCH');
  });

  it('produces no error when both are empty', () => {
    const data: FormData = { email: '', confirm_email: '' };
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('attaches error to targetField when specified', () => {
    const ruleWithTarget: CrossFieldRule = {
      type: 'match',
      fields: ['confirm_email', 'email'],
      targetField: 'email',
    };
    const data: FormData = { email: 'a@b.com', confirm_email: 'x@y.com' };
    const result = evaluateCrossFieldRules([ruleWithTarget], data, scope);

    expect(errorCodesFor(result, 'email')).toContain('FIELD_MISMATCH');
    expect(result.has('confirm_email')).toBe(false);
  });

  it('uses custom message when provided', () => {
    const ruleWithMsg: CrossFieldRule = {
      type: 'match',
      fields: ['confirm_email', 'email'],
      message: 'Email addresses must match',
    };
    const data: FormData = { email: 'a@b.com', confirm_email: 'x@y.com' };
    const result = evaluateCrossFieldRules([ruleWithMsg], data, scope);

    const errors = result.get('confirm_email') ?? [];
    expect(errors[0].message).toBe('Email addresses must match');
  });
});

// ---------------------------------------------------------------------------
// Scope filtering
// ---------------------------------------------------------------------------

describe('evaluateCrossFieldRules — scope filtering', () => {
  it('skips a rule when not all referenced fields are in scope', () => {
    const rule: CrossFieldRule = {
      type: 'match',
      fields: ['confirm_email', 'email'],
    };
    const data: FormData = { email: 'a@b.com', confirm_email: 'x@y.com' };
    // Only email is in scope — confirm_email is not
    const scope = new Set(['email']);
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(0);
  });

  it('evaluates a rule when all referenced fields are in scope', () => {
    const rule: CrossFieldRule = {
      type: 'match',
      fields: ['confirm_email', 'email'],
    };
    const data: FormData = { email: 'a@b.com', confirm_email: 'x@y.com' };
    const scope = new Set(['email', 'confirm_email']);
    const result = evaluateCrossFieldRules([rule], data, scope);

    expect(flatErrors(result)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Multiple rules
// ---------------------------------------------------------------------------

describe('evaluateCrossFieldRules — multiple rules', () => {
  it('evaluates multiple rules and collects all errors', () => {
    const rules: CrossFieldRule[] = [
      {
        type: 'date_after',
        fields: ['end_date', 'start_date'],
      },
      {
        type: 'match',
        fields: ['confirm_email', 'email'],
      },
    ];
    const data: FormData = {
      start_date: '2024-06-01',
      end_date: '2024-05-01',
      email: 'a@b.com',
      confirm_email: 'x@y.com',
    };
    const scope = new Set(['end_date', 'start_date', 'email', 'confirm_email']);
    const result = evaluateCrossFieldRules(rules, data, scope);

    expect(errorCodesFor(result, 'end_date')).toContain('DATE_ORDER_VIOLATION');
    expect(errorCodesFor(result, 'confirm_email')).toContain('FIELD_MISMATCH');
  });

  it('returns empty map when no rules are provided', () => {
    const result = evaluateCrossFieldRules([], {}, new Set());
    expect(result.size).toBe(0);
  });
});
