import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    url: env('DATABASE_URL'),
  },
});
