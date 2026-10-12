import { loadEnv } from './config/env';
import { createApp } from './http/app';
import { createDatabaseReadinessCheck } from './infrastructure/database/readiness';
import { createLogger } from './infrastructure/logger/logger';
import {
  createPool,
  setDatabase,
} from './infrastructure/database/drizzle/client';
import { setServices } from './infrastructure/services';
import {
  ResendEmailSender,
  UnavailableEmailSender,
} from './infrastructure/email/resend-email-sender';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';

const env = loadEnv();
const logger = createLogger(env);
const pool = createPool(env.DATABASE_URL);
setDatabase(pool);
setServices({
  clock: { now: () => new Date() },
  hasher: new Argon2PasswordHasher({
    memory: env.ARGON2_MEMORY_KIB,
    passes: env.ARGON2_PASSES,
    parallelism: env.ARGON2_PARALLELISM,
  }),
  emailSender:
    env.RESEND_API_KEY && env.EMAIL_FROM
      ? new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM)
      : new UnavailableEmailSender(),
  logger,
});

const app = createApp({
  logger,
  checkReadiness: createDatabaseReadinessCheck(pool),
  dashboardOrigin: env.DASHBOARD_ORIGIN,
  catalogOrigin: env.CATALOG_ORIGIN,
  authSecret: env.AUTH_SECRET,
  trustProxyHops: env.TRUST_PROXY_HOPS,
});

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API iniciada');
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Encerrando API');
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
