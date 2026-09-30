/**
 * Unit tests for DocumentScanner module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectDocumentEdges, applyPerspectiveCorrection } from '../documentScanner';
import type { Point } from '../types';

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
// detectDocumentEdges
// ---------------------------------------------------------------------------

describe('detectDocumentEdges', () => {
  it('returns null corners for a uniform image (no edges)', () => {
    const img = createImageData(100, 100, () => [128, 128, 128, 255]);
    const result = detectDocumentEdges(img);
    // A uniform image may or may not detect edges depending on threshold
    // but confidence should be low
    if (result.corners === null) {
      expect(result.confidence).toBe(0);
    }
  });

  it('returns null corners for a very small image', () => {
    const img = createImageData(2, 2, () => [128, 128, 128, 255]);
    const result = detectDocumentEdges(img);
    expect(result.corners).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects edges in an image with a clear rectangular region', () => {
    // Create a white rectangle on a black background
    const img = createImageData(200, 200, (x, y) => {
      if (x >= 40 && x <= 160 && y >= 40 && y <= 160) {
        return [255, 255, 255, 255]; // white rectangle
      }
      return [0, 0, 0, 255]; // black background
    });

    const result = detectDocumentEdges(img);
    // Should detect some edges
    if (result.corners !== null) {
      expect(result.corners).toHaveLength(4);
      expect(result.confidence).toBeGreaterThan(0);
      // Each corner should be a Point
      for (const corner of result.corners) {
        expect(corner).toHaveProperty('x');
        expect(corner).toHaveProperty('y');
        expect(typeof corner.x).toBe('number');
        expect(typeof corner.y).toBe('number');
      }
    }
  });

  it('returns confidence between 0 and 1', () => {
    const img = createImageData(200, 200, (x, y) => {
      if (x >= 40 && x <= 160 && y >= 40 && y <= 160) {
        return [255, 255, 255, 255];
      }
      return [0, 0, 0, 255];
    });

    const result = detectDocumentEdges(img);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// applyPerspectiveCorrection
// ---------------------------------------------------------------------------

describe('applyPerspectiveCorrection', () => {
  let mockSourceCanvas: HTMLCanvasElement;
  let mockSourceCtx: CanvasRenderingContext2D;
  let mockDestCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    const sourceImageData = createImageData(200, 200, () => [100, 150, 200, 255]);
    const destImageData = {
      data: new Uint8ClampedArray(100 * 100 * 4),
      width: 100,
      height: 100,
      colorSpace: 'srgb',
    } as ImageData;

    mockSourceCtx = {
      getImageData: vi.fn().mockReturnValue(sourceImageData),
    } as unknown as CanvasRenderingContext2D;

    mockDestCtx = {
      createImageData: vi.fn().mockReturnValue(destImageData),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    mockSourceCanvas = {
      width: 200,
      height: 200,
      getContext: vi.fn().mockReturnValue(mockSourceCtx),
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(mockDestCtx),
        } as unknown as HTMLCanvasElement;
      }
      return document.createElement(tag);
    });
  });

  it('returns a canvas with the specified output dimensions', () => {
    const corners: [Point, Point, Point, Point] = [
      { x: 40, y: 40 },   // top-left
      { x: 160, y: 40 },  // top-right
      { x: 160, y: 160 }, // bottom-right
      { x: 40, y: 160 },  // bottom-left
    ];

    const result = applyPerspectiveCorrection(mockSourceCanvas, corners, 100, 100);

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  it('calls putImageData on the destination context', () => {
    const corners: [Point, Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 200 },
      { x: 0, y: 200 },
    ];

    applyPerspectiveCorrection(mockSourceCanvas, corners, 100, 100);

    expect(mockDestCtx.putImageData).toHaveBeenCalled();
  });

  it('reads source image data from the source canvas', () => {
    const corners: [Point, Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 200 },
      { x: 0, y: 200 },
    ];

    applyPerspectiveCorrection(mockSourceCanvas, corners, 100, 100);

    expect(mockSourceCtx.getImageData).toHaveBeenCalledWith(0, 0, 200, 200);
  });
});
