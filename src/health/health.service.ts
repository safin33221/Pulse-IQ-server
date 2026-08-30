import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async checkDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async checkRedis(): Promise<boolean> {
    try {
      const key = 'health:redis';

      await this.cache.set(key, 'ok', 10_000);

      const value = await this.cache.get<string>(key);

      await this.cache.del(key);

      return value === 'ok';
    } catch (error: unknown) {
      this.logger.warn(
        `Redis health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return false;
    }
  }
}
