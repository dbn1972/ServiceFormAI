export type EligibilityOutcome = 'eligible_for_review' | 'potentially_ineligible' | 'review_required';
export type EligibilityRuleVerdict = 'pass' | 'fail' | 'review';

export interface EligibilityRuleResult {
  ruleId: string;
  field: string | null;
  verdict: EligibilityRuleVerdict;
  explanation: string;
}

export interface EligibilityEvaluationResult {
  version: 1;
  mode: 'rule-based' | 'hybrid' | 'human_review';
  outcome: EligibilityOutcome;
  requiresHumanDecision: true;
  results: EligibilityRuleResult[];
}

type RuleOperator = 'equals' | 'not_equals' | 'greater_than' | 'greater_than_or_equal' | 'less_than' | 'less_than_or_equal' | 'in' | 'not_in' | 'contains' | 'exists';

type RuleConfig = {
  id?: unknown;
  field?: unknown;
  operator?: unknown;
  value?: unknown;
  message?: unknown;
};

const ALLOWED_OPERATORS = new Set<RuleOperator>([
  'equals',
  'not_equals',
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'in',
  'not_in',
  'contains',
  'exists',
]);
const OPERATOR_ALIASES: Record<string, RuleOperator> = {
  '=': 'equals',
  '==': 'equals',
  equals: 'equals',
  '!=': 'not_equals',
  '<>': 'not_equals',
  not_equals: 'not_equals',
  '>': 'greater_than',
  greater_than: 'greater_than',
  '>=': 'greater_than_or_equal',
  greater_than_or_equal: 'greater_than_or_equal',
  '<': 'less_than',
  less_than: 'less_than',
  '<=': 'less_than_or_equal',
  less_than_or_equal: 'less_than_or_equal',
  in: 'in',
  not_in: 'not_in',
  contains: 'contains',
  exists: 'exists',
};
const MAX_RULES = 100;
const MAX_EXPLANATION_LENGTH = 240;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function ruleMessage(rule: RuleConfig, fallback: string): string {
  return typeof rule.message === 'string' && rule.message.trim()
    ? rule.message.trim().slice(0, MAX_EXPLANATION_LENGTH)
    : fallback;
}

function compareRule(operator: RuleOperator, actual: unknown, expected: unknown): boolean | null {
  if (operator === 'exists') {
    return actual !== undefined && actual !== null && actual !== '';
  }

  if (actual === undefined || actual === null || actual === '') return null;

  switch (operator) {
    case 'equals':
      return actual === expected;
    case 'not_equals':
      return actual !== expected;
    case 'greater_than':
    case 'greater_than_or_equal':
    case 'less_than':
    case 'less_than_or_equal': {
      const actualNumber = typeof actual === 'number' ? actual : Number(actual);
      const expectedNumber = typeof expected === 'number' ? expected : Number(expected);
      if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) return null;
      if (operator === 'greater_than') return actualNumber > expectedNumber;
      if (operator === 'greater_than_or_equal') return actualNumber >= expectedNumber;
      if (operator === 'less_than') return actualNumber < expectedNumber;
      return actualNumber <= expectedNumber;
    }
    case 'in':
      return Array.isArray(expected) && expected.some((candidate) => candidate === actual);
    case 'not_in':
      return Array.isArray(expected) && !expected.some((candidate) => candidate === actual);
    case 'contains':
      if (typeof actual === 'string' && typeof expected === 'string') return actual.includes(expected);
      if (Array.isArray(actual)) return actual.some((candidate) => candidate === expected);
      return null;
    default:
      return null;
  }
}

/** Evaluate stored service eligibility rules without executing user-provided code. */
export function evaluateEligibilityRules(
  configuration: unknown,
  formData: Record<string, unknown>,
  allowedFieldIds: ReadonlySet<string>,
): EligibilityEvaluationResult {
  const source = Array.isArray(configuration) ? null : configuration;
  const modeValue = Array.isArray(configuration)
    ? 'hybrid'
    : isRecord(source)
      ? source.mode
      : undefined;
  const mode: EligibilityEvaluationResult['mode'] =
    modeValue === 'rule-based' || modeValue === 'hybrid' || modeValue === 'human_review'
      ? modeValue
      : 'human_review';
  const configuredRules = Array.isArray(configuration)
    ? configuration
    : isRecord(configuration) && Array.isArray(configuration.rules)
      ? configuration.rules
      : [];

  if (configuredRules.length > MAX_RULES) {
    return {
      version: 1,
      mode,
      outcome: 'review_required',
      requiresHumanDecision: true,
      results: [{
        ruleId: 'configuration',
        field: null,
        verdict: 'review',
        explanation: `Rule set exceeds the ${MAX_RULES}-rule safety limit.`,
      }],
    };
  }

  const results = configuredRules.map((candidate, index): EligibilityRuleResult => {
    const rule = isRecord(candidate) ? candidate as RuleConfig : {};
    const ruleId = typeof rule.id === 'string' && rule.id.trim() ? rule.id.trim() : `rule-${index + 1}`;
    const field = typeof rule.field === 'string' ? rule.field : null;
    const operator = typeof rule.operator === 'string'
      ? OPERATOR_ALIASES[rule.operator.trim().toLowerCase()] ?? null
      : null;

    if (!field || !allowedFieldIds.has(field)) {
      return { ruleId, field, verdict: 'review', explanation: 'Rule references an unknown service field.' };
    }
    if (!operator || !ALLOWED_OPERATORS.has(operator)) {
      return { ruleId, field, verdict: 'review', explanation: 'Rule uses an unsupported operator.' };
    }
    if (operator !== 'exists' && !(isScalar(rule.value) || (Array.isArray(rule.value) && rule.value.every(isScalar)))) {
      return { ruleId, field, verdict: 'review', explanation: 'Rule value must be a scalar or a list of scalars.' };
    }

    const result = compareRule(operator, formData[field], rule.value);
    if (result === null) {
      return {
        ruleId,
        field,
        verdict: 'review',
        explanation: ruleMessage(rule, 'The submitted value could not be evaluated; officer review is required.'),
      };
    }
    return {
      ruleId,
      field,
      verdict: result ? 'pass' : 'fail',
      explanation: ruleMessage(rule, result ? 'Rule condition met.' : 'Rule condition not met; officer review is required.'),
    };
  });

  let outcome: EligibilityOutcome = 'review_required';
  if (mode !== 'human_review' && results.length > 0 && results.every((result) => result.verdict === 'pass')) {
    outcome = 'eligible_for_review';
  } else if (mode !== 'human_review' && results.some((result) => result.verdict === 'fail')) {
    outcome = 'potentially_ineligible';
  }

  return { version: 1, mode, outcome, requiresHumanDecision: true, results };
}