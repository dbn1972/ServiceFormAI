import { Zap, Move, RotateCw, ChevronDown, Bell, CheckCircle, Loader2 } from 'lucide-react';

export default function MotionDesign() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Motion Design & Animations</h1>
          <p className="text-muted-foreground">Animation specs, transitions, and micro-interactions</p>
        </div>

        {/* Motion Principles */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Motion Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-border rounded-lg">
              <Zap className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Purposeful</h3>
              <p className="text-sm text-muted-foreground">
                Every animation serves a functional purpose: guiding attention, providing feedback, or showing relationships
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <Move className="w-8 h-8 text-success mb-3" />
              <h3 className="font-semibold mb-2">Subtle</h3>
              <p className="text-sm text-muted-foreground">
                Animations are quick and understated, never distracting from the user's task at hand
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <RotateCw className="w-8 h-8 text-info mb-3" />
              <h3 className="font-semibold mb-2">Consistent</h3>
              <p className="text-sm text-muted-foreground">
                Same element types use the same motion patterns across the entire system
              </p>
            </div>
          </div>
        </div>

        {/* Timing & Easing */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Timing & Easing Functions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-4">Duration Guidelines</h3>
              <div className="space-y-3">
                {[
                  { duration: '100ms', usage: 'Micro-interactions (hover, focus)' },
                  { duration: '200ms', usage: 'UI transitions (tooltips, dropdowns)' },
                  { duration: '300ms', usage: 'Page transitions, modals' },
                  { duration: '500ms', usage: 'Complex animations, skeleton loading' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-mono text-sm font-semibold">{item.duration}</span>
                    <span className="text-sm text-muted-foreground">{item.usage}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Easing Functions</h3>
              <div className="space-y-3">
                {[
                  { name: 'ease-in-out', usage: 'Default transitions' },
                  { name: 'ease-out', usage: 'Elements entering' },
                  { name: 'ease-in', usage: 'Elements exiting' },
                  { name: 'cubic-bezier', usage: 'Custom spring effects' },
                ].map((item, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-mono text-sm font-semibold mb-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
            <p className="text-sm"><strong>CSS Variable:</strong> <code className="bg-muted px-2 py-1 rounded text-xs">transition-all duration-200 ease-in-out</code></p>
            <p className="text-xs text-muted-foreground mt-2">Use Tailwind utilities: transition-colors, transition-transform, etc.</p>
          </div>
        </div>

        {/* Interactive Demos */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Interactive States</h2>

          <div className="space-y-8">
            {/* Hover Effects */}
            <div>
              <h3 className="font-semibold mb-4">Hover Transitions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200">
                  Color Change
                </button>
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-lg transition-shadow duration-200">
                  Shadow Lift
                </button>
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-105 transition-transform duration-200">
                  Scale Up
                </button>
              </div>
            </div>

            {/* Loading States */}
            <div>
              <h3 className="font-semibold mb-4">Loading Animations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border border-border rounded-lg text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">Spinner</p>
                  <code className="text-xs text-muted-foreground">animate-spin</code>
                </div>
                <div className="p-6 border border-border rounded-lg">
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                  <p className="text-sm font-medium text-center mt-4">Skeleton</p>
                  <code className="text-xs text-muted-foreground block text-center">animate-pulse</code>
                </div>
                <div className="p-6 border border-border rounded-lg text-center">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-sm font-medium">Progress Bar</p>
                  <code className="text-xs text-muted-foreground">transition-all</code>
                </div>
              </div>
            </div>

            {/* Dropdown Animation */}
            <div>
              <h3 className="font-semibold mb-4">Dropdown & Expansion</h3>
              <div className="max-w-md">
                <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <span className="font-medium">Click to expand</span>
                  <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                </button>
                <div className="mt-2 p-4 border border-border rounded-lg opacity-100 transition-all duration-300">
                  <p className="text-sm text-muted-foreground">
                    Expanded content appears with smooth fade and slide-down animation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Micro-interactions */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Micro-interactions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Button Feedback */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Button Press</h3>
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium active:scale-95 transition-transform duration-100">
                Click Me
              </button>
              <p className="text-xs text-muted-foreground mt-3">Active state: scale-95, 100ms duration</p>
            </div>

            {/* Toggle Switch */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Toggle Switch</h3>
              <label className="relative inline-block w-14 h-7">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-full h-full bg-muted rounded-full peer-checked:bg-primary transition-colors duration-200 cursor-pointer"></div>
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-7"></div>
              </label>
              <p className="text-xs text-muted-foreground mt-3">Background color + knob position, 200ms</p>
            </div>

            {/* Checkbox */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Checkbox</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-2 border-border transition-all duration-200 checked:bg-primary checked:border-primary" />
                <span className="text-sm">Accept terms</span>
              </label>
              <p className="text-xs text-muted-foreground mt-3">Background + border transition, 200ms</p>
            </div>

            {/* Notification */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Notification Badge</h3>
              <div className="relative inline-block">
                <Bell className="w-8 h-8 text-foreground" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  3
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Pulse animation for attention</p>
            </div>
          </div>
        </div>

        {/* Page Transitions */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Page & Modal Transitions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Modal Entry</h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <code className="text-sm">fade-in (opacity 0 → 1) + scale-up (95% → 100%)</code>
                <p className="text-xs text-muted-foreground mt-2">Duration: 200ms, easing: ease-out</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Slide Panel</h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <code className="text-sm">translate-x-full → translate-x-0</code>
                <p className="text-xs text-muted-foreground mt-2">Duration: 300ms, easing: ease-in-out</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Toast Notification</h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                <code className="text-sm">slide-down + fade-in from top</code>
                <p className="text-xs text-muted-foreground mt-2">Duration: 300ms, auto-dismiss: 3000ms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Animations */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Status Feedback Animations</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Success */}
            <div className="p-6 border-2 border-success/30 bg-success/5 rounded-xl text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success animate-bounce" style={{ animationIterationCount: 2 }} />
              </div>
              <h4 className="font-semibold mb-1">Success</h4>
              <p className="text-xs text-muted-foreground">Bounce animation (2 iterations)</p>
            </div>

            {/* Processing */}
            <div className="p-6 border-2 border-info/30 bg-info/5 rounded-xl text-center">
              <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-info animate-spin" />
              </div>
              <h4 className="font-semibold mb-1">Processing</h4>
              <p className="text-xs text-muted-foreground">Continuous spin animation</p>
            </div>

            {/* Attention */}
            <div className="p-6 border-2 border-warning/30 bg-warning/5 rounded-xl text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Bell className="w-8 h-8 text-warning" />
              </div>
              <h4 className="font-semibold mb-1">Attention</h4>
              <p className="text-xs text-muted-foreground">Pulse for user attention</p>
            </div>
          </div>
        </div>

        {/* Accessibility */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Accessibility Considerations</h2>

          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Reduced Motion</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Respect <code className="bg-muted px-2 py-1 rounded text-xs">prefers-reduced-motion</code> media query
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                @media (prefers-reduced-motion: reduce) &#123; * &#123; animation-duration: 0.01ms !important; &#125; &#125;
              </code>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Non-Essential Animations</h3>
              <p className="text-sm text-muted-foreground">
                Decorative animations should never convey critical information. Always provide alternative feedback.
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Performance</h3>
              <p className="text-sm text-muted-foreground">
                Use <code className="bg-muted px-2 py-1 rounded text-xs">transform</code> and <code className="bg-muted px-2 py-1 rounded text-xs">opacity</code> for animations (GPU-accelerated). Avoid animating layout properties like width, height, margin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
