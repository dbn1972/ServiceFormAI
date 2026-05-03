import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Calendar, Clock, CheckCircle, MessageSquare, Send, Loader2, AlertTriangle } from 'lucide-react';
import { consumerService, type GrievanceItem } from '../services/api/consumer.service';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-warning/10 text-warning border-warning/30',
  IN_PROGRESS: 'bg-info/10 text-info border-info/30',
  RESOLVED: 'bg-success/10 text-success border-success/30',
  CLOSED: 'bg-muted text-muted-foreground border-border',
};

export default function GrievanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [grievance, setGrievance] = useState<GrievanceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    consumerService.getGrievanceById(id)
      .then(setGrievance)
      .catch(() => setError('Grievance not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !comment.trim()) return;
    setSubmitting(true);
    try {
      await consumerService.addGrievanceComment(id, comment.trim());
      setComment('');
      const updated = await consumerService.getGrievanceById(id);
      setGrievance(updated);
    } catch {
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !grievance) {
    return (
      <div className="min-h-full bg-muted/30">
        <div className="bg-card border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <button onClick={() => navigate('/grievances')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'Grievance not found'}</p>
        </div>
      </div>
    );
  }

  const statusClass = STATUS_COLORS[grievance.status] || STATUS_COLORS.OPEN;

  return (
    <div className="min-h-full bg-muted/30">
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button onClick={() => navigate('/grievances')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back to Grievances</span>
          </button>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-warning" />
                <h1 className="text-2xl font-bold">{grievance.subject}</h1>
              </div>
              <p className="text-sm text-muted-foreground">ID: {grievance.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusClass}`}>
              {grievance.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{grievance.description}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({grievance.comments?.length || 0})
            </h3>
            {grievance.comments && grievance.comments.length > 0 ? (
              <div className="space-y-4 mb-6">
                {grievance.comments.map((c) => (
                  <div key={c.id} className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm mb-1">{c.text}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-6">No comments yet.</p>
            )}
            {grievance.status !== 'CLOSED' && grievance.status !== 'RESOLVED' && (
              <form onSubmit={handleSubmitComment} className="flex gap-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="flex-1 px-3 py-2 bg-input-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2 self-end disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Filed</p>
                  <p>{new Date(grievance.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Status</p>
                  <p>{grievance.status.replace('_', ' ')}</p>
                </div>
              </div>
              {grievance.status === 'RESOLVED' && (
                <div className="flex items-center gap-3 text-success">
                  <CheckCircle className="w-4 h-4" /><p className="font-medium">Resolved</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
