/**
 * CameraPhotoCapture — Premium platform component for passport-style photo capture.
 *
 * Registered as field type "camera_photo" under __platform__ scope.
 *
 * Features:
 * - Live camera preview with face guide overlay (3:4 oval)
 * - Optional liveness detection
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
import type { CaptureResult, CameraConfig, LivenessState } from './types';
import { DEFAULT_PHOTO_CONFIG, mergeCameraConfig } from './types';
import { validateImageQuality } from './imageQualityValidator';
import { compressImage } from './imageCompressor';
import { analyzeLivenessFrame } from './livenessDetector';
import {
  Camera,
  Upload,
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from '../../utils/toast';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type ComponentState =
  | 'idle'
  | 'loading'
  | 'preview'
  | 'liveness'
  | 'captured'
  | 'fallback';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CameraPhotoCapture({
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
    DEFAULT_PHOTO_CONFIG,
    config as Partial<CameraConfig>,
  );

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const livenessIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const livenessStartRef = useRef<number>(0);

  // State
  const [state, setState] = useState<ComponentState>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedResult, setCapturedResult] = useState<CaptureResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [livenessState, setLivenessState] = useState<LivenessState | null>(null);
  const [livenessPassed, setLivenessPassed] = useState(false);

  // Check if there's already a value
  const hasValue = value && typeof value === 'object' && (value as CaptureResult).base64;

  // ---------------------------------------------------------------------------
  // Stream management
  // ---------------------------------------------------------------------------

  const stopStream = useCallback(() => {
    if (livenessIntervalRef.current) {
      clearInterval(livenessIntervalRef.current);
      livenessIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    previousFrameRef.current = null;
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

        if (cameraConfig.livenessDetection) {
          setState('liveness');
          setLivenessPassed(false);
          startLivenessDetection();
        } else {
          setState('preview');
        }

        setStatusMessage('');
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
    [cameraConfig.livenessDetection],
  );

  // ---------------------------------------------------------------------------
  // Liveness detection
  // ---------------------------------------------------------------------------

  const startLivenessDetection = useCallback(() => {
    livenessStartRef.current = Date.now();
    previousFrameRef.current = null;
    setLivenessPassed(false);

    const action = 'blink' as const;

    livenessIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - livenessStartRef.current;

      const result = analyzeLivenessFrame(
        currentFrame,
        previousFrameRef.current,
        action,
        elapsed,
      );

      previousFrameRef.current = currentFrame;
      setLivenessState(result);

      if (result.passed) {
        setLivenessPassed(true);
        setState('preview');
        if (livenessIntervalRef.current) {
          clearInterval(livenessIntervalRef.current);
          livenessIntervalRef.current = null;
        }
      }

      if (result.timeRemaining === 0 && !result.passed) {
        if (livenessIntervalRef.current) {
          clearInterval(livenessIntervalRef.current);
          livenessIntervalRef.current = null;
        }
      }
    }, 200);
  }, []);

  const retryLiveness = useCallback(() => {
    startLivenessDetection();
  }, [startLivenessDetection]);

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

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

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

    setCapturedImage(compressed.base64);
    setCapturedResult(result);
    setState('captured');
    setErrorMessage('');
    setStatusMessage('Photo captured. Review your image or retake.');
  }, [cameraConfig]);

  // ---------------------------------------------------------------------------
  // Retake flow
  // ---------------------------------------------------------------------------

  const handleUseThis = useCallback(() => {
    if (capturedResult) {
      onChange(capturedResult);
      onBlur();
    }
    stopStream();
    setState('idle');
    setCapturedImage(null);
    setCapturedResult(null);
    setStatusMessage('Photo accepted.');
  }, [capturedResult, onChange, onBlur, stopStream]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setCapturedResult(null);
    setErrorMessage('');
    setStatusMessage('');

    if (cameraConfig.livenessDetection && !livenessPassed) {
      setState('liveness');
      startLivenessDetection();
    } else {
      setState('preview');
    }

    // Re-attach stream to video if still active
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    } else {
      startStream(facingMode);
    }
  }, [cameraConfig.livenessDetection, livenessPassed, startLivenessDetection, startStream, facingMode]);

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

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        // Create an image to get dimensions and validate
        const img = new Image();
        img.onload = () => {
          // Create canvas for quality validation
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Validate quality (skip for non-image files)
          if (file.type !== 'application/pdf') {
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
          }

          // Compress
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

          onChange(result);
          onBlur();
          setStatusMessage('Photo uploaded successfully.');
          setErrorMessage('');
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    },
    [cameraConfig, onChange, onBlur],
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
    setStatusMessage('');
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
    const currentValue = value as CaptureResult;
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
          <img
            src={currentValue.base64}
            alt="Captured photo for review"
            className="w-full max-h-64 object-contain bg-muted"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Remove captured photo"
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

      {/* Live preview / Liveness state */}
      {(state === 'preview' || state === 'liveness') && (
        <div className="border rounded-lg overflow-hidden">
          {/* Instructional text */}
          <p className="text-sm text-muted-foreground text-center py-2 bg-muted/50">
            Position your face within the oval
          </p>

          {/* Video container with face guide overlay */}
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full object-contain"
              aria-label="Live camera preview for passport photo capture"
            />

            {/* Face guide overlay — 3:4 oval */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <mask id={`face-mask-${fieldId}`}>
                    <rect width="100" height="100" fill="white" />
                    <ellipse cx="50" cy="45" rx="18" ry="24" fill="black" />
                  </mask>
                </defs>
                <rect
                  width="100"
                  height="100"
                  fill="rgba(0,0,0,0.5)"
                  mask={`url(#face-mask-${fieldId})`}
                />
                <ellipse
                  cx="50"
                  cy="45"
                  rx="18"
                  ry="24"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                  strokeDasharray="2,1"
                />
              </svg>
            </div>

            {/* Hidden canvas for frame extraction */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Liveness instruction */}
          {state === 'liveness' && livenessState && (
            <div className="text-center py-2 bg-muted/50" aria-live="polite">
              <p className="text-sm font-medium">{livenessState.instruction}</p>
              {livenessState.timeRemaining > 0 && !livenessState.passed && (
                <p className="text-xs text-muted-foreground">
                  Time remaining: {livenessState.timeRemaining}s
                </p>
              )}
              {livenessState.timeRemaining === 0 && !livenessState.passed && (
                <button
                  type="button"
                  onClick={retryLiveness}
                  className="mt-1 text-sm text-primary underline min-w-[44px] min-h-[44px]"
                  aria-label="Retry liveness check"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/30">
            <button
              type="button"
              onClick={handleCapture}
              disabled={
                disabled ||
                (state === 'liveness' && !livenessPassed)
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
              aria-label="Capture photo"
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
          <img
            src={capturedImage}
            alt="Captured photo for review"
            className="w-full max-h-80 object-contain bg-muted"
          />
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/30">
            <button
              type="button"
              onClick={handleUseThis}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Use this photo"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              Use this
            </button>
            <button
              type="button"
              onClick={handleRetake}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Retake photo"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Retake
            </button>
          </div>
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
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={disabled}
              aria-label="Upload a photo file"
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
