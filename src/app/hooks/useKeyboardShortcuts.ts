import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Global keyboard shortcuts for the application
 *
 * Usage:
 * useKeyboardShortcuts({
 *   onSearch: () => setSearchOpen(true),
 *   onSave: () => handleSave()
 * });
 */
export function useKeyboardShortcuts(callbacks?: {
  onSearch?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
  onNew?: () => void;
}) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

    // Cmd/Ctrl + K: Open search
    if (cmdOrCtrl && event.key === 'k') {
      event.preventDefault();
      callbacks?.onSearch?.();
    }

    // Cmd/Ctrl + S: Save
    if (cmdOrCtrl && event.key === 's') {
      event.preventDefault();
      callbacks?.onSave?.();
    }

    // Cmd/Ctrl + N: New
    if (cmdOrCtrl && event.key === 'n') {
      event.preventDefault();
      callbacks?.onNew?.();
    }

    // Escape: Close modal/cancel
    if (event.key === 'Escape') {
      callbacks?.onEscape?.();
    }

    // Cmd/Ctrl + /: Show shortcuts help
    if (cmdOrCtrl && event.key === '/') {
      event.preventDefault();
      // Show shortcuts modal
    }

    // Cmd/Ctrl + 1-9: Navigate to pages
    if (cmdOrCtrl && event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const shortcuts = [
        '/tenant/dashboard',
        '/tenant/templates',
        '/tenant/service/create',
        '/tenant/service/workflow',
        '/tenant/analytics'
      ];
      const index = parseInt(event.key) - 1;
      if (shortcuts[index]) {
        navigate(shortcuts[index]);
      }
    }
  }, [callbacks, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get platform-specific key display
 */
export function getKeyDisplay(key: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const keyMap: Record<string, { mac: string; windows: string }> = {
    'mod': { mac: '⌘', windows: 'Ctrl' },
    'ctrl': { mac: '⌃', windows: 'Ctrl' },
    'alt': { mac: '⌥', windows: 'Alt' },
    'shift': { mac: '⇧', windows: 'Shift' },
    'enter': { mac: '↵', windows: 'Enter' },
    'escape': { mac: 'Esc', windows: 'Esc' },
    'backspace': { mac: '⌫', windows: 'Backspace' },
  };

  const mapped = keyMap[key.toLowerCase()];
  if (mapped) {
    return isMac ? mapped.mac : mapped.windows;
  }

  return key.toUpperCase();
}

/**
 * Global keyboard shortcuts configuration
 */
export const KEYBOARD_SHORTCUTS: ShortcutConfig[] = [
  {
    key: 'k',
    metaKey: true,
    action: () => {},
    description: 'Open search'
  },
  {
    key: 's',
    metaKey: true,
    action: () => {},
    description: 'Save current work'
  },
  {
    key: 'n',
    metaKey: true,
    action: () => {},
    description: 'Create new service'
  },
  {
    key: '/',
    metaKey: true,
    action: () => {},
    description: 'Show keyboard shortcuts'
  },
  {
    key: '1',
    metaKey: true,
    action: () => {},
    description: 'Go to Dashboard'
  },
  {
    key: '2',
    metaKey: true,
    action: () => {},
    description: 'Go to Templates'
  },
  {
    key: '3',
    metaKey: true,
    action: () => {},
    description: 'Create Service'
  },
  {
    key: '4',
    metaKey: true,
    action: () => {},
    description: 'Configure Workflow'
  },
  {
    key: '5',
    metaKey: true,
    action: () => {},
    description: 'View Analytics'
  },
  {
    key: 'Escape',
    action: () => {},
    description: 'Close modal or cancel'
  }
];
