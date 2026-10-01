import { afterEach, describe, expect, it, vi } from 'vitest';

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('../../app/services/api/base.service', () => ({
  apiService: { get: apiGet },
}));

import { ConsumerService } from '../../app/services/api/consumer.service';

describe('Consumer API contract — services', () => {
  afterEach(() => {
    apiGet.mockReset();
  });

  it('maps the backend paginated envelope into normalized services', async () => {
    apiGet.mockResolvedValueOnce({
      data: [
        {
          id: 'service-income',
          tenant_id: 'tenant-revenue',
          tenant_name: 'Revenue Department',
          name: 'Income Certificate',
          category: 'Certificates',
          description: 'Income verification service',
          sla_days: 5,
          fees: 50,
        },
      ],
      total: 3,
      page: 2,
      limit: 1,
    });

    const result = await new ConsumerService().getServices(
      { search: undefined, category: undefined },
      { page: 2, limit: 1 },
    );

    expect(apiGet).toHaveBeenCalledWith('/consumer/services', { page: 2, limit: 1 });
    expect(result).toMatchObject({ total: 3, page: 2, limit: 1, totalPages: 3 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'service-income',
      tenantId: 'tenant-revenue',
      name: 'Income Certificate',
      category: 'Certificates',
      isPublished: true,
      slaDays: 5,
      fees: 50,
      tenant: { id: 'tenant-revenue', name: 'Revenue Department' },
    });
  });
});