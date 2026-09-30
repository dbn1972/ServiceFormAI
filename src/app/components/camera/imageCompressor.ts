/**
 * ImageCompressor — JPEG compression with iterative quality reduction.
 *
 * Compresses a canvas to JPEG using toDataURL(). If the output exceeds
 * the configured max file size, quality is reduced in 0.05 steps down
 * to 0.3. If still over limit, dimensions are scaled by 50% and retried.
 */

import type { CameraConfig, CompressionResult } from './types';

/**
 * Calculate the byte size of a base64-encoded string.
 *
 * Accounts for padding characters ('=') in the base64 string.
 * If the string contains a data URI prefix, it is stripped first.
 */
export function base64SizeBytes(base64: string): number {
  // Strip data URI prefix if present
  let raw = base64;
  const commaIndex = raw.indexOf(',');
  if (commaIndex !== -1) {
    raw = raw.substring(commaIndex + 1);
  }

  // Count padding characters
  let padding = 0;
  if (raw.endsWith('==')) {
    padding = 2;
  } else if (raw.endsWith('=')) {
    padding = 1;
  }

  return Math.floor((raw.length * 3) / 4) - padding;
}

/**
 * Compress a canvas to JPEG within the configured size limit.
 *
 * Strategy:
 * 1. Start at config.jpegQuality
 * 2. If output exceeds maxFileSizeMB, reduce quality by 0.05 steps down to 0.3
 * 3. If still over limit at 0.3, scale canvas dimensions by 50% and retry from 0.3
 */
export function compressImage(
  canvas: HTMLCanvasElement,
  config: Pick<CameraConfig, 'jpegQuality' | 'maxFileSizeMB'>,
): CompressionResult {
  const maxBytes = config.maxFileSizeMB * 1024 * 1024;
  let currentCanvas = canvas;
  let quality = config.jpegQuality;

  // Try compression at decreasing quality levels
  while (quality >= 0.3) {
    const roundedQuality = Math.round(quality * 100) / 100;
    const base64 = currentCanvas.toDataURL('image/jpeg', roundedQuality);
    const sizeBytes = base64SizeBytes(base64);

    if (sizeBytes <= maxBytes) {
      return {
        base64,
        width: currentCanvas.width,
        height: currentCanvas.height,
        sizeBytes,
        jpegQuality: roundedQuality,
      };
    }

    quality -= 0.05;
  }

  // Quality at 0.3 still exceeds limit — scale dimensions by 50% and retry
  const scaledCanvas = scaleCanvas(currentCanvas, 0.5);
  const base64 = scaledCanvas.toDataURL('image/jpeg', 0.3);
  const sizeBytes = base64SizeBytes(base64);

  return {
    base64,
    width: scaledCanvas.width,
    height: scaledCanvas.height,
    sizeBytes,
    jpegQuality: 0.3,
  };
}

/**
 * Scale a canvas by the given factor.
 * Returns a new canvas with the scaled dimensions.
 */
function scaleCanvas(source: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  const newWidth = Math.max(1, Math.round(source.width * factor));
  const newHeight = Math.max(1, Math.round(source.height * factor));

  const scaled = document.createElement('canvas');
  scaled.width = newWidth;
  scaled.height = newHeight;

  const ctx = scaled.getContext('2d');
  if (ctx) {
    ctx.drawImage(source, 0, 0, newWidth, newHeight);
  }

  return scaled;
}
