import { TrendingUp, FileText, CheckCircle, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { producerService } from '../services/api/producer.service';

export default function AdminAnalytics() {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-muted-foreground">System-wide metrics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Applications', value: fmt(analytics?.totalApplications), change: '', trend: 'neutral', icon: TrendingUp, color: 'info' },
            { label: 'Active Services', value: fmt(analytics?.totalServices), change: '', trend: 'neutral', icon: FileText, color: 'success' },
            { label: 'Pending Review', value: fmt(analytics?.pendingReview), change: '', trend: 'neutral', icon: Clock, color: 'warning' },
            { label: 'Approved', value: fmt(analytics?.approved), change: '', trend: 'up', icon: CheckCircle, color: 'primary' },
          ].map((metric, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${metric.color}/10 rounded-lg flex items-center justify-center`}>
                  <metric.icon className={`w-6 h-6 text-${metric.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  metric.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                  {metric.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {metric.change}
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Service Performance */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Top Performing Services</h3>
            <div className="space-y-4">
              {[
                { name: 'Scholarship Applications', applications: 45234, approval: 89, color: 'primary' },
                { name: 'Birth Certificates', applications: 32156, approval: 95, color: 'success' },
                { name: 'Income Certificates', applications: 28942, approval: 91, color: 'info' },
                { name: 'Trade Licenses', applications: 15678, approval: 78, color: 'warning' },
                { name: 'Streetlight Complaints', applications: 12456, approval: 85, color: 'grievance' },
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{service.name}</p>
                      <span className="text-sm font-semibold">{service.approval}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full bg-${service.color}`} style={{ width: `${service.approval}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{service.applications.toLocaleString()} applications</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Application Status</h3>
            <div className="space-y-4">
              {[
                { status: 'Approved', count: 2234, color: 'success', percent: 68 },
                { status: 'Pending', count: 567, color: 'warning', percent: 17 },
                { status: 'Under Review', count: 345, color: 'info', percent: 11 },
                { status: 'Rejected', count: 134, color: 'destructive', percent: 4 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 bg-${item.color} rounded-full`} />
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.percent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Department Performance</h3>
            <div className="space-y-4">
              {[
                { dept: 'State Welfare', sla: 94, apps: 15234, color: 'success' },
                { dept: 'Municipal Corporation', sla: 87, apps: 12456, color: 'success' },
                { dept: 'Education Board', sla: 78, apps: 8923, color: 'warning' },
                { dept: 'Revenue Department', sla: 71, apps: 7654, color: 'warning' },
              ].map((dept, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{dept.dept}</p>
                    <span className={`text-sm font-semibold ${
                      dept.sla >= 90 ? 'text-success' : dept.sla >= 75 ? 'text-warning' : 'text-destructive'
                    }`}>
                      {dept.sla}% SLA
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{dept.apps.toLocaleString()} applications processed</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">System Health</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">API Uptime</span>
                  <span className="text-sm font-semibold text-success">99.9%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: '99.9%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Consent Compliance</span>
                  <span className="text-sm font-semibold text-success">100%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Document Verification Rate</span>
                  <span className="text-sm font-semibold text-success">97.8%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: '97.8%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Avg Page Load Time</span>
                  <span className="text-sm font-semibold text-warning">1.2s</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
