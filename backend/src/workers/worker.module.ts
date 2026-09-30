import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { QueueWorkerService } from './queue-worker.service';
import { TokenCleanupService } from './token-cleanup.service';
import { ScalabilityModule } from '../scalability/scalability.module';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantService } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { OutboxEvent } from '../database/entities/outbox-event.entity';

const isProduction = process.env.NODE_ENV === 'production';
const isSynchronizeRequested = process.env.DB_SYNCHRONIZE === 'true';

if (isProduction && isSynchronizeRequested) {
  throw new Error(
    'DB_SYNCHRONIZE=true is not permitted in production. Use explicit migrations.',
  );
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'serviceformai',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: !isProduction && isSynchronizeRequested,
      logging: process.env.NODE_ENV === 'development',
      extra: {
        max: parseInt(process.env.DB_POOL_MAX || '50', 10),
        connectionTimeoutMillis: 5_000,
        idleTimeoutMillis: 30_000,
        statement_timeout: 30_000,
      },
    }),
    DatabaseModule,
    ScalabilityModule,
    TypeOrmModule.forFeature([Tenant, TenantService, Application, ConsumerUser, AuditLog, OutboxEvent]),
  ],
  providers: [QueueWorkerService, TokenCleanupService],
})
export class WorkerModule {}
