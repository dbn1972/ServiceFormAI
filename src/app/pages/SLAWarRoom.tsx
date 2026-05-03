import { useState } from 'react';
import {
  AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown,
  Search, Bell, Zap, RefreshCw,
  ArrowRight, Eye, MessageCircle, UserCheck,
  Flame, CircleAlert, BadgeCheck,
  Activity, Timer
} from 'lucide-react';

type Priority = 'critical' | 'high' | 'medium' | 'normal';
type SLAStatus = 'breached' | 'at-risk' | 'on-track' | 'completed';

interface CaseItem {
  id: string;
  applicant: string;
  service: string;
  dept: string;
  officer: string;
  submitted: string;
  slaDeadline: string;
  hoursLeft: number;
  status: SLAStatus;
  priority: Priority;
  stage: string;
  breachReason?: string;
}

const CASES: CaseItem[] = [
  { id: 'SCH-2026-004311', applicant: 'Rajesh Kumar', service: 'State Merit Scholarship', dept: 'Welfare Dept', officer: 'OFF-MH-2201', submitted: '15 Mar 2026', slaDeadline: '29 Apr 2026', hoursLeft: -24, status: 'breached', priority: 'critical', stage: 'Document Verification', breachReason: 'Officer workload exceeded — case not assigned for 3 days' },
  { id: 'SCH-2026-004389', applicant: 'Meena Devi', service: 'Ladki Bahin Yojana', dept: 'Women & Child', officer: 'OFF-MH-2210', submitted: '20 Mar 2026', slaDeadline: '30 Apr 2026', hoursLeft: -6, status: 'breached', priority: 'critical', stage: 'Approval Pending', breachReason: 'Approval officer on leave — no backup assigned' },
  { id: 'INC-2026-001123', applicant: 'Suresh Patil', service: 'Income Certificate', dept: 'Revenue Dept', officer: 'OFF-MH-2204', submitted: '10 Apr 2026', slaDeadline: '1 May 2026', hoursLeft: 8, status: 'at-risk', priority: 'high', stage: 'Tehsildar Approval' },
  { id: 'TRD-2026-000891', applicant: 'Fatima Sheikh', service: 'Trade License', dept: 'Municipal Corp', officer: 'OFF-PMC-0112', submitted: '5 Apr 2026', slaDeadline: '5 May 2026', hoursLeft: 18, status: 'at-risk', priority: 'high', stage: 'Field Inspection Scheduled' },
  { id: 'WTR-2026-003312', applicant: 'Dinesh Nair', service: 'Water Connection', dept: 'Jal Board', officer: 'OFF-JB-0041', submitted: '12 Apr 2026', slaDeadline: '27 Apr 2026', hoursLeft: 36, status: 'at-risk', priority: 'high', stage: 'Site Inspection Pending' },
  { id: 'SCH-2026-004512', applicant: 'Ananya Sharma', service: 'State Merit Scholarship', dept: 'Welfare Dept', officer: 'OFF-MH-2204', submitted: '15 Apr 2026', slaDeadline: '30 May 2026', hoursLeft: 720, status: 'on-track', priority: 'normal', stage: 'Document Verification' },
  { id: 'CST-2026-002201', applicant: 'Priya Patel', service: 'Caste Certificate', dept: 'Revenue Dept', officer: 'OFF-MH-2208', submitted: '18 Apr 2026', slaDeadline: '18 May 2026', hoursLeft: 432, status: 'on-track', priority: 'normal', stage: 'Under Review' },
  { id: 'DOM-2026-001876', applicant: 'Amit Singh', service: 'Domicile Certificate', dept: 'Revenue Dept', officer: 'OFF-MH-2204', submitted: '20 Apr 2026', slaDeadline: '11 May 2026', hoursLeft: 264, status: 'on-track', priority: 'medium', stage: 'Submitted' },
  { id: 'BLD-2026-000234', applicant: 'Ravi Constructions', service: 'Building Permission', dept: 'Municipal Corp', officer: 'OFF-PMC-0108', submitted: '1 Apr 2026', slaDeadline: '1 Jun 2026', hoursLeft: 744, status: 'on-track', priority: 'normal', stage: 'Technical Review' },
  { id: 'PEN-2026-003341', applicant: 'Kamla Bai', service: 'Old Age Pension', dept: 'Social Welfare', officer: 'OFF-SW-0022', submitted: '25 Mar 2026', slaDeadline: '25 Apr 2026', hoursLeft: 0, status: 'completed', priority: 'normal', stage: 'Approved & Disbursed' },
];

const STATUS_CONFIG: Record<SLAStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  breached: { label: 'SLA Breached', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: Flame },
  'at-risk': { label: 'At Risk', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', icon: AlertTriangle },
  'on-track': { label: 'On Track', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: CheckCircle },
  completed: { label: 'Completed', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', icon: BadgeCheck },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-destructive', dot: 'bg-destructive' },
  high: { label: 'High', color: 'text-warning', dot: 'bg-warning' },
  medium: { label: 'Medium', color: 'text-primary', dot: 'bg-primary' },
  normal: { label: 'Normal', color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

function SLABadge({ hoursLeft, status }: { hoursLeft: number; status: SLAStatus }) {
  if (status === 'completed') return <span className="text-xs text-muted-foreground">Closed</span>;
  if (hoursLeft < 0) {
    return (
      <span className="text-xs font-semibold text-destructive flex items-center gap-1">
        <Flame className="w-3 h-3" /> {Math.abs(hoursLeft)}h overdue
      </span>
    );
  }
  if (hoursLeft < 24) {
    return (
      <span className="text-xs font-semibold text-warning flex items-center gap-1 animate-pulse">
        <Timer className="w-3 h-3" /> {hoursLeft}h left
      </span>
    );
  }
  const days = Math.floor(hoursLeft / 24);
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <Clock className="w-3 h-3" /> {days}d left
    </span>
  );
}

const OFFICER_WORKLOAD = [
  { id: 'OFF-MH-2204', name: 'Ramesh Kumar', dept: 'Revenue Dept', active: 14, breached: 1, atRisk: 2, avgDays: 8.2, status: 'overloaded' },
  { id: 'OFF-MH-2201', name: 'Suman Devi', dept: 'Welfare Dept', active: 8, breached: 1, atRisk: 0, avgDays: 12.1, status: 'overloaded' },
  { id: 'OFF-PMC-0112', name: 'Anil Shinde', dept: 'Municipal Corp', active: 6, breached: 0, atRisk: 1, avgDays: 7.5, status: 'normal' },
  { id: 'OFF-MH-2210', name: 'Kavita More', dept: 'Women & Child', active: 11, breached: 1, atRisk: 1, avgDays: 14.2, status: 'overloaded' },
  { id: 'OFF-JB-0041', name: 'Prakash Joshi', dept: 'Jal Board', active: 4, breached: 0, atRisk: 1, avgDays: 6.8, status: 'normal' },
];

export default function SLAWarRoom() {
  const [activeFilter, setActiveFilter] = useState<SLAStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'cases' | 'officers' | 'analytics'>('cases');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed] = useState('30 Apr 2026, 11:55:00 IST');

  const breached = CASES.filter(c => c.status === 'breached');
  const atRisk = CASES.filter(c => c.status === 'at-risk');
  const onTrack = CASES.filter(c => c.status === 'on-track');

  const filtered = CASES.filter(c => {
    const matchStatus = activeFilter === 'all' || c.status === activeFilter;
    const matchSearch = !searchQuery ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-full bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-xs font-medium text-destructive uppercase tracking-wide">Live Operations</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">SLA War Room</h1>
            <p className="text-muted-foreground text-sm">Real-time SLA compliance monitoring · Last refreshed: {lastRefreshed}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${autoRefresh ? 'bg-success/10 border-success/30 text-success' : 'bg-muted border-border text-muted-foreground'}`}
            >
              <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors">
              <Bell className="w-4 h-4" />
              {breached.length} Breach Alert{breached.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>

        {/* Alert strip for breached cases */}
        {breached.length > 0 && (
          <div className="bg-destructive/10 border-2 border-destructive/40 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Flame className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive mb-2">{breached.length} SLA Breach{breached.length > 1 ? 'es' : ''} Require Immediate Action</p>
                <div className="flex flex-wrap gap-3">
                  {breached.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-lg text-xs">
                      <CircleAlert className="w-3.5 h-3.5 text-destructive" />
                      <span className="font-medium">{c.id}</span>
                      <span className="text-muted-foreground">— {c.applicant} · {Math.abs(c.hoursLeft)}h overdue</span>
                      <button className="text-destructive hover:underline font-medium ml-1 flex items-center gap-1">
                        Escalate <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Active', val: CASES.filter(c => c.status !== 'completed').length, icon: Layers, color: 'text-foreground', bg: 'bg-muted' },
            { label: 'SLA Breached', val: breached.length, icon: Flame, color: 'text-destructive', bg: 'bg-destructive/10', pulse: true },
            { label: 'At Risk (<24h)', val: atRisk.filter(c => c.hoursLeft < 24).length, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'On Track', val: onTrack.length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Completed Today', val: 23, icon: BadgeCheck, color: 'text-primary', bg: 'bg-primary/10' },
          ].map((kpi, i) => (
            <div key={i} className={`bg-card border border-border rounded-xl p-4 ${kpi.pulse ? 'border-destructive/30' : ''}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color} ${kpi.pulse ? 'animate-pulse' : ''}`} />
              </div>
              <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* SLA compliance rate */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">SLA Compliance Rate — April 2026</h2>
            <span className="text-xs text-muted-foreground">Month to date</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { dept: 'Revenue Dept', rate: 91, trend: +3, cases: 234 },
              { dept: 'Welfare Dept', rate: 78, trend: -5, cases: 456 },
              { dept: 'Municipal Corp', rate: 85, trend: +2, cases: 189 },
            ].map(dept => (
              <div key={dept.dept}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{dept.dept}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${dept.rate >= 90 ? 'text-success' : dept.rate >= 80 ? 'text-warning' : 'text-destructive'}`}>{dept.rate}%</span>
                    <span className={`text-xs flex items-center gap-0.5 ${dept.trend > 0 ? 'text-success' : 'text-destructive'}`}>
                      {dept.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(dept.trend)}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${dept.rate >= 90 ? 'bg-success' : dept.rate >= 80 ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{dept.cases} cases processed</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Overall Compliance</p>
              <p className="text-2xl font-bold text-primary">87.3%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Processing Time</p>
              <p className="text-2xl font-bold">9.4 days</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Citizen Satisfaction</p>
              <p className="text-2xl font-bold text-success">4.1/5</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SLA Target</p>
              <p className="text-2xl font-bold text-muted-foreground">≥ 95%</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl mb-5 w-fit">
          {(['cases', 'officers', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {tab === 'cases' ? `Cases (${CASES.filter(c => c.status !== 'completed').length})` : tab === 'officers' ? 'Officer Load' : 'Trend Analytics'}
            </button>
          ))}
        </div>

        {activeTab === 'cases' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Controls */}
            <div className="p-5 border-b border-border flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-48 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search case ID, applicant, service..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'breached', 'at-risk', 'on-track', 'completed'] as const).map(s => {
                  const count = s === 'all' ? CASES.length : CASES.filter(c => c.status === s).length;
                  const cfg = s === 'all' ? null : STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setActiveFilter(s)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                        activeFilter === s
                          ? 'bg-foreground text-background'
                          : cfg ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {s === 'all' ? `All (${count})` : `${STATUS_CONFIG[s].label} (${count})`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {['Priority', 'Case ID', 'Applicant / Service', 'Officer', 'Stage', 'SLA Status', 'Time Left', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(c => {
                    const statusCfg = STATUS_CONFIG[c.status];
                    const priorityCfg = PRIORITY_CONFIG[c.priority];
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={c.id} className={`hover:bg-muted/30 transition-colors ${c.status === 'breached' ? 'bg-destructive/5' : c.status === 'at-risk' && c.hoursLeft < 24 ? 'bg-warning/5' : ''}`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${priorityCfg.dot}`} />
                            <span className={`text-xs font-medium ${priorityCfg.color}`}>{priorityCfg.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono font-medium text-primary">{c.id}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-sm">{c.applicant}</p>
                          <p className="text-xs text-muted-foreground">{c.service}</p>
                          <p className="text-xs text-muted-foreground">{c.dept}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium">{c.officer}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs bg-muted rounded-lg px-2 py-1">{c.stage}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border} w-fit`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                          {c.breachReason && (
                            <p className="text-xs text-destructive mt-1 max-w-xs">{c.breachReason}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <SLABadge hoursLeft={c.hoursLeft} status={c.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View case">
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            {(c.status === 'breached' || c.status === 'at-risk') && (
                              <button className="flex items-center gap-1 px-2.5 py-1.5 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg text-xs font-medium hover:bg-destructive/20 transition-colors">
                                <Zap className="w-3 h-3" />
                                Escalate
                              </button>
                            )}
                            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Message officer">
                              <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-5 border-t border-border">
              <p className="text-xs text-muted-foreground">Showing {filtered.length} of {CASES.length} cases</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-muted rounded-lg text-xs font-medium hover:bg-muted/80">Previous</button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">Next</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'officers' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-base font-semibold">Officer Workload & Performance</h2>
              <p className="text-xs text-muted-foreground mt-1">Real-time case distribution and SLA compliance per officer</p>
            </div>
            <div className="divide-y divide-border">
              {OFFICER_WORKLOAD.map(o => (
                <div key={o.id} className={`p-5 hover:bg-muted/30 transition-colors ${o.status === 'overloaded' ? 'bg-warning/5' : ''}`}>
                  <div className="flex items-start gap-5 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{o.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-semibold">{o.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{o.id}</span>
                        {o.status === 'overloaded' && (
                          <span className="text-xs bg-warning/10 text-warning border border-warning/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Overloaded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{o.dept}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Active Cases</p>
                          <p className={`text-lg font-bold ${o.active > 10 ? 'text-warning' : 'text-foreground'}`}>{o.active}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Breached</p>
                          <p className={`text-lg font-bold ${o.breached > 0 ? 'text-destructive' : 'text-success'}`}>{o.breached}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">At Risk</p>
                          <p className={`text-lg font-bold ${o.atRisk > 0 ? 'text-warning' : 'text-success'}`}>{o.atRisk}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Processing</p>
                          <p className="text-lg font-bold">{o.avgDays}d</p>
                        </div>
                      </div>

                      {/* Workload bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Workload capacity</span>
                          <span className={o.active > 10 ? 'text-warning font-medium' : 'text-muted-foreground'}>{Math.round((o.active / 15) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${o.active > 12 ? 'bg-destructive' : o.active > 8 ? 'bg-warning' : 'bg-success'}`}
                            style={{ width: `${Math.min((o.active / 15) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {o.status === 'overloaded' && (
                        <button className="flex items-center gap-1.5 px-3 py-2 bg-warning/10 text-warning border border-warning/30 rounded-xl text-xs font-medium hover:bg-warning/20 transition-colors">
                          <UserCheck className="w-3.5 h-3.5" /> Reassign Cases
                        </button>
                      )}
                      <button className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-5">
            {/* Breach trend */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-4">SLA Breach Trend — Last 30 Days</h2>
              <div className="flex items-end gap-1.5 h-32">
                {[4, 2, 6, 3, 1, 5, 2, 4, 3, 2, 8, 4, 3, 2, 1, 3, 5, 2, 4, 1, 3, 2, 6, 3, 2, 4, 1, 2, 3, 2].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-sm transition-all ${v > 5 ? 'bg-destructive' : v > 3 ? 'bg-warning' : 'bg-primary/40'}`}
                      style={{ height: `${(v / 8) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>1 Apr</span>
                <span>15 Apr</span>
                <span>30 Apr</span>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 bg-destructive rounded" /> More than 5 breaches</div>
                <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 bg-warning rounded" /> 3–5 breaches</div>
                <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 bg-primary/40 rounded" /> 1–2 breaches</div>
              </div>
            </div>

            {/* Top breach reasons */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-4">Top Breach Root Causes</h2>
              <div className="space-y-3">
                {[
                  { reason: 'Officer unavailability / leave (no backup)', count: 23, pct: 38 },
                  { reason: 'High workload — cases not assigned within 48h', count: 18, pct: 30 },
                  { reason: 'Citizen document deficiency not responded in time', count: 11, pct: 18 },
                  { reason: 'Third-party API dependency (Aadhaar, DigiLocker)', count: 5, pct: 8 },
                  { reason: 'System downtime / maintenance', count: 4, pct: 6 },
                ].map(r => (
                  <div key={r.reason}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{r.reason}</span>
                      <span className="text-sm font-medium text-muted-foreground">{r.count} cases ({r.pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${r.pct}%` }} />
                    </div>
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

// Layers import fix
function Layers({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
