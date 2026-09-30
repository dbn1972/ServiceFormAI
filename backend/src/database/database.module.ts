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
import { CustomComponentConfig } from './entities/custom-component-config.entity';
import { PaymentRecord } from './entities/payment-record.entity';
import { ApplicationDocument } from './entities/application-document.entity';
import { ApplicationEvent } from './entities/application-event.entity';
import { ApplicationDeficiency } from './entities/application-deficiency.entity';
import { CitizenOtpChallenge } from './entities/citizen-otp-challenge.entity';
import { TenantServiceRelease } from './entities/tenant-service-release.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { ServicePublicationApproval } from './entities/service-publication-approval.entity';
import { GrievanceCase } from './entities/grievance-case.entity';
import { AppealCase } from './entities/appeal-case.entity';
import { CitizenFeedback } from './entities/citizen-feedback.entity';
import { ApplicationOutput } from './entities/application-output.entity';

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
      CustomComponentConfig,
      PaymentRecord,
      ApplicationDocument,
      ApplicationEvent,
      ApplicationDeficiency,
      CitizenOtpChallenge,
      TenantServiceRelease,
      OutboxEvent,
      ServicePublicationApproval,
      GrievanceCase,
      AppealCase,
      CitizenFeedback,
      ApplicationOutput,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
