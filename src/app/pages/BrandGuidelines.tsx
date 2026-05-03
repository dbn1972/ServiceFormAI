import { MessageCircle, Image, CheckCircle, XCircle, Globe, Shield, Users } from 'lucide-react';

export default function BrandGuidelines() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Brand Guidelines</h1>
          <p className="text-muted-foreground">Logo, voice & tone, and writing style for ServiceFormAI OS</p>
        </div>

        {/* Brand Identity */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">ServiceFormAI OS</h2>
          <p className="text-lg mb-6">
            A DigiLocker-first Citizen Service Intelligence Network that makes government services accessible, transparent, and citizen-centric.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/50 rounded-lg">
              <h3 className="font-semibold mb-2">Mission</h3>
              <p className="text-sm text-muted-foreground">
                Empower every citizen with seamless access to government services through intelligent automation and document reuse
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-lg">
              <h3 className="font-semibold mb-2">Vision</h3>
              <p className="text-sm text-muted-foreground">
                A future where no citizen has to submit the same document twice or navigate bureaucratic complexity alone
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-lg">
              <h3 className="font-semibold mb-2">Values</h3>
              <p className="text-sm text-muted-foreground">
                Transparency, Accessibility, Trust, Simplicity, Citizen-first
              </p>
            </div>
          </div>
        </div>

        {/* Logo & Visual Identity */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Logo & Visual Identity</h2>

          <div className="space-y-8">
            {/* Logo Mockup */}
            <div>
              <h3 className="font-semibold mb-4">Logo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-border rounded-xl p-8 bg-white text-center">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-gray-900">ServiceFormAI</div>
                      <div className="text-xs text-muted-foreground">Citizen Services</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Primary logo (light background)</p>
                </div>

                <div className="border border-border rounded-xl p-8 bg-gray-900 text-center">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-white">ServiceFormAI</div>
                      <div className="text-xs text-gray-400">Citizen Services</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Primary logo (dark background)</p>
                </div>
              </div>
            </div>

            {/* Logo Usage */}
            <div>
              <h3 className="font-semibold mb-4">Logo Usage Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-success flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Do
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-success">•</span>
                      <span>Maintain minimum clear space of 16px around logo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">•</span>
                      <span>Use approved color variations only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">•</span>
                      <span>Scale proportionally</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success">•</span>
                      <span>Minimum size: 32px height</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-destructive flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Don't
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Stretch, distort, or rotate the logo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Change logo colors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Add effects (shadows, gradients, outlines)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Place on busy backgrounds</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Color Palette</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Primary Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Primary Blue', hex: '#1e40af', class: 'bg-primary' },
                  { name: 'Success Green', hex: '#16a34a', class: 'bg-success' },
                  { name: 'Warning Amber', hex: '#f59e0b', class: 'bg-warning' },
                  { name: 'Error Red', hex: '#dc2626', class: 'bg-destructive' },
                ].map((color, index) => (
                  <div key={index} className="border border-border rounded-lg overflow-hidden">
                    <div className={`${color.class} h-24`}></div>
                    <div className="p-3">
                      <p className="font-semibold text-sm mb-1">{color.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Neutral Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: 'White', hex: '#ffffff', class: 'bg-white border' },
                  { name: 'Gray 100', hex: '#f3f4f6', class: 'bg-gray-100' },
                  { name: 'Gray 500', hex: '#6b7280', class: 'bg-gray-500' },
                  { name: 'Gray 900', hex: '#111827', class: 'bg-gray-900' },
                  { name: 'Black', hex: '#000000', class: 'bg-black' },
                ].map((color, index) => (
                  <div key={index} className="border border-border rounded-lg overflow-hidden">
                    <div className={`${color.class} h-20`}></div>
                    <div className="p-3">
                      <p className="font-semibold text-xs mb-1">{color.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
              <p className="text-sm"><strong>Color Usage:</strong> Primary blue for actions and trust, green for success/verified, amber for warnings, red for errors only.</p>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Typography</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Font Family</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-border rounded-lg">
                  <p className="text-4xl font-bold mb-3">Inter</p>
                  <p className="text-sm text-muted-foreground mb-4">Primary font for UI, headings, and body text</p>
                  <p className="text-xs text-muted-foreground">AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz 0123456789</p>
                </div>
                <div className="p-6 border border-border rounded-lg">
                  <p className="text-4xl font-mono mb-3">Mono</p>
                  <p className="text-sm text-muted-foreground mb-4">Code snippets, technical data, and IDs</p>
                  <p className="text-xs text-muted-foreground font-mono">AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz 0123456789</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Type Scale</h3>
              <div className="space-y-3">
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-4xl font-bold mb-2">Display Heading</p>
                  <p className="text-xs text-muted-foreground">48px, Bold (700)</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-3xl font-semibold mb-2">H1 Heading</p>
                  <p className="text-xs text-muted-foreground">36px, Semibold (600)</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-lg mb-2">Body Large</p>
                  <p className="text-xs text-muted-foreground">18px, Regular (400)</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-base mb-2">Body Default</p>
                  <p className="text-xs text-muted-foreground">16px, Regular (400)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice & Tone */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Voice & Tone</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 border border-border rounded-lg">
                <MessageCircle className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Clear & Simple</h3>
                <p className="text-sm text-muted-foreground">
                  Use plain language. Avoid jargon, bureaucratic terms, and complex sentences. Write at an 8th-grade reading level.
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <Shield className="w-10 h-10 text-success mb-4" />
                <h3 className="font-semibold mb-2">Trustworthy</h3>
                <p className="text-sm text-muted-foreground">
                  Be transparent about what happens with user data. Explain processes clearly. Build confidence through consistency.
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <Globe className="w-10 h-10 text-info mb-4" />
                <h3 className="font-semibold mb-2">Respectful & Inclusive</h3>
                <p className="text-sm text-muted-foreground">
                  Use gender-neutral language. Accommodate diverse literacy levels. Support multiple languages and cultural contexts.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Writing Examples</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-2">✗ Don't</p>
                    <p className="text-sm text-muted-foreground">
                      "The submitted application will be processed by the designated authority as per the prescribed timeline mentioned in the official notification."
                    </p>
                  </div>
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <p className="text-sm font-semibold text-success mb-2">✓ Do</p>
                    <p className="text-sm text-muted-foreground">
                      "We'll review your application within 7 working days and update you via SMS."
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-2">✗ Don't</p>
                    <p className="text-sm text-muted-foreground">
                      "Invalid credentials. Authentication failed."
                    </p>
                  </div>
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <p className="text-sm font-semibold text-success mb-2">✓ Do</p>
                    <p className="text-sm text-muted-foreground">
                      "The email or password you entered doesn't match our records. Please try again."
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-2">✗ Don't</p>
                    <p className="text-sm text-muted-foreground">
                      "Click here to proceed to the next step"
                    </p>
                  </div>
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <p className="text-sm font-semibold text-success mb-2">✓ Do</p>
                    <p className="text-sm text-muted-foreground">
                      "Continue to document upload" (specific action)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Imagery Guidelines */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Imagery & Photography</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Photo Style</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <Image className="w-10 h-10 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">Authentic</h4>
                  <p className="text-sm text-muted-foreground">
                    Real people, real situations. Avoid stock photo clichés.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <Users className="w-10 h-10 text-success mb-3" />
                  <h4 className="font-semibold mb-2">Diverse</h4>
                  <p className="text-sm text-muted-foreground">
                    Represent India's diversity in age, gender, region, and ability.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <Shield className="w-10 h-10 text-info mb-3" />
                  <h4 className="font-semibold mb-2">Respectful</h4>
                  <p className="text-sm text-muted-foreground">
                    Show citizens with dignity and agency, never as passive subjects.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm"><strong>Illustration Style:</strong> Use simple, line-based icons from Lucide React. Avoid decorative illustrations that don't serve a functional purpose.</p>
            </div>
          </div>
        </div>

        {/* Accessibility */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Accessibility Standards</h2>

          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">WCAG 2.1 Level AA Compliance</h3>
              <p className="text-sm text-muted-foreground">
                All brand applications must meet WCAG 2.1 AA standards for accessibility, including color contrast, keyboard navigation, and screen reader support.
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Multi-Language Support</h3>
              <p className="text-sm text-muted-foreground">
                Support 8 Indian languages: English, Hindi, Marathi, Tamil, Telugu, Gujarati, Kannada, Bengali. Maintain design integrity across all languages.
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Low-Bandwidth Mode</h3>
              <p className="text-sm text-muted-foreground">
                Essential functionality must work on 2G connections. Provide text-only alternatives to visual content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
