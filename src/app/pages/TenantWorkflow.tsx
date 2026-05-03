import { Search, Filter, Download, Eye, CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export default function TenantWorkflow() {
  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tenant Workflow OS</h1>
          <p className="text-muted-foreground">State Welfare Department - Scholarship Applications</p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Applications', value: '2,847', icon: TrendingUp, color: 'primary', change: '+12%' },
            { label: 'Pending Review', value: '156', icon: Clock, color: 'warning', change: '-8%' },
            { label: 'Approved', value: '2,234', icon: CheckCircle, color: 'success', change: '+15%' },
            { label: 'SLA Breached', value: '12', icon: AlertTriangle, color: 'destructive', change: '-5%' },
          ].map((stat, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}/10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-success">{stat.change}</span>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Application Queue */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          {/* Queue header */}
          <div className="border-b border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Application Queue</h2>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Search and filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or mobile..."
                  className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button className="px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-4">
              {[
                { label: 'All', count: 2847 },
                { label: 'Pending Review', count: 156, active: true },
                { label: 'Deficiency', count: 43 },
                { label: 'Approved', count: 2234 },
                { label: 'Rejected', count: 45 },
              ].map((tab, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab.active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Application list */}
          <div className="divide-y divide-border">
            {[
              {
                id: 'SCH-2026-001234',
                name: 'Ananya Sharma',
                applied: '15 Apr 2026',
                status: 'pending',
                sla: '25 days left',
                priority: 'normal',
              },
              {
                id: 'SCH-2026-001235',
                name: 'Rajesh Kumar',
                applied: '14 Apr 2026',
                status: 'deficiency',
                sla: '3 days left',
                priority: 'high',
              },
              {
                id: 'SCH-2026-001236',
                name: 'Priya Patel',
                applied: '13 Apr 2026',
                status: 'pending',
                sla: '27 days left',
                priority: 'normal',
              },
              {
                id: 'SCH-2026-001237',
                name: 'Amit Singh',
                applied: '12 Apr 2026',
                status: 'pending',
                sla: '28 days left',
                priority: 'normal',
              },
              {
                id: 'SCH-2026-001238',
                name: 'Sneha Reddy',
                applied: '10 Apr 2026',
                status: 'pending',
                sla: '2 days left',
                priority: 'urgent',
              },
            ].map((app, index) => (
              <div key={index} className="p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-6">
                  {/* Priority indicator */}
                  <div className={`w-1 h-16 rounded-full ${
                    app.priority === 'urgent' ? 'bg-destructive' :
                    app.priority === 'high' ? 'bg-warning' :
                    'bg-muted'
                  }`} />

                  {/* Application info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{app.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        app.status === 'pending' ? 'bg-pending/10 text-pending' :
                        app.status === 'deficiency' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {app.status === 'pending' ? 'Pending Review' : 'Deficiency Raised'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>ID: {app.id}</span>
                      <span>Applied: {app.applied}</span>
                      <span className={`flex items-center gap-1 ${
                        app.priority === 'urgent' ? 'text-destructive font-medium' :
                        app.priority === 'high' ? 'text-warning font-medium' :
                        ''
                      }`}>
                        <Clock className="w-3 h-3" />
                        {app.sla}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="border-t border-border p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing 1-5 of 156 applications
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
                  Previous
                </button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
