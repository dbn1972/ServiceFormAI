import { resolveVisibility } from './conditional';
import type { FormField, FormData } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function textField(id: string, label: string, overrides: Partial<FormField> = {}): FormField {
  return { id, type: 'text', label, required: false, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveVisibility()', () => {
  describe('fields without conditional clauses', () => {
    it('marks all fields as visible when none have conditionals', () => {
      const fields: FormField[] = [
        textField('name', 'Name'),
        textField('email', 'Email'),
      ];
      const result = resolveVisibility(fields, {});

      expect(result.get('name')).toBe(true);
      expect(result.get('email')).toBe(true);
    });

    it('returns an empty map for an empty fields array', () => {
      const result = resolveVisibility([], {});
      expect(result.size).toBe(0);
    });
  });

  describe('equals operator', () => {
    it('shows field when condition is satisfied', () => {
      const fields: FormField[] = [
        textField('type', 'Type'),
        textField('details', 'Details', {
          conditional: { field: 'type', operator: 'equals', value: 'other' },
        }),
      ];
      const data: FormData = { type: 'other' };
      const result = resolveVisibility(fields, data);

      expect(result.get('type')).toBe(true);
      expect(result.get('details')).toBe(true);
    });

    it('hides field when condition is not satisfied', () => {
      const fields: FormField[] = [
        textField('type', 'Type'),
        textField('details', 'Details', {
          conditional: { field: 'type', operator: 'equals', value: 'other' },
        }),
      ];
      const data: FormData = { type: 'standard' };
      const result = resolveVisibility(fields, data);

      expect(result.get('type')).toBe(true);
      expect(result.get('details')).toBe(false);
    });

    it('uses string comparison for equals', () => {
      const fields: FormField[] = [
        textField('count', 'Count'),
        textField('extra', 'Extra', {
          conditional: { field: 'count', operator: 'equals', value: '5' },
        }),
      ];
      const data: FormData = { count: 5 };
      const result = resolveVisibility(fields, data);

      expect(result.get('extra')).toBe(true);
    });
  });

  describe('not_equals operator', () => {
    it('shows field when values differ', () => {
      const fields: FormField[] = [
        textField('status', 'Status'),
        textField('reason', 'Reason', {
          conditional: { field: 'status', operator: 'not_equals', value: 'approved' },
        }),
      ];
      const data: FormData = { status: 'rejected' };
      const result = resolveVisibility(fields, data);

      expect(result.get('reason')).toBe(true);
    });

    it('hides field when values are equal', () => {
      const fields: FormField[] = [
        textField('status', 'Status'),
        textField('reason', 'Reason', {
          conditional: { field: 'status', operator: 'not_equals', value: 'approved' },
        }),
      ];
      const data: FormData = { status: 'approved' };
      const result = resolveVisibility(fields, data);

      expect(result.get('reason')).toBe(false);
    });
  });

  describe('greater_than operator', () => {
    it('shows field when numeric value is greater', () => {
      const fields: FormField[] = [
        textField('age', 'Age'),
        textField('guardian', 'Guardian', {
          conditional: { field: 'age', operator: 'greater_than', value: 18 },
        }),
      ];
      const data: FormData = { age: 25 };
      const result = resolveVisibility(fields, data);

      expect(result.get('guardian')).toBe(true);
    });

    it('hides field when numeric value is not greater', () => {
      const fields: FormField[] = [
        textField('age', 'Age'),
        textField('guardian', 'Guardian', {
          conditional: { field: 'age', operator: 'greater_than', value: 18 },
        }),
      ];
      const data: FormData = { age: 15 };
      const result = resolveVisibility(fields, data);

      expect(result.get('guardian')).toBe(false);
    });

    it('hides field when values are equal (not strictly greater)', () => {
      const fields: FormField[] = [
        textField('age', 'Age'),
        textField('guardian', 'Guardian', {
          conditional: { field: 'age', operator: 'greater_than', value: 18 },
        }),
      ];
      const data: FormData = { age: 18 };
      const result = resolveVisibility(fields, data);

      expect(result.get('guardian')).toBe(false);
    });

    it('handles string numeric values', () => {
      const fields: FormField[] = [
        textField('score', 'Score'),
        textField('bonus', 'Bonus', {
          conditional: { field: 'score', operator: 'greater_than', value: '50' },
        }),
      ];
      const data: FormData = { score: '75' };
      const result = resolveVisibility(fields, data);

      expect(result.get('bonus')).toBe(true);
    });
  });

  describe('less_than operator', () => {
    it('shows field when numeric value is less', () => {
      const fields: FormField[] = [
        textField('income', 'Income'),
        textField('subsidy', 'Subsidy', {
          conditional: { field: 'income', operator: 'less_than', value: 50000 },
        }),
      ];
      const data: FormData = { income: 30000 };
      const result = resolveVisibility(fields, data);

      expect(result.get('subsidy')).toBe(true);
    });

    it('hides field when numeric value is not less', () => {
      const fields: FormField[] = [
        textField('income', 'Income'),
        textField('subsidy', 'Subsidy', {
          conditional: { field: 'income', operator: 'less_than', value: 50000 },
        }),
      ];
      const data: FormData = { income: 75000 };
      const result = resolveVisibility(fields, data);

      expect(result.get('subsidy')).toBe(false);
    });

    it('hides field when values are equal (not strictly less)', () => {
      const fields: FormField[] = [
        textField('income', 'Income'),
        textField('subsidy', 'Subsidy', {
          conditional: { field: 'income', operator: 'less_than', value: 50000 },
        }),
      ];
      const data: FormData = { income: 50000 };
      const result = resolveVisibility(fields, data);

      expect(result.get('subsidy')).toBe(false);
    });
  });

  describe('contains operator', () => {
    it('shows field when string contains the substring', () => {
      const fields: FormField[] = [
        textField('description', 'Description'),
        textField('urgentNote', 'Urgent Note', {
          conditional: { field: 'description', operator: 'contains', value: 'urgent' },
        }),
      ];
      const data: FormData = { description: 'This is urgent matter' };
      const result = resolveVisibility(fields, data);

      expect(result.get('urgentNote')).toBe(true);
    });

    it('hides field when string does not contain the substring', () => {
      const fields: FormField[] = [
        textField('description', 'Description'),
        textField('urgentNote', 'Urgent Note', {
          conditional: { field: 'description', operator: 'contains', value: 'urgent' },
        }),
      ];
      const data: FormData = { description: 'Normal request' };
      const result = resolveVisibility(fields, data);

      expect(result.get('urgentNote')).toBe(false);
    });
  });

  describe('conditional chains', () => {
    it('resolves a chain of depth 2 correctly', () => {
      const fields: FormField[] = [
        textField('a', 'Field A'),
        textField('b', 'Field B', {
          conditional: { field: 'a', operator: 'equals', value: 'yes' },
        }),
        textField('c', 'Field C', {
          conditional: { field: 'b', operator: 'equals', value: 'go' },
        }),
      ];

      // a = 'yes' → b visible; b = 'go' → c visible
      const data1: FormData = { a: 'yes', b: 'go' };
      const result1 = resolveVisibility(fields, data1);
      expect(result1.get('b')).toBe(true);
      expect(result1.get('c')).toBe(true);

      // a = 'no' → b hidden → c hidden (dependency not visible)
      const data2: FormData = { a: 'no', b: 'go' };
      const result2 = resolveVisibility(fields, data2);
      expect(result2.get('b')).toBe(false);
      expect(result2.get('c')).toBe(false);
    });

    it('resolves a chain of depth 5 correctly', () => {
      const fields: FormField[] = [
        textField('f1', 'Field 1'),
        textField('f2', 'Field 2', {
          conditional: { field: 'f1', operator: 'equals', value: 'yes' },
        }),
        textField('f3', 'Field 3', {
          conditional: { field: 'f2', operator: 'equals', value: 'yes' },
        }),
        textField('f4', 'Field 4', {
          conditional: { field: 'f3', operator: 'equals', value: 'yes' },
        }),
        textField('f5', 'Field 5', {
          conditional: { field: 'f4', operator: 'equals', value: 'yes' },
        }),
        textField('f6', 'Field 6', {
          conditional: { field: 'f5', operator: 'equals', value: 'yes' },
        }),
      ];

      // All conditions met → all visible
      const data: FormData = { f1: 'yes', f2: 'yes', f3: 'yes', f4: 'yes', f5: 'yes' };
      const result = resolveVisibility(fields, data);
      expect(result.get('f1')).toBe(true);
      expect(result.get('f2')).toBe(true);
      expect(result.get('f3')).toBe(true);
      expect(result.get('f4')).toBe(true);
      expect(result.get('f5')).toBe(true);
      expect(result.get('f6')).toBe(true);
    });

    it('treats fields as visible when chain exceeds depth 5', () => {
      const fields: FormField[] = [
        textField('f1', 'Field 1'),
        textField('f2', 'Field 2', {
          conditional: { field: 'f1', operator: 'equals', value: 'yes' },
        }),
        textField('f3', 'Field 3', {
          conditional: { field: 'f2', operator: 'equals', value: 'yes' },
        }),
        textField('f4', 'Field 4', {
          conditional: { field: 'f3', operator: 'equals', value: 'yes' },
        }),
        textField('f5', 'Field 5', {
          conditional: { field: 'f4', operator: 'equals', value: 'yes' },
        }),
        textField('f6', 'Field 6', {
          conditional: { field: 'f5', operator: 'equals', value: 'yes' },
        }),
        textField('f7', 'Field 7', {
          conditional: { field: 'f6', operator: 'equals', value: 'yes' },
        }),
      ];

      // f7 has chain depth 6 (f7→f6→f5→f4→f3→f2→f1) → treated as visible
      const data: FormData = { f1: 'no' };
      const result = resolveVisibility(fields, data);
      expect(result.get('f7')).toBe(true);
    });

    it('hides downstream fields when an upstream field is hidden', () => {
      const fields: FormField[] = [
        textField('root', 'Root'),
        textField('mid', 'Mid', {
          conditional: { field: 'root', operator: 'equals', value: 'show' },
        }),
        textField('leaf', 'Leaf', {
          conditional: { field: 'mid', operator: 'equals', value: 'go' },
        }),
      ];

      // root = 'hide' → mid hidden → leaf hidden
      const data: FormData = { root: 'hide', mid: 'go' };
      const result = resolveVisibility(fields, data);
      expect(result.get('mid')).toBe(false);
      expect(result.get('leaf')).toBe(false);
    });
  });

  describe('circular dependencies', () => {
    it('treats fields in a simple cycle as visible (fail-open)', () => {
      const fields: FormField[] = [
        textField('a', 'Field A', {
          conditional: { field: 'b', operator: 'equals', value: 'yes' },
        }),
        textField('b', 'Field B', {
          conditional: { field: 'a', operator: 'equals', value: 'yes' },
        }),
      ];
      const data: FormData = {};
      const result = resolveVisibility(fields, data);

      expect(result.get('a')).toBe(true);
      expect(result.get('b')).toBe(true);
    });

    it('treats fields in a 3-node cycle as visible', () => {
      const fields: FormField[] = [
        textField('a', 'Field A', {
          conditional: { field: 'c', operator: 'equals', value: 'yes' },
        }),
        textField('b', 'Field B', {
          conditional: { field: 'a', operator: 'equals', value: 'yes' },
        }),
        textField('c', 'Field C', {
          conditional: { field: 'b', operator: 'equals', value: 'yes' },
        }),
      ];
      const data: FormData = {};
      const result = resolveVisibility(fields, data);

      expect(result.get('a')).toBe(true);
      expect(result.get('b')).toBe(true);
      expect(result.get('c')).toBe(true);
    });

    it('handles a mix of cyclic and non-cyclic fields', () => {
      const fields: FormField[] = [
        textField('normal', 'Normal Field'),
        textField('a', 'Field A', {
          conditional: { field: 'b', operator: 'equals', value: 'yes' },
        }),
        textField('b', 'Field B', {
          conditional: { field: 'a', operator: 'equals', value: 'yes' },
        }),
        textField('dependent', 'Dependent', {
          conditional: { field: 'normal', operator: 'equals', value: 'show' },
        }),
      ];
      const data: FormData = { normal: 'show' };
      const result = resolveVisibility(fields, data);

      expect(result.get('normal')).toBe(true);
      expect(result.get('a')).toBe(true);
      expect(result.get('b')).toBe(true);
      expect(result.get('dependent')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles conditional referencing a non-existent field', () => {
      const fields: FormField[] = [
        textField('details', 'Details', {
          conditional: { field: 'nonexistent', operator: 'equals', value: 'yes' },
        }),
      ];
      const data: FormData = {};
      const result = resolveVisibility(fields, data);

      // The condition evaluates against undefined data, String(undefined) !== 'yes'
      expect(result.get('details')).toBe(false);
    });

    it('handles conditional with undefined data value for equals', () => {
      const fields: FormField[] = [
        textField('trigger', 'Trigger'),
        textField('target', 'Target', {
          conditional: { field: 'trigger', operator: 'equals', value: 'yes' },
        }),
      ];
      const data: FormData = {};
      const result = resolveVisibility(fields, data);

      expect(result.get('target')).toBe(false);
    });

    it('handles conditional with undefined data value for not_equals', () => {
      const fields: FormField[] = [
        textField('trigger', 'Trigger'),
        textField('target', 'Target', {
          conditional: { field: 'trigger', operator: 'not_equals', value: 'yes' },
        }),
      ];
      const data: FormData = {};
      const result = resolveVisibility(fields, data);

      // String(undefined) = 'undefined' !== 'yes' → visible
      expect(result.get('target')).toBe(true);
    });

    it('handles single field with no conditional', () => {
      const fields: FormField[] = [textField('solo', 'Solo')];
      const result = resolveVisibility(fields, {});
      expect(result.get('solo')).toBe(true);
    });
  });
});
