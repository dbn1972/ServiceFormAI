import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FontSize = 'normal' | 'large' | 'x-large';
export type Contrast = 'normal' | 'high';
export type LineSpacing = 'normal' | 'relaxed' | 'loose';

interface AccessibilitySettings {
  fontSize: FontSize;
  contrast: Contrast;
  lineSpacing: LineSpacing;
  reduceMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  underlineLinks: boolean;
  hideImages: boolean;
  grayscale: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
  toolboxVisible: boolean;
  setToolboxVisible: (visible: boolean) => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'normal',
  contrast: 'normal',
  lineSpacing: 'normal',
  reduceMotion: false,
  screenReaderMode: false,
  keyboardNavigation: true,
  focusIndicators: true,
  underlineLinks: false,
  hideImages: false,
  grayscale: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  // Load settings from localStorage
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('a11y-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [toolboxVisible, setToolboxVisible] = useState(false);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    root.classList.remove('text-base', 'text-lg', 'text-xl');
    const fontSizeClass = {
      normal: 'text-base',
      large: 'text-lg',
      'x-large': 'text-xl',
    }[settings.fontSize];
    root.classList.add(fontSizeClass);

    // High contrast
    if (settings.contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Line spacing
    root.classList.remove('leading-normal', 'leading-relaxed', 'leading-loose');
    const lineSpacingClass = {
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
      loose: 'leading-loose',
    }[settings.lineSpacing];
    root.classList.add(lineSpacingClass);

    // Reduce motion
    if (settings.reduceMotion) {
      root.style.setProperty('--motion-reduce', '1');
      root.classList.add('reduce-motion');
    } else {
      root.style.removeProperty('--motion-reduce');
      root.classList.remove('reduce-motion');
    }

    // Underline links
    if (settings.underlineLinks) {
      root.classList.add('underline-links');
    } else {
      root.classList.remove('underline-links');
    }

    // Hide images
    if (settings.hideImages) {
      root.classList.add('hide-images');
    } else {
      root.classList.remove('hide-images');
    }

    // Grayscale
    if (settings.grayscale) {
      root.classList.add('grayscale-mode');
    } else {
      root.classList.remove('grayscale-mode');
    }

    // Focus indicators (always enabled for accessibility)
    if (settings.focusIndicators) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }

    // Persist settings
    localStorage.setItem('a11y-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('a11y-settings');
  };

  return (
    <AccessibilityContext.Provider
      value={{ settings, updateSetting, resetSettings, toolboxVisible, setToolboxVisible }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
