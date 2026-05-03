/**
 * Accessibility helper components and utilities
 * WCAG 2.1 AA compliance helpers
 */

import { useEffect, useRef, ReactNode } from 'react';

/**
 * Skip to main content link
 * Should be the first focusable element on the page
 */
export function SkipToContent({ mainContentId = 'main-content' }: { mainContentId?: string }) {
  return (
    <a
      href={`#${mainContentId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader only text
 * Visually hidden but available to screen readers
 */
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * Live region for announcing dynamic changes
 * Use for toast notifications, status updates, etc.
 */
interface LiveRegionProps {
  children: ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * Focus trap for modals and dialogs
 * Traps keyboard focus within the component
 */
interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  onEscape?: () => void;
}

export function FocusTrap({ children, active = true, onEscape }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    // Handle Tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      // Tab key
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active, onEscape]);

  return (
    <div ref={containerRef} role="dialog" aria-modal={active}>
      {children}
    </div>
  );
}

/**
 * Auto-focus hook
 * Automatically focuses an element when component mounts
 */
export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return ref;
}

/**
 * Announce to screen readers
 * Programmatically announce messages
 */
export function useAnnounce() {
  const regionRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (!regionRef.current) return;

    const region = regionRef.current;
    region.setAttribute('aria-live', politeness);
    region.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  };

  const AnnouncerRegion = () => (
    <div ref={regionRef} role="status" aria-live="polite" className="sr-only" />
  );

  return { announce, AnnouncerRegion };
}

/**
 * Keyboard navigation for lists
 * Handles arrow key navigation
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  itemCount: number,
  options: {
    onSelect?: (index: number) => void;
    onEscape?: () => void;
    loop?: boolean;
  } = {}
) {
  const { onSelect, onEscape, loop = true } = options;
  const containerRef = useRef<T>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          currentIndexRef.current = loop
            ? (currentIndexRef.current + 1) % itemCount
            : Math.min(currentIndexRef.current + 1, itemCount - 1);
          break;

        case 'ArrowUp':
          e.preventDefault();
          currentIndexRef.current = loop
            ? (currentIndexRef.current - 1 + itemCount) % itemCount
            : Math.max(currentIndexRef.current - 1, 0);
          break;

        case 'Home':
          e.preventDefault();
          currentIndexRef.current = 0;
          break;

        case 'End':
          e.preventDefault();
          currentIndexRef.current = itemCount - 1;
          break;

        case 'Enter':
          e.preventDefault();
          onSelect?.(currentIndexRef.current);
          break;

        case 'Escape':
          e.preventDefault();
          onEscape?.();
          break;

        default:
          return;
      }

      // Update aria-activedescendant
      const items = container.querySelectorAll('[role="option"]');
      items.forEach((item, index) => {
        if (index === currentIndexRef.current) {
          item.setAttribute('aria-selected', 'true');
          (item as HTMLElement).focus();
        } else {
          item.setAttribute('aria-selected', 'false');
        }
      });
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [itemCount, loop, onSelect, onEscape]);

  return containerRef;
}
