import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NewsModule } from './modules/news/news.module';
import { UsersModule } from './modules/users/users.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { HealthModule } from './health/health.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [createKeyv(process.env.REDIS_URL ?? 'redis://localhost:6379')],
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 60,
        },
      ],
    }),

    ScheduleModule.forRoot(),

    PrismaModule,
    AuthModule,
    UsersModule,
    NewsModule,
    HealthModule,
    CategoryModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
