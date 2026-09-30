import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  Calendar,
  Bell,
  Wallet,
  Plus,
  Download,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatters } from '../utils/validation';
import { consumerService } from '../services/api/index';
import { useApi } from '../shared/hooks';
import type { Application as ApiApplication } from '../shared/types';

type DashboardApplication = {
  id: string;
  serviceType: string;
  status: 'draft' | 'submitted' | 'under-review' | 'deficiency' | 'approved' | 'rejected';
  submittedDate: string;
  lastUpdated: string;
  documents: any[];
  formData: any;
};

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user, applications, notifications } = useApp();
  const {
    data: remoteApplications,
    loading,
    error,
    execute,
  } = useApi<ApiApplication[]>();
  const [hasAttemptedLiveLoad, setHasAttemptedLiveLoad] = useState(false);

  useEffect(() => {
    const hasAccessToken = !!localStorage.getItem('accessToken');

    if (!user || !hasAccessToken || hasAttemptedLiveLoad) {
      return;
    }

    setHasAttemptedLiveLoad(true);
    void execute(async () => {
      const response = await consumerService.getMyApplications();
      return response.data;
    });
  }, [user, execute, hasAttemptedLiveLoad]);

const liveApplications: DashboardApplication[] = (remoteApplications || []).map((application) => ({
    id: application.trackingNumber || application.id,
    serviceType:
      typeof application.formData?.serviceName === 'string' && application.formData.serviceName
        ? application.formData.serviceName
        : application.currentStage || 'Government Service Application',
    status: mapApiStatusToDashboardStatus(application.status),
    submittedDate: application.submittedAt,
    lastUpdated: application.updatedAt,
    documents: [],
    formData: application.formData,
  }));

  const displayApplications = liveApplications.length > 0
    ? liveApplications
    : applications; // empty array if truly no data

  const statusConfig = {
    draft: { label: 'Draft', color: 'muted', icon: FileText },
    submitted: { label: 'Submitted', color: 'info', icon: Clock },
    'under-review': { label: 'Under Review', color: 'warning', icon: Clock },
    deficiency: { label: 'Action Required', color: 'destructive', icon: AlertTriangle },
    approved: { label: 'Approved', color: 'success', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'destructive', icon: AlertTriangle },
  };

  const stats = {
    active: displayApplications.filter((application) =>
      ['submitted', 'under-review'].includes(application.status)
    ).length,
    approved: displayApplications.filter((application) => application.status === 'approved').length,
    pending: displayApplications.filter((application) => application.status === 'under-review').length,
    actionRequired: displayApplications.filter((application) => application.status === 'deficiency').length,
  };

  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Ananya'}</h1>
            <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your services</p>
          </div>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Apply for Service
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Applications', value: stats.active.toString(), icon: FileText, color: 'primary' },
            { label: 'Approved', value: stats.approved.toString(), icon: CheckCircle, color: 'success' },
            { label: 'Pending Review', value: stats.pending.toString(), icon: Clock, color: 'warning' },
            { label: 'Action Required', value: stats.actionRequired.toString(), icon: AlertTriangle, color: 'destructive' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 bg-${stat.color}/10 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Applications</h2>
                <button className="text-sm text-primary hover:underline">View All</button>
              </div>

              {loading && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  Loading your latest applications from the live backend...
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-foreground">
                  Could not load applications. Please check your connection and try refreshing.
                </div>
              )}

              <div className="space-y-4">
                {!loading && !error && displayApplications.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                    <p className="font-semibold mb-2">No applications yet</p>
                    <p className="text-sm text-muted-foreground">You haven't submitted any applications. Browse services to get started.</p>
                  </div>
                )}
                {displayApplications.map((application) => {
                  const config = statusConfig[application.status];
                  const StatusIcon = config.icon;

                  return (
                    <div key={application.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 bg-${config.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <StatusIcon className={`w-5 h-5 text-${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{application.serviceType}</h3>
                            <p className="text-sm text-muted-foreground mb-2">Application ID: {application.id}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 bg-${config.color}/10 text-${config.color} text-xs font-medium rounded-full`}>
                                {config.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Submitted {formatters.date(application.submittedDate)} • Updated {formatters.date(application.lastUpdated)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>

                      {application.status === 'deficiency' && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <button
                            type="button"
                            onClick={() => navigate(`/applications/${application.id}/history`)}
                            className="w-full py-2 bg-destructive/10 text-destructive rounded-lg font-medium hover:bg-destructive/20 text-sm"
                          >
                            Complete Deficiency
                          </button>
                        </div>
                      )}

                      {application.status === 'approved' && (
                        <div className="mt-3 pt-3 border-t border-border flex gap-2">
                          <button className="flex-1 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 text-sm flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-accent text-sm">
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: FileText, label: 'Track Application', color: 'primary' },
                  { icon: Wallet, label: 'DigiLocker', color: 'success' },
                  { icon: Download, label: 'Download Certificate', color: 'info' },
                  { icon: Calendar, label: 'Book Appointment', color: 'warning' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className={`w-10 h-10 bg-${action.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 text-${action.color}`} />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notifications</h3>
                {unreadNotifications > 0 && (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {unreadNotifications} new
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.read
                        ? 'border-border hover:bg-muted/50'
                        : 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <Bell className={`w-4 h-4 flex-shrink-0 mt-0.5 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {formatters.date(notification.timestamp)}
                    </p>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 text-sm text-primary hover:underline">
                View All Notifications
              </button>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Profile Completion</h3>
                  <p className="text-xs text-muted-foreground">85% complete</p>
                </div>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div className="h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
              </div>

              <ul className="space-y-2 text-sm mb-4">
                <li className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span>Basic info added</span>
                </li>
                <li className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span>DigiLocker linked</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Add bank details</span>
                </li>
              </ul>

              <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                Complete Profile
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Need Help?</h3>
              <div className="space-y-2">
                <button className="w-full py-2 text-left px-3 hover:bg-accent rounded-lg text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>FAQs</span>
                </button>
                <button className="w-full py-2 text-left px-3 hover:bg-accent rounded-lg text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Contact Support</span>
                </button>
                <button className="w-full py-2 text-left px-3 hover:bg-accent rounded-lg text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Tutorial Guide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapApiStatusToDashboardStatus(status: ApiApplication['status']): DashboardApplication['status'] {
  switch (status) {
    case 'DRAFT':
      return 'draft';
    case 'SUBMITTED':
      return 'submitted';
    case 'UNDER_REVIEW':
      return 'under-review';
    case 'PENDING_DOCUMENTS':
      return 'deficiency';
    case 'APPROVED':
    case 'COMPLETED':
      return 'approved';
    case 'REJECTED':
    case 'CANCELLED':
      return 'rejected';
    default:
      return 'submitted';
  }
}
