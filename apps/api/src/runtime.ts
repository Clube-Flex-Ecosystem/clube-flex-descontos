import type { Logger } from 'pino';
import { createCompositionRoot } from './composition-root';
import type { Env } from './config/env';
import { createPool } from './infrastructure/database/drizzle/client';
import {
  ResendEmailSender,
  UnavailableEmailSender,
} from './infrastructure/email/resend-email-sender';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';

/** Conecta a configuração de ambiente às implementações concretas de produção. */
export function createRuntime(env: Env, logger: Logger) {
  const pool = createPool(env.DATABASE_URL);
  const emailSender =
    env.RESEND_API_KEY && env.EMAIL_FROM
      ? new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM)
      : new UnavailableEmailSender();

  const root = createCompositionRoot({
    pool,
    hasher: new Argon2PasswordHasher({
      memory: env.ARGON2_MEMORY_KIB,
      passes: env.ARGON2_PASSES,
      parallelism: env.ARGON2_PARALLELISM,
    }),
    emailSender,
    clock: { now: () => new Date() },
    logger,
    dashboardOrigin: env.DASHBOARD_ORIGIN,
  });

  return { pool, root };
}
