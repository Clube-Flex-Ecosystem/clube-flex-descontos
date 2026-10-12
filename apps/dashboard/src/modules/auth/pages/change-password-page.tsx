import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
        control,
        formState: { errors },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordFormSchema),
        defaultValues: emptyValues,
    });
    const newPassword = useWatch({ control, name: 'newPassword' });

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
            <div className="mb-4">
                <h1 className="t-page">Alterar senha</h1>
                <p className="t-body-small muted mt-0.5">
                    Sua sessão atual permanece ativa após a alteração; as demais
                    são encerradas.
                </p>
            </div>
            <section className="max-w-140 rounded-card border border-border bg-surface">
                <form noValidate onSubmit={submit}>
                    <div className="grid gap-3.5 p-4">
                        {changed ? (
                            <Alert tone="success">
                                Senha alterada. As demais sessões da conta foram
                                encerradas.
                            </Alert>
                        ) : null}
                        {failure ? (
                            <Alert tone="danger">{failure}</Alert>
                        ) : null}
                        <TextField
                            label="Senha atual"
                            type="password"
                            autoComplete="current-password"
                            revealable
                            error={fieldMessage(
                                errors.currentPassword?.message,
                            )}
                            {...register('currentPassword')}
                        />
                        <TextField
                            label="Nova senha"
                            type="password"
                            autoComplete="new-password"
                            revealable
                            error={fieldMessage(errors.newPassword?.message)}
                            {...register('newPassword')}
                        />
                        <PasswordCriteria value={newPassword} />
                        <TextField
                            label="Confirmar nova senha"
                            type="password"
                            autoComplete="new-password"
                            revealable
                            error={fieldMessage(
                                errors.newPasswordConfirmation?.message,
                            )}
                            {...register('newPasswordConfirmation')}
                        />
                    </div>
                    <div className="flex justify-end border-t border-border px-4 py-2">
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
