import {
  AlertCircle,
  CheckCircle,
  FileText,
  RefreshCw,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { consumerService } from '../services/api/index';
import { formatFileSize, validators } from '../utils/validation';
import type { Application } from '../shared/types';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  maxSize: number;
  allowedTypes: string[];
  required: boolean;
  file?: UploadedFile;
}

const initialRequirements: DocumentRequirement[] = [
  {
    id: 'marksheet',
    name: 'Mark Sheet (Previous Year)',
    description: 'Upload your previous year mark sheet or grade card',
    maxSize: 5,
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    required: true,
  },
  {
    id: 'photo',
    name: 'Passport Size Photo',
    description: 'Recent passport size photograph',
    maxSize: 2,
    allowedTypes: ['jpg', 'jpeg', 'png'],
    required: true,
  },
  {
    id: 'caste',
    name: 'Caste Certificate (if applicable)',
    description: 'Valid caste certificate issued by competent authority',
    maxSize: 5,
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    required: false,
  },
];

export default function DocumentUpload() {
  const { digiLockerDocuments } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = searchParams.get('applicationId');
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentRequirement[]>(initialRequirements);
  const [isLoadingApplication, setIsLoadingApplication] = useState(Boolean(applicationId));
  const [submitting, setSubmitting] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadApplication() {
      if (!applicationId) {
        setIsLoadingApplication(false);
        return;
      }

      try {
        const response = await consumerService.getApplicationById(applicationId);
        if (!isMounted) {
          return;
        }
        setApplication(response);
      } catch (error: any) {
        if (!isMounted) {
          return;
        }
        toast.error(error.message || 'Unable to load application context');
      } finally {
        if (isMounted) {
          setIsLoadingApplication(false);
        }
      }
    }

    void loadApplication();

    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  const uploadedCount = documents.filter((document) => document.file?.status === 'success').length;
  const totalRequired = documents.filter((document) => document.required).length;
  const progress = totalRequired === 0 ? 0 : (uploadedCount / totalRequired) * 100;

  const pageTitle = application?.formData?.serviceName
    ? `Upload Documents for ${application.formData.serviceName}`
    : 'Upload Documents';

  const pageDescription = applicationId
    ? `Attach the required files for application ${application?.trackingNumber || applicationId}.`
    : 'Upload required documents for your service application.';

  const autoFetchedDocuments = useMemo(
    () => (digiLockerDocuments.length > 0 ? digiLockerDocuments : [
      { name: 'Aadhaar Card', issuer: 'UIDAI' },
      { name: 'Income Certificate', issuer: 'Revenue Department' },
    ]),
    [digiLockerDocuments]
  );

  async function handleFileSelect(docId: string, event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const document = documents.find((doc) => doc.id === docId);
    if (!document) {
      return;
    }

    const file = files[0]!;
    const validationResult = validators.file(document.maxSize, document.allowedTypes)(files);

    if (validationResult !== true) {
      toast.error(validationResult);
      return;
    }

    if (!applicationId) {
      toast.error('This upload flow needs an application context first.');
      return;
    }

    const tempFile: UploadedFile = {
      id: `${docId}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      status: 'uploading',
    };

    setSubmitting(docId);
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, file: tempFile } : doc))
    );

    try {
      const response = await consumerService.uploadDocument(applicationId, file, docId);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                file: {
                  ...tempFile,
                  id: response.documentId,
                  url: response.url,
                  status: 'success',
                },
              }
            : doc
        )
      );
      toast.success(`${document.name} uploaded successfully.`);
    } catch (error: any) {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                file: {
                  ...tempFile,
                  status: 'error',
                  error: error.message || 'Upload failed',
                },
              }
            : doc
        )
      );
      toast.error(error.message || 'Upload failed');
    } finally {
      setSubmitting(null);
    }
  }

  function handleRemoveFile(docId: string) {
    const document = documents.find((doc) => doc.id === docId);
    if (document?.file?.url.startsWith('blob:')) {
      URL.revokeObjectURL(document.file.url);
    }

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, file: undefined } : doc))
    );

    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId]!.value = '';
    }
  }

  function handleSubmit() {
    const missingRequired = documents.filter(
      (doc) => doc.required && doc.file?.status !== 'success'
    );

    if (missingRequired.length > 0) {
      toast.error(`Please upload all required documents (${missingRequired.length} missing).`);
      return;
    }

    toast.success('All required documents are uploaded.');

    if (applicationId) {
      navigate(`/applications/${applicationId}`);
      return;
    }

    navigate('/applications');
  }

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="mb-2 text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {isLoadingApplication && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            Loading application context...
          </div>
        )}

        {!applicationId && (
          <div className="mb-6 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Open this page from an application status flow to upload against a real application.
          </div>
        )}

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Upload Progress</span>
            <span className="text-muted-foreground">{uploadedCount} of {totalRequired} required uploads completed</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {autoFetchedDocuments.length > 0 && (
          <div className="mb-8 rounded-xl border border-success/20 bg-success/10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-success/20">
                <Wallet className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  Reusable documents detected
                  <CheckCircle className="h-5 w-5 text-success" />
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  These documents are already available and do not need manual upload in this step.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {autoFetchedDocuments.map((doc, index) => (
                    <div key={`${doc.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-success/20 bg-white p-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-success" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.issuer || 'Verified source'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Upload Remaining Documents</h2>

          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`rounded-xl border bg-card p-6 ${
                doc.file?.status === 'success' ? 'border-success/50' : 'border-border'
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex flex-1 items-start gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                    doc.file?.status === 'success'
                      ? 'bg-success/10'
                      : doc.file?.status === 'uploading'
                      ? 'bg-primary/10'
                      : doc.file?.status === 'error'
                      ? 'bg-destructive/10'
                      : 'bg-muted'
                  }`}>
                    {doc.file?.status === 'success' ? (
                      <CheckCircle className="h-6 w-6 text-success" />
                    ) : doc.file?.status === 'error' ? (
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    ) : (
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold">
                      {doc.name}
                      {doc.required && <span className="ml-1 text-destructive">*</span>}
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground">{doc.description}</p>

                    {doc.file ? (
                      <div className={`flex items-center gap-3 rounded-lg border p-3 ${
                        doc.file.status === 'success'
                          ? 'border-success/20 bg-success/5'
                          : doc.file.status === 'uploading'
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-destructive/20 bg-destructive/5'
                      }`}>
                        <FileText className={`h-5 w-5 flex-shrink-0 ${
                          doc.file.status === 'success'
                            ? 'text-success'
                            : doc.file.status === 'uploading'
                            ? 'text-primary'
                            : 'text-destructive'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doc.file.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{formatFileSize(doc.file.size)}</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className={`text-xs ${
                              doc.file.status === 'success'
                                ? 'text-success'
                                : doc.file.status === 'uploading'
                                ? 'text-primary'
                                : 'text-destructive'
                            }`}>
                              {doc.file.status === 'success'
                                ? 'Uploaded'
                                : doc.file.status === 'uploading'
                                ? 'Uploading...'
                                : doc.file.error || 'Upload failed'}
                            </p>
                          </div>
                        </div>
                        {doc.file.status !== 'uploading' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(doc.id)}
                            className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                        onClick={() => fileInputRefs.current[doc.id]?.click()}
                      >
                        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="mb-1 text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.allowedTypes.map((type) => type.toUpperCase()).join(', ')} (max {doc.maxSize}MB)
                        </p>
                      </div>
                    )}

                    <input
                      ref={(element) => {
                        fileInputRefs.current[doc.id] = element;
                      }}
                      type="file"
                      accept={doc.allowedTypes.map((type) => `.${type}`).join(',')}
                      onChange={(event) => void handleFileSelect(doc.id, event)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {submitting === doc.id && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Uploading to the backend...
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(applicationId ? `/applications/${applicationId}` : '/applications')}
            className="flex-1 rounded-lg bg-muted py-3 text-sm font-medium text-muted-foreground hover:bg-muted/80"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
