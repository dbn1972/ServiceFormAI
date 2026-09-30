import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Plus, Loader2, AlertTriangle, Scale } from 'lucide-react';
import { consumerService, type GrievanceItem } from '../services/api/consumer.service';
import type { Application } from '../shared/types';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: 'Submitted', color: 'text-warning bg-warning/10 border-warning/30' },
  ASSIGNED: { label: 'In Progress', color: 'text-info bg-info/10 border-info/30' },
  REOPENED: { label: 'Reopened', color: 'text-warning bg-warning/10 border-warning/30' },
  RESOLVED: { label: 'Resolved', color: 'text-success bg-success/10 border-success/30' },
  CLOSED: { label: 'Closed', color: 'text-muted-foreground bg-muted border-border' },
};

const normalizeGrievanceStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
    case 'submitted':
      return 'SUBMITTED';
    case 'in_progress':
    case 'assigned':
      return 'ASSIGNED';
    case 'reopened':
      return 'REOPENED';
    case 'resolved':
      return 'RESOLVED';
    case 'closed':
      return 'CLOSED';
    default:
      return status.toUpperCase();
  }
};

export default function GrievanceJourney() {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [category, setCategory] = useState('service_delivery');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([consumerService.getGrievances(), consumerService.getMyApplications({} as any, { page: 1, limit: 100 })])
      .then(([grievanceResponse, applicationResponse]) => {
        setGrievances(grievanceResponse.data);
        setApplications(applicationResponse.data);
      })
      .catch(() => setError('Failed to load grievances and applications'))
      .finally(() => setLoading(false));
  }, []);

  const submitGrievance = async () => {
    if (!applicationId || subject.trim().length < 3 || description.trim().length < 10) {
      toast.error('Select an application and provide a subject and description.');
      return;
    }
    setSubmitting(true);
    try {
      await consumerService.createGrievance({ applicationId, category, subject: subject.trim(), description: description.trim() });
      toast.success('Grievance submitted');
      setShowForm(false);
      setSubject('');
      setDescription('');
      setApplicationId('');
      const response = await consumerService.getGrievances();
      setGrievances(response.data);
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Unable to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'ALL' ? grievances : grievances.filter((g) => normalizeGrievanceStatus(g.status) === filter);

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Grievances</h1>
            <p className="text-muted-foreground">Track and manage your filed grievances</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/appeals')} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              <Scale className="w-4 h-4" /> Appeals
            </button>
            <button
              onClick={() => setShowForm((value) => !value)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              File New
            </button>
          </div>
        </div>

        {showForm && (
          <section className="mb-8 border border-border bg-card rounded-lg p-5 space-y-4" aria-labelledby="new-grievance-heading">
            <h2 id="new-grievance-heading" className="text-lg font-semibold">File a grievance</h2>
            <label className="block text-sm font-medium">
              Application
              <select value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-input-background px-3 py-2">
                <option value="">Select an application</option>
                {applications.filter((application) => application.status !== 'DRAFT').map((application) => (
                  <option key={application.id} value={application.id}>{application.trackingNumber} · {application.service?.name || application.formData?.serviceName || application.serviceId}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-input-background px-3 py-2">
                <option value="service_delivery">Service delivery</option>
                <option value="delay">Processing delay</option>
                <option value="conduct">Staff conduct</option>
                <option value="technical">Technical issue</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block text-sm font-medium">Subject
              <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={255} className="mt-1 block w-full rounded-md border border-border bg-input-background px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={5000} rows={4} className="mt-1 block w-full rounded-md border border-border bg-input-background px-3 py-2" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border border-border rounded-md text-sm">Cancel</button>
              <button type="button" disabled={submitting} onClick={() => void submitGrievance()} className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit grievance'}</button>
            </div>
          </section>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const count = grievances.filter((g) => normalizeGrievanceStatus(g.status) === status).length;
            return (
              <div key={status} className="bg-card border border-border rounded-xl p-4">
                <p className="text-2xl font-bold mb-1">{count}</p>
                <p className="text-sm text-muted-foreground">{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {['ALL', 'SUBMITTED', 'ASSIGNED', 'REOPENED', 'RESOLVED', 'CLOSED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                filter === s ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'ALL' ? 'All' : (STATUS_CONFIG[s]?.label || s)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No grievances found</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              File a Grievance
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((g) => {
              const status = normalizeGrievanceStatus(g.status);
              const cfg = STATUS_CONFIG[status] ?? { label: g.status, color: 'text-muted-foreground bg-muted border-border' };
              return (
                <div
                  key={g.id}
                  onClick={() => navigate(`/grievances/${g.id}`)}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{g.subject}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{g.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(g.created_at).toLocaleDateString('en-IN')}
                        </span>
                        {g.comments && g.comments.length > 0 && (
                          <span>{g.comments.length} comment{g.comments.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    {status === 'RESOLVED' && <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
