import { z } from 'zod';
import { permissionSchema, type Permission } from './permissions';
import { requiredText } from './text';

// ─── Usuários e permissões (RF-015, RF-016) ───

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 80;

/** Comprimento do identificador de acesso: minúsculas, dígitos, ponto, hífen e sublinhado. */
const usernameSchema = z
  .string({ error: 'REQUIRED' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'REQUIRED' })
  .refine(
    (value) =>
      value.length >= USERNAME_MIN_LENGTH &&
      value.length <= USERNAME_MAX_LENGTH &&
      /^[a-z0-9][a-z0-9._-]*$/.test(value),
    { error: 'INVALID_USERNAME' },
  );

const optionalEmail = z
  .string()
  .trim()
  .max(254, { error: 'INVALID_VALUE' })
  .refine((value) => value === '' || z.email().safeParse(value).success, {
    error: 'INVALID_EMAIL',
  })
  .transform((value) => value || undefined)
  .optional();

export const createUserRequestSchema = z.object({
  fullName: requiredText(120),
  email: optionalEmail,
});
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

/** Edição de nome completo, nome de usuário e e-mail; o e-mail em branco o remove. */
export const updateUserRequestSchema = z.object({
  fullName: requiredText(120),
  username: usernameSchema,
  email: optionalEmail,
});
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const accessCodePurposeSchema = z.enum(['activation', 'recovery']);
export type AccessCodePurposeValue = z.infer<typeof accessCodePurposeSchema>;
export const issueAccessCodeRequestSchema = z.object({
  purpose: accessCodePurposeSchema,
});
export type IssueAccessCodeRequest = z.infer<
  typeof issueAccessCodeRequestSchema
>;

export const replacePermissionsRequestSchema = z.object({
  permissions: z.array(permissionSchema),
});
export type ReplacePermissionsRequest = z.infer<
  typeof replacePermissionsRequestSchema
>;

export type UserStatus = 'active' | 'inactive';
export type UserAccessStatus =
  'pendingActivation' | 'active' | 'passwordChangeRequired';

export interface AdminUser {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  status: UserStatus;
  accessStatus: UserAccessStatus;
  permissions: Permission[];
  version: number;
  deleted: false;
  /** Presentes somente na resposta que emitiu o código; nunca persistidas em claro. */
  accessCodeDelivery?: 'email' | 'manual';
  accessCode?: string;
  accessCodeExpiresAt?: string;
  warnings?: 'EMAIL_DELIVERY_FAILED'[];
}

/** Mesma validade usada pela API para códigos de acesso (ADR-0004). */
export const ACCESS_CODE_VALIDITY_MINUTES = 30;

export interface PermissionCatalogEntry {
  id: Permission;
  area: string;
  label: string;
}

/** Áreas e rótulos do catálogo fixo, na ordem exibida pelo dashboard. */
export const permissionAreas: readonly {
  area: string;
  items: readonly { id: Permission; label: string }[];
}[] = [
  {
    area: 'Leads',
    items: [
      { id: 'leads.view-own', label: 'Visualizar próprios' },
      { id: 'leads.view-all', label: 'Visualizar todos' },
      { id: 'leads.create', label: 'Criar' },
      { id: 'leads.update', label: 'Editar' },
      { id: 'leads.change-stage', label: 'Alterar etapa' },
      { id: 'leads.assign', label: 'Atribuir e redistribuir' },
      { id: 'leads.delete', label: 'Excluir ou anonimizar' },
    ],
  },
  {
    area: 'Parceiros',
    items: [
      { id: 'partners.view', label: 'Visualizar' },
      { id: 'partners.create', label: 'Criar' },
      { id: 'partners.update', label: 'Editar' },
      { id: 'partners.publish', label: 'Publicar e desativar' },
      { id: 'partners.delete', label: 'Excluir registros elegíveis' },
    ],
  },
  {
    area: 'Origens',
    items: [
      { id: 'sources.view', label: 'Visualizar' },
      { id: 'sources.manage', label: 'Administrar' },
    ],
  },
  {
    area: 'Planos',
    items: [
      { id: 'plans.view', label: 'Visualizar' },
      { id: 'plans.manage', label: 'Administrar' },
    ],
  },
  {
    area: 'Categorias',
    items: [
      { id: 'categories.view', label: 'Visualizar' },
      { id: 'categories.manage', label: 'Administrar' },
    ],
  },
  {
    area: 'Usuários',
    items: [
      { id: 'users.view', label: 'Visualizar' },
      { id: 'users.manage', label: 'Criar e editar' },
      { id: 'users.set-status', label: 'Ativar e desativar' },
      { id: 'users.reset-access', label: 'Redefinir acesso' },
    ],
  },
  {
    area: 'Permissões',
    items: [
      { id: 'permissions.view', label: 'Visualizar' },
      { id: 'permissions.manage', label: 'Administrar' },
    ],
  },
  {
    area: 'Auditoria',
    items: [{ id: 'audit.view', label: 'Visualizar histórico administrativo' }],
  },
];

/** Capacidades que, juntas, definem um administrador de usuários e permissões (RN-021). */
export const administratorPermissions = [
  'users.manage',
  'permissions.manage',
] as const satisfies readonly Permission[];

export function isAdministrator(granted: readonly Permission[]): boolean {
  return administratorPermissions.every((permission) =>
    granted.includes(permission),
  );
}

// ─── Auditoria administrativa (RNF-007) ───

export const auditActions = [
  'user.created',
  'user.updated',
  'user.activated',
  'user.deactivated',
  'user.access-code.issued',
  'user.permissions.updated',
  'lead.deleted',
  'lead.anonymized',
] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditActionLabels: Record<AuditAction, string> = {
  'user.created': 'Usuário criado',
  'user.updated': 'Dados do usuário alterados',
  'user.activated': 'Conta reativada',
  'user.deactivated': 'Conta desativada',
  'user.access-code.issued': 'Código de acesso emitido',
  'user.permissions.updated': 'Permissões alteradas',
  'lead.deleted': 'Lead excluído',
  'lead.anonymized': 'Lead anonimizado',
};

export const AUDIT_DEFAULT_PAGE_SIZE = 50;
export const AUDIT_MAX_PAGE_SIZE = 100;

const optionalDate = z.iso
  .datetime({ offset: true, error: 'INVALID_VALUE' })
  .optional();

export const auditQuerySchema = z.object({
  page: z.coerce
    .number({ error: 'INVALID_VALUE' })
    .int({ error: 'INVALID_VALUE' })
    .min(1, { error: 'INVALID_VALUE' })
    .default(1),
  pageSize: z.coerce
    .number({ error: 'INVALID_VALUE' })
    .int({ error: 'INVALID_VALUE' })
    .min(1, { error: 'INVALID_VALUE' })
    .max(AUDIT_MAX_PAGE_SIZE, { error: 'INVALID_VALUE' })
    .default(AUDIT_DEFAULT_PAGE_SIZE),
  actorId: z.uuid({ error: 'INVALID_VALUE' }).optional(),
  action: z.string().trim().min(1).max(80).optional(),
  targetType: z.string().trim().min(1).max(40).optional(),
  targetId: z.uuid({ error: 'INVALID_VALUE' }).optional(),
  occurredFrom: optionalDate,
  occurredTo: optionalDate,
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;

export interface AuditEvent {
  id: string;
  action: string;
  occurredAt: string;
  actor: { id?: string; username: string };
  target: { type: string; id?: string; label?: string };
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AuditEventPage {
  items: AuditEvent[];
  page: number;
  pageSize: number;
  total: number;
}

// ─── Exclusão ou anonimização de lead (RNF-008, UC-022) ───

/** Tipos de evento criados na entrada do lead; não representam histórico operacional. */
const intakeEventTypes = new Set(['lead.created', 'contact-request.received']);

export type LeadRemovalOutcome = 'delete' | 'anonymize';

/**
 * Um lead só é excluído quando nada operacional precisa ser preservado: nenhuma observação
 * e nenhum evento além do registro de entrada. A API é a autoridade; o dashboard usa a
 * mesma regra apenas para descrever o efeito antes da confirmação.
 */
export function leadRemovalOutcome(input: {
  observationCount: number;
  eventTypes: readonly string[];
}): LeadRemovalOutcome {
  const operational = input.eventTypes.some(
    (type) => !intakeEventTypes.has(type),
  );
  return input.observationCount > 0 || operational ? 'anonymize' : 'delete';
}
