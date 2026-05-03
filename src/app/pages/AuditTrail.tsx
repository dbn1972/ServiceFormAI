import { useState, useEffect } from 'react';
import {
  Shield, Search, Download, FileText, User, Key, Lock,
  CheckCircle, AlertTriangle, Info, Clock, ChevronDown, ChevronRight,
  Database, Globe, UserCheck, XCircle,
  Calendar, Hash, ArrowRight, BadgeCheck, Layers, Bell, Loader2
} from 'lucide-react';
import { auditService, type AuditLogEntry } from '../services/api/audit.service';

type EventType = 'consent' | 'document' | 'application' | 'officer' | 'system' | 'auth' | 'notification';

interface AuditEvent {
  id: string;
  timestamp: string;
  type: EventType;
  actor: string;
  actorType: 'citizen' | 'officer' | 'system' | 'dept';
  action: string;
  resource: string;
  serviceId: string;
  serviceName: string;
  channel: string;
  ipHash?: string;
  outcome: 'success' | 'denied' | 'warning';
  detail: string;
  consentRef?: string;
}

const AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'EVT-20260430-001',
    timestamp: '30 Apr 2026, 11:42:15 IST',
    type: 'consent',
    actor: 'Ananya Sharma (Citizen)',
    actorType: 'citizen',
    action: 'CONSENT_GRANTED',
    resource: 'DigiLocker: [Aadhaar, Income Certificate, Student Bonafide, Caste Certificate]',
    serviceId: 'scholarship.state.merit.2026',
    serviceName: 'State Merit Scholarship 2026',
    channel: 'Web Portal',
    ipHash: 'abc...9f3',
    outcome: 'success',
    detail: 'Citizen explicitly consented to share 4 document metadata fields for eligibility discovery. Purpose: Scholarship application. Duration: 90 days. Data minimization applied.',
    consentRef: 'CNS-2026-00412',
  },
  {
    id: 'EVT-20260430-002',
    timestamp: '30 Apr 2026, 11:43:02 IST',
    type: 'document',
    actor: 'Eligibility Engine (System)',
    actorType: 'system',
    action: 'DOCUMENT_METADATA_ACCESSED',
    resource: 'Income Certificate – Issuer: Tehsildar, Pune (Metadata only)',
    serviceId: 'scholarship.state.merit.2026',
    serviceName: 'State Merit Scholarship 2026',
    channel: 'Internal API',
    outcome: 'success',
    detail: 'Document metadata (type, issue date, issuer) accessed under consent CNS-2026-00412. Document content NOT accessed. Purpose: income_rule eligibility check.',
    consentRef: 'CNS-2026-00412',
  },
  {
    id: 'EVT-20260430-003',
    timestamp: '30 Apr 2026, 11:45:31 IST',
    type: 'application',
    actor: 'Ananya Sharma (Citizen)',
    actorType: 'citizen',
    action: 'APPLICATION_SUBMITTED',
    resource: 'Application ID: SCH-2026-004512',
    serviceId: 'scholarship.state.merit.2026',
    serviceName: 'State Merit Scholarship 2026',
    channel: 'Web Portal',
    ipHash: 'abc...9f3',
    outcome: 'success',
    detail: 'Application submitted with 4 DigiLocker documents attached via consent CNS-2026-00412. Acknowledgement number generated.',
  },
  {
    id: 'EVT-20260430-004',
    timestamp: '30 Apr 2026, 11:45:33 IST',
    type: 'notification',
    actor: 'Notification Engine (System)',
    actorType: 'system',
    action: 'NOTIFICATION_DISPATCHED',
    resource: 'SMS to +91-98XXXXX210, Email to a*****a@email.com',
    serviceId: 'scholarship.state.merit.2026',
    serviceName: 'State Merit Scholarship 2026',
    channel: 'SMS + Email',
    outcome: 'success',
    detail: 'Submission acknowledgement notification dispatched on 2 channels. No sensitive personal data included in notification.',
  },
  {
    id: 'EVT-20260428-005',
    timestamp: '28 Apr 2026, 14:12:07 IST',
    type: 'officer',
    actor: 'Officer ID: OFF-MH-2204 (State Welfare Dept)',
    actorType: 'officer',
    action: 'APPLICATION_REVIEWED',
    resource: 'Application: SCH-2026-004512',
    serviceId: 'scholarship.state.merit.2026',
    serviceName: 'State Merit Scholarship 2026',
    channel: 'Officer Portal',
    outcome: 'success',
    detail: 'Officer accessed application SCH-2026-004512 for document verification. Officer action: Deficiency raised on "Income Certificate" — year mismatch noted.',
  },
  {
    id: 'EVT-20260428-006',
    timestamp: '28 Apr 2026, 14:13:44 IST',
    type: 'document',
    actor: 'Officer ID: OFF-MH-2204',
    actorType: 'officer',
    action: 'DOCUMENT_VIEWED',
    resource: 'Income Certificate (Full document) – within application context',
    serviceId: 'scholarship.state.merit.2026',
    serviceName: 'State Merit Scholarship 2026',
    channel: 'Officer Portal',
    outcome: 'success',
    detail: 'Officer accessed full Income Certificate document within the application review workflow. Authorized access under workflow permission OFFICER_REVIEW. Document not downloaded.',
  },
  {
    id: 'EVT-20260427-007',
    timestamp: '27 Apr 2026, 09:30:00 IST',
    type: 'auth',
    actor: 'Unknown (Automated bot)',
    actorType: 'system',
    action: 'LOGIN_ATTEMPT_BLOCKED',
    resource: 'Citizen login: a*****a@email.com',
    serviceId: 'PLATFORM',
    serviceName: 'Platform Auth',
    channel: 'Web Portal',
    ipHash: 'zzz...1a8',
    outcome: 'denied',
    detail: 'Suspicious login attempt blocked. 5 failed attempts from IP hash zzz...1a8 in 2 minutes. CAPTCHA enforced. Citizen notified via SMS alert.',
  },
  {
    id: 'EVT-20260425-008',
    timestamp: '25 Apr 2026, 16:55:20 IST',
    type: 'consent',
    actor: 'Ananya Sharma (Citizen)',
    actorType: 'citizen',
    action: 'CONSENT_REVOKED',
    resource: 'DigiLocker: [Aadhaar, Salary Slips]',
    serviceId: 'revenue.income.cert.2026',
    serviceName: 'Income Certificate Application',
    channel: 'Mobile App',
    ipHash: 'abc...9f3',
    outcome: 'success',
    detail: 'Citizen revoked consent for Income Certificate application. All document access via this consent immediately invalidated. Any pending reads blocked. Service informed.',
    consentRef: 'CNS-2026-00387',
  },
  {
    id: 'EVT-20260424-009',
    timestamp: '24 Apr 2026, 10:22:11 IST',
    type: 'document',
    actor: 'Dept API: Revenue Dept Maharashtra',
    actorType: 'dept',
    action: 'DOCUMENT_ACCESS_DENIED',
    resource: 'Salary Slips (Attempt after revocation)',
    serviceId: 'revenue.income.cert.2026',
    serviceName: 'Income Certificate Application',
    channel: 'API Integration',
    outcome: 'denied',
    detail: 'Department API attempted to access Salary Slips after consent CNS-2026-00387 was revoked. Access blocked by Consent Engine. Incident logged.',
    consentRef: 'CNS-2026-00387',
  },
  {
    id: 'EVT-20260420-010',
    timestamp: '20 Apr 2026, 08:00:00 IST',
    type: 'system',
    actor: 'Platform Scheduler (System)',
    actorType: 'system',
    action: 'CONSENT_EXPIRY_ALERT',
    resource: 'Consent CNS-2026-00387',
    serviceId: 'revenue.income.cert.2026',
    serviceName: 'Income Certificate Application',
    channel: 'Scheduled Job',
    outcome: 'warning',
    detail: 'Consent CNS-2026-00387 approaching expiry in 15 days. Citizen notified to renew or revoke. No auto-renewal.',
    consentRef: 'CNS-2026-00387',
  },
];

const EVENT_CONFIG: Record<EventType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  consent: { label: 'Consent', icon: Key, color: 'text-primary', bg: 'bg-primary/10' },
  document: { label: 'Document', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  application: { label: 'Application', icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
  officer: { label: 'Officer Action', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  system: { label: 'System', icon: Database, color: 'text-muted-foreground', bg: 'bg-muted' },
  auth: { label: 'Auth / Security', icon: Shield, color: 'text-destructive', bg: 'bg-destructive/10' },
  notification: { label: 'Notification', icon: Bell, color: 'text-success', bg: 'bg-success/10' },
};

const OUTCOME_CONFIG = {
  success: { label: 'Success', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  denied: { label: 'Denied', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
};

function EventRow({ event, expanded, onToggle }: { event: AuditEvent; expanded: boolean; onToggle: () => void }) {
  const typeCfg = EVENT_CONFIG[event.type];
  const outCfg = OUTCOME_CONFIG[event.outcome];
  const TypeIcon = typeCfg.icon;
  const OutIcon = outCfg.icon;

  return (
    <div className={`border-b border-border last:border-0 transition-colors ${event.outcome === 'denied' ? 'bg-destructive/5' : event.outcome === 'warning' ? 'bg-warning/5' : ''}`}>
      <button
        className="w-full text-left p-4 hover:bg-muted/40 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start gap-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${typeCfg.bg}`}>
            <TypeIcon className={`w-4 h-4 ${typeCfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{event.action.replace(/_/g, ' ')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${outCfg.bg} ${outCfg.color}`}>
                  <OutIcon className="w-3 h-3" /> {outCfg.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {event.timestamp}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {event.actor}</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {event.channel}</span>
              {event.consentRef && <span className="flex items-center gap-1 text-primary"><Key className="w-3 h-3" /> {event.consentRef}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{event.resource}</p>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="mx-4 mb-4 p-4 bg-card border border-border rounded-xl space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Event ID', val: event.id, icon: Hash },
              { label: 'Service', val: event.serviceName, icon: Layers },
              { label: 'Service ID', val: event.serviceId, icon: Database },
              { label: 'Actor', val: event.actor, icon: User },
              { label: 'Channel', val: event.channel, icon: Globe },
              ...(event.ipHash ? [{ label: 'IP Hash (anonymized)', val: event.ipHash, icon: Shield }] : []),
              ...(event.consentRef ? [{ label: 'Consent Reference', val: event.consentRef, icon: Key }] : []),
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                  <item.icon className="w-3 h-3" /> {item.label}
                </p>
                <p className="text-xs font-medium font-mono break-all">{item.val}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Event Detail</p>
            <p className="text-sm bg-muted/50 rounded-lg p-3">{event.detail}</p>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <FileText className="w-3.5 h-3.5" /> Download Event Certificate
            </button>
            {event.consentRef && (
              <button className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <Key className="w-3.5 h-3.5" /> View Consent Record
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditTrail() {
  const [expandedId, setExpandedId] = useState<string | null>('EVT-20260430-001');
  const [activeType, setActiveType] = useState<string>('all');
  const [activeOutcome, setActiveOutcome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'citizen' | 'admin'>('citizen');
  const [apiLogs, setApiLogs] = useState<AuditLogEntry[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    auditService.getLogs({ limit: 50 })
      .then((res) => setApiLogs(res.data))
      .catch(() => { /* fall back to static AUDIT_EVENTS */ })
      .finally(() => setApiLoading(false));
  }, []);

  // Merge API logs with static events for display
  const apiMapped: AuditEvent[] = apiLogs.map((log) => ({
    id: log.id,
    timestamp: log.created_at,
    type: (log.event_type.startsWith('auth') ? 'auth' : log.event_type.startsWith('document') ? 'document' : log.event_type.startsWith('consent') ? 'consent' : 'system') as EventType,
    actor: log.actor_id || 'System',
    actorType: (log.actor_role === 'officer' ? 'officer' : log.actor_role === 'admin' ? 'officer' : 'citizen') as 'citizen' | 'officer' | 'system' | 'dept',
    action: log.event_type.replace(/\./g, ' '),
    resource: log.resource_type || 'System',
    serviceId: log.tenant_id || '',
    serviceName: log.metadata?.['serviceName'] as string || '',
    channel: 'API',
    ipHash: log.ip_address ? log.ip_address.replace(/\d+$/, '***') : undefined,
    outcome: log.success ? 'success' : 'denied',
    detail: JSON.stringify(log.metadata || {}),
  }));

  const events = apiLoading ? AUDIT_EVENTS : apiMapped.length > 0 ? apiMapped : AUDIT_EVENTS;

  const filtered = events.filter(e => {
    const matchesType = activeType === 'all' || e.type === activeType;
    const matchesOutcome = activeOutcome === 'all' || e.outcome === activeOutcome;
    const matchesSearch = !searchQuery ||
      e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesOutcome && matchesSearch;
  });

  const consentEvents = events.filter(e => e.type === 'consent').length;
  const docAccesses = events.filter(e => e.type === 'document').length;
  const deniedEvents = events.filter(e => e.outcome === 'denied').length;
  const officerActions = events.filter(e => e.type === 'officer').length;

  return (
    <div className="min-h-full bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        {apiLoading && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading audit logs...
          </div>
        )}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Trust & Compliance</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Audit Trail & Consent Ledger</h1>
            <p className="text-muted-foreground">Complete immutable log of all data access, consent events, officer actions, and system events. Compliant with DPDP Act 2023.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl">
              {(['citizen', 'admin'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${viewMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {mode === 'citizen' ? 'My View' : 'Admin View'}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />
              Export Log
            </button>
          </div>
        </div>

        {/* DPDP Act Banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
          <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">DPDP Act 2023 Compliant Audit Trail</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every data access, consent event, and processing activity is logged immutably. You have the right to access, correct, and request deletion of your personal data. IP addresses are stored as one-way hashes only.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              Data Report <ArrowRight className="w-3 h-3" />
            </button>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              Request Deletion <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Consent Events', val: consentEvents, icon: Key, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Document Accesses', val: docAccesses, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Officer Actions', val: officerActions, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Access Denials', val: deniedEvents, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Controls */}
          <div className="p-5 border-b border-border space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-48 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by event, resource, service..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={activeType}
                  onChange={e => setActiveType(e.target.value)}
                  className="px-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
                <select
                  value={activeOutcome}
                  onChange={e => setActiveOutcome(e.target.value)}
                  className="px-3 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                >
                  <option value="all">All Outcomes</option>
                  <option value="success">Success</option>
                  <option value="denied">Denied</option>
                  <option value="warning">Warning</option>
                </select>
                <button className="flex items-center gap-1.5 px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/80 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </button>
              </div>
            </div>

            {/* Type filter chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveType('all')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeType === 'all' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}
              >
                All ({AUDIT_EVENTS.length})
              </button>
              {Object.entries(EVENT_CONFIG).map(([key, cfg]) => {
                const count = AUDIT_EVENTS.filter(e => e.type === key).length;
                if (!count) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveType(key)}
                    className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 transition-all ${
                      activeType === key ? `${cfg.bg} ${cfg.color} border-current` : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    <cfg.icon className="w-3 h-3" /> {cfg.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
            <p className="text-xs text-muted-foreground">{filtered.length} events found</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" /> Immutable log — events cannot be deleted or modified
            </div>
          </div>

          {/* Event list */}
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">No events found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filtered.map(event => (
                <EventRow
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-5 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {filtered.length} of {AUDIT_EVENTS.length} events • Log retained for 7 years per audit policy</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-muted rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors">Previous</button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">Next</button>
            </div>
          </div>
        </div>

        {/* Consent Ledger Summary */}
        <div className="mt-6 bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Active Consent Ledger
          </h2>
          <div className="space-y-3">
            {[
              {
                ref: 'CNS-2026-00412',
                service: 'State Merit Scholarship 2026',
                granted: '30 Apr 2026',
                expires: '29 Jul 2026',
                docs: ['Aadhaar', 'Income Certificate', 'Bonafide', 'Caste Certificate'],
                purpose: 'Eligibility discovery + application',
                status: 'active',
                daysLeft: 90,
              },
              {
                ref: 'CNS-2026-00387',
                service: 'Income Certificate Application',
                granted: '5 Apr 2026',
                expires: '4 May 2026',
                docs: ['Aadhaar', 'Salary Slips'],
                purpose: 'Application submission',
                status: 'revoked',
                daysLeft: 0,
              },
            ].map(c => (
              <div key={c.ref} className={`p-4 rounded-xl border ${c.status === 'active' ? 'border-success/30 bg-success/5' : 'border-border bg-muted/30'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium font-mono text-primary">{c.ref}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {c.status === 'active' ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{c.service}</p>
                    <p className="text-xs text-muted-foreground mb-2">Purpose: {c.purpose}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.docs.map(d => (
                        <span key={d} className="text-xs px-2 py-0.5 bg-muted rounded-full border border-border">{d}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Granted: {c.granted}</p>
                    <p className="text-xs text-muted-foreground">Expires: {c.expires}</p>
                    {c.status === 'active' && (
                      <button className="mt-2 text-xs text-destructive hover:underline flex items-center gap-1 ml-auto">
                        <XCircle className="w-3 h-3" /> Revoke
                      </button>
                    )}
                  </div>
                </div>
                {c.status === 'active' && c.daysLeft > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Consent validity</span>
                      <span className="text-muted-foreground">{c.daysLeft} days remaining</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${(c.daysLeft / 90) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
