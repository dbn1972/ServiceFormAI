import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { ConsumerUser } from './entities/consumer-user.entity';
import { TenantService } from './entities/tenant-service.entity';
import { Application } from './entities/application.entity';
import { QueueMessageEntity } from './entities/queue-message.entity';
import { AuditLog } from './entities/audit-log.entity';
import { LoginRateLimit } from './entities/login-rate-limit.entity';
import { RefreshTokenNonce } from './entities/refresh-token-nonce.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { IntegrationProvider } from './entities/integration-provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      TenantUser,
      ConsumerUser,
      TenantService,
      Application,
      QueueMessageEntity,
      AuditLog,
      LoginRateLimit,
      RefreshTokenNonce,
      ConsentRecord,
      IntegrationProvider,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
