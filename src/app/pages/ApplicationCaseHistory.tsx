import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  History,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { consumerService } from '../services/api/index';
import type { Application } from '../shared/types';

function formatDateTime(date: string) {
  return new Date(date).toLocaleString();
}

export default function ApplicationCaseHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadApplication() {
      if (!id) {
        setError('Application ID is missing.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [applicationResponse, documents] = await Promise.all([
          consumerService.getApplicationById(id),
          consumerService.getApplicationDocuments(id),
        ]);

        if (!isMounted) {
          return;
        }

        setApplication({
          ...applicationResponse,
          documents,
        });
      } catch (loadError: any) {
        if (!isMounted) {
          return;
        }
        setError(loadError.message || 'Unable to load the application history.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadApplication();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const openDeficiency = useMemo(
    () => application?.deficiencies?.find((item) => item.status === 'open') || null,
    [application],
  );

  const history = application?.statusHistory || [];
  const documents = application?.documents || [];

  async function handleResponseSubmit() {
    if (!id || !openDeficiency) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await consumerService.submitDeficiencyResponse(id, {
        notes: responseNotes.trim() || undefined,
      });

      toast.success('Deficiency response submitted successfully.');
      setResponseNotes('');

      const [refreshedApplication, refreshedDocuments] = await Promise.all([
        consumerService.getApplicationById(id),
        consumerService.getApplicationDocuments(id),
      ]);

      setApplication({
        ...refreshedApplication,
        documents: refreshedDocuments,
      });

      navigate(`/applications/${id}`);
    } catch (submitError: any) {
      setError(submitError.message || 'Unable to submit your response.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <button
            type="button"
            onClick={() => navigate(application ? `/applications/${application.id}` : '/applications')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to status
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <History className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Case History</span>
              </div>
              <h1 className="mb-2 text-3xl font-bold">Application Audit Snapshot</h1>
              <p className="text-muted-foreground">
                Review the saved status timeline, linked documents, and any outstanding deficiencies before you respond.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/audit')}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Open platform audit trail
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {isLoading && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            Loading application case history...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {application && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">Tracking Number</p>
                    <h2 className="text-xl font-semibold">{application.trackingNumber}</h2>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-sm font-medium ${application.status === 'PENDING_DOCUMENTS' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'}`}>
                    {application.status.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border p-4">
                    <p className="mb-1 text-xs text-muted-foreground">Submitted</p>
                    <p className="text-sm font-medium">{formatDateTime(application.submittedAt)}</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="mb-1 text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">{formatDateTime(application.updatedAt)}</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="mb-1 text-xs text-muted-foreground">Documents</p>
                    <p className="text-sm font-medium">{documents.length} linked document{documents.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Timeline</h3>
                </div>
                <div className="space-y-4">
                  {history.length > 0 ? history.map((entry) => (
                    <div key={entry.id} className="relative border-l-2 border-border pl-6">
                      <div className="absolute left-0 top-0 -translate-x-1/2">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${entry.status === 'APPROVED' || entry.status === 'COMPLETED' ? 'bg-success' : entry.status === 'PENDING_DOCUMENTS' ? 'bg-warning' : 'bg-primary'}`}>
                          {entry.status === 'APPROVED' || entry.status === 'COMPLETED' ? <CheckCircle className="h-3.5 w-3.5 text-success-foreground" /> : <Clock className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </div>
                      <p className="text-sm font-medium">{entry.stage || entry.status}</p>
                      <p className="text-xs text-muted-foreground">{entry.notes || 'Status updated'} • {formatDateTime(entry.changedAt)}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No saved history events yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Linked Documents</h3>
                </div>
                <div className="space-y-3">
                  {documents.length > 0 ? documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} • Uploaded {formatDateTime(doc.uploadedAt)}</p>
                      </div>
                      <button type="button" className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
                        View
                      </button>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No documents linked to this application yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h3 className="text-lg font-semibold">Deficiency Response</h3>
                </div>

                {openDeficiency ? (
                  <>
                    <p className="mb-3 text-sm text-muted-foreground">{openDeficiency.title}</p>
                    <p className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">{openDeficiency.description}</p>

                    <label className="mb-2 block text-sm font-medium">Officer note or clarification</label>
                    <textarea
                      value={responseNotes}
                      onChange={(event) => setResponseNotes(event.target.value)}
                      rows={5}
                      className="mb-4 w-full rounded-xl border border-border bg-input-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Describe what you have corrected or uploaded."
                    />

                    <button
                      type="button"
                      onClick={() => void handleResponseSubmit()}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isSubmitting ? 'Submitting response...' : 'Submit deficiency response'}
                    </button>
                  </>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                    No open deficiency is currently assigned to this application.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Audit Snapshot</h3>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Application history entries are immutably stored on the backend.
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Each status update creates a timeline event and a deficiency record when needed.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}