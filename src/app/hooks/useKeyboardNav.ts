import { useEffect, useRef, useCallback } from 'react';

/**
 * Roving tabindex keyboard navigation for lists, menus, toolbars
 * WCAG 2.1 Success Criterion 2.1.1 - Keyboard Navigation
 * Follows ARIA Authoring Practices Guide patterns
 */

interface UseKeyboardNavOptions {
  orientation?: 'vertical' | 'horizontal' | 'both';
  loop?: boolean;
  activateOnFocus?: boolean;
  onActivate?: (index: number) => void;
}

export function useKeyboardNav<T extends HTMLElement>(
  itemCount: number,
  options: UseKeyboardNavOptions = {}
) {
  const {
    orientation = 'vertical',
    loop = true,
    activateOnFocus = false,
    onActivate,
  } = options;

  const containerRef = useRef<T>(null);
  const currentIndexRef = useRef(0);

  const getItems = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[role="menuitem"], [role="option"], [role="tab"], [data-keyboard-nav-item]')
    );
  }, []);

  const focusItem = useCallback(
    (index: number) => {
      const items = getItems();
      if (index < 0 || index >= items.length) return;

      // Update tabindex
      items.forEach((item, i) => {
        if (i === index) {
          item.setAttribute('tabindex', '0');
          item.focus();
          currentIndexRef.current = index;
          if (activateOnFocus) {
            onActivate?.(index);
          }
        } else {
          item.setAttribute('tabindex', '-1');
        }
      });
    },
    [getItems, activateOnFocus, onActivate]
  );

  const moveNext = useCallback(() => {
    const items = getItems();
    let nextIndex = currentIndexRef.current + 1;
    if (nextIndex >= items.length) {
      nextIndex = loop ? 0 : items.length - 1;
    }
    focusItem(nextIndex);
  }, [focusItem, getItems, loop]);

  const movePrevious = useCallback(() => {
    const items = getItems();
    let prevIndex = currentIndexRef.current - 1;
    if (prevIndex < 0) {
      prevIndex = loop ? items.length - 1 : 0;
    }
    focusItem(prevIndex);
  }, [focusItem, getItems, loop]);

  const moveFirst = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  const moveLast = useCallback(() => {
    const items = getItems();
    focusItem(items.length - 1);
  }, [focusItem, getItems]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      switch (e.key) {
        case 'ArrowDown':
          if (isVertical) {
            e.preventDefault();
            moveNext();
          }
          break;
        case 'ArrowUp':
          if (isVertical) {
            e.preventDefault();
            movePrevious();
          }
          break;
        case 'ArrowRight':
          if (isHorizontal) {
            e.preventDefault();
            moveNext();
          }
          break;
        case 'ArrowLeft':
          if (isHorizontal) {
            e.preventDefault();
            movePrevious();
          }
          break;
        case 'Home':
          e.preventDefault();
          moveFirst();
          break;
        case 'End':
          e.preventDefault();
          moveLast();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onActivate?.(currentIndexRef.current);
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [orientation, moveNext, movePrevious, moveFirst, moveLast, onActivate]);

  // Initialize tabindex on first render
  useEffect(() => {
    focusItem(0);
  }, [itemCount]); // Re-run when item count changes

  return {
    containerRef,
    focusItem,
    moveNext,
    movePrevious,
    moveFirst,
    moveLast,
  };
}
