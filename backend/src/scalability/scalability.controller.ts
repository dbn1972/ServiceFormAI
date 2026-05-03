import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ScalabilityConfig, ScalabilityConfigService } from './scalability-config.service';
import { ScalabilityMetricsService } from './scalability-metrics.service';
import { QueueService } from './queue.service';

@Controller('admin/scalability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ScalabilityController {
  constructor(
    private readonly configService: ScalabilityConfigService,
    private readonly metricsService: ScalabilityMetricsService,
    private readonly queueService: QueueService,
  ) {}

  @Get('summary')
  async getSummary() {
    await this.queueService.captureMetricsSnapshot();
    return {
      success: true,
      data: {
        summary: this.metricsService.getSummary(),
        config: this.configService.getConfig(),
      },
    };
  }

  @Get('config')
  getConfig() {
    return {
      success: true,
      data: this.configService.getConfig(),
    };
  }

  @Put('config')
  updateConfig(@Body() config: Partial<ScalabilityConfig>) {
    return {
      success: true,
      data: this.configService.updateConfig(config),
      message: 'Scalability configuration updated in memory.',
    };
  }

  @Get('violations')
  getViolations() {
    return {
      success: true,
      data: {
        violations: this.metricsService.getViolations(),
      },
    };
  }

  @Post('queue/pause')
  async pauseConsumers() {
    await this.queueService.captureMetricsSnapshot();
    return {
      success: true,
      data: this.queueService.pauseConsumers(),
      message: 'Queue consumers marked as paused.',
    };
  }

  @Post('queue/resume')
  async resumeConsumers() {
    await this.queueService.captureMetricsSnapshot();
    return {
      success: true,
      data: this.queueService.resumeConsumers(),
      message: 'Queue consumers marked as resumed.',
    };
  }

  @Post('queue/retry-failed')
  async retryFailedMessages() {
    return {
      success: true,
      data: await this.queueService.retryFailedMessages(),
    };
  }

  @Get('export')
  async exportAuditData(@Res() res: Response) {
    await this.queueService.captureMetricsSnapshot();
    const payload = {
      exportedAt: new Date().toISOString(),
      summary: this.metricsService.getSummary(),
      config: this.configService.getConfig(),
      violations: this.metricsService.getViolations(),
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="scalability-audit-${new Date().toISOString().split('T')[0]}.json"`,
    );
    res.send(JSON.stringify(payload, null, 2));
  }
}
