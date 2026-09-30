/**
 * Unit tests for conflictMapper utility
 * Validates: Requirements 6.3
 */
import { describe, it, expect } from 'vitest';
import { mapFormDataToNewSchema } from '../conflictMapper';
import type { ServiceFormSchema } from '../../types/externalAPI';

function makeSchema(fieldIds: string[]): ServiceFormSchema {
  return {
    version: '1.0',
    serviceId: 'svc-1',
    serviceName: 'Test Service',
    department: 'Test Dept',
    metadata: {
      description: 'Test',
      category: 'Test',
      sla: '5 days',
      targetAudience: 'All',
    },
    fields: fieldIds.map((id) => ({
      id,
      type: 'text' as const,
      label: id,
      required: false,
    })),
    documents: [],
    endpoints: {
      submit: { url: '/submit', method: 'POST' as const },
      status: { url: '/status', method: 'GET' as const },
    },
  };
}

describe('mapFormDataToNewSchema', () => {
  // (a) fields present in both old data and new schema are preserved
  it('preserves values for fields present in both old data and new schema', () => {
    const oldData = { name: 'Ananya', age: '25', city: 'Mumbai' };
    const newSchema = makeSchema(['name', 'age', 'city']);

    const result = mapFormDataToNewSchema(oldData, newSchema);

    expect(result.name).toBe('Ananya');
    expect(result.age).toBe('25');
    expect(result.city).toBe('Mumbai');
  });

  // (b) fields in old data but not in new schema are dropped
  it('drops fields that are in old data but not in new schema', () => {
    const oldData = { name: 'Ananya', oldField: 'should be dropped' };
    const newSchema = makeSchema(['name']);

    const result = mapFormDataToNewSchema(oldData, newSchema);

    expect(result.name).toBe('Ananya');
    expect('oldField' in result).toBe(false);
  });

  // (c) fields in new schema but not in old data are empty strings
  it('sets new schema fields not in old data to empty string', () => {
    const oldData = { name: 'Ananya' };
    const newSchema = makeSchema(['name', 'newField', 'anotherNewField']);

    const result = mapFormDataToNewSchema(oldData, newSchema);

    expect(result.newField).toBe('');
    expect(result.anotherNewField).toBe('');
  });

  // (d) empty old data returns empty mapped object (all fields empty strings)
  it('returns all empty strings when old data is empty', () => {
    const oldData = {};
    const newSchema = makeSchema(['field1', 'field2']);

    const result = mapFormDataToNewSchema(oldData, newSchema);

    expect(result.field1).toBe('');
    expect(result.field2).toBe('');
  });

  // (e) all new schema fields are present in output
  it('output contains exactly the new schema field IDs', () => {
    const oldData = { field1: 'val1', removedField: 'val2' };
    const newSchema = makeSchema(['field1', 'field2', 'field3']);

    const result = mapFormDataToNewSchema(oldData, newSchema);

    expect(Object.keys(result).sort()).toEqual(['field1', 'field2', 'field3'].sort());
  });
});
