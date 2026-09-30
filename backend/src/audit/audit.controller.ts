import { Controller, Get, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { TenantStaffAuthGuard } from '../auth/guards/tenant-staff-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { AuditService } from './audit.service';

/**
 * Allowed action audit status values.
 */
const VALID_ACTION_STATUSES = new Set([
  'success',
  'error',
  'timeout',
  'rate_limited',
]);

/**
 * Allowed action event values.
 */
const VALID_ACTION_EVENTS = new Set([
  'onFieldChange',
  'onFieldBlur',
  'onFormLoad',
  'onFormSubmit',
  'onButtonClick',
]);

/**
 * Maps client-side action audit status to the backend AuditEventType.
 */
const STATUS_TO_EVENT_TYPE: Record<string, string> = {
  success: 'action.execution.success',
  error: 'action.execution.error',
  timeout: 'action.execution.timeout',
  rate_limited: 'action.execution.rate_limited',
};

@Controller('audit')
@UseGuards(TenantStaffAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/logs
   * Returns paginated audit logs scoped to the current tenant.
   * Only admins may retrieve logs.
   */
  @Get('logs')
  @Roles('admin')
  async getLogs(
    @TenantId() tenantId: string,
    @Query('actorId') actorId?: string,
    @Query('eventType') eventType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.auditService.getLogs({
      tenantId,
      actorId,
      eventType,
      from,
      to,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return { success: true, data: result };
  }

  /**
   * POST /audit/action-executions
   * Accepts batched ActionAuditEntry arrays from the client-side audit logger.
   * Validates that entries do not contain `code` or field values.
   * Only admins may submit action audit entries.
   */
  @Post('action-executions')
  @Roles('admin', 'officer')
  async logActionExecutions(
    @TenantId() tenantId: string,
    @Body() body: { entries: unknown[] },
  ) {
    const entries = body?.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new BadRequestException({
        success: false,
        error: 'Request body must contain a non-empty "entries" array',
      });
    }

    // Cap batch size to prevent abuse
    if (entries.length > 100) {
      throw new BadRequestException({
        success: false,
        error: 'Batch size must not exceed 100 entries',
      });
    }

    const validatedEntries: Array<{
      actionId: string;
      actionEvent: string;
      targetId?: string;
      serviceId: string;
      executionDurationMs: number;
      status: string;
      errorCode?: string;
      errorMessage?: string;
      fetchDomain?: string;
    }> = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i] as Record<string, unknown>;

      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
        throw new BadRequestException({
          success: false,
          error: `Entry at index ${i} is not a valid object`,
        });
      }

      // Reject entries that contain 'code' or field values (security/privacy)
      if ('code' in entry) {
        throw new BadRequestException({
          success: false,
          error: `Entry at index ${i} must not contain "code" property`,
        });
      }
      if ('fieldValues' in entry || 'formValues' in entry || 'value' in entry) {
        throw new BadRequestException({
          success: false,
          error: `Entry at index ${i} must not contain field values`,
        });
      }

      // Validate required fields
      if (typeof entry.actionId !== 'string' || !entry.actionId) {
        throw new BadRequestException({
          success: false,
          error: `Entry at index ${i} is missing a valid "actionId"`,
        });
      }
      if (typeof entry.actionEvent !== 'string' || !VALID_ACTION_EVENTS.has(entry.actionEvent)) {
        throw new BadRequestException({
          success: false,
          error: `Entry at index ${i} has an invalid "actionEvent"`,
        });
      }
      if (typeof entry.status !== 'string' || !VALID_ACTION_STATUSES.has(entry.status)) {
        throw new BadRequestException({
          success: false,
          error: `Entry at index ${i} has an invalid "status"`,
        });
      }
      if (typeof entry.serviceId !== 'string' || !entry.serviceId) {
        throw new BadRequestException({
          success: false,
          error: `Entry at index ${i} is missing a valid "serviceId"`,
        });
      }
      if (typeof entry.executionDurationMs !== 'number' || entry.executionDurationMs < 0) {
        throw new BadRequestException({
          success: false,
          error: `Entry at index ${i} has an invalid "executionDurationMs"`,
        });
      }

      validatedEntries.push({
        actionId: entry.actionId as string,
        actionEvent: entry.actionEvent as string,
        targetId: typeof entry.targetId === 'string' ? entry.targetId : undefined,
        serviceId: entry.serviceId as string,
        executionDurationMs: entry.executionDurationMs as number,
        status: entry.status as string,
        errorCode: typeof entry.errorCode === 'string' ? entry.errorCode : undefined,
        errorMessage: typeof entry.errorMessage === 'string' ? entry.errorMessage : undefined,
        fetchDomain: typeof entry.fetchDomain === 'string' ? entry.fetchDomain : undefined,
      });
    }

    // Write all validated entries using the AuditService
    const logPromises = validatedEntries.map((entry) =>
      this.auditService.log({
        eventType: STATUS_TO_EVENT_TYPE[entry.status] as any,
        tenantId,
        resourceType: 'action',
        resourceId: entry.actionId,
        metadata: {
          actionEvent: entry.actionEvent,
          targetId: entry.targetId,
          serviceId: entry.serviceId,
          executionDurationMs: entry.executionDurationMs,
          errorCode: entry.errorCode,
          errorMessage: entry.errorMessage,
          fetchDomain: entry.fetchDomain,
        },
        success: entry.status === 'success',
      }),
    );

    await Promise.all(logPromises);

    return { success: true, count: validatedEntries.length };
  }
}
