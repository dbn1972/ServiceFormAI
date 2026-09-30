/**
 * Unit tests for ImageQualityValidator module.
 */

import { describe, it, expect } from 'vitest';
import {
  computeBlurScore,
  computeBrightness,
  validateImageQuality,
} from '../imageQualityValidator';

// ---------------------------------------------------------------------------
// Helper to create ImageData-like objects for testing
// ---------------------------------------------------------------------------

function createImageData(
  width: number,
  height: number,
  fillFn?: (x: number, y: number) => [number, number, number, number],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (fillFn) {
        const [r, g, b, a] = fillFn(x, y);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      } else {
        // Default: mid-gray
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      }
    }
  }

  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

// ---------------------------------------------------------------------------
// computeBrightness
// ---------------------------------------------------------------------------

describe('computeBrightness', () => {
  it('returns 0 for an all-black image', () => {
    const img = createImageData(10, 10, () => [0, 0, 0, 255]);
    expect(computeBrightness(img)).toBe(0);
  });

  it('returns 255 for an all-white image', () => {
    const img = createImageData(10, 10, () => [255, 255, 255, 255]);
    const brightness = computeBrightness(img);
    expect(brightness).toBeCloseTo(255, 0);
  });

  it('returns approximately 128 for a mid-gray image', () => {
    const img = createImageData(10, 10, () => [128, 128, 128, 255]);
    const brightness = computeBrightness(img);
    expect(brightness).toBeCloseTo(128, 0);
  });

  it('computes luminance using the correct formula', () => {
    // Pure red: 0.299 * 255 = 76.245
    const img = createImageData(1, 1, () => [255, 0, 0, 255]);
    expect(computeBrightness(img)).toBeCloseTo(76.245, 1);
  });

  it('returns a value between 0 and 255', () => {
    const img = createImageData(10, 10, () => [100, 200, 50, 255]);
    const brightness = computeBrightness(img);
    expect(brightness).toBeGreaterThanOrEqual(0);
    expect(brightness).toBeLessThanOrEqual(255);
  });
});

// ---------------------------------------------------------------------------
// computeBlurScore
// ---------------------------------------------------------------------------

describe('computeBlurScore', () => {
  it('returns 0 for a uniform image (no edges)', () => {
    const img = createImageData(10, 10, () => [128, 128, 128, 255]);
    expect(computeBlurScore(img)).toBe(0);
  });

  it('returns a non-negative value', () => {
    const img = createImageData(10, 10, (x, y) => {
      const v = ((x + y) % 2) * 255;
      return [v, v, v, 255];
    });
    expect(computeBlurScore(img)).toBeGreaterThanOrEqual(0);
  });

  it('returns a higher score for a sharp image than a uniform one', () => {
    const uniform = createImageData(20, 20, () => [128, 128, 128, 255]);
    const sharp = createImageData(20, 20, (x, y) => {
      const v = ((x + y) % 2) * 255;
      return [v, v, v, 255];
    });
    expect(computeBlurScore(sharp)).toBeGreaterThan(computeBlurScore(uniform));
  });

  it('handles a 3x3 image (minimum for Laplacian)', () => {
    const img = createImageData(3, 3, (x, y) => {
      const v = x === 1 && y === 1 ? 255 : 0;
      return [v, v, v, 255];
    });
    // Should compute at least one Laplacian value (the center pixel)
    expect(computeBlurScore(img)).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 for a 2x2 image (too small for Laplacian)', () => {
    const img = createImageData(2, 2, () => [128, 128, 128, 255]);
    expect(computeBlurScore(img)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// validateImageQuality
// ---------------------------------------------------------------------------

describe('validateImageQuality', () => {
  const defaultConfig = {
    minWidth: 300,
    minHeight: 300,
    blurThreshold: 100,
    minBrightness: 40,
    maxBrightness: 220,
  };

  it('accepts an image that meets all thresholds', () => {
    // Create a sharp, well-lit image at sufficient resolution
    const img = createImageData(400, 400, (x, y) => {
      const v = ((x + y) % 2) * 255;
      return [v, v, v, 255];
    });
    const result = validateImageQuality(img, defaultConfig);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects an image with width below minimum', () => {
    const img = createImageData(200, 400, (x, y) => {
      const v = ((x + y) % 2) * 255;
      return [v, v, v, 255];
    });
    const result = validateImageQuality(img, defaultConfig);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('width');
    expect(result.reason).toContain('200');
  });

  it('rejects an image with height below minimum', () => {
    const img = createImageData(400, 200, (x, y) => {
      const v = ((x + y) % 2) * 255;
      return [v, v, v, 255];
    });
    const result = validateImageQuality(img, defaultConfig);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('height');
    expect(result.reason).toContain('200');
  });

  it('rejects a blurry image (uniform pixels)', () => {
    const img = createImageData(400, 400, () => [128, 128, 128, 255]);
    const result = validateImageQuality(img, defaultConfig);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Image is too blurry');
  });

  it('rejects a too-dark image', () => {
    // Create a sharp but dark image
    const img = createImageData(400, 400, (x, y) => {
      const v = ((x + y) % 2) * 20; // very dark
      return [v, v, v, 255];
    });
    const result = validateImageQuality(img, {
      ...defaultConfig,
      blurThreshold: 0, // disable blur check
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Image is too dark');
  });

  it('rejects a too-bright image', () => {
    const img = createImageData(400, 400, (x, y) => {
      const v = 240 + ((x + y) % 2) * 15; // very bright
      return [v, v, v, 255];
    });
    const result = validateImageQuality(img, {
      ...defaultConfig,
      blurThreshold: 0, // disable blur check
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Image is too bright');
  });

  it('returns details with all computed values', () => {
    const img = createImageData(400, 400, () => [128, 128, 128, 255]);
    const result = validateImageQuality(img, defaultConfig);
    expect(result.details).toBeDefined();
    expect(result.details.width).toBe(400);
    expect(result.details.height).toBe(400);
    expect(typeof result.details.blurScore).toBe('number');
    expect(typeof result.details.brightness).toBe('number');
  });

  it('checks dimensions before blur and brightness', () => {
    // Small AND uniform image — should fail on dimensions first
    const img = createImageData(100, 100, () => [128, 128, 128, 255]);
    const result = validateImageQuality(img, defaultConfig);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('width');
  });

  it('respects custom thresholds', () => {
    const img = createImageData(100, 100, (x, y) => {
      const v = ((x + y) % 2) * 255;
      return [v, v, v, 255];
    });
    const result = validateImageQuality(img, {
      minWidth: 50,
      minHeight: 50,
      blurThreshold: 0,
      minBrightness: 0,
      maxBrightness: 255,
    });
    expect(result.valid).toBe(true);
  });
});
