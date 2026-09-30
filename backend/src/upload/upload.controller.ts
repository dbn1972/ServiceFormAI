import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { randomUUID as uuidv4 } from 'crypto';

// UUID validation helper (replaces uuid's validate)
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CitizenOrTenantStaffAuthGuard } from '../auth/guards/citizen-or-tenant-staff-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadService } from './upload.service';
import { AuditService } from '../audit/audit.service';

const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// S3 key storage for tracking documentId → S3 key within a request
// (In production this mapping lives in a database / cache; here we reconstruct it)
function buildS3Key(user: { id: string; tenantId?: string }, documentId: string, extension: string) {
  return `documents/${user.tenantId ?? 'public'}/${user.id}/${documentId}${extension}`;
}

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly auditService: AuditService,
  ) {}

  @UseGuards(CitizenOrTenantStaffAuthGuard)
  @Post('document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.has(extension)) {
          callback(new BadRequestException('Unsupported file type'), false);
          return;
        }
        if (!allowedMimeTypes.has(file.mimetype)) {
          callback(new BadRequestException('Unsupported MIME type'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: any,
    @Body() body: { applicationId?: string; documentType?: string },
    @CurrentUser() user: any,
    @Req() request: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const documentId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase() || '.bin';

    const storageKey = await this.uploadService.storeDocument({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      documentId,
      user,
    });

    let applicationDocument: { id: string; document_type: string } | null = null;
    if (body.applicationId && body.documentType) {
      applicationDocument = await this.uploadService.attachApplicationDocument({
        applicationId: body.applicationId,
        documentId,
        documentType: body.documentType,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey,
        user,
      });
    }

    void this.auditService.logDocumentUpload({
      actorId: user.id,
      actorRole: user.role,
      tenantId: user.tenantId,
      documentId,
      ipAddress: this.getIpAddress(request),
    });

    return {
      success: true,
      data: {
        url: this.uploadService.getRelativeDocumentUrl(user, documentId),
        documentId,
        applicationDocumentId: applicationDocument?.id ?? null,
        applicationId: body.applicationId ?? null,
        documentType: body.documentType ?? null,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  @UseGuards(CitizenOrTenantStaffAuthGuard)
  @Get('applications/:applicationId/documents')
  async getApplicationDocuments(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: any,
  ) {
    const documents = await this.uploadService.listApplicationDocuments(applicationId, user);

    return {
      success: true,
      data: documents.map((document) => ({
        id: document.id,
        applicationId: document.application_id,
        documentId: document.document_id,
        documentType: document.document_type,
        fileName: document.file_name,
        mimeType: document.mime_type,
        size: document.file_size,
        url: this.uploadService.getRelativeDocumentUrl(user, document.document_id),
        uploadedAt: document.uploaded_at ?? document.created_at,
        status: document.status,
      })),
    };
  }

  @UseGuards(CitizenOrTenantStaffAuthGuard)
  @Get('document/:documentId')
  async downloadDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() user: any,
    @Query('presigned') presigned: string,
    @Res() response: any,
    @Req() request: any,
  ) {
    if (!isUuid(documentId)) {
      throw new BadRequestException('Invalid document identifier');
    }

    let s3Key = await this.uploadService.getApplicationDocumentStorageKey(documentId, user);

    if (!s3Key) {
      const extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.bin'];
      for (const ext of extensions) {
        const candidateKey = buildS3Key(user, documentId, ext);
        const exists = await this.uploadService['s3']?.objectExists(candidateKey).catch(() => false);
        if (exists) {
          s3Key = candidateKey;
          break;
        }
      }
    }

    if (!s3Key) {
      throw new BadRequestException('Document not found');
    }

    void this.auditService.logDocumentDownload({
      actorId: user.id,
      actorRole: user.role,
      tenantId: user.tenantId,
      documentId,
      ipAddress: this.getIpAddress(request),
    });

    // Return a pre-signed URL for direct S3 download (avoids proxying large files)
    if (presigned === 'true') {
      const url = await this.uploadService.getPresignedUrl(s3Key);
      return response.json({ success: true, data: { url } });
    }

    // Proxy download through the API
    const { body, contentType } = await this.uploadService.fetchDocument(s3Key);
    response.setHeader('Content-Type', contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${documentId}"`);
    response.send(body);
  }

  private getIpAddress(request: any): string {
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  @UseGuards(CitizenOrTenantStaffAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedImageExtensions.has(extension)) {
          callback(new BadRequestException('Unsupported image type'), false);
          return;
        }
        if (!allowedImageMimeTypes.has(file.mimetype)) {
          callback(new BadRequestException('Unsupported image MIME type'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: any, @CurrentUser() user: any, @Req() request: any) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const imageId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase() || '.jpg';

    await this.uploadService.storeDocument({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      documentId: imageId,
      user,
    });

    void this.auditService.logDocumentUpload({
      actorId: user.id,
      actorRole: user.role,
      tenantId: user.tenantId,
      documentId: imageId,
      ipAddress: this.getIpAddress(request),
    });

    // Return a short-lived presigned URL directly to S3
    const presignedUrl = await this.uploadService.getPresignedUrl(
      buildS3Key(user, imageId, extension),
    );

    return {
      success: true,
      data: {
        url: presignedUrl,
        documentId: imageId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    };
  }
}
