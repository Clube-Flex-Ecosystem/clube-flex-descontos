import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { TextField } from '../../../shared/ui/text-field';
import { AuthLayout } from '../components/auth-layout';
import { SetPasswordForm } from '../components/set-password-form';
import { fieldMessage } from '../forms';
import {
    useRecoverAccess,
    useRequestRecovery,
} from '../mutations/auth.mutations';
import {
    recoveryRequestFormSchema,
    type RecoveryRequestFormValues,
} from '../schemas/auth-forms';

/**
 * Recuperação em duas etapas na mesma tela: solicitar o código e redefinir a senha.
 * A resposta da solicitação é sempre neutra e nunca confirma a existência da conta.
 */
export function RecoveryPage() {
    const navigate = useNavigate();
    const requestRecovery = useRequestRecovery();
    const recover = useRecoverAccess();
    const [requested, setRequested] = useState(false);
    const [failure, setFailure] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RecoveryRequestFormValues>({
        resolver: zodResolver(recoveryRequestFormSchema),
        defaultValues: { username: '' },
    });

    const submitRequest = handleSubmit(async (values) => {
        setFailure(null);
        try {
            await requestRecovery.mutateAsync(values);
            setRequested(true);
        } catch (error) {
            setFailure(describeError(error));
        }
    });

    return (
        <AuthLayout
            title="Recuperar acesso"
            description="Informe seu nome de usuário para receber um código por e-mail."
        >
            <form className="grid gap-4" noValidate onSubmit={submitRequest}>
                {failure ? <Alert tone="danger">{failure}</Alert> : null}
                {requested ? (
                    <Alert tone="info">
                        Se existir uma conta ativa com e-mail cadastrado para
                        este usuário, enviaremos um código de recuperação.
                        Contas sem e-mail dependem de um administrador para
                        emitir o código.
                    </Alert>
                ) : null}
                <TextField
                    label="Nome de usuário"
                    placeholder="Seu nome de usuário"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    error={fieldMessage(errors.username?.message)}
                    {...register('username')}
                />
                <Button
                    type="submit"
                    variant={requested ? 'secondary' : 'primary'}
                    block
                    loading={requestRecovery.isPending}
                >
                    {requested ? 'Enviar novo código' : 'Enviar código'}
                </Button>
            </form>

            <hr className="w-full border-border" />

            <div>
                <h2 className="t-section mb-3">Já tenho um código</h2>
                <SetPasswordForm
                    submitLabel="Redefinir senha"
                    codeLabel="Código de recuperação"
                    isPending={recover.isPending}
                    onSubmit={async (values) => {
                        await recover.mutateAsync({
                            code: values.code,
                            newPassword: values.newPassword,
                            newPasswordConfirmation:
                                values.newPasswordConfirmation,
                        });
                        await navigate({
                            to: '/login',
                            search: { aviso: 'senha-redefinida' },
                        });
                    }}
                />
            </div>
            <div className="t-body-small flex flex-wrap justify-between gap-3">
                <Link to="/login">Voltar para entrar</Link>
            </div>
        </AuthLayout>
    );
}
