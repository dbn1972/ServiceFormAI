import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Home,
  Share2,
} from 'lucide-react';
import { consumerService } from '../services/api/index';
import type { Application, TenantService } from '../shared/types';

interface ConfirmationState {
  application?: Application;
  service?: TenantService;
}

export default function ApplicationConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as ConfirmationState;

  const [application, setApplication] = useState<Application | null>(state.application || null);
  const [service] = useState<TenantService | null>(state.service || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFallback() {
      if (!id || application) {
        return;
      }

      try {
        const applicationResponse = await consumerService.getApplicationById(id);
        if (!isMounted) {
          return;
        }
        setApplication(applicationResponse);
      } catch (loadError: any) {
        if (!isMounted) {
          return;
        }
        setError(loadError.message || 'Unable to load confirmation details.');
      }
    }

    void loadFallback();

    return () => {
      isMounted = false;
    };
  }, [application, id]);

  const referenceNumber = application?.trackingNumber || id || 'Pending';
  const serviceName =
    service?.name ||
    application?.formData?.serviceName ||
    'Service Application';
  const providerName = service?.tenant?.name || 'Government Department';
  const submittedDate = application?.submittedAt
    ? new Date(application.submittedAt).toLocaleDateString()
    : new Date().toLocaleDateString();
  const documentCount = Array.isArray(application?.formData?.selectedDocuments)
    ? application?.formData.selectedDocuments.length
    : 0;

  return (
    <div className="flex min-h-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <h1 className="mb-3 text-4xl font-bold">Application Submitted Successfully!</h1>
          <p className="text-lg text-muted-foreground">
            Your application has been received and is now under review.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-border bg-card p-8">
          <div className="mb-6 flex items-start justify-between border-b border-border pb-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold">{serviceName}</h2>
              <p className="text-muted-foreground">{providerName}</p>
            </div>
            <span className="rounded-full bg-warning/10 px-4 py-2 text-sm font-medium text-warning">
              {application?.status ? application.status.replace(/_/g, ' ') : 'Under Review'}
            </span>
          </div>

          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-6">
            <p className="mb-1 text-sm text-muted-foreground">Application Reference Number</p>
            <p className="mb-3 text-3xl font-bold text-primary">{referenceNumber}</p>
            <p className="text-xs text-muted-foreground">
              Save this number for tracking your application status.
            </p>
          </div>

          <div className="mb-6 space-y-4">
            <h3 className="font-semibold">What Happens Next?</h3>
            {[
              { title: 'Application Received', desc: 'Your application has been recorded successfully.', time: 'Now' },
              { title: 'Document Verification', desc: 'Reusable and uploaded documents will be checked.', time: '1-3 days' },
              { title: 'Workflow Processing', desc: 'The service workflow will progress through department stages.', time: '3-7 days' },
              { title: 'Final Decision', desc: 'You will receive status updates in your dashboard.', time: service?.slaDays ? `${service.slaDays} days SLA` : 'As per department SLA' },
            ].map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                    {index + 1}
                  </div>
                  {index < 3 && <div className="mt-2 h-10 w-0.5 bg-border" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{step.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="text-center">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="mb-1 text-sm text-muted-foreground">Submitted On</p>
              <p className="font-semibold">{submittedDate}</p>
            </div>
            <div className="text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-success" />
              <p className="mb-1 text-sm text-muted-foreground">Selected Docs</p>
              <p className="font-semibold">{documentCount}</p>
            </div>
            <div className="text-center">
              <Bell className="mx-auto mb-2 h-6 w-6 text-info" />
              <p className="mb-1 text-sm text-muted-foreground">Status</p>
              <p className="font-semibold">
                {application?.status ? application.status.replace(/_/g, ' ') : 'Submitted'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <button className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90">
            <Download className="h-5 w-5" />
            Download Receipt
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 font-medium hover:bg-accent">
            <Share2 className="h-5 w-5" />
            Share Application
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 font-medium hover:bg-accent">
            <Bell className="h-5 w-5" />
            Set Reminders
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-info/20 bg-info/10 p-6">
          <div className="flex items-start gap-4">
            <Bell className="mt-0.5 h-6 w-6 flex-shrink-0 text-info" />
            <div className="flex-1">
              <h3 className="mb-2 font-semibold">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                You can follow this application in your dashboard and status view. Notification preferences can be refined later.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card py-4 font-medium hover:bg-accent"
          >
            <Home className="h-5 w-5" />
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate(`/applications/${application?.id || id}`)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted py-4 font-medium hover:bg-muted/80"
          >
            View Status
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
