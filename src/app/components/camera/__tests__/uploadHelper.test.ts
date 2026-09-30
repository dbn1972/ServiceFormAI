/**
 * Unit tests for S3 upload helper.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadCaptureToS3,
  uploadMultipleCapturesToS3,
  base64ToBlob,
} from '../uploadHelper';
import type { CaptureResult } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCapture(overrides: Partial<CaptureResult> = {}): CaptureResult {
  return {
    base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    width: 640,
    height: 480,
    sizeBytes: 50000,
    mimeType: 'image/jpeg',
    capturedAt: '2024-01-15T10:30:00.000Z',
    jpegQuality: 0.8,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// base64ToBlob
// ---------------------------------------------------------------------------

describe('base64ToBlob', () => {
  it('converts a data URI to a Blob with correct MIME type', () => {
    const blob = base64ToBlob('data:image/jpeg;base64,/9j/4AAQ');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  it('handles raw base64 without data URI prefix', () => {
    const blob = base64ToBlob('/9j/4AAQ');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  it('extracts correct MIME type from data URI', () => {
    // Use valid base64 (4 chars = 3 bytes)
    const blob = base64ToBlob('data:image/png;base64,AAAA');
    expect(blob.type).toBe('image/png');
  });
});

// ---------------------------------------------------------------------------
// uploadCaptureToS3
// ---------------------------------------------------------------------------

describe('uploadCaptureToS3', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns success with URL and documentId on successful upload', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://s3.example.com/image.jpg', documentId: 'doc-123' }),
    });

    const result = await uploadCaptureToS3(
      'data:image/jpeg;base64,/9j/4AAQ',
      'photo.jpg',
      'test-token',
    );

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://s3.example.com/image.jpg');
    expect(result.documentId).toBe('doc-123');
  });

  it('returns error on failed upload (non-ok response)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await uploadCaptureToS3(
      'data:image/jpeg;base64,/9j/4AAQ',
      'photo.jpg',
      'test-token',
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('returns error on network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await uploadCaptureToS3(
      'data:image/jpeg;base64,/9j/4AAQ',
      'photo.jpg',
      'test-token',
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('includes Authorization header in request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://s3.example.com/image.jpg', documentId: 'doc-123' }),
    });
    globalThis.fetch = mockFetch;

    await uploadCaptureToS3(
      'data:image/jpeg;base64,/9j/4AAQ',
      'photo.jpg',
      'my-auth-token',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/upload/image',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer my-auth-token' },
      }),
    );
  });

  it('sends FormData with file field', async () => {
    let capturedBody: FormData | undefined;
    const mockFetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      capturedBody = init.body as FormData;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://s3.example.com/image.jpg', documentId: 'doc-123' }),
      });
    });
    globalThis.fetch = mockFetch;

    await uploadCaptureToS3(
      'data:image/jpeg;base64,/9j/4AAQ',
      'photo.jpg',
      'test-token',
    );

    expect(capturedBody).toBeInstanceOf(FormData);
    expect(capturedBody!.get('file')).toBeInstanceOf(Blob);
  });
});

// ---------------------------------------------------------------------------
// uploadMultipleCapturesToS3
// ---------------------------------------------------------------------------

describe('uploadMultipleCapturesToS3', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('uploads each capture sequentially and returns results in order', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          url: `https://s3.example.com/image-${callCount}.jpg`,
          documentId: `doc-${callCount}`,
        }),
      });
    });

    const captures = [makeCapture(), makeCapture()];
    const results = await uploadMultipleCapturesToS3(captures, 'aadhaar_scan', 'test-token');

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[0].url).toBe('https://s3.example.com/image-1.jpg');
    expect(results[1].success).toBe(true);
    expect(results[1].url).toBe('https://s3.example.com/image-2.jpg');
  });

  it('continues uploading even if one fails', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://s3.example.com/image.jpg', documentId: 'doc-2' }),
      });
    });

    const captures = [makeCapture(), makeCapture()];
    const results = await uploadMultipleCapturesToS3(captures, 'field1', 'test-token');

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(false);
    expect(results[1].success).toBe(true);
  });

  it('returns empty array for empty captures', async () => {
    const results = await uploadMultipleCapturesToS3([], 'field1', 'test-token');
    expect(results).toEqual([]);
  });
});
