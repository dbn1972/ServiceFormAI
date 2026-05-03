/**
 * Performance optimization utilities
 * Code splitting, lazy loading, and bundle optimization helpers
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Lazy load component with retry logic
 * Handles network failures gracefully
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
): LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (retriesLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }

            console.warn(
              `Failed to load component, retrying... (${retriesLeft} attempts left)`,
              error
            );

            // Retry after delay
            setTimeout(() => {
              attemptImport(retriesLeft - 1);
            }, 1000);
          });
      };

      attemptImport(retries);
    });
  });
}

/**
 * Preload a lazy component
 * Useful for preloading routes user is likely to visit
 */
export function preloadComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
) {
  // Force the lazy component to load
  const LazyComponent = lazyComponent as any;
  if (LazyComponent._payload && LazyComponent._payload._status === 'pending') {
    return;
  }

  // Trigger preload
  return (lazyComponent as any)._init?.((lazyComponent as any)._payload);
}

/**
 * Image lazy loading with IntersectionObserver
 * Use this for images below the fold
 */
export function useLazyImage(src: string, placeholder?: string) {
  const observerRef = (node: HTMLImageElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.src = src;
            observer.unobserve(node);
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (placeholder) {
      node.src = placeholder;
    }

    observer.observe(node);

    return () => observer.disconnect();
  };

  return observerRef;
}

/**
 * Debounce function
 * Delays execution until after wait milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * Limits execution to once per wait milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Request idle callback wrapper
 * Schedule non-critical work during idle time
 */
export function scheduleIdleTask(callback: () => void, options?: IdleRequestOptions) {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  }

  // Fallback for browsers without requestIdleCallback
  return setTimeout(callback, 1);
}

/**
 * Cancel idle callback
 */
export function cancelIdleTask(id: number) {
  if ('cancelIdleCallback' in window) {
    return cancelIdleCallback(id);
  }

  return clearTimeout(id);
}

/**
 * Measure component render time
 * Useful for performance profiling
 */
export function measureRender(componentName: string) {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;

    if (duration > 16) {
      // > 16ms = might drop frames
      console.warn(`${componentName} render took ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Check if device prefers reduced motion
 * Respect user accessibility preferences
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get network connection quality
 * Useful for adaptive loading strategies
 */
export function getConnectionQuality(): 'slow' | 'fast' | 'unknown' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  const connection = (navigator as any).connection;

  if (!connection) return 'unknown';

  // Effective type: 'slow-2g', '2g', '3g', '4g'
  const effectiveType = connection.effectiveType;

  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  }

  return 'fast';
}

/**
 * Adaptive loading based on network and device
 */
export function shouldLoadResource(priority: 'high' | 'medium' | 'low'): boolean {
  const connectionQuality = getConnectionQuality();
  const reducedMotion = prefersReducedMotion();

  // Always load high priority
  if (priority === 'high') return true;

  // On slow connections, skip low priority
  if (connectionQuality === 'slow' && priority === 'low') {
    return false;
  }

  // Respect reduced motion preference
  if (reducedMotion && priority === 'low') {
    return false;
  }

  return true;
}
