/**
 * Core types and configuration utilities for the Camera Document Capture system.
 *
 * Defines interfaces for capture results, camera configuration, quality validation,
 * compression, document scanning, and upload results. Also provides default
 * configurations for photo and document capture modes.
 */

// ---------------------------------------------------------------------------
// Point
// ---------------------------------------------------------------------------

/** A 2D point used for document edge detection corners. */
export interface Point {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// CaptureResult
// ---------------------------------------------------------------------------

/** Data object produced after a successful image capture. */
export interface CaptureResult {
  /** Base64-encoded JPEG image string (data URI or raw base64) */
  base64: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Compressed file size in bytes */
  sizeBytes: number;
  /** MIME type — always 'image/jpeg' for camera captures */
  mimeType: 'image/jpeg';
  /** ISO 8601 timestamp of when the image was captured */
  capturedAt: string;
  /** Final JPEG quality used (0.0–1.0) */
  jpegQuality: number;
}

// ---------------------------------------------------------------------------
// CameraConfig
// ---------------------------------------------------------------------------

/** Configuration derived from the field's customConfig property. */
export interface CameraConfig {
  /** JPEG compression quality (0.0–1.0). Default: 0.8 */
  jpegQuality: number;
  /** Maximum compressed file size in MB. Default: 2 */
  maxFileSizeMB: number;
  /** Minimum image width in pixels. Default: 300 (photo) / 600 (document) */
  minWidth: number;
  /** Minimum image height in pixels. Default: 300 (photo) / 400 (document) */
  minHeight: number;
  /** Laplacian variance threshold for blur detection. Default: 100 */
  blurThreshold: number;
  /** Minimum average brightness (0–255). Default: 40 */
  minBrightness: number;
  /** Maximum average brightness (0–255). Default: 220 */
  maxBrightness: number;
  /** Enable liveness detection for photo capture. Default: false */
  livenessDetection: boolean;
  /** Maximum number of images for multi-image capture. Default: 1 */
  maxImages: number;
}

// ---------------------------------------------------------------------------
// QualityValidationResult
// ---------------------------------------------------------------------------

/** Result of image quality validation. */
export interface QualityValidationResult {
  valid: boolean;
  reason?: string;
  details: {
    width: number;
    height: number;
    blurScore: number;
    brightness: number;
  };
}

// ---------------------------------------------------------------------------
// CompressionResult
// ---------------------------------------------------------------------------

/** Result of image compression. */
export interface CompressionResult {
  base64: string;
  width: number;
  height: number;
  sizeBytes: number;
  jpegQuality: number;
}

// ---------------------------------------------------------------------------
// DetectedEdges
// ---------------------------------------------------------------------------

/** Result of document edge detection. */
export interface DetectedEdges {
  /** Four corner points of the detected document quadrilateral, or null if none found */
  corners: [Point, Point, Point, Point] | null;
  /** Confidence score (0–1) of the edge detection */
  confidence: number;
}

// ---------------------------------------------------------------------------
// UploadResult
// ---------------------------------------------------------------------------

/** Result of uploading a capture to S3. */
export interface UploadResult {
  success: boolean;
  /** S3 URL if upload succeeded */
  url?: string;
  /** Document ID from the upload service */
  documentId?: string;
  /** Error message if upload failed */
  error?: string;
}

// ---------------------------------------------------------------------------
// LivenessDetector types
// ---------------------------------------------------------------------------

export type LivenessAction = 'blink' | 'head_turn';

export interface LivenessState {
  /** Whether the liveness check has passed */
  passed: boolean;
  /** Current instruction to display */
  instruction: string;
  /** Time remaining before timeout (seconds) */
  timeRemaining: number;
}

// ---------------------------------------------------------------------------
// Default configurations
// ---------------------------------------------------------------------------

/** Default config for camera_photo fields */
export const DEFAULT_PHOTO_CONFIG: CameraConfig = {
  jpegQuality: 0.8,
  maxFileSizeMB: 2,
  minWidth: 300,
  minHeight: 300,
  blurThreshold: 100,
  minBrightness: 40,
  maxBrightness: 220,
  livenessDetection: false,
  maxImages: 1,
};

/** Default config for camera_document fields */
export const DEFAULT_DOCUMENT_CONFIG: CameraConfig = {
  jpegQuality: 0.8,
  maxFileSizeMB: 2,
  minWidth: 600,
  minHeight: 400,
  blurThreshold: 100,
  minBrightness: 40,
  maxBrightness: 220,
  livenessDetection: false,
  maxImages: 1,
};

// ---------------------------------------------------------------------------
// Config merge utility
// ---------------------------------------------------------------------------

/**
 * Merge a partial custom config over a defaults config.
 * Only keys present in CameraConfig are preserved; extra keys are ignored.
 */
export function mergeCameraConfig(
  defaults: CameraConfig,
  customConfig?: Partial<CameraConfig>,
): CameraConfig {
  if (!customConfig) {
    return { ...defaults };
  }

  const merged = { ...defaults };
  const validKeys: (keyof CameraConfig)[] = [
    'jpegQuality',
    'maxFileSizeMB',
    'minWidth',
    'minHeight',
    'blurThreshold',
    'minBrightness',
    'maxBrightness',
    'livenessDetection',
    'maxImages',
  ];

  for (const key of validKeys) {
    if (key in customConfig && customConfig[key] !== undefined) {
      (merged as Record<string, unknown>)[key] = customConfig[key];
    }
  }

  return merged;
}
