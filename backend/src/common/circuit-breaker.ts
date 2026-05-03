/**
 * Circuit Breaker — Volume 13 Phase 3
 *
 * Protects downstream dependencies (database, Redis, external APIs) from
 * cascading failures at 1,000 TPS. Wraps any async call and automatically
 * trips open after a configurable number of consecutive failures, then
 * probes for recovery after a cool-down window.
 *
 * States:
 *  closed  — normal operation; every call passes through
 *  open    — dependency is unhealthy; calls fail immediately (fast-fail)
 *  half-open — cool-down elapsed; one probe call is allowed through
 *
 * Usage:
 *   const db = new CircuitBreaker({ name: 'postgres', failureThreshold: 5 });
 *   const result = await db.execute(() => repository.find({ ... }));
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Human-readable name for logging / metrics. */
  name: string;
  /** Number of consecutive failures before opening the circuit. Default: 5 */
  failureThreshold?: number;
  /** Milliseconds to wait in open state before attempting recovery. Default: 30_000 */
  cooldownMs?: number;
  /** Optional callback invoked whenever the state changes. */
  onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void;
}

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is open — dependency is currently unavailable.`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private lastOpenedAt: number | null = null;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly onStateChange?: CircuitBreakerOptions['onStateChange'];

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30_000;
    this.onStateChange = options.onStateChange;
  }

  /** Execute a call through the circuit breaker. */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptRecovery()) {
        this.transition('half-open');
      } else {
        throw new CircuitBreakerOpenError(this.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastOpenedAt: this.lastOpenedAt,
      cooldownMs: this.cooldownMs,
      failureThreshold: this.failureThreshold,
    };
  }

  /** Manually reset to closed state (for admin / incident recovery). */
  reset() {
    this.consecutiveFailures = 0;
    this.lastOpenedAt = null;
    this.transition('closed');
  }

  private onSuccess() {
    this.consecutiveFailures = 0;
    if (this.state === 'half-open') {
      this.transition('closed');
    }
  }

  private onFailure() {
    this.consecutiveFailures += 1;
    if (this.state === 'half-open') {
      // Probe failed — re-open and restart cool-down
      this.lastOpenedAt = Date.now();
      this.transition('open');
      return;
    }
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.lastOpenedAt = Date.now();
      this.transition('open');
    }
  }

  private shouldAttemptRecovery(): boolean {
    if (this.lastOpenedAt === null) return false;
    return Date.now() - this.lastOpenedAt >= this.cooldownMs;
  }

  private transition(to: CircuitState) {
    if (this.state === to) return;
    const from = this.state;
    this.state = to;
    this.onStateChange?.(this.name, from, to);
  }
}
