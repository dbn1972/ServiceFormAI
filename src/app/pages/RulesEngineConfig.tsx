import { useState, useCallback } from 'react';
import {
  Plus, Trash2, ChevronDown, Play, Save, Upload, Download, Copy,
  CheckCircle, XCircle, AlertCircle, GitBranch, Clock, Eye,
  ToggleLeft, ToggleRight, Shield, FileText, Code,
  Users, BadgeCheck,
  Hash, TrendingUp, ChevronUp
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type LogicOp = 'AND' | 'OR';
type Operator = '==' | '!=' | '>=' | '<=' | '>' | '<' | 'in' | 'not_in' | 'exists' | 'not_exists' | 'matches_regex';
type EvidenceSource = 'digilocker' | 'aadhaar_api' | 'self_declared' | 'institution_api' | 'db_record';
type ResultClass = 'CONFIRMED_MATCH' | 'LIKELY_MATCH' | 'NEEDS_MORE_INFO' | 'NOT_ELIGIBLE';
type RuleVersion = { version: string; status: 'published' | 'draft' | 'review'; date: string; author: string; changes: string };

interface Condition {
  id: string;
  field: string;
  operator: Operator;
  value: string;
  evidenceSource: EvidenceSource;
  weight: number;
  enabled: boolean;
  resultIfFail: ResultClass;
  citizenMessage: string;
}

interface RuleGroup {
  id: string;
  name: string;
  logicOp: LogicOp;
  conditions: Condition[];
  enabled: boolean;
}

interface Service {
  id: string;
  name: string;
  category: string;
  dept: string;
  groups: RuleGroup[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CITIZEN_FIELDS = [
  { label: 'Age', value: 'citizen.age', type: 'number' },
  { label: 'Gender', value: 'citizen.gender', type: 'enum', options: ['Male', 'Female', 'Transgender', 'Other'] },
  { label: 'State', value: 'citizen.state', type: 'string' },
  { label: 'District', value: 'citizen.district', type: 'string' },
  { label: 'Category (Caste)', value: 'citizen.category', type: 'enum', options: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'] },
  { label: 'Annual Household Income (₹)', value: 'household.annualIncome', type: 'number' },
  { label: 'Education Status', value: 'citizen.education.status', type: 'enum', options: ['ENROLLED', 'GRADUATED', 'DROPOUT', 'NOT_ENROLLED'] },
  { label: 'Occupation', value: 'citizen.occupation', type: 'enum', options: ['Student', 'Farmer', 'Business', 'Govt Employee', 'Private Employee', 'Self-Employed', 'Unemployed'] },
  { label: 'Disability Status', value: 'citizen.disability', type: 'boolean' },
  { label: 'Land Holding (acres)', value: 'citizen.landHolding', type: 'number' },
  { label: 'Aadhaar Verified', value: 'docs.aadhaar.verified', type: 'boolean' },
  { label: 'Income Certificate — Present', value: 'docs.incomeCert.exists', type: 'boolean' },
  { label: 'Income Certificate — Age (months)', value: 'docs.incomeCert.ageMonths', type: 'number' },
  { label: 'Student Bonafide — Present', value: 'docs.bonafide.exists', type: 'boolean' },
  { label: 'Caste Certificate — Present', value: 'docs.casteCert.exists', type: 'boolean' },
  { label: 'Domicile Certificate — Present', value: 'docs.domicile.exists', type: 'boolean' },
  { label: 'Bank Account Verified', value: 'docs.bankAccount.verified', type: 'boolean' },
  { label: 'Currently Receiving Same Benefit', value: 'benefits.sameCategory.active', type: 'boolean' },
  { label: 'Previous Scholarship Received', value: 'benefits.scholarship.count', type: 'number' },
];

const OPERATORS: { op: Operator; label: string; types: string[] }[] = [
  { op: '==', label: 'equals', types: ['number', 'string', 'enum', 'boolean'] },
  { op: '!=', label: 'not equals', types: ['number', 'string', 'enum', 'boolean'] },
  { op: '>=', label: '≥ (min)', types: ['number'] },
  { op: '<=', label: '≤ (max)', types: ['number'] },
  { op: '>', label: '> (greater than)', types: ['number'] },
  { op: '<', label: '< (less than)', types: ['number'] },
  { op: 'in', label: 'is one of', types: ['enum', 'string'] },
  { op: 'not_in', label: 'is not one of', types: ['enum', 'string'] },
  { op: 'exists', label: 'is present / true', types: ['boolean'] },
  { op: 'not_exists', label: 'is absent / false', types: ['boolean'] },
];

const EVIDENCE_SOURCES: { id: EvidenceSource; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'digilocker', label: 'DigiLocker', icon: Shield, color: 'text-primary' },
  { id: 'aadhaar_api', label: 'Aadhaar API', icon: BadgeCheck, color: 'text-indigo-600' },
  { id: 'self_declared', label: 'Self-Declared', icon: Users, color: 'text-muted-foreground' },
  { id: 'institution_api', label: 'Institution API', icon: FileText, color: 'text-purple-600' },
  { id: 'db_record', label: 'Platform DB', icon: Hash, color: 'text-orange-600' },
];

const RESULT_CLASSES: { id: ResultClass; label: string; color: string; bg: string }[] = [
  { id: 'CONFIRMED_MATCH', label: 'Confirmed Match', color: 'text-success', bg: 'bg-success/10' },
  { id: 'LIKELY_MATCH', label: 'Likely Match', color: 'text-warning', bg: 'bg-warning/10' },
  { id: 'NEEDS_MORE_INFO', label: 'Needs More Info', color: 'text-primary', bg: 'bg-primary/10' },
  { id: 'NOT_ELIGIBLE', label: 'Not Eligible', color: 'text-destructive', bg: 'bg-destructive/10' },
];

const VERSIONS: RuleVersion[] = [
  { version: 'v2.1', status: 'draft', date: '30 Apr 2026', author: 'Admin (You)', changes: 'Added income certificate age validation (≤12 months)' },
  { version: 'v2.0', status: 'published', date: '1 Apr 2026', author: 'Dept Admin', changes: 'Raised income ceiling to ₹2.5L. Added EWS category.' },
  { version: 'v1.9', status: 'published', date: '15 Jan 2026', author: 'IT Nodal Officer', changes: 'Added disability exception — income ceiling waived.' },
  { version: 'v1.8', status: 'published', date: '1 Nov 2025', author: 'Dept Admin', changes: 'Initial production release.' },
];

const DEFAULT_SERVICES: Service[] = [
  {
    id: 'scholarship.state.merit.2026',
    name: 'State Merit Scholarship 2026',
    category: 'SCHEME',
    dept: 'State Welfare Department',
    groups: [
      {
        id: 'g1', name: 'Identity & Age', logicOp: 'AND', enabled: true,
        conditions: [
          { id: 'c1', field: 'citizen.age', operator: '>=', value: '16', evidenceSource: 'aadhaar_api', weight: 5, enabled: true, resultIfFail: 'NOT_ELIGIBLE', citizenMessage: 'Applicant must be at least 16 years old.' },
          { id: 'c2', field: 'docs.aadhaar.verified', operator: 'exists', value: 'true', evidenceSource: 'aadhaar_api', weight: 5, enabled: true, resultIfFail: 'NEEDS_MORE_INFO', citizenMessage: 'Aadhaar verification is required.' },
        ],
      },
      {
        id: 'g2', name: 'Education Eligibility', logicOp: 'AND', enabled: true,
        conditions: [
          { id: 'c3', field: 'citizen.education.status', operator: '==', value: 'ENROLLED', evidenceSource: 'digilocker', weight: 5, enabled: true, resultIfFail: 'NOT_ELIGIBLE', citizenMessage: 'Applicant must be currently enrolled in a recognised institution.' },
          { id: 'c4', field: 'docs.bonafide.exists', operator: 'exists', value: 'true', evidenceSource: 'digilocker', weight: 4, enabled: true, resultIfFail: 'NEEDS_MORE_INFO', citizenMessage: 'A valid Bonafide Certificate is required.' },
        ],
      },
      {
        id: 'g3', name: 'Income & Category', logicOp: 'AND', enabled: true,
        conditions: [
          { id: 'c5', field: 'household.annualIncome', operator: '<=', value: '250000', evidenceSource: 'digilocker', weight: 5, enabled: true, resultIfFail: 'NOT_ELIGIBLE', citizenMessage: 'Annual household income must be ₹2,50,000 or below.' },
          { id: 'c6', field: 'citizen.category', operator: 'in', value: 'OBC,SC,ST,EWS,Minority', evidenceSource: 'digilocker', weight: 3, enabled: true, resultIfFail: 'NOT_ELIGIBLE', citizenMessage: 'This scholarship is for OBC, SC, ST, EWS, and Minority categories.' },
          { id: 'c7', field: 'docs.incomeCert.ageMonths', operator: '<=', value: '12', evidenceSource: 'digilocker', weight: 4, enabled: true, resultIfFail: 'NEEDS_MORE_INFO', citizenMessage: 'Income Certificate must be issued within the last 12 months.' },
        ],
      },
      {
        id: 'g4', name: 'Benefit Deduplication', logicOp: 'AND', enabled: true,
        conditions: [
          { id: 'c8', field: 'benefits.sameCategory.active', operator: 'not_exists', value: 'false', evidenceSource: 'db_record', weight: 5, enabled: true, resultIfFail: 'NOT_ELIGIBLE', citizenMessage: 'Applicant must not be currently receiving the same or equivalent scholarship.' },
        ],
      },
    ],
  },
];

const TEST_PROFILES = [
  { label: 'Ananya Sharma (Fully Eligible)', values: { 'citizen.age': 22, 'citizen.gender': 'Female', 'citizen.category': 'OBC', 'household.annualIncome': 185000, 'citizen.education.status': 'ENROLLED', 'docs.aadhaar.verified': true, 'docs.bonafide.exists': true, 'docs.incomeCert.exists': true, 'docs.incomeCert.ageMonths': 8, 'benefits.sameCategory.active': false } },
  { label: 'Rahul Verma (High Income — Not Eligible)', values: { 'citizen.age': 20, 'citizen.gender': 'Male', 'citizen.category': 'OBC', 'household.annualIncome': 450000, 'citizen.education.status': 'ENROLLED', 'docs.aadhaar.verified': true, 'docs.bonafide.exists': true, 'docs.incomeCert.exists': true, 'docs.incomeCert.ageMonths': 5, 'benefits.sameCategory.active': false } },
  { label: 'Priya Joshi (Missing Bonafide)', values: { 'citizen.age': 19, 'citizen.gender': 'Female', 'citizen.category': 'SC', 'household.annualIncome': 120000, 'citizen.education.status': 'ENROLLED', 'docs.aadhaar.verified': true, 'docs.bonafide.exists': false, 'docs.incomeCert.exists': true, 'docs.incomeCert.ageMonths': 6, 'benefits.sameCategory.active': false } },
  { label: 'Karan Singh (Under Age 16)', values: { 'citizen.age': 14, 'citizen.gender': 'Male', 'citizen.category': 'ST', 'household.annualIncome': 80000, 'citizen.education.status': 'ENROLLED', 'docs.aadhaar.verified': true, 'docs.bonafide.exists': true, 'docs.incomeCert.exists': true, 'docs.incomeCert.ageMonths': 3, 'benefits.sameCategory.active': false } },
];

// ─── Simulation ────────────────────────────────────────────────────────────────
function simulate(groups: RuleGroup[], profile: Record<string, any>) {
  const results: { conditionId: string; groupId: string; pass: boolean; reason: string }[] = [];
  let overallResult: ResultClass = 'CONFIRMED_MATCH';
  const messages: string[] = [];

  for (const group of groups) {
    if (!group.enabled) continue;
    for (const cond of group.conditions) {
      if (!cond.enabled) continue;
      const val = profile[cond.field];
      let pass = false;

      if (cond.operator === 'exists') pass = val === true || val === 'true' || val === 1;
      else if (cond.operator === 'not_exists') pass = val === false || val === 'false' || val === 0;
      else if (cond.operator === '==') pass = String(val) === String(cond.value);
      else if (cond.operator === '!=') pass = String(val) !== String(cond.value);
      else if (cond.operator === '>=') pass = Number(val) >= Number(cond.value);
      else if (cond.operator === '<=') pass = Number(val) <= Number(cond.value);
      else if (cond.operator === '>') pass = Number(val) > Number(cond.value);
      else if (cond.operator === '<') pass = Number(val) < Number(cond.value);
      else if (cond.operator === 'in') pass = cond.value.split(',').map(v => v.trim()).includes(String(val));
      else if (cond.operator === 'not_in') pass = !cond.value.split(',').map(v => v.trim()).includes(String(val));

      results.push({ conditionId: cond.id, groupId: group.id, pass, reason: pass ? '' : cond.citizenMessage });
      if (!pass) {
        messages.push(cond.citizenMessage);
        if (cond.resultIfFail === 'NOT_ELIGIBLE') overallResult = 'NOT_ELIGIBLE';
        else if (cond.resultIfFail === 'NEEDS_MORE_INFO' && overallResult !== 'NOT_ELIGIBLE') overallResult = 'NEEDS_MORE_INFO';
        else if (cond.resultIfFail === 'LIKELY_MATCH' && overallResult === 'CONFIRMED_MATCH') overallResult = 'LIKELY_MATCH';
      }
    }
  }
  return { results, overallResult, messages };
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function ConditionRow({
  cond, fieldMap, onUpdate, onDelete, simResult
}: {
  cond: Condition;
  fieldMap: Map<string, { type: string; options?: string[] }>;
  onUpdate: (id: string, updates: Partial<Condition>) => void;
  onDelete: (id: string) => void;
  simResult?: { pass: boolean; reason: string } | null;
}) {
  const fieldMeta = fieldMap.get(cond.field);
  const validOps = OPERATORS.filter(o => !fieldMeta || o.types.includes(fieldMeta.type));
  const evidenceCfg = EVIDENCE_SOURCES.find(e => e.id === cond.evidenceSource);
  const EvidIcon = evidenceCfg?.icon || Shield;
  const resultCfg = RESULT_CLASSES.find(r => r.id === cond.resultIfFail);

  return (
    <div className={`rounded-xl border transition-all ${
      !cond.enabled ? 'opacity-50 bg-muted/30 border-border' :
      simResult === null ? 'border-border bg-card' :
      simResult?.pass ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Enable toggle */}
          <button
            onClick={() => onUpdate(cond.id, { enabled: !cond.enabled })}
            className="mt-1 flex-shrink-0"
          >
            {cond.enabled
              ? <ToggleRight className="w-5 h-5 text-primary" />
              : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
          </button>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Field */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Field</label>
              <select
                value={cond.field}
                onChange={e => onUpdate(cond.id, { field: e.target.value, operator: '==', value: '' })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                {CITIZEN_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            {/* Operator */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Operator</label>
              <select
                value={cond.operator}
                onChange={e => onUpdate(cond.id, { operator: e.target.value as Operator })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                {validOps.map(o => <option key={o.op} value={o.op}>{o.label}</option>)}
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Value</label>
              {fieldMeta?.options && cond.operator !== 'in' && cond.operator !== 'not_in' ? (
                <select
                  value={cond.value}
                  onChange={e => onUpdate(cond.id, { value: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                >
                  <option value="">Select…</option>
                  {fieldMeta.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : cond.operator === 'exists' || cond.operator === 'not_exists' ? (
                <div className="px-3 py-2 bg-muted rounded-lg text-xs text-muted-foreground italic">No value needed</div>
              ) : (
                <input
                  type={fieldMeta?.type === 'number' ? 'number' : 'text'}
                  value={cond.value}
                  onChange={e => onUpdate(cond.id, { value: e.target.value })}
                  placeholder={cond.operator === 'in' || cond.operator === 'not_in' ? 'A,B,C (comma-separated)' : 'Enter value...'}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>

            {/* Evidence */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Evidence Source</label>
              <select
                value={cond.evidenceSource}
                onChange={e => onUpdate(cond.id, { evidenceSource: e.target.value as EvidenceSource })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                {EVIDENCE_SOURCES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
          </div>

          {/* Sim result badge */}
          {simResult !== null && simResult !== undefined && (
            <div className="flex-shrink-0 mt-1">
              {simResult.pass
                ? <CheckCircle className="w-5 h-5 text-success" />
                : <XCircle className="w-5 h-5 text-destructive" />}
            </div>
          )}

          <button
            onClick={() => onDelete(cond.id)}
            className="flex-shrink-0 mt-1 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: result if fail + citizen message + weight */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">If fails → result class</label>
            <select
              value={cond.resultIfFail}
              onChange={e => onUpdate(cond.id, { resultIfFail: e.target.value as ResultClass })}
              className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring appearance-none ${resultCfg?.bg || 'bg-input'} border-border`}
            >
              {RESULT_CLASSES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1">Citizen-safe message (shown when rule fails)</label>
            <input
              type="text"
              value={cond.citizenMessage}
              onChange={e => onUpdate(cond.id, { citizenMessage: e.target.value })}
              placeholder="e.g. Annual income must be ₹2,50,000 or below."
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Evidence tag */}
        <div className="mt-2 flex items-center gap-1.5">
          <EvidIcon className={`w-3 h-3 ${evidenceCfg?.color}`} />
          <span className="text-xs text-muted-foreground">Verified via: <strong>{evidenceCfg?.label}</strong></span>
        </div>

        {/* Sim fail message */}
        {simResult && !simResult.pass && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Test profile fails: {simResult.reason}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RulesEngineConfig() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [selectedServiceId, setSelectedServiceId] = useState(DEFAULT_SERVICES[0]!.id);
  const [activeTab, setActiveTab] = useState<'builder' | 'simulator' | 'versions' | 'impact' | 'json'>('builder');
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [simDone, setSimDone] = useState(false);
  const [simResults, setSimResults] = useState<{ results: any[]; overallResult: ResultClass; messages: string[] } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['g1', 'g2', 'g3', 'g4']));

  const service = services.find(s => s.id === selectedServiceId)!;
  const fieldMap = new Map(CITIZEN_FIELDS.map(f => [f.value, { type: f.type, options: (f as any).options }]));

  const updateService = useCallback((updater: (s: Service) => Service) => {
    setServices(prev => prev.map(s => s.id === selectedServiceId ? updater(s) : s));
  }, [selectedServiceId]);

  const updateCondition = (groupId: string, condId: string, updates: Partial<Condition>) => {
    updateService(s => ({
      ...s,
      groups: s.groups.map(g => g.id !== groupId ? g : {
        ...g,
        conditions: g.conditions.map(c => c.id !== condId ? c : { ...c, ...updates }),
      }),
    }));
    setSimDone(false);
  };

  const deleteCondition = (groupId: string, condId: string) => {
    updateService(s => ({
      ...s,
      groups: s.groups.map(g => g.id !== groupId ? g : {
        ...g, conditions: g.conditions.filter(c => c.id !== condId),
      }),
    }));
  };

  const addCondition = (groupId: string) => {
    const newCond: Condition = {
      id: `c-${Date.now()}`, field: 'citizen.age', operator: '>=', value: '',
      evidenceSource: 'aadhaar_api', weight: 3, enabled: true,
      resultIfFail: 'NEEDS_MORE_INFO', citizenMessage: '',
    };
    updateService(s => ({
      ...s,
      groups: s.groups.map(g => g.id !== groupId ? g : { ...g, conditions: [...g.conditions, newCond] }),
    }));
  };

  const addGroup = () => {
    const newGroup: RuleGroup = {
      id: `g-${Date.now()}`, name: 'New Rule Group', logicOp: 'AND', enabled: true, conditions: [],
    };
    updateService(s => ({ ...s, groups: [...s.groups, newGroup] }));
    setExpandedGroups(prev => new Set([...prev, newGroup.id]));
  };

  const deleteGroup = (groupId: string) => {
    updateService(s => ({ ...s, groups: s.groups.filter(g => g.id !== groupId) }));
  };

  const runSimulation = () => {
    const profile = TEST_PROFILES[selectedProfile]?.values;
    if (!profile) return;
    const result = simulate(service.groups, profile);
    setSimResults(result);
    setSimDone(true);
  };

  const enabledConditions = service.groups.reduce((n, g) => n + g.conditions.filter(c => c.enabled).length, 0);

  const resultCfg = RESULT_CLASSES.find(r => r.id === simResults?.overallResult);

  const manifestJson = JSON.stringify({
    manifestVersion: '1.0.0',
    service: { id: service.id, name: service.name, type: service.category },
    eligibility: {
      groups: service.groups.filter(g => g.enabled).map(g => ({
        id: g.id, name: g.name, logic: g.logicOp,
        conditions: g.conditions.filter(c => c.enabled).map(c => ({
          id: c.id, field: c.field, operator: c.operator, value: c.value,
          evidence: c.evidenceSource, resultIfFail: c.resultIfFail,
          citizenMessage: c.citizenMessage,
        })),
      })),
    },
  }, null, 2);

  return (
    <div className="min-h-full bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Service Manifest Protocol</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Rules Engine Configuration</h1>
            <p className="text-muted-foreground text-sm">Visually configure, test, and publish eligibility rules for each government service manifest.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-warning" />
              Draft v2.1 — unsaved
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Upload className="w-4 h-4" /> Publish v2.1
            </button>
          </div>
        </div>

        {/* Service selector + stats */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex-1 min-w-60">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Active Service Manifest</label>
              <select
                value={selectedServiceId}
                onChange={e => { setSelectedServiceId(e.target.value); setSimDone(false); }}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex gap-6">
              {[
                { label: 'Rule Groups', val: service.groups.filter(g => g.enabled).length },
                { label: 'Total Conditions', val: enabledConditions },
                { label: 'Active Version', val: 'v2.0' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold text-primary">{s.val}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-xl text-xs font-medium hover:bg-muted/80 transition-colors">
                <Copy className="w-3.5 h-3.5" /> Clone
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-xl text-xs font-medium hover:bg-muted/80 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl mb-6 overflow-x-auto">
          {([
            { id: 'builder', label: 'Rule Builder', icon: GitBranch },
            { id: 'simulator', label: 'Test Simulator', icon: Play },
            { id: 'versions', label: 'Version History', icon: Clock },
            { id: 'impact', label: 'Impact Analysis', icon: TrendingUp },
            { id: 'json', label: 'Manifest JSON', icon: Code },
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

        {/* ── Builder Tab ── */}
        {activeTab === 'builder' && (
          <div className="space-y-4">
            {service.groups.map((group, gIdx) => {
              const isExpanded = expandedGroups.has(group.id);
              return (
                <div key={group.id} className={`bg-card border-2 rounded-2xl overflow-hidden transition-all ${group.enabled ? 'border-border' : 'border-border opacity-60'}`}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
                    <button onClick={() => {
                      updateService(s => ({ ...s, groups: s.groups.map(g => g.id !== group.id ? g : { ...g, enabled: !g.enabled }) }));
                    }}>
                      {group.enabled ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    </button>

                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-bold">{gIdx + 1}</span>
                      <input
                        type="text"
                        value={group.name}
                        onChange={e => updateService(s => ({ ...s, groups: s.groups.map(g => g.id !== group.id ? g : { ...g, name: e.target.value }) }))}
                        className="text-sm font-semibold bg-transparent focus:outline-none border-b border-transparent focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Conditions joined by</span>
                      <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                        {(['AND', 'OR'] as LogicOp[]).map(op => (
                          <button
                            key={op}
                            onClick={() => updateService(s => ({ ...s, groups: s.groups.map(g => g.id !== group.id ? g : { ...g, logicOp: op }) }))}
                            className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${group.logicOp === op ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{group.conditions.filter(c => c.enabled).length} conditions</span>
                      <button onClick={() => setExpandedGroups(prev => { const n = new Set(prev); isExpanded ? n.delete(group.id) : n.add(group.id); return n; })} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <button onClick={() => deleteGroup(group.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conditions */}
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {group.conditions.map((cond, cIdx) => (
                        <div key={cond.id} className="flex gap-3 items-start">
                          {cIdx > 0 && (
                            <div className="flex-shrink-0 flex items-center justify-center w-10 mt-4">
                              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${group.logicOp === 'AND' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>{group.logicOp}</span>
                            </div>
                          )}
                          {cIdx === 0 && <div className="w-10 flex-shrink-0" />}
                          <div className="flex-1">
                            <ConditionRow
                              cond={cond}
                              fieldMap={fieldMap}
                              onUpdate={(id, updates) => updateCondition(group.id, id, updates)}
                              onDelete={(id) => deleteCondition(group.id, id)}
                              simResult={simDone && simResults ? (simResults.results.find(r => r.conditionId === cond.id) || null) : null}
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => addCondition(group.id)}
                        className="ml-10 flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Condition
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={addGroup}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5" /> Add Rule Group
            </button>
          </div>
        )}

        {/* ── Simulator Tab ── */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Test Citizen Profile
                </h2>
                <div className="space-y-3 mb-4">
                  {TEST_PROFILES.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedProfile(i); setSimDone(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${selectedProfile === i ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                    >
                      <p className="text-sm font-medium">{p.label}</p>
                    </button>
                  ))}
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">Profile Attributes</div>
                  <div className="divide-y divide-border">
                    {Object.entries(TEST_PROFILES[selectedProfile]?.values ?? {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between px-4 py-2">
                        <span className="text-xs font-mono text-muted-foreground">{k}</span>
                        <span className="text-xs font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-4 h-4" /> Run Simulation
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {simResults ? (
                <>
                  <div className={`rounded-2xl border-2 p-6 ${resultCfg?.bg || 'bg-muted'} border-current/20`}>
                    <div className="flex items-center gap-3 mb-3">
                      {simResults.overallResult === 'CONFIRMED_MATCH' ? <CheckCircle className="w-8 h-8 text-success" /> :
                       simResults.overallResult === 'NOT_ELIGIBLE' ? <XCircle className="w-8 h-8 text-destructive" /> :
                       <AlertCircle className="w-8 h-8 text-warning" />}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Simulation Result</p>
                        <p className={`text-xl font-bold ${resultCfg?.color}`}>{resultCfg?.label}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-success">{simResults.results.filter(r => r.pass).length}</p>
                        <p className="text-xs text-muted-foreground">Rules Passed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-destructive">{simResults.results.filter(r => !r.pass).length}</p>
                        <p className="text-xs text-muted-foreground">Rules Failed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{simResults.results.length}</p>
                        <p className="text-xs text-muted-foreground">Total Evaluated</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-semibold mb-3">Condition-by-Condition Breakdown</h3>
                    <div className="space-y-2">
                      {service.groups.filter(g => g.enabled).map(group => (
                        <div key={group.id}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-3">{group.name}</p>
                          {group.conditions.filter(c => c.enabled).map(cond => {
                            const r = simResults.results.find(r => r.conditionId === cond.id);
                            const fieldLabel = CITIZEN_FIELDS.find(f => f.value === cond.field)?.label || cond.field;
                            return (
                              <div key={cond.id} className={`flex items-start gap-3 p-3 rounded-lg mb-1.5 ${r?.pass ? 'bg-success/5 border border-success/20' : 'bg-destructive/5 border border-destructive/20'}`}>
                                {r?.pass ? <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />}
                                <div>
                                  <p className="text-xs font-medium">{fieldLabel} {cond.operator} {cond.value || '(boolean check)'}</p>
                                  {!r?.pass && <p className="text-xs text-destructive mt-0.5">{r?.reason}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <Play className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Select a test profile and run simulation</p>
                  <p className="text-xs text-muted-foreground mt-1">Results will show rule-by-rule pass/fail breakdown</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Versions Tab ── */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            {VERSIONS.map(v => (
              <div key={v.version} className={`bg-card border-2 rounded-2xl p-5 flex items-start gap-5 ${v.status === 'published' ? 'border-success/30' : v.status === 'draft' ? 'border-warning/30' : 'border-border'}`}>
                <div className={`px-3 py-1.5 rounded-xl text-sm font-mono font-bold ${v.status === 'published' ? 'bg-success/10 text-success' : v.status === 'draft' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                  {v.version}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${v.status === 'published' ? 'bg-success/10 text-success' : v.status === 'draft' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-0.5">{v.changes}</p>
                  <p className="text-xs text-muted-foreground">{v.date} · by {v.author}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 text-xs font-medium bg-muted rounded-xl hover:bg-muted/80 transition-colors flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Preview</button>
                  {v.status !== 'published' && <button className="px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">Publish</button>}
                  {v.status === 'published' && <button className="px-3 py-2 text-xs font-medium bg-muted rounded-xl hover:bg-muted/80 transition-colors">Rollback</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Impact Tab ── */}
        {activeTab === 'impact' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-semibold">Impact Analysis — April 2026</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Would Pass All Rules', val: '1,834', pct: 78, color: 'text-success', bar: 'bg-success' },
                  { label: 'Would Fail (Not Eligible)', val: '312', pct: 13, color: 'text-destructive', bar: 'bg-destructive' },
                  { label: 'Needs More Info', val: '187', pct: 8, color: 'text-warning', bar: 'bg-warning' },
                  { label: 'Unknown / No Consent', val: '14', pct: 1, color: 'text-muted-foreground', bar: 'bg-muted-foreground' },
                ].map(item => (
                  <div key={item.label} className="p-4 bg-muted/30 rounded-xl">
                    <p className={`text-2xl font-bold ${item.color}`}>{item.val}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${item.bar} rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.pct}% of total</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold">Rule-Level Impact Breakdown</h2>
              {service.groups.flatMap(g => g.conditions).filter(c => c.enabled).map(cond => {
                const pct = Math.floor(Math.random() * 30) + 5;
                const fieldLabel = CITIZEN_FIELDS.find(f => f.value === cond.field)?.label || cond.field;
                return (
                  <div key={cond.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">{fieldLabel} {cond.operator} {cond.value || '…'}</span>
                      <span className="text-xs text-muted-foreground">{pct}% exclusion</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 20 ? 'bg-destructive' : pct > 10 ? 'bg-warning' : 'bg-primary/60'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── JSON Tab ── */}
        {activeTab === 'json' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Service Manifest JSON — Eligibility Schema</span>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
            <pre className="p-6 text-xs font-mono text-foreground overflow-auto max-h-[60vh] bg-muted/20 leading-relaxed">
              {manifestJson}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
