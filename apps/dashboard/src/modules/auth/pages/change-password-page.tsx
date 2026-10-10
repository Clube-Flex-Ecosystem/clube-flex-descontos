import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { TextField } from '../../../shared/ui/text-field';
import { PasswordCriteria } from '../components/password-criteria';
import { applyServerFieldErrors, fieldMessage } from '../forms';
import { useChangePassword } from '../mutations/auth.mutations';
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '../schemas/auth-forms';

const emptyValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
};

export function ChangePasswordPage() {
  const changePassword = useChangePassword();
  const [failure, setFailure] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: emptyValues,
  });

  const submit = handleSubmit(async (values) => {
    setFailure(null);
    setChanged(false);
    try {
      await changePassword.mutateAsync(values);
      reset(emptyValues);
      setChanged(true);
    } catch (error) {
      const applied = applyServerFieldErrors(error, setError, [
        'currentPassword',
        'newPassword',
        'newPasswordConfirmation',
      ]);
      if (!applied) setFailure(describeError(error));
    }
  });

  return (
    <>
      <div className="mb-5">
        <h1 className="t-page">Alterar senha</h1>
        <p className="t-small muted">Troque a senha da sua própria conta.</p>
      </div>
      <section
        className="max-w-110 rounded-xl border border-border bg-surface shadow-sm"
        aria-labelledby="password-card"
      >
        <div className="border-b border-border px-4 py-3.5">
          <h2 id="password-card" className="t-card">
            Troca de senha
          </h2>
          <p className="t-small muted">
            As demais sessões da sua conta serão encerradas.
          </p>
        </div>
        <form className="grid gap-4 p-4" noValidate onSubmit={submit}>
          {changed ? (
            <Alert tone="success">
              Senha alterada. As demais sessões da conta foram encerradas.
            </Alert>
          ) : null}
          {failure ? <Alert tone="danger">{failure}</Alert> : null}
          <TextField
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            revealable
            error={fieldMessage(errors.currentPassword?.message)}
            {...register('currentPassword')}
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
          <div>
            <Button
              type="submit"
              variant="primary"
              loading={changePassword.isPending}
            >
              Alterar senha
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
