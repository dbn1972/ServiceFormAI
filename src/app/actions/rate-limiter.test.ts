import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first invocation for a field', () => {
    expect(limiter.allow('field-1')).toBe(true);
  });

  it('allows up to 10 invocations within 1 second', () => {
    for (let i = 0; i < 10; i++) {
      expect(limiter.allow('field-1')).toBe(true);
    }
  });

  it('rejects the 11th invocation within 1 second', () => {
    for (let i = 0; i < 10; i++) {
      limiter.allow('field-1');
    }
    expect(limiter.allow('field-1')).toBe(false);
  });

  it('tracks fields independently', () => {
    for (let i = 0; i < 10; i++) {
      limiter.allow('field-1');
    }
    // field-1 is rate-limited
    expect(limiter.allow('field-1')).toBe(false);
    // field-2 should still be allowed
    expect(limiter.allow('field-2')).toBe(true);
  });

  it('allows invocations again after the window expires', () => {
    for (let i = 0; i < 10; i++) {
      limiter.allow('field-1');
    }
    expect(limiter.allow('field-1')).toBe(false);

    // Advance time past the 1-second window
    vi.advanceTimersByTime(1001);

    expect(limiter.allow('field-1')).toBe(true);
  });

  it('uses a sliding window — old entries are pruned', () => {
    // Use 5 invocations at t=0
    for (let i = 0; i < 5; i++) {
      limiter.allow('field-1');
    }

    // Advance 600ms and use 5 more
    vi.advanceTimersByTime(600);
    for (let i = 0; i < 5; i++) {
      limiter.allow('field-1');
    }

    // At t=600ms, we have 10 invocations (5 from t=0, 5 from t=600)
    expect(limiter.allow('field-1')).toBe(false);

    // Advance to t=1001ms — the first 5 (from t=0) should be pruned
    vi.advanceTimersByTime(401);

    // Now only 5 invocations remain in the window (from t=600)
    expect(limiter.allow('field-1')).toBe(true);
  });

  it('reset clears all state', () => {
    for (let i = 0; i < 10; i++) {
      limiter.allow('field-1');
    }
    expect(limiter.allow('field-1')).toBe(false);

    limiter.reset();

    expect(limiter.allow('field-1')).toBe(true);
  });

  it('handles rapid bursts correctly', () => {
    // 10 invocations at exactly the same timestamp
    for (let i = 0; i < 10; i++) {
      expect(limiter.allow('burst-field')).toBe(true);
    }
    // 11th should be rejected
    expect(limiter.allow('burst-field')).toBe(false);
    expect(limiter.allow('burst-field')).toBe(false);
  });
});
