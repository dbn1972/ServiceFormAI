import { Module } from '@nestjs/common';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { DatabaseModule } from '../database/database.module';
import { ConsentModule } from '../consent/consent.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [DatabaseModule, ConsentModule, TenantModule],
  controllers: [ConsumerController],
  providers: [ConsumerService],
})
export class ConsumerModule {}
