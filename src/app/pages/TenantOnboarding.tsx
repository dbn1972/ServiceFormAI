import { useState } from 'react';
import { toast } from 'sonner';
import { authService } from '../services/api/auth.service';
import {
  Building2, User, FileCode, Palette, CheckCircle, ArrowRight, ArrowLeft,
  Upload, Shield, Globe, Phone, Mail, MapPin, ChevronDown, Eye, EyeOff,
  Plus, Trash2, AlertCircle, Sparkles, Check, Clock, Info, Star,
  Briefcase, Landmark, Hospital, GraduationCap, TreePine, Car, Zap,
  RefreshCw, Lock, BadgeCheck, Copy, ExternalLink
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Organization', icon: Building2 },
  { id: 2, label: 'Admin Setup', icon: User },
  { id: 3, label: 'Services', icon: FileCode },
  { id: 4, label: 'Branding', icon: Palette },
  { id: 5, label: 'Go Live', icon: CheckCircle },
];

const SERVICE_TEMPLATES = [
  { id: 'birth-cert', name: 'Birth Certificate', category: 'Civil Records', icon: FileCode, sla: '7 days', popular: true },
  { id: 'death-cert', name: 'Death Certificate', category: 'Civil Records', icon: FileCode, sla: '7 days', popular: false },
  { id: 'income-cert', name: 'Income Certificate', category: 'Revenue', icon: Briefcase, sla: '14 days', popular: true },
  { id: 'caste-cert', name: 'Caste Certificate', category: 'Revenue', icon: BadgeCheck, sla: '30 days', popular: true },
  { id: 'domicile', name: 'Domicile Certificate', category: 'Revenue', icon: MapPin, sla: '21 days', popular: false },
  { id: 'scholarship', name: 'Scholarship Application', category: 'Education', icon: GraduationCap, sla: '45 days', popular: true },
  { id: 'property-tax', name: 'Property Tax Payment', category: 'Municipal', icon: Landmark, sla: 'Instant', popular: false },
  { id: 'trade-license', name: 'Trade License', category: 'Municipal', icon: Briefcase, sla: '30 days', popular: false },
  { id: 'water-conn', name: 'Water Connection', category: 'Utilities', icon: Zap, sla: '15 days', popular: false },
  { id: 'health-card', name: 'Health Card', category: 'Health', icon: Hospital, sla: '10 days', popular: false },
  { id: 'tree-permit', name: 'Tree Cutting Permit', category: 'Environment', icon: TreePine, sla: '21 days', popular: false },
  { id: 'driving-noc', name: 'Vehicle NOC', category: 'Transport', icon: Car, sla: '7 days', popular: false },
];

const ORG_TYPES = [
  { value: 'state-dept', label: 'State Government Department' },
  { value: 'central-ministry', label: 'Central Government Ministry' },
  { value: 'municipality', label: 'Urban Local Body / Municipality' },
  { value: 'panchayat', label: 'Gram Panchayat / Block Office' },
  { value: 'parastatal', label: 'Parastatal / PSU' },
  { value: 'board', label: 'Development Authority / Board' },
];

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Odisha',
  'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi (NCT)', 'Puducherry',
];

const COLOR_PRESETS = [
  { name: 'Government Blue', primary: '#1e3a8a', accent: '#3b82f6' },
  { name: 'Indigo Trust', primary: '#312e81', accent: '#6366f1' },
  { name: 'Forest Green', primary: '#14532d', accent: '#22c55e' },
  { name: 'Saffron Pride', primary: '#7c2d12', accent: '#f97316' },
  { name: 'Royal Purple', primary: '#4c1d95', accent: '#a855f7' },
  { name: 'Steel Grey', primary: '#1f2937', accent: '#6b7280' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full overflow-x-auto px-4 py-2">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = current > step.id;
        const isActive = current === step.id;
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
              <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-12 md:w-20 h-0.5 mx-1 mt-[-16px] transition-all duration-300 ${current > step.id ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Organization ────────────────────────────────────────────────────
function StepOrganization({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Organization Registration</h2>
        <p className="text-muted-foreground">Tell us about the government entity that will use ServiceFormAI OS.</p>
      </div>

      {/* Org type */}
      <div>
        <label className="block text-sm font-medium mb-2">Organization Type <span className="text-destructive">*</span></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ORG_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => onChange({ ...data, orgType: t.value })}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                data.orgType === t.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Organization Name <span className="text-destructive">*</span></label>
          <input
            type="text"
            value={data.orgName || ''}
            onChange={e => onChange({ ...data, orgName: e.target.value })}
            placeholder="e.g. Directorate of Revenue, Maharashtra"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Official Short Name / Acronym</label>
          <input
            type="text"
            value={data.orgShort || ''}
            onChange={e => onChange({ ...data, orgShort: e.target.value })}
            placeholder="e.g. DOR-MH"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">State / UT <span className="text-destructive">*</span></label>
          <div className="relative">
            <select
              value={data.state || ''}
              onChange={e => onChange({ ...data, state: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
            >
              <option value="">Select State / UT</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">District (if applicable)</label>
          <input
            type="text"
            value={data.district || ''}
            onChange={e => onChange({ ...data, district: e.target.value })}
            placeholder="e.g. Pune"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Official Website URL</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              value={data.website || ''}
              onChange={e => onChange({ ...data, website: e.target.value })}
              placeholder="https://revenue.maharashtra.gov.in"
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Official Phone Number <span className="text-destructive">*</span></label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={data.phone || ''}
              onChange={e => onChange({ ...data, phone: e.target.value })}
              placeholder="+91 22 2202 1234"
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Official Email (NIC / gov.in domain preferred)</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={data.email || ''}
            onChange={e => onChange({ ...data, email: e.target.value })}
            placeholder="helpdesk@revenue.maharashtra.gov.in"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          <Shield className="w-3 h-3" /> GOV/NIC email domains are verified faster and get priority onboarding.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Upload Official Letterhead / Gazette Notification</label>
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
          <p className="text-sm font-medium mb-1">Drop files here or click to upload</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 5MB. Used for identity verification.</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary">Verification Process</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your organization will be verified by the ServiceFormAI OS team within 1–2 business days using NIC/MeitY records. 
            You'll receive an email once approved to proceed with service configuration.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Admin Setup ─────────────────────────────────────────────────────
function StepAdminSetup({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [admins, setAdmins] = useState(data.admins || [{ name: '', email: '', mobile: '', role: 'dept-admin' }]);

  const updateAdmin = (idx: number, field: string, value: string) => {
    const updated = admins.map((a: any, i: number) => i === idx ? { ...a, [field]: value } : a);
    setAdmins(updated);
    onChange({ ...data, admins: updated });
  };

  const addAdmin = () => {
    const updated = [...admins, { name: '', email: '', mobile: '', role: 'dept-admin' }];
    setAdmins(updated);
    onChange({ ...data, admins: updated });
  };

  const removeAdmin = (idx: number) => {
    if (admins.length === 1) return;
    const updated = admins.filter((_: any, i: number) => i !== idx);
    setAdmins(updated);
    onChange({ ...data, admins: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Admin Account Setup</h2>
        <p className="text-muted-foreground">Set up the primary administrator(s) who will manage your tenant instance.</p>
      </div>

      {/* Primary admin */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Administrator(s)</h3>
          <button
            onClick={addAdmin}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            <Plus className="w-4 h-4" /> Add Another Admin
          </button>
        </div>

        {admins.map((admin: any, idx: number) => (
          <div key={idx} className="p-5 border border-border rounded-xl bg-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {idx === 0 ? 'Primary Admin' : `Admin ${idx + 1}`}
              </span>
              {idx > 0 && (
                <button onClick={() => removeAdmin(idx)} className="text-destructive hover:opacity-80">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={admin.name}
                  onChange={e => updateAdmin(idx, 'name', e.target.value)}
                  placeholder="Shri Ramesh Kumar Yadav"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Designation</label>
                <input
                  type="text"
                  value={admin.designation || ''}
                  onChange={e => updateAdmin(idx, 'designation', e.target.value)}
                  placeholder="e.g. Deputy Secretary / IT Nodal Officer"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Official Email <span className="text-destructive">*</span></label>
                <input
                  type="email"
                  value={admin.email}
                  onChange={e => updateAdmin(idx, 'email', e.target.value)}
                  placeholder="rk.yadav@revenue.gov.in"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mobile Number <span className="text-destructive">*</span></label>
                <div className="flex gap-2">
                  <span className="px-3 py-2.5 border border-border rounded-lg bg-muted text-sm text-muted-foreground">+91</span>
                  <input
                    type="tel"
                    value={admin.mobile}
                    onChange={e => updateAdmin(idx, 'mobile', e.target.value)}
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Admin Role</label>
                <div className="relative">
                  <select
                    value={admin.role}
                    onChange={e => updateAdmin(idx, 'role', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="dept-admin">Department Admin (Full Access)</option>
                    <option value="it-admin">IT Admin (Technical Config)</option>
                    <option value="ops-admin">Operations Admin (Workflow only)</option>
                    <option value="viewer">Read-Only Viewer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Password setup */}
      <div className="p-5 border border-border rounded-xl bg-card space-y-4">
        <h3 className="text-base font-semibold">Initial Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Set Password <span className="text-destructive">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.password || ''}
                onChange={e => onChange({ ...data, password: e.target.value })}
                placeholder="Min 12 chars, 1 uppercase, 1 number, 1 symbol"
                className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm Password <span className="text-destructive">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={data.confirmPassword || ''}
                onChange={e => onChange({ ...data, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '12+ characters', ok: (data.password || '').length >= 12 },
            { label: 'Uppercase letter', ok: /[A-Z]/.test(data.password || '') },
            { label: 'Number', ok: /\d/.test(data.password || '') },
            { label: 'Special character', ok: /[^A-Za-z0-9]/.test(data.password || '') },
          ].map(req => (
            <div key={req.label} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${req.ok ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
              {req.ok ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {req.label}
            </div>
          ))}
        </div>
      </div>

      {/* 2FA */}
      <div className="p-5 border border-border rounded-xl bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Two-Factor Authentication</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Mandatory for all department admin accounts per GOI security guidelines.</p>
          </div>
          <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'OTP via Mobile', desc: 'SMS to registered number', icon: Phone },
            { label: 'OTP via Email', desc: 'Email to official ID', icon: Mail },
            { label: 'Authenticator App', desc: 'Google / Microsoft Auth', icon: Shield },
          ].map(m => (
            <div key={m.label} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${data.twoFAMethod === m.label ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
              onClick={() => onChange({ ...data, twoFAMethod: m.label })}>
              <m.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Services ────────────────────────────────────────────────────────
function StepServices({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const selected: string[] = data.selectedServices || [];

  const toggle = (id: string) => {
    const updated = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id];
    onChange({ ...data, selectedServices: updated });
  };

  const categories = Array.from(new Set(SERVICE_TEMPLATES.map(s => s.category)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Service Manifest Configuration</h2>
        <p className="text-muted-foreground">Select the government services you want to deploy. Each service uses a pre-built Service Manifest Protocol template.</p>
      </div>

      <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">AI-Assisted Manifest Generation</p>
            <p className="text-xs text-muted-foreground">Our AI auto-configures forms, SLA rules, and document checklists for each service.</p>
          </div>
        </div>
        <span className="text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-medium">INCLUDED</span>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium text-xs">{selected.length} selected</span>
        <button onClick={() => onChange({ ...data, selectedServices: SERVICE_TEMPLATES.map(s => s.id) })} className="text-primary hover:underline text-xs">Select All</button>
        <button onClick={() => onChange({ ...data, selectedServices: [] })} className="hover:underline text-xs">Clear All</button>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICE_TEMPLATES.filter(s => s.category === cat).map(svc => {
              const isSelected = selected.includes(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => toggle(svc.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <svc.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{svc.name}</span>
                          {svc.popular && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">SLA: {svc.sla}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="p-4 border border-dashed border-border rounded-xl text-center hover:border-primary/40 transition-colors cursor-pointer">
        <Plus className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
        <p className="text-sm font-medium">Request Custom Service</p>
        <p className="text-xs text-muted-foreground">Don't see your service? Our team will build a custom manifest in 5 days.</p>
      </div>

      {/* Integration options */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Integrations & Protocols</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'digilocker', label: 'DigiLocker Integration', desc: 'Auto-fetch citizen documents with consent', recommended: true },
            { id: 'aadhaar-otp', label: 'Aadhaar OTP Verification', desc: 'Citizen identity via UIDAI eKYC', recommended: true },
            { id: 'pfms', label: 'PFMS / DBT Integration', desc: 'Direct benefit transfer to Aadhaar-linked accounts', recommended: false },
            { id: 'umang', label: 'UMANG App Plugin', desc: 'Expose services on UMANG mobile app', recommended: false },
            { id: 'whatsapp', label: 'WhatsApp Notifications', desc: 'Status alerts via WhatsApp Business API', recommended: false },
            { id: 'sms', label: 'SMS Gateway (BSNL / Airtel)', desc: 'OTP and status SMS to citizens', recommended: true },
          ].map(intg => (
            <div key={intg.id} className="flex items-center gap-3 p-3.5 border border-border rounded-xl">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                data.integrations?.includes(intg.id) ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Zap className={`w-5 h-5 ${data.integrations?.includes(intg.id) ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{intg.label}</span>
                  {intg.recommended && <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded font-medium">Recommended</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{intg.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={data.integrations?.includes(intg.id) || false}
                onChange={e => {
                  const prev = data.integrations || [];
                  onChange({ ...data, integrations: e.target.checked ? [...prev, intg.id] : prev.filter((i: string) => i !== intg.id) });
                }}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Branding ────────────────────────────────────────────────────────
function StepBranding({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const selectedColor = data.colorPreset || COLOR_PRESETS[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Branding & Customization</h2>
        <p className="text-muted-foreground">Personalize the citizen-facing portal with your department's identity.</p>
      </div>

      {/* Portal URL */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Tenant Subdomain <span className="text-destructive">*</span></label>
        <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring">
          <input
            type="text"
            value={data.subdomain || ''}
            onChange={e => onChange({ ...data, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="revenue-maharashtra"
            className="flex-1 px-4 py-2.5 bg-input text-sm focus:outline-none"
          />
          <span className="px-4 py-2.5 bg-muted text-sm text-muted-foreground font-medium border-l border-border">.serviceformai.gov.in</span>
        </div>
        {data.subdomain && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-success">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>https://{data.subdomain}.serviceformai.gov.in — Available</span>
            </div>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
        )}
      </div>

      {/* Logo Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Department Logo</label>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors group">
            <div className="w-16 h-16 bg-muted rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5 group-hover:text-primary transition-colors" />
            <p className="text-xs text-muted-foreground">PNG/SVG, 512×512px, transparent bg preferred</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">State / National Emblem</label>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors group">
            <div className="w-16 h-16 bg-muted rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5 group-hover:text-primary transition-colors" />
            <p className="text-xs text-muted-foreground">Government seal / state emblem (official use only)</p>
          </div>
        </div>
      </div>

      {/* Color presets */}
      <div>
        <label className="block text-sm font-medium mb-3">Color Theme</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => onChange({ ...data, colorPreset: preset })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedColor.name === preset.name ? 'border-primary' : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.primary }} />
                <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.accent }} />
              </div>
              <span className="text-xs font-medium">{preset.name}</span>
              {selectedColor.name === preset.name && (
                <div className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <Check className="w-3 h-3" /> Selected
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Portal name & tagline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Portal Display Name</label>
          <input
            type="text"
            value={data.portalName || ''}
            onChange={e => onChange({ ...data, portalName: e.target.value })}
            placeholder="Maharashtra Revenue Services"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Portal Tagline</label>
          <input
            type="text"
            value={data.tagline || ''}
            onChange={e => onChange({ ...data, tagline: e.target.value })}
            placeholder="Sarkar Aapke Dwar"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Language options */}
      <div>
        <label className="block text-sm font-medium mb-2">Supported Languages</label>
        <div className="flex flex-wrap gap-2">
          {['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi', 'Odia', 'Urdu'].map(lang => (
            <button
              key={lang}
              onClick={() => {
                const prev = data.languages || ['English'];
                const updated = prev.includes(lang) ? prev.filter((l: string) => l !== lang) : [...prev, lang];
                if (updated.length === 0) return;
                onChange({ ...data, languages: updated });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                (data.languages || ['English']).includes(lang)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">English is always included. AI auto-translates all service content.</p>
      </div>

      {/* Live preview mockup */}
      <div>
        <label className="block text-sm font-medium mb-2">Portal Preview</label>
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="h-10 flex items-center px-4 gap-3" style={{ backgroundColor: selectedColor.primary }}>
            <div className="w-6 h-6 bg-white/20 rounded" />
            <span className="text-white text-sm font-medium">{data.portalName || 'Your Department Portal'}</span>
            <div className="ml-auto flex gap-2">
              <div className="w-16 h-5 bg-white/20 rounded text-xs text-white/70 flex items-center justify-center">Login</div>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-b from-muted/50 to-background">
            <div className="max-w-xs mx-auto text-center space-y-3">
              <div className="w-12 h-12 rounded-xl mx-auto" style={{ backgroundColor: selectedColor.accent + '20' }}>
                <div className="w-full h-full rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6" style={{ color: selectedColor.accent }} />
                </div>
              </div>
              <div className="w-48 h-5 bg-muted rounded mx-auto" />
              <div className="w-32 h-3 bg-muted/60 rounded mx-auto" />
              <div className="flex gap-2 justify-center mt-4">
                {[1,2,3].map(i => (
                  <div key={i} className="w-20 h-16 bg-card border border-border rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Go Live ─────────────────────────────────────────────────────────
function StepGoLive({ data }: { data: any }) {
  const tenantId = `SFAI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your tenant onboarding request has been submitted. Here's everything you need to know about what happens next.
        </p>
      </div>

      {/* Tenant ID */}
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Tenant ID</p>
            <p className="text-2xl font-mono font-bold text-primary mt-1">{tenantId}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy ID'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Save this ID — you'll need it for all support queries and API integrations.</p>
      </div>

      {/* Verification timeline */}
      <div>
        <h3 className="text-base font-semibold mb-4">Onboarding Timeline</h3>
        <div className="space-y-3">
          {[
            {
              step: '1', label: 'Email Verification', desc: 'Check your inbox for a verification link sent to the admin email.',
              status: 'action', time: 'Right now'
            },
            {
              step: '2', label: 'Organization Verification', desc: 'Our team verifies your organization via NIC / MeitY records and uploaded documents.',
              status: 'pending', time: '1–2 business days'
            },
            {
              step: '3', label: 'Tenant Provisioning', desc: 'Your dedicated environment, subdomain, and database namespace are provisioned.',
              status: 'pending', time: 'Within 4 hours of approval'
            },
            {
              step: '4', label: 'Service Manifest Activation', desc: 'AI configures and validates all selected service manifests. You review and approve.',
              status: 'pending', time: 'Day 2–3'
            },
            {
              step: '5', label: 'Go-Live & Training', desc: 'Receive admin credentials, operator training guide, and UAT access link.',
              status: 'pending', time: 'Day 3–5'
            },
          ].map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  item.status === 'action'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {item.step}
                </div>
                {idx < 4 && <div className="w-0.5 h-8 bg-border mt-1" />}
              </div>
              <div className="pb-5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.status === 'action' && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium animate-pulse">Action Required</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-5 border border-border rounded-xl bg-card space-y-3">
        <h3 className="text-sm font-semibold">Registration Summary</h3>
        {[
          { label: 'Organization', value: data.org?.orgName || 'N/A' },
          { label: 'State', value: data.org?.state || 'N/A' },
          { label: 'Services Selected', value: `${(data.services?.selectedServices || []).length} services` },
          { label: 'Portal URL', value: data.branding?.subdomain ? `${data.branding.subdomain}.serviceformai.gov.in` : 'To be configured' },
          { label: 'Admin(s)', value: `${(data.admin?.admins || []).length} admin(s) configured` },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
          <ExternalLink className="w-4 h-4" />
          Access Tenant Dashboard
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Register Another Tenant
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Need help? Contact{' '}
          <a href="mailto:onboarding@serviceformai.gov.in" className="text-primary hover:underline">onboarding@serviceformai.gov.in</a>
          {' '}or call the helpline at <span className="font-medium">1800-XXX-XXXX</span> (toll free, 9AM–6PM IST).
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TenantOnboarding() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [orgData, setOrgData] = useState<any>({});
  const [adminData, setAdminData] = useState<any>({ twoFAMethod: 'OTP via Mobile' });
  const [servicesData, setServicesData] = useState<any>({ selectedServices: ['birth-cert', 'income-cert', 'caste-cert', 'scholarship'], integrations: ['digilocker', 'aadhaar-otp', 'sms'] });
  const [brandingData, setBrandingData] = useState<any>({ colorPreset: COLOR_PRESETS[0], languages: ['English', 'Hindi'] });

  const allData = {
    org: orgData,
    admin: adminData,
    services: servicesData,
    branding: brandingData,
  };

  const canProceed = () => {
    if (step === 1) return orgData.orgType && orgData.orgName && orgData.state;
    if (step === 2) return adminData.admins?.[0]?.name && adminData.admins?.[0]?.email && adminData.admins?.[0]?.mobile;
    if (step === 3) return (servicesData.selectedServices || []).length > 0;
    if (step === 4) return brandingData.subdomain?.length >= 3;
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    if (step === 4) {
      // Submit Registration
      const admin = adminData.admins?.[0];
      if (!admin?.email || !admin?.name) {
        toast.error('Admin email and name are required');
        return;
      }
      setSubmitting(true);
      try {
        await authService.registerTenant({
          email: admin.email as string,
          password: admin.password || 'ChangeMe@123',
          firstName: (admin.name as string).split(' ')[0] ?? admin.name,
          lastName: (admin.name as string).split(' ').slice(1).join(' ') || undefined,
          tenantId: brandingData.subdomain as string,
          role: 'admin',
          orgName: orgData.orgName as string,
        } as any);
        toast.success('Registration submitted!');
        setStep(5);
      } catch (err: any) {
        toast.error(err?.message ?? 'Registration failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep(s => Math.min(5, s + 1));
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            Secure Government Tenant Registration
          </div>
          <h1 className="text-3xl font-bold mb-2">Tenant Self-Onboarding</h1>
          <p className="text-muted-foreground">
            Deploy a fully configured government service portal in under 5 minutes.
            <br />
            Powered by ServiceFormAI OS & Service Manifest Protocol.
          </p>
        </div>

        {/* Step indicator */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <StepIndicator current={step} />
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
          {step === 1 && <StepOrganization data={orgData} onChange={setOrgData} />}
          {step === 2 && <StepAdminSetup data={adminData} onChange={setAdminData} />}
          {step === 3 && <StepServices data={servicesData} onChange={setServicesData} />}
          {step === 4 && <StepBranding data={brandingData} onChange={setBrandingData} />}
          {step === 5 && <StepGoLive data={allData} />}
        </div>

        {/* Navigation */}
        {step < 5 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-3 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-sm text-muted-foreground">
              Step {step} of {STEPS.length - 1}
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceed() || submitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
                canProceed() && !submitting
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : step === 4 ? 'Submit Registration' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!canProceed() && step < 5 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5" />
            Fill in all required fields to continue
          </div>
        )}

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          {[
            { icon: Shield, label: 'ISO 27001 Compliant' },
            { icon: Lock, label: 'End-to-end Encrypted' },
            { icon: BadgeCheck, label: 'MeitY Empanelled' },
            { icon: Globe, label: 'NIC Cloud Hosted' },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-1.5">
              <t.icon className="w-3.5 h-3.5 text-primary" />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
