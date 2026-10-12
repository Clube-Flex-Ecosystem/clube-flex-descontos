import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { categoryRequestSchema, type Category } from '@flex/contracts';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { isVersionConflict } from '../../../shared/http/versioning';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { ConfirmDialog, Drawer } from '../../../shared/ui/dialogs';
import { InputField, Switch } from '../../../shared/ui/form-controls';
import {
    applyServerFieldErrors,
    fieldMessage,
} from '../../../shared/validation/server-errors';
import {
    useCreateCategory,
    useSetCategoryStatus,
    useUpdateCategory,
} from '../mutations/categories.mutations';
import { categoriesKey } from '../queries/categories.query';

interface CategoryFormDrawerProps {
    /** Categoria em edição; ausente na criação. */
    category?: Category;
    onClose: () => void;
}

interface CategoryFormValues {
    name: string;
}

export function CategoryFormDrawer({
    category,
    onClose,
}: CategoryFormDrawerProps) {
    const isNew = !category;
    const create = useCreateCategory();
    const update = useUpdateCategory();
    const setStatus = useSetCategoryStatus();
    const [active, setActive] = useState(
        category ? category.status === 'active' : true,
    );
    const [confirmingDeactivation, setConfirmingDeactivation] = useState(false);
    const queryClient = useQueryClient();
    const toast = useToast();
    const [failure, setFailure] = useState<{
        message: string;
        conflict: boolean;
    } | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryRequestSchema),
        defaultValues: { name: category?.name ?? '' },
    });

    const save = handleSubmit(async (values) => {
        setFailure(null);
        try {
            let saved = category
                ? await update.mutateAsync({
                      id: category.id,
                      version: category.version,
                      body: values,
                  })
                : await create.mutateAsync(values);
            const status = active ? 'active' : 'inactive';
            if (saved.status !== status)
                saved = await setStatus.mutateAsync({
                    id: saved.id,
                    version: saved.version,
                    status,
                });
            toast(`“${saved.name}” ${isNew ? 'cadastrada' : 'atualizada'}.`);
            onClose();
        } catch (error) {
            if (!applyServerFieldErrors(error, setError, ['name'])) {
                setFailure({
                    message: describeError(error),
                    conflict: isVersionConflict(error),
                });
            }
        }
    });

    // Desativar pelo dialog pede a mesma confirmação da ação do menu.
    const submit: typeof save = (event) => {
        if (category?.status === 'active' && !active) {
            event?.preventDefault();
            setConfirmingDeactivation(true);
            return Promise.resolve();
        }
        return save(event);
    };

    return (
        <>
            <Drawer
                title={isNew ? 'Nova categoria' : 'Editar categoria'}
                {...(category ? { description: category.name } : {})}
                loading={
                    create.isPending || update.isPending || setStatus.isPending
                }
                onSubmit={submit}
                onClose={onClose}
            >
                {failure ? (
                    <Alert
                        tone={failure.conflict ? 'warning' : 'danger'}
                        action={
                            failure.conflict ? (
                                <Button
                                    compact
                                    onClick={() => {
                                        void queryClient.refetchQueries({
                                            queryKey: categoriesKey,
                                        });
                                        onClose();
                                    }}
                                >
                                    Carregar versão atual
                                </Button>
                            ) : undefined
                        }
                    >
                        {failure.message}
                    </Alert>
                ) : null}
                <InputField
                    label="Nome"
                    autoFocus
                    hint="Deve ser único, sem diferenciar maiúsculas e acentos."
                    error={fieldMessage(errors.name?.message)}
                    {...register('name')}
                />
                <Switch
                    label="Ativa"
                    hint={
                        active
                            ? 'Disponível nas seleções e no catálogo.'
                            : 'Oculta até ser reativada.'
                    }
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                />
            </Drawer>
            {confirmingDeactivation && category ? (
                <ConfirmDialog
                    title={`Desativar a categoria “${category.name}”?`}
                    body="A categoria deixa de aparecer no catálogo e nas seleções. As associações com parceiros são preservadas."
                    confirmLabel="Desativar"
                    onCancel={() => setConfirmingDeactivation(false)}
                    onConfirm={() => {
                        setConfirmingDeactivation(false);
                        void save();
                    }}
                />
            ) : null}
        </>
    );
}
