import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useState, useRef, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAnnouncer } from '../hooks/useAnnouncer';

export default function LanguageSelector() {
  const { language, setLanguage, languages, languageInfo } = useLanguage();
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

  const handleLanguageChange = (langCode: string, langName: string) => {
    setLanguage(langCode as any);
    setOpen(false);
    announce(`Language changed to ${langName}`, 'polite');
    buttonRef.current?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        aria-label={`Change language, current: ${languageInfo.nativeName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="language-menu"
      >
        <Globe className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium hidden sm:inline">
          {languageInfo.nativeName}
        </span>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          id="language-menu"
          role="menu"
          aria-label="Language options"
          className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50 max-h-80 overflow-y-auto"
        >
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => handleLanguageChange(lang.code, lang.nativeName)}
                className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-muted transition-colors ${
                  isSelected ? 'bg-muted' : ''
                }`}
              >
                <div>
                  <div className="font-medium text-sm">{lang.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{lang.name}</div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
