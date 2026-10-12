import { Link, useNavigate } from '@tanstack/react-router';
import { AuthLayout } from '../components/auth-layout';
import { SetPasswordForm } from '../components/set-password-form';
import { useActivateAccount } from '../mutations/auth.mutations';

export function ActivatePage() {
    const navigate = useNavigate();
    const activate = useActivateAccount();

    return (
        <AuthLayout
            title="Ativar conta"
            description="Informe o código de ativação recebido e defina sua senha. Ninguém além de você conhece a sua senha."
        >
            <SetPasswordForm
                submitLabel="Ativar conta"
                codeLabel="Código de ativação"
                isPending={activate.isPending}
                onSubmit={async (values) => {
                    await activate.mutateAsync({
                        code: values.code,
                        newPassword: values.newPassword,
                        newPasswordConfirmation: values.newPasswordConfirmation,
                    });
                    // A ativação não inicia sessão: o usuário se autentica em seguida.
                    await navigate({
                        to: '/login',
                        search: { aviso: 'ativada' },
                    });
                }}
            />
            <div className="t-body-small flex flex-wrap justify-between gap-3">
                <Link to="/login">Voltar para entrar</Link>
            </div>
        </AuthLayout>
    );
}
