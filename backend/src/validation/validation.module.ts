import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ScalabilityModule } from '../scalability/scalability.module';
import { AuditModule } from '../audit/audit.module';
import { CustomComponentModule } from '../custom-component/custom-component.module';
import { FormValidationGuard } from './validation.guard';
import { SchemaValidationGuard } from './schema-validation.guard';

@Module({
  imports: [DatabaseModule, ScalabilityModule, AuditModule, CustomComponentModule],
  providers: [FormValidationGuard, SchemaValidationGuard],
  exports: [FormValidationGuard, SchemaValidationGuard],
})
export class ValidationModule {}
