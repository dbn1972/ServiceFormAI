import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Download,
  ArrowUp,
  ArrowDown,
  Target,
  ThumbsUp,
  Activity
} from 'lucide-react';
import { ALL_SERVICE_TEMPLATES, TEMPLATES_BY_CATEGORY } from '../data/serviceTemplates';
import { producerService } from '../services/api/producer.service';

// Deterministic metric generator — stable per serviceId, no Math.random()
function hashCode(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // convert to 32-bit integer
  }
  return Math.abs(hash);
}

const generateServiceMetrics = (serviceId: string, serviceName: string) => {
  const h = hashCode(serviceId);
  const baseApps = (h % 4000) + 1000;
  const approvalRate = (h % 30) + 65;
  const avgProcessingDays = (h % 15) + 3;

  return {
    serviceId,
    serviceName,
    totalApplications: baseApps,
    approvalRate,
    avgProcessingDays,
    pending: Math.floor(baseApps * 0.15),
    approved: Math.floor(baseApps * (approvalRate / 100)),
    rejected: Math.floor(baseApps * ((100 - approvalRate) / 100)),
    slaCompliance: ((h >> 4) % 20) + 75,
    citizenSatisfaction: ((h >> 8) % 15) + 80,
    growth: (((h % 400) - 100) / 10).toFixed(1) // -10.0% to +30.0%
  };
};

export default function AdvancedAnalytics() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liveAnalytics, setLiveAnalytics] = useState<any>(null);

  useEffect(() => {
    producerService.getTenantAnalytics().then(setLiveAnalytics).catch(() => {});
  }, []);

  // Generate metrics for all templates
  const allServiceMetrics = ALL_SERVICE_TEMPLATES.map(template =>
    generateServiceMetrics(template.id, template.name)
  );

  // Filter by category if selected
  const filteredMetrics = selectedCategory
    ? allServiceMetrics.filter(m => {
        const template = ALL_SERVICE_TEMPLATES.find(t => t.id === m.serviceId);
        return template?.category === selectedCategory;
      })
    : allServiceMetrics;

  // Calculate aggregate metrics — prefer live API data for top-level totals
  const totalApplications = liveAnalytics?.totalApplications ?? filteredMetrics.reduce((sum, m) => sum + m.totalApplications, 0);
  const totalApproved = liveAnalytics?.approved ?? filteredMetrics.reduce((sum, m) => sum + m.approved, 0);
  const totalPending = liveAnalytics?.pendingReview ?? filteredMetrics.reduce((sum, m) => sum + m.pending, 0);
  const totalRejected = filteredMetrics.reduce((sum, m) => sum + m.rejected, 0);
  const avgApprovalRate = (totalApproved / totalApplications * 100).toFixed(1);
  const avgSLACompliance = (filteredMetrics.reduce((sum, m) => sum + m.slaCompliance, 0) / filteredMetrics.length).toFixed(1);
  const avgSatisfaction = (filteredMetrics.reduce((sum, m) => sum + m.citizenSatisfaction, 0) / filteredMetrics.length).toFixed(1);

  // Top performing services
  const topByVolume = [...filteredMetrics].sort((a, b) => b.totalApplications - a.totalApplications).slice(0, 5);
  const topByApproval = [...filteredMetrics].sort((a, b) => b.approvalRate - a.approvalRate).slice(0, 5);
  const topBySLA = [...filteredMetrics].sort((a, b) => b.slaCompliance - a.slaCompliance).slice(0, 5);

  // Category performance
  const categories = Object.keys(TEMPLATES_BY_CATEGORY);
  const categoryMetrics = categories.map(category => {
    const categoryTemplates = TEMPLATES_BY_CATEGORY[category] ?? [];
    const categoryData = allServiceMetrics.filter(m =>
      categoryTemplates.some(t => t.id === m.serviceId)
    );
    const total = categoryData.reduce((sum, m) => sum + m.totalApplications, 0);
    const approved = categoryData.reduce((sum, m) => sum + m.approved, 0);
    const sla = categoryData.length > 0 ? categoryData.reduce((sum, m) => sum + m.slaCompliance, 0) / categoryData.length : 0;

    return {
      category,
      total,
      approvalRate: total > 0 ? (approved / total * 100).toFixed(1) : '0.0',
      slaCompliance: sla.toFixed(1),
      servicesCount: categoryTemplates.length
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/tenant/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
                <p className="text-muted-foreground">
                  Comprehensive insights across all {ALL_SERVICE_TEMPLATES.length} service templates
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-muted'
            }`}
          >
            All Categories
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-muted'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Applications',
              value: totalApplications.toLocaleString(),
              change: '+12.5%',
              trend: 'up',
              icon: FileText,
              color: 'primary'
            },
            {
              label: 'Approval Rate',
              value: `${avgApprovalRate}%`,
              change: '+3.2%',
              trend: 'up',
              icon: CheckCircle,
              color: 'success'
            },
            {
              label: 'SLA Compliance',
              value: `${avgSLACompliance}%`,
              change: '+5.8%',
              trend: 'up',
              icon: Target,
              color: 'info'
            },
            {
              label: 'Citizen Satisfaction',
              value: `${avgSatisfaction}%`,
              change: '+2.1%',
              trend: 'up',
              icon: ThumbsUp,
              color: 'warning'
            }
          ].map((metric, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
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

        {/* Application Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { status: 'Approved', count: totalApproved, color: 'success', icon: CheckCircle },
            { status: 'Pending Review', count: totalPending, color: 'warning', icon: Clock },
            { status: 'Rejected', count: totalRejected, color: 'destructive', icon: XCircle }
          ].map(item => (
            <div key={item.status} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 bg-${item.color}/10 rounded-lg flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 text-${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{item.status}</p>
                  <p className="text-2xl font-bold">{item.count.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${item.color}`}
                  style={{ width: `${(item.count / totalApplications * 100).toFixed(0)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(item.count / totalApplications * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>

        {/* Category Performance */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance by Category
          </h3>
          <div className="space-y-4">
            {categoryMetrics.map((cat, index) => (
              <div key={cat.category} className="flex items-center gap-4">
                <div className="w-8 text-center">
                  <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{cat.category}</h4>
                      <p className="text-xs text-muted-foreground">{cat.servicesCount} services</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{cat.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">applications</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground">Approval Rate:</span>
                      <span className="font-semibold">{cat.approvalRate}%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground">SLA Compliance:</span>
                      <span className="font-semibold">{cat.slaCompliance}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* By Volume */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Highest Volume
            </h3>
            <div className="space-y-3">
              {topByVolume.map((service, index) => (
                <div key={service.serviceId} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                    index === 1 ? 'bg-gray-400/20 text-gray-600' :
                    index === 2 ? 'bg-orange-500/20 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{service.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{service.totalApplications.toLocaleString()} apps</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Approval Rate */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Best Approval Rate
            </h3>
            <div className="space-y-3">
              {topByApproval.map((service, index) => (
                <div key={service.serviceId} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                    index === 1 ? 'bg-gray-400/20 text-gray-600' :
                    index === 2 ? 'bg-orange-500/20 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{service.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{service.approvalRate}% approved</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By SLA Compliance */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-info" />
              Best SLA Compliance
            </h3>
            <div className="space-y-3">
              {topBySLA.map((service, index) => (
                <div key={service.serviceId} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                    index === 1 ? 'bg-gray-400/20 text-gray-600' :
                    index === 2 ? 'bg-orange-500/20 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{service.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{service.slaCompliance}% on-time</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Services Performance Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              All Services Performance ({filteredMetrics.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold">Service Name</th>
                  <th className="text-right p-4 text-sm font-semibold">Applications</th>
                  <th className="text-right p-4 text-sm font-semibold">Approval Rate</th>
                  <th className="text-right p-4 text-sm font-semibold">Avg Processing</th>
                  <th className="text-right p-4 text-sm font-semibold">SLA Compliance</th>
                  <th className="text-right p-4 text-sm font-semibold">Satisfaction</th>
                  <th className="text-right p-4 text-sm font-semibold">Growth</th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.slice(0, 15).map((service) => (
                  <tr key={service.serviceId} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{service.serviceName}</p>
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {service.totalApplications.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.approvalRate >= 80 ? 'bg-success/10 text-success' :
                        service.approvalRate >= 60 ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {service.approvalRate}%
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm">
                      {service.avgProcessingDays} days
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.slaCompliance >= 85 ? 'bg-success/10 text-success' :
                        service.slaCompliance >= 70 ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {service.slaCompliance}%
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm">
                      {service.citizenSatisfaction}%
                    </td>
                    <td className="p-4 text-right">
                      <span className={`flex items-center justify-end gap-1 text-xs font-medium ${
                        parseFloat(service.growth) > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {parseFloat(service.growth) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {service.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMetrics.length > 15 && (
            <div className="p-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Showing 15 of {filteredMetrics.length} services.{' '}
                <button className="text-primary hover:underline">View all services →</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
