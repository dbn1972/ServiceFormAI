import { useState } from 'react';
import {
  Shield, Download, Trash2, Edit, Eye, CheckCircle, Clock,
  User, FileText, Globe, Database, Key, ChevronRight, ChevronDown,
  Info, ArrowRight, XCircle, BadgeCheck, Calendar,
  Building2, Smartphone, RefreshCw, Send, AlertTriangle,
  UserCheck
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type DataCategory = 'identity' | 'biometric' | 'financial' | 'education' | 'location' | 'device' | 'behavioral';
type LegalBasis = 'consent' | 'legal_obligation' | 'public_interest' | 'legitimate_interest';
type RightStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

// ── Data ─────────────────────────────────────────────────────────────────────
const DATA_INVENTORY = [
  {
    id: 'identity', category: 'identity' as DataCategory, label: 'Identity Information',
    icon: User, color: 'text-primary', bg: 'bg-primary/10',
    items: [
      { field: 'Full Name', source: 'Aadhaar API', purpose: 'Service application prefill', retention: '7 years after last activity' },
      { field: 'Date of Birth', source: 'Aadhaar API', purpose: 'Eligibility age check', retention: '7 years after last activity' },
      { field: 'Gender', source: 'Aadhaar API / Self-declared', purpose: 'Scheme eligibility', retention: '7 years after last activity' },
      { field: 'Aadhaar Number (masked)', source: 'Aadhaar API', purpose: 'Identity verification', retention: 'Stored as hash only. Never stored in plain text.' },
      { field: 'PAN Number (masked)', source: 'Self-declared / NSDL API', purpose: 'Income & tax verification', retention: 'Stored as hash only.' },
    ],
  },
  {
    id: 'contact', category: 'identity' as DataCategory, label: 'Contact Information',
    icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50',
    items: [
      { field: 'Mobile Number', source: 'Registration', purpose: 'OTP, notifications, alerts', retention: '7 years after last activity' },
      { field: 'Email Address', source: 'Registration', purpose: 'Notifications, acknowledgements', retention: '7 years after last activity' },
      { field: 'Residential Address', source: 'Aadhaar API / Self-declared', purpose: 'Jurisdiction routing, correspondence', retention: '7 years' },
    ],
  },
  {
    id: 'financial', category: 'financial' as DataCategory, label: 'Financial Information',
    icon: Database, color: 'text-warning', bg: 'bg-warning/10',
    items: [
      { field: 'Bank Account (masked)', source: 'Self-declared + Penny Drop Verification', purpose: 'Benefit disbursement (DBT)', retention: 'Account number hashed after DBT processing.' },
      { field: 'Annual Income (range)', source: 'Income Certificate metadata', purpose: 'Eligibility screening', retention: '3 years after service completion.' },
      { field: 'IFSC Code', source: 'Self-declared', purpose: 'DBT routing', retention: '3 years.' },
    ],
  },
  {
    id: 'education', category: 'education' as DataCategory, label: 'Education Data',
    icon: FileText, color: 'text-success', bg: 'bg-success/10',
    items: [
      { field: 'Enrollment Status', source: 'Bonafide Certificate metadata', purpose: 'Scholarship eligibility', retention: 'Duration of scheme + 3 years.' },
      { field: 'Institution Name', source: 'Self-declared', purpose: 'Scheme routing to district office', retention: 'Duration of scheme + 3 years.' },
    ],
  },
  {
    id: 'technical', category: 'device' as DataCategory, label: 'Technical & Device Data',
    icon: Globe, color: 'text-muted-foreground', bg: 'bg-muted',
    items: [
      { field: 'IP Address (anonymized as hash)', source: 'Platform (automatic)', purpose: 'Security — fraud detection, rate limiting', retention: '90 days, then deleted.' },
      { field: 'Device Type / Browser', source: 'Platform (automatic)', purpose: 'UX optimization, accessibility', retention: 'Session only, not persisted.' },
      { field: 'Login Timestamps', source: 'Platform (automatic)', purpose: 'Audit trail (DPDP Act requirement)', retention: '7 years (regulatory).' },
    ],
  },
];

const PROCESSING_RECORDS = [
  { id: 'PR-001', purpose: 'User account registration and authentication', legalBasis: 'consent' as LegalBasis, dataUsed: ['Identity', 'Contact', 'Technical'], recipients: ['Platform internal'], retention: '7 years', crossBorder: false },
  { id: 'PR-002', purpose: 'Eligibility discovery using DigiLocker document metadata', legalBasis: 'consent' as LegalBasis, dataUsed: ['Identity', 'Financial', 'Education'], recipients: ['Eligibility Engine (internal)'], retention: '90 days (consent-linked)', crossBorder: false },
  { id: 'PR-003', purpose: 'Scholarship / welfare scheme application submission', legalBasis: 'consent' as LegalBasis, dataUsed: ['Identity', 'Financial', 'Education', 'Contact'], recipients: ['State Welfare Department'], retention: '7 years (government record)', crossBorder: false },
  { id: 'PR-004', purpose: 'OTP-based authentication (Aadhaar eKYC)', legalBasis: 'consent' as LegalBasis, dataUsed: ['Identity (Aadhaar)'], recipients: ['UIDAI API (government)'], retention: 'Not retained — real-time verification only', crossBorder: false },
  { id: 'PR-005', purpose: 'SMS / Email notification dispatch', legalBasis: 'consent' as LegalBasis, dataUsed: ['Contact (mobile, email)'], recipients: ['MSG91 SMS Gateway (India)', 'AWS SES Email (India region)'], retention: 'Delivery logs: 30 days', crossBorder: false },
  { id: 'PR-006', purpose: 'Platform security, fraud prevention, and audit logging', legalBasis: 'legal_obligation' as LegalBasis, dataUsed: ['Technical (IP hash, timestamps)'], recipients: ['Platform security team'], retention: '7 years (DPDP regulatory)', crossBorder: false },
];

const RIGHTS_HISTORY = [
  { id: 'REQ-2026-001', type: 'access', label: 'Data Access Request', filed: '25 Apr 2026', deadline: '25 May 2026', status: 'completed' as RightStatus, response: 'Complete data export (JSON + PDF) delivered on 28 Apr 2026 via secure download link.' },
  { id: 'REQ-2026-002', type: 'correction', label: 'Correction Request', filed: '20 Apr 2026', deadline: '20 May 2026', status: 'in_progress' as RightStatus, response: 'Under review — district office verification required for address correction. Expected: 5 May 2026.' },
  { id: 'REQ-2025-007', type: 'erasure', label: 'Erasure Request (Partial)', filed: '10 Dec 2025', deadline: '10 Jan 2026', status: 'completed' as RightStatus, response: 'Technical logs (IP hashes) from 2024 deleted. Active application records retained as required by government archival rules.' },
];

const LEGAL_BASIS_CONFIG: Record<LegalBasis, { label: string; color: string; bg: string; desc: string }> = {
  consent: { label: 'Consent (Section 7)', color: 'text-primary', bg: 'bg-primary/10', desc: 'You have explicitly consented to this processing.' },
  legal_obligation: { label: 'Legal Obligation (Section 8)', color: 'text-warning', bg: 'bg-warning/10', desc: 'Required by law — DPDP Act, IT Act, or government archival rules.' },
  public_interest: { label: 'Public Interest (Section 9)', color: 'text-success', bg: 'bg-success/10', desc: 'Processing in public interest — government service delivery.' },
  legitimate_interest: { label: 'Legitimate Interest', color: 'text-muted-foreground', bg: 'bg-muted', desc: 'Platform security and fraud prevention.' },
};

const RIGHT_STATUS_CONFIG: Record<RightStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'Filed — Awaiting Review', color: 'text-warning', bg: 'bg-warning/10', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10', icon: RefreshCw },
  completed: { label: 'Completed', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle },
  rejected: { label: 'Rejected (Reason provided)', color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle },
};

// ── Components ────────────────────────────────────────────────────────────────
function RightRequestCard({ title, description, icon: Icon, color, bg, onClick }: {
  title: string; description: string; icon: React.ElementType;
  color: string; bg: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-2xl border-2 border-border hover:border-current/30 transition-all group ${bg}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white/50`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className={`text-sm font-semibold ${color} mb-1`}>{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${color}`}>
        Submit Request <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DPDPPrivacyCenter() {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'processing' | 'rights' | 'fiduciary'>('overview');
  const [expandedSection, setExpandedSection] = useState<string | null>('identity');
  const [activeRight, setActiveRight] = useState<string | null>(null);
  const [rightFormStep, setRightFormStep] = useState(1);
  const [formData, setFormData] = useState({ reason: '', categories: [] as string[], confirm: false });

  const RIGHTS = [
    { id: 'access', title: 'Right to Access', icon: Eye, color: 'text-primary', bg: 'bg-primary/5', description: 'Receive a complete copy of all personal data we hold about you, including processing records and consent logs. Fulfilled within 30 days as per DPDP Act Section 11.' },
    { id: 'correction', title: 'Right to Correction', icon: Edit, color: 'text-warning', bg: 'bg-warning/5', description: 'Request correction of inaccurate or incomplete personal data. We will verify with issuing authority where legally required. Section 12(a).' },
    { id: 'erasure', title: 'Right to Erasure', icon: Trash2, color: 'text-destructive', bg: 'bg-destructive/5', description: 'Request deletion of personal data no longer needed, or where consent is withdrawn. Some data may be retained as required by law. Section 12(b).' },
    { id: 'portability', title: 'Right to Portability', icon: Download, color: 'text-success', bg: 'bg-success/5', description: 'Download all your data in a machine-readable format (JSON/PDF) to transfer to another platform or for your records. Section 11(b).' },
    { id: 'grievance', title: 'Right to Grievance', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', description: 'File a grievance against any data processing activity you believe violates your rights. Response guaranteed within 30 days. Section 13.' },
    { id: 'nominate', title: 'Right to Nominate', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50', description: 'Nominate a trusted person to exercise your data rights on your behalf (for minors, elderly, or deceased account holders). Section 14.' },
  ];

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-primary uppercase tracking-wide">Digital Personal Data Protection Act 2023</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Your Privacy Centre</h1>
          <p className="text-muted-foreground">Under the DPDP Act 2023, you have comprehensive rights over your personal data. This centre gives you full visibility and control.</p>
        </div>

        {/* Compliance badge */}
        <div className="flex flex-wrap gap-4 mb-8">
          {[
            { label: 'DPDP Act 2023 Compliant', icon: BadgeCheck, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Data Fiduciary Registered', icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'No Cross-border Transfer', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Consent-led Processing', icon: Key, color: 'text-warning', bg: 'bg-warning/10' },
          ].map(b => (
            <div key={b.label} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${b.bg}`}>
              <b.icon className={`w-4 h-4 ${b.color}`} />
              <span className={`text-xs font-medium ${b.color}`}>{b.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl mb-8 overflow-x-auto">
          {([
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'inventory', label: 'My Data', icon: Database },
            { id: 'processing', label: 'Processing Records', icon: FileText },
            { id: 'rights', label: 'My Rights', icon: Shield },
            { id: 'fiduciary', label: 'Data Fiduciary', icon: Building2 },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Data Categories Held', val: '5', icon: Database, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'Active Consents', val: '1', icon: Key, color: 'text-success', bg: 'bg-success/10' },
                { label: 'Pending Rights Requests', val: '1', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
                { label: 'Processing Activities', val: '6', icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Key rights summary */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-4">Your Rights Under DPDP Act 2023</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RIGHTS.map(r => (
                  <div key={r.id} className={`flex items-start gap-3 p-4 rounded-xl ${r.bg} border border-current/10`}>
                    <r.icon className={`w-5 h-5 ${r.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className={`text-sm font-semibold ${r.color}`}>{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.description}</p>
                      <button
                        onClick={() => { setActiveTab('rights'); setActiveRight(r.id); }}
                        className={`text-xs font-medium mt-2 flex items-center gap-1 ${r.color} hover:underline`}
                      >
                        Exercise this right <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 30-day timer reminder */}
            <div className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">30-Day Response Guarantee</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Under Section 11–13 of the DPDP Act 2023, ServiceFormAI OS (as Data Fiduciary) is legally required to respond to all data access, correction, and erasure requests within <strong>30 calendar days</strong>. If we fail to respond in time, you may escalate directly to the <strong>Data Protection Board of India</strong>.
                </p>
                <a href="#" className="text-xs text-primary hover:underline mt-1.5 flex items-center gap-1">
                  Contact Data Protection Board of India <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── My Data / Inventory ── */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Complete inventory of personal data held by ServiceFormAI OS about your account.</p>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4" /> Download Full Report
              </button>
            </div>

            {DATA_INVENTORY.map(section => (
              <div key={section.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${section.bg}`}>
                    <section.icon className={`w-5 h-5 ${section.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.items.length} data fields</p>
                  </div>
                  {expandedSection === section.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {expandedSection === section.id && (
                  <div className="border-t border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          {['Data Field', 'Source', 'Purpose', 'Retention Period'].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {section.items.map((item, i) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium">{item.field}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{item.source}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{item.purpose}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{item.retention}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Processing Records ── */}
        {activeTab === 'processing' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">All personal data processing activities, including their lawful basis and data recipients, as required under DPDP Act Section 5 & 6.</p>
            {PROCESSING_RECORDS.map(pr => {
              const lbCfg = LEGAL_BASIS_CONFIG[pr.legalBasis];
              return (
                <div key={pr.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{pr.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lbCfg.bg} ${lbCfg.color}`}>{lbCfg.label}</span>
                        {!pr.crossBorder && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success/10 text-success flex items-center gap-1">
                            <Globe className="w-3 h-3" /> India-only
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold">{pr.purpose}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Data Used</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pr.dataUsed.map(d => <span key={d} className="text-xs px-2 py-0.5 bg-muted rounded-full">{d}</span>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Recipients</p>
                      <div className="space-y-0.5">
                        {pr.recipients.map(r => <p key={r} className="text-xs">{r}</p>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Retention</p>
                      <p className="text-xs">{pr.retention}</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 inline mr-1" />
                    {lbCfg.desc}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Rights ── */}
        {activeTab === 'rights' && (
          <div className="space-y-6">
            {!activeRight ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {RIGHTS.map(r => (
                    <RightRequestCard
                      key={r.id}
                      title={r.title}
                      description={r.description}
                      icon={r.icon}
                      color={r.color}
                      bg={r.bg}
                      onClick={() => { setActiveRight(r.id); setRightFormStep(1); }}
                    />
                  ))}
                </div>

                {/* Past requests */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h2 className="text-base font-semibold">Rights Request History</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">All requests tracked with mandatory 30-day response timer.</p>
                  </div>
                  <div className="divide-y divide-border">
                    {RIGHTS_HISTORY.map(req => {
                      const statusCfg = RIGHT_STATUS_CONFIG[req.status];
                      const StatusIcon = statusCfg.icon;
                      return (
                        <div key={req.id} className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-muted-foreground">{req.id}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color}`}>
                                  <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                                </span>
                              </div>
                              <p className="text-sm font-semibold">{req.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Filed: {req.filed} · Response deadline: {req.deadline}</p>
                            </div>
                          </div>
                          {req.response && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground flex items-start gap-2">
                              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              {req.response}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              // Request form
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center gap-3">
                  <button onClick={() => setActiveRight(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-180 text-muted-foreground" />
                  </button>
                  <div>
                    <p className="text-sm font-semibold">{RIGHTS.find(r => r.id === activeRight)?.title}</p>
                    <p className="text-xs text-muted-foreground">Step {rightFormStep} of 3</p>
                  </div>
                </div>

                <div className="p-6">
                  {/* Step progress */}
                  <div className="flex items-center gap-3 mb-8">
                    {['Identify Data', 'Provide Reason', 'Confirm & Submit'].map((step, i) => (
                      <div key={step} className="flex items-center gap-2 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rightFormStep > i + 1 ? 'bg-primary text-primary-foreground' : rightFormStep === i + 1 ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'}`}>
                          {rightFormStep > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-xs font-medium hidden sm:block ${rightFormStep === i + 1 ? 'text-primary' : 'text-muted-foreground'}`}>{step}</span>
                        {i < 2 && <div className={`flex-1 h-0.5 ${rightFormStep > i + 1 ? 'bg-primary' : 'bg-border'}`} />}
                      </div>
                    ))}
                  </div>

                  {rightFormStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Select the data categories this request applies to:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DATA_INVENTORY.map(s => (
                          <label key={s.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.categories.includes(s.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                            <input
                              type="checkbox"
                              checked={formData.categories.includes(s.id)}
                              onChange={e => setFormData(prev => ({ ...prev, categories: e.target.checked ? [...prev.categories, s.id] : prev.categories.filter(c => c !== s.id) }))}
                              className="w-4 h-4 text-primary rounded"
                            />
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                              <s.icon className={`w-4 h-4 ${s.color}`} />
                            </div>
                            <span className="text-sm font-medium">{s.label}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => setRightFormStep(2)}
                        disabled={formData.categories.length === 0}
                        className="mt-4 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {rightFormStep === 2 && (
                    <div className="space-y-4 max-w-lg">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Reason for request (optional but helpful)</label>
                        <textarea
                          value={formData.reason}
                          onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                          rows={4}
                          placeholder="Describe why you are exercising this right..."
                          className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                      </div>
                      <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl text-xs text-muted-foreground">
                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-warning" />
                        Some data categories may be retained by law even after an erasure request (e.g., application records required by government archival rules). We will clearly indicate what could and could not be deleted.
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setRightFormStep(1)} className="px-5 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors">Back</button>
                        <button onClick={() => setRightFormStep(3)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
                          Continue <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {rightFormStep === 3 && (
                    <div className="space-y-5 max-w-lg">
                      <div className="p-5 bg-muted/30 border border-border rounded-xl space-y-3">
                        <p className="text-sm font-semibold">Request Summary</p>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between"><span className="text-muted-foreground">Right:</span><span className="font-medium">{RIGHTS.find(r => r.id === activeRight)?.title}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Data categories:</span><span className="font-medium">{formData.categories.length} selected</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Response deadline:</span><span className="font-medium text-primary">30 days from submission</span></div>
                        </div>
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.confirm} onChange={e => setFormData(prev => ({ ...prev, confirm: e.target.checked }))} className="w-4 h-4 mt-0.5 text-primary rounded" />
                        <span className="text-sm text-muted-foreground">I confirm this request is being made by me (or my authorised nominee) and I understand that some data may be retained as required by law.</span>
                      </label>
                      <div className="flex gap-3">
                        <button onClick={() => setRightFormStep(2)} className="px-5 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors">Back</button>
                        <button
                          disabled={!formData.confirm}
                          onClick={() => { setActiveRight(null); setRightFormStep(1); setFormData({ reason: '', categories: [], confirm: false }); }}
                          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" /> Submit Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Data Fiduciary ── */}
        {activeTab === 'fiduciary' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Registered Data Fiduciary</p>
                  <h2 className="text-xl font-bold">ServiceFormAI OS Private Limited</h2>
                  <p className="text-sm text-muted-foreground mt-1">CIN: U72900MH2025PTC123456 | DPDP Registration No.: DFR-2026-00234</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Registered Office', val: '10th Floor, Tower B, BKC, Mumbai, Maharashtra – 400051', icon: Globe },
                  { label: 'Data Protection Officer', val: 'Shri Aditya Nair, DPO\ndpo@serviceformai.gov.in\n+91-22-XXXX-XXXX', icon: UserCheck },
                  { label: 'Grievance Officer', val: 'Ms. Priya Menon, Grievance Officer\ngrievance@serviceformai.gov.in\n+91-22-XXXX-XXXX', icon: AlertTriangle },
                  { label: 'DPDP Board Escalation', val: 'Data Protection Board of India\nhttps://dpb.gov.in\nFor unresolved grievances after 30 days.', icon: Shield },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">{item.label}</p>
                      <p className="text-sm whitespace-pre-line">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-4">DPDP Act Compliance Status</h2>
              <div className="space-y-3">
                {[
                  { item: 'Data Fiduciary registration with DPBI', status: true },
                  { item: 'Privacy Notice published and accessible', status: true },
                  { item: 'Consent mechanism — specific, informed, unconditional, unambiguous', status: true },
                  { item: 'Data minimisation — only necessary data collected', status: true },
                  { item: 'Purpose limitation — data not used beyond stated purpose', status: true },
                  { item: 'Storage limitation — retention policies enforced', status: true },
                  { item: 'Data Protection Officer appointed', status: true },
                  { item: 'Grievance redressal mechanism with 30-day SLA', status: true },
                  { item: 'No cross-border data transfer without Board approval', status: true },
                  { item: 'Children\'s data — no processing without verifiable parental consent', status: true },
                ].map(c => (
                  <div key={c.item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">{c.item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
