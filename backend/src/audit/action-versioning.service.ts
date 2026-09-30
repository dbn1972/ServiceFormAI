import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionCodeVersion } from '../database/entities/action-code-version.entity';

/**
 * ActionVersioningService — manages versioned snapshots of action code.
 *
 * When an admin modifies action code, a new version is created rather
 * than overwriting existing code. This maintains an audit trail of all
 * action code changes in the database.
 */
@Injectable()
export class ActionVersioningService {
  constructor(
    @InjectRepository(ActionCodeVersion)
    private readonly versionRepo: Repository<ActionCodeVersion>,
  ) {}

  /**
   * Create a new version for an action's code.
   * Automatically increments the version number.
   */
  async createVersion(params: {
    tenantId: string;
    serviceId: string;
    actionId: string;
    code: string;
    event: string;
    targetId?: string;
    changedBy?: string;
    changeDescription?: string;
  }): Promise<ActionCodeVersion> {
    // Get the latest version number for this action
    const latest = await this.versionRepo.findOne({
      where: {
        tenant_id: params.tenantId,
        service_id: params.serviceId,
        action_id: params.actionId,
      },
      order: { version: 'DESC' },
    });

    const nextVersion = latest ? latest.version + 1 : 1;

    const version = this.versionRepo.create({
      tenant_id: params.tenantId,
      service_id: params.serviceId,
      action_id: params.actionId,
      version: nextVersion,
      code: params.code,
      event: params.event,
      target_id: params.targetId ?? null,
      changed_by: params.changedBy ?? null,
      change_description: params.changeDescription ?? null,
    });

    return this.versionRepo.save(version);
  }

  /**
   * Get all versions for a specific action, ordered by version descending.
   */
  async getVersions(
    tenantId: string,
    serviceId: string,
    actionId: string,
  ): Promise<ActionCodeVersion[]> {
    return this.versionRepo.find({
      where: {
        tenant_id: tenantId,
        service_id: serviceId,
        action_id: actionId,
      },
      order: { version: 'DESC' },
    });
  }

  /**
   * Get a specific version of an action's code.
   */
  async getVersion(
    tenantId: string,
    serviceId: string,
    actionId: string,
    version: number,
  ): Promise<ActionCodeVersion | null> {
    return this.versionRepo.findOne({
      where: {
        tenant_id: tenantId,
        service_id: serviceId,
        action_id: actionId,
        version,
      },
    });
  }

  /**
   * Track action code changes between old and new schema versions.
   * Creates new versions for any actions whose code has changed.
   */
  async trackSchemaChanges(params: {
    tenantId: string;
    serviceId: string;
    oldActions: Array<{ id: string; code: string; event: string; targetId?: string }>;
    newActions: Array<{ id: string; code: string; event: string; targetId?: string }>;
    changedBy?: string;
  }): Promise<void> {
    const oldMap = new Map(params.oldActions.map((a) => [a.id, a]));

    for (const newAction of params.newActions) {
      const oldAction = oldMap.get(newAction.id);

      // Create a version if the action is new or its code has changed
      if (!oldAction || oldAction.code !== newAction.code) {
        await this.createVersion({
          tenantId: params.tenantId,
          serviceId: params.serviceId,
          actionId: newAction.id,
          code: newAction.code,
          event: newAction.event,
          targetId: newAction.targetId,
          changedBy: params.changedBy,
          changeDescription: oldAction ? 'Code modified' : 'Action created',
        });
      }
    }
  }
}
