import { Smartphone, Tablet, Monitor, Users } from 'lucide-react';

export default function ResponsiveLayouts() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Responsive Layouts</h1>
          <p className="text-muted-foreground">
            Mobile-first citizen screens, tablet views, and desktop admin consoles
          </p>
        </div>

        {/* Device Views */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {[
            { icon: Smartphone, label: 'Mobile (375px)', desc: 'Citizen primary device', color: 'primary' },
            { icon: Tablet, label: 'Tablet (768px)', desc: 'Assisted service mode', color: 'info' },
            { icon: Monitor, label: 'Desktop (1440px)', desc: 'Officer & admin console', color: 'success' },
          ].map((device, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 text-center">
              <div className={`w-16 h-16 bg-${device.color}/10 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <device.icon className={`w-8 h-8 text-${device.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{device.label}</h3>
              <p className="text-sm text-muted-foreground">{device.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile Examples */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Mobile Citizen Screens</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Service Feed', 'Wallet & Consent', 'Application Form'].map((screen, index) => (
              <div key={index} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 border-b border-border p-3">
                  <p className="text-sm font-medium text-center">{screen}</p>
                </div>
                <div className="aspect-[9/16] bg-gradient-to-br from-primary/5 to-success/5 flex items-center justify-center">
                  <div className="text-center">
                    <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">375 × 667px</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Examples */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Desktop Officer Console</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['Application Queue', 'Manifest Studio'].map((screen, index) => (
              <div key={index} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 border-b border-border p-3">
                  <p className="text-sm font-medium text-center">{screen}</p>
                </div>
                <div className="aspect-video bg-gradient-to-br from-info/5 to-success/5 flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">1440 × 900px</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assisted Mode */}
        <div className="bg-info/10 border border-info/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-info" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Assisted Service Mode</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tablet interface optimized for CSC operators and service center agents helping citizens complete applications. Larger touch targets, simplified navigation, and step-by-step guided flows.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-card rounded-lg p-3 text-center">
                  <p className="font-semibold mb-1">768px</p>
                  <p className="text-xs text-muted-foreground">Min width</p>
                </div>
                <div className="bg-card rounded-lg p-3 text-center">
                  <p className="font-semibold mb-1">2×</p>
                  <p className="text-xs text-muted-foreground">Touch targets</p>
                </div>
                <div className="bg-card rounded-lg p-3 text-center">
                  <p className="font-semibold mb-1">Large</p>
                  <p className="text-xs text-muted-foreground">Typography</p>
                </div>
                <div className="bg-card rounded-lg p-3 text-center">
                  <p className="font-semibold mb-1">Guided</p>
                  <p className="text-xs text-muted-foreground">Workflows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
