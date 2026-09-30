/**
 * Unit tests for CameraPhotoCapture component.
 *
 * Mocks getUserMedia, canvas, and video elements for jsdom environment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CameraPhotoCapture from '../CameraPhotoCapture';
import type { CustomFieldProps } from '../../../types/customComponent';
import type { FormField } from '@serviceformai/form-engine-core';

// ---------------------------------------------------------------------------
// Mock modules
// ---------------------------------------------------------------------------

vi.mock('../imageQualityValidator', () => ({
  validateImageQuality: vi.fn().mockReturnValue({
    valid: true,
    details: { width: 640, height: 480, blurScore: 200, brightness: 128 },
  }),
}));

vi.mock('../imageCompressor', () => ({
  compressImage: vi.fn().mockReturnValue({
    base64: 'data:image/jpeg;base64,/9j/mock',
    width: 640,
    height: 480,
    sizeBytes: 50000,
    jpegQuality: 0.8,
  }),
}));

vi.mock('../livenessDetector', () => ({
  analyzeLivenessFrame: vi.fn().mockReturnValue({
    passed: false,
    instruction: 'Please blink',
    timeRemaining: 15,
  }),
}));

vi.mock('../../../utils/toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Import mocked modules for manipulation
import { validateImageQuality } from '../imageQualityValidator';
import { compressImage } from '../imageCompressor';
import { analyzeLivenessFrame } from '../livenessDetector';

const mockedValidateImageQuality = vi.mocked(validateImageQuality);
const mockedCompressImage = vi.mocked(compressImage);
const mockedAnalyzeLivenessFrame = vi.mocked(analyzeLivenessFrame);

// ---------------------------------------------------------------------------
// Mock MediaStream and getUserMedia
// ---------------------------------------------------------------------------

function createMockMediaStream() {
  const mockTrack = {
    stop: vi.fn(),
    kind: 'video',
    enabled: true,
    id: 'mock-track-id',
    label: 'Mock Camera',
    readyState: 'live' as MediaStreamTrackState,
    muted: false,
    onended: null,
    onmute: null,
    onunmute: null,
    contentHint: '',
    getConstraints: vi.fn().mockReturnValue({}),
    getSettings: vi.fn().mockReturnValue({}),
    getCapabilities: vi.fn().mockReturnValue({}),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
    clone: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
  };

  const stream = {
    getTracks: vi.fn().mockReturnValue([mockTrack]),
    getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
    getAudioTracks: vi.fn().mockReturnValue([]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    id: 'mock-stream-id',
    active: true,
    onaddtrack: null,
    onremovetrack: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
  };

  return { stream, mockTrack };
}

// ---------------------------------------------------------------------------
// Mock canvas context
// ---------------------------------------------------------------------------

function createMockCanvasContext() {
  return {
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(640 * 480 * 4).fill(128),
      width: 640,
      height: 480,
      colorSpace: 'srgb',
    }),
    putImageData: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    canvas: { width: 640, height: 480 },
  };
}

// ---------------------------------------------------------------------------
// Default props factory
// ---------------------------------------------------------------------------

function createDefaultField(overrides?: Partial<FormField>): FormField {
  return {
    id: 'passport_photo',
    type: 'camera_photo',
    label: 'Passport Photo',
    required: true,
    helpText: 'Take a clear photo of your face',
    ...overrides,
  };
}

function createDefaultProps(overrides?: Partial<CustomFieldProps>): CustomFieldProps {
  return {
    field: createDefaultField(),
    fieldId: 'passport_photo',
    value: undefined,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    error: undefined,
    disabled: false,
    config: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

let mockGetUserMedia: ReturnType<typeof vi.fn>;
let mockStream: ReturnType<typeof createMockMediaStream>;
let mockCtx: ReturnType<typeof createMockCanvasContext>;

beforeEach(() => {
  mockStream = createMockMediaStream();
  mockCtx = createMockCanvasContext();
  mockGetUserMedia = vi.fn().mockResolvedValue(mockStream.stream);

  // Setup navigator.mediaDevices.getUserMedia
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue([]),
    },
    writable: true,
    configurable: true,
  });

  // Mock HTMLCanvasElement.getContext
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D,
  );

  // Mock HTMLVideoElement properties
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
    get: () => 640,
    configurable: true,
  });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
    get: () => 480,
    configurable: true,
  });

  // Reset mocked module return values
  mockedValidateImageQuality.mockReturnValue({
    valid: true,
    details: { width: 640, height: 480, blurScore: 200, brightness: 128 },
  });

  mockedCompressImage.mockReturnValue({
    base64: 'data:image/jpeg;base64,/9j/mock',
    width: 640,
    height: 480,
    sizeBytes: 50000,
    jpegQuality: 0.8,
  });

  mockedAnalyzeLivenessFrame.mockReturnValue({
    passed: false,
    instruction: 'Please blink',
    timeRemaining: 15,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CameraPhotoCapture', () => {
  describe('Initial state', () => {
    it('renders Start Camera button on mount', () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);
      expect(screen.getByRole('button', { name: /start camera/i })).toBeInTheDocument();
    });

    it('does NOT call getUserMedia on mount (privacy: explicit activation)', () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);
      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });

    it('renders field label and help text', () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);
      expect(screen.getByText('Passport Photo')).toBeInTheDocument();
      expect(screen.getByText('Take a clear photo of your face')).toBeInTheDocument();
    });

    it('renders "Upload a file instead" link', () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);
      expect(screen.getByRole('button', { name: /upload a file instead/i })).toBeInTheDocument();
    });

    it('renders required indicator when field is required', () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);
      expect(screen.getByLabelText('required')).toBeInTheDocument();
    });
  });

  describe('Camera activation', () => {
    it('calls getUserMedia with facingMode "user" on Start Camera click', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    });

    it('shows loading state with aria-busy while stream initializes', async () => {
      // Make getUserMedia hang to observe loading state
      let resolveStream: (value: unknown) => void;
      mockGetUserMedia.mockReturnValue(
        new Promise((resolve) => {
          resolveStream = resolve;
        }),
      );

      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      const loadingContainer = document.querySelector('[aria-busy="true"]');
      expect(loadingContainer).toBeInTheDocument();

      // Resolve to clean up
      await act(async () => {
        resolveStream!(mockStream.stream);
      });
    });

    it('transitions to preview state after successful stream', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(screen.getByRole('button', { name: /capture photo/i })).toBeInTheDocument();
    });
  });

  describe('Live preview', () => {
    it('renders video element with correct aria-label', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video?.getAttribute('aria-label')).toBe(
        'Live camera preview for passport photo capture',
      );
    });

    it('renders video with autoPlay and playsInline attributes', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      const video = document.querySelector('video') as HTMLVideoElement;
      expect(video).toHaveAttribute('autoplay');
      // React sets muted as a DOM property, not an HTML attribute
      expect(video.muted).toBe(true);
    });
  });

  describe('Face guide overlay', () => {
    it('renders instructional text "Position your face within the oval"', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(screen.getByText('Position your face within the oval')).toBeInTheDocument();
    });

    it('renders SVG face guide overlay with ellipse', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const ellipses = document.querySelectorAll('ellipse');
      expect(ellipses.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Capture', () => {
    it('extracts frame and runs quality validation on capture click', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture photo/i }));
      });

      expect(mockCtx.drawImage).toHaveBeenCalled();
      expect(mockCtx.getImageData).toHaveBeenCalled();
      expect(mockedValidateImageQuality).toHaveBeenCalled();
    });

    it('transitions to retake flow when quality validation passes', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture photo/i }));
      });

      expect(screen.getByRole('button', { name: /use this photo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retake photo/i })).toBeInTheDocument();
    });

    it('shows captured image with correct alt text in retake flow', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture photo/i }));
      });

      const img = screen.getByAltText('Captured photo for review');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Quality rejection', () => {
    it('shows rejection reason and returns to preview when quality fails', async () => {
      mockedValidateImageQuality.mockReturnValue({
        valid: false,
        reason: 'Image is too blurry',
        details: { width: 640, height: 480, blurScore: 50, brightness: 128 },
      });

      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture photo/i }));
      });

      // Should still be in preview state (not captured)
      expect(screen.getByRole('button', { name: /capture photo/i })).toBeInTheDocument();
      // Error message should be visible (appears in both aria-live and visible text)
      const blurryTexts = screen.getAllByText('Image is too blurry');
      expect(blurryTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('announces rejection via aria-live="assertive"', async () => {
      mockedValidateImageQuality.mockReturnValue({
        valid: false,
        reason: 'Image is too dark',
        details: { width: 640, height: 480, blurScore: 200, brightness: 20 },
      });

      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture photo/i }));
      });

      const assertiveRegion = screen.getByTestId('status-assertive');
      expect(assertiveRegion).toHaveTextContent('Image is too dark');
    });
  });

  describe('Retake flow', () => {
    it('"Use this" calls onChange with CaptureResult and stops stream', async () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();

      render(
        <CameraPhotoCapture {...createDefaultProps({ onChange, onBlur })} />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture photo/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this photo/i }));
      });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          base64: 'data:image/jpeg;base64,/9j/mock',
          width: 640,
          height: 480,
          sizeBytes: 50000,
          mimeType: 'image/jpeg',
          jpegQuality: 0.8,
        }),
      );
      expect(onBlur).toHaveBeenCalled();
      // Stream tracks should be stopped
      expect(mockStream.mockTrack.stop).toHaveBeenCalled();
    });

    it('"Retake" discards result and restarts stream', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture photo/i }));
      });

      // Should be in captured state
      expect(screen.getByRole('button', { name: /retake photo/i })).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /retake photo/i }));
      });

      // Should return to preview with capture button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /capture photo/i })).toBeInTheDocument();
      });
    });
  });

  describe('File upload fallback', () => {
    it('shows file upload fallback on NotAllowedError', async () => {
      const notAllowedError = new DOMException('Permission denied', 'NotAllowedError');
      mockGetUserMedia.mockRejectedValue(notAllowedError);

      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await waitFor(() => {
        const matches = screen.getAllByText(/camera access denied/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });

      // File input should be available
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('shows file upload fallback on NotFoundError', async () => {
      const notFoundError = new DOMException('No camera', 'NotFoundError');
      mockGetUserMedia.mockRejectedValue(notFoundError);

      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await waitFor(() => {
        const matches = screen.getAllByText(/no camera found/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows file upload fallback when getUserMedia is undefined', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await waitFor(() => {
        const matches = screen.getAllByText(/camera not supported/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('"Upload a file instead" link is visible alongside camera preview', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(
        screen.getByRole('button', { name: /upload a file instead/i }),
      ).toBeInTheDocument();
    });

    it('file upload fallback accepts .jpg,.jpeg,.png,.webp', async () => {
      const notAllowedError = new DOMException('Permission denied', 'NotAllowedError');
      mockGetUserMedia.mockRejectedValue(notAllowedError);

      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        expect(fileInput?.getAttribute('accept')).toBe('.jpg,.jpeg,.png,.webp');
      });
    });
  });

  describe('Stream cleanup', () => {
    it('stops stream on component unmount', async () => {
      const { unmount } = render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      unmount();

      expect(mockStream.mockTrack.stop).toHaveBeenCalled();
    });
  });

  describe('Liveness detection', () => {
    it('activates liveness detection when config.livenessDetection is true', async () => {
      vi.useFakeTimers();

      render(
        <CameraPhotoCapture
          {...createDefaultProps({
            config: { livenessDetection: true },
          })}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      // Advance timer to trigger liveness interval
      await act(async () => {
        vi.advanceTimersByTime(250);
      });

      expect(mockedAnalyzeLivenessFrame).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('disables capture button during liveness check', async () => {
      vi.useFakeTimers();

      render(
        <CameraPhotoCapture
          {...createDefaultProps({
            config: { livenessDetection: true },
          })}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      const captureButton = screen.getByRole('button', { name: /capture photo/i });
      expect(captureButton).toBeDisabled();

      vi.useRealTimers();
    });
  });

  describe('Camera switch', () => {
    it('renders switch camera button in preview state', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(screen.getByRole('button', { name: /switch camera/i })).toBeInTheDocument();
    });

    it('toggles facingMode when switch camera is clicked', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      // First call should be with 'user'
      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: 'user' }),
        }),
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /switch camera/i }));
      });

      // Second call should be with 'environment'
      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: 'environment' }),
        }),
      );
    });
  });

  describe('Accessibility', () => {
    it('has aria-live="polite" region for status messages', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      const politeRegion = screen.getByTestId('status-polite');
      expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-live="assertive" region for error messages', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      const assertiveRegion = screen.getByTestId('status-assertive');
      expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('announces capture result via aria-live polite region', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture photo/i }));
      });

      const politeRegion = screen.getByTestId('status-polite');
      expect(politeRegion).toHaveTextContent(/photo captured/i);
    });

    it('all buttons have minimum 44x44px touch targets via CSS classes', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const classes = button.className;
        expect(
          classes.includes('min-w-[44px]') && classes.includes('min-h-[44px]'),
        ).toBe(true);
      });
    });

    it('video element has aria-label', async () => {
      render(<CameraPhotoCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      const video = document.querySelector('video');
      expect(video?.getAttribute('aria-label')).toBe(
        'Live camera preview for passport photo capture',
      );
    });
  });

  describe('Disabled state', () => {
    it('disables Start Camera button when disabled prop is true', () => {
      render(<CameraPhotoCapture {...createDefaultProps({ disabled: true })} />);

      const startButton = screen.getByRole('button', { name: /start camera/i });
      expect(startButton).toBeDisabled();
    });
  });

  describe('Existing value display', () => {
    it('shows existing captured image when value is present', () => {
      const existingValue = {
        base64: 'data:image/jpeg;base64,/9j/existing',
        width: 640,
        height: 480,
        sizeBytes: 50000,
        mimeType: 'image/jpeg' as const,
        capturedAt: '2024-01-15T10:30:00.000Z',
        jpegQuality: 0.8,
      };

      render(
        <CameraPhotoCapture {...createDefaultProps({ value: existingValue })} />,
      );

      const img = screen.getByAltText('Captured photo for review');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', existingValue.base64);
    });

    it('shows remove button for existing value', () => {
      const existingValue = {
        base64: 'data:image/jpeg;base64,/9j/existing',
        width: 640,
        height: 480,
        sizeBytes: 50000,
        mimeType: 'image/jpeg' as const,
        capturedAt: '2024-01-15T10:30:00.000Z',
        jpegQuality: 0.8,
      };

      render(
        <CameraPhotoCapture {...createDefaultProps({ value: existingValue })} />,
      );

      expect(
        screen.getByRole('button', { name: /remove captured photo/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Form validation error display', () => {
    it('displays form validation error when error prop is set', () => {
      render(
        <CameraPhotoCapture
          {...createDefaultProps({ error: 'This field is required' })}
        />,
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });
});
