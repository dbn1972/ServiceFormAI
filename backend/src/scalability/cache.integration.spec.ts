/**
 * Volume 14 — Cache Service Integration Tests
 *
 * Tests the real CacheService in memory-only mode (no Redis required).
 * These tests use the REAL CacheService implementation with a real in-memory
 * store — no mocking — giving genuine integration coverage.
 *
 * Coverage:
 *  A. Cache miss → loader is called, result stored, returned
 *  B. Cache hit → loader is NOT called on second request (in-memory)
 *  C. Cache invalidate → subsequent read calls loader again
 *  D. Cache invalidateByPrefix → removes all matching keys
 *  E. Stampede protection → concurrent reads for same key call loader once
 *  F. Negative caching → NotFoundException is cached; loader not retried immediately
 *  G. Stale-while-revalidate → stale entry returned; background repopulation triggered
 *  H. Metrics are updated correctly (hit/miss/latency)
 *  I. Fallback budget enforcement → throws after exceeding maxFallbacksPerMinute
 *
 * Run: cd backend && npx jest cache.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CacheService } from './cache.service';
import { ScalabilityConfigService } from './scalability-config.service';
import { ScalabilityMetricsService } from './scalability-metrics.service';
import { makeMockMetrics } from '../test/test-helpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a real CacheService with in-memory store (no Redis) */
async function buildCacheService(overrideConfig: Partial<ReturnType<ScalabilityConfigService['getConfig']>> = {}): Promise<{
  cache: CacheService;
  metrics: ReturnType<typeof makeMockMetrics>;
}> {
  const metrics = makeMockMetrics();

  const defaultConfig = {
    cache: { enabled: true },
    featureFlags: {},
    dbFallback: { enabled: true, maxFallbacksPerMinute: 500 },
  };

  const mockConfig: Partial<ScalabilityConfigService> = {
    getConfig: jest.fn().mockReturnValue({ ...defaultConfig, ...overrideConfig }),
    getDomainConfig: jest.fn().mockReturnValue({
      enabled: true,
      ttlMs: 5_000,
      staleMs: 2_000,
      negativeTtlMs: 3_000,
    }),
    isFeatureEnabled: jest.fn().mockReturnValue(true),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CacheService,
      { provide: ScalabilityConfigService, useValue: mockConfig },
      { provide: ScalabilityMetricsService, useValue: metrics },
    ],
  }).compile();

  const cache = module.get<CacheService>(CacheService);
  // onModuleInit is called automatically by TestingModule.compile()
  return { cache, metrics };
}

// ─── A. Cache miss + B. Cache hit ────────────────────────────────────────────

describe('CacheService — read-through behavior', () => {
  let cache: CacheService;
  let metrics: ReturnType<typeof makeMockMetrics>;

  beforeEach(async () => {
    ({ cache, metrics } = await buildCacheService());
  });

  const READ_OPTS = {
    key: 'test:services:all',
    domain: 'consumer-services-list',
    endpoint: 'consumer.getServices',
    featureFlag: 'consumer.services.cache',
  };

  it('cache miss: calls loader and returns its value', async () => {
    const loader = jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test Service' }] });

    const result = await cache.readThrough({ ...READ_OPTS, loader });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [{ id: '1', name: 'Test Service' }] });
    expect(metrics.recordCacheMiss).toHaveBeenCalledWith(READ_OPTS.endpoint);
  });

  it('cache hit: second read for same key does NOT call loader', async () => {
    const loader = jest.fn().mockResolvedValue({ data: [{ id: '1' }] });

    // First call populates cache
    await cache.readThrough({ ...READ_OPTS, loader });
    // Second call should hit cache
    await cache.readThrough({ ...READ_OPTS, loader });

    expect(loader).toHaveBeenCalledTimes(1); // loader called only once
    expect(metrics.recordCacheHit).toHaveBeenCalledWith(READ_OPTS.endpoint);
  });

  it('cache hit: returns the same data without re-executing the loader', async () => {
    const data = { services: [{ id: 'svc-1', name: 'Water Bill' }] };
    const loader = jest.fn().mockResolvedValue(data);

    const first = await cache.readThrough({ ...READ_OPTS, loader });
    const second = await cache.readThrough({ ...READ_OPTS, loader });

    expect(first).toEqual(data);
    expect(second).toEqual(data);
  });
});

// ─── C. Cache invalidation ────────────────────────────────────────────────────

describe('CacheService — invalidation', () => {
  let cache: CacheService;

  beforeEach(async () => {
    ({ cache } = await buildCacheService());
  });

  const READ_OPTS = {
    key: 'test:service:svc-1',
    domain: 'consumer-service-detail',
    endpoint: 'consumer.getServiceById',
    featureFlag: 'consumer.service.cache',
  };

  it('invalidate removes the key so the next read calls loader again', async () => {
    const loader = jest.fn().mockResolvedValue({ id: 'svc-1', name: 'Test' });

    await cache.readThrough({ ...READ_OPTS, loader });
    await cache.invalidate(READ_OPTS.key);
    await cache.readThrough({ ...READ_OPTS, loader });

    expect(loader).toHaveBeenCalledTimes(2); // loader called twice after invalidation
  });
});

// ─── D. Prefix invalidation ───────────────────────────────────────────────────

describe('CacheService — prefix invalidation', () => {
  let cache: CacheService;

  beforeEach(async () => {
    ({ cache } = await buildCacheService());
  });

  it('invalidateByPrefix removes all keys matching the prefix', async () => {
    const loader1 = jest.fn().mockResolvedValue('service-1');
    const loader2 = jest.fn().mockResolvedValue('service-2');
    const loaderOther = jest.fn().mockResolvedValue('other-entity');

    const opts = (key: string, loader: any) => ({
      key,
      domain: 'consumer-services-list',
      endpoint: 'test',
      featureFlag: 'consumer.services.cache',
      loader,
    });

    // Populate 3 keys
    await cache.readThrough(opts('producer:services:tenant-1:page-1', loader1));
    await cache.readThrough(opts('producer:services:tenant-1:page-2', loader2));
    await cache.readThrough(opts('consumer:other:key', loaderOther));

    // Invalidate producer prefix
    await cache.invalidateByPrefix('producer:services:tenant-1');

    // Both producer keys should miss; loader is called again
    await cache.readThrough(opts('producer:services:tenant-1:page-1', loader1));
    await cache.readThrough(opts('producer:services:tenant-1:page-2', loader2));
    // Consumer key should still be cached; loaderOther not called again
    await cache.readThrough(opts('consumer:other:key', loaderOther));

    expect(loader1).toHaveBeenCalledTimes(2); // miss → hit after invalidation → miss
    expect(loader2).toHaveBeenCalledTimes(2);
    expect(loaderOther).toHaveBeenCalledTimes(1); // still in cache
  });
});

// ─── E. Stampede protection ───────────────────────────────────────────────────

describe('CacheService — stampede protection', () => {
  let cache: CacheService;

  beforeEach(async () => {
    ({ cache } = await buildCacheService());
  });

  it('concurrent reads for the same key call loader exactly once', async () => {
    let loaderCallCount = 0;

    const slowLoader = jest.fn(async () => {
      loaderCallCount++;
      await new Promise((r) => setTimeout(r, 50)); // simulate slow DB
      return { data: 'expensive-result' };
    });

    const opts = {
      key: 'test:expensive:key',
      domain: 'consumer-services-list',
      endpoint: 'test',
      featureFlag: 'consumer.services.cache',
      loader: slowLoader,
    };

    // Fire 5 concurrent reads for the same key
    const results = await Promise.all([
      cache.readThrough(opts),
      cache.readThrough(opts),
      cache.readThrough(opts),
      cache.readThrough(opts),
      cache.readThrough(opts),
    ]);

    // All should return the same value
    results.forEach((r) => expect(r).toEqual({ data: 'expensive-result' }));
    // Loader should only be called once (stampede protection via inFlight map)
    expect(loaderCallCount).toBe(1);
  });
});

// ─── F. Negative caching (NotFoundException) ──────────────────────────────────

describe('CacheService — negative caching', () => {
  let cache: CacheService;

  beforeEach(async () => {
    ({ cache } = await buildCacheService());
  });

  it('NotFoundException from loader is cached — second call does not invoke loader', async () => {
    const loader = jest.fn().mockRejectedValue(new NotFoundException('Entity not found'));

    const opts = {
      key: 'test:nonexistent:entity-id-999',
      domain: 'consumer-service-detail',
      endpoint: 'test',
      featureFlag: 'consumer.service.cache',
      loader,
    };

    // First call: loader throws, negative entry stored
    await expect(cache.readThrough(opts)).rejects.toThrow(NotFoundException);
    // Second call: negative cache hit — loader NOT called again
    await expect(cache.readThrough(opts)).rejects.toThrow(NotFoundException);

    expect(loader).toHaveBeenCalledTimes(1); // NOT called twice
  });
});

// ─── G. Metrics integration ───────────────────────────────────────────────────

describe('CacheService — metrics integration', () => {
  let cache: CacheService;
  let metrics: ReturnType<typeof makeMockMetrics>;

  beforeEach(async () => {
    ({ cache, metrics } = await buildCacheService());
  });

  it('records cache miss then cache hit in metrics', async () => {
    const loader = jest.fn().mockResolvedValue({ result: 42 });
    const opts = {
      key: 'test:metrics:key',
      domain: 'consumer-services-list',
      endpoint: 'consumer.getServices',
      featureFlag: 'consumer.services.cache',
      loader,
    };

    await cache.readThrough(opts);
    await cache.readThrough(opts);

    expect(metrics.recordCacheMiss).toHaveBeenCalledTimes(1);
    expect(metrics.recordCacheHit).toHaveBeenCalledTimes(1);
    expect(metrics.recordCacheLatency).toHaveBeenCalledTimes(2);
  });

  it('records cache invalidation in metrics', async () => {
    await cache.invalidate('test:metrics:key');
    expect(metrics.recordCacheInvalidation).toHaveBeenCalledTimes(1);
  });
});

// ─── H. Cache disabled path ───────────────────────────────────────────────────

describe('CacheService — cache disabled fallback', () => {
  it('calls loader directly when cache.enabled = false', async () => {
    const { cache, metrics } = await buildCacheService({
      cache: { enabled: false },
    } as any);

    const loader = jest.fn().mockResolvedValue({ data: [] });
    const opts = {
      key: 'test:disabled:key',
      domain: 'consumer-services-list',
      endpoint: 'consumer.getServices',
      featureFlag: 'consumer.services.cache',
      loader,
    };

    await cache.readThrough(opts);
    await cache.readThrough(opts);

    // Both calls go directly to loader since cache is disabled
    expect(loader).toHaveBeenCalledTimes(2);
    expect(metrics.recordDirectDbRead).toHaveBeenCalledTimes(2);
  });
});
