import { MapPin, FileText, Droplet, Lightbulb, Trash2, Building } from 'lucide-react';

export default function MunicipalityPack() {
  const services = [
    { icon: FileText, label: 'Birth Certificate', color: 'primary', count: 45 },
    { icon: FileText, label: 'Death Certificate', color: 'info', count: 28 },
    { icon: Building, label: 'Trade License', color: 'success', count: 156 },
    { icon: Droplet, label: 'Water Connection', color: 'consent', count: 89 },
    { icon: Lightbulb, label: 'Streetlight Complaints', color: 'warning', count: 234 },
    { icon: Trash2, label: 'Garbage Complaints', color: 'grievance', count: 178 },
  ];

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Municipality Pack</h1>
          <p className="text-muted-foreground">City Municipal Corporation - Ward Management Dashboard</p>
        </div>

        {/* Municipality Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Municipality Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">City:</span>
                <span className="font-medium">Pune Municipal Corporation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Wards:</span>
                <span className="font-medium">48</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Services:</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6">
            <h3 className="font-semibold mb-4">This Month</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applications:</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grievances:</span>
                <span className="font-medium">567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolved:</span>
                <span className="font-medium text-success">89%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Attention Needed</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending:</span>
                <span className="font-medium text-warning">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SLA Breached:</span>
                <span className="font-medium text-destructive">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Escalated:</span>
                <span className="font-medium text-destructive">5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Templates */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6">Service Templates</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map((service, index) => (
              <button
                key={index}
                className="bg-muted/50 hover:bg-muted rounded-xl p-4 text-center transition-colors"
              >
                <div className={`w-12 h-12 bg-${service.color}/10 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <service.icon className={`w-6 h-6 text-${service.color}`} />
                </div>
                <p className="text-sm font-medium mb-1">{service.label}</p>
                <p className="text-xs text-muted-foreground">{service.count} active</p>
              </button>
            ))}
          </div>
        </div>

        {/* Ward Map & Grievances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ward Map Placeholder */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/30 border-b border-border p-4">
              <h3 className="font-semibold">Ward Map</h3>
            </div>
            <div className="aspect-square bg-gradient-to-br from-primary/5 to-success/5 flex items-center justify-center relative">
              <div className="absolute inset-0 grid grid-cols-4 gap-1 p-4">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-lg ${
                      i === 5 || i === 9 ? 'bg-warning/30' :
                      i === 3 || i === 7 ? 'bg-destructive/30' :
                      'bg-success/20'
                    } hover:scale-105 transition-transform cursor-pointer flex items-center justify-center`}
                  >
                    <span className="text-xs font-semibold">W{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success/30 rounded" />
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning/30 rounded" />
                  <span>High Load</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive/30 rounded" />
                  <span>SLA Breach</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Grievances */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/30 border-b border-border p-4">
              <h3 className="font-semibold">Recent Grievances</h3>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {[
                { type: 'Streetlight', ward: 'Ward 12', status: 'In Progress', priority: 'high' },
                { type: 'Garbage', ward: 'Ward 5', status: 'Assigned', priority: 'normal' },
                { type: 'Road Repair', ward: 'Ward 8', status: 'Resolved', priority: 'normal' },
                { type: 'Water Leakage', ward: 'Ward 3', status: 'In Progress', priority: 'urgent' },
                { type: 'Streetlight', ward: 'Ward 15', status: 'Assigned', priority: 'normal' },
              ].map((grievance, index) => (
                <div key={index} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{grievance.type}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      grievance.status === 'Resolved' ? 'bg-success/10 text-success' :
                      grievance.status === 'In Progress' ? 'bg-pending/10 text-pending' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {grievance.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{grievance.ward}</span>
                    {grievance.priority === 'urgent' && (
                      <span className="text-destructive font-medium">• Urgent</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
