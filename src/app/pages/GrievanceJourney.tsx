import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { consumerService, type GrievanceItem } from '../services/api/consumer.service';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: 'text-warning bg-warning/10 border-warning/30' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-info bg-info/10 border-info/30' },
  RESOLVED: { label: 'Resolved', color: 'text-success bg-success/10 border-success/30' },
  CLOSED: { label: 'Closed', color: 'text-muted-foreground bg-muted border-border' },
};

export default function GrievanceJourney() {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    consumerService.getGrievances()
      .then((res) => setGrievances(res.data))
      .catch(() => setError('Failed to load grievances'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? grievances : grievances.filter((g) => g.status === filter);

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Grievances</h1>
            <p className="text-muted-foreground">Track and manage your filed grievances</p>
          </div>
          <button
            onClick={() => navigate('/grievances/new')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            File New
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const count = grievances.filter((g) => g.status === status).length;
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
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
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
              onClick={() => navigate('/grievances/new')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              File a Grievance
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((g) => {
              const cfg = STATUS_CONFIG[g.status] ?? { label: g.status, color: 'text-muted-foreground bg-muted border-border' };
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
                    {g.status === 'RESOLVED' && <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />}
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
