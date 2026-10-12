import { Writable } from 'node:stream';
import pg from 'pg';
import request from 'supertest';
import type { Permission } from '@flex/contracts';
import { createApp } from '../src/http/app';
import { setDatabase } from '../src/infrastructure/database/drizzle/client';
import { createRepositories } from '../src/infrastructure/database/drizzle/drizzle-unit-of-work';
import { createDatabaseReadinessCheck } from '../src/infrastructure/database/readiness';
import { createLogger } from '../src/infrastructure/logger/logger';
import { passwordHash } from '../src/infrastructure/security/password';
import {
  emailSender as configuredEmailSender,
  MemoryEmailSender,
} from '../src/infrastructure/email/email';
import { issueAccessCode } from '../src/modules/identity/access-code-issuer';
import type { AccessCodePurpose } from '../src/modules/identity/repositories/access-code.repository';
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

export function createTestApp() {
  const pool = new pg.Pool({
    connectionString: testDatabaseUrl,
    connectionTimeoutMillis: 1000,
  });
  const logs = createLogCapture();
  const logger = createLogger(
    { NODE_ENV: 'test', LOG_LEVEL: 'debug' },
    logs.stream,
  );
  const clock = new MutableClock();
  const emailSender = configuredEmailSender as MemoryEmailSender;
  emailSender.sent.length = 0;
  emailSender.failing = false;
  const hasher = passwordHash;
  setDatabase(pool);
  const app = createApp({
    logger,
    checkReadiness: createDatabaseReadinessCheck(pool),
    dashboardOrigin: DASHBOARD_ORIGIN,
    catalogOrigin: 'http://localhost:4321',
    authSecret: 'segredo-de-testes-do-clube-flex-com-tamanho-suficiente',
  });
  return { app, pool, logs, logger, clock, emailSender, hasher };
}

export type TestContext = ReturnType<typeof createTestApp>;

export async function resetDatabase(pool: pg.Pool): Promise<void> {
  await pool.query(
    'TRUNCATE lead_observations, lead_history, lead_consents, lead_contact_requests, leads, lead_sources, audit_events, access_codes, user_permissions, users, partners, categories, plans CASCADE',
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

export const ALL_CATALOG_PERMISSIONS: Permission[] = [
  'plans.view',
  'plans.manage',
  'categories.view',
  'categories.manage',
  'partners.view',
  'partners.create',
  'partners.update',
  'partners.publish',
  'partners.delete',
];

export interface SignedInSession {
  cookie: string;
  csrf: string;
}

/** Cria o usuário, autentica por HTTP e devolve o cookie e o token CSRF da sessão. */
export async function signIn(
  context: TestContext,
  seed: UserSeed = {},
): Promise<SignedInSession> {
  const username = seed.username ?? 'maria.silva';
  await seedUser(context, { password: STRONG_PASSWORD, ...seed, username });
  const login = await request(context.app)
    .post('/v1/auth/login')
    .set('origin', DASHBOARD_ORIGIN)
    .send({ username, password: STRONG_PASSWORD });
  const cookie = (login.headers['set-cookie'] as unknown as string[])[0]!.split(
    ';',
  )[0]!;
  return { cookie, csrf: 'não-utilizado' };
}

/** Emite um código pelas mesmas regras usadas pelos casos de uso. */
export async function seedAccessCode(
  context: TestContext,
  userId: string,
  purpose: AccessCodePurpose,
): Promise<string> {
  const { accessCodes } = createRepositories();
  return issueAccessCode(accessCodes, userId, purpose, context.clock.now());
}
