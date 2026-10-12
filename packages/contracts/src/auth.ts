import { z } from 'zod';
import { permissionSchema } from './permissions';
import { requiredText } from './text';

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

// Comprimento medido em caracteres Unicode, não em unidades UTF-16.
const length = (value: string) => [...value].length;

/**
 * Regras de tamanho para validação antecipada nos formulários. Senhas preservam espaços e
 * Unicode e não possuem regras de composição (ADR-0004). A API aplica a política completa
 * no caso de uso, depois de identificar o código, para que cada rejeição conte como tentativa.
 */
export const passwordSchema = z
  .string({ error: 'REQUIRED' })
  .refine((value) => length(value) >= PASSWORD_MIN_LENGTH, {
    error: 'PASSWORD_TOO_SHORT',
  })
  .refine((value) => length(value) <= PASSWORD_MAX_LENGTH, {
    error: 'PASSWORD_TOO_LONG',
  });

const accessCodeSchema = requiredText(64);

const newPasswordFields = {
  newPassword: z.string({ error: 'REQUIRED' }).min(1, { error: 'REQUIRED' }),
  newPasswordConfirmation: z.string({ error: 'REQUIRED' }),
};

const confirmationMatches = (value: {
  newPassword: string;
  newPasswordConfirmation: string;
}) => value.newPassword === value.newPasswordConfirmation;

const confirmationMismatch = {
  path: ['newPasswordConfirmation'],
  error: 'PASSWORD_CONFIRMATION_MISMATCH',
};

export const loginRequestSchema = z.object({
  username: requiredText(80),
  password: z
    .string({ error: 'REQUIRED' })
    .min(1, { error: 'REQUIRED' })
    .max(1024, { error: 'INVALID_VALUE' }),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** Usada na ativação e na recuperação: ambas recebem o código e a nova senha. */
export const setPasswordWithCodeRequestSchema = z
  .object({ code: accessCodeSchema, ...newPasswordFields })
  .refine(confirmationMatches, confirmationMismatch);
export type SetPasswordWithCodeRequest = z.infer<
  typeof setPasswordWithCodeRequestSchema
>;

export const recoveryRequestSchema = z.object({
  username: requiredText(80),
});
export type RecoveryRequest = z.infer<typeof recoveryRequestSchema>;

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z
      .string({ error: 'REQUIRED' })
      .min(1, { error: 'REQUIRED' })
      .max(1024, { error: 'INVALID_VALUE' }),
    ...newPasswordFields,
  })
  .refine(confirmationMatches, confirmationMismatch);
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const sessionResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    username: z.string(),
    email: z.string().optional(),
  }),
  permissions: z.array(permissionSchema),
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const recoveryResponseSchema = z.object({ message: z.string() });
export type RecoveryResponse = z.infer<typeof recoveryResponseSchema>;
