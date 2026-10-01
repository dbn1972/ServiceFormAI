import { evaluateEligibilityRules } from './eligibility-rules';

describe('evaluateEligibilityRules', () => {
  const fields = new Set(['annual_income', 'district', 'residence_years']);

  it('returns an explainable eligible recommendation but always requires a human decision', () => {
    const result = evaluateEligibilityRules({
      mode: 'rule-based',
      rules: [
        { id: 'income-cap', field: 'annual_income', operator: 'less_than_or_equal', value: 250000 },
        { id: 'district', field: 'district', operator: 'in', value: ['Pune', 'Mumbai'] },
      ],
    }, { annual_income: 200000, district: 'Pune' }, fields);

    expect(result).toMatchObject({
      outcome: 'eligible_for_review',
      requiresHumanDecision: true,
      results: [
        { ruleId: 'income-cap', verdict: 'pass' },
        { ruleId: 'district', verdict: 'pass' },
      ],
    });
  });

  it('returns a potentially-ineligible recommendation without rejecting the applicant', () => {
    const result = evaluateEligibilityRules({
      mode: 'hybrid',
      rules: [{ field: 'annual_income', operator: 'less_than_or_equal', value: 100000 }],
    }, { annual_income: 200000 }, fields);

    expect(result.outcome).toBe('potentially_ineligible');
    expect(result.requiresHumanDecision).toBe(true);
    expect(result.results[0]?.verdict).toBe('fail');
  });

  it('routes missing, malformed, and unsupported rules to review', () => {
    const result = evaluateEligibilityRules({
      mode: 'rule-based',
      rules: [
        { field: 'annual_income', operator: 'greater_than', value: 100 },
        { field: 'not_a_field', operator: 'equals', value: 'x' },
        { field: 'district', operator: 'run_code', value: 'not executable' },
      ],
    }, {}, fields);

    expect(result.outcome).toBe('review_required');
    expect(result.results.map((item) => item.verdict)).toEqual(['review', 'review', 'review']);
  });

  it('keeps human-review mode regardless of rule matches and limits rule-set size', () => {
    const review = evaluateEligibilityRules({
      mode: 'human_review',
      rules: [{ field: 'annual_income', operator: 'exists' }],
    }, { annual_income: 100 }, fields);
    const oversized = evaluateEligibilityRules({ mode: 'rule-based', rules: Array(101).fill({}) }, {}, fields);

    expect(review.outcome).toBe('review_required');
    expect(oversized.outcome).toBe('review_required');
    expect(oversized.results[0]?.explanation).toContain('safety limit');
  });
});