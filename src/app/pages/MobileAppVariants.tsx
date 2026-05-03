import { Smartphone, CheckCircle, ChevronLeft, MoreVertical, Share } from 'lucide-react';

export default function MobileAppVariants() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mobile App Variants</h1>
          <p className="text-muted-foreground">iOS and Android platform-specific patterns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* iOS Version */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">iOS Design</h2>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Apple HIG</span>
            </div>

            <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-w-sm mx-auto">
              {/* iOS Status Bar */}
              <div className="bg-card px-6 pt-3 pb-2">
                <div className="flex items-center justify-between text-xs">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-3 bg-foreground rounded-full" />
                      <div className="w-1 h-3 bg-foreground rounded-full" />
                      <div className="w-1 h-3 bg-foreground rounded-full" />
                      <div className="w-1 h-3 bg-foreground rounded-full" />
                    </div>
                    <svg className="w-4 h-3" viewBox="0 0 16 12">
                      <rect width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
                      <rect x="17" y="4" width="2" height="4" rx="1" fill="currentColor" />
                      <rect x="2" y="2" width="12" height="8" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* iOS Navigation Bar */}
              <div className="bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-1 text-primary">
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-base">Back</span>
                  </button>
                  <h3 className="text-base font-semibold">Application</h3>
                  <button className="text-primary text-base font-medium">Done</button>
                </div>
              </div>

              {/* iOS Content */}
              <div className="p-6 space-y-4">
                <div className="bg-muted/50 rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                  <p className="font-medium">Ananya Sharma</p>
                </div>

                <div className="bg-muted/50 rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium">15 March 2008</p>
                </div>

                <button className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-base">
                  Continue
                </button>
              </div>

              {/* iOS Tab Bar */}
              <div className="bg-card/95 backdrop-blur-lg border-t border-border px-6 py-2 safe-area-inset-bottom">
                <div className="flex items-center justify-around">
                  {['Services', 'Applications', 'Wallet', 'Profile'].map((tab, index) => (
                    <button key={index} className="flex flex-col items-center gap-1 py-1">
                      <div className={`w-6 h-6 rounded-full ${index === 1 ? 'bg-primary' : 'bg-muted'}`} />
                      <span className={`text-xs ${index === 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {tab}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* iOS Features */}
            <div className="mt-6 bg-card border border-border rounded-xl p-4">
              <h4 className="font-semibold mb-3 text-sm">iOS-specific</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>San Francisco font system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Rounded corners (16-20px)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Bottom navigation with labels</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Swipe gestures for navigation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Android Version */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Android Design</h2>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Material 3</span>
            </div>

            <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-w-sm mx-auto">
              {/* Android Status Bar */}
              <div className="bg-primary/90 text-primary-foreground px-6 pt-3 pb-2">
                <div className="flex items-center justify-between text-xs">
                  <span>9:41</span>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 6h4M1 2h4M1 10h4" />
                    </svg>
                    <svg className="w-4 h-3" viewBox="0 0 16 12">
                      <rect width="14" height="12" rx="1" fill="none" stroke="currentColor" />
                      <rect x="2" y="2" width="10" height="8" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Android App Bar */}
              <div className="bg-primary text-primary-foreground px-4 py-4">
                <div className="flex items-center gap-4">
                  <button>
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-medium flex-1">Application Status</h3>
                  <button>
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Android Content */}
              <div className="p-6 space-y-4">
                <div className="border-2 border-border rounded-lg p-4 focus-within:border-primary transition-colors">
                  <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                  <p className="font-medium">Ananya Sharma</p>
                </div>

                <div className="border-2 border-border rounded-lg p-4 focus-within:border-primary transition-colors">
                  <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium">15 March 2008</p>
                </div>

                <button className="w-full py-3 bg-primary text-primary-foreground rounded-full font-medium text-base shadow-md hover:shadow-lg transition-shadow">
                  CONTINUE
                </button>
              </div>

              {/* Android FAB */}
              <div className="relative h-20">
                <button className="absolute bottom-4 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center">
                  <Share className="w-6 h-6" />
                </button>
              </div>

              {/* Android Navigation Bar */}
              <div className="bg-card border-t border-border px-6 py-3">
                <div className="flex items-center justify-around">
                  {['Services', 'Applications', 'Wallet', 'Profile'].map((tab, index) => (
                    <button key={index} className="flex flex-col items-center gap-1">
                      <div className={`w-6 h-6 rounded-lg ${index === 1 ? 'bg-primary' : 'bg-muted'}`} />
                      <span className={`text-xs ${index === 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {tab}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Android Features */}
            <div className="mt-6 bg-card border border-border rounded-xl p-4">
              <h4 className="font-semibold mb-3 text-sm">Android-specific</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Roboto font system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Material elevation shadows</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>Floating Action Button (FAB)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>System navigation gestures</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Platform Comparison */}
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Platform Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 font-semibold">Feature</th>
                  <th className="text-center py-3 font-semibold">iOS</th>
                  <th className="text-center py-3 font-semibold">Android</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { feature: 'Corner Radius', ios: '16-20px', android: '4-12px' },
                  { feature: 'Button Style', ios: 'Rounded rectangles', android: 'Pills / outlined' },
                  { feature: 'Navigation', ios: 'Bottom tabs', android: 'Bottom nav + FAB' },
                  { feature: 'Typography', ios: 'San Francisco', android: 'Roboto' },
                  { feature: 'Elevation', ios: 'Subtle shadows', android: 'Material elevation' },
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="py-3">{row.feature}</td>
                    <td className="py-3 text-center text-muted-foreground">{row.ios}</td>
                    <td className="py-3 text-center text-muted-foreground">{row.android}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
