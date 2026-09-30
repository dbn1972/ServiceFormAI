import { useEffect, useRef } from 'react';

/**
 * Traps focus within a container (for modals, dialogs, dropdowns)
 * WCAG 2.1 Success Criterion 2.1.2 - No Keyboard Trap
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean,
  options?: {
    initialFocus?: () => HTMLElement | null;
    returnFocus?: boolean;
    escapeDeactivates?: boolean;
    onEscape?: () => void;
  }
) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store the element that had focus before trap activated
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((element) => {
        const style = window.getComputedStyle(element);
        return !element.closest('[hidden], [aria-hidden="true"]')
          && style.display !== 'none'
          && style.visibility !== 'hidden';
      });
    };

    // Set initial focus
    const focusableElements = getFocusableElements();
    if (options?.initialFocus) {
      const initialElement = options.initialFocus();
      initialElement?.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0]!.focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && options?.escapeDeactivates !== false) {
        e.preventDefault();
        options?.onEscape?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements[focusableElements.length - 1]!;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous element
      if (options?.returnFocus !== false && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, options]);

  return containerRef;
}
