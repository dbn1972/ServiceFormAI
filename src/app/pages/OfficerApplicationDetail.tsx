import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Download, History, User, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { producerService } from '../services/api/producer.service';

export default function OfficerApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED' | 'PENDING_DOCUMENTS') => {
    if (!id || !application) return;
    setActionLoading(true);
    try {
      await producerService.updateApplicationStatus(id, { status, notes: note || undefined });
      setApplication({ ...application, status });
      setActionSuccess(`Application ${status.toLowerCase()} successfully`);
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
  const trackingNumber = application.trackingNumber ?? application.tracking_number ?? id;
  const status = application.status ?? 'SUBMITTED';

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
              <button
                disabled={actionLoading || status === 'APPROVED'}
                onClick={() => handleStatusUpdate('APPROVED')}
                className="w-full py-3 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Approve Application
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleStatusUpdate('PENDING_DOCUMENTS')}
                className="w-full py-3 bg-warning text-warning-foreground rounded-lg font-medium hover:bg-warning/90 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                Raise Deficiency
              </button>
              <button
                disabled={actionLoading || status === 'REJECTED'}
                onClick={() => handleStatusUpdate('REJECTED')}
                className="w-full py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
                Reject Application
              </button>
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
              <div className="relative pl-6 pb-4 border-l-2 border-muted">
                <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-success" />
                <p className="text-sm font-medium">Application Submitted</p>
                <p className="text-xs text-muted-foreground">
                  Citizen · {application.created_at ? new Date(application.created_at).toLocaleString('en-IN') : '—'}
                </p>
              </div>
              {status !== 'SUBMITTED' && status !== 'PENDING' && (
                <div className="relative pl-6 border-l-2 border-muted">
                  <div className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full ${
                    status === 'APPROVED' || status === 'COMPLETED' ? 'bg-success' :
                    status === 'REJECTED' ? 'bg-destructive' : 'bg-warning'
                  }`} />
                  <p className="text-sm font-medium">Status: {status}</p>
                  <p className="text-xs text-muted-foreground">
                    Officer · {application.updated_at ? new Date(application.updated_at).toLocaleString('en-IN') : '—'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
