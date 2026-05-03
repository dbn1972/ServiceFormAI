import { Injectable } from '@nestjs/common';
import * as path from 'path';
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
  constructor(private readonly s3: S3StorageService) {}

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

  /**
   * Build the canonical public API URL for downloading through the backend.
   */
  getRelativeDocumentUrl(_user: { id: string; tenantId?: string }, documentId: string): string {
    return `/api/v1/upload/document/${documentId}`;
  }
}

