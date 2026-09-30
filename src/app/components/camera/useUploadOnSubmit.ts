/**
 * useUploadOnSubmit — Hook for uploading camera captures to S3 on form submit.
 *
 * Provides a function that converts base64 CaptureResult(s) to S3 URLs
 * by uploading them via the upload helper. On success, replaces base64
 * with S3 URL in the field value. On failure, retains base64 as fallback.
 *
 * Usage:
 *   const { uploadCaptures, isUploading } = useUploadOnSubmit();
 *   // Call uploadCaptures(value, fieldId, authToken, onChange) before form submit
 */

import { useState, useCallback } from 'react';
import type { CaptureResult, UploadResult } from './types';
import { uploadCaptureToS3, uploadMultipleCapturesToS3 } from './uploadHelper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadOnSubmitResult {
  /** Whether all uploads succeeded */
  allSucceeded: boolean;
  /** Individual upload results */
  results: UploadResult[];
}

// ---------------------------------------------------------------------------
// Helper: replace base64 with S3 URL in a CaptureResult
// ---------------------------------------------------------------------------

function replaceBase64WithUrl(
  capture: CaptureResult,
  uploadResult: UploadResult,
): Record<string, unknown> {
  if (uploadResult.success && uploadResult.url) {
    return {
      url: uploadResult.url,
      documentId: uploadResult.documentId,
      width: capture.width,
      height: capture.height,
      sizeBytes: capture.sizeBytes,
      mimeType: capture.mimeType,
      capturedAt: capture.capturedAt,
      jpegQuality: capture.jpegQuality,
    };
  }
  // Retain base64 on failure
  return { ...capture };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUploadOnSubmit() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  /**
   * Upload capture(s) to S3 and update the field value via onChange.
   *
   * @param value - The current field value (CaptureResult or CaptureResult[])
   * @param fieldId - The field ID for naming uploaded files
   * @param authToken - Bearer token for the upload API
   * @param onChange - Callback to update the field value
   * @returns UploadOnSubmitResult with success status and individual results
   */
  const uploadCaptures = useCallback(
    async (
      value: unknown,
      fieldId: string,
      authToken: string,
      onChange: (value: unknown) => void,
    ): Promise<UploadOnSubmitResult> => {
      if (!value) {
        return { allSucceeded: true, results: [] };
      }

      setIsUploading(true);
      setUploadProgress('Uploading...');

      try {
        // Multi-image upload
        if (Array.isArray(value)) {
          const captures = value as CaptureResult[];
          if (captures.length === 0) {
            return { allSucceeded: true, results: [] };
          }

          setUploadProgress(`Uploading 0 of ${captures.length}...`);
          const results: UploadResult[] = [];

          for (let i = 0; i < captures.length; i++) {
            setUploadProgress(`Uploading ${i + 1} of ${captures.length}...`);
            const filename = `${fieldId}_${i + 1}.jpg`;
            const result = await uploadCaptureToS3(
              captures[i].base64,
              filename,
              authToken,
            );
            results.push(result);
          }

          // Replace base64 with URLs where successful
          const updatedValues = captures.map((capture, i) =>
            replaceBase64WithUrl(capture, results[i]),
          );
          onChange(updatedValues);

          const allSucceeded = results.every((r) => r.success);
          if (!allSucceeded) {
            console.warn(
              `[CameraUpload] Some uploads failed for field "${fieldId}". Base64 retained as fallback.`,
            );
          }

          return { allSucceeded, results };
        }

        // Single image upload
        const capture = value as CaptureResult;
        if (!capture.base64) {
          return { allSucceeded: true, results: [] };
        }

        setUploadProgress('Uploading image...');
        const filename = `${fieldId}.jpg`;
        const result = await uploadCaptureToS3(capture.base64, filename, authToken);

        const updatedValue = replaceBase64WithUrl(capture, result);
        onChange(updatedValue);

        if (!result.success) {
          console.warn(
            `[CameraUpload] Upload failed for field "${fieldId}". Base64 retained as fallback.`,
          );
        }

        return { allSucceeded: result.success, results: [result] };
      } finally {
        setIsUploading(false);
        setUploadProgress('');
      }
    },
    [],
  );

  return {
    uploadCaptures,
    isUploading,
    uploadProgress,
  };
}
