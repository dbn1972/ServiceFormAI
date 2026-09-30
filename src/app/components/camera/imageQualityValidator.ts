/**
 * ImageQualityValidator — Pure functions for validating captured image quality.
 *
 * Operates on ImageData objects (canvas pixel data) to check dimensions,
 * blur (Laplacian variance), and brightness against configurable thresholds.
 */

import type { CameraConfig, QualityValidationResult } from './types';

/**
 * Compute Laplacian variance as a blur detection score.
 * Higher values indicate a sharper image.
 *
 * Converts RGBA pixels to grayscale, applies a 3×3 Laplacian kernel,
 * and returns the variance of the convolution result.
 */
export function computeBlurScore(imageData: ImageData): number {
  const { data, width, height } = imageData;

  // Convert to grayscale
  const gray = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Apply 3×3 Laplacian kernel: [0, 1, 0], [1, -4, 1], [0, 1, 0]
  const laplacianValues: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap =
        gray[idx - width] +       // top
        gray[idx - 1] +           // left
        -4 * gray[idx] +          // center
        gray[idx + 1] +           // right
        gray[idx + width];        // bottom
      laplacianValues.push(lap);
    }
  }

  if (laplacianValues.length === 0) {
    return 0;
  }

  // Compute variance
  const n = laplacianValues.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += laplacianValues[i];
  }
  const mean = sum / n;

  let varianceSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = laplacianValues[i] - mean;
    varianceSum += diff * diff;
  }

  return varianceSum / n;
}

/**
 * Compute average brightness (0–255) from image pixel data.
 * Uses the luminance formula: 0.299*R + 0.587*G + 0.114*B.
 */
export function computeBrightness(imageData: ImageData): number {
  const { data, width, height } = imageData;
  const pixelCount = width * height;

  if (pixelCount === 0) {
    return 0;
  }

  let totalBrightness = 0;
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  return totalBrightness / pixelCount;
}

/**
 * Validate image quality against configured thresholds.
 *
 * Checks dimensions, blur score, and brightness. Returns the first
 * failing reason encountered (priority: dimensions → blur → brightness).
 */
export function validateImageQuality(
  imageData: ImageData,
  config: Pick<CameraConfig, 'minWidth' | 'minHeight' | 'blurThreshold' | 'minBrightness' | 'maxBrightness'>,
): QualityValidationResult {
  const { width, height } = imageData;
  const blurScore = computeBlurScore(imageData);
  const brightness = computeBrightness(imageData);

  const details = { width, height, blurScore, brightness };

  // Check dimensions
  if (width < config.minWidth) {
    return {
      valid: false,
      reason: `Image width ${width}px is below minimum ${config.minWidth}px`,
      details,
    };
  }
  if (height < config.minHeight) {
    return {
      valid: false,
      reason: `Image height ${height}px is below minimum ${config.minHeight}px`,
      details,
    };
  }

  // Check blur
  if (blurScore < config.blurThreshold) {
    return {
      valid: false,
      reason: 'Image is too blurry',
      details,
    };
  }

  // Check brightness
  if (brightness < config.minBrightness) {
    return {
      valid: false,
      reason: 'Image is too dark',
      details,
    };
  }
  if (brightness > config.maxBrightness) {
    return {
      valid: false,
      reason: 'Image is too bright',
      details,
    };
  }

  return { valid: true, details };
}
