/**
 * LivenessDetector — Client-side frame-difference analysis for basic liveness detection.
 *
 * Compares pixel differences between consecutive frames in the central face region
 * to detect blink and head turn actions. All analysis runs on canvas pixel data
 * without transmitting any frames to a server.
 */

import type { LivenessAction, LivenessState } from './types';

/** Timeout duration in milliseconds for liveness detection. */
const LIVENESS_TIMEOUT_MS = 15_000;

/** Threshold for pixel difference to consider significant motion. */
const MOTION_THRESHOLD = 30;

/** Minimum percentage of changed pixels to detect a blink. */
const BLINK_CHANGE_THRESHOLD = 0.05;

/** Minimum horizontal shift ratio to detect a head turn. */
const HEAD_TURN_SHIFT_THRESHOLD = 0.02;

/**
 * Analyze consecutive frames for liveness signals.
 *
 * Compares pixel differences in the face region across frames.
 * For 'blink': detects significant brightness change in the eye region.
 * For 'head_turn': detects horizontal shift in the face region centroid.
 *
 * @param currentFrame - Current video frame as ImageData
 * @param previousFrame - Previous video frame (null on first call)
 * @param action - The liveness action to detect
 * @param elapsedMs - Time elapsed since liveness detection started
 * @returns Updated liveness state
 */
export function analyzeLivenessFrame(
  currentFrame: ImageData,
  previousFrame: ImageData | null,
  action: LivenessAction,
  elapsedMs: number,
): LivenessState {
  const timeRemaining = Math.max(0, Math.ceil((LIVENESS_TIMEOUT_MS - elapsedMs) / 1000));

  // Timeout
  if (elapsedMs >= LIVENESS_TIMEOUT_MS) {
    return {
      passed: false,
      instruction: 'Liveness check timed out. Please try again.',
      timeRemaining: 0,
    };
  }

  // No previous frame to compare — return instruction
  if (!previousFrame) {
    return {
      passed: false,
      instruction: getInstruction(action),
      timeRemaining,
    };
  }

  // Ensure frames have the same dimensions
  if (
    currentFrame.width !== previousFrame.width ||
    currentFrame.height !== previousFrame.height
  ) {
    return {
      passed: false,
      instruction: getInstruction(action),
      timeRemaining,
    };
  }

  const { width, height } = currentFrame;

  if (action === 'blink') {
    const detected = detectBlink(currentFrame, previousFrame, width, height);
    if (detected) {
      return {
        passed: true,
        instruction: 'Blink detected! You may now capture.',
        timeRemaining,
      };
    }
    return {
      passed: false,
      instruction: 'Please blink',
      timeRemaining,
    };
  }

  if (action === 'head_turn') {
    const detected = detectHeadTurn(currentFrame, previousFrame, width, height);
    if (detected) {
      return {
        passed: true,
        instruction: 'Head turn detected! You may now capture.',
        timeRemaining,
      };
    }
    return {
      passed: false,
      instruction: 'Turn your head slightly to the left',
      timeRemaining,
    };
  }

  return {
    passed: false,
    instruction: getInstruction(action),
    timeRemaining,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Get the instruction text for a given liveness action. */
function getInstruction(action: LivenessAction): string {
  switch (action) {
    case 'blink':
      return 'Please blink';
    case 'head_turn':
      return 'Turn your head slightly to the left';
    default:
      return 'Please follow the on-screen instruction';
  }
}

/**
 * Detect a blink by analyzing brightness changes in the eye region.
 *
 * The eye region is approximated as the middle 40% width and
 * 20-40% height of the frame (upper-middle area where eyes typically are).
 */
function detectBlink(
  current: ImageData,
  previous: ImageData,
  width: number,
  height: number,
): boolean {
  // Define eye region: middle 40% width, 20-40% height
  const x0 = Math.floor(width * 0.3);
  const x1 = Math.floor(width * 0.7);
  const y0 = Math.floor(height * 0.2);
  const y1 = Math.floor(height * 0.4);

  let changedPixels = 0;
  let totalPixels = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const idx = (y * width + x) * 4;

      const currBrightness =
        0.299 * current.data[idx] +
        0.587 * current.data[idx + 1] +
        0.114 * current.data[idx + 2];
      const prevBrightness =
        0.299 * previous.data[idx] +
        0.587 * previous.data[idx + 1] +
        0.114 * previous.data[idx + 2];

      if (Math.abs(currBrightness - prevBrightness) > MOTION_THRESHOLD) {
        changedPixels++;
      }
      totalPixels++;
    }
  }

  if (totalPixels === 0) return false;

  return changedPixels / totalPixels >= BLINK_CHANGE_THRESHOLD;
}

/**
 * Detect a head turn by analyzing horizontal shift in the face region centroid.
 *
 * The face region is the central 40% of the frame.
 */
function detectHeadTurn(
  current: ImageData,
  previous: ImageData,
  width: number,
  height: number,
): boolean {
  // Define face region: central 40%
  const x0 = Math.floor(width * 0.3);
  const x1 = Math.floor(width * 0.7);
  const y0 = Math.floor(height * 0.3);
  const y1 = Math.floor(height * 0.7);

  // Compute brightness-weighted centroid for current and previous frames
  const currentCentroid = computeCentroid(current, x0, x1, y0, y1, width);
  const previousCentroid = computeCentroid(previous, x0, x1, y0, y1, width);

  if (currentCentroid === null || previousCentroid === null) return false;

  // Check horizontal shift relative to frame width
  const horizontalShift = Math.abs(currentCentroid.x - previousCentroid.x) / width;

  return horizontalShift >= HEAD_TURN_SHIFT_THRESHOLD;
}

/** Compute the brightness-weighted centroid of a region. */
function computeCentroid(
  frame: ImageData,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  width: number,
): { x: number; y: number } | null {
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const idx = (y * width + x) * 4;
      const brightness =
        0.299 * frame.data[idx] +
        0.587 * frame.data[idx + 1] +
        0.114 * frame.data[idx + 2];

      totalWeight += brightness;
      weightedX += x * brightness;
      weightedY += y * brightness;
    }
  }

  if (totalWeight === 0) return null;

  return {
    x: weightedX / totalWeight,
    y: weightedY / totalWeight,
  };
}
