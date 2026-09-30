/**
 * Unit tests for useUploadOnSubmit hook (S3 upload integration).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUploadOnSubmit } from '../useUploadOnSubmit';
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

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUploadOnSubmit', () => {
  it('replaces base64 with S3 URL on successful upload', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://s3.example.com/photo.jpg', documentId: 'doc-1' }),
    });

    const { result } = renderHook(() => useUploadOnSubmit());
    const onChange = vi.fn();
    const capture = makeCapture();

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadCaptures(capture, 'photo_field', 'token', onChange);
    });

    expect(uploadResult.allSucceeded).toBe(true);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://s3.example.com/photo.jpg',
        documentId: 'doc-1',
        width: 640,
        height: 480,
      }),
    );
    // base64 should NOT be in the updated value
    const updatedValue = onChange.mock.calls[0][0];
    expect(updatedValue.base64).toBeUndefined();
  });

  it('retains base64 on upload failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useUploadOnSubmit());
    const onChange = vi.fn();
    const capture = makeCapture();

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadCaptures(capture, 'photo_field', 'token', onChange);
    });

    expect(uploadResult.allSucceeded).toBe(false);
    expect(onChange).toHaveBeenCalled();
    const updatedValue = onChange.mock.calls[0][0];
    expect(updatedValue.base64).toBe(capture.base64);
  });

  it('handles multi-image sequential upload', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          url: `https://s3.example.com/img-${callCount}.jpg`,
          documentId: `doc-${callCount}`,
        }),
      });
    });

    const { result } = renderHook(() => useUploadOnSubmit());
    const onChange = vi.fn();
    const captures = [makeCapture(), makeCapture()];

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadCaptures(captures, 'doc_field', 'token', onChange);
    });

    expect(uploadResult.allSucceeded).toBe(true);
    expect(uploadResult.results).toHaveLength(2);
    expect(onChange).toHaveBeenCalled();
    const updatedValues = onChange.mock.calls[0][0];
    expect(updatedValues).toHaveLength(2);
    expect(updatedValues[0].url).toBe('https://s3.example.com/img-1.jpg');
    expect(updatedValues[1].url).toBe('https://s3.example.com/img-2.jpg');
  });

  it('sets isUploading during upload', async () => {
    let resolveUpload: () => void;
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });

    globalThis.fetch = vi.fn().mockImplementation(() =>
      uploadPromise.then(() => ({
        ok: true,
        json: () => Promise.resolve({ url: 'https://s3.example.com/photo.jpg', documentId: 'doc-1' }),
      })),
    );

    const { result } = renderHook(() => useUploadOnSubmit());
    const onChange = vi.fn();

    expect(result.current.isUploading).toBe(false);

    let uploadResultPromise: Promise<any>;
    act(() => {
      uploadResultPromise = result.current.uploadCaptures(makeCapture(), 'field', 'token', onChange);
    });

    // isUploading should be true while upload is in progress
    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      resolveUpload!();
      await uploadResultPromise;
    });

    expect(result.current.isUploading).toBe(false);
  });

  it('returns empty results for null value', async () => {
    const { result } = renderHook(() => useUploadOnSubmit());
    const onChange = vi.fn();

    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.uploadCaptures(null, 'field', 'token', onChange);
    });

    expect(uploadResult.allSucceeded).toBe(true);
    expect(uploadResult.results).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
