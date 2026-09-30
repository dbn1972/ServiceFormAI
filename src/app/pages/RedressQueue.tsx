import { ClipboardCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { producerService } from '../services/api/producer.service';

type RedressQueueData = {
  grievances: Array<Record<string, any>>;
  appeals: Array<Record<string, any>>;
  feedback: Array<Record<string, any>>;
};

const emptyQueue: RedressQueueData = { grievances: [], appeals: [], feedback: [] };

export default function RedressQueue() {
  const { user } = useApp();
  const [queue, setQueue] = useState<RedressQueueData>(emptyQueue);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const canProcessCases = user?.role === 'admin' || user?.role === 'officer';
  const canReviewAppeals = user?.role === 'admin' || user?.role === 'reviewer';
  const canAssignAppeals = user?.role === 'admin' || user?.role === 'reviewer';

  const loadQueue = async () => {
    try {
      setQueue(await producerService.getRedressQueue());
    } catch {
      setQueue(emptyQueue);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
      await loadQueue();
    } catch (error) {
      toast.error('Unable to update redress case', {
        description: error instanceof Error ? error.message : 'Check assignment and case eligibility.',
      });
    }
  };

  return (
    <main className="min-h-full bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <ClipboardCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Redress Queue</h1>
        </div>
        {queue.grievances.length + queue.appeals.length + queue.feedback.length === 0 ? (
          <p className="border-t border-border py-6 text-sm text-muted-foreground">No grievances, appeals, or feedback are awaiting action.</p>
        ) : (
          <div className="divide-y divide-border">
            {queue.grievances.map((grievance) => (
              <article key={grievance.id} className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-medium">Grievance: {grievance.subject}</h2>
                    <p className="text-xs text-muted-foreground">{grievance.category} · {grievance.status} · Application {grievance.application_id}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{grievance.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Due {grievance.due_at ? new Date(grievance.due_at).toLocaleDateString() : 'not set'}</span>
                </div>
                {grievance.assigned_to && grievance.assigned_to !== user?.id && (
                  <p className="mt-2 text-xs text-muted-foreground">Assigned to {grievance.assigned_to}</p>
                )}
                {canProcessCases && ['submitted', 'reopened', 'assigned'].includes(grievance.status) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {grievance.assigned_to !== user?.id && (
                      <button type="button" onClick={() => void runAction(() => producerService.assignGrievance(grievance.id, user?.id || ''), 'Grievance assigned to you')} className="rounded-md border border-border px-3 py-2 text-sm">Assign to me</button>
                    )}
                    {grievance.status === 'assigned' && grievance.assigned_to === user?.id && <>
                      <input value={responses[grievance.id] || ''} onChange={(event) => setResponses((previous) => ({ ...previous, [grievance.id]: event.target.value }))} placeholder="Resolution details" className="min-w-48 flex-1 rounded-md border border-border bg-input-background px-3 py-2 text-sm" />
                      <button type="button" disabled={!responses[grievance.id]?.trim()} onClick={() => void runAction(() => producerService.resolveGrievance(grievance.id, responses[grievance.id] || ''), 'Grievance resolved')} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">Resolve</button>
                    </>}
                  </div>
                )}
              </article>
            ))}

            {queue.appeals.map((appeal) => (
              <article key={appeal.id} className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-medium">Appeal: {appeal.original_decision}</h2>
                    <p className="text-xs text-muted-foreground">{appeal.status} · {appeal.grounds} · Application {appeal.application_id}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{appeal.statement}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Deadline {new Date(appeal.appeal_deadline).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Original decision maker: {appeal.original_decision_actor_id || 'not recorded'}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canAssignAppeals && ['submitted', 'assigned'].includes(appeal.status) && appeal.assigned_to !== user?.id && appeal.original_decision_actor_id !== user?.id && (
                    <button type="button" onClick={() => void runAction(() => producerService.assignAppeal(appeal.id, user?.id || ''), 'Appeal assigned to you')} className="rounded-md border border-border px-3 py-2 text-sm">Assign to me</button>
                  )}
                  {canReviewAppeals && appeal.assigned_to === user?.id && appeal.original_decision_actor_id !== user?.id && <>
                    <input value={responses[appeal.id] || ''} onChange={(event) => setResponses((previous) => ({ ...previous, [appeal.id]: event.target.value }))} placeholder="Reasoned appeal decision" className="min-w-48 flex-1 rounded-md border border-border bg-input-background px-3 py-2 text-sm" />
                    <button type="button" disabled={!responses[appeal.id]?.trim()} onClick={() => void runAction(() => producerService.decideAppeal(appeal.id, 'upheld', responses[appeal.id] || ''), 'Appeal upheld')} className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50">Uphold</button>
                    <button type="button" disabled={!responses[appeal.id]?.trim()} onClick={() => void runAction(() => producerService.decideAppeal(appeal.id, 'remanded', responses[appeal.id] || ''), 'Appeal remanded for new review')} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">Remand</button>
                  </>}
                </div>
              </article>
            ))}

            {queue.feedback.map((feedback) => (
              <article key={feedback.id} className="py-5">
                <h2 className="font-medium">Citizen feedback · Rating {feedback.rating}/5</h2>
                <p className="text-xs text-muted-foreground">{feedback.status} · Application {feedback.application_id}</p>
                {feedback.comment && <p className="mt-1 text-sm text-muted-foreground">{feedback.comment}</p>}
                {canProcessCases && feedback.status === 'submitted' && (
                  <button type="button" onClick={() => void runAction(() => producerService.assignCitizenFeedback(feedback.id, user?.id || ''), 'Feedback assigned to you')} className="mt-3 rounded-md border border-border px-3 py-2 text-sm">Assign to me</button>
                )}
                {canProcessCases && feedback.status === 'assigned' && feedback.assigned_to === user?.id && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input value={responses[feedback.id] || ''} onChange={(event) => setResponses((previous) => ({ ...previous, [feedback.id]: event.target.value }))} placeholder="Response or disposition" className="min-w-48 flex-1 rounded-md border border-border bg-input-background px-3 py-2 text-sm" />
                    <button type="button" disabled={!responses[feedback.id]?.trim()} onClick={() => void runAction(() => producerService.closeCitizenFeedback(feedback.id, responses[feedback.id] || ''), 'Feedback disposition recorded')} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">Respond &amp; close</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}