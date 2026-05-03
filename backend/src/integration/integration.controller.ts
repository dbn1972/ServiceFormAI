import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { UpsertIntegrationDto } from './dto/upsert-integration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('producer/integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get()
  async list(@TenantId() tenantId: string) {
    const integrations = await this.integrationService.listIntegrations(tenantId);
    return { success: true, data: { integrations, count: integrations.length } };
  }

  @Get(':provider')
  async get(@TenantId() tenantId: string, @Param('provider') provider: string) {
    const integration = await this.integrationService.getIntegration(tenantId, provider);
    return { success: true, data: integration };
  }

  @Put(':provider')
  async upsert(
    @TenantId() tenantId: string,
    @Param('provider') provider: string,
    @Body() dto: UpsertIntegrationDto,
    @CurrentUser() user: any,
  ) {
    // Ensure the path param and body agree on provider
    dto.provider = provider;
    const integration = await this.integrationService.upsertIntegration(
      tenantId,
      dto,
      user.id,
      user.role,
    );
    return { success: true, data: integration };
  }
}
