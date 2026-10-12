import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { baseUsername, createUserRequestSchema } from '@flex/contracts';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Drawer } from '../../../shared/ui/dialogs';
import { InputField } from '../../../shared/ui/form-controls';
import {
    applyServerFieldErrors,
    fieldMessage,
} from '../../../shared/validation/server-errors';
import { issuedCodeHandoff } from '../issued-code';
import { useCreateUser } from '../mutations/users.mutations';

const userFormSchema = z.object({
    fullName: createUserRequestSchema.shape.fullName,
    email: z
        .string()
        .trim()
        .max(254, { error: 'INVALID_VALUE' })
        .refine((value) => value === '' || z.email().safeParse(value).success, {
            error: 'INVALID_EMAIL',
        }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

/** Cadastro de usuário em dialog lateral; ao salvar, segue para o detalhe da conta. */
export function UserCreateDrawer({ onClose }: { onClose: () => void }) {
    const create = useCreateUser();
    const navigate = useNavigate();
    const toast = useToast();
    const [failure, setFailure] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        control,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: { fullName: '', email: '' },
    });
    const fullName = useWatch({ control, name: 'fullName' });

    const submit = handleSubmit(async (values) => {
        setFailure(null);
        try {
            const user = await create.mutateAsync({
                fullName: values.fullName,
                ...(values.email ? { email: values.email } : {}),
            });
            issuedCodeHandoff.put({
                userId: user.id,
                purpose: 'activation',
                delivery: user.accessCodeDelivery ?? 'manual',
                ...(user.accessCode ? { code: user.accessCode } : {}),
                emailFailed:
                    user.warnings?.includes('EMAIL_DELIVERY_FAILED') ?? false,
            });
            toast('Usuário criado.');
            onClose();
            void navigate({
                to: '/usuarios/$userId',
                params: { userId: user.id },
            });
        } catch (error) {
            const applied = applyServerFieldErrors(error, setError, [
                'fullName',
                'email',
            ]);
            if (!applied) setFailure(describeError(error));
        }
    });

    return (
        <Drawer
            title="Novo usuário"
            loading={create.isPending}
            onSubmit={submit}
            onClose={onClose}
        >
            {failure ? <Alert tone="danger">{failure}</Alert> : null}
            <InputField
                label="Nome completo"
                autoFocus
                error={fieldMessage(errors.fullName?.message)}
                {...register('fullName')}
            />
            <InputField
                label="Nome de usuário"
                mono
                readOnly
                value={fullName.trim() ? baseUsername(fullName) : ''}
                hint="Gerado a partir do nome; recebe um sufixo numérico se já existir. Pode ser ajustado no detalhe do usuário."
            />
            <InputField
                label="E-mail"
                optional
                type="email"
                hint="Com e-mail, o código de ativação é enviado automaticamente."
                error={fieldMessage(errors.email?.message)}
                {...register('email')}
            />
            <Alert tone="info">
                A conta começa ativa, sem permissões e aguardando ativação. O
                código de ativação é emitido ao salvar: sem e-mail, ele é
                exibido uma única vez no detalhe do usuário.
            </Alert>
        </Drawer>
    );
}
