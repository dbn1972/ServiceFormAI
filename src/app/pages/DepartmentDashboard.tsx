import { TrendingUp, TrendingDown, BarChart3, CheckCircle, AlertTriangle, Target, Calendar, Download, Filter, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { producerService } from '../services/api/producer.service';

export default function DepartmentDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    producerService.getTenantAnalytics()
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (val: number | undefined) => loading ? '...' : (val ?? 0).toLocaleString();

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Department Dashboard</h1>
              <p className="text-muted-foreground">Education Department • Head: Dr. Anil Verma</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Month
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'].map((tab, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === 2
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Department KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Applications',
              value: fmt(analytics?.totalApplications),
              change: '',
              trend: 'up',
              icon: BarChart3,
              color: 'primary',
              subtext: 'All time',
            },
            {
              label: 'Completed',
              value: fmt(analytics?.completed),
              change: '',
              trend: 'up',
              icon: CheckCircle,
              color: 'success',
              subtext: 'Fully processed',
            },
            {
              label: 'Approved',
              value: fmt(analytics?.approved),
              change: '',
              trend: 'up',
              icon: CheckCircle,
              color: 'info',
              subtext: 'Approved applications',
            },
            {
              label: 'Pending Review',
              value: fmt(analytics?.pendingReview),
              change: '',
              trend: 'down',
              icon: Target,
              color: 'warning',
              subtext: 'Awaiting action',
            },
          ].map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${kpi.color}/10 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${kpi.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}>
                    {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{kpi.value}</p>
                <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-xs text-muted-foreground">{kpi.subtext}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Team & Performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Officer Performance Leaderboard */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Officer Performance</h2>
                  <p className="text-sm text-muted-foreground">Top performers this month</p>
                </div>
                <button className="text-sm text-primary hover:underline">View All Officers</button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    rank: 1,
                    name: 'Rajesh Kumar',
                    applications: 156,
                    approvalRate: 89,
                    avgTime: 3.2,
                    slaCompliance: 98,
                    badge: 'Top Performer',
                  },
                  {
                    rank: 2,
                    name: 'Priya Sharma',
                    applications: 142,
                    approvalRate: 91,
                    avgTime: 3.8,
                    slaCompliance: 96,
                    badge: null,
                  },
                  {
                    rank: 3,
                    name: 'Amit Patel',
                    applications: 138,
                    approvalRate: 85,
                    avgTime: 4.1,
                    slaCompliance: 94,
                    badge: null,
                  },
                  {
                    rank: 4,
                    name: 'Sneha Reddy',
                    applications: 129,
                    approvalRate: 88,
                    avgTime: 4.5,
                    slaCompliance: 92,
                    badge: null,
                  },
                  {
                    rank: 5,
                    name: 'Vikram Singh',
                    applications: 124,
                    approvalRate: 86,
                    avgTime: 4.8,
                    slaCompliance: 90,
                    badge: null,
                  },
                ].map((officer, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      officer.rank === 1 ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        officer.rank === 1 ? 'bg-warning text-warning-foreground' :
                        officer.rank === 2 ? 'bg-muted text-foreground' :
                        officer.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted/50 text-muted-foreground'
                      }`}>
                        #{officer.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{officer.name}</h3>
                          {officer.badge && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                              {officer.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{officer.applications} applications processed</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold">{officer.approvalRate}%</p>
                        <p className="text-xs text-muted-foreground">Approval</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold">{officer.avgTime}d</p>
                        <p className="text-xs text-muted-foreground">Avg Time</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold">{officer.slaCompliance}%</p>
                        <p className="text-xs text-muted-foreground">SLA</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workload Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Workload Distribution</h2>

              <div className="space-y-4">
                {[
                  { officer: 'Rajesh Kumar', assigned: 24, inProgress: 16, completed: 8, color: 'primary' },
                  { officer: 'Priya Sharma', assigned: 22, inProgress: 14, completed: 8, color: 'success' },
                  { officer: 'Amit Patel', assigned: 20, inProgress: 12, completed: 8, color: 'info' },
                  { officer: 'Sneha Reddy', assigned: 18, inProgress: 11, completed: 7, color: 'warning' },
                  { officer: 'Vikram Singh', assigned: 16, inProgress: 10, completed: 6, color: 'purple' },
                ].map((workload, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{workload.officer}</span>
                      <span className="text-sm text-muted-foreground">{workload.assigned} total</span>
                    </div>
                    <div className="h-8 flex rounded-lg overflow-hidden">
                      <div
                        className="bg-success flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(workload.completed / workload.assigned) * 100}%` }}
                      >
                        {workload.completed > 0 && `${workload.completed}`}
                      </div>
                      <div
                        className="bg-warning flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(workload.inProgress / workload.assigned) * 100}%` }}
                      >
                        {workload.inProgress > 0 && `${workload.inProgress}`}
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        Completed: {workload.completed}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-warning rounded-full"></div>
                        In Progress: {workload.inProgress}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Type Breakdown */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Applications by Service Type</h2>

              <div className="space-y-4">
                {[
                  { service: 'Scholarship Applications', count: 1245, percentage: 44, trend: 'up', change: '+12%' },
                  { service: 'Certificate Services', count: 892, percentage: 31, trend: 'up', change: '+8%' },
                  { service: 'License & Permits', count: 456, percentage: 16, trend: 'down', change: '-3%' },
                  { service: 'Grievances', count: 254, percentage: 9, trend: 'up', change: '+5%' },
                ].map((type, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{type.service}</h3>
                        <p className="text-sm text-muted-foreground">{type.count} applications</p>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        type.trend === 'up' ? 'text-success' : 'text-destructive'
                      }`}>
                        {type.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {type.change}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${type.percentage}%` }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{type.percentage}% of total applications</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Alerts & Insights */}
          <div className="space-y-6">
            {/* Critical Alerts */}
            <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold">Critical Alerts</h3>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-card border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">18 SLA Breaches This Week</p>
                  <p className="text-xs text-muted-foreground mb-2">Up from 12 last week</p>
                  <button className="text-xs text-destructive hover:underline font-medium">
                    Review Cases →
                  </button>
                </div>

                <div className="p-3 bg-card border border-warning/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">Officer Workload Imbalance</p>
                  <p className="text-xs text-muted-foreground mb-2">Reassign 12 applications</p>
                  <button className="text-xs text-warning hover:underline font-medium">
                    Redistribute →
                  </button>
                </div>
              </div>
            </div>

            {/* Department Goals */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Monthly Goals</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Applications Target</span>
                    <span className="text-sm font-semibold">2,847 / 3,000</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '95%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">95% complete • 153 to go</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">SLA Compliance Target</span>
                    <span className="text-sm font-semibold">94.2% / 95%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: '94.2%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Below target by 0.8%</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Citizen Satisfaction</span>
                    <span className="text-sm font-semibold">4.6 / 4.5</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: '102%' }}></div>
                  </div>
                  <p className="text-xs text-success mt-1">Target exceeded! 🎉</p>
                </div>
              </div>
            </div>

            {/* Team Stats */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Team Overview</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Officers</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Today</span>
                  <span className="font-semibold">10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">On Leave</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Load/Officer</span>
                  <span className="font-semibold">20 apps</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                  Manage Team
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 text-left px-4 flex items-center justify-between">
                  <span>Generate Monthly Report</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 text-left px-4 flex items-center justify-between">
                  <span>Review Team Capacity</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 text-left px-4 flex items-center justify-between">
                  <span>Configure Workflows</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-info" />
                </div>
                <h3 className="font-semibold">AI Insights</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-info">•</span>
                  <span>Peak application hours: 10 AM - 12 PM. Consider adding 2 more officers during this window.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info">•</span>
                  <span>Scholarship applications up 23% vs last year. Allocate more resources.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info">•</span>
                  <span>3 officers consistently exceed targets. Recommend for promotion.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
