/**
 * Volume 12 §9 — Module-by-Module Quality Model
 * Volume 12 §11 — Performance and Reliability Validation
 *
 * Unit tests for HealthController — validates health endpoint
 * responses, readiness score structure, and error handling.
 *
 * Run: cd backend && npx jest health.controller.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';
import { ScalabilityConfigService } from './scalability-config.service';
import { ScalabilityMetricsService } from './scalability-metrics.service';
import { QueueService } from './queue.service';
import { CacheService } from './cache.service';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockDataSource = {
  query: jest.fn().mockResolvedValue([{ 1: 1 }]),
};

const mockConfigService = {
  getConfig: jest.fn().mockReturnValue({
    cache: { enabled: true },
    featureFlags: {},
  }),
  getDomainConfig: jest.fn(),
  isFeatureEnabled: jest.fn().mockReturnValue(true),
};

const mockMetricsService = {
  getSummary: jest.fn().mockReturnValue({
    startedAt: new Date().toISOString(),
    queue: { availability: 'redis' },
    cache: { availability: 'redis' },
  }),
  recordCacheHit: jest.fn(),
  recordCacheMiss: jest.fn(),
  recordNegativeCacheHit: jest.fn(),
  recordDirectDbRead: jest.fn(),
  recordFallbackToDb: jest.fn(),
  recordCacheLatency: jest.fn(),
  recordStaleServed: jest.fn(),
  recordCacheRepopulation: jest.fn(),
  recordCacheError: jest.fn(),
  recordCacheInvalidation: jest.fn(),
  recordQueueEnqueue: jest.fn(),
  recordQueueProcessed: jest.fn(),
  recordQueueFailed: jest.fn(),
  recordQueueError: jest.fn(),
  recordQueueDuplicate: jest.fn(),
  recordQueueCapabilityGap: jest.fn(),
  recordDirectDbWrite: jest.fn(),
  recordPoisonMessage: jest.fn(),
  incrementDlq: jest.fn(),
  incrementQueueRetry: jest.fn(),
  setQueueAvailability: jest.fn(),
  setQueueSnapshot: jest.fn(),
  setCacheAvailability: jest.fn(),
  recordDirectWriteBypass: jest.fn(),
};

const mockQueueService = {
  captureMetricsSnapshot: jest.fn().mockResolvedValue(undefined),
};

const mockCacheService = {
  ping: jest.fn().mockResolvedValue(undefined),
  readThrough: jest.fn(),
  invalidate: jest.fn(),
  invalidatePrefix: jest.fn(),
};

// ── Test Suite ────────────────────────────────────────────────────────────────
describe('HealthController (Volume 12 §9 — Health module)', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: mockDataSource },
        { provide: ScalabilityConfigService, useValue: mockConfigService },
        { provide: ScalabilityMetricsService, useValue: mockMetricsService },
        { provide: QueueService, useValue: mockQueueService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    })
      .overrideProvider(DataSource)
      .useValue(mockDataSource)
      .compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();

    // Re-attach mocks after clear
    mockDataSource.query.mockResolvedValue([{ 1: 1 }]);
    mockQueueService.captureMetricsSnapshot.mockResolvedValue(undefined);
    mockMetricsService.getSummary.mockReturnValue({
      startedAt: new Date().toISOString(),
      queue: { availability: 'redis' },
      cache: { availability: 'redis' },
    });
    mockCacheService.ping.mockResolvedValue(undefined);
  });

  // ── GET /health ─────────────────────────────────────────────────────────────
  describe('GET /health (§7.1)', () => {
    it('returns status ok when database is healthy', async () => {
      const result = await controller.health();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('database', 'up');
    });

    it('returns status degraded when database fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('DB error'));
      const result = await controller.health();
      expect(result).toHaveProperty('status', 'degraded');
      expect(result).toHaveProperty('database', 'down');
    });
  });

  // ── GET /ready ──────────────────────────────────────────────────────────────
  describe('GET /ready', () => {
    it('returns ready when database is healthy', async () => {
      const result = await controller.ready();
      expect(result).toHaveProperty('status', 'ready');
      expect(result.checks).toHaveProperty('database', true);
    });

    it('returns not-ready when database fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('DB error'));
      const result = await controller.ready();
      expect(result).toHaveProperty('status', 'not-ready');
      expect(result.checks).toHaveProperty('database', false);
    });
  });

  // ── GET /live ───────────────────────────────────────────────────────────────
  describe('GET /live', () => {
    it('always returns alive', () => {
      const result = controller.live();
      expect(result).toHaveProperty('status', 'alive');
      expect(result).toHaveProperty('startedAt');
    });
  });

  // ── GET /metrics ────────────────────────────────────────────────────────────
  describe('GET /metrics', () => {
    it('returns metrics summary', () => {
      const result = controller.metrics();
      expect(result).toHaveProperty('queue');
      expect(result).toHaveProperty('cache');
    });
  });

  // ── GET /readiness-score (§13 — enterprise readiness) ─────────────────────
  describe('GET /readiness-score (§13)', () => {
    it('returns score between 0 and 100', async () => {
      const result = await controller.readinessScore();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('maxScore', 100);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('returns expected categories', async () => {
      const result = await controller.readinessScore();
      expect(result).toHaveProperty('categories');
      const catKeys = Object.keys(result.categories);
      expect(catKeys).toContain('security');
      expect(catKeys).toContain('data');
      expect(catKeys).toContain('availability');
      expect(catKeys).toContain('monitoring');
      expect(catKeys).toContain('compliance');
    });

    it('returns a valid grade', async () => {
      const result = await controller.readinessScore();
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_IMPROVEMENT']).toContain(result.grade);
    });

    it('each category has score, max, and checks array', async () => {
      const result = await controller.readinessScore();
      Object.values(result.categories).forEach((cat) => {
        expect(cat).toHaveProperty('score');
        expect(cat).toHaveProperty('max');
        expect(cat).toHaveProperty('checks');
        expect(Array.isArray(cat.checks)).toBe(true);
      });
    });

    it('each check has name and status', async () => {
      const result = await controller.readinessScore();
      Object.values(result.categories).forEach((cat) => {
        cat.checks.forEach((check: { name: string; status: string }) => {
          expect(check).toHaveProperty('name');
          expect(check).toHaveProperty('status');
          expect(['pass', 'warn', 'fail']).toContain(check.status);
        });
      });
    });
  });
});
