import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { TextField } from '../../../shared/ui/text-field';
import { applyServerFieldErrors, fieldMessage } from '../forms';
import {
  setPasswordFormSchema,
  type SetPasswordFormValues,
} from '../schemas/auth-forms';
import { PasswordCriteria } from './password-criteria';

interface SetPasswordFormProps {
  submitLabel: string;
  codeLabel?: string;
  onSubmit: (values: SetPasswordFormValues) => Promise<void>;
  isPending: boolean;
}

/** Formulário de código e nova senha, compartilhado por ativação e recuperação. */
export function SetPasswordForm({
  submitLabel,
  codeLabel = 'Código recebido',
  onSubmit,
  isPending,
}: SetPasswordFormProps) {
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordFormSchema),
    defaultValues: { code: '', newPassword: '', newPasswordConfirmation: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const applied = applyServerFieldErrors(error, setError, [
        'code',
        'newPassword',
        'newPasswordConfirmation',
      ]);
      if (!applied) setFailure(describeError(error));
    }
  });

  return (
    <form className="grid gap-4" noValidate onSubmit={submit}>
      {failure ? <Alert tone="danger">{failure}</Alert> : null}
      <TextField
        label={codeLabel}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="ABCD-EFGH-JKMN-PQRS"
        hint="O código vale por 30 minutos e só pode ser usado uma vez."
        error={fieldMessage(errors.code?.message)}
        {...register('code')}
      />
      <PasswordCriteria />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        revealable
        error={fieldMessage(errors.newPassword?.message)}
        {...register('newPassword')}
      />
      <TextField
        label="Confirme a nova senha"
        type="password"
        autoComplete="new-password"
        revealable
        error={fieldMessage(errors.newPasswordConfirmation?.message)}
        {...register('newPasswordConfirmation')}
      />
      <Button type="submit" variant="primary" block loading={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
