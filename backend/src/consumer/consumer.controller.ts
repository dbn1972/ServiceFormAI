import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubmitApplicationDto } from './dto/submit-application.dto';

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
  @Post('applications')
  async submitApplication(
    @Body() dto: SubmitApplicationDto,
    @CurrentUser() user: any,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const result = await this.consumerService.submitApplication(
      dto.serviceId,
      user.id,
      user.consumerSource || 'direct',
      dto.formData,
      idempotencyKey || undefined,
    );
    return {
      success: true,
      data: result,
    };
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
    return { success: true, data: result };
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
    @Body() dto: { applicationId: string; subject: string; description: string },
  ) {
    const grievance = await this.consumerService.createGrievance(user.id, dto);
    return { success: true, data: grievance };
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

  // ─── Feedback ────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('feedback')
  async submitFeedback(
    @CurrentUser() user: any,
    @Body() dto: { applicationId: string; rating: number; comment?: string; tags?: string[] },
  ) {
    await this.consumerService.submitFeedback(user.id, dto);
    return { success: true };
  }
}
