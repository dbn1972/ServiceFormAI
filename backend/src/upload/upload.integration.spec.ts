/**
 * Volume 16 — Upload Module Integration Tests
 *
 * Tests the full UploadController → UploadService → S3StorageService chain
 * with real JWT guard, mocked S3, and real MIME/size validation.
 *
 * Coverage:
 *  A. RBAC: all upload endpoints require authentication (401 without JWT)
 *  B. Document upload: happy path, returns documentId and url
 *  C. Document upload: rejects unsupported file types (zip, exe)
 *  D. Document upload: rejects when no file is attached
 *  E. Document download: presigned URL redirect
 *  F. Document download: proxy download via API
 *  G. Document download: 400 for malformed document ID
 *  H. Document download: 400 when no S3 key found (file not found)
 *  I. Image upload: happy path, returns presignedUrl
 *  J. Image upload: rejects non-image MIME types
 *  K. Audit logging on upload and download events
 *
 * Run: cd backend && npx jest upload.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import * as path from 'path';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3StorageService } from './s3-storage.service';
import { AuditService } from '../audit/audit.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { Application } from '../database/entities/application.entity';
import { ApplicationDocument } from '../database/entities/application-document.entity';

import {
  makeMockAudit,
  makeMockS3,
  makeRepo,
  adminToken,
  consumerToken,
  signTestJwt,
  TEST_TENANT_ID,
  TEST_APPLICATION_ID,
  TEST_CONSUMER_ID,
  TEST_USER_ID_ADMIN,
} from '../test/test-helpers';

// ─── App factory ─────────────────────────────────────────────────────────────

async function createUploadApp() {
  const mockS3 = makeMockS3();
  const mockAudit = makeMockAudit();
  const mockApplicationRepo = makeRepo<Application>();
  const mockApplicationDocumentRepo = makeRepo<ApplicationDocument>();

  const module: TestingModule = await Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'your-super-secret-jwt-key', signOptions: { expiresIn: '1h' } }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ],
    controllers: [UploadController],
    providers: [
      UploadService,
      JwtStrategy,
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: S3StorageService, useValue: mockS3 },
      { provide: AuditService, useValue: mockAudit },
      { provide: getRepositoryToken(Application), useValue: mockApplicationRepo },
      { provide: getRepositoryToken(ApplicationDocument), useValue: mockApplicationDocumentRepo },
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, mockS3, mockAudit, mockApplicationRepo, mockApplicationDocumentRepo };
}

// ─── A. RBAC: authentication required ────────────────────────────────────────

describe('Upload integration — authentication', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('POST /upload/document returns 401 without JWT', async () => {
    await request(app.getHttpServer())
      .post('/upload/document')
      .attach('file', Buffer.from('%PDF-1.4 test'), 'test.pdf')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('POST /upload/document accepts citizen auth and reaches upload validation', async () => {
    await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${consumerToken()}`)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('GET /upload/document/:id returns 401 without JWT', async () => {
    await request(app.getHttpServer())
      .get('/upload/document/00000000-0000-0000-0000-000000000001')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('POST /upload/image returns 401 without JWT', async () => {
    await request(app.getHttpServer())
      .post('/upload/image')
      .attach('file', Buffer.from('GIF89a'), 'test.gif')
      .expect(HttpStatus.UNAUTHORIZED);
  });
});

// ─── B. Document upload — happy path ─────────────────────────────────────────

describe('Upload integration — document upload happy path', () => {
  let app: INestApplication;
  let mockS3: ReturnType<typeof makeMockS3>;
  let mockAudit: ReturnType<typeof makeMockAudit>;

  beforeEach(async () => {
    ({ app, mockS3, mockAudit } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('uploads a PDF and returns documentId + url', async () => {
    mockS3.buildDocumentKey.mockReturnValue('documents/t1/u1/doc-id.pdf');
    mockS3.putObject.mockResolvedValue(undefined);

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 test content'), 'sample.pdf');

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentId).toBeDefined();
    expect(res.body.data.url).toMatch(/\/upload\/document\//);
    expect(res.body.data.mimeType).toBe('application/pdf');
    expect(mockS3.putObject).toHaveBeenCalledTimes(1);
  });

  it('uploads a JPEG image document and returns documentId', async () => {
    mockS3.buildDocumentKey.mockReturnValue('documents/t1/u1/doc-id.jpg');
    mockS3.putObject.mockResolvedValue(undefined);

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('\xFF\xD8\xFF\xE0 jpeg content'), { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.data.mimeType).toBe('image/jpeg');
    expect(res.body.data.documentId).toBeDefined();
  });
});

describe('Upload integration — application document persistence', () => {
  let app: INestApplication;
  let mockS3: ReturnType<typeof makeMockS3>;
  let mockApplicationRepo: ReturnType<typeof makeRepo<Application>>;
  let mockApplicationDocumentRepo: ReturnType<typeof makeRepo<ApplicationDocument>>;

  beforeEach(async () => {
    ({ app, mockS3, mockApplicationRepo, mockApplicationDocumentRepo } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('stores and rehydrates an application-linked upload', async () => {
    const uploadedAt = new Date('2026-09-27T00:00:00.000Z');
    const savedDocument = {
      id: '11111111-1111-4111-8111-111111111111',
      application_id: TEST_APPLICATION_ID,
      tenant_id: TEST_TENANT_ID,
      consumer_id: TEST_CONSUMER_ID,
      service_id: '00000000-0000-0000-0002-000000000001',
      document_id: '22222222-2222-4222-8222-222222222222',
      document_type: 'marksheet',
      file_name: 'marksheet.pdf',
      mime_type: 'application/pdf',
      file_size: 19,
      storage_key: 'documents/public/00000000-0000-0000-0001-000000000001/22222222-2222-4222-8222-222222222222.pdf',
      upload_source: 'citizen',
      status: 'uploaded',
      metadata: null,
      uploaded_at: uploadedAt,
      created_at: uploadedAt,
      updated_at: uploadedAt,
    };

    mockApplicationRepo.findOne.mockResolvedValue({
      id: TEST_APPLICATION_ID,
      tenant_id: TEST_TENANT_ID,
      service_id: '00000000-0000-0000-0002-000000000001',
      consumer_id: TEST_CONSUMER_ID,
    } as Application);
    mockApplicationDocumentRepo.findOne.mockResolvedValue(null);
    mockApplicationDocumentRepo.save.mockImplementation(async () => savedDocument as any);
    mockApplicationDocumentRepo.find.mockResolvedValue([savedDocument as any]);
    mockS3.buildDocumentKey.mockReturnValue(savedDocument.storage_key);
    mockS3.putObject.mockResolvedValue(undefined);

    const token = consumerToken(TEST_CONSUMER_ID);
    const uploadResponse = await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${token}`)
      .field('applicationId', TEST_APPLICATION_ID)
      .field('documentType', 'marksheet')
      .attach('file', Buffer.from('%PDF-1.4 application upload'), 'marksheet.pdf');

    expect(uploadResponse.status).toBe(HttpStatus.CREATED);
    expect(uploadResponse.body.data.applicationDocumentId).toBe(savedDocument.id);
    expect(mockApplicationDocumentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        application_id: TEST_APPLICATION_ID,
        document_type: 'marksheet',
        document_id: uploadResponse.body.data.documentId,
      }),
    );

    const listResponse = await request(app.getHttpServer())
      .get(`/upload/applications/${TEST_APPLICATION_ID}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].documentType).toBe('marksheet');
    expect(listResponse.body.data[0].documentId).toBe(savedDocument.document_id);

    mockApplicationDocumentRepo.findOne.mockResolvedValue(savedDocument as any);
    mockS3.getPresignedDownloadUrl.mockResolvedValue('https://storage.example/document');
    const staffResponse = await request(app.getHttpServer())
      .get(`/upload/document/${savedDocument.document_id}?presigned=true`)
      .set('Authorization', `Bearer ${adminToken(TEST_TENANT_ID)}`)
      .expect(HttpStatus.OK);

    expect(staffResponse.body.data.url).toBe('https://storage.example/document');
    expect(mockS3.getPresignedDownloadUrl).toHaveBeenCalledWith(savedDocument.storage_key);
  });
});

// ─── C. Document upload — rejected file types ─────────────────────────────────

describe('Upload integration — document upload validation', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('rejects a .zip file with 400', async () => {
    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('PK archive content'), { filename: 'exploit.zip', contentType: 'application/zip' });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('rejects an .exe file with 400', async () => {
    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('MZ malware'), { filename: 'evil.exe', contentType: 'application/octet-stream' });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('rejects wrong MIME type for PDF extension with 400', async () => {
    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not a pdf'), { filename: 'fake.pdf', contentType: 'text/html' });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });
});

// ─── D. Document upload — missing file ────────────────────────────────────────

describe('Upload integration — missing file', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('returns 400 when no file field is sent', async () => {
    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });
});

// ─── E. Document download — presigned URL ─────────────────────────────────────

describe('Upload integration — document download presigned', () => {
  let app: INestApplication;
  let mockS3: ReturnType<typeof makeMockS3>;

  beforeEach(async () => {
    ({ app, mockS3 } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('returns presigned URL when ?presigned=true', async () => {
    mockS3.objectExists.mockImplementation((key: string) =>
      Promise.resolve(key.endsWith('.pdf')),
    );
    mockS3.getPresignedDownloadUrl.mockResolvedValue('https://s3.example.com/presigned-download');

    const token = adminToken(TEST_TENANT_ID);
    const docId = '00000000-0000-4000-8000-000000000001';

    const res = await request(app.getHttpServer())
      .get(`/upload/document/${docId}?presigned=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.url).toBe('https://s3.example.com/presigned-download');
  });
});

// ─── F. Document download — proxy download ────────────────────────────────────

describe('Upload integration — document proxy download', () => {
  let app: INestApplication;
  let mockS3: ReturnType<typeof makeMockS3>;

  beforeEach(async () => {
    ({ app, mockS3 } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('proxies file bytes and sets Content-Type header', async () => {
    mockS3.objectExists.mockImplementation((key: string) =>
      Promise.resolve(key.endsWith('.pdf')),
    );
    mockS3.getObject.mockResolvedValue({
      body: Buffer.from('%PDF-1.4 real content'),
      contentType: 'application/pdf',
    });

    const token = adminToken(TEST_TENANT_ID);
    const docId = '00000000-0000-4000-8000-000000000002';

    const res = await request(app.getHttpServer())
      .get(`/upload/document/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });
});

// ─── G. Document download — invalid UUID ──────────────────────────────────────

describe('Upload integration — document ID validation', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('returns 400 for non-UUID document ID', async () => {
    const token = adminToken(TEST_TENANT_ID);

    await request(app.getHttpServer())
      .get('/upload/document/not-a-valid-uuid')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('returns 400 for SQL injection attempt in document ID', async () => {
    const token = adminToken(TEST_TENANT_ID);

    await request(app.getHttpServer())
      .get("/upload/document/1'; DROP TABLE documents;--")
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.BAD_REQUEST);
  });
});

// ─── H. Document download — file not found ────────────────────────────────────

describe('Upload integration — document not found', () => {
  let app: INestApplication;
  let mockS3: ReturnType<typeof makeMockS3>;

  beforeEach(async () => {
    ({ app, mockS3 } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('returns 400 when no S3 key is found for any extension', async () => {
    mockS3.objectExists.mockResolvedValue(false); // no key found

    const token = adminToken(TEST_TENANT_ID);
    const docId = '00000000-0000-4000-8000-000000000003';

    await request(app.getHttpServer())
      .get(`/upload/document/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.BAD_REQUEST);
  });
});

// ─── I. Image upload — happy path ─────────────────────────────────────────────

describe('Upload integration — image upload happy path', () => {
  let app: INestApplication;
  let mockS3: ReturnType<typeof makeMockS3>;

  beforeEach(async () => {
    ({ app, mockS3 } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('uploads an image and returns presigned URL + imageId', async () => {
    mockS3.buildDocumentKey.mockReturnValue('documents/t1/u1/img-id.png');
    mockS3.putObject.mockResolvedValue(undefined);
    mockS3.getPresignedDownloadUrl.mockResolvedValue('https://s3.example.com/image-presigned');

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('\x89PNG\r\n\x1a\n'), { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentId).toBeDefined();
    expect(res.body.data.url).toContain('presigned');
    expect(mockS3.putObject).toHaveBeenCalledTimes(1);
  });

  it('uploads a WebP image', async () => {
    mockS3.buildDocumentKey.mockReturnValue('documents/t1/u1/img-id.webp');
    mockS3.putObject.mockResolvedValue(undefined);
    mockS3.getPresignedDownloadUrl.mockResolvedValue('https://s3.example.com/webp-presigned');

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('RIFF WEBP'), { filename: 'photo.webp', contentType: 'image/webp' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.data.mimeType).toBe('image/webp');
  });
});

// ─── J. Image upload — rejected types ────────────────────────────────────────

describe('Upload integration — image upload validation', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('rejects a PDF sent to the image endpoint', async () => {
    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4'), { filename: 'document.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('rejects a .txt file at the image endpoint', async () => {
    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .post('/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('plain text'), { filename: 'readme.txt', contentType: 'text/plain' });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });
});

// ─── K. Audit logging ─────────────────────────────────────────────────────────

describe('Upload integration — audit logging', () => {
  let app: INestApplication;
  let mockS3: ReturnType<typeof makeMockS3>;
  let mockAudit: ReturnType<typeof makeMockAudit>;

  beforeEach(async () => {
    ({ app, mockS3, mockAudit } = await createUploadApp());
  });
  afterEach(async () => { await app.close(); });

  it('fires logDocumentUpload after successful document upload', async () => {
    mockS3.buildDocumentKey.mockReturnValue('documents/t1/u1/doc.pdf');
    mockS3.putObject.mockResolvedValue(undefined);

    const token = adminToken(TEST_TENANT_ID);
    await request(app.getHttpServer())
      .post('/upload/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 audit test'), 'audit.pdf')
      .expect(HttpStatus.CREATED);

    // logDocumentUpload is called fire-and-forget — allow event loop flush
    await new Promise((r) => setImmediate(r));
    expect(mockAudit.logDocumentUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: TEST_USER_ID_ADMIN,
        tenantId: TEST_TENANT_ID,
      }),
    );
  });

  it('fires logDocumentDownload after successful proxy download', async () => {
    mockS3.objectExists.mockImplementation((key: string) => Promise.resolve(key.endsWith('.pdf')));
    mockS3.getObject.mockResolvedValue({ body: Buffer.from('data'), contentType: 'application/pdf' });

    const token = adminToken(TEST_TENANT_ID);
    const docId = '00000000-0000-4000-8000-000000000004';

    await request(app.getHttpServer())
      .get(`/upload/document/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    await new Promise((r) => setImmediate(r));
    expect(mockAudit.logDocumentDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: TEST_USER_ID_ADMIN,
        documentId: docId,
      }),
    );
  });
});
