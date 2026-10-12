import { z } from 'zod';

/** Texto obrigatório: espaços externos removidos e valor composto só de espaços recusado. */
export const requiredText = (max: number) =>
    z
        .string({ error: 'REQUIRED' })
        .trim()
        .min(1, { error: 'REQUIRED' })
        .max(max, { error: 'INVALID_VALUE' });

/** Campo textual opcional: ausente ou em branco equivale a não informado. */
export const optionalText = (max: number) =>
    z.preprocess(
        (value) =>
            typeof value === 'string' && value.trim() === ''
                ? undefined
                : value,
        z.string().trim().max(max, { error: 'INVALID_VALUE' }).optional(),
    );
