/**
 * ConnectivityMonitor
 *
 * Tracks real network connectivity using:
 * 1. navigator.onLine as initial state
 * 2. window 'online'/'offline' events
 * 3. Periodic fetch probes to /favicon.ico every 30 seconds
 *    (detects captive portals and mobile networks that lie about connectivity)
 */
export class ConnectivityMonitor extends EventTarget {
  private _isOnline: boolean;
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _onlineHandler: () => void;
  private _offlineHandler: () => void;

  constructor() {
    super();
    this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    this._onlineHandler = () => {
      if (!this._isOnline) {
        this._isOnline = true;
        this.dispatchEvent(new CustomEvent('online'));
      }
    };

    this._offlineHandler = () => {
      if (this._isOnline) {
        this._isOnline = false;
        this.dispatchEvent(new CustomEvent('offline'));
      }
    };
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  start(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this._onlineHandler);
    window.addEventListener('offline', this._offlineHandler);

    // Periodic probe every 30 seconds
    this._intervalId = setInterval(() => {
      this._probe();
    }, 30_000);
  }

  stop(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('online', this._onlineHandler);
    window.removeEventListener('offline', this._offlineHandler);

    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  private async _probe(): Promise<void> {
    try {
      await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      // Probe succeeded — we are online
      if (!this._isOnline) {
        this._isOnline = true;
        this.dispatchEvent(new CustomEvent('online'));
      }
    } catch {
      // Probe failed — we are offline
      if (this._isOnline) {
        this._isOnline = false;
        this.dispatchEvent(new CustomEvent('offline'));
      }
    }
  }
}

// Singleton instance
export const connectivityMonitor = new ConnectivityMonitor();
