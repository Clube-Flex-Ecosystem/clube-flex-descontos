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

export const leadStages = [
  'new',
  'firstContact',
  'negotiating',
  'converted',
  'lost',
] as const;
export const leadStageSchema = z.enum(leadStages);
export type LeadStage = z.infer<typeof leadStageSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: 'INVALID_VALUE' })
    .transform((v) => v || undefined)
    .optional();
const whatsappSchema = z
  .string()
  .trim()
  .transform((value, context) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      context.addIssue({ code: 'custom', message: 'INVALID_PHONE_NUMBER' });
      return z.NEVER;
    }
    return normalized;
  });

export const createLeadRequestSchema = z.object({
  name: requiredText(120),
  whatsapp: whatsappSchema,
  email: optionalText(254).refine((v) => !v || z.email().safeParse(v).success, {
    error: 'INVALID_EMAIL',
  }),
  sourceId: z.uuid(),
  sourceDetail: optionalText(500),
  referredBy: optionalText(500),
  leaveUnassigned: z.boolean().default(false),
});
export const updateLeadRequestSchema = z.object({
  name: requiredText(120),
  whatsapp: whatsappSchema,
  email: optionalText(254).refine((v) => !v || z.email().safeParse(v).success, {
    error: 'INVALID_EMAIL',
  }),
  sourceId: z.uuid(),
  sourceDetail: optionalText(500),
  referredBy: optionalText(500),
});
export const stageTransitionRequestSchema = z.object({
  stage: leadStageSchema,
  lossReason: optionalText(4000),
});
export const assigneeRequestSchema = z.object({
  assigneeId: z.uuid().nullable(),
});
export const observationRequestSchema = z.object({ text: requiredText(4000) });
export const leadSourceRequestSchema = z.object({
  name: requiredText(120),
  requiresReferral: z.boolean().default(false),
});

export interface LeadSource {
  id: string;
  name: string;
  kind: 'automatic' | 'manual';
  active: boolean;
  protected: boolean;
  requiresReferral: boolean;
  usageCount: number;
  version: number;
}
export interface LeadSummary {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  stage: LeadStage;
  source: LeadSource;
  assignee?: { id: string; fullName: string };
  hasPendingInterest: boolean;
  version: number;
  updatedAt: string;
}
export interface LeadObservation {
  id: string;
  text: string;
  author: { id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}
export interface LeadContactRequest {
  id: string;
  submittedName: string;
  submittedWhatsapp: string;
  submittedEmail?: string;
  source: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: { id: string; fullName: string };
}
export interface Lead extends LeadSummary {
  sourceDetail?: string;
  referredBy?: string;
  lossReason?: string;
  observations: LeadObservation[];
  contactRequests: LeadContactRequest[];
}
export interface LeadHistoryEvent {
  id: string;
  type: string;
  occurredAt: string;
  actor?: { id: string; fullName: string };
  data?: Record<string, unknown>;
}
export type CreateLeadRequest = z.infer<typeof createLeadRequestSchema>;
