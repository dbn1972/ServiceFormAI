import { SlidersHorizontal, Clock, CheckCircle, Eye, User, Calendar, Search, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { producerService } from '../services/api/producer.service';

export default function OfficerQueue() {
  const [filter, setFilter] = useState('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      producerService.getApplicationsQueue(),
      producerService.getTenantAnalytics(),
    ])
      .then(([queue, analy]) => {
        setApplications(queue?.data ?? []);
        setAnalytics(analy);
      })
      .catch(() => {
        setApplications([]);
        setAnalytics(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (val: number | undefined) => (loading ? '...' : String(val ?? 0));

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Application Queue</h1>
              <p className="text-muted-foreground">Review and process pending applications</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
              <Download className="w-5 h-5" />
              Export Queue
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Applications', value: fmt(analytics?.totalApplications), color: 'primary' },
              { label: 'Pending Review', value: fmt(analytics?.pendingReview), color: 'warning' },
              { label: 'Approved', value: fmt(analytics?.approved), color: 'success' },
              { label: 'Rejected', value: fmt(analytics?.rejected), color: 'info' },
            ].map((stat, index) => (
              <div key={index} className="bg-white border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold text-${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by application ID, name, service..."
                  className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All', count: 24 },
                { id: 'sla-critical', label: 'SLA Critical', count: 5 },
                { id: 'new', label: 'New', count: 8 },
                { id: 'in-review', label: 'In Review', count: 11 },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === f.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Advanced Filters */}
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent">
              <SlidersHorizontal className="w-5 h-5" />
              More Filters
            </button>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select className="px-3 py-1.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option>SLA Deadline (Urgent First)</option>
              <option>Date Submitted (Oldest First)</option>
              <option>Date Submitted (Newest First)</option>
              <option>Service Type</option>
              <option>Priority</option>
            </select>
          </div>
        </div>

        {/* Queue List */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">
              Loading applications...
            </div>
          )}
          {!loading && applications.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Queue is empty</p>
              <p className="text-muted-foreground">No applications are assigned to your queue at this time.</p>
            </div>
          )}
          {applications.map((app: any, index: number) => (
            <div
              key={app.id ?? index}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                {/* Priority Indicator */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-2 h-16 rounded-full bg-warning"></div>
                </div>

                {/* Application Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{app.service_id}</h3>
                        {app.status === 'submitted' && (
                          <span className="px-2 py-0.5 bg-info/10 text-info rounded text-xs font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {app.consumer_id}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '—'}
                        </span>
                        <span className="font-medium text-foreground">ID: {app.tracking_number}</span>
                      </div>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                      <Eye className="w-5 h-5" />
                      Review
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">{app.status}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-auto">
                      <button className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-accent">
                        Assign to Other
                      </button>
                      <button className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-accent">
                        Request Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">Showing 1-5 of 24 applications</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50">
              Previous
            </button>
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  page === 1
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-accent'
                }`}
              >
                {page}
              </button>
            ))}
            <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent">
              Next
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="mt-8 bg-muted border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Bulk Actions</h3>
              <p className="text-sm text-muted-foreground">Select applications to perform bulk operations</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent">
                Bulk Assign
              </button>
              <button className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent">
                Bulk Approve
              </button>
              <button className="px-4 py-2 border border-destructive text-destructive rounded-lg font-medium hover:bg-destructive/10">
                Bulk Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
