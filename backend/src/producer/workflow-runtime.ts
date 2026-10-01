export interface WorkflowRuntimeStage {
  id: string;
  name: string;
  role?: string;
  assignedRole?: string;
  actions?: string[];
  nextStages?: string[];
}

export type WorkflowTransitionResult =
  | { allowed: true; targetStage: WorkflowRuntimeStage }
  | { allowed: false; reason: string };

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function actorMayPerform(role: string | undefined, actorRole: string): boolean {
  const required = normalize(role || '');
  const actor = normalize(actorRole);
  if (!required || required === 'system' || required === 'citizen') return false;
  if (actor === 'admin') return true;
  if (required === 'officer') return actor === 'officer' || actor === 'reviewer';
  if (required === 'approver') return actor === 'approver';
  if (required === 'clerk') return actor === 'clerk';
  return required === actor;
}

function chooseTargetStage(
  action: string,
  candidates: WorkflowRuntimeStage[],
): WorkflowRuntimeStage | null {
  const normalizedAction = normalize(action);
  const matches = (stage: WorkflowRuntimeStage, expression: RegExp) =>
    expression.test(`${stage.id} ${stage.name}`.toLowerCase());

  if (normalizedAction === 'raise_deficiency') {
    return candidates.find((stage) => matches(stage, /pending|deficien|additional|evidence/)) ?? null;
  }
  if (normalizedAction === 'approve' || normalizedAction === 'issue_certificate') {
    return candidates.find((stage) => matches(stage, /approved|completed|certificate_issued|issued/)) ?? null;
  }
  if (normalizedAction === 'reject') {
    return candidates.find((stage) => matches(stage, /rejected|reject/)) ?? null;
  }

  return candidates.find((stage) =>
    !matches(stage, /pending|deficien|rejected|approved|completed|issued/)
      && normalize(stage.assignedRole || stage.role || '') !== 'system',
  ) ?? null;
}

export function resolveWorkflowTransition(
  stages: WorkflowRuntimeStage[],
  currentStageId: string,
  action: string,
  actorRole: string,
  requestedTargetStageId?: string,
): WorkflowTransitionResult {
  if (!Array.isArray(stages) || stages.length === 0) {
    return { allowed: false, reason: 'This service has no executable workflow stages.' };
  }

  const currentStage = stages.find((stage) =>
    normalize(stage.id) === normalize(currentStageId)
      || normalize(stage.name) === normalize(currentStageId),
  );
  if (!currentStage) {
    return { allowed: false, reason: 'The application is not at a configured workflow stage.' };
  }

  if (!actorMayPerform(currentStage.assignedRole || currentStage.role, actorRole)) {
    return { allowed: false, reason: 'Your role is not assigned to the current workflow stage.' };
  }

  if (!Array.isArray(currentStage.actions) || !currentStage.actions.some((allowedAction) => normalize(allowedAction) === normalize(action))) {
    return { allowed: false, reason: 'This action is not allowed at the current workflow stage.' };
  }

  const nextIds = new Set((currentStage.nextStages ?? []).map(normalize));
  const candidates = stages.filter((stage) => nextIds.has(normalize(stage.id)) || nextIds.has(normalize(stage.name)));
  if (requestedTargetStageId) {
    const requested = candidates.find((stage) =>
      normalize(stage.id) === normalize(requestedTargetStageId)
        || normalize(stage.name) === normalize(requestedTargetStageId),
    );
    return requested
      ? { allowed: true, targetStage: requested }
      : { allowed: false, reason: 'The requested stage is not an allowed next stage.' };
  }

  const targetStage = chooseTargetStage(action, candidates);
  if (!targetStage) {
    return { allowed: false, reason: 'A valid next stage could not be resolved for this action.' };
  }
  return { allowed: true, targetStage };
}

export function firstHumanWorkflowStage(stages: WorkflowRuntimeStage[]): WorkflowRuntimeStage | undefined {
  return stages.find((stage) => {
    const role = normalize(stage.assignedRole || stage.role || '');
    return role !== '' && role !== 'system' && role !== 'citizen';
  }) ?? stages[0];
}

export function statusForWorkflowAction(action: string, currentStatus: string): string | null {
  const normalizedAction = normalize(action);
  if (normalizedAction === 'raise_deficiency') return 'PENDING_DOCUMENTS';
  if (normalizedAction === 'approve' || normalizedAction === 'issue_certificate') return 'approved';
  if (normalizedAction === 'reject') return 'rejected';
  if (['forward', 'verify_documents', 'record_verification', 'recommend'].includes(normalizedAction)) {
    return currentStatus.toLowerCase() === 'submitted' ? 'under_review' : currentStatus;
  }
  return null;
}