import { Settings, Plus, Edit, Trash2, Eye, EyeOff, CheckCircle, FileText, Users, Save } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { producerService } from '../services/api/producer.service';
import type { TenantService, TenantUser } from '../shared/types';

export default function DepartmentServiceConfig() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');

  // Services state
  const [services, setServices] = useState<TenantService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Officers state
  const [officers, setOfficers] = useState<TenantUser[]>([]);
  const [officersLoading, setOfficersLoading] = useState(false);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const res = await producerService.getServices({ page: 1, limit: 100 });
      setServices(res.data ?? []);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const loadOfficers = useCallback(async () => {
    setOfficersLoading(true);
    try {
      const res = await producerService.getTenantUsers();
      setOfficers(res);
    } catch {
      toast.error('Failed to load officers');
    } finally {
      setOfficersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (activeTab === 'officers') {
      loadOfficers();
    }
  }, [activeTab, loadOfficers]);

  const handlePublish = async (id: string) => {
    try {
      await producerService.publishService(id);
      toast.success('Service published');
      loadServices();
    } catch {
      toast.error('Failed to publish service');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await producerService.unpublishService(id);
      toast.success('Service unpublished');
      loadServices();
    } catch {
      toast.error('Failed to unpublish service');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await producerService.deleteService(id);
      toast.success('Service deleted');
      setServices(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error('Failed to delete service');
    }
  };

  const published = services.filter(s => s.isPublished);
  const drafts = services.filter(s => !s.isPublished);

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Service Configuration</h1>
              <p className="text-muted-foreground">Manage and configure department services</p>
            </div>
            <button
              onClick={() => navigate('/tenant/service/create')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
              <Plus className="w-5 h-5" />
              Create New Service
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {[
            { id: 'services', label: 'Services', icon: FileText },
            { id: 'workflows', label: 'Workflows', icon: Settings },
            { id: 'officers', label: 'Officers', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Services', value: published.length.toString(), icon: CheckCircle, color: 'success' },
                { label: 'Draft Services', value: drafts.length.toString(), icon: Edit, color: 'warning' },
                { label: 'Total Services', value: services.length.toString(), icon: FileText, color: 'primary' },
                { label: 'Total Applications', value: '—', icon: FileText, color: 'muted' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 text-${stat.color}`} />
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Services List */}
            {servicesLoading ? (
              <div className="py-16 text-center text-muted-foreground">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No services yet.{' '}
                <button onClick={() => navigate('/tenant/service/create')} className="text-primary hover:underline">
                  Create your first service
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{service.name}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              service.isPublished
                                ? 'bg-success/10 text-success'
                                : 'bg-warning/10 text-warning'
                            }`}
                          >
                            {service.isPublished ? '● Published' : '● Draft'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Category: {service.category}</span>
                          {service.slaDays && <span>SLA: {service.slaDays} days</span>}
                          {service.fees !== undefined && service.fees !== null && (
                            <span>Fee: {service.fees === 0 ? 'Free' : `₹${service.fees}`}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => navigate(`/tenant/service/create?edit=${service.id}`)}
                          className="p-2 border border-border rounded-lg hover:bg-accent"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/service/${service.id}`)}
                          className="p-2 border border-border rounded-lg hover:bg-accent"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Publish / Unpublish */}
                    <div className="pt-4 border-t border-border flex items-center gap-3">
                      {service.isPublished ? (
                        <button
                          onClick={() => handleUnpublish(service.id)}
                          className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent flex items-center gap-2"
                        >
                          <EyeOff className="w-4 h-4" />
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublish(service.id)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Publish Service
                        </button>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        Updated {new Date(service.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="space-y-6">
            <div className="bg-info/10 border border-info/20 rounded-xl p-6">
              <Settings className="w-12 h-12 text-info mb-4" />
              <h3 className="font-semibold mb-2">Workflow Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure approval workflows, SLA rules, auto-approval conditions, and notification triggers for each service.
              </p>
              <button className="px-6 py-2 bg-info text-info-foreground rounded-lg font-medium hover:bg-info/90">
                Configure Workflows
              </button>
            </div>

            {/* Example Workflow Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Birth Certificate Workflow</h3>
              <div className="space-y-3">
                {[
                  { step: 'Document Auto-Verification', status: 'enabled', desc: 'DigiLocker docs verified automatically' },
                  { step: 'Eligibility Check', status: 'enabled', desc: 'Age, location, and completeness checks' },
                  { step: 'Officer Review', status: 'enabled', desc: 'Assigned to officer based on workload' },
                  { step: 'Auto-Approval (if eligible)', status: 'enabled', desc: 'Skip officer review for clear cases' },
                  { step: 'Final Approval', status: 'enabled', desc: 'Department head approval for flagged cases' },
                ].map((workflow, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{workflow.step}</p>
                      <p className="text-sm text-muted-foreground">{workflow.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-3 py-1 bg-success/10 text-success rounded-full font-medium">
                        {workflow.status}
                      </span>
                      <button className="p-2 border border-border rounded-lg hover:bg-accent">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Save Workflow Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Officers Tab */}
        {activeTab === 'officers' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Officers', value: officers.length.toString() },
                { label: 'Admins', value: officers.filter(o => o.role === 'ADMIN').length.toString() },
                { label: 'Field Officers', value: officers.filter(o => o.role !== 'ADMIN').length.toString() },
              ].map((stat, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Officers List */}
            {officersLoading ? (
              <div className="py-16 text-center text-muted-foreground">Loading officers...</div>
            ) : officers.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No officers yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {officers.map((officer) => (
                  <div key={officer.id} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{officer.name ?? officer.email}</h3>
                          <p className="text-sm text-muted-foreground">{officer.email}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {officer.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/tenant/settings')}
              className="w-full px-6 py-3 border-2 border-dashed border-border rounded-xl font-medium hover:bg-accent flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Officer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
