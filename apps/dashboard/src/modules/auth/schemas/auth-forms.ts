import { z } from 'zod';
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  passwordSchema,
  recoveryRequestSchema,
} from '@flex/contracts';

/**
 * Esquemas de formulário: reaproveitam o contrato e acrescentam as regras de tamanho da
 * senha para dar retorno antes do envio. A API continua sendo a autoridade.
 */
const confirmedPassword = {
  newPassword: passwordSchema,
  newPasswordConfirmation: z.string({ error: 'REQUIRED' }),
};

const mustMatch = {
  path: ['newPasswordConfirmation'],
  error: 'PASSWORD_CONFIRMATION_MISMATCH',
};

const matches = (value: {
  newPassword: string;
  newPasswordConfirmation: string;
}) => value.newPassword === value.newPasswordConfirmation;

export const loginFormSchema = loginRequestSchema;
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const recoveryRequestFormSchema = recoveryRequestSchema;
export type RecoveryRequestFormValues = z.infer<
  typeof recoveryRequestFormSchema
>;

export const setPasswordFormSchema = z
  .object({
    code: z.string({ error: 'REQUIRED' }).trim().min(1, { error: 'REQUIRED' }),
    ...confirmedPassword,
  })
  .refine(matches, mustMatch);
export type SetPasswordFormValues = z.infer<typeof setPasswordFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: changePasswordRequestSchema.shape.currentPassword,
    ...confirmedPassword,
  })
  .refine(matches, mustMatch);
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
