/**
 * S3 Upload Helper for Camera Capture Components.
 *
 * Provides functions to upload captured images to the S3 upload service
 * via the existing POST /api/v1/upload/image endpoint.
 *
 * Handles network errors, server errors, and timeouts gracefully —
 * returns error results instead of throwing.
 */

import type { CaptureResult, UploadResult } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a base64 data URI string to a Blob.
 * Supports both data URI format (data:image/jpeg;base64,...) and raw base64.
 */
export function base64ToBlob(base64: string): Blob {
  let contentType = 'image/jpeg';
  let raw = base64;

  if (base64.startsWith('data:')) {
    const parts = base64.split(',');
    const meta = parts[0]; // e.g. "data:image/jpeg;base64"
    raw = parts[1];
    const mimeMatch = meta.match(/data:([^;]+)/);
    if (mimeMatch) {
      contentType = mimeMatch[1];
    }
  }

  const byteCharacters = atob(raw);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([byteNumbers], { type: contentType });
}

// ---------------------------------------------------------------------------
// Upload functions
// ---------------------------------------------------------------------------

/**
 * Upload a single base64-encoded image to the S3 upload service.
 *
 * Converts base64 to Blob, creates FormData with a `file` field,
 * and POSTs to /api/v1/upload/image with the Authorization header.
 *
 * Returns an UploadResult — never throws.
 */
export async function uploadCaptureToS3(
  base64: string,
  filename: string,
  authToken: string,
): Promise<UploadResult> {
  try {
    // Estimate decoded size from base64 length and enforce 5MB limit
    const rawBase64 = base64.startsWith('data:') ? base64.split(',')[1] : base64;
    const estimatedBytes = Math.ceil((rawBase64.length * 3) / 4);
    if (estimatedBytes > 5 * 1024 * 1024) {
      return { success: false, error: 'Image exceeds 5MB upload limit' };
    }

    const blob = base64ToBlob(base64);
    const formData = new FormData();
    formData.append('file', blob, filename);

    const response = await fetch('/api/v1/upload/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Upload failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
      documentId: data.documentId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upload error';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Upload multiple CaptureResults to S3 sequentially.
 *
 * Returns an array of UploadResults in the same order as the input captures.
 * Each upload is independent — a failure in one does not stop the others.
 */
export async function uploadMultipleCapturesToS3(
  captures: CaptureResult[],
  fieldId: string,
  authToken: string,
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < captures.length; i++) {
    const filename = `${fieldId}_${i + 1}.jpg`;
    const result = await uploadCaptureToS3(captures[i].base64, filename, authToken);
    results.push(result);
  }

  return results;
}
