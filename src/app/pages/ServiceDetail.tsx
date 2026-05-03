import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  IndianRupee,
  Info,
  Share2,
  Users,
  Wallet,
} from 'lucide-react';
import { consumerService } from '../services/api/index';
import type { ServiceSchemaResponse, TenantService } from '../shared/types';

const fallbackService: TenantService = {
  id: 'fallback-service',
  tenantId: 'fallback-tenant',
  name: 'State Merit Scholarship',
  description:
    'Financial assistance for meritorious students from economically disadvantaged backgrounds pursuing higher education in recognized institutions.',
  category: 'Scholarship',
  formSchema: { title: 'State Merit Scholarship', fields: [] },
  eligibilityRules: [
    'Must be a resident of Maharashtra',
    'Annual family income below Rs 2,50,000',
    'Minimum 60% marks in previous qualifying examination',
    'Age between 16-25 years',
    'Enrolled in a recognized educational institution',
    'Not receiving any other government scholarship',
  ],
  requiredDocuments: [
    { name: 'Aadhaar Card', source: 'DigiLocker', required: true },
    { name: 'Income Certificate', source: 'DigiLocker', required: true },
    { name: 'Mark Sheet (Previous Year)', required: true },
    { name: 'College Bonafide Certificate', required: true },
    { name: 'Bank Passbook (First Page)', required: true },
  ],
  workflowConfig: {
    stages: [
      { id: '1', name: 'Fill Application Form', actions: [], nextStages: ['2'] },
      { id: '2', name: 'Upload Documents', actions: [], nextStages: ['3'] },
      { id: '3', name: 'Review & Submit', actions: [], nextStages: ['4'] },
      { id: '4', name: 'Verification', actions: [], nextStages: ['5'] },
      { id: '5', name: 'Approval & Disbursement', actions: [], nextStages: [] },
    ],
  },
  isPublished: true,
  slaDays: 10,
  fees: 0,
  createdAt: '',
  updatedAt: '',
  tenant: {
    id: 'fallback-tenant',
    name: 'Education Department',
    subdomain: '',
    type: 'DEPARTMENT',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
};

function normalizeEligibility(
  eligibilityRules: TenantService['eligibilityRules']
): string[] {
  if (!eligibilityRules) {
    return [];
  }

  if (Array.isArray(eligibilityRules)) {
    return eligibilityRules.map((rule) => String(rule));
  }

  return Object.entries(eligibilityRules).map(([key, value]) => {
    if (typeof value === 'string') {
      return `${key}: ${value}`;
    }

    return `${key}: ${JSON.stringify(value)}`;
  });
}

function normalizeDocuments(service: TenantService) {
  const requiredDocuments = service.requiredDocuments;
  if (!requiredDocuments || requiredDocuments.length === 0) {
    return [];
  }

  return requiredDocuments.map((item) => {
    if (typeof item === 'string') {
      return {
        name: item,
        source: null as string | null,
        status: 'upload' as 'verified' | 'upload',
      };
    }

    return {
      name: item.name,
      source: item.source || null,
      status: item.source ? 'verified' as const : 'upload' as const,
    };
  });
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<TenantService>(fallbackService);
  const [schema, setSchema] = useState<ServiceSchemaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadServiceDetail() {
      if (!id) {
        setError('Service ID is missing.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [serviceResponse, schemaResponse] = await Promise.all([
          consumerService.getServiceById(id),
          consumerService.getFormSchema(id).catch(() => null),
        ]);

        if (!isMounted) {
          return;
        }

        setService(serviceResponse);
        setSchema(schemaResponse);
      } catch (loadError: any) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'Unable to load service details.');
        setService({
          ...fallbackService,
          id: id || fallbackService.id,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadServiceDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const eligibilityCriteria = useMemo(
    () => {
      const normalized = normalizeEligibility(service.eligibilityRules);
      return normalized.length > 0
        ? normalized
        : normalizeEligibility(fallbackService.eligibilityRules);
    },
    [service.eligibilityRules]
  );

  const requiredDocuments = useMemo(
    () => {
      const normalized = normalizeDocuments(service);
      return normalized.length > 0 ? normalized : normalizeDocuments(fallbackService);
    },
    [service]
  );

  const workflowStages = useMemo(
    () => {
      const stages = service.workflowConfig?.stages || fallbackService.workflowConfig?.stages || [];
      return stages.map((stage, index) => ({
        step: index + 1,
        title: stage.name,
        desc: stage.description || `Stage ${index + 1} in the service workflow`,
      }));
    },
    [service.workflowConfig]
  );

  const formFieldCount = schema?.form_schema?.fields?.length ?? service.formSchema?.fields?.length ?? 0;
  const providerName = service.tenant?.name || 'Government Department';
  const serviceFeeLabel = typeof service.fees === 'number'
    ? service.fees === 0
      ? 'Free'
      : `Rs ${service.fees}`
    : 'Not specified';
  const processingLabel = service.slaDays ? `${service.slaDays} days` : 'Not specified';

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-6 flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  Live service detail
                </span>
                <span className="rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">
                  {service.category || 'Government Service'}
                </span>
              </div>
              <h1 className="mb-4 text-4xl font-bold">{service.name}</h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                {service.description}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border border-border p-3 hover:bg-accent" type="button">
                <Share2 className="h-5 w-5" />
              </button>
              <button className="rounded-lg border border-border p-3 hover:bg-accent" type="button">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              {error} Showing fallback content where possible.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Clock, label: 'Processing Time', value: processingLabel },
              { icon: IndianRupee, label: 'Service Fee', value: serviceFeeLabel },
              { icon: FileText, label: 'Documents', value: `${requiredDocuments.length} required` },
              { icon: Users, label: 'Form Fields', value: `${formFieldCount} fields` },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-lg border border-border bg-white p-4">
                  <Icon className="mb-2 h-5 w-5 text-primary" />
                  <p className="mb-1 text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-semibold">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="mb-4 text-2xl font-bold">Eligibility Criteria</h2>
              <div className="rounded-xl border border-border bg-card p-6">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading eligibility criteria...</p>
                ) : (
                  <ul className="space-y-3">
                    {eligibilityCriteria.map((criteria, index) => (
                      <li key={`${criteria}-${index}`} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold">Required Documents</h2>
              <div className="space-y-3">
                {requiredDocuments.map((doc, index) => (
                  <div
                    key={`${doc.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        doc.status === 'verified' ? 'bg-success/10' : 'bg-muted'
                      }`}>
                        {doc.status === 'verified' ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        {doc.source && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Wallet className="h-3 w-3" />
                            Available from {doc.source}
                          </p>
                        )}
                      </div>
                    </div>
                    {doc.status === 'verified' ? (
                      <span className="rounded-full bg-success/10 px-3 py-1 text-xs text-success">
                        Reusable
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        Upload required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold">Application Process</h2>
              <div className="space-y-3">
                {workflowStages.map((process, index) => (
                  <div key={`${process.title}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {process.step}
                      </div>
                      {index < workflowStages.length - 1 && <div className="mt-2 h-12 w-0.5 bg-border" />}
                    </div>
                    <div className="flex-1 pb-6">
                      <h3 className="mb-1 font-semibold">{process.title}</h3>
                      <p className="text-sm text-muted-foreground">{process.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold">Important Notes</h2>
              <div className="rounded-xl border border-warning/20 bg-warning/10 p-6">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
                  <div className="space-y-2 text-sm">
                    <p>• Live form schema fields available: <strong>{formFieldCount}</strong></p>
                    <p>• Processing target: <strong>{processingLabel}</strong></p>
                    <p>• Provider: <strong>{providerName}</strong></p>
                    <p>• If this service detail API is unavailable, fallback content is shown so the user journey stays navigable.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl bg-primary p-6 text-primary-foreground">
              <h3 className="mb-2 text-xl font-bold">Ready to Apply?</h3>
              <p className="mb-4 text-sm opacity-90">
                This service now uses live backend metadata. The next step is the full application journey wiring.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/applications/new?serviceId=${service.id}`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 font-medium text-primary hover:bg-gray-100"
              >
                Start Application
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Calendar className="h-5 w-5 text-primary" />
                Service Snapshot
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{service.category}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">{providerName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-medium">{serviceFeeLabel}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">SLA</span>
                  <span className="font-medium">{processingLabel}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Info className="h-5 w-5 text-info" />
                Need Help?
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  <strong>Backend schema:</strong><br />
                  {schema ? 'Loaded successfully' : 'Not available right now'}
                </p>
                <p className="text-muted-foreground">
                  <strong>Support:</strong><br />
                  Live support flow is still being connected end to end.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/support')}
                  className="w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-accent"
                >
                  Live Chat Support
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 font-semibold">Provided By</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{providerName}</p>
                  <p className="text-muted-foreground">{service.tenant?.type || 'Government Department'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
