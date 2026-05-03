import { useState } from 'react';
import {
  Sparkles, CheckCircle, XCircle, AlertCircle, ChevronDown,
  FileText, GraduationCap, Briefcase, Heart, Home, Users, Leaf,
  Shield, Info, ArrowRight, Clock, BadgeCheck, RefreshCw,
  Zap, Eye, Lock, ToggleLeft, ToggleRight, CircleDot, ChevronUp
} from 'lucide-react';

const CITIZEN_PROFILE = {
  name: 'Ananya Sharma',
  age: 22,
  state: 'Maharashtra',
  district: 'Pune',
  gender: 'Female',
  category: 'OBC',
  income: 185000,
  education: 'B.Tech (Final Year)',
  occupation: 'Student',
  aadhaar: true,
  pan: false,
  incomeCert: true,
  studentBonafide: true,
  casteCert: true,
  bankAccount: true,
  domicile: false,
  disabilityStatus: false,
  landholding: 0,
};

const SCHEMES = [
  {
    id: 'state-merit',
    name: 'State Merit Scholarship 2026',
    producer: 'State Welfare Department',
    category: 'scholarship',
    icon: GraduationCap,
    amount: '₹25,000 / year',
    sla: '45 days',
    deadline: '31 Aug 2026',
    result: 'confirmed',
    confidence: 97,
    rulesTotal: 5,
    rulesPassed: 5,
    rulesFailed: 0,
    rules: [
      { label: 'Age ≥ 16', pass: true, evidence: 'Aadhaar DOB' },
      { label: 'Student enrolled (current year)', pass: true, evidence: 'Bonafide Certificate' },
      { label: 'Annual household income ≤ ₹2,50,000', pass: true, evidence: 'Income Certificate (₹1.85L)' },
      { label: 'State resident (Maharashtra)', pass: true, evidence: 'Aadhaar address' },
      { label: 'Category: OBC / SC / ST / Minority', pass: true, evidence: 'Caste Certificate (OBC)' },
    ],
    docsAvailable: ['Aadhaar', 'Income Certificate', 'Student Bonafide', 'Caste Certificate'],
    docsMissing: [],
    citizenMessage: 'You appear eligible. All 5 criteria are met based on your verified documents.',
    color: 'success',
  },
  {
    id: 'pm-scholarship',
    name: 'PM Scholarship for Higher Education',
    producer: 'Ministry of Education, Central Govt',
    category: 'scholarship',
    icon: GraduationCap,
    amount: '₹36,000 / year',
    sla: '60 days',
    deadline: '15 Sep 2026',
    result: 'likely',
    confidence: 74,
    rulesTotal: 6,
    rulesPassed: 4,
    rulesFailed: 0,
    rulesMissing: 2,
    rules: [
      { label: 'Age ≤ 25', pass: true, evidence: 'Aadhaar DOB' },
      { label: 'Enrolled in approved institution', pass: true, evidence: 'Bonafide Certificate' },
      { label: 'Annual income ≤ ₹6,00,000', pass: true, evidence: 'Income Certificate' },
      { label: 'Minimum 60% marks in 12th Std', pass: null, evidence: null, missing: '12th Marksheet not in DigiLocker' },
      { label: 'Not receiving another central scholarship', pass: null, evidence: null, missing: 'Self-declaration required' },
      { label: 'Indian citizen', pass: true, evidence: 'Aadhaar' },
    ],
    docsAvailable: ['Aadhaar', 'Income Certificate', 'Student Bonafide'],
    docsMissing: ['12th Standard Marksheet', 'Self-Declaration Form'],
    citizenMessage: 'You may be eligible. Add your 12th marksheet to DigiLocker to confirm.',
    color: 'warning',
  },
  {
    id: 'mahila-udyam',
    name: 'Mahila Udyam Nidhi – Women MSME',
    producer: 'SIDBI / State Finance Dept',
    category: 'loan',
    icon: Briefcase,
    amount: 'Loan up to ₹10 Lakh',
    sla: '30 days',
    deadline: 'Open',
    result: 'not-eligible',
    confidence: 0,
    rulesTotal: 4,
    rulesPassed: 2,
    rulesFailed: 2,
    rules: [
      { label: 'Age ≥ 18', pass: true, evidence: 'Aadhaar DOB' },
      { label: 'Gender: Female', pass: true, evidence: 'Aadhaar' },
      { label: 'Occupation: Business / Self-employed', pass: false, evidence: null, failReason: 'Profile shows: Student' },
      { label: 'GST registration or Udyam certificate', pass: false, evidence: null, failReason: 'No GST / Udyam doc in DigiLocker' },
    ],
    docsAvailable: [],
    docsMissing: [],
    citizenMessage: 'Not eligible at this time. This scheme is for women with an active business. Check back after starting your enterprise.',
    color: 'destructive',
  },
  {
    id: 'ladki-bahin',
    name: 'Ladki Bahin Yojana – Monthly Allowance',
    producer: 'Maharashtra Women & Child Dept',
    category: 'welfare',
    icon: Heart,
    amount: '₹1,500 / month',
    sla: '21 days',
    deadline: 'Open',
    result: 'likely',
    confidence: 82,
    rulesTotal: 4,
    rulesPassed: 3,
    rulesFailed: 0,
    rulesMissing: 1,
    rules: [
      { label: 'Age 21–65', pass: true, evidence: 'Aadhaar DOB' },
      { label: 'Maharashtra domicile', pass: null, evidence: null, missing: 'Domicile Certificate not in DigiLocker' },
      { label: 'Annual income ≤ ₹2,50,000', pass: true, evidence: 'Income Certificate' },
      { label: 'Female', pass: true, evidence: 'Aadhaar' },
    ],
    docsAvailable: ['Aadhaar', 'Income Certificate'],
    docsMissing: ['Domicile Certificate'],
    citizenMessage: 'You may be eligible. Upload your Domicile Certificate to confirm.',
    color: 'warning',
  },
  {
    id: 'pmay',
    name: 'PM Awas Yojana – Gramin',
    producer: 'Ministry of Rural Development',
    category: 'housing',
    icon: Home,
    amount: '₹1.2 Lakh grant',
    sla: '90 days',
    deadline: 'Open',
    result: 'not-eligible',
    confidence: 0,
    rulesTotal: 4,
    rulesPassed: 1,
    rulesFailed: 3,
    rules: [
      { label: 'Age ≥ 18', pass: true, evidence: 'Aadhaar DOB' },
      { label: 'Rural area resident', pass: false, evidence: null, failReason: 'Aadhaar shows urban Pune address' },
      { label: 'No pucca house', pass: false, evidence: null, failReason: 'Cannot verify — no land record in DigiLocker' },
      { label: 'Income below poverty line', pass: false, evidence: null, failReason: 'Income ₹1.85L — BPL threshold for urban is ₹96K' },
    ],
    docsAvailable: [],
    docsMissing: [],
    citizenMessage: 'Not eligible. This scheme is for rural BPL families. You appear to be in urban Pune.',
    color: 'destructive',
  },
  {
    id: 'antyodaya',
    name: 'Antyodaya Anna Yojana – PDS Ration',
    producer: 'Food & Civil Supplies Dept, MH',
    category: 'welfare',
    icon: Leaf,
    amount: '35 kg grains/month',
    sla: '15 days',
    deadline: 'Open',
    result: 'unknown',
    confidence: 0,
    rulesTotal: 3,
    rulesPassed: 0,
    rulesFailed: 0,
    rulesMissing: 3,
    rules: [
      { label: 'Ration card status', pass: null, evidence: null, missing: 'Ration card not linked to DigiLocker' },
      { label: 'Household income below destitute threshold', pass: null, evidence: null, missing: 'Granular income data needed' },
      { label: 'No other welfare scheme benefit', pass: null, evidence: null, missing: 'Cross-scheme check consent needed' },
    ],
    docsAvailable: [],
    docsMissing: ['Ration Card', 'Additional Income Proof'],
    citizenMessage: 'We need more information to check your eligibility. Grant additional consent or add your ration card.',
    color: 'muted',
  },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  scholarship: GraduationCap,
  loan: Briefcase,
  welfare: Heart,
  housing: Home,
  pension: Users,
  health: Heart,
  agriculture: Leaf,
};
void CATEGORY_ICONS; // reserved for category tabs

const RESULT_CONFIG = {
  confirmed: { label: 'Eligible', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', badge: 'bg-success/10 text-success' },
  likely: { label: 'Likely Eligible', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/5', border: 'border-warning/30', badge: 'bg-warning/10 text-warning' },
  'not-eligible': { label: 'Not Eligible', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5', border: 'border-destructive/20', badge: 'bg-destructive/10 text-destructive' },
  unknown: { label: 'Needs Info', icon: CircleDot, color: 'text-muted-foreground', bg: 'bg-muted/40', border: 'border-border', badge: 'bg-muted text-muted-foreground' },
};

function ConfidenceBar({ value, result }: { value: number; result: string }) {
  const color = result === 'confirmed' ? 'bg-success' : result === 'likely' ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-8">{value > 0 ? `${value}%` : '—'}</span>
    </div>
  );
}

function SchemeCard({ scheme, expanded, onToggle }: { scheme: typeof SCHEMES[0]; expanded: boolean; onToggle: () => void }) {
  const cfg = RESULT_CONFIG[scheme.result as keyof typeof RESULT_CONFIG];
  const Icon = scheme.icon;
  const ResultIcon = cfg.icon;

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-200 ${cfg.border} ${cfg.bg}`}>
      {/* Card header */}
      <button className="w-full text-left p-5" onClick={onToggle}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
            <Icon className={`w-6 h-6 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-semibold text-sm leading-snug">{scheme.name}</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 flex items-center gap-1 ${cfg.badge}`}>
                <ResultIcon className="w-3 h-3" />
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{scheme.producer}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{scheme.amount}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> SLA: {scheme.sla}</span>
              {scheme.deadline !== 'Open' && <span className="flex items-center gap-1 text-warning font-medium">Deadline: {scheme.deadline}</span>}
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
        </div>

        {/* Confidence bar */}
        {scheme.result !== 'not-eligible' && scheme.result !== 'unknown' && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Eligibility confidence</span>
            </div>
            <ConfidenceBar value={scheme.confidence} result={scheme.result} />
          </div>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-current/10 p-5 space-y-5 bg-background/60">
          {/* Citizen-safe message */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
            <Info className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
            <p className="text-sm">{scheme.citizenMessage}</p>
          </div>

          {/* Rules breakdown */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Eligibility Rules ({scheme.rulesPassed}/{scheme.rulesTotal} met)
            </h4>
            <div className="space-y-2">
              {scheme.rules.map((rule, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  rule.pass === true ? 'bg-success/5 border-success/20' :
                  rule.pass === false ? 'bg-destructive/5 border-destructive/20' :
                  'bg-muted/50 border-border'
                }`}>
                  {rule.pass === true ? <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> :
                   rule.pass === false ? <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" /> :
                   <CircleDot className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{rule.label}</p>
                    {rule.evidence && <p className="text-xs text-success mt-0.5 flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Verified via: {rule.evidence}</p>}
                    {(rule as any).missing && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Needs: {(rule as any).missing}</p>}
                    {(rule as any).failReason && <p className="text-xs text-destructive mt-0.5">{(rule as any).failReason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          {(scheme.docsAvailable.length > 0 || scheme.docsMissing.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scheme.docsAvailable.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-success mb-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> In your DigiLocker</p>
                  <div className="space-y-1.5">
                    {scheme.docsAvailable.map(d => (
                      <div key={d} className="flex items-center gap-2 px-3 py-2 bg-success/5 border border-success/20 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-success flex-shrink-0" />
                        <span className="text-xs">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {scheme.docsMissing.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warning mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Missing documents</p>
                  <div className="space-y-1.5">
                    {scheme.docsMissing.map(d => (
                      <div key={d} className="flex items-center gap-2 px-3 py-2 bg-warning/5 border border-warning/20 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                        <span className="text-xs">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          {scheme.result !== 'not-eligible' && (
            <div className="flex gap-3 pt-1">
              {scheme.result === 'confirmed' && (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {scheme.result === 'likely' && (
                <>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                    Add Missing Docs <FileText className="w-4 h-4" />
                  </button>
                  <button className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                    Apply Anyway
                  </button>
                </>
              )}
              {scheme.result === 'unknown' && (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
                  Grant Consent to Check <Lock className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EligibilityEngine() {
  const [consentGranted, setConsentGranted] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>('state-merit');
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'likely' | 'missing'>('all');
  const [profileExpanded, setProfileExpanded] = useState(false);

  const confirmed = SCHEMES.filter(s => s.result === 'confirmed');
  const likely = SCHEMES.filter(s => s.result === 'likely');
  const notEligible = SCHEMES.filter(s => s.result === 'not-eligible' || s.result === 'unknown');

  const filtered = activeFilter === 'confirmed' ? confirmed
    : activeFilter === 'likely' ? likely
    : activeFilter === 'missing' ? notEligible
    : SCHEMES;

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-primary uppercase tracking-wide">Eligibility Discovery Engine</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">What am I eligible for?</h1>
          <p className="text-muted-foreground">
            Based on your verified DigiLocker documents and profile, here are the government schemes and services you may qualify for.
            <span className="text-primary font-medium"> Rules decide. AI assists. You control consent.</span>
          </p>
        </div>

        {/* Consent Banner */}
        <div className={`rounded-2xl border-2 p-5 mb-6 transition-all ${consentGranted ? 'bg-success/5 border-success/30' : 'bg-warning/5 border-warning/30'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${consentGranted ? 'bg-success/10' : 'bg-warning/10'}`}>
                {consentGranted ? <Shield className="w-5 h-5 text-success" /> : <Lock className="w-5 h-5 text-warning" />}
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">
                  {consentGranted ? 'Discovery Consent Active' : 'Discovery Consent Required'}
                </p>
                <p className="text-xs text-muted-foreground max-w-lg">
                  {consentGranted
                    ? 'Your verified documents and profile are being used to check eligibility for the schemes below. This consent is for discovery only — you must consent again separately before applying.'
                    : 'To check your eligibility automatically, grant consent to use your DigiLocker document metadata. No documents leave the platform boundary.'}
                </p>
                {consentGranted && (
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-success" /> Purpose: Eligibility discovery only</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Valid: 90 days (until 29 Jul 2026)</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Data: Metadata only — no document content shared</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setConsentGranted(!consentGranted)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                consentGranted ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {consentGranted ? <><ToggleRight className="w-4 h-4" /> Revoke</> : <><ToggleLeft className="w-4 h-4" /> Grant Consent</>}
            </button>
          </div>
        </div>

        {/* Citizen profile summary */}
        <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
            onClick={() => setProfileExpanded(!profileExpanded)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary">AS</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{CITIZEN_PROFILE.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CITIZEN_PROFILE.age} yrs · {CITIZEN_PROFILE.category} · {CITIZEN_PROFILE.district}, {CITIZEN_PROFILE.state} · {CITIZEN_PROFILE.occupation}
                </p>
              </div>
              <div className="flex gap-1.5 ml-2">
                {[
                  { k: 'aadhaar', label: 'Aadhaar' },
                  { k: 'incomeCert', label: 'Income' },
                  { k: 'studentBonafide', label: 'Bonafide' },
                  { k: 'casteCert', label: 'Caste' },
                ].map(d => (
                  <span key={d.k} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    CITIZEN_PROFILE[d.k as keyof typeof CITIZEN_PROFILE] ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>{d.label}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Profile data used for matching</span>
              {profileExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          {profileExpanded && (
            <div className="border-t border-border p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm mb-4">
                {[
                  { label: 'Age', val: `${CITIZEN_PROFILE.age} years` },
                  { label: 'State', val: CITIZEN_PROFILE.state },
                  { label: 'District', val: CITIZEN_PROFILE.district },
                  { label: 'Category', val: CITIZEN_PROFILE.category },
                  { label: 'Education', val: CITIZEN_PROFILE.education },
                  { label: 'Occupation', val: CITIZEN_PROFILE.occupation },
                  { label: 'Annual Income', val: `₹${CITIZEN_PROFILE.income.toLocaleString('en-IN')}` },
                  { label: 'Gender', val: CITIZEN_PROFILE.gender },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium">{item.val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">DigiLocker Document Status</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Aadhaar', ok: true }, { label: 'PAN', ok: false },
                    { label: 'Income Certificate', ok: true }, { label: 'Student Bonafide', ok: true },
                    { label: 'Caste Certificate', ok: true }, { label: 'Bank Passbook', ok: true },
                    { label: 'Domicile Certificate', ok: false }, { label: '12th Marksheet', ok: false },
                  ].map(d => (
                    <span key={d.label} className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-full border ${
                      d.ok ? 'bg-success/10 border-success/30 text-success' : 'bg-muted border-border text-muted-foreground'
                    }`}>
                      {d.ok ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Eligible', count: confirmed.length, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
            { label: 'Likely Eligible', count: likely.length, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
            { label: 'Not Eligible', count: notEligible.filter(s => s.result === 'not-eligible').length, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
            { label: 'Needs Info', count: notEligible.filter(s => s.result === 'unknown').length, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
          ].map(s => (
            <div key={s.label} className={`p-4 rounded-xl border ${s.bg} ${s.border} text-center`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        {confirmed.length > 1 && (
          <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Apply for all eligible schemes at once</p>
              <p className="text-xs text-muted-foreground">You can bundle {confirmed.length} confirmed applications in one journey using your verified documents.</p>
            </div>
            <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              Bundle Apply <Zap className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto">
          {[
            { id: 'all', label: `All (${SCHEMES.length})` },
            { id: 'confirmed', label: `Eligible (${confirmed.length})` },
            { id: 'likely', label: `Likely (${likely.length})` },
            { id: 'missing', label: `Others (${notEligible.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                activeFilter === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button className="ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-xl text-sm hover:bg-muted/80 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Scheme cards */}
        <div className="space-y-4">
          {filtered.map(scheme => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              expanded={expandedId === scheme.id}
              onToggle={() => setExpandedId(expandedId === scheme.id ? null : scheme.id)}
            />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> Eligibility results are indicative based on your DigiLocker document metadata and profile. 
            Final eligibility is determined by the issuing department during application processing. 
            Results are not a guarantee of benefit sanction.
          </p>
        </div>
      </div>
    </div>
  );
}
