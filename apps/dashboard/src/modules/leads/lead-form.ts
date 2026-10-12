import { z } from 'zod';
import { normalizePhone, type LeadSource } from '@flex/contracts';
import { toProblem } from '../../shared/http/problem';

/** Campos do lead compartilhados pelo cadastro e pela edição de dados. */
export const leadFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, { error: 'REQUIRED' })
        .max(120, { error: 'INVALID_VALUE' }),
    whatsapp: z
        .string()
        .trim()
        .min(1, { error: 'REQUIRED' })
        .refine((value) => value === '' || normalizePhone(value) !== null, {
            error: 'INVALID_PHONE_NUMBER',
        }),
    email: z
        .string()
        .trim()
        .max(254, { error: 'INVALID_VALUE' })
        .refine((value) => value === '' || z.email().safeParse(value).success, {
            error: 'INVALID_EMAIL',
        }),
    sourceId: z.string().min(1, { error: 'REQUIRED' }),
    sourceDetail: z.string().trim().max(500, { error: 'INVALID_VALUE' }),
    referredBy: z.string().trim().max(500, { error: 'INVALID_VALUE' }),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const leadFormFields = [
    'name',
    'whatsapp',
    'email',
    'sourceId',
    'sourceDetail',
    'referredBy',
] as const;

/** Fronteira com o contrato: campos vazios opcionais não são enviados. */
export function toLeadRequest(
    values: LeadFormValues,
    source: LeadSource | undefined,
) {
    return {
        name: values.name,
        whatsapp: values.whatsapp,
        sourceId: values.sourceId,
        ...(values.email ? { email: values.email } : {}),
        ...(values.sourceDetail ? { sourceDetail: values.sourceDetail } : {}),
        ...(source?.requiresReferral && values.referredBy
            ? { referredBy: values.referredBy }
            : {}),
    };
}

/** WhatsApp já usado por outro lead: a API informa o id do lead existente. */
export function duplicateLeadId(error: unknown): string | null {
    const problem = toProblem(error);
    if (problem?.code !== 'DUPLICATE_RESOURCE') return null;
    return /^[0-9a-f-]{36}$/i.test(problem.detail) ? problem.detail : '';
}
