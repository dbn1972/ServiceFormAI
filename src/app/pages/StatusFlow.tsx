import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { consumerService } from '../services/api/index';
import type { Application } from '../shared/types';

function formatDateTime(date: string) {
  return new Date(date).toLocaleString();
}

function statusBadge(status: Application['status']) {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
      return { label: 'Approved', classes: 'bg-success/10 text-success' };
    case 'PENDING_DOCUMENTS':
      return { label: 'Action Required', classes: 'bg-warning/10 text-warning' };
    case 'REJECTED':
    case 'CANCELLED':
      return { label: 'Rejected', classes: 'bg-destructive/10 text-destructive' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', classes: 'bg-warning/10 text-warning' };
    default:
      return { label: 'Submitted', classes: 'bg-info/10 text-info' };
  }
}

export default function StatusFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const response = await consumerService.getApplicationById(id);
        if (!isMounted) {
          return;
        }
        setApplication(response);
      } catch (loadError: any) {
        if (!isMounted) {
          return;
        }
        setError(loadError.message || 'Unable to load application status.');
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

  const badge = application ? statusBadge(application.status) : null;

  const timeline = useMemo(() => {
    if (!application) {
      return [];
    }

    const currentStage = application.currentStage || 'Workflow Processing';
    const submittedAt = application.submittedAt;
    const updatedAt = application.updatedAt || application.submittedAt;

    const steps = [
      {
        title: 'Application Submitted',
        desc: 'Your application has been received and acknowledgement generated.',
        time: submittedAt,
        state: 'done' as const,
      },
      {
        title: currentStage,
        desc:
          application.status === 'PENDING_DOCUMENTS'
            ? 'Additional documents or corrections are needed before processing can continue.'
            : application.status === 'UNDER_REVIEW'
            ? 'Your application is currently under departmental review.'
            : application.status === 'APPROVED' || application.status === 'COMPLETED'
            ? 'The application has completed review successfully.'
            : application.status === 'REJECTED'
            ? 'The application was reviewed and rejected.'
            : 'The application is progressing through the workflow.',
        time: updatedAt,
        state:
          application.status === 'PENDING_DOCUMENTS'
            ? 'warning'
            : application.status === 'REJECTED'
            ? 'error'
            : 'active',
      },
      {
        title: 'Final Decision',
        desc:
          application.status === 'APPROVED' || application.status === 'COMPLETED'
            ? 'A final decision has been recorded.'
            : 'Awaiting completion of the remaining workflow stages.',
        time: updatedAt,
        state:
          application.status === 'APPROVED' || application.status === 'COMPLETED'
            ? 'done'
            : 'pending',
      },
    ];

    return steps;
  }, [application]);

  return (
    <div className="flex min-h-full items-center justify-center bg-background p-8">
      <div className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-b border-border bg-primary/5 p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Application Status</h2>
              {badge && (
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${badge.classes}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {application?.formData?.serviceName || 'Government Service Application'}
            </p>
            <p className="text-sm text-muted-foreground">
              Tracking Number: {application?.trackingNumber || id}
            </p>
          </div>

          <div className="p-6">
            {isLoading && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                Loading live application status...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {application && (
              <>
                <div className="space-y-6">
                  {timeline.map((step, index) => (
                    <div
                      key={`${step.title}-${index}`}
                      className={`relative pl-8 ${index < timeline.length - 1 ? 'pb-6' : ''} ${
                        step.state === 'done'
                          ? 'border-l-2 border-success'
                          : step.state === 'warning'
                          ? 'border-l-2 border-warning'
                          : step.state === 'error'
                          ? 'border-l-2 border-destructive'
                          : step.state === 'active'
                          ? 'border-l-2 border-primary'
                          : 'border-l-2 border-muted'
                      }`}
                    >
                      <div className="absolute left-0 top-0 -translate-x-1/2">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            step.state === 'done'
                              ? 'bg-success'
                              : step.state === 'warning'
                              ? 'bg-warning'
                              : step.state === 'error'
                              ? 'bg-destructive'
                              : step.state === 'active'
                              ? 'bg-primary'
                              : 'bg-muted'
                          }`}
                        >
                          {step.state === 'done' ? (
                            <CheckCircle className="h-4 w-4 text-success-foreground" />
                          ) : step.state === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                          ) : (
                            <Clock className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="font-semibold">{step.title}</h4>
                          <span className="text-xs text-muted-foreground">{formatDateTime(step.time)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {application.status === 'PENDING_DOCUMENTS' && (
                  <div className="mb-6 mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
                    <div className="mb-3 flex gap-3">
                      <MessageSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
                      <div className="flex-1">
                        <p className="mb-1 text-sm font-medium">Action Required</p>
                        <p className="text-sm text-muted-foreground">
                          The backend indicates this application is waiting on documents or corrections. The dedicated deficiency workflow is the next piece to complete.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/documents/upload?applicationId=${application.id}`)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-warning py-2.5 text-sm font-medium text-warning-foreground hover:bg-warning/90"
                    >
                      <FileText className="h-4 w-4" />
                      Go to Document Upload
                    </button>
                  </div>
                )}

                <div className="mt-8 rounded-lg border border-info/20 bg-info/10 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-info" />
                    <div className="flex-1">
                      <p className="mb-1 text-sm font-medium">Live tracking snapshot</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {formatDateTime(application.submittedAt)}. Last backend update was {formatDateTime(application.updatedAt)}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/applications')}
                    className="flex-1 rounded-lg bg-muted py-3 text-sm font-medium text-foreground hover:bg-muted/80"
                  >
                    Back to History
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-medium hover:bg-accent"
                  >
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
