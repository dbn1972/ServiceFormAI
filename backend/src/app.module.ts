import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { ConsumerModule } from './consumer/consumer.module';
import { ProducerModule } from './producer/producer.module';
import { DatabaseModule } from './database/database.module';
import { ScalabilityModule } from './scalability/scalability.module';
import { UploadModule } from './upload/upload.module';
import { ConsentModule } from './consent/consent.module';
import { IntegrationModule } from './integration/integration.module';
import { AuditModule } from './audit/audit.module';
import { CustomComponentModule } from './custom-component/custom-component.module';
import { PaymentModule } from './payment/payment.module';

const isProduction = process.env.NODE_ENV === 'production';
const isSynchronizeRequested = process.env.DB_SYNCHRONIZE === 'true';
const isFixedTestOtpEnabled = process.env.OTP_FIXED_TEST_ENABLED === 'true';

if (
  isFixedTestOtpEnabled &&
  (!/^\+91[6-9]\d{9}$/.test(process.env.OTP_FIXED_TEST_MOBILE || '') ||
    !/^\d{6}$/.test(process.env.OTP_FIXED_TEST_CODE || ''))
) {
  throw new Error('Fixed test OTP requires one valid Indian test mobile and a six-digit code.');
}

if (isProduction && isSynchronizeRequested) {
  throw new Error(
    'DB_SYNCHRONIZE=true is not permitted in production. Use explicit migrations.',
  );
}

if (isProduction && !process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD environment variable must be set in production.');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 1 minute window
      limit: 100,   // 100 requests per window per IP
    }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'serviceformai',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
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
    AuthModule,
    TenantModule,
    ConsumerModule,
    ProducerModule,
    UploadModule,
    ConsentModule,
    IntegrationModule,
    AuditModule,
    CustomComponentModule,
    PaymentModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
