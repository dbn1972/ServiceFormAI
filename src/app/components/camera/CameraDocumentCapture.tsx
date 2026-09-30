/**
 * CameraDocumentCapture — Premium platform component for document scanning.
 *
 * Registered as field type "camera_document" under __platform__ scope.
 *
 * Features:
 * - Live camera preview with document edge detection overlay
 * - Perspective correction and auto-crop
 * - Multi-image capture (front/back)
 * - Image quality validation (resolution, blur, brightness)
 * - JPEG compression with configurable quality/size limits
 * - Retake flow
 * - File upload fallback
 * - Full accessibility (aria-labels, aria-live, 44px touch targets)
 *
 * Implements CustomFieldProps interface.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import type { CustomFieldProps } from '../../types/customComponent';
import type { CaptureResult, CameraConfig, DetectedEdges } from './types';
import { DEFAULT_DOCUMENT_CONFIG, mergeCameraConfig } from './types';
import { validateImageQuality } from './imageQualityValidator';
import { compressImage } from './imageCompressor';
import { detectDocumentEdges, applyPerspectiveCorrection } from './documentScanner';
import {
  Camera,
  Upload,
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import toast from '../../utils/toast';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type ComponentState =
  | 'idle'
  | 'loading'
  | 'preview'
  | 'captured'
  | 'fallback'
  | 'done';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CameraDocumentCapture({
  field,
  fieldId,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  config,
}: CustomFieldProps) {
  // Merge config
  const cameraConfig: CameraConfig = mergeCameraConfig(
    DEFAULT_DOCUMENT_CONFIG,
    config as Partial<CameraConfig>,
  );

  const isMultiImage = cameraConfig.maxImages > 1;

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const edgeDetectionRef = useRef<number | null>(null);

  // State
  const [state, setState] = useState<ComponentState>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedResult, setCapturedResult] = useState<CaptureResult | null>(null);
  const [captures, setCaptures] = useState<CaptureResult[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [detectedEdges, setDetectedEdges] = useState<DetectedEdges | null>(null);
  const [warningMessage, setWarningMessage] = useState('');

  // Check if there's already a value
  const hasValue = value != null && (
    (Array.isArray(value) && value.length > 0) ||
    (!Array.isArray(value) && typeof value === 'object' && (value as CaptureResult).base64)
  );

  // ---------------------------------------------------------------------------
  // Stream management
  // ---------------------------------------------------------------------------

  const stopEdgeDetection = useCallback(() => {
    if (edgeDetectionRef.current !== null) {
      cancelAnimationFrame(edgeDetectionRef.current);
      edgeDetectionRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    stopEdgeDetection();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [stopEdgeDetection]);

  const startEdgeDetection = useCallback(() => {
    const detect = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const edges = detectDocumentEdges(imageData);
      setDetectedEdges(edges);

      edgeDetectionRef.current = requestAnimationFrame(detect);
    };

    edgeDetectionRef.current = requestAnimationFrame(detect);
  }, []);

  const startStream = useCallback(
    async (mode: 'user' | 'environment') => {
      setState('loading');
      setErrorMessage('');
      setStatusMessage('Camera is loading');

      // Check if getUserMedia is supported
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setState('fallback');
        setStatusMessage('Camera not supported. You can upload a file instead.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setState('preview');
        setStatusMessage('');
        startEdgeDetection();
      } catch (err: unknown) {
        const error = err as DOMException;
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'NotFoundError'
        ) {
          setState('fallback');
          setStatusMessage(
            error.name === 'NotAllowedError'
              ? 'Camera access denied. You can upload a file instead.'
              : 'No camera found. You can upload a file instead.',
          );
        } else if (error.name === 'NotReadableError') {
          setState('idle');
          setErrorMessage(
            'Camera is in use by another application. Please close it and try again.',
          );
        } else {
          setState('fallback');
          setStatusMessage('Camera unavailable. You can upload a file instead.');
        }
      }
    },
    [startEdgeDetection],
  );

  // ---------------------------------------------------------------------------
  // Capture
  // ---------------------------------------------------------------------------

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let processCanvas: HTMLCanvasElement = canvas;
    let warning = '';

    // Apply perspective correction if edges detected
    if (detectedEdges && detectedEdges.corners) {
      processCanvas = applyPerspectiveCorrection(
        canvas,
        detectedEdges.corners,
        canvas.width,
        canvas.height,
      );
      warning = '';
    } else {
      // Full frame capture with warning
      warning = 'Could not detect document edges. Please place your document on a contrasting surface.';
    }

    const processCtx = processCanvas.getContext('2d');
    if (!processCtx) return;

    const imageData = processCtx.getImageData(
      0,
      0,
      processCanvas.width,
      processCanvas.height,
    );

    // Validate quality
    const validation = validateImageQuality(imageData, {
      minWidth: cameraConfig.minWidth,
      minHeight: cameraConfig.minHeight,
      blurThreshold: cameraConfig.blurThreshold,
      minBrightness: cameraConfig.minBrightness,
      maxBrightness: cameraConfig.maxBrightness,
    });

    if (!validation.valid) {
      setErrorMessage(validation.reason || 'Image quality check failed');
      setStatusMessage(validation.reason || 'Image quality check failed');
      return;
    }

    // Compress
    const compressed = compressImage(processCanvas, {
      jpegQuality: cameraConfig.jpegQuality,
      maxFileSizeMB: cameraConfig.maxFileSizeMB,
    });

    const result: CaptureResult = {
      base64: compressed.base64,
      width: compressed.width,
      height: compressed.height,
      sizeBytes: compressed.sizeBytes,
      mimeType: 'image/jpeg',
      capturedAt: new Date().toISOString(),
      jpegQuality: compressed.jpegQuality,
    };

    setCapturedImage(compressed.base64);
    setCapturedResult(result);
    setWarningMessage(warning);
    setState('captured');
    setErrorMessage('');
    setStatusMessage('Document captured. Review your image or retake.');
    stopEdgeDetection();
  }, [cameraConfig, detectedEdges, stopEdgeDetection]);

  // ---------------------------------------------------------------------------
  // Retake flow
  // ---------------------------------------------------------------------------

  const handleUseThis = useCallback(() => {
    if (!capturedResult) return;

    if (isMultiImage) {
      const newCaptures = [...captures, capturedResult];
      setCaptures(newCaptures);
      setCapturedImage(null);
      setCapturedResult(null);
      setWarningMessage('');

      if (newCaptures.length >= cameraConfig.maxImages) {
        // All images captured
        setState('done');
        stopStream();
        setStatusMessage(
          `All ${cameraConfig.maxImages} images captured. Click Done to finish.`,
        );
      } else {
        // Return to preview for next capture
        setState('preview');
        setStatusMessage(
          `${newCaptures.length} of ${cameraConfig.maxImages} captured. Capture the next image.`,
        );
        startEdgeDetection();
        // Re-attach stream to video if still active
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      }
    } else {
      // Single image mode
      onChange(capturedResult);
      onBlur();
      stopStream();
      setState('idle');
      setCapturedImage(null);
      setCapturedResult(null);
      setWarningMessage('');
      setStatusMessage('Document accepted.');
    }
  }, [
    capturedResult,
    isMultiImage,
    captures,
    cameraConfig.maxImages,
    onChange,
    onBlur,
    stopStream,
    startEdgeDetection,
  ]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setCapturedResult(null);
    setErrorMessage('');
    setStatusMessage('');
    setWarningMessage('');
    setState('preview');

    startEdgeDetection();

    // Re-attach stream to video if still active
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    } else {
      startStream(facingMode);
    }
  }, [startStream, facingMode, startEdgeDetection]);

  // ---------------------------------------------------------------------------
  // Multi-image: Done
  // ---------------------------------------------------------------------------

  const handleDone = useCallback(() => {
    onChange(captures);
    onBlur();
    stopStream();
    setState('idle');
    setCaptures([]);
    setStatusMessage('All documents accepted.');
  }, [captures, onChange, onBlur, stopStream]);

  // ---------------------------------------------------------------------------
  // Multi-image: Delete
  // ---------------------------------------------------------------------------

  const handleDeleteCapture = useCallback(
    (index: number) => {
      const newCaptures = captures.filter((_, i) => i !== index);
      setCaptures(newCaptures);

      if (state === 'done') {
        // Was in done state, go back to preview for recapture
        setState('preview');
        setStatusMessage(
          `${newCaptures.length} of ${cameraConfig.maxImages} captured. Capture the next image.`,
        );
        startStream(facingMode);
      } else {
        setStatusMessage(
          `${newCaptures.length} of ${cameraConfig.maxImages} captured.`,
        );
      }
    },
    [captures, state, cameraConfig.maxImages, facingMode, startStream],
  );

  // ---------------------------------------------------------------------------
  // Camera switch
  // ---------------------------------------------------------------------------

  const handleSwitchCamera = useCallback(() => {
    stopStream();
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startStream(newMode);
  }, [facingMode, stopStream, startStream]);

  // ---------------------------------------------------------------------------
  // File upload fallback
  // ---------------------------------------------------------------------------

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // For PDF files, create a simple result
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const result: CaptureResult = {
            base64,
            width: 0,
            height: 0,
            sizeBytes: file.size,
            mimeType: 'image/jpeg',
            capturedAt: new Date().toISOString(),
            jpegQuality: 1,
          };

          if (isMultiImage) {
            const newCaptures = [...captures, result];
            setCaptures(newCaptures);
            if (newCaptures.length >= cameraConfig.maxImages) {
              setState('done');
            }
          } else {
            onChange(result);
            onBlur();
          }
          setStatusMessage('Document uploaded successfully.');
          setErrorMessage('');
        };
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const validation = validateImageQuality(imageData, {
            minWidth: cameraConfig.minWidth,
            minHeight: cameraConfig.minHeight,
            blurThreshold: cameraConfig.blurThreshold,
            minBrightness: cameraConfig.minBrightness,
            maxBrightness: cameraConfig.maxBrightness,
          });

          if (!validation.valid) {
            setErrorMessage(validation.reason || 'Image quality check failed');
            toast.error(validation.reason || 'Image quality check failed');
            return;
          }

          const compressed = compressImage(canvas, {
            jpegQuality: cameraConfig.jpegQuality,
            maxFileSizeMB: cameraConfig.maxFileSizeMB,
          });

          const result: CaptureResult = {
            base64: compressed.base64,
            width: compressed.width,
            height: compressed.height,
            sizeBytes: compressed.sizeBytes,
            mimeType: 'image/jpeg',
            capturedAt: new Date().toISOString(),
            jpegQuality: compressed.jpegQuality,
          };

          if (isMultiImage) {
            const newCaptures = [...captures, result];
            setCaptures(newCaptures);
            if (newCaptures.length >= cameraConfig.maxImages) {
              setState('done');
            }
          } else {
            onChange(result);
            onBlur();
          }
          setStatusMessage('Document uploaded successfully.');
          setErrorMessage('');
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    },
    [cameraConfig, onChange, onBlur, isMultiImage, captures],
  );

  const switchToUpload = useCallback(() => {
    stopStream();
    setState('fallback');
    setStatusMessage('');
    setErrorMessage('');
  }, [stopStream]);

  // ---------------------------------------------------------------------------
  // Remove existing value
  // ---------------------------------------------------------------------------

  const handleRemove = useCallback(() => {
    onChange(null);
    onBlur();
    setState('idle');
    setCapturedImage(null);
    setCapturedResult(null);
    setCaptures([]);
    setStatusMessage('');
    setWarningMessage('');
  }, [onChange, onBlur]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const hasError = !!error;

  // If there's already a value, show it
  if (hasValue && state === 'idle') {
    const currentValues = Array.isArray(value)
      ? (value as CaptureResult[])
      : [value as CaptureResult];

    return (
      <div aria-label={field.label}>
        <label className="block text-sm font-medium mb-2" id={`${fieldId}-label`}>
          {field.label}
          {field.required && (
            <span className="text-destructive ml-1" aria-label="required">*</span>
          )}
        </label>
        {field.helpText && (
          <p id={`${fieldId}-help`} className="text-sm text-muted-foreground mb-2">
            {field.helpText}
          </p>
        )}
        <div className="relative border rounded-lg overflow-hidden">
          <div className="flex gap-2 p-2 flex-wrap">
            {currentValues.map((item, idx) => (
              <img
                key={idx}
                src={item.base64}
                alt={`Captured document ${idx + 1} for review`}
                className="w-24 h-24 object-cover rounded border"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Remove captured document"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive mt-1 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div aria-label={field.label}>
      <label className="block text-sm font-medium mb-2" id={`${fieldId}-label`}>
        {field.label}
        {field.required && (
          <span className="text-destructive ml-1" aria-label="required">*</span>
        )}
      </label>

      {field.helpText && (
        <p id={`${fieldId}-help`} className="text-sm text-muted-foreground mb-2">
          {field.helpText}
        </p>
      )}

      {/* Status announcements */}
      <div aria-live="polite" className="sr-only" data-testid="status-polite">
        {statusMessage}
      </div>
      <div aria-live="assertive" className="sr-only" data-testid="status-assertive">
        {errorMessage}
      </div>

      {/* Multi-image thumbnail strip */}
      {isMultiImage && captures.length > 0 && state !== 'idle' && (
        <div className="mb-3 border rounded-lg p-2" data-testid="thumbnail-strip">
          <p className="text-sm text-muted-foreground mb-2">
            {captures.length} of {cameraConfig.maxImages} captured
          </p>
          <div className="flex gap-2 flex-wrap">
            {captures.map((capture, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={capture.base64}
                  alt={`Captured document ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteCapture(idx)}
                  disabled={disabled}
                  className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Delete document ${idx + 1}`}
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idle state — Start Camera button */}
      {state === 'idle' && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            hasError
              ? 'border-destructive hover:border-destructive'
              : 'border-border hover:border-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Camera
            className="w-10 h-10 text-muted-foreground mx-auto mb-3"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => startStream(facingMode)}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Start Camera"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            Start Camera
          </button>
          <div className="mt-3">
            <button
              type="button"
              onClick={switchToUpload}
              disabled={disabled}
              className="text-sm text-primary underline hover:text-primary/80 min-w-[44px] min-h-[44px]"
              aria-label="Upload a file instead"
            >
              Upload a file instead
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {state === 'loading' && (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center"
          aria-busy="true"
        >
          <Loader2
            className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">Camera is loading...</p>
        </div>
      )}

      {/* Live preview */}
      {state === 'preview' && (
        <div className="border rounded-lg overflow-hidden">
          {/* Instructional text */}
          <p className="text-sm text-muted-foreground text-center py-2 bg-muted/50">
            Place your document on a contrasting surface
          </p>

          {/* Video container with edge detection overlay */}
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full object-contain"
              aria-label="Live camera preview for document scanning"
            />

            {/* Document edge detection overlay */}
            {detectedEdges && detectedEdges.corners && (
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
                data-testid="edge-overlay"
              >
                <svg
                  className="w-full h-full"
                  viewBox={`0 0 ${videoRef.current?.videoWidth || 640} ${videoRef.current?.videoHeight || 480}`}
                  preserveAspectRatio="none"
                >
                  <polygon
                    points={detectedEdges.corners
                      .map((c) => `${c.x},${c.y}`)
                      .join(' ')}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {/* Hidden canvas for frame extraction */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/30">
            <button
              type="button"
              onClick={handleCapture}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
              aria-label="Capture document"
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
              Capture
            </button>

            <button
              type="button"
              onClick={handleSwitchCamera}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Switch camera"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={switchToUpload}
              disabled={disabled}
              className="text-sm text-primary underline hover:text-primary/80 min-w-[44px] min-h-[44px]"
              aria-label="Upload a file instead"
            >
              Upload a file instead
            </button>
          </div>
        </div>
      )}

      {/* Captured / Retake flow */}
      {state === 'captured' && capturedImage && (
        <div className="border rounded-lg overflow-hidden">
          {warningMessage && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center" data-testid="capture-warning">
              <p className="text-sm text-yellow-800 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                {warningMessage}
              </p>
            </div>
          )}
          <img
            src={capturedImage}
            alt="Captured document for review"
            className="w-full max-h-80 object-contain bg-muted"
          />
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/30">
            <button
              type="button"
              onClick={handleUseThis}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Use this document"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              Use this
            </button>
            <button
              type="button"
              onClick={handleRetake}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Retake document"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Retake
            </button>
          </div>
        </div>
      )}

      {/* Done state — multi-image complete */}
      {state === 'done' && (
        <div className="border rounded-lg overflow-hidden p-4 text-center">
          <div className="flex gap-2 flex-wrap justify-center mb-4" data-testid="done-thumbnails">
            {captures.map((capture, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={capture.base64}
                  alt={`Captured document ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteCapture(idx)}
                  disabled={disabled}
                  className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Delete document ${idx + 1}`}
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {captures.length} of {cameraConfig.maxImages} captured
          </p>
          <button
            type="button"
            onClick={handleDone}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Done capturing documents"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Done
          </button>
        </div>
      )}

      {/* File upload fallback */}
      {state === 'fallback' && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            hasError
              ? 'border-destructive hover:border-destructive'
              : 'border-border hover:border-primary'
          }`}
        >
          <Upload
            className="w-10 h-10 text-muted-foreground mx-auto mb-3"
            aria-hidden="true"
          />
          {statusMessage && (
            <p className="text-sm text-muted-foreground mb-3">{statusMessage}</p>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-w-[44px] min-h-[44px]">
              <Upload className="w-4 h-4" aria-hidden="true" />
              Choose File
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileUpload}
              disabled={disabled}
              aria-label="Upload a document file"
              className="hidden"
            />
          </label>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setState('idle');
                setStatusMessage('');
              }}
              disabled={disabled}
              className="text-sm text-primary underline hover:text-primary/80 min-w-[44px] min-h-[44px]"
              aria-label="Try camera instead"
            >
              Try camera instead
            </button>
          </div>
        </div>
      )}

      {/* Visible error message */}
      {(errorMessage && state !== 'captured') && (
        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Form validation error */}
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-destructive mt-1 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
