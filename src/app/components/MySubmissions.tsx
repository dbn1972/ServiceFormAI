import { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, AlertTriangle, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { OfflineStore, SyncQueueEntry } from '../services/offlineStore';
import type { SyncManager } from '../services/syncManager';

interface MySubmissionsProps {
  consumerId: string;
  offlineStore: OfflineStore;
  syncManager?: SyncManager;
}

type GroupedEntries = {
  pending: SyncQueueEntry[];
  in_progress: SyncQueueEntry[];
  completed: SyncQueueEntry[];
  failed: SyncQueueEntry[];
};

function formatRelativeTime(ms: number): string {
  const diff = ms - Date.now();
  if (diff <= 0) return 'now';
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `in ${minutes}m`;
  return `in ${seconds}s`;
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'Syncing',
  completed: 'Completed',
  failed: 'Failed',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
};

export default function MySubmissions({
  consumerId,
  offlineStore,
  syncManager,
}: MySubmissionsProps) {
  const [grouped, setGrouped] = useState<GroupedEntries>({
    pending: [],
    in_progress: [],
    completed: [],
    failed: [],
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await offlineStore.getQueueByConsumer(consumerId);
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const result: GroupedEntries = {
        pending: [],
        in_progress: [],
        completed: [],
        failed: [],
      };

      for (const entry of entries) {
        if (entry.status === 'completed') {
          // Only show completed entries from the last 24 hours
          const submittedAt = new Date(entry.submittedAt).getTime();
          if (submittedAt >= oneDayAgo) {
            result.completed.push(entry);
          }
        } else if (entry.status in result) {
          result[entry.status as keyof GroupedEntries].push(entry);
        }
      }

      setGrouped(result);
    } finally {
      setLoading(false);
    }
  }, [consumerId, offlineStore]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Listen for sync events
  useEffect(() => {
    if (!syncManager) return;

    const handleSync = () => loadEntries();
    syncManager.addEventListener('sync', handleSync);
    return () => syncManager.removeEventListener('sync', handleSync);
  }, [syncManager, loadEntries]);

  const handleRetry = async (entryId: string) => {
    if (!syncManager) return;
    await syncManager.retryEntry(entryId);
    await loadEntries();
  };

  const handleDelete = async (entryId: string) => {
    if (!syncManager) return;
    await syncManager.deleteEntry(entryId);
    setDeleteTarget(null);
    await loadEntries();
  };

  const totalCount =
    grouped.pending.length +
    grouped.in_progress.length +
    grouped.completed.length +
    grouped.failed.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No submissions yet.
      </div>
    );
  }

  const sections: Array<{ key: keyof GroupedEntries; label: string; icon: React.ReactNode }> = [
    {
      key: 'failed',
      label: 'Failed',
      icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
    },
    {
      key: 'in_progress',
      label: 'Syncing',
      icon: <Loader2 className="w-4 h-4 animate-spin text-info" />,
    },
    {
      key: 'pending',
      label: 'Pending',
      icon: <Clock className="w-4 h-4 text-warning" />,
    },
    {
      key: 'completed',
      label: 'Completed (last 24h)',
      icon: <CheckCircle className="w-4 h-4 text-success" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Submissions</h2>
        <button
          type="button"
          onClick={loadEntries}
          className="p-2 hover:bg-muted rounded-lg"
          aria-label="Refresh submissions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {sections.map(({ key, label, icon }) => {
        const entries = grouped[key];
        if (entries.length === 0) return null;

        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-3">
              {icon}
              <h3 className="font-medium text-sm">{label}</h3>
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                {entries.length}
              </span>
            </div>

            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-border rounded-lg p-4 bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        Service: {entry.serviceId}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {formatDate(entry.submittedAt)}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLORS[entry.status]}`}
                      >
                        {STATUS_LABELS[entry.status]}
                      </span>

                      {(entry.status === 'pending' || entry.status === 'in_progress') && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Next sync: {formatRelativeTime(entry.nextRetryAt)}
                        </p>
                      )}

                      {entry.status === 'failed' && entry.failureReason && (
                        <p className="text-xs text-destructive mt-1">{entry.failureReason}</p>
                      )}
                    </div>

                    {entry.status === 'failed' && syncManager && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRetry(entry.id)}
                          className="p-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20"
                          aria-label="Retry submission"
                          title="Retry"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(entry.id)}
                          className="p-1.5 bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                          aria-label="Delete submission"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Delete confirmation dialog */}
      <AlertDialog.Root
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-xl p-6 max-w-md w-full shadow-xl">
            <AlertDialog.Title className="text-lg font-semibold mb-2">
              Delete Submission?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground mb-6">
              This will permanently delete this failed submission. This action cannot be undone.
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90"
                  onClick={() => deleteTarget && handleDelete(deleteTarget)}
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
