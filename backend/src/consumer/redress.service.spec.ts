import { ForbiddenException } from '@nestjs/common';
import { AuditLog } from '../database/entities/audit-log.entity';
import { Application } from '../database/entities/application.entity';
import { ApplicationEvent } from '../database/entities/application-event.entity';
import { AppealCase } from '../database/entities/appeal-case.entity';
import { CitizenFeedback } from '../database/entities/citizen-feedback.entity';
import { GrievanceCase } from '../database/entities/grievance-case.entity';
import { OutboxEvent } from '../database/entities/outbox-event.entity';
import { TenantUser } from '../database/entities/tenant-user.entity';
import { RedressService } from './redress.service';

const makeRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => value),
});

describe('RedressService', () => {
  const repositories = new Map<any, ReturnType<typeof makeRepository>>();
  const dataSource = {
    manager: { getRepository: (entity) => repositories.get(entity) },
    transaction: jest.fn(async (callback) => callback({ getRepository: (entity) => repositories.get(entity) })),
  } as any;
  let service: RedressService;

  beforeEach(() => {
    repositories.clear();
    for (const entity of [GrievanceCase, AppealCase, CitizenFeedback, TenantUser, Application, ApplicationEvent, AuditLog, OutboxEvent]) {
      repositories.set(entity, makeRepository());
    }
    service = new RedressService(dataSource);
  });

  it('rejects redress queue access for inactive tenant staff', async () => {
    repositories.get(TenantUser)!.findOne.mockResolvedValue(null);

    await expect(service.getTenantQueue('tenant-1', 'inactive-officer')).rejects.toThrow(ForbiddenException);
  });

  it('resolves a grievance with a timeline entry and audit record', async () => {
    const grievance = {
      id: 'grievance-1', tenant_id: 'tenant-1', status: 'assigned', assigned_to: 'officer-1', timeline: [],
    };
    repositories.get(TenantUser)!.findOne.mockResolvedValue({ id: 'officer-1', tenant_id: 'tenant-1', active: true, role: 'officer' });
    repositories.get(GrievanceCase)!.findOne.mockResolvedValue(grievance);

    await expect(
      service.resolveGrievance('tenant-1', 'grievance-1', 'officer-2', 'Evidence reviewed.'),
    ).rejects.toThrow(ForbiddenException);
    await service.resolveGrievance('tenant-1', 'grievance-1', 'officer-1', 'Evidence reviewed; action completed.');

    expect(grievance).toMatchObject({ status: 'resolved', resolution: 'Evidence reviewed; action completed.' });
    expect(grievance.timeline).toEqual([expect.objectContaining({ event: 'resolved', actorId: 'officer-1' })]);
    expect(repositories.get(AuditLog)!.save).toHaveBeenCalledWith(expect.objectContaining({
      resource_type: 'grievance', resource_id: 'grievance-1', actor_id: 'officer-1',
    }));
  });

  it('requires appeal review to be independent and remands the application with an outbox event', async () => {
    const appeal = {
      id: 'appeal-1', tenant_id: 'tenant-1', application_id: 'application-1',
      original_decision_actor_id: 'original-officer', assigned_to: 'reviewer-2',
      status: 'assigned', timeline: [],
    };
    const application = { id: 'application-1', tenant_id: 'tenant-1', consumer_id: 'citizen-1', status: 'REJECTED' };
    repositories.get(TenantUser)!.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'original-officer', tenant_id: 'tenant-1', active: true, role: 'reviewer' })
      .mockResolvedValue({ id: 'reviewer-2', tenant_id: 'tenant-1', active: true, role: 'reviewer' });
    repositories.get(AppealCase)!.findOne.mockResolvedValue(appeal);
    repositories.get(Application)!.findOne.mockResolvedValue(application);

    await expect(
      service.decideAppeal('tenant-1', 'appeal-1', 'reviewer-2', 'remanded', 'Inactive reviewer token.'),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.decideAppeal('tenant-1', 'appeal-1', 'original-officer', 'remanded', 'The original decision must be reviewed.'),
    ).rejects.toThrow(ForbiddenException);

    await service.decideAppeal('tenant-1', 'appeal-1', 'reviewer-2', 'remanded', 'The evidence requires a new review.');

    expect(appeal).toMatchObject({ status: 'remanded', decided_by: 'reviewer-2' });
    expect(application).toMatchObject({ status: 'UNDER_REVIEW', current_stage: 'Appeal review ordered' });
    expect(repositories.get(ApplicationEvent)!.save).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'appeal.remanded', actor_id: 'reviewer-2',
    }));
    expect(repositories.get(OutboxEvent)!.save).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'application.status-updated', status: 'pending',
    }));
  });

  it('restricts appeal assignees to independent reviewers and permits reassignment', async () => {
    const appeal = {
      id: 'appeal-1', tenant_id: 'tenant-1', original_decision_actor_id: 'original-officer',
      status: 'submitted', assigned_to: null, timeline: [],
    };
    const staffRepository = repositories.get(TenantUser)!;
    const appealRepository = repositories.get(AppealCase)!;
    appealRepository.findOne.mockResolvedValue(appeal);
    staffRepository.findOne
      .mockResolvedValueOnce({ id: 'officer-1', tenant_id: 'tenant-1', active: true, role: 'officer' })
      .mockResolvedValueOnce({ id: 'reviewer-1', tenant_id: 'tenant-1', active: true, role: 'reviewer' })
      .mockResolvedValueOnce({ id: 'reviewer-2', tenant_id: 'tenant-1', active: true, role: 'reviewer' })
      .mockResolvedValueOnce({ id: 'original-officer', tenant_id: 'tenant-1', active: true, role: 'admin' });

    staffRepository.findOne.mockImplementation(async ({ where }) => ({
      id: where.id,
      tenant_id: 'tenant-1',
      active: true,
      role: where.id.startsWith('reviewer') ? 'reviewer' : where.id === 'original-officer' ? 'admin' : 'officer',
    }));

    await expect(service.assignAppeal('tenant-1', 'appeal-1', 'officer-1', 'reviewer-manager')).rejects.toThrow(ForbiddenException);
    await service.assignAppeal('tenant-1', 'appeal-1', 'reviewer-1', 'reviewer-1');
    await service.assignAppeal('tenant-1', 'appeal-1', 'reviewer-2', 'reviewer-2');

    expect(appeal).toMatchObject({ status: 'assigned', assigned_to: 'reviewer-2' });
    expect(appeal.timeline).toEqual([
      expect.objectContaining({ event: 'assigned', actorId: 'reviewer-1' }),
      expect.objectContaining({ event: 'reassigned', actorId: 'reviewer-2', previousAssignee: 'reviewer-1' }),
    ]);
    await expect(service.assignAppeal('tenant-1', 'appeal-1', 'original-officer', 'reviewer-manager')).rejects.toThrow(ForbiddenException);
  });

  it('assigns feedback to active tenant staff before allowing its closure', async () => {
    const staff = { id: 'officer-1', tenant_id: 'tenant-1', active: true, role: 'officer' };
    const feedback = { id: 'feedback-1', tenant_id: 'tenant-1', status: 'submitted', timeline: [] };
    repositories.get(TenantUser)!.findOne.mockResolvedValue(staff);
    repositories.get(CitizenFeedback)!.findOne.mockResolvedValue(feedback);

    await service.assignFeedback('tenant-1', 'feedback-1', 'officer-1', 'officer-1');

    expect(feedback).toMatchObject({ status: 'assigned', assigned_to: 'officer-1' });
    expect(feedback.timeline).toEqual([expect.objectContaining({ event: 'assigned', actorId: 'officer-1' })]);
    await expect(
      service.closeFeedback('tenant-1', 'feedback-1', 'officer-2', 'Response'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('closes assigned feedback with an operator response', async () => {
    const feedback = { id: 'feedback-1', tenant_id: 'tenant-1', status: 'assigned', assigned_to: 'officer-1' };
    repositories.get(TenantUser)!.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 'officer-1', tenant_id: 'tenant-1', active: true, role: 'officer' });
    repositories.get(CitizenFeedback)!.findOne.mockResolvedValue(feedback);

    await expect(
      service.closeFeedback('tenant-1', 'feedback-1', 'officer-1', 'Inactive staff token.'),
    ).rejects.toThrow(ForbiddenException);
    await service.closeFeedback('tenant-1', 'feedback-1', 'officer-1', 'Thank you; the service team has logged this issue.');

    expect(feedback).toMatchObject({
      status: 'closed', assigned_to: 'officer-1',
      response: 'Thank you; the service team has logged this issue.',
    });
  });
});
