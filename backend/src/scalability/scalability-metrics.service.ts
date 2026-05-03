import { Injectable } from '@nestjs/common';

export type ScalabilityViolationType =
  | 'Direct DB read without cache'
  | 'Direct DB write without queue'
  | 'Unsafe cache fallback'
  | 'Missing cache repopulation'
  | 'Missing cache invalidation'
  | 'Missing queue retry'
  | 'Missing DLQ'
  | 'Missing idempotency'
  | 'Missing monitoring'
  | 'Missing admin control'
  | 'Missing rate limit'
  | 'Missing backpressure'
  | 'Database bottleneck'
  | 'Infrastructure bottleneck';

export interface ScalabilityViolationRecord {
  timestamp: string;
  type: ScalabilityViolationType;
  module: string;
  detail: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

@Injectable()
export class ScalabilityMetricsService {
  private readonly startedAt = new Date().toISOString();
  private readonly cacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    latencyMsTotal: 0,
    staleServed: 0,
    fallbackToDb: 0,
    repopulations: 0,
    repopulationFailures: 0,
    invalidations: 0,
    negativeHits: 0,
    availability: 'memory-only' as 'redis' | 'memory-fallback' | 'memory-only',
    byEndpoint: {} as Record<string, { hits: number; misses: number; fallbackToDb: number }>,
  };
  private readonly queueStats = {
    availability: 'missing' as 'redis' | 'database' | 'memory-disabled' | 'missing' | 'disabled',
    depth: 0,
    lag: 0,
    oldestMessageAgeMs: 0,
    processingRate: 0,
    errorRate: 0,
    retryCount: 0,
    dlqCount: 0,
    processed: 0,
    duplicates: 0,
    poisonMessages: 0,
    directWriteBypasses: 0,
    enqueued: 0,
    // Per-message-type throughput (§D requirement)
    byType: {} as Record<string, { enqueued: number; processed: number; failed: number }>,
  };
  private readonly databaseStats = {
    directReadViolations: 0,
    directWriteViolations: 0,
    fallbackReads: 0,
  };
  private readonly violations: ScalabilityViolationRecord[] = [];

  recordCacheHit(endpoint: string) {
    this.cacheStats.hits += 1;
    this.ensureEndpoint(endpoint).hits += 1;
  }

  recordCacheMiss(endpoint: string) {
    this.cacheStats.misses += 1;
    this.ensureEndpoint(endpoint).misses += 1;
  }

  recordCacheError() {
    this.cacheStats.errors += 1;
  }

  recordCacheLatency(latencyMs: number) {
    this.cacheStats.latencyMsTotal += latencyMs;
  }

  recordStaleServed() {
    this.cacheStats.staleServed += 1;
  }

  recordNegativeCacheHit() {
    this.cacheStats.negativeHits += 1;
  }

  recordFallbackToDb(endpoint: string) {
    this.cacheStats.fallbackToDb += 1;
    this.databaseStats.fallbackReads += 1;
    this.ensureEndpoint(endpoint).fallbackToDb += 1;
  }

  recordCacheRepopulation(success: boolean) {
    if (success) {
      this.cacheStats.repopulations += 1;
      return;
    }

    this.cacheStats.repopulationFailures += 1;
  }

  recordCacheInvalidation() {
    this.cacheStats.invalidations += 1;
  }

  setCacheAvailability(mode: 'redis' | 'memory-fallback' | 'memory-only') {
    this.cacheStats.availability = mode;
  }

  recordDirectDbRead(module: string, detail: string, severity: ScalabilityViolationRecord['severity'] = 'High') {
    this.databaseStats.directReadViolations += 1;
    this.pushViolation({
      timestamp: new Date().toISOString(),
      type: 'Direct DB read without cache',
      module,
      detail,
      severity,
    });
  }

  recordDirectDbWrite(module: string, detail: string, severity: ScalabilityViolationRecord['severity'] = 'Critical') {
    this.databaseStats.directWriteViolations += 1;
    this.queueStats.directWriteBypasses += 1;
    this.pushViolation({
      timestamp: new Date().toISOString(),
      type: 'Direct DB write without queue',
      module,
      detail,
      severity,
    });
  }

  recordQueueCapabilityGap(type: ScalabilityViolationType, module: string, detail: string, severity: ScalabilityViolationRecord['severity']) {
    this.pushViolation({
      timestamp: new Date().toISOString(),
      type,
      module,
      detail,
      severity,
    });
  }

  incrementQueueRetry() {
    this.queueStats.retryCount += 1;
  }

  incrementDlq() {
    this.queueStats.dlqCount += 1;
  }

  setQueueAvailability(mode: 'redis' | 'database' | 'memory-disabled' | 'missing' | 'disabled') {
    this.queueStats.availability = mode;
  }

  setQueueSnapshot(snapshot: {
    depth: number;
    lag: number;
    oldestMessageAgeMs: number;
    dlqCount: number;
  }) {
    this.queueStats.depth = snapshot.depth;
    this.queueStats.lag = snapshot.lag;
    this.queueStats.oldestMessageAgeMs = snapshot.oldestMessageAgeMs;
    this.queueStats.dlqCount = snapshot.dlqCount;
  }

  recordQueueEnqueue(messageType?: string) {
    this.queueStats.enqueued += 1;
    if (messageType) {
      this.ensureQueueType(messageType).enqueued += 1;
    }
  }

  recordQueueError() {
    this.queueStats.errorRate += 1;
  }

  recordQueueDuplicate() {
    this.queueStats.duplicates += 1;
  }

  recordQueueProcessed(messageType?: string) {
    this.queueStats.processed += 1;
    if (messageType) {
      this.ensureQueueType(messageType).processed += 1;
    }
  }

  recordQueueFailed(messageType?: string) {
    if (messageType) {
      this.ensureQueueType(messageType).failed += 1;
    }
  }

  recordPoisonMessage() {
    this.queueStats.poisonMessages += 1;
  }

  private ensureQueueType(type: string) {
    if (!this.queueStats.byType[type]) {
      this.queueStats.byType[type] = { enqueued: 0, processed: 0, failed: 0 };
    }
    return this.queueStats.byType[type];
  }

  getSummary() {
    const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalCacheRequests === 0 ? 0 : this.cacheStats.hits / totalCacheRequests;
    const avgLatencyMs = totalCacheRequests === 0 ? 0 : this.cacheStats.latencyMsTotal / totalCacheRequests;

    return {
      startedAt: this.startedAt,
      cache: {
        ...this.cacheStats,
        hitRate,
        avgLatencyMs,
      },
      queue: {
        ...this.queueStats,
      },
      database: {
        ...this.databaseStats,
      },
      violations: {
        total: this.violations.length,
        critical: this.violations.filter((item) => item.severity === 'Critical').length,
        high: this.violations.filter((item) => item.severity === 'High').length,
        medium: this.violations.filter((item) => item.severity === 'Medium').length,
        low: this.violations.filter((item) => item.severity === 'Low').length,
      },
    };
  }

  getViolations() {
    return [...this.violations];
  }

  private ensureEndpoint(endpoint: string) {
    if (!this.cacheStats.byEndpoint[endpoint]) {
      this.cacheStats.byEndpoint[endpoint] = {
        hits: 0,
        misses: 0,
        fallbackToDb: 0,
      };
    }

    return this.cacheStats.byEndpoint[endpoint];
  }

  private pushViolation(violation: ScalabilityViolationRecord) {
    this.violations.unshift(violation);
    if (this.violations.length > 200) {
      this.violations.length = 200;
    }
  }
}
