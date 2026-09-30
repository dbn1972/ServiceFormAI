import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  TimerReset,
  Workflow,
} from 'lucide-react';
import { scalabilityService } from '../services/api/index';
import type { ScalabilityConfig, ScalabilitySummary } from '../shared/types';

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

function formatMs(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`;
  }

  return `${value}ms`;
}

export default function QueueOperations() {
  const [summary, setSummary] = useState<ScalabilitySummary>(fallbackSummary);
  const [config, setConfig] = useState<ScalabilityConfig>(fallbackConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queueStatusTone = useMemo(() => {
    if (!config.queue.enabled || config.queue.provider === 'disabled') {
      return 'text-muted-foreground';
    }

    if (config.queue.consumersPaused) {
      return 'text-warning';
    }

    if (summary.queue.dlqCount > 0 || summary.queue.poisonMessages > 0) {
      return 'text-destructive';
    }

    return 'text-success';
  }, [config.queue, summary.queue.dlqCount, summary.queue.poisonMessages]);

  async function loadQueueState() {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryResponse, configResponse] = await Promise.all([
        scalabilityService.getSummary(),
        scalabilityService.getConfig(),
      ]);

      setSummary(summaryResponse.summary);
      setConfig(configResponse);
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load queue state');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadQueueState();
  }, []);

  async function handleAction(action: 'pause' | 'resume' | 'retry') {
    setIsActing(true);
    setNotice(null);
    setError(null);

    try {
      if (action === 'pause') {
        await scalabilityService.pauseQueueConsumers();
        setNotice('Queue consumers paused.');
      } else if (action === 'resume') {
        await scalabilityService.resumeQueueConsumers();
        setNotice('Queue consumers resumed.');
      } else {
        await scalabilityService.retryFailedMessages();
        setNotice('Retry requested for failed queue messages.');
      }

      await loadQueueState();
    } catch (actionError: any) {
      setError(actionError.message || 'Queue action failed');
    } finally {
      setIsActing(false);
    }
  }

  return (
    <main className="min-h-full bg-muted/20 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${queueStatusTone === 'text-destructive' ? 'bg-destructive animate-pulse' : queueStatusTone === 'text-warning' ? 'bg-warning animate-pulse' : 'bg-success'}`} />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Queue Operations</span>
            </div>
            <h1 className="text-3xl font-bold">Messaging and Queue Control</h1>
            <p className="text-muted-foreground text-sm max-w-3xl">
              Monitor provider availability, queue depth, poison messages, and retry posture. This surface reuses the
              existing scalability controls and makes queue governance explicit.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadQueueState}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => handleAction('pause')}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning hover:bg-warning/20 disabled:opacity-60 transition-colors"
            >
              <PauseCircle className="h-4 w-4" />
              Pause Consumers
            </button>
            <button
              onClick={() => handleAction('resume')}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success hover:bg-success/20 disabled:opacity-60 transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              Resume Consumers
            </button>
            <button
              onClick={() => handleAction('retry')}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60 transition-colors"
            >
              <TimerReset className="h-4 w-4" />
              Retry Failed
            </button>
          </div>
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Queue Availability', value: config.queue.provider, detail: config.queue.enabled ? 'Enabled' : 'Disabled', icon: Workflow },
            { label: 'Consumers Paused', value: config.queue.consumersPaused ? 'Yes' : 'No', detail: `Retry limit ${config.queue.retryLimit}`, icon: PauseCircle },
            { label: 'DLQ Count', value: String(summary.queue.dlqCount), detail: `${summary.queue.poisonMessages} poison messages`, icon: ShieldAlert },
            { label: 'Oldest Message', value: formatMs(summary.queue.oldestMessageAgeMs), detail: `${summary.queue.depth} queued`, icon: Clock3 },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm font-medium text-foreground">{card.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.detail}</p>
              </article>
            );
          })}
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Queue Health</h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Processing rate</span>
                <span className="font-medium text-foreground">{summary.queue.processingRate.toFixed(1)} msg/min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Error rate</span>
                <span className="font-medium text-foreground">{summary.queue.errorRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Retries</span>
                <span className="font-medium text-foreground">{summary.queue.retryCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Processed</span>
                <span className="font-medium text-foreground">{summary.queue.processed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Direct write bypasses</span>
                <span className="font-medium text-foreground">{summary.queue.directWriteBypasses}</span>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Queue Policy</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium text-foreground">Provider</p>
                <p className="mt-1">{config.queue.provider}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium text-foreground">DLQ enabled</p>
                <p className="mt-1">{config.queue.dlqEnabled ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium text-foreground">Backoff</p>
                <p className="mt-1">{formatMs(config.queue.backoffMs)} between retries</p>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-border bg-muted/20 p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Governance note
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
            This page makes queue controls visible to admins, but the deeper platform gap remains backend service
            ownership and adapter breadth. The surface is intentionally narrow and reuses the current scalability
            service instead of inventing new infrastructure.
          </p>
        </section>
      </div>
    </main>
  );
}