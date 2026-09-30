import { Plus, Eye, Code, CheckCircle, ClipboardCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { validateServiceManifest } from '@serviceformai/service-manifest';
import { producerService } from '../services/api/producer.service';
import { buildScholarshipManifestPreview } from '../utils/serviceManifest';
import { useApp } from '../context/AppContext';
import RedressQueue from './RedressQueue';

type ServiceScope = {
  jurisdiction_model: 'central' | 'state' | 'district' | 'urban_local_body' | 'rural_local_body' | 'mixed';
  ministry_code: string;
  state_lgd_code: string;
  district_lgd_code: string;
  municipality_lgd_code: string;
  panchayat_lgd_code: string;
};

export default function ManifestStudio() {
  const { user } = useApp();
  const [name, setName] = useState('State Merit Scholarship 2026');
  const [category, setCategory] = useState('Student Benefit');
  const [description, setDescription] = useState('Financial assistance for eligible students pursuing higher education.');
  const [publishing, setPublishing] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<Array<{
    id: string;
    service_id: string;
    requested_by_id: string;
    created_at: string;
    requested_content_hash: string;
    service: { name: string; category: string; description: string; form_schema: Record<string, unknown>; workflow_config: Record<string, unknown>; manifest: Record<string, unknown> } | null;
    simulation: { passed: boolean } | null;
  }>>([]);
  const [serviceScope, setServiceScope] = useState<ServiceScope>({
    jurisdiction_model: 'state',
    ministry_code: '',
    state_lgd_code: '',
    district_lgd_code: '',
    municipality_lgd_code: '',
    panchayat_lgd_code: '',
  });
  const manifest = buildScholarshipManifestPreview({ name, category, description });
  const manifestValidation = validateServiceManifest(manifest);

  const loadPendingApprovals = async () => {
    try {
      setPendingApprovals(await producerService.getPendingPublicationApprovals());
    } catch {
      setPendingApprovals([]);
    }
  };

  useEffect(() => {
    void loadPendingApprovals();
  }, []);

  const approvePublication = async (serviceId: string) => {
    try {
      const release = await producerService.approveServicePublication(serviceId);
      toast.success(`Release ${release.version} approved and published`);
      await loadPendingApprovals();
    } catch (error) {
      toast.error('Unable to approve publication', {
        description: error instanceof Error ? error.message : 'The request may belong to another administrator.',
      });
    }
  };

  const handlePublish = async () => {
    if (!name || !category) {
      toast.error('Service name and category are required');
      return;
    }
    if (!manifestValidation.valid) {
      toast.error('Manifest validation failed', {
        description: manifestValidation.errors[0]?.message || 'Please review the manifest fields.',
      });
      return;
    }
    setPublishing(true);
    try {
      const created = await producerService.createService({
        name,
        description,
        category,
        manifest,
        formSchema: manifest.service.formSchema as any,
        workflowConfig: { stages: manifest.workflow.stages },
        serviceScope,
      });
      await producerService.publishService(created.id);
      toast.success('Publication submitted for independent approval');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to publish manifest');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Service Manifest Studio</h1>
          <p className="text-muted-foreground">Create and publish service manifests</p>
        </div>

        {pendingApprovals.length > 0 && (
          <section className="mb-8 border border-border bg-card rounded-lg p-5" aria-labelledby="publication-approvals-heading">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 id="publication-approvals-heading" className="text-lg font-semibold">Pending Publication Approvals</h2>
            </div>
            <div className="divide-y divide-border">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{approval.service?.name || `Service ${approval.service_id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {approval.service?.category || 'Service'} · Requested by {approval.requested_by_id} · {new Date(approval.created_at).toLocaleString()}
                    </p>
                    <p className={`text-xs mt-1 ${approval.simulation?.passed ? 'text-success' : 'text-destructive'}`}>
                      Simulation {approval.simulation?.passed ? 'passed' : 'failed or unavailable'}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      Content hash: {approval.requested_content_hash.slice(0, 16)}…
                    </p>
                    {approval.service && (
                      <details className="mt-2">
                        <summary className="text-xs text-primary cursor-pointer">Review form, workflow, and manifest snapshot</summary>
                        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words bg-muted p-3 rounded text-xs">
                          {JSON.stringify({ form: approval.service.form_schema, workflow: approval.service.workflow_config, manifest: approval.service.manifest }, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void approvePublication(approval.service_id)}
                    disabled={approval.requested_by_id === user?.id || !approval.simulation?.passed}
                    title={approval.requested_by_id === user?.id ? 'A different administrator must approve this request' : undefined}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                  >
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    {approval.requested_by_id === user?.id ? 'Await another admin' : 'Approve release'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <RedressQueue />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Builder */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Service Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Service Type *</label>
                    <select className="w-full px-4 py-3 bg-input-background border border-border rounded-lg">
                      <option>Scheme</option>
                      <option>Service</option>
                      <option>Grievance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg">
                      <option>Student Benefit</option>
                      <option>Farmer Benefit</option>
                      <option>Pension</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg resize-none"
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Service Scope</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Jurisdiction Model</label>
                  <select
                    value={serviceScope.jurisdiction_model}
                    onChange={e => setServiceScope(prev => ({ ...prev, jurisdiction_model: e.target.value as ServiceScope['jurisdiction_model'] }))}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                  >
                    <option value="state">State</option>
                    <option value="central">Central</option>
                    <option value="district">District</option>
                    <option value="urban_local_body">Urban Local Body</option>
                    <option value="rural_local_body">Rural Local Body</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ministry Code</label>
                  <input
                    type="text"
                    value={serviceScope.ministry_code}
                    onChange={e => setServiceScope(prev => ({ ...prev, ministry_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State LGD Code</label>
                  <input
                    type="text"
                    value={serviceScope.state_lgd_code}
                    onChange={e => setServiceScope(prev => ({ ...prev, state_lgd_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">District LGD Code</label>
                  <input
                    type="text"
                    value={serviceScope.district_lgd_code}
                    onChange={e => setServiceScope(prev => ({ ...prev, district_lgd_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Municipality LGD Code</label>
                  <input
                    type="text"
                    value={serviceScope.municipality_lgd_code}
                    onChange={e => setServiceScope(prev => ({ ...prev, municipality_lgd_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Panchayat LGD Code</label>
                  <input
                    type="text"
                    value={serviceScope.panchayat_lgd_code}
                    onChange={e => setServiceScope(prev => ({ ...prev, panchayat_lgd_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Eligibility Rules</h3>
              <div className="space-y-4">
                {[
                  { rule: 'Age >= 16 years', field: 'citizen.age', operator: '>=', value: '16' },
                  { rule: 'Currently Enrolled', field: 'education.status', operator: 'equals', value: 'ENROLLED' },
                  { rule: 'Income <= 2,50,000', field: 'household.income', operator: '<=', value: '250000' },
                ].map((rule, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rule.rule}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.field} {rule.operator} {rule.value}
                      </p>
                    </div>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Required Documents</h3>
              <div className="space-y-3">
                {[
                  { name: 'Identity Proof', digilocker: 'AADHAAR, PAN' },
                  { name: 'Income Certificate', digilocker: 'INCOME_CERTIFICATE' },
                  { name: 'Student Bonafide', digilocker: 'EDU_BONAFIDE' },
                  { name: 'Bank Account Proof', digilocker: 'BANK_PASSBOOK' },
                ].map((doc, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{doc.name}</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <p className="text-xs text-muted-foreground">DigiLocker: {doc.digilocker}</p>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Manifest Preview</h3>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Status</span>
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">Draft</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Version</span>
                  <span className="text-xs text-muted-foreground">{manifest.manifestVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Validation</span>
                  <span className={`text-xs ${manifestValidation.valid ? 'text-success' : 'text-destructive'}`}>
                    {manifestValidation.valid ? 'Ready' : `${manifestValidation.errors.length} issue(s)`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview Journey
                </button>
                <button className="w-full py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Code className="w-4 h-4" />
                  View JSON
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Certification Checklist</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Service information', done: true },
                  { label: 'Eligibility rules', done: true },
                  { label: 'Document mappings', done: true },
                  { label: 'Consent language', done: false },
                  { label: 'Workflow stages', done: false },
                  { label: 'Notification rules', done: false },
                  { label: 'Accessibility check', done: false },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                      item.done ? 'bg-success text-success-foreground' : 'bg-muted'
                    }`}>
                      {item.done && <CheckCircle className="w-3 h-3" />}
                    </div>
                    <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full py-3 bg-success text-success-foreground rounded-lg font-medium disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
