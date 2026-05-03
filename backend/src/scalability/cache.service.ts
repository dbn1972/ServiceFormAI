import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { ScalabilityConfigService } from './scalability-config.service';
import { ScalabilityMetricsService } from './scalability-metrics.service';

type CacheEntry<T> = {
  kind: 'value' | 'negative';
  value: T | null;
  expiresAt: number;
  staleUntil: number;
};

type ReadThroughOptions<T> = {
  key: string;
  domain: string;
  endpoint: string;
  featureFlag: string;
  loader: () => Promise<T>;
};

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly fallbackWindows = new Map<string, { windowStartedAt: number; count: number }>();
  private redisClient: RedisClientType | null = null;
  private redisEnabled = false;

  constructor(
    private readonly configService: ScalabilityConfigService,
    private readonly metricsService: ScalabilityMetricsService,
  ) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.metricsService.setCacheAvailability('memory-only');
      return;
    }

    try {
      this.redisClient = createClient({ url: redisUrl });
      this.redisClient.on('error', () => {
        this.disableRedis('Redis emitted a runtime error; cache is degrading to memory-fallback mode.');
      });
      await this.redisClient.connect();
      this.redisEnabled = true;
      this.metricsService.setCacheAvailability('redis');
    } catch {
      this.disableRedis(
        'REDIS_URL is configured but Redis cache connection failed; cache is running in memory-fallback mode.',
      );
    }
  }

  async onModuleDestroy() {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
    }
  }

  async readThrough<T>(options: ReadThroughOptions<T>): Promise<T> {
    const startedAt = Date.now();
    const domainConfig = this.configService.getDomainConfig(options.domain);
    const cacheEnabled = this.configService.getConfig().cache.enabled
      && domainConfig.enabled
      && this.configService.isFeatureEnabled(options.featureFlag);

    if (!cacheEnabled) {
      this.metricsService.recordDirectDbRead(
        options.endpoint,
        `Cache disabled for domain ${options.domain}; falling back directly to database.`,
      );
      const result = await this.loadAndRecord(options);
      this.metricsService.recordCacheLatency(Date.now() - startedAt);
      return result;
    }

    const now = Date.now();
    const cached = await this.getEntry<T>(options.key);

    if (cached && cached.expiresAt > now) {
      this.metricsService.recordCacheHit(options.endpoint);
      this.metricsService.recordCacheLatency(Date.now() - startedAt);
      return this.resolveCachedEntry(cached);
    }

    if (cached && cached.staleUntil > now) {
      this.metricsService.recordStaleServed();
      this.metricsService.recordCacheHit(options.endpoint);
      void this.repopulate(options);
      this.metricsService.recordCacheLatency(Date.now() - startedAt);
      return this.resolveCachedEntry(cached);
    }

    this.metricsService.recordCacheMiss(options.endpoint);
    try {
      const result = await this.repopulate(options);
      this.metricsService.recordCacheLatency(Date.now() - startedAt);
      return result;
    } catch (error) {
      this.metricsService.recordCacheLatency(Date.now() - startedAt);
      throw error;
    }
  }

  async invalidate(key: string) {
    this.store.delete(key);
    if (this.redisEnabled && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {
        this.disableRedis('Redis key invalidation failed; cache is degrading to memory-fallback mode.');
      }
    }
    this.metricsService.recordCacheInvalidation();
  }

  async invalidateByPrefix(prefix: string) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    if (this.redisEnabled && this.redisClient) {
      try {
        const keys: string[] = [];
        for await (const key of this.redisClient.scanIterator({
          MATCH: `${prefix}*`,
          COUNT: 100,
        })) {
          if (Array.isArray(key)) {
            keys.push(...key.map((item) => String(item)));
          } else {
            keys.push(String(key));
          }
        }
        if (keys.length > 0) {
          for (const key of keys) {
            await this.redisClient.del(key);
          }
        }
      } catch {
        this.disableRedis('Redis prefix invalidation failed; cache is degrading to memory-fallback mode.');
      }
    }
    this.metricsService.recordCacheInvalidation();
  }

  private async repopulate<T>(options: ReadThroughOptions<T>): Promise<T> {
    const existing = this.inFlight.get(options.key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const promise = this.loadAndRecord(options)
      .then((value) => {
        const domainConfig = this.configService.getDomainConfig(options.domain);
        const now = Date.now();
        return this.setEntry(options.key, {
          kind: 'value',
          value,
          expiresAt: now + domainConfig.ttlMs,
          staleUntil: now + domainConfig.ttlMs + domainConfig.staleWhileRevalidateMs,
        }).then(() => {
          this.metricsService.recordCacheRepopulation(true);
          return value;
        });
      })
      .catch((error) => {
        if (error instanceof NotFoundException) {
          const domainConfig = this.configService.getDomainConfig(options.domain);
          const now = Date.now();
          return this.setEntry(options.key, {
            kind: 'negative',
            value: null,
            expiresAt: now + domainConfig.negativeTtlMs,
            staleUntil: now + domainConfig.negativeTtlMs,
          }).then(() => {
            this.metricsService.recordCacheRepopulation(true);
            throw error;
          });
        }

        this.metricsService.recordCacheError();
        this.metricsService.recordCacheRepopulation(false);
        throw error;
      })
      .finally(() => {
        this.inFlight.delete(options.key);
      });

    this.inFlight.set(options.key, promise);
    return promise;
  }

  private async loadAndRecord<T>(options: ReadThroughOptions<T>): Promise<T> {
    this.enforceFallbackBudget(options.endpoint);
    this.metricsService.recordFallbackToDb(options.endpoint);
    return options.loader();
  }

  private enforceFallbackBudget(endpoint: string) {
    const fallbackConfig = this.configService.getConfig().dbFallback;
    if (!fallbackConfig.enabled) {
      this.metricsService.recordQueueCapabilityGap(
        'Unsafe cache fallback',
        endpoint,
        'Database fallback is disabled for this environment; refusing uncached database access.',
        'High',
      );
      throw new ServiceUnavailableException('Cache fallback disabled. Please retry shortly.');
    }

    const now = Date.now();
    const current = this.fallbackWindows.get(endpoint);
    if (!current || now - current.windowStartedAt >= 60_000) {
      this.fallbackWindows.set(endpoint, {
        windowStartedAt: now,
        count: 1,
      });
      return;
    }

    if (current.count >= fallbackConfig.maxFallbacksPerMinute) {
      this.metricsService.recordQueueCapabilityGap(
        'Unsafe cache fallback',
        endpoint,
        `Database fallback budget exceeded for ${endpoint}. Refusing more direct reads this minute to protect PostgreSQL.`,
        'Critical',
      );
      throw new ServiceUnavailableException('System is protecting the database from overload. Please retry shortly.');
    }

    current.count += 1;
  }

  private async getEntry<T>(key: string): Promise<CacheEntry<T> | undefined> {
    const memoryEntry = this.store.get(key) as CacheEntry<T> | undefined;
    if (memoryEntry) {
      return memoryEntry;
    }

    if (!this.redisEnabled || !this.redisClient) {
      return undefined;
    }

    try {
      const raw = await this.redisClient.get(key);
      if (!raw) {
        return undefined;
      }
      if (typeof raw !== 'string') {
        return undefined;
      }

      const parsed = JSON.parse(raw) as CacheEntry<T>;
      this.store.set(key, parsed as CacheEntry<unknown>);
      return parsed;
    } catch {
      this.disableRedis('Redis read failed; cache is degrading to memory-fallback mode.');
      return undefined;
    }
  }

  private async setEntry<T>(key: string, entry: CacheEntry<T>) {
    this.store.set(key, entry as CacheEntry<unknown>);

    if (!this.redisEnabled || !this.redisClient) {
      return;
    }

    try {
      const ttlSeconds = Math.max(1, Math.ceil((entry.staleUntil - Date.now()) / 1000));
      await this.redisClient.set(key, JSON.stringify(entry), {
        EX: ttlSeconds,
      });
    } catch {
      this.disableRedis('Redis write failed; cache is degrading to memory-fallback mode.');
    }
  }

  private resolveCachedEntry<T>(entry: CacheEntry<T>): T {
    if (entry.kind === 'negative') {
      this.metricsService.recordNegativeCacheHit();
      throw new NotFoundException('Resource not found');
    }

    return entry.value as T;
  }

  private disableRedis(detail: string) {
    this.redisEnabled = false;
    this.metricsService.setCacheAvailability('memory-fallback');
    this.metricsService.recordQueueCapabilityGap(
      'Infrastructure bottleneck',
      'cache.redis',
      detail,
      'High',
    );
  }

  async ping(): Promise<void> {
    if (this.redisEnabled && this.redisClient) {
      await this.redisClient.ping();
    }
    // In-memory fallback: always healthy
  }
}
