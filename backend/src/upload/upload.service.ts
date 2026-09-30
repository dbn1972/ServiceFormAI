import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import { Repository } from 'typeorm';
import { Application } from '../database/entities/application.entity';
import { ApplicationDocument } from '../database/entities/application-document.entity';
import { S3StorageService } from './s3-storage.service';

/**
 * UploadService
 *
 * Application-level document operations. Delegates raw S3 I/O to
 * S3StorageService and exposes higher-level helpers used by the controller.
 *
 * In local development (LocalStack) the bucket is "serviceformai-documents"
 * at http://localhost:4566. In production it targets the real AWS bucket.
 */
@Injectable()
export class UploadService {
  constructor(
    private readonly s3: S3StorageService,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(ApplicationDocument)
    private readonly applicationDocumentRepository: Repository<ApplicationDocument>,
  ) {}

  /**
   * Store a document buffer in S3 and return the object key.
   */
  async storeDocument(params: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    documentId: string;
    user: { id: string; tenantId?: string };
  }): Promise<string> {
    const extension = path.extname(params.originalName).toLowerCase() || '.bin';
    const key = this.s3.buildDocumentKey({
      tenantId: params.user.tenantId,
      userId: params.user.id,
      documentId: params.documentId,
      extension,
    });

    await this.s3.putObject({
      key,
      body: params.buffer,
      contentType: params.mimeType,
      metadata: {
        originalName: encodeURIComponent(params.originalName),
        uploadedBy: params.user.id,
        tenantId: params.user.tenantId ?? 'public',
      },
    });

    return key;
  }

  /**
   * Retrieve a document. Caller must verify ownership before calling.
   */
  async fetchDocument(s3Key: string): Promise<{ body: Buffer; contentType: string }> {
    return this.s3.getObject(s3Key);
  }

  /**
   * Return a pre-signed URL valid for 15 minutes.
   */
  async getPresignedUrl(s3Key: string): Promise<string> {
    return this.s3.getPresignedDownloadUrl(s3Key);
  }

  /**
   * Delete a document. Idempotent.
   */
  async deleteDocument(s3Key: string): Promise<void> {
    return this.s3.deleteObject(s3Key);
  }

  async attachApplicationDocument(params: {
    applicationId: string;
    documentId: string;
    documentType: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    storageKey: string;
    user: { id: string; tenantId?: string; role?: string };
  }): Promise<ApplicationDocument> {
    const application = await this.applicationRepository.findOne({
      where: { id: params.applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const ownsApplication = application.consumer_id === params.user.id;
    const sharesTenant = Boolean(params.user.tenantId) && application.tenant_id === params.user.tenantId;

    if (!ownsApplication && !sharesTenant) {
      throw new ForbiddenException('Access denied');
    }

    const existing = await this.applicationDocumentRepository.findOne({
      where: {
        application_id: application.id,
        document_type: params.documentType,
      },
    });

    const record = this.applicationDocumentRepository.create({
      ...(existing ?? {}),
      application_id: application.id,
      tenant_id: application.tenant_id,
      consumer_id: application.consumer_id,
      service_id: application.service_id,
      document_id: params.documentId,
      document_type: params.documentType,
      file_name: params.fileName,
      mime_type: params.mimeType,
      file_size: params.fileSize,
      storage_key: params.storageKey,
      upload_source: params.user.role === 'consumer' ? 'citizen' : 'staff',
      status: 'uploaded',
      metadata: null,
      uploaded_at: new Date(),
    });

    return this.applicationDocumentRepository.save(record);
  }

  async listApplicationDocuments(applicationId: string, user: { id: string; tenantId?: string; role?: string }): Promise<ApplicationDocument[]> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const ownsApplication = application.consumer_id === user.id;
    const sharesTenant = Boolean(user.tenantId) && application.tenant_id === user.tenantId;

    if (!ownsApplication && !sharesTenant) {
      throw new ForbiddenException('Access denied');
    }

    return this.applicationDocumentRepository.find({
      where: { application_id: application.id },
      order: { uploaded_at: 'DESC', created_at: 'DESC' },
    });
  }

  async getApplicationDocumentStorageKey(
    documentId: string,
    user: { id: string; tenantId?: string },
  ): Promise<string | null> {
    const document = await this.applicationDocumentRepository.findOne({
      where: { document_id: documentId },
    });
    if (!document) return null;

    const application = await this.applicationRepository.findOne({
      where: { id: document.application_id, tenant_id: document.tenant_id },
    });
    if (!application) throw new NotFoundException('Application not found');

    const ownsApplication = application.consumer_id === user.id;
    const sharesTenant = Boolean(user.tenantId) && application.tenant_id === user.tenantId;
    if (!ownsApplication && !sharesTenant) {
      throw new ForbiddenException('Access denied');
    }

    return document.storage_key;
  }

  /**
   * Build the canonical public API URL for downloading through the backend.
   */
  getRelativeDocumentUrl(_user: { id: string; tenantId?: string }, documentId: string): string {
    return `/api/v1/upload/document/${documentId}`;
  }
}

