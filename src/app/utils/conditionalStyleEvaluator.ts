/**
 * Conditional Style Evaluator
 *
 * Pure function that evaluates conditional style rules against form state.
 * Returns merged class names and inline styles for all matching rules.
 */

import type { CSSProperties } from 'react';
import type { ConditionalStyleRule } from '../types/layoutTypes';

export interface ConditionalStyleResult {
  classNames: string;
  inlineStyle: CSSProperties;
}

/**
 * Evaluates a single condition against a field value.
 */
function evaluateCondition(
  operator: ConditionalStyleRule['operator'],
  fieldValue: unknown,
  ruleValue: string | number,
): boolean {
  switch (operator) {
    case 'equals':
      // eslint-disable-next-line eqeqeq
      return fieldValue == ruleValue;

    case 'not_equals':
      // eslint-disable-next-line eqeqeq
      return fieldValue != ruleValue;

    case 'contains':
      if (typeof fieldValue === 'string' && typeof ruleValue === 'string') {
        return fieldValue.includes(ruleValue);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(ruleValue);
      }
      return false;

    case 'greater_than': {
      const numField = Number(fieldValue);
      const numRule = Number(ruleValue);
      if (isNaN(numField) || isNaN(numRule)) return false;
      return numField > numRule;
    }

    case 'less_than': {
      const numField = Number(fieldValue);
      const numRule = Number(ruleValue);
      if (isNaN(numField) || isNaN(numRule)) return false;
      return numField < numRule;
    }

    default:
      return false;
  }
}

/**
 * Evaluates conditional style rules against form data.
 *
 * - Ignores rules that reference field IDs not in the schema's field ID set
 *   and logs a console warning.
 * - Merges all matching rules' className and inlineStyle, with later rules
 *   taking precedence for conflicting inline style properties.
 */
export function evaluateConditionalStyles(
  rules: ConditionalStyleRule[],
  formData: Record<string, unknown>,
  schemaFieldIds: Set<string>,
): ConditionalStyleResult {
  const classNames: string[] = [];
  const mergedStyle: CSSProperties = {};

  for (const rule of rules) {
    // Skip rules referencing non-existent fields
    if (!schemaFieldIds.has(rule.field)) {
      console.warn(
        `[ConditionalStyleEvaluator] Rule references non-existent field "${rule.field}" — skipping.`,
      );
      continue;
    }

    const fieldValue = formData[rule.field];
    const conditionMet = evaluateCondition(rule.operator, fieldValue, rule.value);

    if (conditionMet) {
      if (rule.className) {
        classNames.push(rule.className);
      }
      if (rule.inlineStyle) {
        Object.assign(mergedStyle, rule.inlineStyle);
      }
    }
  }

  return {
    classNames: classNames.join(' '),
    inlineStyle: mergedStyle,
  };
}
