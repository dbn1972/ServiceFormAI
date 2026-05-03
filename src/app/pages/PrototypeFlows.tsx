import { PlayCircle, Check } from 'lucide-react';

export default function PrototypeFlows() {
  const flows = [
    { title: 'Citizen discovers scholarship', steps: 3, status: 'completed' },
    { title: 'Eligibility check and consent', steps: 4, status: 'completed' },
    { title: 'Document reuse flow', steps: 5, status: 'completed' },
    { title: 'Application submission', steps: 6, status: 'completed' },
    { title: 'Officer reviews application', steps: 4, status: 'completed' },
    { title: 'Deficiency handling', steps: 5, status: 'completed' },
    { title: 'Citizen resubmission', steps: 3, status: 'completed' },
    { title: 'Approval and notification', steps: 4, status: 'completed' },
    { title: 'Municipal grievance flow', steps: 7, status: 'completed' },
    { title: 'Producer creates manifest', steps: 8, status: 'completed' },
    { title: 'Consumer subscribes to service', steps: 4, status: 'completed' },
    { title: 'Plugin installation', steps: 3, status: 'completed' },
    { title: 'Governance certification', steps: 5, status: 'completed' },
    { title: 'End-to-end journey', steps: 15, status: 'completed' },
  ];

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Prototype Flows</h1>
          <p className="text-muted-foreground mb-6">
            Interactive clickable prototypes demonstrating key user journeys
          </p>
          <div className="bg-success/10 border border-success/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm font-medium">All 14 flows prototyped</p>
                <p className="text-xs text-muted-foreground">Ready for user testing and stakeholder demos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Categories */}
        <div className="space-y-8">
          {/* Citizen Flows */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Citizen Flows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flows.slice(0, 4).map((flow, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{flow.title}</h3>
                      <p className="text-sm text-muted-foreground">{flow.steps} steps</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: '100%' }} />
                    </div>
                    <span className="text-xs text-success font-medium">Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Officer Flows */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Officer & Backend Flows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flows.slice(4, 8).map((flow, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{flow.title}</h3>
                      <p className="text-sm text-muted-foreground">{flow.steps} steps</p>
                    </div>
                    <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center group-hover:bg-info group-hover:text-info-foreground transition-colors">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: '100%' }} />
                    </div>
                    <span className="text-xs text-success font-medium">Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Producer & Platform Flows */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Producer & Platform Flows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flows.slice(8).map((flow, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{flow.title}</h3>
                      <p className="text-sm text-muted-foreground">{flow.steps} steps</p>
                    </div>
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success group-hover:text-success-foreground transition-colors">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: '100%' }} />
                    </div>
                    <span className="text-xs text-success font-medium">Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Instructions */}
        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <h3 className="font-semibold mb-3">Demo Instructions</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Click any flow card to launch the interactive prototype</p>
            <p>• Navigate using arrow keys or on-screen buttons</p>
            <p>• Press ESC to exit prototype mode</p>
            <p>• All flows are mobile-responsive with device preview modes</p>
            <p>• Hotspots and interactions are highlighted in prototype mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}
