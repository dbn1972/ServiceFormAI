import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3StorageService } from './s3-storage.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [ConfigModule, AuditModule],
  controllers: [UploadController],
  providers: [S3StorageService, UploadService],
  exports: [UploadService, S3StorageService],
})
export class UploadModule {}
