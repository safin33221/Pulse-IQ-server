import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Use Neon's direct URL for Prisma CLI commands. DATABASE_URL remains the
    // pooled runtime URL; the fallback keeps the local setup unchanged.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },
});
