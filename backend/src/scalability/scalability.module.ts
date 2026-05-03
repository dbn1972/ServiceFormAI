import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueMessageEntity } from '../database/entities/queue-message.entity';
import { ScalabilityConfigService } from './scalability-config.service';
import { ScalabilityMetricsService } from './scalability-metrics.service';
import { CacheService } from './cache.service';
import { QueueService } from './queue.service';
import { ScalabilityController } from './scalability.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QueueMessageEntity])],
  controllers: [ScalabilityController, HealthController],
  providers: [
    ScalabilityConfigService,
    ScalabilityMetricsService,
    CacheService,
    QueueService,
  ],
  exports: [
    ScalabilityConfigService,
    ScalabilityMetricsService,
    CacheService,
    QueueService,
  ],
})
export class ScalabilityModule {}
