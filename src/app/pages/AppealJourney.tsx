import { useEffect, useState } from 'react';
import { AlertCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { consumerService } from '../services/api/consumer.service';
import type { Application } from '../shared/types';

type AppealRecord = {
  id: string;
  application_id: string;
  original_decision: string;
  grounds: string;
  statement: string;
  status: string;
  appeal_deadline: string;
  submitted_at: string;
};

const GROUNDS = [
  { value: 'incorrect_facts', label: 'Facts were incorrect' },
  { value: 'rule_misapplied', label: 'A rule was misapplied' },
  { value: 'evidence_overlooked', label: 'Evidence was overlooked' },
  { value: 'procedural_error', label: 'There was a procedural error' },
  { value: 'other', label: 'Other grounds' },
];

export default function AppealJourney() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [appeals, setAppeals] = useState<AppealRecord[]>([]);
  const [applicationId, setApplicationId] = useState('');
  const [grounds, setGrounds] = useState(GROUNDS[0].value);
  const [statement, setStatement] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [applicationResponse, appealResponse] = await Promise.all([
      consumerService.getMyApplications(undefined, { page: 1, limit: 100 }),
      consumerService.getAppeals(),
    ]);
    setApplications(applicationResponse.data);
    setAppeals(appealResponse as AppealRecord[]);
  }

  useEffect(() => {
    reload()
      .then(() => setError(null))
      .catch(() => setError('Unable to load your appeal records.'))
      .finally(() => setLoading(false));
  }, []);

  const existingApplicationIds = new Set(appeals.map((appeal) => appeal.application_id));
  const eligibleApplications = applications.filter((application) =>
    ['APPROVED', 'REJECTED'].includes(application.status) && !existingApplicationIds.has(application.id),
  );

  const submitAppeal = async () => {
    if (!applicationId || statement.trim().length < 20 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await consumerService.createAppeal(applicationId, grounds, statement.trim());
      setStatement('');
      toast.success('Appeal submitted for independent review');
      await reload();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to submit appeal.';
      setError(message);
      toast.error('Appeal was not submitted', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-full bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7">
          <h1 className="text-2xl font-semibold">Appeals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Request an independent review of an application decision.</p>
        </header>

        {error && <div role="alert" className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" aria-label="Loading appeals" /></div>
        ) : (
          <>
            <section className="border-b border-border pb-7">
              <h2 className="text-lg font-medium">Submit an appeal</h2>
              {eligibleApplications.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No approved or rejected applications are currently eligible for a new appeal.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-medium">Application
                    <select value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-input-background px-3 py-2">
                      <option value="">Select an application</option>
                      {eligibleApplications.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.trackingNumber} · {application.service?.name || application.formData?.serviceName || application.serviceId} · {application.status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">Grounds
                    <select value={grounds} onChange={(event) => setGrounds(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-input-background px-3 py-2">
                      {GROUNDS.map((ground) => <option key={ground.value} value={ground.value}>{ground.label}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">Statement
                    <textarea value={statement} onChange={(event) => setStatement(event.target.value)} minLength={20} maxLength={5000} rows={5} className="mt-1 block w-full rounded-md border border-border bg-input-background px-3 py-2" placeholder="Explain why the decision should be reviewed." />
                  </label>
                  <button type="button" onClick={() => void submitAppeal()} disabled={!applicationId || statement.trim().length < 20 || submitting} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                    Submit appeal
                  </button>
                </div>
              )}
            </section>

            <section className="pt-7">
              <h2 className="text-lg font-medium">Appeal history</h2>
              {appeals.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No appeals submitted.</p>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {appeals.map((appeal) => (
                    <article key={appeal.id} className="py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-medium">{appeal.original_decision} decision</h3>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{appeal.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{appeal.statement}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Filed {new Date(appeal.submitted_at).toLocaleString()} · Deadline {new Date(appeal.appeal_deadline).toLocaleDateString()}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="mt-7 flex items-start gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Appeals are accepted within 30 days of a final decision and reviewed by someone other than the original decision maker.</p>
            </aside>
          </>
        )}
      </div>
    </main>
  );
}
