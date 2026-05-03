/**
 * Volume 12 §9 — Module-by-Module Quality Model (QA Dashboard)
 * Volume 12 §13 — Release Exit Criteria (Release Gate UI)
 *
 * Displays the quality status of every product module,
 * automation coverage, known risks, and release readiness.
 */

import { useState, useMemo } from 'react';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  BookOpen,
  Clock,
  Users,
  Layers,
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';
import {
  MODULE_QA_MANIFEST,
  getManifestSummary,
  type QAModule,
  type AutomationLevel,
  type Severity,
} from '../../../qa/module-qa-manifest';

// ── Helpers ────────────────────────────────────────────────────────────────────
const automationBadge: Record<AutomationLevel, { label: string; color: string }> = {
  full:    { label: 'Fully Automated', color: 'bg-emerald-100 text-emerald-700' },
  partial: { label: 'Partial',         color: 'bg-blue-100 text-blue-700'       },
  manual:  { label: 'Manual',          color: 'bg-amber-100 text-amber-700'     },
  none:    { label: 'None',            color: 'bg-red-100 text-red-700'         },
};

const severityColor: Record<Severity, string> = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  medium:   'text-amber-700 bg-amber-50 border-amber-200',
  low:      'text-slate-700 bg-slate-50 border-slate-200',
};

const deviceIcons: Record<string, React.ElementType> = {
  mobile:  Smartphone,
  tablet:  Tablet,
  desktop: Monitor,
};

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ModuleCard({ module }: { module: QAModule }) {
  const [expanded, setExpanded] = useState(false);
  const badge = automationBadge[module.automationLevel];
  const criticalRisks = module.knownRisks.filter((r) => r.severity === 'critical');
  const highRisks = module.knownRisks.filter((r) => r.severity === 'high');

  const statusIcon =
    criticalRisks.length > 0 ? <XCircle className="w-4 h-4 text-red-500" /> :
    highRisks.length > 0 ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
    module.automationLevel === 'none' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
    <CheckCircle className="w-4 h-4 text-emerald-500" />;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          {statusIcon}
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground truncate">{module.name}</div>
            <div className="text-xs text-muted-foreground truncate">{module.purpose}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
            {badge.label}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t p-4 space-y-4">
          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {module.roles.join(', ')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Owner: {module.owner}
            </span>
          </div>

          {/* Device coverage */}
          {module.responsiveCoverageNeeded.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Device Coverage</p>
              <div className="flex gap-2 flex-wrap">
                {module.responsiveCoverageNeeded.map((device) => {
                  const Icon = deviceIcons[device] ?? Monitor;
                  return (
                    <span key={device} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                      <Icon className="w-3 h-3" /> {device}
                    </span>
                  );
                })}
                {module.darkModeCoverageNeeded && (
                  <span className="flex items-center gap-1 text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full">
                    🌙 dark mode
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Critical journeys */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Critical Journeys</p>
            <ul className="space-y-1">
              {module.criticalJourneys.map((j, i) => (
                <li key={i} className="text-xs text-foreground flex gap-2">
                  <span className="text-muted-foreground">•</span>{j}
                </li>
              ))}
            </ul>
          </div>

          {/* Automation tests */}
          {module.automationTests.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Automation Tests</p>
              {module.automationTests.map((t, i) => (
                <code key={i} className="block text-xs bg-muted px-2 py-0.5 rounded mt-1 text-foreground">
                  {t}
                </code>
              ))}
            </div>
          )}

          {/* Known risks */}
          {module.knownRisks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Known Risks</p>
              {module.knownRisks.map((risk, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs rounded px-2 py-1.5 border mb-1 ${severityColor[risk.severity]}`}>
                  <span className="font-semibold uppercase text-[10px] flex-shrink-0">{risk.severity}</span>
                  <span>{risk.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* APIs */}
          {module.keyAPIs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Key APIs ({module.keyAPIs.length})</p>
              <div className="flex flex-wrap gap-1">
                {module.keyAPIs.map((api, i) => (
                  <code key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground">{api}</code>
                ))}
              </div>
            </div>
          )}

          {/* Release blockers */}
          {module.releaseBlockers.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-bold text-red-700 mb-1">Release Blockers</p>
              {module.releaseBlockers.map((b, i) => (
                <p key={i} className="text-xs text-red-700">• {b}</p>
              ))}
            </div>
          )}
          {module.releaseBlockers.length === 0 && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> No release blockers
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function QADashboard() {
  const [filter, setFilter] = useState<'all' | 'risks' | 'manual'>('all');
  const [search, setSearch] = useState('');

  const summary = useMemo(() => getManifestSummary(), []);

  const filtered = useMemo(() => {
    let modules = MODULE_QA_MANIFEST;
    if (filter === 'risks') {
      modules = modules.filter((m) => m.knownRisks.some((r) => r.severity === 'critical' || r.severity === 'high'));
    } else if (filter === 'manual') {
      modules = modules.filter((m) => m.automationLevel === 'none' || m.automationLevel === 'manual');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      modules = modules.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.purpose.toLowerCase().includes(q) ||
        m.owner.toLowerCase().includes(q)
      );
    }
    return modules;
  }, [filter, search]);

  return (
    <div className="min-h-full bg-background p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">QA Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Volume 12 §9 — Module-by-module quality model &amp; §13 — Release exit criteria
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Modules" value={summary.total} color="text-foreground" />
        <SummaryCard label="Fully Automated" value={summary.fullyAutomated} color="text-emerald-600" />
        <SummaryCard label="Partial Coverage" value={summary.partial} color="text-blue-600" />
        <SummaryCard label="Manual / None" value={summary.manual} color="text-amber-600" />
        <SummaryCard label="Critical Risks" value={summary.criticalRisks} color="text-red-600" />
        <SummaryCard label="High Risks" value={summary.highRisks} color="text-orange-600" />
      </div>

      {/* Release gate summary */}
      <div className={`rounded-xl border-2 p-4 ${summary.criticalRisks > 0 ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
        <div className="flex items-center gap-3">
          {summary.criticalRisks > 0
            ? <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            : <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          }
          <div>
            <p className={`font-semibold text-sm ${summary.criticalRisks > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {summary.criticalRisks > 0
                ? `Release blocked — ${summary.criticalRisks} critical risk(s) unresolved`
                : 'No critical blockers — release may proceed pending gate checks'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Per Volume 12 §13: critical + high risks must be resolved before shipping.
              Run <code className="bg-muted px-1 rounded">./deployment/scripts/qa-gate.sh --report</code> for full gate check.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 rounded-lg border bg-muted p-1">
          {(['all', 'risks', 'manual'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'All Modules' : f === 'risks' ? '⚠ Known Risks' : '🔧 Manual Only'}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search modules…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search modules"
        />
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {summary.total} modules
        </span>
      </div>

      {/* Module list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-muted-foreground text-sm">
            No modules match your filter.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-6">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Volume 12 §9 — Module QA Model</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> §13 — Release Exit Criteria</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> §12 — Automation Strategy</span>
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> §3 — Test Environment Matrix</span>
        </div>
        <p className="mt-2">
          Test suites: <code className="bg-muted px-1 rounded">npm test</code> (Vitest) ·{' '}
          <code className="bg-muted px-1 rounded">npm run test:e2e</code> (Playwright) ·{' '}
          <code className="bg-muted px-1 rounded">./deployment/scripts/qa-gate.sh</code> (Release gate)
        </p>
      </div>
    </div>
  );
}
