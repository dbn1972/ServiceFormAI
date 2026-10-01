import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { producerService } from '../services/api/producer.service';
import VisualFormBuilder from '../components/form-builder/FormBuilder';

export default function FormBuilderPage() {
  const { user } = useApp();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId') || undefined;
  const [initialSchema, setInitialSchema] = useState<string>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(serviceId));

  useEffect(() => {
    let active = true;

    if (!serviceId) {
      setInitialSchema(undefined);
      setLoadError(null);
      setIsLoading(false);
      return () => { active = false; };
    }

    setIsLoading(true);
    setLoadError(null);
    producerService.getServiceById(serviceId)
      .then((service) => {
        if (!active) return;
        const record = service as typeof service & {
          form_schema?: unknown;
          formSchema?: unknown;
        };
        const storedSchema = record.formSchema ?? record.form_schema;
        if (!storedSchema || typeof storedSchema !== 'object') {
          throw new Error('This service does not contain an editable form schema.');
        }

        const schema = storedSchema as Record<string, any>;
        const hydratedSchema = {
          ...schema,
          serviceId,
          serviceName: schema.serviceName || record.name,
          department: schema.department || '',
          metadata: {
            ...schema.metadata,
            description: schema.metadata?.description || record.description || '',
            category: schema.metadata?.category || record.category || '',
          },
        };
        setInitialSchema(JSON.stringify(hydratedSchema));
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load this service draft.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [serviceId]);

  if (isLoading) {
    return <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">Loading service draft...</div>;
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl p-6" role="alert">
        <h1 className="text-lg font-semibold">Unable to open form draft</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
        <Link to="/admin/services" className="mt-4 inline-flex text-sm text-primary underline">
          Return to services
        </Link>
      </main>
    );
  }

  const localDraftNamespace = localStorage.getItem('tenantId') || user?.id || 'serviceformai-builder';

  return (
    <main className="min-h-[70vh] bg-background">
      <VisualFormBuilder
        key={serviceId || 'new'}
        serviceId={serviceId}
        tenantId={localDraftNamespace}
        initialSchema={initialSchema}
      />
    </main>
  );
}