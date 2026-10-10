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
import { Drawer } from '../../../shared/ui/dialogs';
import { InputField } from '../../../shared/ui/form-controls';
import {
  applyServerFieldErrors,
  fieldMessage,
} from '../../../shared/validation/server-errors';
import {
  useCreateCategory,
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

  const submit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      const saved = category
        ? await update.mutateAsync({
            id: category.id,
            version: category.version,
            body: values,
          })
        : await create.mutateAsync(values);
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

  return (
    <Drawer
      title={isNew ? 'Nova categoria' : 'Editar categoria'}
      {...(category ? { description: category.name } : {})}
      loading={create.isPending || update.isPending}
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
                  void queryClient.refetchQueries({ queryKey: categoriesKey });
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
    </Drawer>
  );
}
