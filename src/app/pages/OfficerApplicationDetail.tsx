import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Download, History, User, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { producerService } from '../services/api/producer.service';
import { useApp } from '../context/AppContext';

export default function OfficerApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    producerService.getApplicationById(id)
      .then((data) => setApplication(data))
      .catch((err) => setError(err?.message ?? 'Failed to load application'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWorkflowAction = async (action: string) => {
    if (!id || !application) return;
    setActionLoading(true);
    try {
      const status = action === 'approve'
        ? 'APPROVED'
        : action === 'reject'
          ? 'REJECTED'
          : action === 'raise_deficiency'
            ? 'PENDING_DOCUMENTS'
            : 'UNDER_REVIEW';
      await producerService.updateApplicationStatus(id, {
        status,
        action,
        notes: note || undefined,
      });
      const refreshed = await producerService.getApplicationById(id);
      setApplication(refreshed);
      setActionSuccess(`Workflow action "${action.replace(/_/g, ' ')}" completed`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-full flex items-center justify-center flex-col gap-4">
        <AlertTriangle className="w-12 h-12 text-warning" />
        <p className="text-lg font-medium">{error ?? 'Application not found'}</p>
        <button
          onClick={() => navigate('/officer/queue')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </button>
      </div>
    );
  }

  const formData = application.formData ?? application.form_data ?? {};
  const eligibilityResult = application.eligibility_result ?? application.eligibilityResult;
  const trackingNumber = application.trackingNumber ?? application.tracking_number ?? id;
  const status = application.status ?? 'SUBMITTED';
  const history = application.status_history ?? application.statusHistory ?? [];
  const deficiencies = application.deficiencies ?? [];
  const canMakeFinalDecision = user?.role === 'admin' || user?.role === 'approver';
  const workflowStages = application.workflow_config?.stages ?? application.workflowConfig?.stages ?? [];
  const stageKey = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const currentWorkflowStage = workflowStages.find((stage: any) =>
    stageKey(stage.id || '') === stageKey(application.current_stage || '')
      || stageKey(stage.name || '') === stageKey(application.current_stage || ''),
  );
  const availableActions: string[] = currentWorkflowStage?.actions ?? [];
  const actionLabels: Record<string, string> = {
    forward: 'Forward to next stage',
    verify_documents: 'Mark documents verified',
    record_verification: 'Record field verification',
    recommend: 'Recommend for decision',
    approve: 'Approve application',
    raise_deficiency: 'Raise deficiency',
    reject: 'Reject application',
  };

  return (
    <div className="min-h-full bg-muted/30">
      {/* Back navigation */}
      <div className="bg-card border-b border-border px-6 py-3">
        <button
          onClick={() => navigate('/officer/queue')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </button>
      </div>

      {actionSuccess && (
        <div className="mx-6 mt-4 p-3 bg-success/10 border border-success/30 rounded-lg text-sm text-success font-medium">
          {actionSuccess}
        </div>
      )}

      <div className="flex h-[calc(100vh-112px)]">
        {/* Left Panel - Application Data */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-card border-b border-border p-6 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {formData.serviceName ?? 'Application Review'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Application ID: {trackingNumber}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${status === 'APPROVED' || status === 'COMPLETED' ? 'bg-success/10 text-success' :
                    status === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'}`}>
                  {status}
                </span>
                <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>

            {application.sla_days && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                <p className="text-sm font-medium">SLA: {application.sla_days} days</p>
              </div>
            )}
          </div>

          {/* Form Data */}
          <div className="p-6 space-y-6">
            {eligibilityResult && (
              <section className="bg-card border border-border rounded-xl p-6" aria-labelledby="eligibility-review-title">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 id="eligibility-review-title" className="font-semibold">Eligibility checks</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Preliminary result: {String(eligibilityResult.outcome || 'review_required').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="rounded border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                    Human decision required
                  </span>
                </div>
                {Array.isArray(eligibilityResult.results) && eligibilityResult.results.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {eligibilityResult.results.map((result: any, index: number) => (
                      <li key={result.ruleId || index} className="flex items-start justify-between gap-4 border-t border-border pt-2 text-sm">
                        <span>{result.explanation || 'This condition requires officer review.'}</span>
                        <span className="shrink-0 text-xs font-medium capitalize text-muted-foreground">
                          {String(result.verdict || 'review').replace(/_/g, ' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {formData.name ?? formData.fullName ?? 'Applicant'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Consumer ID: {application.consumer_id ?? application.consumerId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(formData)
                  .filter(([key]) => !['serviceName'].includes(key))
                  .slice(0, 12)
                  .map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <p className="text-sm">{String(value ?? '—')}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Submitted At */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{application.created_at ? new Date(application.created_at).toLocaleDateString('en-IN') : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{application.updated_at ? new Date(application.updated_at).toLocaleDateString('en-IN') : '—'}</span>
                </div>
                {application.assigned_to && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To</span>
                    <span className="font-mono text-xs">{application.assigned_to}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Actions */}
        <div className="w-96 bg-card border-l border-border overflow-y-auto">
          <div className="border-b border-border p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {availableActions
                .filter((action) => !['approve', 'reject'].includes(action) || canMakeFinalDecision)
                .map((action) => (
                  <button
                    key={action}
                    disabled={actionLoading}
                    onClick={() => handleWorkflowAction(action)}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${
                      action === 'approve'
                        ? 'bg-success text-success-foreground hover:bg-success/90'
                        : action === 'reject'
                          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          : action === 'raise_deficiency'
                            ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {actionLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : action === 'approve'
                        ? <CheckCircle className="w-5 h-5" />
                        : action === 'reject'
                          ? <XCircle className="w-5 h-5" />
                          : action === 'raise_deficiency'
                            ? <AlertTriangle className="w-5 h-5" />
                            : <CheckCircle className="w-5 h-5" />}
                    {actionLabels[action] ?? action.replace(/_/g, ' ')}
                  </button>
                ))}
              {availableActions.length === 0 && (
                <p className="text-sm text-muted-foreground">No staff actions are configured for this stage.</p>
              )}
            </div>
          </div>

          <div className="border-b border-border p-6">
            <h3 className="font-semibold mb-4">Officer Notes</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add internal notes..."
              className="w-full px-3 py-2 bg-input-background border border-border rounded-lg resize-none text-sm"
              rows={4}
            />
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Activity Timeline</h3>
            </div>
            <div className="space-y-4">
              {history.length > 0 ? history.map((entry: any, index: number) => (
                <div key={entry.id || `${entry.to_status || status}-${index}`} className="relative pl-6 border-l-2 border-muted">
                  <div className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full ${
                    String(entry.to_status || status).toUpperCase() === 'APPROVED' || String(entry.to_status || status).toUpperCase() === 'COMPLETED' ? 'bg-success' :
                    String(entry.to_status || status).toUpperCase() === 'REJECTED' ? 'bg-destructive' :
                    String(entry.to_status || status).toUpperCase() === 'PENDING_DOCUMENTS' ? 'bg-warning' : 'bg-primary'
                  }`} />
                  <p className="text-sm font-medium">{entry.title || entry.event_type || 'Status update'}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.notes || entry.stage || entry.to_status || 'Updated'} · {entry.created_at ? new Date(entry.created_at).toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              )) : (
                <div className="relative pl-6 pb-4 border-l-2 border-muted">
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-success" />
                  <p className="text-sm font-medium">Application Submitted</p>
                  <p className="text-xs text-muted-foreground">
                    Citizen · {application.created_at ? new Date(application.created_at).toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              )}
              {deficiencies.length > 0 && deficiencies.map((deficiency: any) => (
                <div key={deficiency.id} className="relative pl-6 border-l-2 border-warning">
                  <div className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full ${deficiency.status === 'resolved' ? 'bg-success' : 'bg-warning'}`} />
                  <p className="text-sm font-medium">{deficiency.title || 'Deficiency'}</p>
                  <p className="text-xs text-muted-foreground">
                    {deficiency.description || 'Additional documents required'} · {deficiency.created_at ? new Date(deficiency.created_at).toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
