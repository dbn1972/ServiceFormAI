import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Settings, BarChart3, FileText, CheckCircle, Clock, Sparkles, Rocket, Grid3x3, Bell, TrendingUp, Activity, Palette, Code } from 'lucide-react';
import TenantJourneyChecklist, { JourneyStep } from '../components/TenantJourneyChecklist';
import { ALL_SERVICE_TEMPLATES } from '../data/serviceTemplates';
import { producerService } from '../services/api/producer.service';
import type { TenantService } from '../shared/types';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'published' | 'drafts'>('published');
  const [analytics, setAnalytics] = useState<any>(null);
  const [publishedServices, setPublishedServices] = useState<TenantService[]>([]);

  useEffect(() => {
    producerService.getTenantAnalytics().then(setAnalytics).catch(() => {});
    producerService.getServices({ page: 1, limit: 100 })
      .then((r: any) => setPublishedServices(r.data.filter((s: TenantService) => s.isPublished)))
      .catch(() => {});
  }, []);

  const totalPublishedServices = analytics?.totalServices ?? publishedServices.length;
  const totalApplications = analytics?.totalApplications ?? 0;
  const pendingApplications = analytics?.pendingReview ?? 0;
  const approvedApplications = analytics?.approved ?? 0;

  // Journey steps for the checklist (updated to show progress)
  const journeySteps: JourneyStep[] = [
    { id: 'org', label: 'Organization Registered', status: 'completed', route: '/tenant/onboarding' },
    { id: 'admin', label: 'Admin Account Created', status: 'completed' },
    {
      id: 'service',
      label: 'Publish Your First Service',
      status: 'completed',
      route: '/tenant/dashboard',
      estimatedMinutes: 2,
      substeps: [
        { id: 'review', label: 'Review pre-built templates', status: 'completed' },
        { id: 'customize', label: 'Customize if needed', status: 'completed' },
        { id: 'publish', label: 'Publish', status: 'completed' },
      ]
    },
    { id: 'team', label: 'Invite Officer Team', status: 'completed', optional: true, estimatedMinutes: 2 },
    { id: 'workflow', label: 'Configure Workflow', status: 'active', optional: true, estimatedMinutes: 3 },
  ];

  // Pre-populated templates (shown as draft services)
  const draftServices = ALL_SERVICE_TEMPLATES.map(template => ({
    id: template.id,
    template: template,
    name: template.name,
    category: template.category,
    status: 'draft',
    applications: 0,
    lastEdited: 'Pre-built template',
    fieldsCount: template.fields.length,
    documentsCount: template.documents.length,
  }));

  const toggleSelect = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const selectAll = () => {
    setSelectedServices(draftServices.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedServices([]);
  };

  const handlePublishAll = () => {
    navigate('/tenant/templates');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Journey Checklist Sidebar */}
      <TenantJourneyChecklist
        steps={journeySteps}
        currentStep="service"
        estimatedTimeRemaining={5}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Tenant Dashboard</h1>
                <p className="text-muted-foreground">State Welfare Department - Maharashtra</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="relative p-3 hover:bg-muted rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  View Activity
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Active Services', value: totalPublishedServices.toString(), icon: FileText, color: 'primary', trend: '+2 this week' },
              { label: 'Total Applications', value: totalApplications.toLocaleString(), icon: BarChart3, color: 'info', trend: '+12% vs last month' },
              { label: 'Pending Review', value: pendingApplications.toString(), icon: Clock, color: 'warning', trend: '2 urgent' },
              { label: 'Approved', value: approvedApplications.toLocaleString(), icon: CheckCircle, color: 'success', trend: totalApplications > 0 ? `${Math.round((approvedApplications / totalApplications) * 100)}% rate` : '—' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={`w-5 h-5 text-${stat.color}`} />
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <p className="text-3xl font-bold mb-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </p>
                </div>
              );
            })}
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setViewMode('published')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'published'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Published Services ({totalPublishedServices})
            </button>
            <button
              onClick={() => setViewMode('drafts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'drafts'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Draft Templates ({ALL_SERVICE_TEMPLATES.length - totalPublishedServices})
            </button>
          </div>

          {/* Published Services View */}
          {viewMode === 'published' && (
            <div className="bg-card border border-border rounded-xl mb-8">
              <div className="border-b border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                      Live Services
                      <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-medium">
                        {totalPublishedServices} Active
                      </span>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Currently accepting citizen applications
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/tenant/analytics')}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {publishedServices.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No published services yet. Publish a template to get started.</p>
                  </div>
                ) : publishedServices.map((service) => (
                  <div key={service.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{service.name}</h3>
                          <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Live
                          </span>
                          <span className="px-2 py-0.5 bg-muted rounded text-xs">
                            {service.category}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Draft Templates View */}
          {viewMode === 'drafts' && (
            <>
              <div className="bg-gradient-to-r from-success/10 to-primary/10 border-2 border-success/30 rounded-2xl p-8 mb-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium mb-3">
                      <CheckCircle className="w-3 h-3" />
                      {ALL_SERVICE_TEMPLATES.length - totalPublishedServices} More Templates Available
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Publish more services to expand coverage</h2>
                    <p className="text-muted-foreground mb-6">
                      We've pre-configured <strong>{ALL_SERVICE_TEMPLATES.length - totalPublishedServices} additional government services</strong> ready to publish.
                      All services include forms, eligibility rules, and DigiLocker integration.
                      <strong> Review and publish them in 1 click</strong>, or customize as needed.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={selectAll}
                        className="px-6 py-3 bg-success text-success-foreground rounded-lg font-semibold hover:bg-success/90 transition-colors flex items-center gap-2"
                      >
                        <Rocket className="w-5 h-5" />
                        Select All & Publish ({draftServices.length})
                      </button>
                      <button
                        onClick={() => navigate('/tenant/templates')}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Grid3x3 className="w-5 h-5" />
                        Browse All Templates
                      </button>
                      <button
                        onClick={() => navigate('/tenant/service/create')}
                        className="px-6 py-3 border-2 border-border rounded-lg font-semibold hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Create Custom Service
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services List - Pre-Built Templates */}
              <div className="bg-card border border-border rounded-xl">
            <div className="border-b border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    Pre-Built Service Templates
                    <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-medium">
                      {draftServices.length} Ready
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Review, customize (optional), and publish these production-ready services
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/tenant/templates')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Grid3x3 className="w-4 h-4" />
                    Browse All
                  </button>
                  <button
                    onClick={() => navigate('/tenant/service/create')}
                    className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Custom
                  </button>
                </div>
              </div>

              {/* Batch Actions */}
              {selectedServices.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={deselectAll}
                      className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={handlePublishAll}
                      className="px-4 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors flex items-center gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      Publish Selected ({selectedServices.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="divide-y divide-border">
              {draftServices.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <div key={service.id} className={`p-6 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(service.id)}
                          className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{service.name}</h3>
                          <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Pre-built
                          </span>
                          <span className="px-2 py-0.5 bg-warning/10 text-warning rounded-full text-xs font-medium">
                            Draft
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {service.template.description}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {service.fieldsCount} fields
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {service.documentsCount} documents
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            SLA: {service.template.sla}
                          </span>
                          <span className="px-2 py-0.5 bg-muted rounded text-xs">
                            {service.category}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                        <button
                          onClick={() => navigate(`/tenant/service/create?template=${service.id}`)}
                          className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Customize
                        </button>
                        <button
                          className="px-4 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors flex items-center gap-2"
                        >
                          <Rocket className="w-4 h-4" />
                          Publish Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <button
              onClick={() => navigate('/tenant/white-label')}
              className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <Palette className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">White-Label & Branding</h3>
              <p className="text-sm text-muted-foreground">Customize logo, colors, domain</p>
            </button>

            <button
              onClick={() => navigate('/tenant/api-integration/new')}
              className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <Code className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">API Integration</h3>
              <p className="text-sm text-muted-foreground">Connect external services</p>
            </button>

            <button
              onClick={() => navigate('/tenant/service/workflow')}
              className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <Settings className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Configure Workflows</h3>
              <p className="text-sm text-muted-foreground">Set up approval and routing rules</p>
            </button>

            <button
              onClick={() => navigate('/tenant/analytics')}
              className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-left"
            >
              <BarChart3 className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">View Analytics</h3>
              <p className="text-sm text-muted-foreground">Track performance and metrics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
