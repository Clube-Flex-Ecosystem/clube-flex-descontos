import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  isValidSlug,
  updatePlanRequestSchema,
  type Plan,
} from '@flex/contracts';
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
import { useCreatePlan, useUpdatePlan } from '../mutations/plans.mutations';
import { plansKey } from '../queries/plans.query';

interface PlanFormDrawerProps {
  /** Plano em edição; ausente na criação. */
  plan?: Plan;
  onClose: () => void;
}

// O identificador público só é informado na criação; na edição o campo não existe.
const planFormSchema = z.object({
  name: updatePlanRequestSchema.shape.name,
  slug: z
    .string()
    .trim()
    .refine((value) => value === '' || isValidSlug(value), {
      error: 'INVALID_SLUG',
    }),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export function PlanFormDrawer({ plan, onClose }: PlanFormDrawerProps) {
  const isNew = !plan;
  const create = useCreatePlan();
  const update = useUpdatePlan();
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
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: { name: plan?.name ?? '', slug: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      if (plan) {
        const saved = await update.mutateAsync({
          id: plan.id,
          version: plan.version,
          body: { name: values.name },
        });
        toast(`“${saved.name}” atualizado.`);
      } else {
        const saved = await create.mutateAsync({
          name: values.name,
          slug: values.slug.trim() || undefined,
        });
        toast(`“${saved.name}” cadastrado.`);
      }
      onClose();
    } catch (error) {
      const applied = applyServerFieldErrors(error, setError, ['name', 'slug']);
      if (!applied) {
        setFailure({
          message: describeError(error),
          conflict: isVersionConflict(error),
        });
      }
    }
  });

  return (
    <Drawer
      title={isNew ? 'Novo plano' : 'Editar plano'}
      {...(plan ? { description: plan.name } : {})}
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
                  void queryClient.refetchQueries({ queryKey: plansKey });
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
      {isNew ? (
        <InputField
          label="Identificador público"
          optional
          mono
          hint="Usado nos links do catálogo. Gerado a partir do nome quando vazio e imutável depois."
          error={fieldMessage(errors.slug?.message)}
          {...register('slug')}
        />
      ) : (
        <InputField
          label="Identificador público"
          mono
          readOnly
          value={plan.slug}
          hint="Não muda ao renomear o plano, para preservar os links existentes."
        />
      )}
    </Drawer>
  );
}
