import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createClient, type RedisClientType } from 'redis';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import {
  QueueMessageEntity,
  type QueueMessageStatus,
} from '../database/entities/queue-message.entity';
import { ScalabilityConfigService } from './scalability-config.service';
import { ScalabilityMetricsService } from './scalability-metrics.service';

type QueueAvailability = 'redis' | 'database' | 'memory-disabled' | 'missing' | 'disabled';
type QueueProvider = 'redis' | 'database' | 'disabled';

export interface QueueMessage<T = unknown> {
  id: string;
  type: string;
  module: string;
  payload: T;
  enqueuedAt: string;
  attempts: number;
  idempotencyKey: string;
  lastError?: string;
}

export interface ClaimedQueueMessage<T = unknown> {
  raw: string;
  message: QueueMessage<T>;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private redisClient: RedisClientType | null = null;
  private redisEnabled = false;
  private availability: QueueAvailability = 'missing';
  private provider: QueueProvider = 'disabled';

  constructor(
    @InjectRepository(QueueMessageEntity)
    private readonly queueMessageRepository: Repository<QueueMessageEntity>,
    private readonly dataSource: DataSource,
    private readonly configService: ScalabilityConfigService,
    private readonly metricsService: ScalabilityMetricsService,
  ) {}

  async onModuleInit() {
    await this.initializeProvider();
  }

  async onModuleDestroy() {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
    }
  }

  /** Returns true when the durable queue-first write path is active. */
  isWritePathEnabled(): boolean {
    const config = this.configService.getConfig();
    return (
      config.queue.enabled &&
      this.provider !== 'disabled' &&
      this.configService.isFeatureEnabled('queue.writePath.enabled')
    );
  }

  async enqueueWriteCommand<T>(options: {
    type: string;
    module: string;
    payload: T;
    idempotencyKey?: string;
  }) {
    const queueConfig = this.configService.getConfig().queue;
    const idempotencyKey = options.idempotencyKey || `${options.type}:${this.stableSerialize(options.payload)}`;

    if (!queueConfig.enabled || this.provider === 'disabled') {
      this.metricsService.recordQueueCapabilityGap(
        'Missing monitoring',
        options.module,
        'Write queue enqueue was requested, but no queue provider is currently enabled.',
        'High',
      );
      return { queued: false, reason: 'queue-unavailable', idempotencyKey };
    }

    if (this.provider === 'redis') {
      return this.enqueueRedis(options, idempotencyKey);
    }

    return this.enqueueDatabase(options, idempotencyKey);
  }

  async publishShadowWriteEvent<T>(options: {
    type: string;
    module: string;
    payload: T;
    idempotencyKey?: string;
  }) {
    if (!this.configService.isFeatureEnabled('queue.shadowEvents.enabled')) {
      return { queued: false, reason: 'feature-disabled' as const };
    }

    return this.enqueueWriteCommand(options);
  }

  recordDirectWriteBypass(module: string, detail: string) {
    if (!this.configService.getConfig().queue.enabled) {
      this.metricsService.recordQueueCapabilityGap(
        'Missing monitoring',
        module,
        'No durable queue is configured. Write path is bypassing the queue entirely.',
        'High',
      );
    }

    this.metricsService.recordDirectDbWrite(module, detail);
  }

  pauseConsumers() {
    return this.configService.updateConfig({
      queue: {
        ...this.configService.getConfig().queue,
        consumersPaused: true,
      },
    });
  }

  resumeConsumers() {
    return this.configService.updateConfig({
      queue: {
        ...this.configService.getConfig().queue,
        consumersPaused: false,
      },
    });
  }

  async retryFailedMessages() {
    if (this.provider === 'redis') {
      return this.retryFailedRedisMessages();
    }

    if (this.provider === 'database') {
      return this.retryFailedDatabaseMessages();
    }

    this.metricsService.recordQueueCapabilityGap(
      'Missing DLQ',
      'queue.retryFailedMessages',
      'Retry requested but no queue provider is configured.',
      'High',
    );

    return {
      retried: 0,
      status: 'not-configured',
    };
  }

  async captureMetricsSnapshot() {
    if (this.provider === 'redis') {
      await this.captureRedisMetricsSnapshot();
      return;
    }

    if (this.provider === 'database') {
      await this.captureDatabaseMetricsSnapshot();
      return;
    }

    this.metricsService.setQueueAvailability(this.availability);
    this.metricsService.setQueueSnapshot({
      depth: 0,
      lag: 0,
      oldestMessageAgeMs: 0,
      dlqCount: 0,
    });
  }

  getAvailability() {
    return this.availability;
  }

  getProvider() {
    return this.provider;
  }

  async claimNextMessage(): Promise<ClaimedQueueMessage | null> {
    const queueConfig = this.configService.getConfig().queue;
    if (!queueConfig.enabled || queueConfig.consumersPaused || this.provider === 'disabled') {
      return null;
    }

    if (this.provider === 'redis') {
      return this.claimNextRedisMessage();
    }

    return this.claimNextDatabaseMessage();
  }

  async acknowledgeMessage(claimed: ClaimedQueueMessage) {
    if (this.provider === 'redis') {
      await this.acknowledgeRedisMessage(claimed);
      return;
    }

    if (this.provider === 'database') {
      await this.acknowledgeDatabaseMessage(claimed);
    }
  }

  async failMessage(claimed: ClaimedQueueMessage, error: unknown) {
    if (this.provider === 'redis') {
      await this.failRedisMessage(claimed, error);
      return;
    }

    if (this.provider === 'database') {
      await this.failDatabaseMessage(claimed, error);
    }
  }

  async requeueInFlightMessages() {
    if (this.provider === 'redis') {
      return this.requeueRedisInFlightMessages();
    }

    if (this.provider === 'database') {
      return this.requeueDatabaseInFlightMessages();
    }

    return 0;
  }

  private async initializeProvider() {
    const queueConfig = this.configService.getConfig().queue;
    if (!queueConfig.enabled || queueConfig.provider === 'disabled') {
      this.provider = 'disabled';
      this.setAvailability('disabled');
      return;
    }

    if (queueConfig.provider === 'redis') {
      const initialized = await this.initializeRedisProvider();
      if (!initialized) {
        this.metricsService.recordQueueCapabilityGap(
          'Infrastructure bottleneck',
          'queue.provider',
          'Redis queue provider requested but unavailable. Falling back to database queue provider.',
          'High',
        );
        this.provider = 'database';
        this.setAvailability('database');
      }
    } else {
      this.provider = 'database';
      this.setAvailability('database');
    }

    await this.requeueInFlightMessages();
    await this.captureMetricsSnapshot();
  }

  private async initializeRedisProvider() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.setAvailability('memory-disabled');
      return false;
    }

    try {
      this.redisClient = createClient({ url: redisUrl });
      this.redisClient.on('error', () => {
        this.disableRedis('Redis queue emitted a runtime error; queue provider is degrading.');
      });
      await this.redisClient.connect();
      this.redisEnabled = true;
      this.provider = 'redis';
      this.setAvailability('redis');
      return true;
    } catch {
      this.disableRedis('REDIS_URL is configured but Redis queue connection failed.');
      return false;
    }
  }

  private async enqueueRedis<T>(
    options: { type: string; module: string; payload: T },
    idempotencyKey: string,
  ) {
    if (!this.redisEnabled || !this.redisClient) {
      return { queued: false, reason: 'queue-unavailable', idempotencyKey };
    }

    const duplicateKey = `${this.getQueueNames().queue}:idempotency:${idempotencyKey}`;
    const accepted = await this.redisClient.set(duplicateKey, '1', {
      NX: true,
      EX: 60 * 60 * 24,
    });

    if (accepted !== 'OK') {
      this.metricsService.recordQueueDuplicate();
      await this.captureMetricsSnapshot();
      return { queued: false, reason: 'duplicate', idempotencyKey };
    }

    const message: QueueMessage<T> = {
      id: uuidv4(),
      type: options.type,
      module: options.module,
      payload: options.payload,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
      idempotencyKey,
    };

    try {
      await this.redisClient.rPush(this.getQueueNames().queue, JSON.stringify(message));
      this.metricsService.recordQueueEnqueue(options.type);
      await this.captureMetricsSnapshot();
      return { queued: true, messageId: message.id, idempotencyKey };
    } catch {
      this.metricsService.recordQueueError();
      this.metricsService.recordQueueCapabilityGap(
        'Infrastructure bottleneck',
        options.module,
        'Redis-backed queue push failed; queue provider is unavailable.',
        'Critical',
      );
      await this.captureMetricsSnapshot();
      return { queued: false, reason: 'enqueue-failed', idempotencyKey };
    }
  }

  private async enqueueDatabase<T>(
    options: { type: string; module: string; payload: T },
    idempotencyKey: string,
  ) {
    const existing = await this.queueMessageRepository.findOne({
      where: { idempotency_key: idempotencyKey },
    });

    if (existing) {
      this.metricsService.recordQueueDuplicate();
      await this.captureMetricsSnapshot();
      return { queued: false, reason: 'duplicate', idempotencyKey };
    }

    const entity = this.queueMessageRepository.create({
      provider: 'database',
      type: options.type,
      module: options.module,
      payload: options.payload,
      idempotency_key: idempotencyKey,
      status: 'queued',
      attempts: 0,
      available_at: new Date(),
    });

    await this.queueMessageRepository.save(entity);
    this.metricsService.recordQueueEnqueue(options.type);
    await this.captureMetricsSnapshot();
    return { queued: true, messageId: entity.id, idempotencyKey };
  }

  private async retryFailedRedisMessages() {
    const queueConfig = this.configService.getConfig().queue;
    if (!queueConfig.dlqEnabled || !this.redisEnabled || !this.redisClient) {
      this.metricsService.recordQueueCapabilityGap(
        'Missing DLQ',
        'queue.retryFailedMessages',
        'Retry requested but no Redis-backed DLQ is configured yet.',
        'High',
      );

      return { retried: 0, status: 'not-configured' };
    }

    let retried = 0;
    while (retried < queueConfig.retryLimit) {
      const message = await this.redisClient.lPop(this.getQueueNames().dlq);
      if (!message) {
        break;
      }

      await this.redisClient.rPush(
        this.getQueueNames().queue,
        typeof message === 'string' ? message : JSON.stringify(message),
      );
      retried += 1;
      this.metricsService.incrementQueueRetry();
    }

    await this.captureMetricsSnapshot();
    return { retried, status: retried > 0 ? 'queued' : 'empty' };
  }

  private async retryFailedDatabaseMessages() {
    const queueConfig = this.configService.getConfig().queue;
    if (!queueConfig.dlqEnabled) {
      this.metricsService.recordQueueCapabilityGap(
        'Missing DLQ',
        'queue.retryFailedMessages',
        'Retry requested but database DLQ behavior is disabled.',
        'High',
      );

      return { retried: 0, status: 'not-configured' };
    }

    const failed = await this.queueMessageRepository.find({
      where: { status: 'failed' },
      order: { updated_at: 'ASC' },
      take: queueConfig.retryLimit,
    });

    for (const message of failed) {
      message.status = 'queued';
      message.available_at = new Date();
      await this.queueMessageRepository.save(message);
      this.metricsService.incrementQueueRetry();
    }

    await this.captureMetricsSnapshot();
    return { retried: failed.length, status: failed.length > 0 ? 'queued' : 'empty' };
  }

  private async captureRedisMetricsSnapshot() {
    if (!this.redisEnabled || !this.redisClient) {
      this.metricsService.setQueueAvailability(this.availability);
      this.metricsService.setQueueSnapshot({
        depth: 0,
        lag: 0,
        oldestMessageAgeMs: 0,
        dlqCount: 0,
      });
      return;
    }

    try {
      const queueNames = this.getQueueNames();
      const [depth, processingDepth, dlqCount, oldestRaw] = await Promise.all([
        this.redisClient.lLen(queueNames.queue),
        this.redisClient.lLen(queueNames.processing),
        this.redisClient.lLen(queueNames.dlq),
        this.redisClient.lIndex(queueNames.queue, 0),
      ]);

      let oldestMessageAgeMs = 0;
      if (oldestRaw) {
        const message = this.safeParseMessage(
          typeof oldestRaw === 'string' ? oldestRaw : JSON.stringify(oldestRaw),
        );
        if (message?.enqueuedAt) {
          oldestMessageAgeMs = Math.max(0, Date.now() - new Date(message.enqueuedAt).getTime());
        }
      }

      this.metricsService.setQueueAvailability(this.availability);
      this.metricsService.setQueueSnapshot({
        depth: depth + processingDepth,
        lag: depth + processingDepth,
        oldestMessageAgeMs,
        dlqCount,
      });
    } catch {
      this.metricsService.recordQueueError();
      this.disableRedis('Queue metrics collection failed; Redis-backed queue is degrading.');
      this.metricsService.setQueueSnapshot({
        depth: 0,
        lag: 0,
        oldestMessageAgeMs: 0,
        dlqCount: 0,
      });
    }
  }

  private async captureDatabaseMetricsSnapshot() {
    const now = new Date();
    const [queuedCount, processingCount, dlqCount, oldestQueued] = await Promise.all([
      this.queueMessageRepository.count({
        where: { status: 'queued', available_at: LessThanOrEqual(now) },
      }),
      this.queueMessageRepository.count({
        where: { status: 'processing' },
      }),
      this.queueMessageRepository.count({
        where: { status: 'failed' },
      }),
      this.queueMessageRepository.findOne({
        where: { status: 'queued' },
        order: { created_at: 'ASC' },
      }),
    ]);

    const oldestMessageAgeMs = oldestQueued
      ? Math.max(0, Date.now() - oldestQueued.created_at.getTime())
      : 0;

    this.metricsService.setQueueAvailability(this.availability);
    this.metricsService.setQueueSnapshot({
      depth: queuedCount + processingCount,
      lag: queuedCount + processingCount,
      oldestMessageAgeMs,
      dlqCount,
    });
  }

  private async claimNextRedisMessage(): Promise<ClaimedQueueMessage | null> {
    if (!this.redisEnabled || !this.redisClient) {
      return null;
    }

    const raw = await this.redisClient.lMove(
      this.getQueueNames().queue,
      this.getQueueNames().processing,
      'RIGHT',
      'LEFT',
    );

    if (!raw) {
      await this.captureMetricsSnapshot();
      return null;
    }

    const normalizedRaw = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const message = this.safeParseMessage(normalizedRaw);
    if (!message) {
      await this.redisClient.lRem(this.getQueueNames().processing, 1, normalizedRaw);
      await this.redisClient.lPush(this.getQueueNames().dlq, normalizedRaw);
      this.metricsService.recordPoisonMessage();
      await this.captureMetricsSnapshot();
      return null;
    }

    const processedKey = this.getProcessedKey(message.idempotencyKey);
    const alreadyProcessed = await this.redisClient.get(processedKey);
    if (alreadyProcessed) {
      await this.redisClient.lRem(this.getQueueNames().processing, 1, normalizedRaw);
      this.metricsService.recordQueueDuplicate();
      await this.captureMetricsSnapshot();
      return null;
    }

    await this.captureMetricsSnapshot();
    return { raw: normalizedRaw, message };
  }

  private async claimNextDatabaseMessage(): Promise<ClaimedQueueMessage | null> {
    const now = new Date();
    return this.dataSource.transaction(async (manager) => {
      const entity = await manager.getRepository(QueueMessageEntity)
        .createQueryBuilder('qm')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where('qm.status = :status', { status: 'queued' })
        .andWhere('qm.available_at <= :now', { now })
        .orderBy('qm.created_at', 'ASC')
        .getOne();

      if (!entity) {
        await this.captureMetricsSnapshot();
        return null;
      }

      entity.status = 'processing';
      entity.claimed_at = new Date();
      await manager.getRepository(QueueMessageEntity).save(entity);

      await this.captureMetricsSnapshot();
      return {
        raw: entity.id,
        message: this.mapEntityToMessage(entity),
      };
    });
  }

  private async acknowledgeRedisMessage(claimed: ClaimedQueueMessage) {
    if (!this.redisEnabled || !this.redisClient) {
      return;
    }

    await this.redisClient.lRem(this.getQueueNames().processing, 1, claimed.raw);
    await this.redisClient.set(this.getProcessedKey(claimed.message.idempotencyKey), '1', {
      EX: 60 * 60 * 24 * 7,
    });
    this.metricsService.recordQueueProcessed();
    await this.captureMetricsSnapshot();
  }

  private async acknowledgeDatabaseMessage(claimed: ClaimedQueueMessage) {
    const entity = await this.queueMessageRepository.findOne({
      where: { id: claimed.raw },
    });

    if (!entity) {
      return;
    }

    entity.status = 'processed';
    entity.processed_at = new Date();
    await this.queueMessageRepository.save(entity);
    this.metricsService.recordQueueProcessed();
    await this.captureMetricsSnapshot();
  }

  private async failRedisMessage(claimed: ClaimedQueueMessage, error: unknown) {
    if (!this.redisEnabled || !this.redisClient) {
      return;
    }

    const queueConfig = this.configService.getConfig().queue;
    const attempts = (claimed.message.attempts || 0) + 1;
    const nextMessage = {
      ...claimed.message,
      attempts,
      lastError: error instanceof Error ? error.message : String(error),
    };
    const serialized = JSON.stringify(nextMessage);

    await this.redisClient.lRem(this.getQueueNames().processing, 1, claimed.raw);

    if (attempts > queueConfig.retryLimit) {
      await this.redisClient.lPush(this.getQueueNames().dlq, serialized);
      this.metricsService.incrementDlq();
      this.metricsService.recordPoisonMessage();
    } else {
      this.metricsService.incrementQueueRetry();
      await this.redisClient.lPush(this.getQueueNames().queue, serialized);
    }

    this.metricsService.recordQueueError();
    await this.captureMetricsSnapshot();
  }

  private async failDatabaseMessage(claimed: ClaimedQueueMessage, error: unknown) {
    const queueConfig = this.configService.getConfig().queue;
    const entity = await this.queueMessageRepository.findOne({
      where: { id: claimed.raw },
    });

    if (!entity) {
      return;
    }

    entity.attempts += 1;
    entity.last_error = error instanceof Error ? error.message : String(error);

    if (entity.attempts > queueConfig.retryLimit) {
      entity.status = 'failed';
      this.metricsService.incrementDlq();
      this.metricsService.recordPoisonMessage();
    } else {
      entity.status = 'queued';
      entity.available_at = new Date(Date.now() + queueConfig.backoffMs * entity.attempts);
      this.metricsService.incrementQueueRetry();
    }

    entity.claimed_at = null;
    await this.queueMessageRepository.save(entity);
    this.metricsService.recordQueueError();
    await this.captureMetricsSnapshot();
  }

  private async requeueRedisInFlightMessages() {
    if (!this.redisEnabled || !this.redisClient) {
      return 0;
    }

    let moved = 0;
    while (true) {
      const raw = await this.redisClient.rPopLPush(
        this.getQueueNames().processing,
        this.getQueueNames().queue,
      );
      if (!raw) {
        break;
      }
      moved += 1;
    }

    if (moved > 0) {
      this.logger.warn(`Recovered ${moved} in-flight Redis queue messages back to the main queue.`);
    }

    await this.captureMetricsSnapshot();
    return moved;
  }

  private async requeueDatabaseInFlightMessages() {
    const result = await this.queueMessageRepository.update(
      { status: 'processing' as QueueMessageStatus },
      { status: 'queued', claimed_at: null, available_at: new Date() },
    );

    const moved = result.affected || 0;
    if (moved > 0) {
      this.logger.warn(`Recovered ${moved} in-flight database queue messages back to queued state.`);
    }

    await this.captureMetricsSnapshot();
    return moved;
  }

  private disableRedis(detail: string) {
    this.redisEnabled = false;
    this.setAvailability('memory-disabled');
    this.metricsService.recordQueueCapabilityGap(
      'Infrastructure bottleneck',
      'queue.redis',
      detail,
      'High',
    );
  }

  private setAvailability(mode: QueueAvailability) {
    this.availability = mode;
    this.metricsService.setQueueAvailability(mode);
  }

  private getQueueNames() {
    const queueConfig = this.configService.getConfig().queue;
    const queue = queueConfig.queueName || 'serviceformai:queue:writes';
    return {
      queue,
      processing: `${queue}:processing`,
      dlq: queueConfig.dlqName || `${queue}:dlq`,
    };
  }

  private getProcessedKey(idempotencyKey: string) {
    return `${this.getQueueNames().queue}:processed:${idempotencyKey}`;
  }

  private safeParseMessage(raw: string) {
    try {
      return JSON.parse(raw) as QueueMessage;
    } catch {
      return null;
    }
  }

  private mapEntityToMessage(entity: QueueMessageEntity): QueueMessage {
    return {
      id: entity.id,
      type: entity.type,
      module: entity.module,
      payload: entity.payload,
      enqueuedAt: entity.created_at.toISOString(),
      attempts: entity.attempts,
      idempotencyKey: entity.idempotency_key,
      lastError: entity.last_error || undefined,
    };
  }

  private stableSerialize(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableSerialize(item)).join(',')}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${this.stableSerialize(entryValue)}`);

    return `{${entries.join(',')}}`;
  }
}
