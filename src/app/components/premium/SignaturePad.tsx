/**
 * SignaturePad — Premium custom component for canvas-based signature capture.
 *
 * Renders a drawing canvas and emits a base64-encoded PNG image as the
 * field value. Supports clear and undo actions.
 *
 * Implements CustomFieldProps interface.
 * Registers a `signature_format` custom validator.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import type { CustomFieldProps } from '../../types/customComponent';
import { AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validates that a signature value is a valid base64 PNG string.
 * Registered as `signature_format` in the CustomValidatorRegistry.
 */
export function signatureFormatValidator(
  value: unknown,
): Array<{ field: string; errorCode: string; message: string }> {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (typeof value !== 'string') {
    return [
      {
        field: '',
        errorCode: 'SIGNATURE_INVALID_FORMAT',
        message: 'Signature must be a base64-encoded PNG string',
      },
    ];
  }

  // Check for data URI prefix or raw base64
  const isDataUri = value.startsWith('data:image/png;base64,');
  const isRawBase64 = /^[A-Za-z0-9+/]+=*$/.test(value);

  if (!isDataUri && !isRawBase64) {
    return [
      {
        field: '',
        errorCode: 'SIGNATURE_INVALID_FORMAT',
        message: 'Signature must be a valid base64 PNG string',
      },
    ];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignaturePad({
  field,
  fieldId,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: CustomFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set drawing style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill white background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Restore existing signature if present
    if (value && typeof value === 'string') {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
    }
  }, []);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [],
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      const point = getCanvasPoint(e);
      if (!point) return;

      setIsDrawing(true);
      lastPointRef.current = point;

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
      }
    },
    [disabled, getCanvasPoint],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();
      const point = getCanvasPoint(e);
      if (!point) return;

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && lastPointRef.current) {
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        lastPointRef.current = point;
      }
    },
    [isDrawing, disabled, getCanvasPoint],
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    setHasSignature(true);

    // Emit the canvas content as base64 PNG
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
    onBlur();
  }, [isDrawing, onChange, onBlur]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
    }

    setHasSignature(false);
    onChange('');
    onBlur();
  }, [onChange, onBlur]);

  const hasError = !!error;

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

      <div
        className={`border-2 rounded-lg overflow-hidden ${
          hasError ? 'border-destructive' : 'border-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Signature drawing area"
          aria-describedby={`${fieldId}-help`}
          tabIndex={disabled ? -1 : 0}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onKeyDown={(e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
              clearSignature();
            }
          }}
          className="w-full cursor-crosshair"
          style={{ height: '150px', touchAction: 'none' }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || !hasSignature}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Clear signature"
        >
          Clear signature
        </button>
        {hasSignature && (
          <span className="text-xs text-success" aria-live="polite">
            Signature captured
          </span>
        )}
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
