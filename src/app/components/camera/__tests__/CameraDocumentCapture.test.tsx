/**
 * Unit tests for CameraDocumentCapture component.
 *
 * Mocks getUserMedia, canvas, video, and DocumentScanner module for jsdom environment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CameraDocumentCapture from '../CameraDocumentCapture';
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

vi.mock('../documentScanner', () => ({
  detectDocumentEdges: vi.fn().mockReturnValue({
    corners: [
      { x: 10, y: 10 },
      { x: 630, y: 10 },
      { x: 630, y: 470 },
      { x: 10, y: 470 },
    ],
    confidence: 0.85,
  }),
  applyPerspectiveCorrection: vi.fn().mockImplementation(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    return canvas;
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
import { detectDocumentEdges, applyPerspectiveCorrection } from '../documentScanner';

const mockedValidateImageQuality = vi.mocked(validateImageQuality);
const mockedCompressImage = vi.mocked(compressImage);
const mockedDetectDocumentEdges = vi.mocked(detectDocumentEdges);
const mockedApplyPerspectiveCorrection = vi.mocked(applyPerspectiveCorrection);

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
    createImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(640 * 480 * 4),
      width: 640,
      height: 480,
    }),
    canvas: { width: 640, height: 480 },
  };
}

// ---------------------------------------------------------------------------
// Default props factory
// ---------------------------------------------------------------------------

function createDefaultField(overrides?: Partial<FormField>): FormField {
  return {
    id: 'aadhaar_scan',
    type: 'camera_document',
    label: 'Aadhaar Card Scan',
    required: true,
    helpText: 'Scan the front and back of your Aadhaar card',
    ...overrides,
  };
}

function createDefaultProps(overrides?: Partial<CustomFieldProps>): CustomFieldProps {
  return {
    field: createDefaultField(),
    fieldId: 'aadhaar_scan',
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

  // Mock requestAnimationFrame
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    // Execute callback once for edge detection
    cb(0);
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

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

  mockedDetectDocumentEdges.mockReturnValue({
    corners: [
      { x: 10, y: 10 },
      { x: 630, y: 10 },
      { x: 630, y: 470 },
      { x: 10, y: 470 },
    ],
    confidence: 0.85,
  });

  mockedApplyPerspectiveCorrection.mockImplementation(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    return canvas;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
});


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CameraDocumentCapture', () => {
  describe('Initial state', () => {
    it('renders Start Camera button on mount', () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);
      expect(screen.getByRole('button', { name: /start camera/i })).toBeInTheDocument();
    });

    it('does NOT call getUserMedia on mount (privacy: explicit activation)', () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);
      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });

    it('renders field label and help text', () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);
      expect(screen.getByText('Aadhaar Card Scan')).toBeInTheDocument();
      expect(screen.getByText('Scan the front and back of your Aadhaar card')).toBeInTheDocument();
    });

    it('renders "Upload a file instead" link', () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);
      expect(screen.getByRole('button', { name: /upload a file instead/i })).toBeInTheDocument();
    });
  });

  describe('Camera activation', () => {
    it('calls getUserMedia with facingMode "environment" on Start Camera click', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    });

    it('shows loading state with aria-busy while stream initializes', async () => {
      let resolveStream: (value: unknown) => void;
      mockGetUserMedia.mockReturnValue(
        new Promise((resolve) => {
          resolveStream = resolve;
        }),
      );

      render(<CameraDocumentCapture {...createDefaultProps()} />);

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
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(screen.getByRole('button', { name: /capture document/i })).toBeInTheDocument();
    });
  });

  describe('Live preview', () => {
    it('renders video element with correct aria-label for document scanning', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video?.getAttribute('aria-label')).toBe(
        'Live camera preview for document scanning',
      );
    });

    it('renders instructional text "Place your document on a contrasting surface"', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(
        screen.getByText('Place your document on a contrasting surface'),
      ).toBeInTheDocument();
    });
  });

  describe('Document edge detection overlay', () => {
    it('renders edge detection overlay when edges are detected', async () => {
      // Use a rAF mock that defers execution so we can wrap in act
      let rafCallback: FrameRequestCallback | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      // Trigger the edge detection callback inside act so React processes state updates
      await act(async () => {
        if (rafCallback) rafCallback(0);
      });

      const overlay = document.querySelector('[data-testid="edge-overlay"]');
      expect(overlay).toBeInTheDocument();
    });

    it('calls detectDocumentEdges on live frames', async () => {
      let rafCallback: FrameRequestCallback | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        if (rafCallback) rafCallback(0);
      });

      expect(mockedDetectDocumentEdges).toHaveBeenCalled();
    });

    it('does not render edge overlay when no edges detected', async () => {
      mockedDetectDocumentEdges.mockReturnValue({
        corners: null,
        confidence: 0,
      });

      let rafCallback: FrameRequestCallback | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        if (rafCallback) rafCallback(0);
      });

      const overlay = document.querySelector('[data-testid="edge-overlay"]');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Capture with perspective correction', () => {
    it('applies perspective correction when edges are detected', async () => {
      let rafCallback: FrameRequestCallback | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      // Run edge detection so detectedEdges state is set
      await act(async () => {
        if (rafCallback) rafCallback(0);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      expect(mockedApplyPerspectiveCorrection).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        expect.arrayContaining([
          expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
        ]),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('transitions to retake flow after successful capture', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      expect(screen.getByRole('button', { name: /use this document/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retake document/i })).toBeInTheDocument();
    });

    it('shows captured image with correct alt text', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      const img = screen.getByAltText('Captured document for review');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Full frame fallback (no edges detected)', () => {
    it('captures full frame with warning when no edges detected', async () => {
      mockedDetectDocumentEdges.mockReturnValue({
        corners: null,
        confidence: 0,
      });

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      // Should NOT call applyPerspectiveCorrection
      expect(mockedApplyPerspectiveCorrection).not.toHaveBeenCalled();

      // Should show warning
      const warning = screen.getByTestId('capture-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent(/could not detect document edges/i);
    });

    it('does not show warning when edges are detected', async () => {
      let rafCallback: FrameRequestCallback | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      });

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      // Run edge detection so detectedEdges state is set with corners
      await act(async () => {
        if (rafCallback) rafCallback(0);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      const warning = document.querySelector('[data-testid="capture-warning"]');
      expect(warning).not.toBeInTheDocument();
    });
  });

  describe('Single-image retake flow (maxImages=1)', () => {
    it('"Use this" calls onChange with CaptureResult and stops stream', async () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();

      render(
        <CameraDocumentCapture {...createDefaultProps({ onChange, onBlur })} />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
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
      expect(mockStream.mockTrack.stop).toHaveBeenCalled();
    });

    it('"Retake" discards result and returns to preview', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      expect(screen.getByRole('button', { name: /retake document/i })).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /retake document/i }));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /capture document/i })).toBeInTheDocument();
      });
    });
  });

  describe('Multi-image mode (maxImages > 1)', () => {
    const multiImageConfig = { maxImages: 2 };

    it('adds image to captures array and returns to preview for next capture', async () => {
      render(
        <CameraDocumentCapture
          {...createDefaultProps({ config: multiImageConfig })}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      // Accept first image
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Should return to preview for next capture
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /capture document/i })).toBeInTheDocument();
      });

      // Should show thumbnail strip with count
      expect(screen.getByText('1 of 2 captured')).toBeInTheDocument();
    });

    it('shows thumbnail strip with captured images', async () => {
      render(
        <CameraDocumentCapture
          {...createDefaultProps({ config: multiImageConfig })}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      const thumbnailStrip = screen.getByTestId('thumbnail-strip');
      expect(thumbnailStrip).toBeInTheDocument();
    });

    it('shows Done button when max images reached', async () => {
      render(
        <CameraDocumentCapture
          {...createDefaultProps({ config: multiImageConfig })}
        />,
      );

      // Capture first image
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Capture second image
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Should show Done button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done capturing documents/i })).toBeInTheDocument();
      });
    });

    it('Done button calls onChange with ordered array of CaptureResults', async () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();

      render(
        <CameraDocumentCapture
          {...createDefaultProps({ onChange, onBlur, config: multiImageConfig })}
        />,
      );

      // Capture first image
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Capture second image
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Click Done
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /done capturing documents/i }));
      });

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ base64: 'data:image/jpeg;base64,/9j/mock' }),
          expect.objectContaining({ base64: 'data:image/jpeg;base64,/9j/mock' }),
        ]),
      );
      expect(onBlur).toHaveBeenCalled();
    });

    it('allows deleting a captured image from thumbnail strip', async () => {
      render(
        <CameraDocumentCapture
          {...createDefaultProps({ config: multiImageConfig })}
        />,
      );

      // Capture first image
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Should show 1 of 2 captured
      expect(screen.getByText('1 of 2 captured')).toBeInTheDocument();

      // Delete the captured image
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /delete document 1/i }));
      });

      // Thumbnail strip should be gone (no captures left)
      expect(document.querySelector('[data-testid="thumbnail-strip"]')).not.toBeInTheDocument();
      // Status message should reflect 0 captures
      const politeRegion = screen.getByTestId('status-polite');
      expect(politeRegion).toHaveTextContent('0 of 2 captured');
    });

    it('allows deleting from done state and returns to preview', async () => {
      render(
        <CameraDocumentCapture
          {...createDefaultProps({ config: multiImageConfig })}
        />,
      );

      // Capture both images
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Should be in done state
      expect(screen.getByRole('button', { name: /done capturing documents/i })).toBeInTheDocument();

      // Delete one image
      const deleteButtons = screen.getAllByRole('button', { name: /delete document/i });
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      // Should return to preview for recapture
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /capture document/i })).toBeInTheDocument();
      });
    });

    it('shows count indicator with correct numbers', async () => {
      render(
        <CameraDocumentCapture
          {...createDefaultProps({ config: multiImageConfig })}
        />,
      );

      // Capture first image
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Check count indicator
      expect(screen.getByText('1 of 2 captured')).toBeInTheDocument();
    });
  });

  describe('File upload fallback', () => {
    it('shows file upload fallback on NotAllowedError', async () => {
      const notAllowedError = new DOMException('Permission denied', 'NotAllowedError');
      mockGetUserMedia.mockRejectedValue(notAllowedError);

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await waitFor(() => {
        const matches = screen.getAllByText(/camera access denied/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('file upload fallback accepts .jpg,.jpeg,.png,.pdf (not .webp)', async () => {
      const notAllowedError = new DOMException('Permission denied', 'NotAllowedError');
      mockGetUserMedia.mockRejectedValue(notAllowedError);

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        expect(fileInput?.getAttribute('accept')).toBe('.jpg,.jpeg,.png,.pdf');
      });
    });

    it('shows file upload fallback when getUserMedia is undefined', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await waitFor(() => {
        const matches = screen.getAllByText(/camera not supported/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('"Upload a file instead" link is visible alongside camera preview', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      expect(
        screen.getByRole('button', { name: /upload a file instead/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Stream cleanup', () => {
    it('stops stream on component unmount', async () => {
      const { unmount } = render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      unmount();

      expect(mockStream.mockTrack.stop).toHaveBeenCalled();
    });

    it('stops stream when Done is clicked in multi-image mode', async () => {
      render(
        <CameraDocumentCapture
          {...createDefaultProps({ config: { maxImages: 2 } })}
        />,
      );

      // Capture both images
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /use this document/i }));
      });

      // Stream should already be stopped when max reached
      expect(mockStream.mockTrack.stop).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has aria-live="polite" region for status messages', () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      const politeRegion = screen.getByTestId('status-polite');
      expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-live="assertive" region for error messages', () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      const assertiveRegion = screen.getByTestId('status-assertive');
      expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('announces capture result via aria-live polite region', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      const politeRegion = screen.getByTestId('status-polite');
      expect(politeRegion).toHaveTextContent(/document captured/i);
    });

    it('all buttons have minimum 44x44px touch targets via CSS classes', () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const classes = button.className;
        expect(
          classes.includes('min-w-[44px]') && classes.includes('min-h-[44px]'),
        ).toBe(true);
      });
    });

    it('video element has correct aria-label for document scanning', async () => {
      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      const video = document.querySelector('video');
      expect(video?.getAttribute('aria-label')).toBe(
        'Live camera preview for document scanning',
      );
    });
  });

  describe('Quality rejection', () => {
    it('shows rejection reason and returns to preview when quality fails', async () => {
      mockedValidateImageQuality.mockReturnValue({
        valid: false,
        reason: 'Image is too blurry',
        details: { width: 640, height: 480, blurScore: 50, brightness: 128 },
      });

      render(<CameraDocumentCapture {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /start camera/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /capture document/i }));
      });

      // Should still be in preview state
      expect(screen.getByRole('button', { name: /capture document/i })).toBeInTheDocument();
      const blurryTexts = screen.getAllByText('Image is too blurry');
      expect(blurryTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Disabled state', () => {
    it('disables Start Camera button when disabled prop is true', () => {
      render(<CameraDocumentCapture {...createDefaultProps({ disabled: true })} />);

      const startButton = screen.getByRole('button', { name: /start camera/i });
      expect(startButton).toBeDisabled();
    });
  });

  describe('Form validation error display', () => {
    it('displays form validation error when error prop is set', () => {
      render(
        <CameraDocumentCapture
          {...createDefaultProps({ error: 'This field is required' })}
        />,
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });
});
