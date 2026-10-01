import { describe, expect, it } from 'vitest';
import { createBlankBuilderState } from '../../components/form-builder/types';
import { buildServiceDefinition } from '../builderServiceDefinition';

describe('buildServiceDefinition', () => {
  it('preserves form layout and cross-field rules in the persisted contract', () => {
    const state = createBlankBuilderState();
    state.metadata = {
      serviceName: 'Income Certificate',
      category: 'Revenue',
      description: 'Issue an income certificate after review.',
      slaDays: 14,
    };
    state.fields = [
      { id: 'income', type: 'number', label: 'Annual income', required: true },
      { id: 'district', type: 'text', label: 'District', required: true },
    ];
    state.sections = [
      { id: 'household', title: 'Household details', fieldIds: ['income', 'district'] },
    ];
    state.crossFieldRules = [
      { type: 'required_if', fields: ['income', 'district'], targetField: 'district', targetValue: 100000 },
    ];

    const definition = buildServiceDefinition(state);
    const formSchema = definition.formSchema as unknown as Record<string, any>;
    const manifest = definition.manifest as Record<string, any>;

    expect(formSchema.sections).toEqual([
      { id: 'household', title: 'Household details', description: undefined, fieldIds: ['income', 'district'] },
    ]);
    expect(formSchema.crossFieldRules).toEqual(state.crossFieldRules);
    expect(manifest.service.formSchema.crossFieldRules).toEqual(state.crossFieldRules);
    expect(manifest.service.formSchema).toEqual(definition.formSchema);
    expect(manifest.service.slaDays).toBe(14);
    expect(manifest.eligibility).toEqual({ mode: 'human_review', rules: [] });
    expect(manifest.workflow.stages.length).toBeGreaterThan(1);
    expect(manifest.output.format).toBe('PDF');
  });

  it('classifies a licence service and keeps a stable persisted service ID', () => {
    const state = createBlankBuilderState('service-123');
    state.metadata = {
      serviceId: 'service-123',
      serviceName: 'Trade Licence',
      category: 'Municipal',
      description: 'Issue a municipal trade licence.',
    };
    state.fields = [
      { id: 'business_name', type: 'text', label: 'Business name', required: true },
    ];

    const definition = buildServiceDefinition(state);
    const manifest = definition.manifest as Record<string, any>;

    expect(manifest.serviceType).toBe('license');
    expect(manifest.service.id).toBe('service-123');
    expect(definition.slaDays).toBe(30);
  });

  it('rejects incomplete service metadata or an empty form', () => {
    const state = createBlankBuilderState();
    expect(() => buildServiceDefinition(state)).toThrow('Service name and category are required.');

    state.metadata.serviceName = 'Test service';
    state.metadata.category = 'Testing';
    expect(() => buildServiceDefinition(state)).toThrow('Add at least one field before saving the service.');
  });
});
