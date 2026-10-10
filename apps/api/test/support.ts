import { Writable } from 'node:stream';
import pg from 'pg';
import type { Permission } from '@flex/contracts';
import { createCompositionRoot } from '../src/composition-root';
import { createApp } from '../src/http/app';
import { createAuthRateLimiters } from '../src/http/middlewares/rate-limit.middleware';
import { createDatabase } from '../src/infrastructure/database/drizzle/client';
import { createRepositories } from '../src/infrastructure/database/drizzle/drizzle-unit-of-work';
import { createDatabaseReadinessCheck } from '../src/infrastructure/database/readiness';
import { createLogger } from '../src/infrastructure/logger/logger';
import { Argon2PasswordHasher } from '../src/infrastructure/security/argon2-password-hasher';
import { issueAccessCode } from '../src/modules/identity/access-code-issuer';
import type { AccessCodePurpose } from '../src/modules/identity/repositories/access-code.repository.types';
import type {
  Clock,
  EmailMessage,
  EmailSender,
} from '../src/modules/identity/services.types';
import { testDatabaseUrl } from './database';

export const DASHBOARD_ORIGIN = 'http://localhost:5173';
export const STRONG_PASSWORD = 'uma frase longa e segura de 2026';

/** Captura as linhas JSON emitidas pelo logger. */
export function createLogCapture() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(...chunk.toString().split('\n').filter(Boolean));
      callback();
    },
  });
  return {
    stream,
    lines,
    entries: () => lines.map((line) => JSON.parse(line)),
  };
}

/** Relógio controlável para expiração de sessões e códigos. */
export class MutableClock implements Clock {
  private offsetMs = 0;
  now(): Date {
    return new Date(Date.now() + this.offsetMs);
  }
  advance(ms: number): void {
    this.offsetMs += ms;
  }
}

export class FakeEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  failing = false;

  async send(message: EmailMessage): Promise<void> {
    if (this.failing) throw new Error('falha simulada do provedor');
    this.sent.push(message);
  }

  /** Último código de acesso enviado para o destinatário. */
  lastCodeFor(to: string): string | undefined {
    const message = [...this.sent].reverse().find((m) => m.to === to);
    return message?.text.match(/[0-9A-Z]{4}(?:-[0-9A-Z]{4}){3}/)?.[0];
  }
}

export function createTestApp(databaseUrl = testDatabaseUrl) {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 1000,
  });
  const logs = createLogCapture();
  const logger = createLogger(
    { NODE_ENV: 'test', LOG_LEVEL: 'debug' },
    logs.stream,
  );
  const clock = new MutableClock();
  const emailSender = new FakeEmailSender();
  // Parâmetros mínimos: a suíte exercita o fluxo, não o custo do Argon2id.
  const hasher = new Argon2PasswordHasher({
    memory: 64,
    passes: 1,
    parallelism: 1,
  });
  const root = createCompositionRoot({
    pool,
    hasher,
    emailSender,
    clock,
    logger,
    dashboardOrigin: DASHBOARD_ORIGIN,
  });
  const app = createApp({
    logger,
    checkReadiness: createDatabaseReadinessCheck(pool),
    identity: root.identity,
    allowedOrigins: [DASHBOARD_ORIGIN],
    limiters: createAuthRateLimiters(),
  });
  return { app, pool, logs, logger, root, clock, emailSender, hasher };
}

export type TestContext = ReturnType<typeof createTestApp>;

export async function resetDatabase(pool: pg.Pool): Promise<void> {
  await pool.query(
    'TRUNCATE audit_events, access_codes, sessions, user_permissions, users CASCADE',
  );
}

interface UserSeed {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  status?: 'active' | 'inactive';
  permissions?: Permission[];
}

/** Cria um usuário diretamente no banco, com a senha informada já definida. */
export async function seedUser(context: TestContext, seed: UserSeed = {}) {
  const username = seed.username ?? 'maria.silva';
  const passwordHash = seed.password
    ? await context.hasher.hash(seed.password)
    : null;
  const { rows } = await context.pool.query<{ id: string }>(
    `INSERT INTO users (full_name, username, email, status, password_hash)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      seed.fullName ?? 'Maria Silva',
      username,
      seed.email ?? null,
      seed.status ?? 'active',
      passwordHash,
    ],
  );
  const id = rows[0]!.id;
  for (const permission of seed.permissions ?? []) {
    await context.pool.query(
      'INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2)',
      [id, permission],
    );
  }
  return { id, username };
}

/** Emite um código pelas mesmas regras usadas pelos casos de uso. */
export async function seedAccessCode(
  context: TestContext,
  userId: string,
  purpose: AccessCodePurpose,
): Promise<string> {
  const { accessCodes } = createRepositories(createDatabase(context.pool));
  return issueAccessCode(accessCodes, userId, purpose, context.clock.now());
}
