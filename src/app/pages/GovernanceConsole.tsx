import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Database,
  Download,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  Shield,
  TimerReset,
} from 'lucide-react';
import { scalabilityService } from '../services/api/index';
import type {
  ScalabilityConfig,
  ScalabilitySummary,
  ScalabilityViolationRecord,
} from '../shared/types';

const fallbackSummary: ScalabilitySummary = {
  startedAt: new Date().toISOString(),
  cache: {
    hits: 0,
    misses: 0,
    errors: 0,
    staleServed: 0,
    fallbackToDb: 0,
    repopulations: 0,
    repopulationFailures: 0,
    invalidations: 0,
    hitRate: 0,
    byEndpoint: {},
  },
  queue: {
    availability: 'missing',
    depth: 0,
    lag: 0,
    oldestMessageAgeMs: 0,
    processingRate: 0,
    errorRate: 0,
    retryCount: 0,
    dlqCount: 0,
    processed: 0,
    duplicates: 0,
    poisonMessages: 0,
    directWriteBypasses: 0,
    enqueued: 0,
  },
  database: {
    directReadViolations: 0,
    directWriteViolations: 0,
    fallbackReads: 0,
  },
  violations: {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  },
};

const fallbackConfig: ScalabilityConfig = {
  cache: {
    enabled: true,
    domains: {},
  },
  queue: {
    enabled: false,
    provider: 'disabled',
    retryLimit: 5,
    backoffMs: 5000,
    dlqEnabled: false,
    consumersPaused: false,
  },
  dbFallback: {
    enabled: true,
    maxFallbacksPerMinute: 500,
  },
  featureFlags: {},
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMs(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`;
  }

  return `${value}ms`;
}

function severityClass(severity: ScalabilityViolationRecord['severity']) {
  switch (severity) {
    case 'Critical':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'High':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'Medium':
      return 'bg-info/10 text-info border-info/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export default function GovernanceConsole() {
  const [summary, setSummary] = useState<ScalabilitySummary>(fallbackSummary);
  const [config, setConfig] = useState<ScalabilityConfig>(fallbackConfig);
  const [violations, setViolations] = useState<ScalabilityViolationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const domainEntries = useMemo(
    () => Object.entries(config.cache.domains),
    [config.cache.domains]
  );
  const endpointEntries = useMemo(
    () => Object.entries(summary.cache.byEndpoint),
    [summary.cache.byEndpoint]
  );

  async function loadDashboard() {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryResponse, violationsResponse] = await Promise.all([
        scalabilityService.getSummary(),
        scalabilityService.getViolations(),
      ]);

      setSummary(summaryResponse.summary);
      setConfig(summaryResponse.config);
      setViolations(violationsResponse);
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load scalability controls');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function persistConfig(nextConfig: Partial<ScalabilityConfig>, message: string) {
    setIsSaving(true);
    setNotice(null);
    setError(null);

    try {
      const updated = await scalabilityService.updateConfig(nextConfig);
      setConfig(updated);
      setNotice(message);
    } catch (saveError: any) {
      setError(saveError.message || 'Unable to update scalability configuration');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleQueueAction(action: 'pause' | 'resume' | 'retry') {
    setIsActing(true);
    setNotice(null);
    setError(null);

    try {
      if (action === 'pause') {
        await scalabilityService.pauseQueueConsumers();
        setNotice('Queue consumers marked as paused.');
      } else if (action === 'resume') {
        await scalabilityService.resumeQueueConsumers();
        setNotice('Queue consumers marked as resumed.');
      } else {
        await scalabilityService.retryFailedMessages();
        setNotice('Retry signal sent for failed queue messages.');
      }

      await loadDashboard();
    } catch (actionError: any) {
      setError(actionError.message || 'Queue action failed');
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scalability Governance Console</h1>
            <p className="text-muted-foreground">
              Live oversight for cache behavior, queue posture, fallback pressure, and direct database violations.
            </p>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            This admin surface is live, but today it controls an in-memory cache and queue scaffold. It is not yet a durable
            production control plane.
          </div>
          <Link
            to="/admin/queue"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Queue Operations
          </Link>
          <button
            onClick={() => scalabilityService.downloadExport()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            title="Download full scalability audit report as JSON"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
          <button
            onClick={() => scalabilityService.downloadExport()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            title="Download full scalability audit report as JSON"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Cache Hit Rate',
              value: formatPercent(summary.cache.hitRate),
              detail: `${summary.cache.hits} hits / ${summary.cache.misses} misses`,
              icon: Activity,
              tone: 'text-success',
            },
            {
              label: 'DB Fallback Reads',
              value: String(summary.database.fallbackReads),
              detail: `${summary.database.directReadViolations} direct uncached reads`,
              icon: Database,
              tone: 'text-warning',
            },
            {
              label: 'Queue Bypass Writes',
              value: String(summary.queue.directWriteBypasses),
              detail: `${summary.database.directWriteViolations} direct DB write violations`,
              icon: AlertTriangle,
              tone: 'text-destructive',
            },
            {
              label: 'Open Violations',
              value: String(summary.violations.total),
              detail: `${summary.violations.critical} critical / ${summary.violations.high} high`,
              icon: Shield,
              tone: 'text-info',
            },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <card.icon className={`h-5 w-5 ${card.tone}`} />
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-6">
                <div>
                  <h2 className="text-lg font-semibold">System Health Snapshot</h2>
                  <p className="text-sm text-muted-foreground">
                    Current cache efficiency, fallback pressure, and queue operability.
                  </p>
                </div>
                <button
                  onClick={loadDashboard}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/30 p-5">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cache</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Repopulations</span>
                      <strong>{summary.cache.repopulations}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Repopulation failures</span>
                      <strong>{summary.cache.repopulationFailures}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stale served</span>
                      <strong>{summary.cache.staleServed}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Invalidations</span>
                      <strong>{summary.cache.invalidations}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Errors</span>
                      <strong>{summary.cache.errors}</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-5">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Queue</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Provider</span>
                      <strong>{config.queue.provider}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Availability</span>
                      <strong>{summary.queue.availability || 'unknown'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Consumers paused</span>
                      <strong>{config.queue.consumersPaused ? 'Yes' : 'No'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Depth</span>
                      <strong>{summary.queue.depth}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lag</span>
                      <strong>{summary.queue.lag}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Oldest message age</span>
                      <strong>{formatMs(summary.queue.oldestMessageAgeMs)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Enqueued</span>
                      <strong>{summary.queue.enqueued || 0}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Retries / DLQ</span>
                      <strong>{summary.queue.retryCount} / {summary.queue.dlqCount}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold">Direct Database Violations</h2>
                <p className="text-sm text-muted-foreground">
                  These are the fastest indicators that the current architecture will not hold at 10M users and 1,000 TPS.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-5">
                  <p className="text-sm text-muted-foreground">Direct reads without cache</p>
                  <p className="mt-2 text-3xl font-bold text-warning">{summary.database.directReadViolations}</p>
                </div>
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                  <p className="text-sm text-muted-foreground">Direct writes without queue</p>
                  <p className="mt-2 text-3xl font-bold text-destructive">{summary.database.directWriteViolations}</p>
                </div>
                <div className="rounded-xl border border-info/20 bg-info/5 p-5">
                  <p className="text-sm text-muted-foreground">DB fallback count</p>
                  <p className="mt-2 text-3xl font-bold text-info">{summary.database.fallbackReads}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold">Per-Endpoint Cache Effectiveness</h2>
                <p className="text-sm text-muted-foreground">
                  Cache-first coverage by endpoint. Empty tables here mean the module has not been exercised yet.
                </p>
              </div>
              <div className="overflow-x-auto p-6">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="pb-3 pr-4 font-medium">Endpoint</th>
                      <th className="pb-3 pr-4 font-medium">Hits</th>
                      <th className="pb-3 pr-4 font-medium">Misses</th>
                      <th className="pb-3 pr-4 font-medium">Fallbacks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpointEntries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-muted-foreground">
                          No live cache endpoint data recorded yet.
                        </td>
                      </tr>
                    ) : (
                      endpointEntries.map(([endpoint, stats]) => (
                        <tr key={endpoint} className="border-b border-border/60">
                          <td className="py-3 pr-4 font-mono text-xs">{endpoint}</td>
                          <td className="py-3 pr-4">{stats.hits}</td>
                          <td className="py-3 pr-4">{stats.misses}</td>
                          <td className="py-3 pr-4">{stats.fallbackToDb}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold">Recent Scalability Violations</h2>
                <p className="text-sm text-muted-foreground">
                  Live violation feed from the backend scaffold. This is the starting point for audit export and enforcement.
                </p>
              </div>
              <div className="space-y-4 p-6">
                {violations.length === 0 ? (
                  <div className="rounded-xl border border-success/20 bg-success/5 p-5 text-sm text-success">
                    No runtime violations recorded in this session yet. Static audit findings still apply even if this list is empty.
                  </div>
                ) : (
                  violations.slice(0, 12).map((violation) => (
                    <div key={`${violation.timestamp}-${violation.module}-${violation.type}`} className="rounded-xl border border-border p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClass(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        <span className="text-sm font-medium">{violation.type}</span>
                        <span className="text-xs text-muted-foreground">{new Date(violation.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium">{violation.module}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{violation.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold">Operational Controls</h2>
                <p className="text-sm text-muted-foreground">
                  Safe, explicit controls only. Dangerous changes are intentionally constrained and clearly labeled.
                </p>
              </div>
              <div className="space-y-6 p-6">
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
                  Queue controls currently toggle an in-memory scaffold only. They do not yet manage a durable broker or distributed worker pool.
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleQueueAction('pause')}
                    disabled={isActing || config.queue.consumersPaused}
                    className="inline-flex items-center gap-2 rounded-lg bg-warning px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <PauseCircle className="h-4 w-4" />
                    Pause Consumers
                  </button>
                  <button
                    onClick={() => handleQueueAction('resume')}
                    disabled={isActing || !config.queue.consumersPaused}
                    className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Resume Consumers
                  </button>
                  <button
                    onClick={() => handleQueueAction('retry')}
                    disabled={isActing}
                    className="inline-flex items-center gap-2 rounded-lg bg-info px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <TimerReset className="h-4 w-4" />
                    Retry Failed
                  </button>
                </div>

                <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Global cache enabled</span>
                    <button
                      disabled={isSaving}
                      onClick={() =>
                        persistConfig(
                          { cache: { ...config.cache, enabled: !config.cache.enabled } },
                          `Global cache ${config.cache.enabled ? 'disabled' : 'enabled'}.`
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        config.cache.enabled
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {config.cache.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database fallback enabled</span>
                    <button
                      disabled={isSaving}
                      onClick={() =>
                        persistConfig(
                          {
                            dbFallback: {
                              ...config.dbFallback,
                              enabled: !config.dbFallback.enabled,
                            },
                          },
                          `Database fallback ${config.dbFallback.enabled ? 'disabled' : 'enabled'}.`
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        config.dbFallback.enabled
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {config.dbFallback.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Queue write path feature flag</span>
                    <button
                      disabled={isSaving}
                      onClick={() =>
                        persistConfig(
                          {
                            featureFlags: {
                              'queue.writePath.enabled': !config.featureFlags['queue.writePath.enabled'],
                            },
                          },
                          `Queue write-path flag ${config.featureFlags['queue.writePath.enabled'] ? 'disabled' : 'enabled'}.`
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        config.featureFlags['queue.writePath.enabled']
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {config.featureFlags['queue.writePath.enabled'] ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold">Queue Policy</h2>
              </div>
              <div className="space-y-4 p-6 text-sm">
                <div className="flex items-center justify-between">
                  <span>Queue enabled</span>
                  <strong>{config.queue.enabled ? 'Yes' : 'No'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Retry limit</span>
                  <strong>{config.queue.retryLimit}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Backoff</span>
                  <strong>{formatMs(config.queue.backoffMs)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>DLQ enabled</span>
                  <strong>{config.queue.dlqEnabled ? 'Yes' : 'No'}</strong>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold">Cache Domains</h2>
              </div>
              <div className="space-y-4 p-6">
                {domainEntries.map(([domain, domainConfig]) => (
                  <div key={domain} className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-mono text-xs">{domain}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          domainConfig.enabled
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {domainConfig.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>TTL</span>
                        <span>{formatMs(domainConfig.ttlMs)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Stale-while-revalidate</span>
                        <span>{formatMs(domainConfig.staleWhileRevalidateMs)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Negative TTL</span>
                        <span>{formatMs(domainConfig.negativeTtlMs)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What this page proves today</p>
          <p className="mt-2">
            We now have an admin-accessible monitor for cache metrics, queue posture, fallback counts, and direct DB violations.
            What we do not have yet is a real Redis cluster, a durable broker, persisted admin configuration, or broker-native DLQ controls.
          </p>
        </div>
      </div>
    </div>
  );
}
