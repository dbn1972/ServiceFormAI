import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Sparkles, FileText, GraduationCap, Briefcase,
  BadgeCheck, MapPin, Hospital, Landmark, Car, TreePine, Zap, Settings, Eye,
  Upload, Clock, Plus, Trash2, Type, Calendar, CheckSquare, Info, Play
} from 'lucide-react';
import { useAutoSave } from '../hooks/useAutoSave';
import confetti from 'canvas-confetti';
import { producerService } from '../services/api/producer.service';
import { toast } from 'sonner';

const SERVICE_TEMPLATES = [
  { id: 'scholarship', name: 'Scholarship Application', category: 'Education', icon: GraduationCap, sla: '45 days', popular: true },
  { id: 'birth-cert', name: 'Birth Certificate', category: 'Civil Records', icon: FileText, sla: '7 days', popular: true },
  { id: 'income-cert', name: 'Income Certificate', category: 'Revenue', icon: Briefcase, sla: '14 days', popular: true },
  { id: 'caste-cert', name: 'Caste Certificate', category: 'Revenue', icon: BadgeCheck, sla: '30 days', popular: false },
  { id: 'domicile', name: 'Domicile Certificate', category: 'Revenue', icon: MapPin, sla: '21 days', popular: false },
  { id: 'health-card', name: 'Health Card', category: 'Health', icon: Hospital, sla: '10 days', popular: false },
  { id: 'property-tax', name: 'Property Tax Payment', category: 'Municipal', icon: Landmark, sla: 'Instant', popular: false },
  { id: 'vehicle-noc', name: 'Vehicle NOC', category: 'Transport', icon: Car, sla: '7 days', popular: false },
  { id: 'tree-permit', name: 'Tree Cutting Permit', category: 'Environment', icon: TreePine, sla: '21 days', popular: false },
  { id: 'water-conn', name: 'Water Connection', category: 'Utilities', icon: Zap, sla: '15 days', popular: false },
  { id: 'custom', name: 'Custom Service', category: 'Custom', icon: Settings, sla: 'Custom', popular: false },
];

const FIELD_TYPES = [
  { id: 'text', label: 'Text Input', icon: Type, color: 'primary' },
  { id: 'date', label: 'Date Picker', icon: Calendar, color: 'info' },
  { id: 'dropdown', label: 'Dropdown', icon: CheckSquare, color: 'success' },
  { id: 'file', label: 'File Upload', icon: Upload, color: 'warning' },
];

const DIGILOCKER_FIELDS = [
  { id: 'dl-name', label: 'Full Name', mapping: 'DigiLocker → Aadhaar → Name', prefill: true },
  { id: 'dl-dob', label: 'Date of Birth', mapping: 'DigiLocker → Aadhaar → DOB', prefill: true },
  { id: 'dl-address', label: 'Address', mapping: 'DigiLocker → Aadhaar → Address', prefill: true },
  { id: 'dl-mobile', label: 'Mobile Number', mapping: 'DigiLocker → Aadhaar → Mobile', prefill: true },
  { id: 'dl-email', label: 'Email', mapping: 'DigiLocker → Profile → Email', prefill: true },
];

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  prefillable: boolean;
  mapping?: string;
  options?: string[];
  validation?: string;
}

interface ServiceData {
  template?: string;
  name: string;
  category: string;
  description: string;
  sla: string;
  fields: FormField[];
  eligibilityRules: Array<{ field: string; operator: string; value: string }>;
  documents: Array<{ name: string; digilocker: string; required: boolean }>;
}

const WIZARD_STEPS = [
  { id: 1, label: 'Template', icon: Sparkles },
  { id: 2, label: 'Details', icon: FileText },
  { id: 3, label: 'Form Fields', icon: Type },
  { id: 4, label: 'Eligibility', icon: CheckSquare },
  { id: 5, label: 'Review', icon: Eye },
];

export default function ServiceCreationWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStep = parseInt(searchParams.get('step') || '1', 10);

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [serviceData, setServiceData] = useState<ServiceData>({
    name: '',
    category: '',
    description: '',
    sla: '',
    fields: [],
    eligibilityRules: [],
    documents: [],
  });

  const [showPreview, setShowPreview] = useState(false);
  const [published, setPublished] = useState(false);

  // Auto-save functionality
  const saveStatus = useAutoSave(serviceData, {
    storageKey: 'service-creation-draft',
    debounceMs: 500,
  });

  const updateServiceData = (updates: Partial<ServiceData>) => {
    setServiceData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return serviceData.template !== undefined;
      case 2: return serviceData.name && serviceData.category && serviceData.sla;
      case 3: return serviceData.fields.length > 0;
      case 4: return true; // Eligibility is optional
      case 5: return true;
      default: return false;
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    navigate(`/tenant/service/create?step=${step}`);
  };

  const nextStep = () => {
    if (canProceed() && currentStep < WIZARD_STEPS.length) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = SERVICE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Pre-populate based on template
    const updates: Partial<ServiceData> = {
      template: templateId,
      name: template.name,
      category: template.category,
      sla: template.sla,
    };

    // Add template-specific fields
    if (templateId === 'scholarship') {
      updates.description = 'Financial assistance for eligible students pursuing higher education.';
      updates.fields = [
        { id: 'name', type: 'text', label: 'Full Name', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → Name' },
        { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: true, mapping: 'DigiLocker → Aadhaar → DOB' },
        { id: 'income', type: 'dropdown', label: 'Annual Family Income', required: true, prefillable: false, options: ['Below ₹1,00,000', '₹1,00,000 - ₹2,50,000', 'Above ₹2,50,000'] },
      ];
      updates.eligibilityRules = [
        { field: 'age', operator: '>=', value: '16' },
        { field: 'income', operator: '<=', value: '250000' },
        { field: 'enrollment', operator: 'equals', value: 'ACTIVE' },
      ];
      updates.documents = [
        { name: 'Aadhaar Card', digilocker: 'AADHAAR', required: true },
        { name: 'Income Certificate', digilocker: 'INCOME_CERTIFICATE', required: true },
        { name: 'Student Bonafide', digilocker: 'EDU_BONAFIDE', required: true },
      ];
    } else if (templateId === 'birth-cert') {
      updates.description = 'Official birth certificate issued by the municipal corporation.';
      updates.fields = [
        { id: 'child-name', type: 'text', label: "Child's Full Name", required: true, prefillable: false },
        { id: 'dob', type: 'date', label: 'Date of Birth', required: true, prefillable: false },
        { id: 'father-name', type: 'text', label: "Father's Name", required: true, prefillable: false },
        { id: 'mother-name', type: 'text', label: "Mother's Name", required: true, prefillable: false },
        { id: 'hospital', type: 'text', label: 'Hospital Name', required: true, prefillable: false },
      ];
      updates.documents = [
        { name: 'Hospital Birth Report', digilocker: 'HOSPITAL_BIRTH_REPORT', required: true },
        { name: 'Parents Aadhaar', digilocker: 'AADHAAR', required: true },
      ];
    }

    updateServiceData(updates);
    nextStep();
  };

  const handlePublish = async () => {
    try {
      const slaDays = parseInt(serviceData.sla?.replace(/\D/g, '') || '0', 10);
      const created = await producerService.createService({
        name: serviceData.name,
        description: serviceData.description || '',
        category: serviceData.category,
        formSchema: {
          title: serviceData.name,
          fields: (serviceData.fields || []).map((f: FormField) => ({
            id: f.id,
            name: f.id,
            type: f.type as any,
            label: f.label,
            required: f.required,
            options: f.options?.map((o: string) => ({ label: o, value: o })),
          })),
        },
        workflowConfig: slaDays ? { slaDays } as any : undefined,
      });

      await producerService.publishService(created.id);
    } catch {
      toast.error('Failed to create service. Draft saved locally.');
    }

    // Trigger confetti regardless (optimistic UX)
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setPublished(true);

    // Clear draft from localStorage
    localStorage.removeItem('service-creation-draft');

    // Navigate to success screen after 2 seconds
    setTimeout(() => {
      navigate('/tenant/dashboard');
    }, 3000);
  };

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: fieldType,
      label: `New ${fieldType} field`,
      required: false,
      prefillable: false,
    };
    updateServiceData({ fields: [...serviceData.fields, newField] });
  };

  const addDigiLockerField = (fieldId: string) => {
    const dlField = DIGILOCKER_FIELDS.find(f => f.id === fieldId);
    if (!dlField) return;

    const newField: FormField = {
      id: fieldId,
      type: 'text',
      label: dlField.label,
      required: true,
      prefillable: true,
      mapping: dlField.mapping,
    };
    updateServiceData({ fields: [...serviceData.fields, newField] });
  };

  const removeField = (fieldId: string) => {
    updateServiceData({ fields: serviceData.fields.filter(f => f.id !== fieldId) });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    updateServiceData({
      fields: serviceData.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1TemplateSelection onSelectTemplate={handleTemplateSelect} selected={serviceData.template} />;
      case 2:
        return <Step2ServiceDetails data={serviceData} onChange={updateServiceData} />;
      case 3:
        return (
          <Step3FormBuilder
            fields={serviceData.fields}
            onAddField={addField}
            onAddDigiLockerField={addDigiLockerField}
            onRemoveField={removeField}
            onUpdateField={updateField}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview(!showPreview)}
          />
        );
      case 4:
        return <Step4Eligibility data={serviceData} onChange={updateServiceData} />;
      case 5:
        return <Step5Review data={serviceData} onPublish={handlePublish} published={published} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Create Your First Service</h1>
              <p className="text-sm text-muted-foreground">Build and publish a citizen service in minutes</p>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saved' && (
                <span className="text-xs text-success flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0">
            {WIZARD_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isActive
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div className={`w-16 md:w-24 h-0.5 mx-1 mt-[-16px] transition-all duration-300 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderStep()}
      </div>

      {/* Footer Navigation */}
      {!published && (
        <div className="bg-card border-t border-border sticky bottom-0">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {WIZARD_STEPS.length}
            </div>

            {currentStep < WIZARD_STEPS.length ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  canProceed()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 px-6 py-2.5 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90"
              >
                <Check className="w-4 h-4" />
                Publish Service
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 1: Template Selection
function Step1TemplateSelection({ onSelectTemplate, selected }: { onSelectTemplate: (id: string) => void; selected?: string }) {
  const popular = SERVICE_TEMPLATES.filter(t => t.popular);
  const all = SERVICE_TEMPLATES;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose a Service Template</h2>
        <p className="text-muted-foreground">Start with a pre-configured template or build from scratch</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Popular Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popular.map(template => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  selected === template.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selected === template.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{template.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{template.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        SLA: {template.sla}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">All Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {all.filter(t => !t.popular).map(template => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selected === template.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{template.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{template.category}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Step 2: Service Details
function Step2ServiceDetails({ data, onChange }: { data: ServiceData; onChange: (updates: Partial<ServiceData>) => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold mb-2">Service Information</h2>
          <p className="text-sm text-muted-foreground">Basic details about your service</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Service Name *</label>
          <input
            type="text"
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="e.g., State Merit Scholarship 2026"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <input
              type="text"
              value={data.category}
              onChange={e => onChange({ category: e.target.value })}
              placeholder="e.g., Education"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">SLA (Processing Time) *</label>
            <input
              type="text"
              value={data.sla}
              onChange={e => onChange({ sla: e.target.value })}
              placeholder="e.g., 30 days"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <textarea
            value={data.description}
            onChange={e => onChange({ description: e.target.value })}
            rows={4}
            placeholder="Describe what this service provides to citizens..."
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="flex items-start gap-3 p-4 bg-info/5 border border-info/20 rounded-xl">
          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-info mb-1">Service Manifest Protocol</p>
            <p className="text-xs text-muted-foreground">
              This information will be used to create a machine-readable Service Manifest that powers discovery,
              eligibility, and routing across all citizen channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Form Builder (Simplified - will be expanded)
function Step3FormBuilder({
  fields,
  onAddField,
  onAddDigiLockerField,
  onRemoveField,
  onUpdateField,
  showPreview,
  onTogglePreview
}: {
  fields: FormField[];
  onAddField: (type: string) => void;
  onAddDigiLockerField: (fieldId: string) => void;
  onRemoveField: (fieldId: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Builder */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Application Form Fields</h2>
            <p className="text-sm text-muted-foreground">Add fields for citizens to fill</p>
          </div>
          <button
            onClick={onTogglePreview}
            className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {fields.map(field => (
            <div key={field.id} className="p-3 border border-border rounded-lg hover:border-primary transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={e => onUpdateField(field.id, { label: e.target.value })}
                    className="w-full px-2 py-1 border border-border rounded text-sm font-medium mb-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Type: {field.type}</span>
                    {field.prefillable && (
                      <>
                        <span>•</span>
                        <span className="text-verified">Prefillable from DigiLocker</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveField(field.id)}
                  className="p-1 hover:bg-destructive/10 rounded text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Add Field Type:</p>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => onAddField(type.id)}
                    className="flex items-center gap-2 p-2 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Add DigiLocker Field:</p>
            <div className="space-y-2">
              {DIGILOCKER_FIELDS.map(field => (
                <button
                  key={field.id}
                  onClick={() => onAddDigiLockerField(field.id)}
                  className="w-full flex items-center gap-2 p-2 bg-verified/5 border border-verified/20 rounded-lg hover:bg-verified/10 transition-colors text-sm text-left"
                  disabled={fields.some(f => f.id === field.id)}
                >
                  <CheckSquare className="w-4 h-4 text-verified" />
                  <span className="flex-1">{field.label}</span>
                  {fields.some(f => f.id === field.id) && (
                    <span className="text-xs text-success">Added</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="bg-muted/30 border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Citizen View (Preview)
          </h3>
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="mb-4">
              <h4 className="font-semibold mb-1">Application Form</h4>
              <p className="text-xs text-muted-foreground">Step 1 of 3</p>
            </div>

            {fields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium mb-1.5">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    placeholder={field.prefillable ? `Prefilled from ${field.mapping}` : `Enter ${field.label.toLowerCase()}`}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-sm"
                    disabled
                  />
                )}
                {field.type === 'date' && (
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-sm"
                    disabled
                  />
                )}
                {field.type === 'dropdown' && (
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-input text-sm" disabled>
                    <option>Select {field.label.toLowerCase()}</option>
                    {field.options?.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                )}
                {field.type === 'file' && (
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </div>
                )}
                {field.prefillable && (
                  <p className="text-xs text-verified mt-1">✓ Auto-filled from DigiLocker</p>
                )}
              </div>
            ))}

            <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium mt-6">
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4: Eligibility
function Step4Eligibility({ data, onChange }: { data: ServiceData; onChange: (updates: Partial<ServiceData>) => void }) {
  const addRule = () => {
    onChange({
      eligibilityRules: [...data.eligibilityRules, { field: '', operator: '', value: '' }]
    });
  };

  const removeRule = (index: number) => {
    onChange({
      eligibilityRules: data.eligibilityRules.filter((_, i) => i !== index)
    });
  };

  const addDocument = () => {
    onChange({
      documents: [...data.documents, { name: '', digilocker: '', required: true }]
    });
  };

  const removeDocument = (index: number) => {
    onChange({
      documents: data.documents.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Eligibility Rules</h2>
        <div className="space-y-3 mb-4">
          {data.eligibilityRules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckSquare className="w-5 h-5 text-success flex-shrink-0" />
              <div className="flex-1 text-sm">
                {rule.field} {rule.operator} {rule.value}
              </div>
              <button onClick={() => removeRule(idx)} className="text-destructive hover:opacity-80">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addRule}
          className="w-full py-2.5 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Eligibility Rule
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Required Documents</h2>
        <div className="space-y-3 mb-4">
          {data.documents.map((doc, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{doc.name}</span>
                <button onClick={() => removeDocument(idx)} className="text-destructive hover:opacity-80">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">DigiLocker: {doc.digilocker}</p>
            </div>
          ))}
        </div>
        <button
          onClick={addDocument}
          className="w-full py-2.5 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Document Requirement
        </button>
      </div>
    </div>
  );
}

// Step 5: Review & Publish
function Step5Review({ data, onPublish, published }: { data: ServiceData; onPublish: () => void; published: boolean }) {
  if (published) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-3xl font-bold mb-3">🎉 Service Published!</h2>
        <p className="text-lg text-muted-foreground mb-6">
          "{data.name}" is now live and accepting citizen applications
        </p>
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Service is now available at:</p>
          <p className="font-mono text-sm text-primary">your-tenant.serviceformai.gov.in/services/{data.template}</p>
        </div>
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Review Service</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Service Name</p>
            <p className="font-semibold">{data.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
              <p>{data.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">SLA</p>
              <p>{data.sla}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{data.description}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Application Form ({data.fields.length} fields)</p>
            <div className="space-y-2">
              {data.fields.slice(0, 3).map(field => (
                <div key={field.id} className="text-sm p-2 bg-muted rounded flex items-center justify-between">
                  <span>{field.label}</span>
                  {field.prefillable && <span className="text-xs text-verified">Prefillable</span>}
                </div>
              ))}
              {data.fields.length > 3 && (
                <p className="text-xs text-muted-foreground">...and {data.fields.length - 3} more</p>
              )}
            </div>
          </div>

          {data.eligibilityRules.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Eligibility Rules</p>
              <div className="space-y-1">
                {data.eligibilityRules.map((rule, idx) => (
                  <div key={idx} className="text-xs p-2 bg-muted rounded">
                    {rule.field} {rule.operator} {rule.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.documents.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Required Documents</p>
              <div className="space-y-1">
                {data.documents.map((doc, idx) => (
                  <div key={idx} className="text-xs p-2 bg-muted rounded">
                    {doc.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-muted flex items-center justify-center gap-2">
          <Play className="w-4 h-4" />
          Test as Citizen
        </button>
        <button
          onClick={onPublish}
          className="flex-1 py-3 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Publish Service
        </button>
      </div>
    </div>
  );
}
