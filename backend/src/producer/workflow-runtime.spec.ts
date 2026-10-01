import { firstHumanWorkflowStage, resolveWorkflowTransition, statusForWorkflowAction } from './workflow-runtime';

const stages = [
  { id: 'submitted', name: 'Submitted', assignedRole: 'system', actions: ['submit'], nextStages: ['review'] },
  { id: 'review', name: 'Review', assignedRole: 'officer', actions: ['forward', 'raise_deficiency'], nextStages: ['approval', 'pending_documents'] },
  { id: 'approval', name: 'Approval', assignedRole: 'approver', actions: ['approve', 'reject'], nextStages: ['approved', 'rejected'] },
  { id: 'pending_documents', name: 'Pending documents', assignedRole: 'citizen', actions: ['submit_evidence'], nextStages: ['review'] },
  { id: 'approved', name: 'Approved', assignedRole: 'system', actions: [], nextStages: [] },
  { id: 'rejected', name: 'Rejected', assignedRole: 'system', actions: [], nextStages: [] },
];

describe('workflow runtime', () => {
  it('starts applications at the first human-owned stage', () => {
    expect(firstHumanWorkflowStage(stages)?.id).toBe('review');
  });

  it('resolves the configured next stage for a valid actor and action', () => {
    expect(resolveWorkflowTransition(stages, 'review', 'raise_deficiency', 'officer'))
      .toMatchObject({ allowed: true, targetStage: { id: 'pending_documents' } });
    expect(resolveWorkflowTransition(stages, 'approval', 'approve', 'approver'))
      .toMatchObject({ allowed: true, targetStage: { id: 'approved' } });
  });

  it('denies actions not declared for the current stage', () => {
    expect(resolveWorkflowTransition(stages, 'review', 'approve', 'officer'))
      .toMatchObject({ allowed: false });
  });

  it('denies mismatched roles and targets outside nextStages', () => {
    expect(resolveWorkflowTransition(stages, 'approval', 'approve', 'officer'))
      .toMatchObject({ allowed: false });
    expect(resolveWorkflowTransition(stages, 'review', 'forward', 'officer', 'rejected'))
      .toMatchObject({ allowed: false });
  });

  it('maps workflow actions to statuses without treating a forward as a decision', () => {
    expect(statusForWorkflowAction('forward', 'submitted')).toBe('under_review');
    expect(statusForWorkflowAction('forward', 'under_review')).toBe('under_review');
    expect(statusForWorkflowAction('raise_deficiency', 'under_review')).toBe('PENDING_DOCUMENTS');
    expect(statusForWorkflowAction('approve', 'under_review')).toBe('approved');
  });
});