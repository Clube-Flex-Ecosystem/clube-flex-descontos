import { z } from 'zod';
import type { FieldPath, UseFormSetError } from 'react-hook-form';
import {
    contactTypeSchema,
    normalizePhone,
    normalizePostalCode,
    formatPhone,
    isHttpUrl,
    isValidSlug,
    type ContactType,
    type Partner,
    type Plan,
} from '@flex/contracts';
import { fieldErrorsOf } from '../../../shared/http/problem';

// ───────── Valores do formulário ─────────
// O formulário mantém textos e booleanos da interface; a fronteira com o contrato
// (`toRequest`) converte vazios, números e o estado ativo/inativo das unidades.

export interface ContactFormValues {
    /** Identificador do contato já persistido (ausente em contatos novos). */
    itemId?: string;
    type: ContactType;
    value: string;
    label: string;
}

export interface UnitFormValues {
    itemId?: string;
    name: string;
    postalCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    openingHours: string;
    instructions: string;
    active: boolean;
    contacts: ContactFormValues[];
}

export interface BenefitFormValues {
    planId: string;
    enabled: boolean;
    discountPercentage: string;
    coupon: string;
}

export interface PartnerFormValues {
    name: string;
    slug: string;
    website: string;
    description: string;
    usageInstructions: string;
    featured: boolean;
    generalCoupon: string;
    categoryIds: string[];
    contacts: ContactFormValues[];
    units: UnitFormValues[];
    benefits: BenefitFormValues[];
}

const DEFAULT_STATE = 'RJ';

export function emptyContact(
    type: ContactType = 'whatsapp',
): ContactFormValues {
    return { type, value: '', label: '' };
}

export function emptyUnit(): UnitFormValues {
    return {
        name: '',
        postalCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: DEFAULT_STATE,
        openingHours: '',
        instructions: '',
        active: true,
        contacts: [],
    };
}

/**
 * Uma linha de benefício por plano ativo e por plano inativo que já possua benefício
 * (a associação é preservada); a ordem acompanha o nome do plano.
 */
function benefitRows(
    plans: readonly Plan[],
    existing: Partner['benefits'],
): BenefitFormValues[] {
    const byPlan = new Map(
        existing.map((benefit) => [benefit.planId, benefit]),
    );
    return [...plans]
        .filter((plan) => plan.status === 'active' || byPlan.has(plan.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .map((plan) => {
            const benefit = byPlan.get(plan.id);
            return {
                planId: plan.id,
                enabled: Boolean(benefit),
                discountPercentage: benefit
                    ? String(benefit.discountPercentage)
                    : '',
                coupon: benefit?.coupon ?? '',
            };
        });
}

export function newPartnerValues(plans: readonly Plan[]): PartnerFormValues {
    return {
        name: '',
        slug: '',
        website: '',
        description: '',
        usageInstructions: '',
        featured: false,
        generalCoupon: '',
        categoryIds: [],
        contacts: [],
        units: [],
        benefits: benefitRows(plans, []),
    };
}

const contactValues = (
    contact: Partner['contacts'][number],
): ContactFormValues => ({
    itemId: contact.id,
    type: contact.type,
    value: formatPhone(contact.value),
    label: contact.label ?? '',
});

export function toFormValues(
    partner: Partner,
    plans: readonly Plan[],
): PartnerFormValues {
    return {
        name: partner.name,
        slug: partner.slug,
        website: partner.website ?? '',
        description: partner.description ?? '',
        usageInstructions: partner.usageInstructions ?? '',
        featured: partner.featured,
        generalCoupon: partner.generalCoupon ?? '',
        categoryIds: partner.categories.map((category) => category.id),
        contacts: partner.contacts.map(contactValues),
        units: partner.units.map((unit) => ({
            itemId: unit.id,
            name: unit.name,
            postalCode: unit.address.postalCode,
            street: unit.address.street,
            number: unit.address.number,
            complement: unit.address.complement ?? '',
            neighborhood: unit.address.neighborhood,
            city: unit.address.city,
            state: unit.address.state,
            openingHours: unit.openingHours ?? '',
            instructions: unit.instructions ?? '',
            active: unit.status === 'active',
            contacts: unit.contacts.map(contactValues),
        })),
        benefits: benefitRows(plans, partner.benefits),
    };
}

// ───────── Validação (melhora a experiência; a API continua autoritativa) ─────────

const max = (limit: number) =>
    z.string().max(limit, { error: 'INVALID_VALUE' });
const required = (limit: number) =>
    z
        .string()
        .trim()
        .min(1, { error: 'REQUIRED' })
        .max(limit, { error: 'INVALID_VALUE' });

const contactSchema = z.object({
    itemId: z.string().optional(),
    type: contactTypeSchema,
    value: z
        .string()
        .trim()
        .min(1, { error: 'REQUIRED' })
        .refine((value) => value === '' || normalizePhone(value) !== null, {
            error: 'INVALID_PHONE_NUMBER',
        }),
    label: max(80),
});

const unitSchema = z.object({
    itemId: z.string().optional(),
    name: required(120),
    postalCode: z
        .string()
        .trim()
        .min(1, { error: 'REQUIRED' })
        .refine(
            (value) => value === '' || normalizePostalCode(value) !== null,
            {
                error: 'INVALID_POSTAL_CODE',
            },
        ),
    street: required(120),
    number: required(20),
    complement: max(120),
    neighborhood: required(120),
    city: required(120),
    state: z.string().refine((value) => value === DEFAULT_STATE, {
        error: 'INVALID_STATE',
    }),
    openingHours: max(500),
    instructions: max(4000),
    active: z.boolean(),
    contacts: z.array(contactSchema),
});

/** `isNew`: na criação o endereço público pode ficar vazio e será gerado do nome. */
export function partnerFormSchema(isNew: boolean) {
    return z
        .object({
            name: required(120),
            slug: z
                .string()
                .trim()
                .refine(
                    (value) => (value === '' ? isNew : isValidSlug(value)),
                    {
                        error: isNew ? 'INVALID_SLUG' : 'REQUIRED',
                    },
                ),
            website: z
                .string()
                .trim()
                .max(2048, { error: 'INVALID_VALUE' })
                .refine((value) => value === '' || isHttpUrl(value), {
                    error: 'INVALID_URL',
                }),
            description: max(2000),
            usageInstructions: max(4000),
            featured: z.boolean(),
            generalCoupon: max(100),
            categoryIds: z.array(z.string()),
            contacts: z.array(contactSchema),
            units: z.array(unitSchema),
            benefits: z.array(
                z.object({
                    planId: z.string(),
                    enabled: z.boolean(),
                    discountPercentage: z.string(),
                    coupon: max(100),
                }),
            ),
        })
        .superRefine((values, context) => {
            values.benefits.forEach((benefit, index) => {
                if (!benefit.enabled) return;
                const percentage = Number(benefit.discountPercentage);
                if (
                    benefit.discountPercentage.trim() === '' ||
                    !Number.isInteger(percentage) ||
                    percentage < 1 ||
                    percentage > 100
                ) {
                    context.addIssue({
                        code: 'custom',
                        path: ['benefits', index, 'discountPercentage'],
                        message: 'INVALID_PERCENTAGE',
                    });
                }
            });
        });
}

// ───────── Fronteira com o contrato ─────────

/** Corpo enviado à API; a normalização (telefones, CEP, cupons) é feita pelo servidor. */
export interface PartnerRequestBody {
    name: string;
    slug?: string;
    description: string;
    usageInstructions: string;
    website: string;
    featured: boolean;
    generalCoupon: string;
    categoryIds: string[];
    contacts: {
        id?: string;
        type: ContactType;
        value: string;
        label: string;
    }[];
    units: {
        id?: string;
        name: string;
        address: {
            postalCode: string;
            street: string;
            number: string;
            complement: string;
            neighborhood: string;
            city: string;
            state: string;
        };
        openingHours: string;
        instructions: string;
        status: 'active' | 'inactive';
        contacts: {
            id?: string;
            type: ContactType;
            value: string;
            label: string;
        }[];
    }[];
    benefits: {
        planId: string;
        discountPercentage: number;
        coupon: string;
    }[];
}

const contactBody = (contact: ContactFormValues) => ({
    ...(contact.itemId ? { id: contact.itemId } : {}),
    type: contact.type,
    value: contact.value,
    label: contact.label,
});

/**
 * Converte o formulário na representação editável completa. Retorna também, para cada
 * benefício enviado, o índice da linha correspondente no formulário, necessário para
 * localizar erros devolvidos pela API.
 */
export function toRequest(values: PartnerFormValues): {
    body: PartnerRequestBody;
    benefitRows: number[];
} {
    const benefitRows: number[] = [];
    const benefits: PartnerRequestBody['benefits'] = [];
    values.benefits.forEach((benefit, index) => {
        if (!benefit.enabled) return;
        benefitRows.push(index);
        benefits.push({
            planId: benefit.planId,
            discountPercentage: Number(benefit.discountPercentage),
            coupon: benefit.coupon,
        });
    });

    return {
        benefitRows,
        body: {
            name: values.name,
            ...(values.slug.trim() ? { slug: values.slug } : {}),
            description: values.description,
            usageInstructions: values.usageInstructions,
            website: values.website,
            featured: values.featured,
            generalCoupon: values.generalCoupon,
            categoryIds: values.categoryIds,
            contacts: values.contacts.map(contactBody),
            units: values.units.map((unit) => ({
                ...(unit.itemId ? { id: unit.itemId } : {}),
                name: unit.name,
                address: {
                    postalCode: unit.postalCode,
                    street: unit.street,
                    number: unit.number,
                    complement: unit.complement,
                    neighborhood: unit.neighborhood,
                    city: unit.city,
                    state: unit.state,
                },
                openingHours: unit.openingHours,
                instructions: unit.instructions,
                status: unit.active
                    ? ('active' as const)
                    : ('inactive' as const),
                contacts: unit.contacts.map(contactBody),
            })),
            benefits,
        },
    };
}

/** Caminho do contrato (`units.0.address.street`) → caminho do formulário. */
function formPath(apiPath: string, benefitRows: readonly number[]): string {
    const benefit = /^benefits\.(\d+)(\..*)?$/.exec(apiPath);
    if (benefit) {
        const row = benefitRows[Number(benefit[1])];
        return `benefits.${row ?? benefit[1]}${benefit[2] ?? ''}`;
    }
    return apiPath.replace(/^(units\.\d+)\.address\./, '$1.');
}

/**
 * Associa os erros de campo da API aos controles do formulário. Retorna os caminhos do
 * formulário afetados (vazio quando a API não devolveu erros localizados).
 */
export function applyPartnerServerErrors(
    error: unknown,
    setError: UseFormSetError<PartnerFormValues>,
    benefitRows: readonly number[],
): string[] {
    const applied: string[] = [];
    for (const fieldError of fieldErrorsOf(error)) {
        const path = formPath(fieldError.field, benefitRows);
        // Erros de coleções inteiras (ex.: nenhum contato) ficam na raiz do campo.
        const target = (
            ['categoryIds', 'contacts', 'benefits'].includes(path)
                ? `${path}.root`
                : path
        ) as FieldPath<PartnerFormValues>;
        setError(target, { type: 'server', message: fieldError.code });
        applied.push(path);
    }
    return applied;
}
