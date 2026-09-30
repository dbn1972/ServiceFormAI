import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomComponentConfig } from '../database/entities/custom-component-config.entity';
import { CustomComponentController } from './custom-component.controller';
import { CustomComponentService } from './custom-component.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomComponentConfig]),
    DatabaseModule,
    AuditModule,
  ],
  controllers: [CustomComponentController],
  providers: [CustomComponentService],
  exports: [CustomComponentService],
})
export class CustomComponentModule {}
