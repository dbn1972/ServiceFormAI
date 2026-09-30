import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { TenantStaffAuthGuard } from '../auth/guards/tenant-staff-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RedressService } from '../consumer/redress.service';
import { AssignRedressDto, CloseFeedbackDto, DecideAppealDto, ResolveGrievanceDto } from './dto/redress-operations.dto';

@Controller('producer/redress')
@UseGuards(TenantStaffAuthGuard, RolesGuard)
export class RedressController {
  constructor(private readonly redressService: RedressService) {}

  @Get('queue')
  @Roles('admin', 'officer', 'reviewer')
  async getQueue(@TenantId() tenantId: string, @CurrentUser() user: any) {
    return { success: true, data: await this.redressService.getTenantQueue(tenantId, user.id) };
  }

  @Post('grievances/:grievanceId/assign')
  @Roles('admin', 'officer')
  async assignGrievance(
    @TenantId() tenantId: string,
    @Param('grievanceId') grievanceId: string,
    @Body() dto: AssignRedressDto,
    @CurrentUser() user: any,
  ) {
    return { success: true, data: await this.redressService.assignGrievance(tenantId, grievanceId, dto.staffUserId || user.id, user.id) };
  }

  @Patch('grievances/:grievanceId/resolve')
  @Roles('admin', 'officer')
  async resolveGrievance(
    @TenantId() tenantId: string,
    @Param('grievanceId') grievanceId: string,
    @Body() dto: ResolveGrievanceDto,
    @CurrentUser() user: any,
  ) {
    return { success: true, data: await this.redressService.resolveGrievance(tenantId, grievanceId, user.id, dto.resolution) };
  }

  @Post('appeals/:appealId/assign')
  @Roles('admin', 'reviewer')
  async assignAppeal(
    @TenantId() tenantId: string,
    @Param('appealId') appealId: string,
    @Body() dto: AssignRedressDto,
    @CurrentUser() user: any,
  ) {
    return { success: true, data: await this.redressService.assignAppeal(tenantId, appealId, dto.staffUserId || user.id, user.id) };
  }

  @Patch('appeals/:appealId/decision')
  @Roles('admin', 'reviewer')
  async decideAppeal(
    @TenantId() tenantId: string,
    @Param('appealId') appealId: string,
    @Body() dto: DecideAppealDto,
    @CurrentUser() user: any,
  ) {
    return { success: true, data: await this.redressService.decideAppeal(tenantId, appealId, user.id, dto.decision, dto.reason) };
  }

  @Patch('feedback/:feedbackId/close')
  @Roles('admin', 'officer')
  async closeFeedback(
    @TenantId() tenantId: string,
    @Param('feedbackId') feedbackId: string,
    @Body() dto: CloseFeedbackDto,
    @CurrentUser() user: any,
  ) {
    return { success: true, data: await this.redressService.closeFeedback(tenantId, feedbackId, user.id, dto.response) };
  }

  @Post('feedback/:feedbackId/assign')
  @Roles('admin', 'officer')
  async assignFeedback(
    @TenantId() tenantId: string,
    @Param('feedbackId') feedbackId: string,
    @Body() dto: AssignRedressDto,
    @CurrentUser() user: any,
  ) {
    return { success: true, data: await this.redressService.assignFeedback(tenantId, feedbackId, dto.staffUserId || user.id, user.id) };
  }
}
