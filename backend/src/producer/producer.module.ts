import { Module } from '@nestjs/common';
import { ProducerController } from './producer.controller';
import { RedressController } from './redress.controller';
import { RedressService } from '../consumer/redress.service';
import { ProducerService } from './producer.service';
import { DatabaseModule } from '../database/database.module';
import { ValidationModule } from '../validation/validation.module';
import { ScalabilityModule } from '../scalability/scalability.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [DatabaseModule, ValidationModule, ScalabilityModule, UploadModule],
  controllers: [ProducerController, RedressController],
  providers: [ProducerService, RedressService],
})
export class ProducerModule {}
