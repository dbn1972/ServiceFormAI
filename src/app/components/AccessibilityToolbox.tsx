import { useState } from 'react';
import {
  Eye,
  Type,
  Contrast,
  Move,
  Volume2,
  X,
  RotateCcw,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  AlignLeft,
  MinusCircle,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityToolbox() {
  const { settings, updateSetting, resetSettings, toolboxVisible, setToolboxVisible } =
    useAccessibility();
  const [expanded, setExpanded] = useState(false);

  if (!toolboxVisible) return null;

  const toggles = [
    {
      id: 'fontSize',
      label: 'Text Size',
      icon: Type,
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'large', label: 'Large' },
        { value: 'x-large', label: 'X-Large' },
      ],
      current: settings.fontSize,
    },
    {
      id: 'contrast',
      label: 'Contrast',
      icon: Contrast,
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
      ],
      current: settings.contrast,
    },
    {
      id: 'lineSpacing',
      label: 'Line Spacing',
      icon: AlignLeft,
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'relaxed', label: 'Relaxed' },
        { value: 'loose', label: 'Loose' },
      ],
      current: settings.lineSpacing,
    },
  ];

  const switches = [
    {
      id: 'reduceMotion',
      label: 'Reduce Motion',
      icon: Move,
      checked: settings.reduceMotion,
    },
    {
      id: 'screenReaderMode',
      label: 'Screen Reader',
      icon: Volume2,
      checked: settings.screenReaderMode,
    },
    {
      id: 'underlineLinks',
      label: 'Underline Links',
      icon: LinkIcon,
      checked: settings.underlineLinks,
    },
    {
      id: 'hideImages',
      label: 'Hide Images',
      icon: ImageIcon,
      checked: settings.hideImages,
    },
    {
      id: 'grayscale',
      label: 'Grayscale',
      icon: Palette,
      checked: settings.grayscale,
    },
    {
      id: 'focusIndicators',
      label: 'Focus Indicators',
      icon: Eye,
      checked: settings.focusIndicators,
    },
  ];

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 transition-all duration-300"
      role="dialog"
      aria-label="Accessibility Settings"
    >
      {/* Collapsed Button */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="bg-primary text-primary-foreground rounded-full p-4 shadow-2xl hover:scale-110 transition-transform flex items-center gap-2"
          aria-label="Open Accessibility Settings"
        >
          <Eye className="w-6 h-6" />
        </button>
      )}

      {/* Expanded Panel */}
      {expanded && (
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-80 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-primary/10 border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-lg">Accessibility</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetSettings}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Reset to defaults"
                aria-label="Reset settings to default"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                aria-label="Minimize Accessibility Settings"
              >
                <MinusCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setToolboxVisible(false)}
                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                aria-label="Close Accessibility Settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-6">
            {/* Option Groups */}
            {toggles.map((toggle) => {
              const Icon = toggle.icon;
              return (
                <div key={toggle.id} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {toggle.label}
                  </label>
                  <div className="flex gap-2">
                    {toggle.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting(toggle.id as any, option.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          toggle.current === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                        aria-pressed={toggle.current === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="border-t border-border pt-4" />

            {/* Toggle Switches */}
            <div className="space-y-3">
              {switches.map((sw) => {
                const Icon = sw.icon;
                return (
                  <label
                    key={sw.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{sw.label}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={sw.checked}
                        onChange={(e) => updateSetting(sw.id as any, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted-foreground/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Settings are saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
