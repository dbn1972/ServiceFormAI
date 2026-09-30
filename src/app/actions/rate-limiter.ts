/**
 * Rate Limiter — enforces a maximum of 10 action executions per second
 * per field using a sliding window algorithm.
 *
 * IMPORTANT: This client-side rate limiter is a UX optimization only,
 * not a security boundary. It prevents the UI from flooding the sandbox
 * worker with rapid-fire events (e.g., fast typing). The real security
 * protection against abuse is the backend's global throttler
 * (100 req/min per IP via @nestjs/throttler), which cannot be bypassed
 * by client-side manipulation.
 *
 * Maintains a Map of timestamps per field ID. On each allow() call,
 * prunes timestamps older than 1 second, then checks if the count
 * is below the limit.
 */

/** Maximum invocations allowed per field within the sliding window. */
const MAX_INVOCATIONS = 10;

/** Sliding window duration in milliseconds. */
const WINDOW_MS = 1000;

export class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  /**
   * Check if an invocation is allowed for the given field.
   *
   * @param fieldId - The field identifier to rate-check.
   * @returns `true` if the invocation is allowed, `false` if rate-limited.
   */
  allow(fieldId: string): boolean {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;

    let entries = this.timestamps.get(fieldId);

    if (!entries) {
      entries = [];
      this.timestamps.set(fieldId, entries);
    }

    // Prune timestamps older than the sliding window
    // Find the first index that is within the window
    let pruneIndex = 0;
    while (pruneIndex < entries.length && entries[pruneIndex] <= cutoff) {
      pruneIndex++;
    }
    if (pruneIndex > 0) {
      entries.splice(0, pruneIndex);
    }

    // Check if under the limit
    if (entries.length >= MAX_INVOCATIONS) {
      return false;
    }

    // Record this invocation
    entries.push(now);
    return true;
  }

  /**
   * Reset all rate limiting state.
   * Useful for testing or when the engine is destroyed.
   */
  reset(): void {
    this.timestamps.clear();
  }
}
