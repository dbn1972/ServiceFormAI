/**
 * Unit tests for ImageCompressor module.
 *
 * Since jsdom does not support real canvas rendering, we mock
 * HTMLCanvasElement.toDataURL() and document.createElement('canvas').
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { base64SizeBytes, compressImage } from '../imageCompressor';

// ---------------------------------------------------------------------------
// base64SizeBytes (pure function — no mocks needed)
// ---------------------------------------------------------------------------

describe('base64SizeBytes', () => {
  it('computes correct size for a simple base64 string without padding', () => {
    // "abc" in base64 is "YWJj" (4 chars, 0 padding) → 3 bytes
    expect(base64SizeBytes('YWJj')).toBe(3);
  });

  it('computes correct size for base64 with single padding', () => {
    // "ab" in base64 is "YWI=" (4 chars, 1 padding) → 2 bytes
    expect(base64SizeBytes('YWI=')).toBe(2);
  });

  it('computes correct size for base64 with double padding', () => {
    // "a" in base64 is "YQ==" (4 chars, 2 padding) → 1 byte
    expect(base64SizeBytes('YQ==')).toBe(1);
  });

  it('strips data URI prefix before computing size', () => {
    const raw = 'YWJj'; // 3 bytes
    const dataUri = `data:image/jpeg;base64,${raw}`;
    expect(base64SizeBytes(dataUri)).toBe(base64SizeBytes(raw));
  });

  it('returns 0 for an empty string', () => {
    expect(base64SizeBytes('')).toBe(0);
  });

  it('handles data URI prefix with empty payload', () => {
    expect(base64SizeBytes('data:image/jpeg;base64,')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// compressImage (requires canvas mocking)
// ---------------------------------------------------------------------------

describe('compressImage', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCtx = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      width: 800,
      height: 600,
      toDataURL: vi.fn(),
      getContext: vi.fn().mockReturnValue(mockCtx),
    } as unknown as HTMLCanvasElement;

    // Mock document.createElement to return a mock canvas for scaling
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const scaledCanvas = {
          width: 0,
          height: 0,
          toDataURL: vi.fn(),
          getContext: vi.fn().mockReturnValue(mockCtx),
        } as unknown as HTMLCanvasElement;
        return scaledCanvas;
      }
      return document.createElement(tag);
    });
  });

  it('returns compressed result at initial quality when within size limit', () => {
    // Small base64 output (well under 2MB)
    const smallBase64 = 'data:image/jpeg;base64,YWJj';
    (mockCanvas.toDataURL as ReturnType<typeof vi.fn>).mockReturnValue(smallBase64);

    const result = compressImage(mockCanvas, { jpegQuality: 0.8, maxFileSizeMB: 2 });

    expect(result.base64).toBe(smallBase64);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.jpegQuality).toBe(0.8);
    expect(result.sizeBytes).toBe(base64SizeBytes(smallBase64));
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
  });

  it('reduces quality when output exceeds size limit', () => {
    // First call at 0.8 returns large output, second call at 0.75 returns small output
    const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(3_000_000); // ~2.25MB
    const smallBase64 = 'data:image/jpeg;base64,YWJj';

    (mockCanvas.toDataURL as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(largeBase64)  // quality 0.8 — too large
      .mockReturnValueOnce(smallBase64); // quality 0.75 — fits

    const result = compressImage(mockCanvas, { jpegQuality: 0.8, maxFileSizeMB: 2 });

    expect(result.jpegQuality).toBe(0.75);
    expect(result.base64).toBe(smallBase64);
  });

  it('scales canvas when quality 0.3 still exceeds limit', () => {
    const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(3_000_000);
    const smallBase64 = 'data:image/jpeg;base64,YWJj';

    // All quality levels return large output
    (mockCanvas.toDataURL as ReturnType<typeof vi.fn>).mockReturnValue(largeBase64);

    // The scaled canvas (created via document.createElement) returns small output
    const createdCanvases: any[] = [];
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const scaledCanvas = {
          width: 0,
          height: 0,
          toDataURL: vi.fn().mockReturnValue(smallBase64),
          getContext: vi.fn().mockReturnValue(mockCtx),
        };
        createdCanvases.push(scaledCanvas);
        return scaledCanvas as unknown as HTMLCanvasElement;
      }
      return document.createElement(tag);
    });

    const result = compressImage(mockCanvas, { jpegQuality: 0.8, maxFileSizeMB: 2 });

    // Should have created a scaled canvas
    expect(createdCanvases.length).toBeGreaterThan(0);
    expect(result.jpegQuality).toBe(0.3);
  });

  it('preserves canvas dimensions in result when no scaling needed', () => {
    const smallBase64 = 'data:image/jpeg;base64,YWJj';
    (mockCanvas.toDataURL as ReturnType<typeof vi.fn>).mockReturnValue(smallBase64);

    const result = compressImage(mockCanvas, { jpegQuality: 0.8, maxFileSizeMB: 2 });

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('sizeBytes matches base64SizeBytes of the output', () => {
    const base64 = 'data:image/jpeg;base64,YWJjZGVm';
    (mockCanvas.toDataURL as ReturnType<typeof vi.fn>).mockReturnValue(base64);

    const result = compressImage(mockCanvas, { jpegQuality: 0.8, maxFileSizeMB: 2 });

    expect(result.sizeBytes).toBe(base64SizeBytes(base64));
  });
});
