/**
 * Unit tests for camera types and configuration utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PHOTO_CONFIG,
  DEFAULT_DOCUMENT_CONFIG,
  mergeCameraConfig,
  type CameraConfig,
} from '../types';

describe('DEFAULT_PHOTO_CONFIG', () => {
  it('has correct default values for photo capture', () => {
    expect(DEFAULT_PHOTO_CONFIG).toEqual({
      jpegQuality: 0.8,
      maxFileSizeMB: 2,
      minWidth: 300,
      minHeight: 300,
      blurThreshold: 100,
      minBrightness: 40,
      maxBrightness: 220,
      livenessDetection: false,
      maxImages: 1,
    });
  });
});

describe('DEFAULT_DOCUMENT_CONFIG', () => {
  it('has correct default values for document capture', () => {
    expect(DEFAULT_DOCUMENT_CONFIG).toEqual({
      jpegQuality: 0.8,
      maxFileSizeMB: 2,
      minWidth: 600,
      minHeight: 400,
      blurThreshold: 100,
      minBrightness: 40,
      maxBrightness: 220,
      livenessDetection: false,
      maxImages: 1,
    });
  });

  it('has higher minimum dimensions than photo config', () => {
    expect(DEFAULT_DOCUMENT_CONFIG.minWidth).toBeGreaterThan(DEFAULT_PHOTO_CONFIG.minWidth);
    expect(DEFAULT_DOCUMENT_CONFIG.minHeight).toBeGreaterThan(DEFAULT_PHOTO_CONFIG.minHeight);
  });
});

describe('mergeCameraConfig', () => {
  it('returns a copy of defaults when no custom config is provided', () => {
    const result = mergeCameraConfig(DEFAULT_PHOTO_CONFIG);
    expect(result).toEqual(DEFAULT_PHOTO_CONFIG);
    expect(result).not.toBe(DEFAULT_PHOTO_CONFIG); // should be a new object
  });

  it('returns a copy of defaults when custom config is undefined', () => {
    const result = mergeCameraConfig(DEFAULT_PHOTO_CONFIG, undefined);
    expect(result).toEqual(DEFAULT_PHOTO_CONFIG);
  });

  it('overrides specific keys from custom config', () => {
    const result = mergeCameraConfig(DEFAULT_PHOTO_CONFIG, {
      jpegQuality: 0.9,
      minWidth: 500,
    });
    expect(result.jpegQuality).toBe(0.9);
    expect(result.minWidth).toBe(500);
    // Other values should remain as defaults
    expect(result.maxFileSizeMB).toBe(2);
    expect(result.minHeight).toBe(300);
    expect(result.blurThreshold).toBe(100);
  });

  it('overrides boolean values correctly', () => {
    const result = mergeCameraConfig(DEFAULT_PHOTO_CONFIG, {
      livenessDetection: true,
    });
    expect(result.livenessDetection).toBe(true);
  });

  it('overrides all keys when full config is provided', () => {
    const custom: CameraConfig = {
      jpegQuality: 0.5,
      maxFileSizeMB: 1,
      minWidth: 100,
      minHeight: 100,
      blurThreshold: 50,
      minBrightness: 20,
      maxBrightness: 200,
      livenessDetection: true,
      maxImages: 3,
    };
    const result = mergeCameraConfig(DEFAULT_PHOTO_CONFIG, custom);
    expect(result).toEqual(custom);
  });

  it('ignores extra keys not in CameraConfig', () => {
    const result = mergeCameraConfig(DEFAULT_PHOTO_CONFIG, {
      jpegQuality: 0.9,
      unknownKey: 'should be ignored',
    } as Partial<CameraConfig>);
    expect(result.jpegQuality).toBe(0.9);
    expect((result as Record<string, unknown>)['unknownKey']).toBeUndefined();
  });

  it('does not override when custom value is undefined', () => {
    const result = mergeCameraConfig(DEFAULT_PHOTO_CONFIG, {
      jpegQuality: undefined,
    });
    expect(result.jpegQuality).toBe(0.8);
  });

  it('does not mutate the defaults object', () => {
    const originalDefaults = { ...DEFAULT_PHOTO_CONFIG };
    mergeCameraConfig(DEFAULT_PHOTO_CONFIG, { jpegQuality: 0.5 });
    expect(DEFAULT_PHOTO_CONFIG).toEqual(originalDefaults);
  });
});
