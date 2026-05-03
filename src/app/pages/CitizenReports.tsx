import { TrendingUp, FileText, Clock, Download, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { consumerService } from '../services/api/consumer.service';

export default function CitizenReports() {
  const [stats, setStats] = useState({ total: '–', active: '–', successRate: '–%', avgDays: '–' });

  useEffect(() => {
    consumerService.getMyApplications(undefined, { limit: 100 }).then((res) => {
      const apps = res.data;
      const total = apps.length;
      const active = apps.filter((a) => ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS'].includes(a.status)).length;
      const completed = apps.filter((a) => a.status === 'APPROVED' || a.status === 'COMPLETED').length;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setStats({ total: String(total), active: String(active), successRate: `${successRate}%`, avgDays: '8.5' });
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your service usage and application statistics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Applications', value: stats.total, icon: FileText, trend: 'All time', color: 'primary' },
            { label: 'Avg. Processing Time', value: stats.avgDays + ' days', icon: Clock, trend: 'Estimated', color: 'success' },
            { label: 'Success Rate', value: stats.successRate, icon: TrendingUp, trend: 'Approved / Total', color: 'info' },
            { label: 'Active Services', value: stats.active, icon: Activity, trend: 'In progress', color: 'warning' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 bg-${stat.color}/10 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-xs text-success">{stat.trend}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Applications by Month */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Applications by Month</h2>
              <button className="text-sm text-primary hover:underline">View Details</button>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {[3, 5, 2, 4, 6, 4, 3, 5, 2, 4, 5, 3].map((height, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary/20 hover:bg-primary/30 rounded-t transition-colors cursor-pointer"
                    style={{ height: `${(height / 6) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Applications by Category */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Applications by Category</h2>
              <button className="text-sm text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { category: 'Transport', count: 4, percentage: 33, color: 'bg-blue-500' },
                { category: 'Education', count: 3, percentage: 25, color: 'bg-green-500' },
                { category: 'Revenue', count: 2, percentage: 17, color: 'bg-yellow-500' },
                { category: 'Civil Registration', count: 2, percentage: 17, color: 'bg-purple-500' },
                { category: 'Others', count: 1, percentage: 8, color: 'bg-gray-500' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Processing Time Trends */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Processing Time Trends</h2>
            <select className="px-3 py-1.5 bg-input-background border border-border rounded-lg text-sm">
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="h-48 relative">
            <svg className="w-full h-full">
              <polyline
                points="0,150 100,120 200,140 300,100 400,110 500,80 600,90 700,60"
                fill="none"
                stroke="rgb(30, 64, 175)"
                strokeWidth="3"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>

        {/* Download Report */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Download Detailed Report</h3>
              <p className="text-sm text-muted-foreground">Get a comprehensive PDF report of your service history</p>
            </div>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
