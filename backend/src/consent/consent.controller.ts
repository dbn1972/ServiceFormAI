import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConsentService } from './consent.service';
import { RequestConsentDto, AdminRevokeConsentDto } from './dto/request-consent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import type { ConsentStatus } from '../database/entities/consent-record.entity';

@Controller()
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  // ─── Consumer-facing endpoints ───────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('consumer/consent/request')
  async requestConsent(
    @Body() dto: RequestConsentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const record = await this.consentService.requestConsent(user.id, dto, this.getIp(req));
    return { success: true, data: record };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('consumer/consent/:consentId/grant')
  async grantConsent(
    @Param('consentId') consentId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const record = await this.consentService.grantConsent(consentId, user.id, this.getIp(req));
    return { success: true, data: record };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('consumer/consent/:consentId/deny')
  async denyConsent(
    @Param('consentId') consentId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const record = await this.consentService.denyConsent(consentId, user.id, this.getIp(req));
    return { success: true, data: record };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('consumer/consent/:consentId/revoke')
  async revokeConsent(
    @Param('consentId') consentId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const record = await this.consentService.revokeConsent(consentId, user.id, this.getIp(req));
    return { success: true, data: record };
  }

  /** Alias for revoke — more intuitive for consumer-facing UX */
  @UseGuards(JwtAuthGuard)
  @Patch('consumer/consent/:consentId/withdraw')
  async withdrawConsent(
    @Param('consentId') consentId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const record = await this.consentService.revokeConsent(consentId, user.id, this.getIp(req));
    return { success: true, data: record };
  }

  @UseGuards(JwtAuthGuard)
  @Get('consumer/consent/history')
  async getMyConsentHistory(@CurrentUser() user: any) {
    const records = await this.consentService.getConsumerConsentHistory(user.id);
    return { success: true, data: { records, count: records.length } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('consumer/consent/active')
  async getMyActiveConsents(@CurrentUser() user: any) {
    const records = await this.consentService.getConsumerActiveConsents(user.id);
    return { success: true, data: { records, count: records.length } };
  }

  // ─── Admin-facing endpoints ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'officer')
  @Get('producer/consent')
  async getTenantConsentRecords(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.consentService.getTenantConsentRecords(
      tenantId,
      status as ConsentStatus | undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'officer')
  @Get('producer/consent/stats')
  async getConsentStats(@TenantId() tenantId: string) {
    const stats = await this.consentService.getConsentStats(tenantId);
    return { success: true, data: stats };
  }

  /** Admin override revoke — for compliance/GDPR */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('producer/consent/:consentId/revoke')
  async adminRevokeConsent(
    @Param('consentId') consentId: string,
    @Body() dto: AdminRevokeConsentDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const record = await this.consentService.adminRevokeConsent(
      consentId,
      user.id,
      tenantId,
      dto.reason,
      this.getIp(req),
    );
    return { success: true, data: record };
  }

  /** GDPR right-to-erasure: bulk revoke all consents for a consumer */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('producer/consent/consumer/:consumerId')
  @HttpCode(HttpStatus.OK)
  async bulkRevokeConsumerConsents(
    @Param('consumerId') consumerId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.consentService.bulkRevokeByConsumer(
      consumerId,
      tenantId,
      user.id,
      'gdpr_erasure',
    );
    return { success: true, data: result };
  }

  /** Maintenance: expire stale consents (admin only) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'platform_admin')
  @Post('producer/consent/expire-stale')
  @HttpCode(HttpStatus.OK)
  async expireStaleConsents() {
    const result = await this.consentService.expireStaleConsents();
    return { success: true, data: result };
  }

  // ─── Shared helper ────────────────────────────────────────────────────────

  private getIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
