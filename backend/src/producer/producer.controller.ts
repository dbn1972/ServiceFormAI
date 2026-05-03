import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProducerService } from './producer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller('producer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProducerController {
  constructor(private readonly producerService: ProducerService) {}

  // Services

  @Post('services')
  @Roles('admin', 'officer')
  async createService(@TenantId() tenantId: string, @Body() dto: CreateServiceDto) {
    return { success: true, data: await this.producerService.createService(tenantId, dto) };
  }

  @Get('services')
  @Roles('admin', 'officer', 'clerk')
  async getServices(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.producerService.getServices(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data: result };
  }

  @Get('services/:serviceId')
  @Roles('admin', 'officer', 'clerk')
  async getServiceById(@TenantId() tenantId: string, @Param('serviceId') serviceId: string) {
    return { success: true, data: await this.producerService.getServiceById(tenantId, serviceId) };
  }

  @Put('services/:serviceId')
  @Roles('admin', 'officer')
  async updateService(
    @TenantId() tenantId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return { success: true, data: await this.producerService.updateService(tenantId, serviceId, dto) };
  }

  @Delete('services/:serviceId')
  @Roles('admin')
  async deleteService(@TenantId() tenantId: string, @Param('serviceId') serviceId: string) {
    return this.producerService.deleteService(tenantId, serviceId);
  }

  @Post('services/:serviceId/publish')
  @Roles('admin', 'officer')
  async publishService(@TenantId() tenantId: string, @Param('serviceId') serviceId: string) {
    return { success: true, data: await this.producerService.setServicePublished(tenantId, serviceId, true) };
  }

  @Post('services/:serviceId/unpublish')
  @Roles('admin', 'officer')
  async unpublishService(@TenantId() tenantId: string, @Param('serviceId') serviceId: string) {
    return { success: true, data: await this.producerService.setServicePublished(tenantId, serviceId, false) };
  }

  // Applications

  @Get('applications')
  @Roles('admin', 'officer', 'clerk')
  async getApplications(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.producerService.getApplications(
      tenantId,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, data: result };
  }

  @Get('applications/:applicationId')
  @Roles('admin', 'officer', 'clerk')
  async getApplicationById(@TenantId() tenantId: string, @Param('applicationId') applicationId: string) {
    return { success: true, data: await this.producerService.getApplicationById(tenantId, applicationId) };
  }

  @Patch('applications/:applicationId/status')
  @Roles('admin', 'officer', 'clerk')
  async updateApplicationStatus(
    @TenantId() tenantId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return { success: true, data: await this.producerService.updateApplicationStatus(tenantId, applicationId, dto.status, dto.stage) };
  }

  @Post('applications/:applicationId/assign')
  @Roles('admin', 'officer')
  async assignApplication(
    @TenantId() tenantId: string,
    @Param('applicationId') applicationId: string,
    @Body('officerId') officerId: string,
  ) {
    return { success: true, data: await this.producerService.assignApplication(tenantId, applicationId, officerId) };
  }

  // Analytics

  @Get('analytics')
  @Roles('admin', 'officer', 'clerk')
  async getTenantAnalytics(
    @TenantId() tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return { success: true, data: await this.producerService.getTenantAnalytics(tenantId, dateFrom, dateTo) };
  }

  @Get('analytics/services/:serviceId')
  @Roles('admin', 'officer', 'clerk')
  async getServiceAnalytics(
    @TenantId() tenantId: string,
    @Param('serviceId') serviceId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return { success: true, data: await this.producerService.getServiceAnalytics(tenantId, serviceId, dateFrom, dateTo) };
  }

  // Tenant Users

  @Get('users')
  @Roles('admin')
  async getTenantUsers(@TenantId() tenantId: string) {
    return { success: true, data: await this.producerService.getTenantUsers(tenantId) };
  }

  @Post('users')
  @Roles('admin')
  async createTenantUser(
    @TenantId() tenantId: string,
    @Body() body: { email: string; first_name?: string; last_name?: string; role: string; password: string },
  ) {
    return { success: true, data: await this.producerService.createTenantUser(tenantId, body) };
  }

  @Patch('users/:userId')
  @Roles('admin')
  async updateTenantUser(
    @TenantId() tenantId: string,
    @Param('userId') userId: string,
    @Body() body: { role?: string; active?: boolean; first_name?: string; last_name?: string },
  ) {
    return { success: true, data: await this.producerService.updateTenantUser(tenantId, userId, body) };
  }

  @Delete('users/:userId')
  @Roles('admin')
  async deleteTenantUser(
    @TenantId() tenantId: string,
    @Param('userId') userId: string,
    @CurrentUser() actor: any,
  ) {
    await this.producerService.deleteTenantUser(tenantId, userId, actor.id);
    return { success: true, message: 'User deactivated' };
  }

  // Settings

  @Get('settings')
  @Roles('admin', 'officer', 'clerk')
  async getTenantSettings(@TenantId() tenantId: string) {
    return { success: true, data: await this.producerService.getTenantSettings(tenantId) };
  }

  @Patch('settings')
  @Roles('admin')
  async updateTenantSettings(
    @TenantId() tenantId: string,
    @Body() body: { name?: string; logo?: string; primaryColor?: string; secondaryColor?: string; customDomain?: string },
  ) {
    return { success: true, data: await this.producerService.updateTenantSettings(tenantId, body) };
  }
}
