import { useRef } from 'react';

/**
 * Live region announcer for screen readers
 * WCAG 2.1 Success Criterion 4.1.3 - Status Messages
 */

type Politeness = 'polite' | 'assertive';

class Announcer {
  private politeRegion: HTMLDivElement | null = null;
  private assertiveRegion: HTMLDivElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof document === 'undefined') return;

    // Create polite live region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('role', 'status');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    document.body.appendChild(this.politeRegion);

    // Create assertive live region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('role', 'alert');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    document.body.appendChild(this.assertiveRegion);
  }

  announce(message: string, politeness: Politeness = 'polite') {
    const region = politeness === 'polite' ? this.politeRegion : this.assertiveRegion;
    if (!region) return;

    // Clear previous message
    region.textContent = '';

    // Small delay to ensure screen readers detect the change
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }

  destroy() {
    this.politeRegion?.remove();
    this.assertiveRegion?.remove();
  }
}

let announcerInstance: Announcer | null = null;

function getAnnouncer(): Announcer {
  if (!announcerInstance) {
    announcerInstance = new Announcer();
  }
  return announcerInstance;
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnouncer() {
  const announcerRef = useRef<Announcer>(getAnnouncer());

  return {
    announce: (message: string, politeness: Politeness = 'polite') => {
      announcerRef.current.announce(message, politeness);
    },
  };
}

/**
 * Standalone function to announce without hook
 */
export function announce(message: string, politeness: Politeness = 'polite') {
  getAnnouncer().announce(message, politeness);
}
