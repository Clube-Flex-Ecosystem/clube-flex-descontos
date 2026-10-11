import { z } from 'zod';
import type { FieldErrorCode } from './field-errors';
import { optionalText, requiredText } from './text';

/** Estados do catálogo (domain-model): parceiro em três estados; demais itens ativos ou não. */
export const partnerStatuses = ['draft', 'published', 'inactive'] as const;
export const partnerStatusSchema = z.enum(partnerStatuses);
export type PartnerStatus = z.infer<typeof partnerStatusSchema>;

export const activeStatuses = ['active', 'inactive'] as const;
export const activeStatusSchema = z.enum(activeStatuses);
export type ActiveStatus = z.infer<typeof activeStatusSchema>;

export const contactTypes = ['phone', 'whatsapp'] as const;
export const contactTypeSchema = z.enum(contactTypes);
export type ContactType = z.infer<typeof contactTypeSchema>;

export const partnerWarningSchema = z.enum(['POSSIBLE_DUPLICATE_PARTNER']);
export type PartnerWarning = z.infer<typeof partnerWarningSchema>;

export const NAME_MAX = 120;
export const SLUG_MIN = 3;
export const SLUG_MAX = 120;

// ───────── Normalizações compartilhadas ─────────

/**
 * Chave de unicidade de nomes (RN-030, RN-031): sem acentos, sem diferenciar maiúsculas
 * e com espaços internos colapsados.
 */
export function normalizeNameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza um telefone ou WhatsApp brasileiro para E.164 (RN-032). Aceita entradas com ou
 * sem o código do país; retorna `null` quando o DDD ou o número forem inválidos.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!/^[+\d\s().-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, '');

  let national: string;
  if (trimmed.startsWith('+')) {
    if (!digits.startsWith('55')) return null;
    national = digits.slice(2);
  } else if (
    digits.startsWith('55') &&
    (digits.length === 12 || digits.length === 13)
  ) {
    national = digits.slice(2);
  } else {
    national = digits;
  }

  if (national.length !== 10 && national.length !== 11) return null;
  const areaCode = national.slice(0, 2);
  if (areaCode[0] === '0' || areaCode[1] === '0') return null;
  const subscriber = national.slice(2);
  if (subscriber.length === 9 && subscriber[0] !== '9') return null;
  if (subscriber.length === 8 && !/^[2-5]/.test(subscriber)) return null;
  return `+55${national}`;
}

/** Exibição amigável de um número já normalizado: `+55 21 99999-9999`. */
export function formatPhone(value: string): string {
  const match = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(value);
  return match ? `+55 ${match[1]} ${match[2]}-${match[3]}` : value;
}

export function normalizePostalCode(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  return digits.length === 8 && /^[\d\s.-]+$/.test(input.trim())
    ? digits
    : null;
}

export function formatPostalCode(value: string): string {
  return /^\d{8}$/.test(value)
    ? `${value.slice(0, 5)}-${value.slice(5)}`
    : value;
}

/** `https?://` com endereço interpretável (RN-033). */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const slugPattern = /^[a-z0-9-]+$/;

/** Identificador público: minúsculas, números e hífens, de 3 a 120 caracteres. */
export function isValidSlug(value: string): boolean {
  return (
    value.length >= SLUG_MIN &&
    value.length <= SLUG_MAX &&
    slugPattern.test(value)
  );
}

// ───────── Campos reutilizáveis ─────────

const nameSchema = requiredText(NAME_MAX);

const slugSchema = z
  .string({ error: 'REQUIRED' })
  .trim()
  .min(1, { error: 'REQUIRED' })
  .refine(isValidSlug, { error: 'INVALID_SLUG' });

const phoneSchema = z
  .string({ error: 'REQUIRED' })
  .trim()
  .min(1, { error: 'REQUIRED' })
  .transform((value, context) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      context.addIssue({ code: 'custom', message: 'INVALID_PHONE_NUMBER' });
      return z.NEVER;
    }
    return normalized;
  });

const websiteSchema = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  z
    .string()
    .trim()
    .max(2048, { error: 'INVALID_VALUE' })
    .refine(isHttpUrl, { error: 'INVALID_URL' })
    .optional(),
);

const postalCodeSchema = z
  .string({ error: 'REQUIRED' })
  .trim()
  .min(1, { error: 'REQUIRED' })
  .transform((value, context) => {
    const normalized = normalizePostalCode(value);
    if (!normalized) {
      context.addIssue({ code: 'custom', message: 'INVALID_POSTAL_CODE' });
      return z.NEVER;
    }
    return normalized;
  });

const stateSchema = z
  .string({ error: 'REQUIRED' })
  .trim()
  .min(1, { error: 'REQUIRED' })
  .transform((value) => value.toUpperCase())
  .refine((value) => value === 'RJ', { error: 'INVALID_STATE' });

const percentageSchema = z
  .number({ error: 'REQUIRED' })
  .int({ error: 'INVALID_PERCENTAGE' })
  .min(1, { error: 'INVALID_PERCENTAGE' })
  .max(100, { error: 'INVALID_PERCENTAGE' });

// ───────── Planos e categorias ─────────

export const createPlanRequestSchema = z.object({
  name: nameSchema,
  /** Gerado a partir do nome quando omitido; imutável depois da criação. */
  slug: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    slugSchema.optional(),
  ),
});
export type CreatePlanRequest = z.infer<typeof createPlanRequestSchema>;

export const updatePlanRequestSchema = z.object({ name: nameSchema });
export type UpdatePlanRequest = z.infer<typeof updatePlanRequestSchema>;

export const categoryRequestSchema = z.object({ name: nameSchema });
export type CategoryRequest = z.infer<typeof categoryRequestSchema>;

export const planSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  status: activeStatusSchema,
  version: z.number().int(),
  deleted: z.boolean(),
});
export type Plan = z.infer<typeof planSchema>;

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: activeStatusSchema,
  version: z.number().int(),
  deleted: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;

// ───────── Parceiros ─────────

const contactRequestSchema = z.object({
  id: z.string().uuid().optional(),
  type: contactTypeSchema,
  value: phoneSchema,
  label: optionalText(80),
});

const unitRequestSchema = z.object({
  id: z.string().uuid().optional(),
  name: nameSchema,
  address: z.object({
    postalCode: postalCodeSchema,
    street: requiredText(NAME_MAX),
    number: requiredText(20),
    complement: optionalText(NAME_MAX),
    neighborhood: requiredText(NAME_MAX),
    city: requiredText(NAME_MAX),
    state: stateSchema,
  }),
  openingHours: optionalText(500),
  instructions: optionalText(4000),
  status: activeStatusSchema.default('active'),
  contacts: z.array(contactRequestSchema).max(20),
});

const benefitRequestSchema = z.object({
  planId: z.string().uuid({ error: 'REQUIRED' }),
  discountPercentage: percentageSchema,
  coupon: optionalText(100),
});

const partnerFields = {
  name: nameSchema,
  description: optionalText(2000),
  usageInstructions: optionalText(4000),
  website: websiteSchema,
  generalCoupon: optionalText(100),
  categoryIds: z.array(z.string().uuid()).max(50),
  contacts: z.array(contactRequestSchema).max(20),
  units: z.array(unitRequestSchema).max(100),
  benefits: z.array(benefitRequestSchema).max(50),
};

function rejectRepeatedPlans(
  value: { benefits: { planId: string }[] },
  context: z.RefinementCtx,
) {
  const seen = new Set<string>();
  value.benefits.forEach((benefit, index) => {
    if (seen.has(benefit.planId)) {
      context.addIssue({
        code: 'custom',
        path: ['benefits', index, 'planId'],
        message: 'DUPLICATE_PLAN_BENEFIT',
      });
    }
    seen.add(benefit.planId);
  });
}

/** Criação: nasce como rascunho; `slug` e `featured` são opcionais. */
export const createPartnerRequestSchema = z
  .object({
    ...partnerFields,
    slug: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      slugSchema.optional(),
    ),
    featured: z.boolean({ error: 'INVALID_VALUE' }).default(false),
  })
  .superRefine(rejectRepeatedPlans);
export type CreatePartnerRequest = z.infer<typeof createPartnerRequestSchema>;

/** Edição: representação editável completa; omissões nunca são alterações parciais. */
export const updatePartnerRequestSchema = z
  .object({
    ...partnerFields,
    slug: slugSchema,
    featured: z.boolean({ error: 'REQUIRED' }),
  })
  .superRefine(rejectRepeatedPlans);
export type UpdatePartnerRequest = z.infer<typeof updatePartnerRequestSchema>;

const contactSchema = z.object({
  id: z.string().uuid(),
  type: contactTypeSchema,
  value: z.string(),
  label: z.string().optional(),
});

export const partnerSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  usageInstructions: z.string().optional(),
  website: z.string().optional(),
  featured: z.boolean(),
  generalCoupon: z.string().optional(),
  status: partnerStatusSchema,
  categories: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      status: activeStatusSchema,
    }),
  ),
  contacts: z.array(contactSchema),
  units: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      address: z.object({
        postalCode: z.string(),
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
      }),
      openingHours: z.string().optional(),
      instructions: z.string().optional(),
      status: activeStatusSchema,
      contacts: z.array(contactSchema),
    }),
  ),
  benefits: z.array(
    z.object({
      planId: z.string().uuid(),
      discountPercentage: z.number().int(),
      coupon: z.string().optional(),
    }),
  ),
  version: z.number().int(),
  deleted: z.boolean(),
  warnings: z.array(partnerWarningSchema).optional(),
});
export type Partner = z.infer<typeof partnerSchema>;

// ───────── Representações públicas ─────────

export const publicPlanSchema = planSchema.pick({
  id: true,
  name: true,
  slug: true,
});
export type PublicPlan = z.infer<typeof publicPlanSchema>;

export const publicCategorySchema = categorySchema.pick({
  id: true,
  name: true,
});
export type PublicCategory = z.infer<typeof publicCategorySchema>;

const publicContactSchema = contactSchema.omit({ id: true }).extend({
  inherited: z.boolean().optional(),
});

export const publicPartnerSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  featured: z.boolean(),
  categories: z.array(publicCategorySchema),
  discountPercentage: z.number().int().min(1).max(100).optional(),
  coupon: z.string().optional(),
  usageInstructions: z.string(),
  website: z.string().optional(),
  contacts: z.array(publicContactSchema),
  units: z.array(
    z.object({
      name: z.string(),
      address: z.object({
        postalCode: z.string(),
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
      }),
      openingHours: z.string().optional(),
      instructions: z.string().optional(),
      contacts: z.array(publicContactSchema),
    }),
  ),
});
export type PublicPartner = z.infer<typeof publicPartnerSchema>;

// ───────── Regras de publicação e visibilidade ─────────

export interface PublicationIssue {
  field: string;
  code: FieldErrorCode;
}

/** O que a regra de publicação (RN-001) precisa conhecer de um parceiro. */
export interface PublicationCandidate {
  name: string;
  description?: string | undefined;
  usageInstructions?: string | undefined;
  /** Estado das categorias associadas. */
  categories: readonly { status: ActiveStatus }[];
  contacts: readonly unknown[];
  benefits: readonly { planId: string }[];
}

/**
 * Pendências para publicar (RN-001, RN-015). Unidades incompletas nunca chegam a ser
 * salvas, de modo que sua completude é garantida pela validação da entrada.
 * `activePlanIds` identifica os planos ativos que satisfazem a exigência de benefício.
 */
export function publicationIssues(
  partner: PublicationCandidate,
  activePlanIds: ReadonlySet<string>,
): PublicationIssue[] {
  const issues: PublicationIssue[] = [];
  if (!partner.description?.trim()) {
    issues.push({
      field: 'description',
      code: 'PUBLICATION_DESCRIPTION_REQUIRED',
    });
  }
  if (!partner.usageInstructions?.trim()) {
    issues.push({
      field: 'usageInstructions',
      code: 'PUBLICATION_INSTRUCTIONS_REQUIRED',
    });
  }
  if (!partner.categories.some((category) => category.status === 'active')) {
    issues.push({
      field: 'categoryIds',
      code: 'PUBLICATION_CATEGORY_REQUIRED',
    });
  }
  if (partner.contacts.length === 0) {
    issues.push({ field: 'contacts', code: 'PUBLICATION_CONTACT_REQUIRED' });
  }
  if (!partner.benefits.some((benefit) => activePlanIds.has(benefit.planId))) {
    issues.push({ field: 'benefits', code: 'PUBLICATION_BENEFIT_REQUIRED' });
  }
  return issues;
}

/**
 * Elegibilidade pública para um plano selecionado (RN-003): publicado, com ao menos uma
 * categoria ativa e benefício para o plano ativo escolhido.
 */
export function isVisibleForPlan(
  partner: {
    status: PartnerStatus;
    categories: readonly { status: ActiveStatus }[];
    benefits: readonly { planId: string }[];
  },
  plan: { id: string; status: ActiveStatus },
): boolean {
  return (
    partner.status === 'published' &&
    plan.status === 'active' &&
    partner.categories.some((category) => category.status === 'active') &&
    partner.benefits.some((benefit) => benefit.planId === plan.id)
  );
}

/** Cupom efetivo (RN-016): o específico do plano substitui o geral do parceiro. */
export function effectiveCoupon(
  partner: { generalCoupon?: string | undefined },
  benefit: { coupon?: string | undefined },
): string | undefined {
  return benefit.coupon ?? partner.generalCoupon;
}

/**
 * Contatos exibidos de uma unidade (RN-027): por tipo, a unidade usa os próprios contatos
 * e, na ausência deles, herda os gerais do parceiro.
 */
export function effectiveUnitContacts<
  T extends { type: ContactType },
  P extends { type: ContactType },
>(unitContacts: readonly T[], partnerContacts: readonly P[]) {
  const result: ((T & { inherited?: false }) | (P & { inherited: true }))[] =
    [];
  for (const type of contactTypes) {
    const own = unitContacts.filter((contact) => contact.type === type);
    if (own.length > 0) {
      result.push(...own);
    } else {
      result.push(
        ...partnerContacts
          .filter((contact) => contact.type === type)
          .map((contact) => ({ ...contact, inherited: true as const })),
      );
    }
  }
  return result;
}
