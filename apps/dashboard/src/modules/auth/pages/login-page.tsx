import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { TextField } from '../../../shared/ui/text-field';
import { AuthLayout } from '../components/auth-layout';
import { fieldMessage } from '../forms';
import { useLogin } from '../mutations/auth.mutations';
import { loginFormSchema, type LoginFormValues } from '../schemas/auth-forms';

export type LoginNotice = 'ativada' | 'senha-redefinida';

const notices: Record<LoginNotice, string> = {
    ativada: 'Conta ativada. Entre com seu nome de usuário e a senha definida.',
    'senha-redefinida':
        'Senha redefinida. Entre com seu nome de usuário e a nova senha.',
};

export function LoginPage({ notice }: { notice?: LoginNotice | undefined }) {
    const navigate = useNavigate();
    const login = useLogin();
    const [failure, setFailure] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: { username: '', password: '' },
    });

    const submit = handleSubmit(async (values) => {
        setFailure(null);
        try {
            await login.mutateAsync(values);
            await navigate({ to: '/' });
        } catch (error) {
            // Mensagem neutra: não indica qual campo está incorreto.
            setFailure(describeError(error));
        }
    });

    return (
        <AuthLayout
            title="Entrar"
            description="Use o nome de usuário e a senha da sua conta."
        >
            <form className="grid gap-4" noValidate onSubmit={submit}>
                {notice && !failure ? (
                    <Alert tone="success">{notices[notice]}</Alert>
                ) : null}
                {failure ? <Alert tone="danger">{failure}</Alert> : null}
                <TextField
                    label="Nome de usuário"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    error={fieldMessage(errors.username?.message)}
                    {...register('username')}
                />
                <TextField
                    label="Senha"
                    type="password"
                    autoComplete="current-password"
                    revealable
                    error={fieldMessage(errors.password?.message)}
                    {...register('password')}
                />
                <Button
                    type="submit"
                    variant="primary"
                    block
                    className="md:min-h-control-lg"
                    loading={login.isPending}
                >
                    Entrar
                </Button>
                <div className="t-body-small flex flex-wrap justify-between gap-3">
                    <Link to="/ativar">Ativar conta</Link>
                    <Link to="/recuperar">Esqueci minha senha</Link>
                </div>
            </form>
        </AuthLayout>
    );
}
