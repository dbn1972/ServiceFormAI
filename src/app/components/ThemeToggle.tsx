import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAnnouncer } from '../hooks/useAnnouncer';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useFocusTrap<HTMLDivElement>(open, {
    escapeDeactivates: true,
    onEscape: () => setOpen(false),
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { announce } = useAnnouncer();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [open, dropdownRef]);

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const currentTheme = themes.find((t) => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    setOpen(false);
    announce(`Theme changed to ${newTheme}`, 'polite');
    buttonRef.current?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label={`Change theme, current: ${currentTheme?.label || 'Unknown'}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="theme-menu"
      >
        <CurrentIcon className="w-5 h-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          id="theme-menu"
          role="menu"
          aria-label="Theme options"
          className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50"
        >
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.value;
            return (
              <button
                key={t.value}
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => handleThemeChange(t.value)}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-muted transition-colors ${
                  isSelected ? 'bg-muted' : ''
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">{t.label}</span>
                {isSelected && (
                  <span className="ml-auto text-xs text-primary" aria-hidden="true">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
