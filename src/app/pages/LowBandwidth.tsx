import { Zap, Image, FileText, CheckCircle } from 'lucide-react';

export default function LowBandwidth() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Low-Bandwidth Mode</h1>
          <p className="text-muted-foreground">Optimized for slow connections and limited data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Standard Mode */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Standard Mode</h2>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-success/20 h-32 flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Hero Banner (280KB)</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">State Merit Scholarship</h3>
                    <p className="text-sm text-muted-foreground">Full-color illustrations and graphics</p>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Service images and previews</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">Total page size: ~850KB</p>
                  <p className="text-muted-foreground">Load time on 2G: ~12 seconds</p>
                </div>
              </div>
            </div>
          </div>

          {/* Low-Bandwidth Mode */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-success" />
              <h2 className="text-lg font-semibold">Low-Bandwidth Mode</h2>
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">Active</span>
            </div>
            <div className="bg-card border border-success/30 rounded-xl overflow-hidden">
              <div className="bg-success/5 h-12 flex items-center justify-center border-b border-success/20">
                <p className="text-sm font-medium">Text-only banner (2KB)</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-success/10 rounded flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">State Merit Scholarship</h3>
                    <p className="text-sm text-muted-foreground">Text and essential icons only</p>
                  </div>
                </div>

                <div className="border border-success/20 rounded-lg p-4 bg-success/5">
                  <div className="space-y-2">
                    {['Eligibility criteria', 'Required documents', 'Application process'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1 h-1 bg-success rounded-full" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Bullet points instead of images</p>
                </div>

                <div className="bg-success/10 rounded-lg p-3 text-sm">
                  <p className="text-foreground font-medium">Total page size: ~45KB</p>
                  <p className="text-success">Load time on 2G: ~2 seconds</p>
                  <p className="text-xs text-muted-foreground mt-2">94% faster</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimizations */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-3">What's Removed</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Banner images and hero graphics</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Service preview thumbnails</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Decorative illustrations</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Gradient backgrounds</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Web fonts (system fonts used)</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-3">What's Kept</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>All text content and information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Essential icons (status, verification)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Full form functionality</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Status tracking and timelines</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Document upload capability</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-3">Performance Gains</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Page Load Speed</span>
                  <span className="text-sm font-semibold text-success">+94%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: '94%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Data Usage</span>
                  <span className="text-sm font-semibold text-success">-95%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: '95%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Battery Consumption</span>
                  <span className="text-sm font-semibold text-success">-60%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-detection */}
        <div className="mt-8 bg-info/10 border border-info/20 rounded-xl p-6">
          <h3 className="font-semibold mb-3">Smart Mode Detection</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Low-bandwidth mode automatically activates when the system detects:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-info" />
              <span>Slow connection speed (&lt;500 Kbps)</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-info" />
              <span>2G/EDGE network detected</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-info" />
              <span>Data saver mode enabled in browser</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-info" />
              <span>Manual activation by citizen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
