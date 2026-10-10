import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// O esquema relacional cresce junto com os incrementos que o consomem.

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name').notNull(),
    // Sempre em minúsculas; nunca reutilizado (RN-020), pois contas não são excluídas.
    username: text('username').notNull().unique(),
    email: text('email'),
    status: text('status', { enum: ['active', 'inactive'] })
      .notNull()
      .default('active'),
    // Ausente enquanto a conta aguarda ativação.
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('users_status_check', sql`${table.status} in ('active', 'inactive')`),
    check(
      'users_username_lowercase',
      sql`${table.username} = lower(${table.username})`,
    ),
  ],
);

export const userPermissions = pgTable(
  'user_permissions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    permission: text('permission').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    grantedBy: uuid('granted_by').references(() => users.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.permission] })],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    // Somente o hash do identificador opaco é persistido (ADR-0004).
    tokenHash: text('token_hash').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    lastActivityAt: timestamp('last_activity_at', {
      withTimezone: true,
    }).notNull(),
    // Limite absoluto de duração.
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export const accessCodes = pgTable(
  'access_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    purpose: text('purpose', { enum: ['activation', 'recovery'] }).notNull(),
    // O código tem alta entropia e é guardado apenas como hash.
    codeHash: text('code_hash').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    usedAt: timestamp('used_at', { withTimezone: true }),
    invalidatedAt: timestamp('invalidated_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'access_codes_purpose_check',
      sql`${table.purpose} in ('activation', 'recovery')`,
    ),
    index('access_codes_user_purpose_idx').on(table.userId, table.purpose),
  ],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    action: text('action').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    // Ator técnico (`system/bootstrap`) não possui usuário associado.
    actorUserId: uuid('actor_user_id').references(() => users.id),
    actorLabel: text('actor_label').notNull(),
    targetType: text('target_type').notNull(),
    targetId: uuid('target_id'),
    targetLabel: text('target_label'),
    before: jsonb('before'),
    after: jsonb('after'),
  },
  (table) => [index('audit_events_occurred_at_idx').on(table.occurredAt)],
);
