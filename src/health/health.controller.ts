import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();

    return {
      status: database ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: {
        database: database ? 'up' : 'down',
        redis: redis ? 'up' : 'down',
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.healthService.checkDatabase();
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    return this.healthService.checkRedis();
  }
}
