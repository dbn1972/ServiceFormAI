import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FormValidationGuard } from '../validation/validation.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { SaveApplicationDraftDto } from './dto/save-application-draft.dto';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Controller('consumer')
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}

  @Get('services')
  async getServices(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.consumerService.getServices(
      category,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data: result };
  }

  @Get('services/:serviceId')
  async getServiceById(@Param('serviceId') serviceId: string) {
    const service = await this.consumerService.getServiceById(serviceId);
    return {
      success: true,
      data: service,
    };
  }

  @Get('services/:serviceId/schema')
  async getFormSchema(@Param('serviceId') serviceId: string) {
    const schema = await this.consumerService.getFormSchema(serviceId);
    return {
      success: true,
      data: schema,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('services/:serviceId/draft')
  async getServiceDraft(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: any,
  ) {
    return { success: true, data: await this.consumerService.getServiceDraft(serviceId, user.id) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('services/:serviceId/draft')
  async saveServiceDraft(
    @Param('serviceId') serviceId: string,
    @Body() dto: SaveApplicationDraftDto,
    @CurrentUser() user: any,
  ) {
    return {
      success: true,
      data: await this.consumerService.saveServiceDraft(serviceId, user.id, user.consumerSource || 'mobile', dto),
    };
  }

  @UseGuards(JwtAuthGuard, FormValidationGuard)
  @Post('applications')
  async submitApplication(
    @Body() dto: SubmitApplicationDto,
    @CurrentUser() user: any,
    @Headers('x-idempotency-key') idempotencyKey?: string,
    @Headers('x-schema-version') schemaVersionHeader?: string,
    @Headers('x-submitted-at') submittedAtHeader?: string,
  ) {
    const schemaVersion = schemaVersionHeader
      ? parseInt(schemaVersionHeader, 10)
      : (dto as any).schemaVersion !== undefined
        ? parseInt((dto as any).schemaVersion, 10)
        : undefined;

    const result = await this.consumerService.submitApplication(
      dto.serviceId,
      user.id,
      user.consumerSource || 'direct',
      dto.formData,
      idempotencyKey || undefined,
      Number.isNaN(schemaVersion) ? undefined : schemaVersion,
      submittedAtHeader || undefined,
      (dto as any).applicationId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('applications/:applicationId/output')
  async getApplicationOutput(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: any,
  ) {
    return { success: true, data: await this.consumerService.getApplicationOutput(applicationId, user.id) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('applications/:applicationId')
  async getApplicationStatus(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: any,
  ) {
    const status = await this.consumerService.getApplicationStatus(
      applicationId,
      user.id,
    );
    return {
      success: true,
      data: status,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-applications')
  async getMyApplications(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.consumerService.getApplicationsByConsumer(
      user.id,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data: result };
  }

  @Get('applications/track/:trackingNumber')
  async trackApplication(@Param('trackingNumber') trackingNumber: string) {
    const result = await this.consumerService.trackApplication(trackingNumber);
    // Public endpoint: only return non-sensitive tracking fields
    return {
      success: true,
      data: {
        tracking_number: result.tracking_number,
        status: result.status,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('applications/:applicationId')
  async updateDraft(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: any,
    @Body('formData') formData: Record<string, any>,
  ) {
    const result = await this.consumerService.updateDraft(applicationId, user.id, formData);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('applications/:applicationId/deficiency-response')
  async submitDeficiencyResponse(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: any,
    @Body() dto: { notes?: string; formData?: Record<string, any> },
  ) {
    const result = await this.consumerService.submitDeficiencyResponse(applicationId, user.id, dto);
    return { success: true, data: result };
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.consumerService.getProfile(user.id);
    return { success: true, data: profile };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: { name?: string; email?: string; phone?: string },
  ) {
    const profile = await this.consumerService.updateProfile(user.id, dto);
    return { success: true, data: profile };
  }

  // ─── Notifications ───────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.consumerService.getNotifications(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications/:notificationId/read')
  async markNotificationRead(
    @CurrentUser() user: any,
    @Param('notificationId') notificationId: string,
  ) {
    await this.consumerService.markNotificationRead(user.id, notificationId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications/read-all')
  async markAllNotificationsRead(@CurrentUser() user: any) {
    await this.consumerService.markAllNotificationsRead(user.id);
    return { success: true };
  }

  // ─── Grievances ──────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('grievances')
  async getGrievances(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.consumerService.getGrievances(
      user.id,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Get('grievances/:grievanceId')
  async getGrievanceById(
    @CurrentUser() user: any,
    @Param('grievanceId') grievanceId: string,
  ) {
    const grievance = await this.consumerService.getGrievanceById(user.id, grievanceId);
    return { success: true, data: grievance };
  }

  @UseGuards(JwtAuthGuard)
  @Post('grievances')
  async createGrievance(
    @CurrentUser() user: any,
    @Body() dto: CreateGrievanceDto,
  ) {
    const grievance = await this.consumerService.createGrievance(user.id, dto);
    return { success: true, data: grievance };
  }

  @UseGuards(JwtAuthGuard)
  @Get('applications/:applicationId/appeals')
  async getApplicationAppeals(
    @CurrentUser() user: any,
    @Param('applicationId') applicationId: string,
  ) {
    return { success: true, data: await this.consumerService.getAppeals(user.id, applicationId) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('applications/:applicationId/appeals')
  async createAppeal(
    @CurrentUser() user: any,
    @Param('applicationId') applicationId: string,
    @Body() dto: Omit<CreateAppealDto, 'applicationId'>,
  ) {
    return { success: true, data: await this.consumerService.createAppeal(user.id, { ...dto, applicationId }) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('grievances/:grievanceId/comments')
  async addGrievanceComment(
    @CurrentUser() user: any,
    @Param('grievanceId') grievanceId: string,
    @Body('comment') comment: string,
  ) {
    await this.consumerService.addGrievanceComment(user.id, grievanceId, comment);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('grievances/:grievanceId/reopen')
  async reopenGrievance(
    @CurrentUser() user: any,
    @Param('grievanceId') grievanceId: string,
    @Body('reason') reason: string,
  ) {
    return { success: true, data: await this.consumerService.reopenGrievance(user.id, grievanceId, reason) };
  }

  // ─── Feedback ────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('feedback')
  async getCitizenFeedback(
    @CurrentUser() user: any,
    @Query('applicationId') applicationId?: string,
  ) {
    return { success: true, data: await this.consumerService.getCitizenFeedback(user.id, applicationId) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('appeals')
  async getMyAppeals(@CurrentUser() user: any) {
    return { success: true, data: await this.consumerService.getAppeals(user.id) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('feedback')
  async submitFeedback(
    @CurrentUser() user: any,
    @Body() dto: SubmitFeedbackDto,
  ) {
    await this.consumerService.submitFeedback(user.id, dto);
    return { success: true };
  }
}
