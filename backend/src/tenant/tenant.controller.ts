import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto, SuspendTenantDto } from './dto/tenant.dto';
import { TenantStaffAuthGuard } from '../auth/guards/tenant-staff-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('platform/tenants')
@UseGuards(TenantStaffAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // ─── Platform-admin: full CRUD ─────────────────────────────────────────────

  @Post()
  @Roles('platform_admin')
  async create(@Body() dto: CreateTenantDto, @CurrentUser() user: any) {
    const tenant = await this.tenantService.createTenant(dto, user.id);
    return { success: true, data: tenant };
  }

  @Get()
  @Roles('platform_admin')
  async list(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.tenantService.listTenants(
      status,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, data: result };
  }

  @Get(':tenantId')
  @Roles('platform_admin')
  async getById(@Param('tenantId') tenantId: string) {
    const tenant = await this.tenantService.getTenant(tenantId);
    return { success: true, data: tenant };
  }

  @Patch(':tenantId')
  @Roles('platform_admin')
  async updateById(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: any,
  ) {
    const tenant = await this.tenantService.updateTenant(tenantId, dto, user.id, user.role);
    return { success: true, data: tenant };
  }

  // ─── Lifecycle transitions ─────────────────────────────────────────────────

  @Post(':tenantId/activate')
  @Roles('platform_admin')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('tenantId') tenantId: string, @CurrentUser() user: any) {
    const tenant = await this.tenantService.activateTenant(tenantId, user.id);
    return { success: true, data: tenant };
  }

  @Post(':tenantId/suspend')
  @Roles('platform_admin')
  @HttpCode(HttpStatus.OK)
  async suspend(
    @Param('tenantId') tenantId: string,
    @Body() dto: SuspendTenantDto,
    @CurrentUser() user: any,
  ) {
    const tenant = await this.tenantService.suspendTenant(tenantId, dto.reason, user.id);
    return { success: true, data: tenant };
  }

  @Post(':tenantId/offboard')
  @Roles('platform_admin')
  @HttpCode(HttpStatus.OK)
  async offboard(@Param('tenantId') tenantId: string, @CurrentUser() user: any) {
    const tenant = await this.tenantService.offboardTenant(tenantId, user.id);
    return { success: true, data: tenant };
  }

  // ─── Webhook test ──────────────────────────────────────────────────────────

  @Post(':tenantId/webhook/test')
  @Roles('platform_admin')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Param('tenantId') tenantId: string) {
    const result = await this.tenantService.sendTestWebhook(tenantId);
    return { success: true, data: result };
  }

  // ─── Tenant admin: own-config endpoints ───────────────────────────────────

  @Get('self/config')
  @Roles('admin')
  async getSelfConfig(@TenantId() tenantId: string) {
    const tenant = await this.tenantService.getTenant(tenantId);
    return { success: true, data: tenant };
  }

  @Patch('self/config')
  @Roles('admin')
  async updateSelfConfig(
    @TenantId() tenantId: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: any,
  ) {
    // Tenant admins cannot change their own status
    const { status: _ignored, ...safeDto } = dto;
    const tenant = await this.tenantService.updateTenant(tenantId, safeDto, user.id, user.role);
    return { success: true, data: tenant };
  }

  @Get('self/auth-policy')
  @Roles('admin', 'officer', 'clerk')
  async getAuthPolicy(@TenantId() tenantId: string) {
    const policy = await this.tenantService.getEffectiveAuthPolicy(tenantId);
    return { success: true, data: policy };
  }

  @Get('self/consent-policy')
  @Roles('admin', 'officer', 'clerk')
  async getConsentPolicy(@TenantId() tenantId: string) {
    const policy = await this.tenantService.getEffectiveConsentPolicy(tenantId);
    return { success: true, data: policy };
  }

  @Get('self/feature-flags')
  @Roles('admin', 'officer', 'clerk')
  async getFeatureFlags(@TenantId() tenantId: string) {
    const flags = await this.tenantService.getEffectiveFeatureFlags(tenantId);
    return { success: true, data: flags };
  }
}
