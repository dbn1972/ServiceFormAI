/**
 * ReferenceValidator — Finds broken field references in BuilderState.
 *
 * Checks conditional visibility rules and cross-field rules for
 * references to field IDs that don't exist in the state's fields array.
 */

import type { BuilderState, BrokenReference } from '../components/form-builder/types';

/**
 * Find all broken field references in the given BuilderState.
 *
 * Checks:
 * 1. Conditional visibility rules referencing non-existent field IDs
 * 2. Cross-field rules referencing non-existent field IDs
 */
export function findBrokenReferences(state: BuilderState): BrokenReference[] {
  const fieldIds = new Set(state.fields.map((f) => f.id));
  const broken: BrokenReference[] = [];

  // Check conditional visibility rules
  for (const field of state.fields) {
    if (field.conditional && !fieldIds.has(field.conditional.field)) {
      broken.push({
        type: 'conditional',
        fieldId: field.id,
        referencedFieldId: field.conditional.field,
        context: `Field "${field.label}" has a conditional rule referencing non-existent field "${field.conditional.field}"`,
      });
    }
  }

  // Check cross-field rules
  for (const rule of state.crossFieldRules) {
    for (const refFieldId of rule.fields) {
      if (!fieldIds.has(refFieldId)) {
        broken.push({
          type: 'cross-field',
          fieldId: refFieldId,
          referencedFieldId: refFieldId,
          context: `Cross-field rule (${rule.type}) references non-existent field "${refFieldId}"`,
        });
      }
    }
    if (rule.targetField && !fieldIds.has(rule.targetField)) {
      broken.push({
        type: 'cross-field',
        fieldId: rule.targetField,
        referencedFieldId: rule.targetField,
        context: `Cross-field rule (${rule.type}) targets non-existent field "${rule.targetField}"`,
      });
    }
  }

  return broken;
}
