/**
 * S3StorageService
 *
 * Provides a unified document storage interface backed by AWS S3.
 * In local development and CI, this connects to LocalStack at
 * http://localhost:4566. In production, it uses real AWS S3.
 *
 * Configuration (environment variables):
 *   AWS_S3_BUCKET       — bucket name  (default: serviceformai-documents)
 *   AWS_S3_REGION       — AWS region   (default: ap-south-1)
 *   AWS_S3_ENDPOINT     — override endpoint (set to http://localhost:4566 for LocalStack)
 *   AWS_S3_FORCE_PATH_STYLE — true for LocalStack / MinIO path-style URLs
 *   AWS_ACCESS_KEY_ID   — AWS key id   (use "test" for LocalStack)
 *   AWS_SECRET_ACCESS_KEY — AWS secret (use "test" for LocalStack)
 *
 * Key operations:
 *   putObject  — upload a Buffer with server-side encryption
 *   getObject  — download as a Buffer
 *   deleteObject — hard delete
 *   getPresignedDownloadUrl — 15-minute signed URL for direct download
 *   objectExists — head-check without fetching body
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const region = config.get<string>('AWS_S3_REGION', 'ap-south-1');
    const endpoint = config.get<string>('AWS_S3_ENDPOINT', '');
    const forcePathStyle =
      config.get<string>('AWS_S3_FORCE_PATH_STYLE', 'false') === 'true';

    this.bucket = config.get<string>('AWS_S3_BUCKET', 'serviceformai-documents');

    this.client = new S3Client({
      region,
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle,
          }
        : {}),
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', 'test'),
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', 'test'),
      },
    });

    this.logger.log(
      `S3StorageService ready — bucket: ${this.bucket}, endpoint: ${endpoint || 'AWS default'}`,
    );
  }

  /**
   * Upload a document buffer.
   * Always uses AES256 server-side encryption.
   * Returns the S3 object key.
   */
  async putObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: params.key,
          Body: params.body,
          ContentType: params.contentType,
          ServerSideEncryption: 'AES256',
          Metadata: params.metadata ?? {},
        }),
      );
      return params.key;
    } catch (error) {
      this.logger.error(`S3 putObject failed for key ${params.key}`, error);
      throw new InternalServerErrorException('Document upload failed');
    }
  }

  /**
   * Download a document as a Buffer.
   * Throws NotFoundException if the key does not exist.
   */
  async getObject(key: string): Promise<{ body: Buffer; contentType: string }> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      return {
        body: Buffer.concat(chunks),
        contentType: response.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
        throw new NotFoundException('Document not found');
      }
      this.logger.error(`S3 getObject failed for key ${key}`, error);
      throw new InternalServerErrorException('Document download failed');
    }
  }

  /**
   * Generate a pre-signed URL valid for 15 minutes.
   * Suitable for direct browser download without proxying through the API.
   */
  async getPresignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Delete a document permanently.
   * Idempotent — does not throw if key does not exist.
   */
  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      this.logger.warn(`S3 deleteObject failed for key ${key}`, error);
    }
  }

  /**
   * Check whether an object exists without downloading it.
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build the S3 object key from tenant + user + documentId + extension.
   * Format: documents/{tenantId}/{userId}/{documentId}.{ext}
   */
  buildDocumentKey(params: {
    tenantId: string | undefined;
    userId: string;
    documentId: string;
    extension: string;
  }): string {
    const tenant = params.tenantId ?? 'public';
    return `documents/${tenant}/${params.userId}/${params.documentId}${params.extension}`;
  }
}
