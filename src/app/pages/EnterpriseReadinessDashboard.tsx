import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Shield, Database, Activity, BarChart3, Scale } from 'lucide-react';
import { API_ENDPOINTS } from '../shared/config/api.config';
import { apiService } from '../services/api/base.service';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReadinessCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail?: string;
}

interface ReadinessCategory {
  score: number;
  max: number;
  checks: ReadinessCheck[];
}

interface ReadinessScore {
  score: number;
  maxScore: number;
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_IMPROVEMENT';
  categories: {
    security: ReadinessCategory;
    data: ReadinessCategory;
    availability: ReadinessCategory;
    monitoring: ReadinessCategory;
    compliance: ReadinessCategory;
  };
  generatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const gradeConfig = {
  EXCELLENT:          { label: 'Excellent',           color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  GOOD:               { label: 'Good',                color: 'text-green-600',   bg: 'bg-green-50 border-green-200'   },
  FAIR:               { label: 'Fair',                color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'   },
  NEEDS_IMPROVEMENT:  { label: 'Needs Improvement',   color: 'text-red-600',     bg: 'bg-red-50 border-red-200'       },
};

const categoryMeta: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  security:     { label: 'Security & Authentication', icon: Shield,    color: 'text-blue-600'   },
  data:         { label: 'Data & Backup',             icon: Database,  color: 'text-purple-600' },
  availability: { label: 'Availability',              icon: Activity,  color: 'text-green-600'  },
  monitoring:   { label: 'Monitoring & Observability',icon: BarChart3, color: 'text-amber-600'  },
  compliance:   { label: 'Compliance & Privacy',      icon: Scale,     color: 'text-indigo-600' },
};

function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  if (status === 'pass') {
    return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-label="Pass" />;
  }
  if (status === 'warn') {
    return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" aria-label="Warning" />;
  }
  return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" aria-label="Fail" />;
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 90 ? '#10b981' : pct >= 75 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <span className="absolute text-lg font-bold text-foreground">{score}/{max}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EnterpriseReadinessDashboard() {
  const [data, setData] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.get<ReadinessScore>(API_ENDPOINTS.health.readinessScore);
      setData(result);
      setLastRefreshed(new Date());
    } catch {
      setError('Unable to reach backend. Ensure the backend is running on localhost:3001.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const grade = data ? gradeConfig[data.grade] : null;

  return (
    <div className="min-h-full bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enterprise Readiness Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time production-readiness score for ServiceFormAI OS — Volume 11 §13
          </p>
          {lastRefreshed && (
            <p className="text-xs text-muted-foreground mt-1">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchScore}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="inline w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Overall Score Card */}
          <div className={`rounded-xl border-2 p-6 flex flex-col sm:flex-row items-center gap-6 ${grade?.bg}`}>
            <div className="flex flex-col items-center gap-1">
              <ScoreRing score={data.score} max={data.maxScore} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${grade?.color}`}>
                {grade?.label}
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-foreground">
                Overall Readiness: {data.score} / {data.maxScore}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {data.grade === 'EXCELLENT' && 'System is fully production-ready. Keep monitoring for drift.'}
                {data.grade === 'GOOD' && 'System is production-ready. Address warnings to improve score.'}
                {data.grade === 'FAIR' && 'Address warnings before production deployment.'}
                {data.grade === 'NEEDS_IMPROVEMENT' && 'Critical issues detected. Do not deploy to production until resolved.'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Generated: {new Date(data.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(data.categories).map(([key, cat]) => {
              const meta = categoryMeta[key];
              const Icon = meta?.icon ?? Activity;
              const pct = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
              const passCount = cat.checks.filter(c => c.status === 'pass').length;
              const failCount = cat.checks.filter(c => c.status === 'fail').length;

              return (
                <div key={key} className="rounded-xl border bg-card p-5 space-y-4">
                  {/* Category header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${meta?.color ?? 'text-foreground'}`} />
                      <span className="font-semibold text-sm text-foreground">{meta?.label ?? key}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{cat.score}/{cat.max}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {passCount} passed · {failCount} failed · {cat.checks.length - passCount - failCount} warnings
                  </p>

                  {/* Checks list */}
                  <ul className="space-y-2">
                    {cat.checks.map((check, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <StatusBadge status={check.status} />
                        <div className="flex-1 min-w-0">
                          <span className={check.status === 'fail' ? 'text-red-700 font-medium' : 'text-foreground'}>
                            {check.name}
                          </span>
                          {check.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{check.detail}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Action footer */}
          {data.score < 100 && (
            <div className="rounded-xl border bg-muted/50 p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">How to improve your score</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li>• Set <code className="text-xs bg-muted px-1 rounded">TLS_ENABLED=true</code> in your <code className="text-xs bg-muted px-1 rounded">.env</code></li>
                <li>• Enable <code className="text-xs bg-muted px-1 rounded">ENABLE_CSRF_PROTECTION=true</code></li>
                <li>• Configure <code className="text-xs bg-muted px-1 rounded">BACKUP_ENABLED=true</code> + S3 bucket</li>
                <li>• Set <code className="text-xs bg-muted px-1 rounded">SENTRY_DSN</code> for error tracking</li>
                <li>• Enable <code className="text-xs bg-muted px-1 rounded">DPDP_ACT_2023_ENABLED=true</code></li>
                <li>• Set <code className="text-xs bg-muted px-1 rounded">ENABLE_METRICS=true</code> for Prometheus</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Run the full CLI audit: <code className="bg-muted px-1 rounded">./deployment/scripts/validate.sh --readiness</code>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
