import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { formatPhone, type Lead, type LeadSummary } from '@flex/contracts';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { isVersionConflict } from '../../../shared/http/versioning';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Drawer } from '../../../shared/ui/dialogs';
import { applyServerFieldErrors } from '../../../shared/validation/server-errors';
import { leadsApi } from '../api/leads.api';
import {
  duplicateLeadId,
  leadFormFields,
  leadFormSchema,
  toLeadRequest,
  type LeadFormValues,
} from '../lead-form';
import { useLeadCommand } from '../mutations/lead-command.mutation';
import { leadsKey, sourcesQueryOptions } from '../queries/leads.query';
import { LeadFields, type DuplicateLead } from './lead-fields';

/** "Editar dados": contato e origem; a troca de origem fica no histórico. */
export function LeadEditDrawer({
  lead,
  onClose,
  onReload,
}: {
  lead: Lead;
  onClose: () => void;
  onReload: () => void;
}) {
  const { data: sources } = useQuery(sourcesQueryOptions);
  const queryClient = useQueryClient();
  const toast = useToast();
  const command = useLeadCommand();
  const [failure, setFailure] = useState<{
    message: string;
    conflict: boolean;
  } | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateLead | null>(null);
  // Origens ativas e manuais, mais a atual (mesmo que inativa ou automática).
  const options = sources?.filter(
    (item) =>
      (item.active && item.kind === 'manual') || item.id === lead.source.id,
  ) ?? [lead.source];

  const methods = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead.name,
      whatsapp: formatPhone(lead.whatsapp),
      email: lead.email ?? '',
      sourceId: lead.source.id,
      sourceDetail: lead.sourceDetail ?? '',
      referredBy: lead.referredBy ?? '',
    },
  });

  const submit = methods.handleSubmit(async (values) => {
    setFailure(null);
    setDuplicate(null);
    const source = options.find((item) => item.id === values.sourceId);
    if (source?.requiresReferral && !values.referredBy) {
      methods.setError('referredBy', { type: 'manual', message: 'REQUIRED' });
      return;
    }
    try {
      await command.mutateAsync(() =>
        leadsApi.update(lead.id, lead.version, toLeadRequest(values, source)),
      );
      toast('Dados do lead atualizados.');
      onClose();
    } catch (error) {
      const existing = duplicateLeadId(error);
      if (existing !== null) {
        const known = queryClient
          .getQueryData<LeadSummary[]>(leadsKey)
          ?.find((item) => item.id === existing);
        setDuplicate({ id: existing, name: known?.name });
        return;
      }
      if (!applyServerFieldErrors(error, methods.setError, leadFormFields))
        setFailure({
          message: describeError(error),
          conflict: isVersionConflict(error),
        });
    }
  });

  return (
    <Drawer
      title="Editar dados"
      description={lead.name}
      loading={command.isPending}
      onClose={onClose}
      onSubmit={submit}
    >
      {failure ? (
        <Alert
          tone={failure.conflict ? 'warning' : 'danger'}
          title={
            failure.conflict
              ? 'Outra pessoa alterou este lead.'
              : 'Não foi possível salvar os dados.'
          }
          action={
            failure.conflict ? (
              <Button
                compact
                onClick={() => {
                  onReload();
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
      <FormProvider {...methods}>
        <LeadFields
          sources={options}
          duplicate={duplicate}
          sourceHint="A origem anterior fica registrada no histórico."
        />
      </FormProvider>
    </Drawer>
  );
}
