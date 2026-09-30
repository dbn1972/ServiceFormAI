import { validateSchema } from '../schema-validator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paymentField(overrides: Record<string, unknown> = {}) {
  return {
    id: 'payment_field',
    type: 'payment',
    label: 'Payment',
    required: true,
    customConfig: {
      staticFee: '150.00',
    },
    ...overrides,
  };
}

function validSchemaWithPayment(fieldOverrides: Record<string, unknown> = {}) {
  return {
    version: '1.0',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      paymentField(fieldOverrides),
    ],
  };
}

// ---------------------------------------------------------------------------
// Payment field validation
// ---------------------------------------------------------------------------

describe('payment field validation', () => {
  it('accepts valid payment field with staticFee', () => {
    const result = validateSchema(validSchemaWithPayment());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts valid payment field with feeExpression', () => {
    const result = validateSchema(validSchemaWithPayment({
      customConfig: {
        feeExpression: {
          type: 'lookup',
          fieldRef: 'category',
          table: { general: '100.00' },
        },
      },
    }));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects payment field with both staticFee and feeExpression', () => {
    const result = validateSchema(validSchemaWithPayment({
      customConfig: {
        staticFee: '100.00',
        feeExpression: {
          type: 'lookup',
          fieldRef: 'category',
          table: { general: '100.00' },
        },
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_INVALID_PAYMENT_FIELD',
        }),
      ]),
    );
  });

  it('rejects payment field with neither staticFee nor feeExpression', () => {
    const result = validateSchema(validSchemaWithPayment({
      customConfig: {},
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_INVALID_PAYMENT_FIELD',
        }),
      ]),
    );
  });

  it('rejects payment field with no customConfig', () => {
    const schema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'pay', type: 'payment', label: 'Payment', required: true },
      ],
    };
    const result = validateSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_INVALID_PAYMENT_FIELD',
        }),
      ]),
    );
  });

  it('rejects schema with two payment fields', () => {
    const schema = {
      version: '1.0',
      fields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        paymentField({ id: 'pay1' }),
        paymentField({ id: 'pay2' }),
      ],
    };
    const result = validateSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_DUPLICATE_PAYMENT_FIELD',
        }),
      ]),
    );
  });

  it('rejects payment field with unsupported currency', () => {
    const result = validateSchema(validSchemaWithPayment({
      customConfig: {
        staticFee: '100.00',
        currency: 'USD',
      },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SCHEMA_UNSUPPORTED_CURRENCY',
        }),
      ]),
    );
  });

  it('accepts payment field with supported currency (INR)', () => {
    const result = validateSchema(validSchemaWithPayment({
      customConfig: {
        staticFee: '100.00',
        currency: 'INR',
      },
    }));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts payment field without explicit currency (defaults to INR)', () => {
    const result = validateSchema(validSchemaWithPayment());
    expect(result.valid).toBe(true);
  });

  it('payment type is accepted as a supported field type', () => {
    const result = validateSchema({
      version: '1.0',
      fields: [
        {
          id: 'pay',
          type: 'payment',
          label: 'Payment',
          required: true,
          customConfig: { staticFee: '50.00' },
        },
      ],
    });
    expect(result.valid).toBe(true);
  });
});
