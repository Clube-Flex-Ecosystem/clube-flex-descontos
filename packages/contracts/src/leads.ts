import { z } from 'zod';
import { normalizePhone } from './catalog';
import { requiredText } from './text';

export const CONTACT_CONSENT = {
  version: '2026-10-10',
  text: 'Autorizo o Clube Flex a utilizar estes dados para contato comercial.',
  privacyUrl: '/privacidade',
} as const;

export const contactConsentSchema = z.object({
  version: z.string(),
  text: z.string(),
  privacyUrl: z.string(),
});

export const publicContactRequestSchema = z.object({
  name: requiredText(120),
  whatsapp: z
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
    }),
  email: z
    .string()
    .trim()
    .max(254, { error: 'INVALID_VALUE' })
    .refine((value) => value === '' || z.email().safeParse(value).success, {
      error: 'INVALID_EMAIL',
    })
    .transform((value) => value || undefined)
    .optional(),
  consent: z.literal(true, { error: 'REQUIRED' }),
  consentVersion: requiredText(40),
  source: z.literal('catalog'),
});

export const publicContactResponseSchema = z.object({ message: z.string() });
export type PublicContactRequest = z.infer<typeof publicContactRequestSchema>;
export type ContactConsent = z.infer<typeof contactConsentSchema>;
