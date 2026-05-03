import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronRight,
  FileText,
  Shield,
} from 'lucide-react';
import { consumerService } from '../services/api/index';
import { useApp } from '../context/AppContext';
import type { FormField, ServiceSchemaResponse, TenantService } from '../shared/types';

type JourneyStep = 'intro' | 'documents' | 'form' | 'review';

const stepOrder: JourneyStep[] = ['intro', 'documents', 'form', 'review'];

function getStepLabel(step: JourneyStep) {
  switch (step) {
    case 'intro':
      return 'Service Intro';
    case 'documents':
      return 'Document Reuse';
    case 'form':
      return 'Application Form';
    case 'review':
      return 'Review & Submit';
  }
}

function normalizeDocuments(service: TenantService) {
  const docs = service.requiredDocuments || [];
  return docs.map((doc) => {
    if (typeof doc === 'string') {
      return {
        name: doc,
        source: null as string | null,
        reusable: false,
      };
    }

    return {
      name: doc.name,
      source: doc.source || null,
      reusable: Boolean(doc.source),
    };
  });
}

function renderFieldValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Not provided';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }

  return String(value);
}

export default function ApplicationJourney() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addApplication } = useApp();
  const serviceId = searchParams.get('serviceId');

  const [step, setStep] = useState<JourneyStep>('intro');
  const [service, setService] = useState<TenantService | null>(null);
  const [schema, setSchema] = useState<ServiceSchemaResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedDocs, setSelectedDocs] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJourney() {
      if (!serviceId) {
        setError('No service selected. Please return to the service catalog.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [serviceResponse, schemaResponse] = await Promise.all([
          consumerService.getServiceById(serviceId),
          consumerService.getFormSchema(serviceId),
        ]);

        if (!isMounted) {
          return;
        }

        const initialDocs = normalizeDocuments(serviceResponse).reduce<Record<string, boolean>>(
          (acc, doc) => {
            if (doc.reusable) {
              acc[doc.name] = true;
            }
            return acc;
          },
          {}
        );

        const initialFormData = schemaResponse.form_schema.fields.reduce<Record<string, any>>(
          (acc, field) => {
            if (field.defaultValue !== undefined) {
              acc[field.id] = field.defaultValue;
            } else if (field.type === 'checkbox') {
              acc[field.id] = false;
            } else if (field.type === 'select' || field.type === 'radio') {
              acc[field.id] = '';
            } else {
              acc[field.id] = '';
            }
            return acc;
          },
          {}
        );

        setService(serviceResponse);
        setSchema(schemaResponse);
        setSelectedDocs(initialDocs);
        setFormData(initialFormData);
      } catch (loadError: any) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'Unable to load application journey.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadJourney();

    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  const documents = useMemo(
    () => (service ? normalizeDocuments(service) : []),
    [service]
  );

  const fields = schema?.form_schema.fields || [];
  const currentIndex = stepOrder.indexOf(step);

  function updateField(fieldId: string, value: any) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      if (!prev[fieldId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  function toggleDocument(name: string) {
    setSelectedDocs((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      if (!field.required) {
        continue;
      }

      const value = formData[field.id];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (field.type === 'checkbox' && value !== true);

      if (isEmpty) {
        nextErrors[field.id] = `${field.label} is required.`;
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (step === 'form' && !validateForm()) {
      return;
    }

    const nextStep = stepOrder[currentIndex + 1];
    if (nextStep) {
      setStep(nextStep);
    }
  }

  function goBack() {
    const previousStep = stepOrder[currentIndex - 1];
    if (previousStep) {
      setStep(previousStep);
      return;
    }

    navigate(serviceId ? `/services/${serviceId}` : '/services');
  }

  async function handleSubmit() {
    if (!service || !serviceId) {
      return;
    }

    if (!validateForm()) {
      setStep('form');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const application = await consumerService.submitApplication({
        serviceId,
        formData: {
          ...formData,
          selectedDocuments: Object.entries(selectedDocs)
            .filter(([, attached]) => attached)
            .map(([name]) => name),
        },
      });

      addApplication({
        id: application.id,
        serviceType: service.name,
        status: 'submitted',
        submittedDate: application.submittedAt,
        lastUpdated: application.updatedAt,
        documents: Object.entries(selectedDocs)
          .filter(([, attached]) => attached)
          .map(([name]) => ({ name })),
        formData,
      });

      navigate(`/applications/${application.id}/confirmation`, {
        state: {
          application,
          service,
        },
      });
    } catch (submitError: any) {
      setError(submitError.message || 'Unable to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderField(field: FormField) {
    const value = formData[field.id];
    const baseClass =
      'w-full rounded-lg border border-border bg-input-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring';

    if (field.type === 'textarea') {
      return (
        <textarea
          id={field.id}
          value={value || ''}
          placeholder={field.placeholder}
          onChange={(event) => updateField(field.id, event.target.value)}
          className={`${baseClass} min-h-28`}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <select
          id={field.id}
          value={value || ''}
          onChange={(event) => updateField(field.id, event.target.value)}
          className={baseClass}
        >
          <option value="">Select an option</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'radio') {
      return (
        <div className="space-y-2">
          {(field.options || []).map((option) => (
            <label key={option.value} className="flex items-center gap-3 text-sm">
              <input
                type="radio"
                name={field.id}
                checked={value === option.value}
                onChange={() => updateField(field.id, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-3 text-sm">
          <input
            id={field.id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateField(field.id, event.target.checked)}
          />
          <span>{field.helpText || 'I confirm this field.'}</span>
        </label>
      );
    }

    if (field.type === 'file') {
      return (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
          File upload is handled in the document module. Continue with the form and attach documents in the upload step.
        </div>
      );
    }

    const inputType =
      (field.type as string) === 'textarea' || (field.type as string) === 'select' || (field.type as string) === 'radio' || (field.type as string) === 'checkbox' || (field.type as string) === 'file'
        ? 'text'
        : field.type;

    return (
      <input
        id={field.id}
        type={inputType}
        value={value || ''}
        placeholder={field.placeholder}
        onChange={(event) => updateField(field.id, event.target.value)}
        className={baseClass}
      />
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl">
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-2">
              {stepOrder.map((stepName, index) => {
                const status =
                  index < currentIndex ? 'completed' : index === currentIndex ? 'active' : 'pending';

                return (
                  <div key={stepName} className="flex flex-1 items-center">
                    <div className="flex flex-1 flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                          status === 'completed'
                            ? 'bg-success text-success-foreground'
                            : status === 'active'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {status === 'completed' ? <Check className="h-5 w-5" /> : index + 1}
                      </div>
                      <p className={`mt-2 text-center text-xs ${status === 'active' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {getStepLabel(stepName)}
                      </p>
                    </div>
                    {index < stepOrder.length - 1 && (
                      <div
                        className={`-mx-2 mt-[-28px] h-0.5 flex-1 ${
                          index < currentIndex ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <div className="border-b border-border bg-primary/5 p-6">
              <h2 className="mb-2 text-xl font-semibold">
                {service?.name || 'Application Journey'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {service?.description || 'Loading service details...'}
              </p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Loading application journey...
                </div>
              ) : !service || !schema ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Unable to load the selected service.
                </div>
              ) : (
                <>
                  {step === 'intro' && (
                    <div className="space-y-6">
                      <div className="rounded-xl border border-border bg-muted/20 p-5">
                        <h3 className="mb-2 font-semibold">Before you begin</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Provider: {service.tenant?.name || 'Government Department'}</li>
                          <li>• Estimated processing time: {service.slaDays ? `${service.slaDays} days` : 'Not specified'}</li>
                          <li>• Service fee: {typeof service.fees === 'number' ? (service.fees === 0 ? 'Free' : `Rs ${service.fees}`) : 'Not specified'}</li>
                          <li>• Form fields to complete: {schema.form_schema.fields.length}</li>
                        </ul>
                      </div>

                      <div className="rounded-xl border border-success/20 bg-success/5 p-5">
                        <div className="flex gap-3">
                          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                          <div className="text-sm">
                            <p className="font-medium">Eligibility and service metadata loaded successfully.</p>
                            <p className="mt-1 text-muted-foreground">
                              This flow is now using live service and schema data from the backend.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 'documents' && (
                    <div className="space-y-4">
                      {documents.length === 0 ? (
                        <div className="rounded-xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                          No required document metadata is available yet for this service.
                        </div>
                      ) : (
                        documents.map((doc) => {
                          const attached = Boolean(selectedDocs[doc.name]);
                          return (
                            <div
                              key={doc.name}
                              className={`rounded-xl border p-4 ${
                                doc.reusable ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${doc.reusable ? 'bg-success/10' : 'bg-warning/10'}`}>
                                  {doc.reusable ? (
                                    <FileText className="h-6 w-6 text-success" />
                                  ) : (
                                    <AlertCircle className="h-6 w-6 text-warning" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    <h4 className="font-semibold">{doc.name}</h4>
                                    {doc.reusable && <Shield className="h-4 w-4 text-success" />}
                                  </div>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    {doc.source ? <p>Reusable from {doc.source}</p> : <p>Manual upload will still be needed later.</p>}
                                    <p>{attached ? 'Selected for this application' : 'Not selected yet'}</p>
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleDocument(doc.name)}
                                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                        attached
                                          ? 'bg-success text-success-foreground'
                                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                      }`}
                                    >
                                      {attached ? 'Attached' : 'Attach'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      <div className="rounded-lg border border-info/20 bg-info/10 p-4">
                        <p className="text-sm text-muted-foreground">
                          <strong className="text-foreground">Document privacy:</strong> selected reusable documents will be referenced in the submitted form payload. Full document upload workflow is the next module to complete.
                        </p>
                      </div>
                    </div>
                  )}

                  {step === 'form' && (
                    <div className="space-y-5">
                      {fields.length === 0 ? (
                        <div className="rounded-xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                          This service does not expose form fields yet.
                        </div>
                      ) : (
                        fields.map((field) => (
                          <div key={field.id}>
                            <label htmlFor={field.id} className="mb-2 block text-sm font-medium">
                              {field.label} {field.required && <span className="text-destructive">*</span>}
                            </label>
                            {renderField(field)}
                            {field.helpText && (
                              <p className="mt-2 text-xs text-muted-foreground">{field.helpText}</p>
                            )}
                            {fieldErrors[field.id] && (
                              <p className="mt-2 text-xs text-destructive">{fieldErrors[field.id]}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {step === 'review' && (
                    <div className="space-y-6">
                      <div className="rounded-xl border border-border p-5">
                        <h3 className="mb-4 font-semibold">Selected documents</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {Object.entries(selectedDocs).filter(([, attached]) => attached).length === 0 ? (
                            <p>No reusable documents selected yet.</p>
                          ) : (
                            Object.entries(selectedDocs)
                              .filter(([, attached]) => attached)
                              .map(([name]) => <p key={name}>• {name}</p>)
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border p-5">
                        <h3 className="mb-4 font-semibold">Form review</h3>
                        <div className="space-y-3">
                          {fields.map((field) => (
                            <div key={field.id} className="flex items-start justify-between gap-6 border-b border-border/60 pb-3 text-sm last:border-b-0 last:pb-0">
                              <span className="font-medium">{field.label}</span>
                              <span className="text-right text-muted-foreground">{renderFieldValue(formData[field.id])}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 rounded-lg bg-muted py-3 text-sm font-medium text-muted-foreground hover:bg-muted/80"
                    >
                      {currentIndex === 0 ? 'Back to Service' : 'Back'}
                    </button>

                    {step !== 'review' ? (
                      <button
                        type="button"
                        onClick={goNext}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Continue
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
