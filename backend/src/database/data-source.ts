import 'reflect-metadata';
import { DataSource } from 'typeorm';
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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'serviceformai',
  entities: [
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
  ],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
