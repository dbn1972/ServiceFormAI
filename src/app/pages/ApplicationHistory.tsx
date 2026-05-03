import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  XCircle,
} from 'lucide-react';
import { consumerService } from '../services/api/index';
import type { Application } from '../shared/types';

type HistoryStatus = 'approved' | 'pending' | 'rejected' | 'submitted' | 'action-required';

type HistoryApplication = {
  id: string;
  trackingNumber: string;
  service: string;
  status: HistoryStatus;
  submittedDate: string;
  completedDate?: string;
  category: string;
  fee: string;
  raw: Application;
};

const fallbackApplications: HistoryApplication[] = [
  {
    id: 'fallback-1',
    trackingNumber: 'APP-2026-8472',
    service: 'State Merit Scholarship',
    status: 'approved',
    submittedDate: '2026-04-15',
    completedDate: '2026-04-27',
    category: 'Education',
    fee: 'Rs 0',
    raw: {
      id: 'fallback-1',
      serviceId: 'fallback-service',
      consumerUserId: '',
      tenantId: '',
      formData: { serviceName: 'State Merit Scholarship' },
      status: 'APPROVED',
      trackingNumber: 'APP-2026-8472',
      submittedAt: '2026-04-15',
      updatedAt: '2026-04-27',
    },
  },
];

function mapStatus(status: Application['status']): HistoryStatus {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
      return 'approved';
    case 'REJECTED':
    case 'CANCELLED':
      return 'rejected';
    case 'PENDING_DOCUMENTS':
      return 'action-required';
    case 'UNDER_REVIEW':
    case 'SUBMITTED':
    case 'DRAFT':
    default:
      return 'pending';
  }
}

function statusConfig(status: HistoryStatus) {
  switch (status) {
    case 'approved':
      return { label: 'Approved', classes: 'bg-success/10 text-success', icon: CheckCircle };
    case 'rejected':
      return { label: 'Rejected', classes: 'bg-destructive/10 text-destructive', icon: XCircle };
    case 'action-required':
      return { label: 'Action Required', classes: 'bg-warning/10 text-warning', icon: Clock };
    case 'submitted':
      return { label: 'Submitted', classes: 'bg-info/10 text-info', icon: Clock };
    default:
      return { label: 'Pending', classes: 'bg-warning/10 text-warning', icon: Clock };
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export default function ApplicationHistory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | HistoryStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<HistoryApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await consumerService.getMyApplications();

        if (!isMounted) {
          return;
        }

        const normalized = response.data.map<HistoryApplication>((application) => ({
          id: application.id,
          trackingNumber: application.trackingNumber || application.id,
          service:
            typeof application.formData?.serviceName === 'string' && application.formData.serviceName
              ? application.formData.serviceName
              : 'Government Service Application',
          status: mapStatus(application.status),
          submittedDate: application.submittedAt,
          completedDate:
            application.status === 'APPROVED' || application.status === 'COMPLETED'
              ? application.updatedAt
              : undefined,
          category: application.currentStage || 'General',
          fee: 'Not available',
          raw: application,
        }));

        setApplications(normalized);
      } catch (loadError: any) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'Unable to load your applications.');
        setApplications(fallbackApplications);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredApplications = useMemo(
    () =>
      applications
        .filter((app) => filter === 'all' || app.status === filter)
        .filter(
          (app) =>
            searchQuery === '' ||
            app.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.service.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    [applications, filter, searchQuery]
  );

  const stats = [
    { label: 'Total Applications', value: applications.length, icon: FileText },
    { label: 'Approved', value: applications.filter((a) => a.status === 'approved').length, icon: CheckCircle },
    { label: 'Pending', value: applications.filter((a) => a.status === 'pending').length, icon: Clock },
    { label: 'Rejected', value: applications.filter((a) => a.status === 'rejected').length, icon: XCircle },
  ];

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Application History</h1>
          <p className="text-muted-foreground">View and track your submitted service applications.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by tracking number or service name..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-border bg-input-background py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as 'all' | HistoryStatus)}
                className="rounded-lg border border-border bg-input-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="action-required">Action Required</option>
                <option value="rejected">Rejected</option>
              </select>

              <button className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 font-medium text-foreground hover:bg-muted/80">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            Loading your live application history...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-foreground">
            Live history could not be loaded right now. Showing fallback content where available.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tracking Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Current Stage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Submitted</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApplications.map((app) => {
                  const config = statusConfig(app.status);
                  return (
                    <tr key={app.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium">{app.trackingNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{app.service}</p>
                        {app.completedDate && (
                          <p className="mt-1 text-xs text-muted-foreground">Completed: {formatDate(app.completedDate)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {app.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(app.submittedDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${config.classes}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/applications/${app.raw.id}`)}
                            className="rounded-lg p-2 transition-colors hover:bg-muted"
                            title="View status"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {app.status === 'approved' && (
                            <button
                              type="button"
                              className="rounded-lg p-2 transition-colors hover:bg-muted"
                              title="Download"
                            >
                              <Download className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredApplications.length === 0 && !isLoading && (
            <div className="py-16 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">No applications found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or status filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
