import { Moon, Sun, GraduationCap, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

export default function DarkMode() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dark Mode</h1>
          <p className="text-muted-foreground">Dark theme variants for all components and pages</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Light Mode */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold">Light Mode</h2>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">Default</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
              {/* Light Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Citizen Service Feed</h3>
                <p className="text-sm text-gray-600">Your personalized services</p>
              </div>

              {/* Light Content */}
              <div className="p-6 space-y-4 bg-gray-50">
                {/* Service Card - Light */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1 text-gray-900">State Merit Scholarship</h4>
                      <p className="text-xs text-gray-600 mb-2">You may be eligible</p>
                      <div className="flex items-center gap-2 text-xs text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        <span>3 documents ready</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    Check Eligibility
                  </button>
                </div>

                {/* Document Card - Light */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900">Aadhaar Card</p>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-600">Verified from DigiLocker</p>
                    </div>
                  </div>
                </div>

                {/* Status Card - Light */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">Action Required</p>
                      <p className="text-xs text-gray-600">Income certificate needs update</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Light Footer */}
              <div className="bg-white border-t border-gray-200 p-4">
                <p className="text-xs text-center text-gray-500">Light theme - optimized for daylight</p>
              </div>
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Dark Mode</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">OLED Optimized</span>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Dark Header */}
              <div className="bg-gray-900 border-b border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Citizen Service Feed</h3>
                <p className="text-sm text-gray-400">Your personalized services</p>
              </div>

              {/* Dark Content */}
              <div className="p-6 space-y-4 bg-gray-950">
                {/* Service Card - Dark */}
                <div className="bg-gradient-to-br from-blue-950 to-blue-900/50 border border-blue-800 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1 text-gray-100">State Merit Scholarship</h4>
                      <p className="text-xs text-gray-400 mb-2">You may be eligible</p>
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        <span>3 documents ready</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
                    Check Eligibility
                  </button>
                </div>

                {/* Document Card - Dark */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-950 rounded-lg flex items-center justify-center border border-green-800">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-100">Aadhaar Card</p>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-xs text-gray-400">Verified from DigiLocker</p>
                    </div>
                  </div>
                </div>

                {/* Status Card - Dark */}
                <div className="bg-amber-950 border border-amber-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-100">Action Required</p>
                      <p className="text-xs text-gray-400">Income certificate needs update</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark Footer */}
              <div className="bg-gray-900 border-t border-gray-800 p-4">
                <p className="text-xs text-center text-gray-500">Dark theme - reduces eye strain in low light</p>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette Comparison */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Light Palette */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Light Mode Color Palette</h3>
            <div className="space-y-3">
              {[
                { name: 'Background', light: '#ffffff', var: 'bg-white' },
                { name: 'Card', light: '#ffffff', var: 'bg-white' },
                { name: 'Text', light: '#1a1a2e', var: 'text-gray-900' },
                { name: 'Muted Text', light: '#64748b', var: 'text-gray-600' },
                { name: 'Border', light: '#e2e8f0', var: 'border-gray-200' },
                { name: 'Primary', light: '#1e40af', var: 'bg-blue-600' },
                { name: 'Success', light: '#16a34a', var: 'bg-green-600' },
                { name: 'Warning', light: '#f59e0b', var: 'bg-amber-600' },
              ].map((color, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${color.var} rounded-lg border border-border`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{color.name}</p>
                    <p className="text-xs text-muted-foreground">{color.light}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dark Palette */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-gray-100">Dark Mode Color Palette</h3>
            <div className="space-y-3">
              {[
                { name: 'Background', dark: '#030712', var: 'bg-gray-950' },
                { name: 'Card', dark: '#111827', var: 'bg-gray-900' },
                { name: 'Text', dark: '#f9fafb', var: 'text-gray-100' },
                { name: 'Muted Text', dark: '#9ca3af', var: 'text-gray-400' },
                { name: 'Border', dark: '#1f2937', var: 'border-gray-800' },
                { name: 'Primary', dark: '#3b82f6', var: 'bg-blue-500' },
                { name: 'Success', dark: '#4ade80', var: 'bg-green-400' },
                { name: 'Warning', dark: '#fbbf24', var: 'bg-amber-400' },
              ].map((color, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${color.var} rounded-lg border border-gray-700`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-100">{color.name}</p>
                    <p className="text-xs text-gray-400">{color.dark}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Dark Mode Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <CheckCircle className="w-5 h-5 text-success mb-2" />
              <p className="font-medium mb-1">OLED Optimized</p>
              <p className="text-muted-foreground">True black (#000) for pure OLED displays to save battery</p>
            </div>
            <div>
              <CheckCircle className="w-5 h-5 text-success mb-2" />
              <p className="font-medium mb-1">Contrast Compliant</p>
              <p className="text-muted-foreground">WCAG 2.1 AA contrast ratios maintained in dark mode</p>
            </div>
            <div>
              <CheckCircle className="w-5 h-5 text-success mb-2" />
              <p className="font-medium mb-1">Auto-Switch</p>
              <p className="text-muted-foreground">Respects system preferences and time-based switching</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
