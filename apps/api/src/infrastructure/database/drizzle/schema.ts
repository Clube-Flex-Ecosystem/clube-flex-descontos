import { sql } from 'drizzle-orm';
import {
  boolean,
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

// ───────── Administração do catálogo (incremento 3) ─────────

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    // Nome sem acentos, caixa e espaços redundantes: chave de unicidade (RN-030).
    nameKey: text('name_key').notNull().unique(),
    // Identificador público estável (RN-040); não acompanha renomeações.
    slug: text('slug').notNull().unique(),
    status: text('status', { enum: ['active', 'inactive'] })
      .notNull()
      .default('active'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('plans_status_check', sql`${table.status} in ('active', 'inactive')`),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull().unique(),
    status: text('status', { enum: ['active', 'inactive'] })
      .notNull()
      .default('active'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'categories_status_check',
      sql`${table.status} in ('active', 'inactive')`,
    ),
  ],
);

export const partners = pgTable(
  'partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    // Nomes iguais são permitidos (RN-031); a chave serve apenas ao alerta de duplicidade.
    nameKey: text('name_key').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    usageInstructions: text('usage_instructions'),
    website: text('website'),
    featured: boolean('featured').notNull().default(false),
    generalCoupon: text('general_coupon'),
    status: text('status', { enum: ['draft', 'published', 'inactive'] })
      .notNull()
      .default('draft'),
    // Preenchido na primeira publicação; define se o registro ainda é excluível.
    firstPublishedAt: timestamp('first_published_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'partners_status_check',
      sql`${table.status} in ('draft', 'published', 'inactive')`,
    ),
    index('partners_name_key_idx').on(table.nameKey),
  ],
);

/** Identificadores públicos anteriores, preservados para o redirecionamento permanente. */
export const partnerSlugHistory = pgTable('partner_slug_history', {
  slug: text('slug').primaryKey(),
  partnerId: uuid('partner_id')
    .notNull()
    .references(() => partners.id, { onDelete: 'cascade' }),
  retiredAt: timestamp('retired_at', { withTimezone: true }).notNull(),
});

export const partnerCategories = pgTable(
  'partner_categories',
  {
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
  },
  (table) => [primaryKey({ columns: [table.partnerId, table.categoryId] })],
);

export const partnerUnits = pgTable(
  'partner_units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    name: text('name').notNull(),
    postalCode: text('postal_code').notNull(),
    street: text('street').notNull(),
    number: text('number').notNull(),
    complement: text('complement'),
    neighborhood: text('neighborhood').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    openingHours: text('opening_hours'),
    instructions: text('instructions'),
    status: text('status', { enum: ['active', 'inactive'] })
      .notNull()
      .default('active'),
  },
  (table) => [
    check(
      'partner_units_status_check',
      sql`${table.status} in ('active', 'inactive')`,
    ),
    index('partner_units_partner_id_idx').on(table.partnerId),
  ],
);

/** Contatos do parceiro (`unitId` nulo) ou de uma de suas unidades. */
export const partnerContacts = pgTable(
  'partner_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id').references(() => partnerUnits.id, {
      onDelete: 'cascade',
    }),
    position: integer('position').notNull(),
    type: text('type', { enum: ['phone', 'whatsapp'] }).notNull(),
    value: text('value').notNull(),
    label: text('label'),
  },
  (table) => [
    check(
      'partner_contacts_type_check',
      sql`${table.type} in ('phone', 'whatsapp')`,
    ),
    index('partner_contacts_partner_id_idx').on(table.partnerId),
  ],
);

export const partnerBenefits = pgTable(
  'partner_benefits',
  {
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),
    discountPercentage: integer('discount_percentage').notNull(),
    coupon: text('coupon'),
  },
  (table) => [
    primaryKey({ columns: [table.partnerId, table.planId] }),
    check(
      'partner_benefits_percentage_check',
      sql`${table.discountPercentage} between 1 and 100`,
    ),
  ],
);

// ─── Captação pública (incremento 5) ───

export const leadSources = pgTable('lead_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  kind: text('kind', { enum: ['automatic', 'manual'] }).notNull(),
  active: boolean('active').notNull().default(true),
  protected: boolean('protected').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    whatsapp: text('whatsapp').notNull().unique(),
    email: text('email'),
    stage: text('stage').notNull().default('new'),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => leadSources.id),
    assigneeId: uuid('assignee_id').references(() => users.id),
    hasPendingInterest: boolean('has_pending_interest')
      .notNull()
      .default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('leads_source_id_idx').on(table.sourceId)],
);

export const leadContactRequests = pgTable(
  'lead_contact_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id),
    submittedName: text('submitted_name').notNull(),
    submittedWhatsapp: text('submitted_whatsapp').notNull(),
    submittedEmail: text('submitted_email'),
    source: text('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('lead_contact_requests_lead_id_idx').on(table.leadId)],
);

export const leadConsents = pgTable(
  'lead_consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id),
    contactRequestId: uuid('contact_request_id')
      .notNull()
      .references(() => leadContactRequests.id),
    version: text('version').notNull(),
    source: text('source').notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('lead_consents_lead_id_idx').on(table.leadId)],
);

export const leadHistory = pgTable(
  'lead_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id),
    type: text('type').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    data: jsonb('data'),
  },
  (table) => [index('lead_history_lead_id_idx').on(table.leadId)],
);
