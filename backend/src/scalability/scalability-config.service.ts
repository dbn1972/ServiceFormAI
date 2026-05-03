import { Injectable } from '@nestjs/common';

export interface DomainCacheConfig {
  enabled: boolean;
  ttlMs: number;
  staleWhileRevalidateMs: number;
  negativeTtlMs: number;
}

export interface QueueConfig {
  enabled: boolean;
  provider: 'redis' | 'database' | 'disabled';
  retryLimit: number;
  backoffMs: number;
  dlqEnabled: boolean;
  consumersPaused: boolean;
  queueName?: string;
  dlqName?: string;
}

export interface DbFallbackConfig {
  enabled: boolean;
  maxFallbacksPerMinute: number;
}

export interface ScalabilityConfig {
  cache: {
    enabled: boolean;
    domains: Record<string, DomainCacheConfig>;
  };
  queue: QueueConfig;
  dbFallback: DbFallbackConfig;
  featureFlags: Record<string, boolean>;
}

@Injectable()
export class ScalabilityConfigService {
  private readonly defaultQueueProvider = this.resolveDefaultQueueProvider();
  private config: ScalabilityConfig = {
    cache: {
      enabled: true,
      domains: {
        'consumer-services-list': {
          enabled: true,
          ttlMs: 60_000,
          staleWhileRevalidateMs: 15_000,
          negativeTtlMs: 10_000,
        },
        'consumer-service-detail': {
          enabled: true,
          ttlMs: 120_000,
          staleWhileRevalidateMs: 30_000,
          negativeTtlMs: 15_000,
        },
        'consumer-form-schema': {
          enabled: true,
          ttlMs: 300_000,
          staleWhileRevalidateMs: 60_000,
          negativeTtlMs: 15_000,
        },
        'consumer-applications': {
          enabled: true,
          ttlMs: 15_000,
          staleWhileRevalidateMs: 5_000,
          negativeTtlMs: 5_000,
        },
        'producer-services': {
          enabled: true,
          ttlMs: 30_000,
          staleWhileRevalidateMs: 10_000,
          negativeTtlMs: 5_000,
        },
        'producer-applications': {
          enabled: true,
          ttlMs: 10_000,
          staleWhileRevalidateMs: 5_000,
          negativeTtlMs: 5_000,
        },
      },
    },
    queue: {
      enabled: this.defaultQueueProvider !== 'disabled',
      provider: this.defaultQueueProvider,
      retryLimit: 5,
      backoffMs: 5_000,
      dlqEnabled: true,
      consumersPaused: false,
      queueName: 'serviceformai:queue:writes',
      dlqName: 'serviceformai:queue:writes:dlq',
    },
    dbFallback: {
      enabled: true,
      maxFallbacksPerMinute: 500,
    },
    featureFlags: {
      'consumer.services.cache': true,
      'consumer.serviceDetail.cache': true,
      'consumer.formSchema.cache': true,
      'consumer.applications.cache': true,
      'producer.services.cache': true,
      'producer.applications.cache': true,
      // Queue-first write path: enabled by default when a queue provider is available.
      // Set to false to fall back to direct DB writes (e.g. emergency incident response).
      'queue.writePath.enabled': this.defaultQueueProvider !== 'disabled',
      'queue.shadowEvents.enabled': Boolean(process.env.REDIS_URL),
    },
  };

  getConfig(): ScalabilityConfig {
    return structuredClone(this.config);
  }

  getDomainConfig(domain: string): DomainCacheConfig {
    return this.config.cache.domains[domain] || {
      enabled: this.config.cache.enabled,
      ttlMs: 30_000,
      staleWhileRevalidateMs: 5_000,
      negativeTtlMs: 5_000,
    };
  }

  isFeatureEnabled(feature: string): boolean {
    return this.config.featureFlags[feature] ?? false;
  }

  updateConfig(partial: Partial<ScalabilityConfig>): ScalabilityConfig {
    this.config = {
      ...this.config,
      ...partial,
      cache: {
        ...this.config.cache,
        ...(partial.cache || {}),
        domains: {
          ...this.config.cache.domains,
          ...(partial.cache?.domains || {}),
        },
      },
      queue: {
        ...this.config.queue,
        ...(partial.queue || {}),
      },
      dbFallback: {
        ...this.config.dbFallback,
        ...(partial.dbFallback || {}),
      },
      featureFlags: {
        ...this.config.featureFlags,
        ...(partial.featureFlags || {}),
      },
    };

    return this.getConfig();
  }

  private resolveDefaultQueueProvider(): QueueConfig['provider'] {
    const configured = (process.env.QUEUE_PROVIDER || '').trim().toLowerCase();
    if (configured === 'redis' || configured === 'database' || configured === 'disabled') {
      return configured;
    }

    if (process.env.REDIS_URL) {
      return 'redis';
    }

    return 'database';
  }
}
