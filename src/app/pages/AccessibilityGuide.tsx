import { Eye, Ear, Hand, Brain, CheckCircle, AlertCircle } from 'lucide-react';

export default function AccessibilityGuide() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Accessibility Guide</h1>
          <p className="text-muted-foreground">WCAG 2.1 AA compliance and inclusive design practices</p>
        </div>

        {/* Accessibility Commitment */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Our Commitment</h2>
          <p className="text-lg mb-4">
            ServiceFormAI OS is designed to be accessible to all citizens, regardless of ability. We follow WCAG 2.1 Level AA standards to ensure everyone can access government services with dignity and independence.
          </p>
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">WCAG 2.1 AA Compliant</span>
          </div>
        </div>

        {/* Disability Categories */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Designing for Different Abilities</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual */}
            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Visual Impairments</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>High contrast ratios (4.5:1 for text, 3:1 for UI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Screen reader support with ARIA labels</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Resizable text up to 200% without loss of functionality</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>No color-only information</span>
                </li>
              </ul>
            </div>

            {/* Auditory */}
            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                  <Ear className="w-6 h-6 text-info" />
                </div>
                <h3 className="font-semibold">Hearing Impairments</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Visual alerts for all audio notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Text alternatives for audio content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>No audio-only critical information</span>
                </li>
              </ul>
            </div>

            {/* Motor */}
            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Hand className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-semibold">Motor Impairments</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Full keyboard navigation support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Large touch targets (44px minimum)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>No time-critical interactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Voice input compatible</span>
                </li>
              </ul>
            </div>

            {/* Cognitive */}
            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-semibold">Cognitive Impairments</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Clear, simple language (8th grade reading level)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Consistent navigation and layout</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Progress indicators for multi-step tasks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Clear error messages with recovery options</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Color Contrast */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Color Contrast Standards</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">WCAG AA Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-semibold mb-2">Normal Text (16px+)</p>
                  <p className="text-2xl font-bold text-success mb-2">4.5:1</p>
                  <p className="text-sm text-muted-foreground">Minimum contrast ratio</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-semibold mb-2">Large Text (24px+)</p>
                  <p className="text-2xl font-bold text-success mb-2">3:1</p>
                  <p className="text-sm text-muted-foreground">Minimum contrast ratio</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Compliant Color Pairs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { bg: 'bg-white', text: 'text-gray-900', label: 'White + Dark Gray', ratio: '21:1' },
                  { bg: 'bg-primary', text: 'text-white', label: 'Primary + White', ratio: '4.8:1' },
                  { bg: 'bg-success', text: 'text-white', label: 'Success + White', ratio: '4.6:1' },
                  { bg: 'bg-warning', text: 'text-gray-900', label: 'Warning + Dark', ratio: '6.2:1' },
                  { bg: 'bg-destructive', text: 'text-white', label: 'Error + White', ratio: '5.1:1' },
                  { bg: 'bg-gray-100', text: 'text-gray-900', label: 'Light Gray + Dark', ratio: '18:1' },
                ].map((item, index) => (
                  <div key={index} className={`${item.bg} ${item.text} p-4 rounded-lg border border-border`}>
                    <p className="font-semibold mb-1">{item.label}</p>
                    <p className="text-xs opacity-75">Ratio: {item.ratio}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Never Use Color Alone</p>
                  <p className="text-sm text-muted-foreground">
                    Always pair color with icons, text labels, or patterns for critical information (errors, success, required fields)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Navigation */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Keyboard Navigation</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">All interactive elements must be keyboard accessible</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-mono text-sm mb-2">Tab</p>
                  <p className="text-sm text-muted-foreground">Navigate forward through interactive elements</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-mono text-sm mb-2">Shift + Tab</p>
                  <p className="text-sm text-muted-foreground">Navigate backward</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-mono text-sm mb-2">Enter / Space</p>
                  <p className="text-sm text-muted-foreground">Activate buttons and links</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-mono text-sm mb-2">Arrow Keys</p>
                  <p className="text-sm text-muted-foreground">Navigate within components (dropdowns, tabs)</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-mono text-sm mb-2">Esc</p>
                  <p className="text-sm text-muted-foreground">Close modals and dropdowns</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Focus Indicators</h3>
              <div className="space-y-3">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  Button with Focus Ring
                </button>
                <input
                  type="text"
                  placeholder="Input with focus state"
                  className="w-full max-w-md px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-sm text-muted-foreground">
                  All focusable elements must have a visible focus indicator (2px ring, primary color)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Readers */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Screen Reader Support</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">ARIA Labels & Landmarks</h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-mono text-sm mb-2">{'<button aria-label="Close dialog">×</button>'}</p>
                  <p className="text-sm text-muted-foreground">Descriptive labels for icon-only buttons</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-mono text-sm mb-2">{'<nav aria-label="Main navigation">'}</p>
                  <p className="text-sm text-muted-foreground">Landmark roles for page structure</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-mono text-sm mb-2">{'<div role="status" aria-live="polite">'}</p>
                  <p className="text-sm text-muted-foreground">Live regions for dynamic content updates</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-mono text-sm mb-2">{'<input aria-describedby="email-error">'}</p>
                  <p className="text-sm text-muted-foreground">Associate error messages with form fields</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Semantic HTML</h3>
              <p className="text-sm text-muted-foreground mb-4">Use proper HTML elements instead of generic divs</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="font-mono text-sm text-success mb-1">✓ {'<button>'}</p>
                  <p className="text-xs text-muted-foreground">For clickable actions</p>
                </div>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="font-mono text-sm text-destructive mb-1">✗ {'<div onclick>'}</p>
                  <p className="text-xs text-muted-foreground">Not keyboard accessible</p>
                </div>
                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="font-mono text-sm text-success mb-1">✓ {'<nav>'}, {'<main>'}</p>
                  <p className="text-xs text-muted-foreground">For page structure</p>
                </div>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="font-mono text-sm text-destructive mb-1">✗ {'<div class="nav">'}</p>
                  <p className="text-xs text-muted-foreground">No semantic meaning</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forms Accessibility */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Accessible Forms</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Form Field Best Practices</h3>
              <div className="max-w-2xl space-y-4">
                <div>
                  <label htmlFor="name-input" className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Always associate labels with inputs using htmlFor/id</p>
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    aria-describedby="email-error"
                    className="w-full px-4 py-3 bg-input-background border-2 border-destructive rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
                  />
                  <p id="email-error" className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Please enter a valid email address
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Use aria-describedby to link error messages</p>
                </div>

                <fieldset className="border border-border rounded-lg p-4">
                  <legend className="font-semibold px-2">Notification Preferences</legend>
                  <div className="space-y-2 mt-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Email notifications</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">SMS notifications</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Group related inputs with fieldset + legend</p>
                </fieldset>
              </div>
            </div>
          </div>
        </div>

        {/* Testing Checklist */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Accessibility Testing Checklist</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Manual Testing</h3>
              {[
                'Navigate entire app using only keyboard',
                'Test with screen reader (NVDA, JAWS, VoiceOver)',
                'Verify 200% zoom without horizontal scroll',
                'Check color contrast with tools',
                'Test with browser color filters (grayscale)',
                'Verify forms work without autocomplete',
              ].map((item, index) => (
                <label key={index} className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Automated Testing</h3>
              {[
                'Run axe DevTools browser extension',
                'Use Lighthouse accessibility audit',
                'Validate HTML semantics',
                'Check heading hierarchy (h1 → h2 → h3)',
                'Verify alt text for all images',
                'Test focus order is logical',
              ].map((item, index) => (
                <label key={index} className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
