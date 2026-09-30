import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Application } from '../database/entities/application.entity';
import { ApplicationEvent } from '../database/entities/application-event.entity';
import { AppealCase } from '../database/entities/appeal-case.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { CitizenFeedback } from '../database/entities/citizen-feedback.entity';
import { GrievanceCase } from '../database/entities/grievance-case.entity';
import { OutboxEvent } from '../database/entities/outbox-event.entity';
import { TenantUser } from '../database/entities/tenant-user.entity';

@Injectable()
export class RedressService {
  constructor(private readonly dataSource: DataSource) {}

  private async requireActiveStaff(manager: EntityManager, tenantId: string, staffId: string, allowedRoles: string[]) {
    const staff = await manager.getRepository(TenantUser).findOne({ where: { id: staffId, tenant_id: tenantId, active: true } });
    if (!staff || !allowedRoles.includes(staff.role)) throw new ForbiddenException('Active authorized tenant staff access is required');
    return staff;
  }

  async getTenantQueue(tenantId: string, staffId: string) {
    const manager = this.dataSource.manager;
    await this.requireActiveStaff(manager, tenantId, staffId, ['admin', 'officer', 'reviewer']);
    const [grievances, appeals, feedback] = await Promise.all([
      manager.getRepository(GrievanceCase).find({ where: { tenant_id: tenantId }, order: { created_at: 'ASC' } }),
      manager.getRepository(AppealCase).find({ where: { tenant_id: tenantId }, order: { created_at: 'ASC' } }),
      manager.getRepository(CitizenFeedback).find({ where: { tenant_id: tenantId }, order: { created_at: 'ASC' } }),
    ]);
    return { grievances, appeals, feedback };
  }

  async assignGrievance(tenantId: string, grievanceId: string, staffId: string, actorId: string) {
    return this.dataSource.transaction(async (manager) => {
      const actor = await this.requireActiveStaff(manager, tenantId, actorId, ['admin', 'officer']);
      const staff = staffId === actorId ? actor : await this.requireActiveStaff(manager, tenantId, staffId, ['admin', 'officer']);
      const repository = manager.getRepository(GrievanceCase);
      const grievance = await repository.findOne({ where: { id: grievanceId, tenant_id: tenantId }, lock: { mode: 'pessimistic_write' } });
      if (!grievance) throw new NotFoundException('Grievance not found');
      if (!['submitted', 'reopened', 'assigned'].includes(grievance.status)) throw new BadRequestException('Grievance cannot be assigned in its current state');
      grievance.assigned_to = staffId;
      grievance.status = 'assigned';
      grievance.timeline = [...(grievance.timeline ?? []), { event: 'assigned', actorId, assignedTo: staffId, at: new Date().toISOString() }];
      return repository.save(grievance);
    });
  }

  async resolveGrievance(tenantId: string, grievanceId: string, staffId: string, resolution: string) {
    return this.dataSource.transaction(async (manager) => {
      const staff = await this.requireActiveStaff(manager, tenantId, staffId, ['admin', 'officer']);
      const repository = manager.getRepository(GrievanceCase);
      const grievance = await repository.findOne({ where: { id: grievanceId, tenant_id: tenantId }, lock: { mode: 'pessimistic_write' } });
      if (!grievance) throw new NotFoundException('Grievance not found');
      if (grievance.status !== 'assigned' || grievance.assigned_to !== staffId) throw new ForbiddenException('Assign grievance to yourself before resolving it');
      const now = new Date();
      grievance.status = 'resolved';
      grievance.resolution = resolution;
      grievance.resolved_at = now;
      grievance.timeline = [...(grievance.timeline ?? []), { event: 'resolved', actorId: staffId, resolution, at: now.toISOString() }];
      const saved = await repository.save(grievance);
      await manager.getRepository(AuditLog).save(manager.getRepository(AuditLog).create({
        event_type: 'admin.application.status_update', actor_id: staffId, actor_role: staff.role, tenant_id: tenantId,
        resource_type: 'grievance', resource_id: grievance.id, metadata: { status: 'resolved' }, success: true,
      }));
      return saved;
    });
  }

  async reopenGrievance(consumerId: string, grievanceId: string, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(GrievanceCase);
      const grievance = await repository.findOne({ where: { id: grievanceId, consumer_id: consumerId }, lock: { mode: 'pessimistic_write' } });
      if (!grievance) throw new NotFoundException('Grievance not found');
      if (grievance.status !== 'resolved' || !grievance.resolved_at) throw new BadRequestException('Only a resolved grievance may be reopened');
      if (Date.now() - grievance.resolved_at.getTime() > 30 * 24 * 60 * 60 * 1000) throw new BadRequestException('The 30-day reopening period has expired');
      const now = new Date();
      grievance.status = 'reopened';
      grievance.reopened_at = now;
      grievance.timeline = [...(grievance.timeline ?? []), { event: 'reopened', actorId: consumerId, reason, at: now.toISOString() }];
      return repository.save(grievance);
    });
  }

  async assignAppeal(tenantId: string, appealId: string, staffId: string, actorId: string) {
    return this.dataSource.transaction(async (manager) => {
      const actor = await this.requireActiveStaff(manager, tenantId, actorId, ['admin', 'reviewer']);
      const staff = staffId === actorId ? actor : await this.requireActiveStaff(manager, tenantId, staffId, ['admin', 'reviewer']);
      const repository = manager.getRepository(AppealCase);
      const appeal = await repository.findOne({ where: { id: appealId, tenant_id: tenantId }, lock: { mode: 'pessimistic_write' } });
      if (!appeal) throw new NotFoundException('Appeal not found');
      if (!['submitted', 'assigned'].includes(appeal.status)) throw new BadRequestException('Appeal is not awaiting assignment');
      if (appeal.original_decision_actor_id === staffId) throw new ForbiddenException('The original decision maker cannot review this appeal');
      const previousAssignee = appeal.assigned_to;
      appeal.assigned_to = staffId;
      appeal.status = 'assigned';
      appeal.timeline = [...(appeal.timeline ?? []), { event: previousAssignee ? 'reassigned' : 'assigned', actorId, assignedTo: staffId, previousAssignee, at: new Date().toISOString() }];
      return repository.save(appeal);
    });
  }

  async decideAppeal(tenantId: string, appealId: string, reviewerId: string, decision: 'upheld' | 'remanded', reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const reviewer = await this.requireActiveStaff(manager, tenantId, reviewerId, ['admin', 'reviewer']);
      const appealRepository = manager.getRepository(AppealCase);
      const appeal = await appealRepository.findOne({ where: { id: appealId, tenant_id: tenantId }, lock: { mode: 'pessimistic_write' } });
      if (!appeal) throw new NotFoundException('Appeal not found');
      if (!['submitted', 'assigned', 'in_review'].includes(appeal.status)) throw new BadRequestException('Appeal is already decided');
      if (appeal.original_decision_actor_id === reviewerId) throw new ForbiddenException('The original decision maker cannot decide the appeal');
      if (appeal.assigned_to && appeal.assigned_to !== reviewerId) throw new ForbiddenException('Only the assigned independent reviewer may decide this appeal');
      const now = new Date();
      appeal.status = decision;
      appeal.decided_by = reviewerId;
      appeal.decision_reason = reason;
      appeal.decided_at = now;
      appeal.timeline = [...(appeal.timeline ?? []), { event: decision, actorId: reviewerId, reason, at: now.toISOString() }];
      const saved = await appealRepository.save(appeal);

      if (decision === 'remanded') {
        const applicationRepository = manager.getRepository(Application);
        const application = await applicationRepository.findOne({ where: { id: appeal.application_id, tenant_id: tenantId }, lock: { mode: 'pessimistic_write' } });
        if (!application) throw new NotFoundException('Appeal application not found');
        const fromStatus = application.status;
        application.status = 'UNDER_REVIEW';
        application.current_stage = 'Appeal review ordered';
        await applicationRepository.save(application);
        await manager.getRepository(ApplicationEvent).save(manager.getRepository(ApplicationEvent).create({
          application_id: application.id, tenant_id: tenantId, actor_id: reviewerId, actor_role: reviewer.role,
          event_type: 'appeal.remanded', from_status: fromStatus, to_status: application.status,
          stage: application.current_stage, title: 'Appeal remanded for new review', notes: reason,
          metadata: { appealId: appeal.id },
        }));
        await manager.getRepository(OutboxEvent).save(manager.getRepository(OutboxEvent).create({
          event_type: 'application.status-updated', aggregate_type: 'application', aggregate_id: application.id,
          tenant_id: tenantId, payload: { applicationId: application.id, tenantId, consumerId: application.consumer_id, status: application.status, currentStage: application.current_stage },
          idempotency_key: `appeal.remand:${appeal.id}`, status: 'pending',
        }));
      }
      return saved;
    });
  }

  async assignFeedback(tenantId: string, feedbackId: string, staffId: string, actorId: string) {
    return this.dataSource.transaction(async (manager) => {
      const actor = await this.requireActiveStaff(manager, tenantId, actorId, ['admin', 'officer']);
      const staff = staffId === actorId ? actor : await this.requireActiveStaff(manager, tenantId, staffId, ['admin', 'officer']);
      const repository = manager.getRepository(CitizenFeedback);
      const feedback = await repository.findOne({ where: { id: feedbackId, tenant_id: tenantId }, lock: { mode: 'pessimistic_write' } });
      if (!feedback) throw new NotFoundException('Feedback not found');
      if (feedback.status === 'closed') throw new BadRequestException('Feedback is already closed');
      feedback.status = 'assigned';
      feedback.assigned_to = staffId;
      feedback.timeline = [...(feedback.timeline ?? []), { event: 'assigned', actorId, assignedTo: staffId, at: new Date().toISOString() }];
      return repository.save(feedback);
    });
  }

  async closeFeedback(tenantId: string, feedbackId: string, staffId: string, response: string) {
    return this.dataSource.transaction(async (manager) => {
      const staff = await this.requireActiveStaff(manager, tenantId, staffId, ['admin', 'officer']);
      const repository = manager.getRepository(CitizenFeedback);
      const feedback = await repository.findOne({ where: { id: feedbackId, tenant_id: tenantId }, lock: { mode: 'pessimistic_write' } });
      if (!feedback) throw new NotFoundException('Feedback not found');
      if (feedback.status !== 'assigned' || feedback.assigned_to !== staffId) throw new ForbiddenException('Assign feedback to yourself before responding');
      const now = new Date();
      feedback.status = 'closed';
      feedback.response = response;
      feedback.closed_at = now;
      feedback.timeline = [...(feedback.timeline ?? []), { event: 'closed', actorId: staffId, response, at: now.toISOString() }];
      return repository.save(feedback);
    });
  }
}
