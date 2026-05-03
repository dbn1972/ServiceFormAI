import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentRecord } from '../database/entities/consent-record.entity';
import { AuditModule } from '../audit/audit.module';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsentRecord]),
    AuditModule,
  ],
  providers: [ConsentService],
  controllers: [ConsentController],
  exports: [ConsentService],
})
export class ConsentModule {}
