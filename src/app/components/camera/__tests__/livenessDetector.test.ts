/**
 * Unit tests for LivenessDetector module.
 */

import { describe, it, expect } from 'vitest';
import { analyzeLivenessFrame } from '../livenessDetector';
import type { LivenessAction } from '../types';

// ---------------------------------------------------------------------------
// Helper to create ImageData
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
// analyzeLivenessFrame
// ---------------------------------------------------------------------------

describe('analyzeLivenessFrame', () => {
  const width = 100;
  const height = 100;

  describe('with no previous frame', () => {
    it('returns not passed with blink instruction', () => {
      const frame = createImageData(width, height);
      const result = analyzeLivenessFrame(frame, null, 'blink', 0);

      expect(result.passed).toBe(false);
      expect(result.instruction).toBe('Please blink');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });

    it('returns not passed with head turn instruction', () => {
      const frame = createImageData(width, height);
      const result = analyzeLivenessFrame(frame, null, 'head_turn', 0);

      expect(result.passed).toBe(false);
      expect(result.instruction).toContain('Turn your head');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });
  });

  describe('timeout behavior', () => {
    it('returns timeout message after 15 seconds', () => {
      const frame = createImageData(width, height);
      const result = analyzeLivenessFrame(frame, null, 'blink', 15_000);

      expect(result.passed).toBe(false);
      expect(result.instruction).toContain('timed out');
      expect(result.timeRemaining).toBe(0);
    });

    it('returns timeout message after exceeding 15 seconds', () => {
      const frame = createImageData(width, height);
      const result = analyzeLivenessFrame(frame, null, 'blink', 20_000);

      expect(result.passed).toBe(false);
      expect(result.timeRemaining).toBe(0);
    });
  });

  describe('time remaining', () => {
    it('computes correct time remaining', () => {
      const frame = createImageData(width, height);
      const result = analyzeLivenessFrame(frame, null, 'blink', 5_000);

      expect(result.timeRemaining).toBe(10); // 15 - 5 = 10 seconds
    });

    it('returns 0 time remaining at timeout', () => {
      const frame = createImageData(width, height);
      const result = analyzeLivenessFrame(frame, null, 'blink', 15_000);

      expect(result.timeRemaining).toBe(0);
    });
  });

  describe('blink detection', () => {
    it('detects a blink when eye region changes significantly', () => {
      // Previous frame: bright eye region
      const previous = createImageData(width, height, (x, y) => {
        // Eye region: middle 40% width (30-70), 20-40% height (20-40)
        if (x >= 30 && x < 70 && y >= 20 && y < 40) {
          return [200, 200, 200, 255]; // bright
        }
        return [128, 128, 128, 255];
      });

      // Current frame: dark eye region (simulating closed eyes)
      const current = createImageData(width, height, (x, y) => {
        if (x >= 30 && x < 70 && y >= 20 && y < 40) {
          return [50, 50, 50, 255]; // dark (eyes closed)
        }
        return [128, 128, 128, 255];
      });

      const result = analyzeLivenessFrame(current, previous, 'blink', 3_000);
      expect(result.passed).toBe(true);
      expect(result.instruction).toContain('Blink detected');
    });

    it('does not detect a blink when frames are identical', () => {
      const frame = createImageData(width, height);
      const result = analyzeLivenessFrame(frame, frame, 'blink', 3_000);

      expect(result.passed).toBe(false);
      expect(result.instruction).toBe('Please blink');
    });
  });

  describe('head turn detection', () => {
    it('detects a head turn when face region centroid shifts horizontally', () => {
      // Previous frame: bright region on the left side of face area
      const previous = createImageData(width, height, (x, y) => {
        if (x >= 30 && x < 50 && y >= 30 && y < 70) {
          return [255, 255, 255, 255]; // bright left
        }
        return [0, 0, 0, 255]; // dark elsewhere
      });

      // Current frame: bright region shifted to the right
      const current = createImageData(width, height, (x, y) => {
        if (x >= 50 && x < 70 && y >= 30 && y < 70) {
          return [255, 255, 255, 255]; // bright right
        }
        return [0, 0, 0, 255]; // dark elsewhere
      });

      const result = analyzeLivenessFrame(current, previous, 'head_turn', 3_000);
      expect(result.passed).toBe(true);
      expect(result.instruction).toContain('Head turn detected');
    });

    it('does not detect a head turn when frames are identical', () => {
      const frame = createImageData(width, height, () => [128, 128, 128, 255]);
      const result = analyzeLivenessFrame(frame, frame, 'head_turn', 3_000);

      expect(result.passed).toBe(false);
      expect(result.instruction).toContain('Turn your head');
    });
  });

  describe('frame dimension mismatch', () => {
    it('returns not passed when frames have different dimensions', () => {
      const current = createImageData(100, 100);
      const previous = createImageData(200, 200);

      const result = analyzeLivenessFrame(current, previous, 'blink', 3_000);

      expect(result.passed).toBe(false);
    });
  });
});
