import { Plus, Eye, Code, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { producerService } from '../services/api/producer.service';

export default function ManifestStudio() {
  const [name, setName] = useState('State Merit Scholarship 2026');
  const [category, setCategory] = useState('Student Benefit');
  const [description, setDescription] = useState('Financial assistance for eligible students pursuing higher education.');
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!name || !category) {
      toast.error('Service name and category are required');
      return;
    }
    setPublishing(true);
    try {
      const created = await producerService.createService({
        name,
        description,
        category,
        formSchema: { title: name, fields: [] },
      });
      await producerService.publishService(created.id);
      toast.success('Manifest published!', { description: 'Service is now live.' });
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
                  <span className="text-xs text-muted-foreground">1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Certification</span>
                  <span className="text-xs text-muted-foreground">Not submitted</span>
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
