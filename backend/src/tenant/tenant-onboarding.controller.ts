import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TenantOnboardingDto } from './dto/tenant-onboarding.dto';
import { TenantOnboardingService } from './tenant-onboarding.service';

@Controller('tenant')
export class TenantOnboardingController {
  constructor(private readonly onboardingService: TenantOnboardingService) {}

  @Post('onboarding')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async submit(@Body() dto: TenantOnboardingDto) {
    const data = await this.onboardingService.submit(dto);
    return { success: true, data };
  }
}