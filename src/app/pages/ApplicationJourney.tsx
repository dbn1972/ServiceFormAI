import { useEffect, useMemo, useRef, useState } from 'react';
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
import { resolveVisibility, validate as validateWholeForm, validateField as validateSingleField } from '@serviceformai/validation-engine';
import { useApp } from '../context/AppContext';
import type { FormField, ServiceSchemaResponse, TenantService } from '../shared/types';

type JourneyStep = string;

type JourneySection = {
  id: string;
  title: string;
  description?: string;
  fieldIds: string[];
};

function getStepLabel(step: JourneyStep, sections: JourneySection[]) {
  if (step === 'intro') {
    return 'Service Intro';
  }

  if (step === 'documents') {
    return 'Document Reuse';
  }

  if (step === 'review') {
    return 'Review & Submit';
  }

  const section = sections.find((item) => item.id === step);
  return section?.title || 'Application Form';
}

function normalizeDocuments(service: TenantService) {
  const manifestDocuments = service.manifest?.requiredDocuments;
  if (Array.isArray(manifestDocuments) && manifestDocuments.length > 0) {
    return manifestDocuments.map((doc) => ({
      name: doc.name,
      source: Array.isArray(doc.digilockerTypes) && doc.digilockerTypes.length > 0 ? 'DigiLocker' : null,
      reusable: Array.isArray(doc.acceptedSources) ? doc.acceptedSources.includes('digilocker') : false,
      required: Boolean(doc.required),
    }));
  }

  const docs = service.requiredDocuments || [];
  return docs.map((doc) => {
    if (typeof doc === 'string') {
      return {
        name: doc,
        source: null as string | null,
        reusable: false,
        required: true,
      };
    }

    return {
      name: doc.name,
      source: doc.source || null,
      reusable: Boolean(doc.source),
      required: Boolean(doc.required),
    };
  });
}

function getManifestFields(service: TenantService): FormField[] {
  const manifestFields = service.manifest?.service?.formSchema?.fields;
  if (!Array.isArray(manifestFields)) {
    return [];
  }

  return manifestFields.map((field) => ({
    id: String(field.id),
    name: String(field.name || field.id),
    type: (field.type as FormField['type']) || 'text',
    label: String(field.label || field.name || field.id),
    required: Boolean(field.required),
    placeholder: typeof field.placeholder === 'string' ? field.placeholder : undefined,
    helpText: typeof field.helpText === 'string' ? field.helpText : undefined,
    options: Array.isArray(field.options)
      ? field.options.map((option: any) => ({ label: String(option.label), value: String(option.value) }))
      : undefined,
  }));
}

function getJourneySections(service: TenantService | null, schema: ServiceSchemaResponse | null, fields: FormField[]): JourneySection[] {
  const schemaSections = schema?.form_schema.sections;
  if (Array.isArray(schemaSections) && schemaSections.length > 0) {
    return schemaSections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      fieldIds: section.fields,
    }));
  }

  const manifestSections = service?.manifest?.service?.formSchema?.sections;
  if (Array.isArray(manifestSections) && manifestSections.length > 0) {
    return manifestSections.map((section: any) => ({
      id: String(section.id),
      title: String(section.title),
      description: typeof section.description === 'string' ? section.description : undefined,
      fieldIds: Array.isArray(section.fieldIds) ? section.fieldIds.map((item: any) => String(item)) : [],
    }));
  }

  if (fields.length > 0) {
    return [{
      id: 'application-form',
      title: 'Application Form',
      fieldIds: fields.map((field) => field.id),
    }];
  }

  return [];
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
  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedDocs, setSelectedDocs] = useState<Record<string, boolean>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, { fileName: string; documentId: string }>>({});
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSavedDraftRef = useRef<string | null>(null);
  const draftSaveSequenceRef = useRef(0);

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

        let savedDraft: Awaited<ReturnType<typeof consumerService.getServiceDraft>> | null = null;
        try {
          savedDraft = await consumerService.getServiceDraft(serviceId);
        } catch (draftError) {
          const message = draftError instanceof Error ? draftError.message : '';
          if (!message.includes('404')) throw draftError;
        }

        const initialDocs = normalizeDocuments(serviceResponse).reduce<Record<string, boolean>>(
          (acc, doc) => {
            acc[doc.name] = false;
            return acc;
          },
          {}
        );

        const restoredDocuments = savedDraft
          ? await consumerService.getApplicationDocuments(savedDraft.application_id).catch(() => [])
          : [];
        const restoredSelectedDocs = { ...initialDocs };
        const restoredUploads: Record<string, { fileName: string; documentId: string }> = {};
        for (const document of restoredDocuments) {
          restoredSelectedDocs[document.documentType] = true;
          restoredUploads[document.documentType] = {
            fileName: document.fileName,
            documentId: document.documentId,
          };
        }

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
        setSelectedDocs(restoredSelectedDocs);
        setUploadedDocuments(restoredUploads);
        setFormData(savedDraft ? { ...initialFormData, ...savedDraft.form_data } : initialFormData);
        setDraftApplicationId(savedDraft?.application_id ?? null);
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

  useEffect(() => {
    if (isLoading || !serviceId || !schema) return;
    const payload = {
      ...formData,
      selectedDocuments: Object.entries(selectedDocs)
        .filter(([, attached]) => attached)
        .map(([name]) => name),
    };
    const serialized = JSON.stringify(payload);
    if (lastSavedDraftRef.current === serialized) return;

    let active = true;
    const sequence = ++draftSaveSequenceRef.current;
    const timer = window.setTimeout(async () => {
      setDraftSaveStatus('saving');
      try {
        const saved = await consumerService.saveServiceDraft(serviceId, {
          formData: payload,
          applicationId: draftApplicationId ?? undefined,
          schemaVersion: schema.schema_version,
        });
        if (!active || sequence !== draftSaveSequenceRef.current) return;
        lastSavedDraftRef.current = serialized;
        setDraftApplicationId(saved.application_id);
        setDraftSaveStatus('saved');
        setError(null);
      } catch (saveError) {
        if (!active || sequence !== draftSaveSequenceRef.current) return;
        setDraftSaveStatus('error');
        setError(saveError instanceof Error ? `Draft not saved: ${saveError.message}` : 'Draft not saved. Check your connection.');
      }
    }, 700);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draftApplicationId, formData, isLoading, schema, selectedDocs, serviceId]);

  const documents = useMemo(
    () => (service ? normalizeDocuments(service) : []),
    [service]
  );

  const fields = schema?.form_schema.fields?.length
    ? schema.form_schema.fields
    : service
      ? getManifestFields(service)
      : [];
  const manifestMappings = service?.manifest?.digilockerMappings || [];
  const supportedLanguages = service?.manifest?.localization?.supportedLanguages || [];
  const manifestServiceType = service?.manifest?.serviceType;
  const sections = useMemo(() => getJourneySections(service, schema, fields), [service, schema, fields]);
  const stepOrder = useMemo<JourneyStep[]>(() => ['intro', 'documents', ...sections.map((section) => section.id), 'review'], [sections]);
  const currentIndex = stepOrder.indexOf(step);
  const activeSection = sections.find((section) => section.id === step) || null;
  const activeFields = activeSection
    ? fields.filter((field) => activeSection.fieldIds.includes(field.id))
    : fields;

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

  async function uploadApplicationDocument(name: string, file?: File) {
    if (!serviceId || !file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Each document must be smaller than 10 MB.');
      return;
    }

    setUploadingDocument(name);
    setError(null);
    try {
      const selectedDocuments = Object.entries(selectedDocs)
        .filter(([, attached]) => attached)
        .map(([documentName]) => documentName);
      const savedDraft = await consumerService.saveServiceDraft(serviceId, {
        formData: { ...formData, selectedDocuments },
        applicationId: draftApplicationId ?? undefined,
        schemaVersion: schema?.schema_version ?? 1,
      });
      setDraftApplicationId(savedDraft.application_id);
      const uploaded = await consumerService.uploadApplicationDocument(savedDraft.application_id, name, file);
      setUploadedDocuments((prev) => ({
        ...prev,
        [name]: { fileName: uploaded.fileName, documentId: uploaded.documentId },
      }));
      setSelectedDocs((prev) => ({ ...prev, [name]: true }));
      lastSavedDraftRef.current = null;
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload the document.');
    } finally {
      setUploadingDocument(null);
    }
  }

  function validateForm(fieldIds?: string[]) {
    const nextErrors: Record<string, string> = {};
    if (!schema) return false;
    if (!fieldIds) {
      const validation = validateWholeForm(schema.form_schema as any, formData);
      for (const [fieldId, fieldErrors] of Object.entries(validation.errors)) {
        nextErrors[fieldId] = fieldErrors.map((item: any) => item.message).join(' ');
      }
    } else {
      const visibility = resolveVisibility(schema.form_schema.fields as any, formData);
      for (const field of fields.filter((item) => fieldIds.includes(item.id))) {
        if (visibility.get(field.id) === false) continue;
        const fieldErrors = validateSingleField(field as any, formData[field.id]);
        if (fieldErrors.length) nextErrors[field.id] = fieldErrors.map((item: any) => item.message).join(' ');
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (activeSection && !validateForm(activeSection.fieldIds)) {
      return;
    }
    if (step === 'documents') {
      const missingDocuments = documents.filter((doc) => doc.required && !uploadedDocuments[doc.name]);
      if (missingDocuments.length) {
        setError(`Upload required evidence: ${missingDocuments.map((document) => document.name).join(', ')}`);
        return;
      }
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
      setStep(sections[0]?.id ?? 'review');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedDocuments = Object.entries(selectedDocs)
        .filter(([, attached]) => attached)
        .map(([name]) => name);
      const finalFormData = { ...formData, selectedDocuments };
      const savedDraft = await consumerService.saveServiceDraft(serviceId, {
        formData: finalFormData,
        applicationId: draftApplicationId ?? undefined,
        schemaVersion: schema?.schema_version ?? 1,
      });
      setDraftApplicationId(savedDraft.application_id);

      const application = await consumerService.submitApplication({
        serviceId,
        applicationId: savedDraft.application_id,
        schemaVersion: savedDraft.schema_version,
        formData: finalFormData,
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
      lastSavedDraftRef.current = null;

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
          Upload this evidence in the Documents step before submitting the application.
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
                        {getStepLabel(stepName, sections)}
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

              {draftSaveStatus !== 'idle' && (
                <p className={`mb-4 text-xs ${draftSaveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} role="status">
                  {draftSaveStatus === 'saving' ? 'Saving draft…' : draftSaveStatus === 'saved' ? 'Draft saved securely' : 'Draft save failed'}
                </p>
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
                          <li>• Form fields to complete: {fields.length}</li>
                          {manifestServiceType && <li>• Service type: {manifestServiceType}</li>}
                          {supportedLanguages.length > 0 && <li>• Languages supported: {supportedLanguages.join(', ')}</li>}
                        </ul>
                      </div>

                      {manifestMappings.length > 0 && (
                        <div className="rounded-xl border border-success/20 bg-success/5 p-5">
                          <h3 className="mb-2 font-semibold">Prefill preview</h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {manifestMappings.map((mapping: any) => (
                              <p key={mapping.fieldId}>• {mapping.fieldId} can be prefilled from {mapping.source}</p>
                            ))}
                          </div>
                        </div>
                      )}

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
                                attached ? 'border-success/30 bg-success/5' : 'border-border bg-card'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${attached ? 'bg-success/10' : 'bg-muted'}`}>
                                  {attached ? (
                                    <FileText className="h-6 w-6 text-success" />
                                  ) : (
                                    <AlertCircle className="h-6 w-6 text-warning" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    <h4 className="font-semibold">{doc.name}{doc.required && <span className="text-destructive"> *</span>}</h4>
                                    {doc.reusable && <Shield className="h-4 w-4 text-success" />}
                                  </div>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    {doc.source ? <p>{doc.source} reuse is not linked yet; upload a copy to attach it.</p> : <p>Upload a PDF or image for this application.</p>}
                                    {uploadedDocuments[doc.name] && <p>Attached: {uploadedDocuments[doc.name].fileName}</p>}
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                      {uploadingDocument === doc.name ? 'Uploading…' : attached ? 'Replace file' : 'Upload file'}
                                      <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        disabled={uploadingDocument !== null}
                                        className="sr-only"
                                        onChange={(event) => {
                                          const file = event.target.files?.[0];
                                          event.target.value = '';
                                          void uploadApplicationDocument(doc.name, file);
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      <div className="rounded-lg border border-info/20 bg-info/10 p-4">
                        <p className="text-sm text-muted-foreground">
                          <strong className="text-foreground">Document privacy:</strong> files are uploaded to private storage and linked to this saved application draft.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection && (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-border bg-muted/20 p-5">
                        <h3 className="mb-2 font-semibold">{activeSection.title}</h3>
                        {activeSection.description && (
                          <p className="text-sm text-muted-foreground">{activeSection.description}</p>
                        )}
                      </div>

                      {fields.length === 0 ? (
                        <div className="rounded-xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                          This service does not expose form fields yet.
                        </div>
                      ) : (
                        activeFields.map((field) => (
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

                      <div className="rounded-xl border border-border p-5">
                        <h3 className="mb-4 font-semibold">Manifest summary</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>Workflow stages: {service.manifest?.workflow?.stages?.length || service.workflowConfig?.stages?.length || 0}</p>
                          <p>Reusable document mappings: {documents.filter((doc) => doc.reusable).length}</p>
                          <p>Manifest version: {service.manifest?.manifestVersion || 'Not provided'}</p>
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
