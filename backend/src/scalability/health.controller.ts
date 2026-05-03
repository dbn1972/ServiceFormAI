import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ScalabilityConfigService } from './scalability-config.service';
import { ScalabilityMetricsService } from './scalability-metrics.service';
import { QueueService } from './queue.service';
import { CacheService } from './cache.service';

@Controller()
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ScalabilityConfigService,
    private readonly metricsService: ScalabilityMetricsService,
    private readonly queueService: QueueService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('health')
  async health() {
    const dbHealthy = await this.checkDatabase();
    await this.queueService.captureMetricsSnapshot();
    const summary = this.metricsService.getSummary();
    return {
      status: dbHealthy ? 'ok' : 'degraded',
      database: dbHealthy ? 'up' : 'down',
      queue: summary.queue.availability,
      cache: this.configService.getConfig().cache.enabled
        ? summary.cache.availability
        : 'disabled',
      summary,
    };
  }

  @Get('ready')
  async ready() {
    const dbHealthy = await this.checkDatabase();
    return {
      status: dbHealthy ? 'ready' : 'not-ready',
      checks: {
        database: dbHealthy,
      },
    };
  }

  @Get('live')
  live() {
    return {
      status: 'alive',
      startedAt: this.metricsService.getSummary().startedAt,
    };
  }

  @Get('metrics')
  metrics() {
    return this.metricsService.getSummary();
  }

  @Get('readiness-score')
  async readinessScore() {
    const dbHealthy = await this.checkDatabase();
    const cacheHealthy = await this.cacheService.ping().then(() => true).catch(() => false);
    const summary = this.metricsService.getSummary();
    const config = this.configService.getConfig();
    const env = process.env;

    const categories: Record<string, { score: number; max: number; checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; detail?: string }> }> = {
      security: {
        score: 0,
        max: 30,
        checks: [
          {
            name: 'Secure JWT secrets',
            status: (env['JWT_SECRET'] && !env['JWT_SECRET'].includes('changeme')) ? 'pass' : 'fail',
          },
          {
            name: 'TLS / HTTPS enabled',
            status: env['TLS_ENABLED'] === 'true' ? 'pass' : 'warn',
            detail: 'Set TLS_ENABLED=true for production',
          },
          {
            name: 'CSRF protection',
            status: env['ENABLE_CSRF_PROTECTION'] === 'true' ? 'pass' : 'warn',
          },
          {
            name: 'Rate limiting',
            status: env['ENABLE_RATE_LIMITING'] === 'true' ? 'pass' : 'warn',
          },
        ],
      },
      data: {
        score: 0,
        max: 25,
        checks: [
          {
            name: 'PostgreSQL reachable',
            status: dbHealthy ? 'pass' : 'fail',
          },
          {
            name: 'Redis / Cache reachable',
            status: cacheHealthy ? 'pass' : 'warn',
          },
          {
            name: 'Automated backups configured',
            status: env['BACKUP_ENABLED'] === 'true' ? 'pass' : 'warn',
            detail: 'Set BACKUP_ENABLED=true and configure BACKUP_S3_BUCKET',
          },
        ],
      },
      availability: {
        score: 0,
        max: 20,
        checks: [
          {
            name: 'Application healthy',
            status: dbHealthy ? 'pass' : 'fail',
          },
          {
            name: 'Queue service operational',
            status: (summary?.queue?.availability === 'redis' || summary?.queue?.availability === 'database') ? 'pass' : 'warn',
          },
        ],
      },
      monitoring: {
        score: 0,
        max: 15,
        checks: [
          {
            name: 'Metrics collection enabled',
            status: env['ENABLE_METRICS'] === 'true' ? 'pass' : 'warn',
          },
          {
            name: 'Log level set',
            status: ['info', 'warn', 'error'].includes(env['LOG_LEVEL'] ?? '') ? 'pass' : 'warn',
          },
          {
            name: 'Error tracking (Sentry)',
            status: env['SENTRY_DSN'] ? 'pass' : 'warn',
            detail: 'Configure SENTRY_DSN for error tracking',
          },
        ],
      },
      compliance: {
        score: 0,
        max: 10,
        checks: [
          {
            name: 'DPDP Act 2023 compliance',
            status: env['DPDP_ACT_2023_ENABLED'] === 'true' ? 'pass' : 'warn',
          },
          {
            name: 'Cookie consent required',
            status: env['COOKIE_CONSENT_REQUIRED'] === 'true' ? 'pass' : 'warn',
          },
        ],
      },
    };

    // Calculate scores
    const scoreMap: Record<string, Record<number, number>> = {
      security: { 4: 10, 3: 10, 2: 5, 1: 5 }, // mapped per check index
    };
    const pointsPerCheck = {
      security: [10, 10, 5, 5],
      data: [10, 5, 10],
      availability: [10, 10],
      monitoring: [5, 5, 5],
      compliance: [5, 5],
    };

    let totalScore = 0;
    for (const [catKey, cat] of Object.entries(categories)) {
      const points = (pointsPerCheck as Record<string, number[]>)[catKey] ?? [];
      cat.checks.forEach((check, i) => {
        if (check.status === 'pass') {
          cat.score += points[i] ?? 0;
        }
      });
      totalScore += cat.score;
    }

    const grade =
      totalScore >= 90 ? 'EXCELLENT' :
      totalScore >= 75 ? 'GOOD' :
      totalScore >= 60 ? 'FAIR' : 'NEEDS_IMPROVEMENT';

    return {
      score: totalScore,
      maxScore: 100,
      grade,
      categories,
      generatedAt: new Date().toISOString(),
    };
  }

  private async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
