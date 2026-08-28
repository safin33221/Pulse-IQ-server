import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    super({
      adapter,
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();

    this.logger.log('Database connection closed');
  }
}
