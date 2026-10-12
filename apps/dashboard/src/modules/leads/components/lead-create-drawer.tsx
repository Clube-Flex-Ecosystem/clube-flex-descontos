import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import type { LeadSummary } from '@flex/contracts';
import { useSession } from '../../auth';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Drawer } from '../../../shared/ui/dialogs';
import { SelectField } from '../../../shared/ui/form-controls';
import { useListContext } from '../../../shared/utils/list-context';
import { applyServerFieldErrors } from '../../../shared/validation/server-errors';
import {
    duplicateLeadId,
    leadFormFields,
    leadFormSchema,
    toLeadRequest,
    type LeadFormValues,
} from '../lead-form';
import { useCreateLead } from '../mutations/create-lead.mutation';
import { leadsKey, sourcesQueryOptions } from '../queries/leads.query';
import { LeadFields, type DuplicateLead } from './lead-fields';

/** Formulário lateral para criar um lead manualmente. */
export function LeadCreateDrawer({ onClose }: { onClose: () => void }) {
    const { data: sources } = useQuery(sourcesQueryOptions);
    const queryClient = useQueryClient();
    const session = useSession();
    const navigate = useNavigate();
    const create = useCreateLead();
    const toast = useToast();
    // A última origem escolhida é lembrada durante a sessão; nunca na primeira abertura.
    const [lastSource, setLastSource] = useListContext('new-lead-source', '');
    const [owner, setOwner] = useState<'me' | 'none'>('me');
    const [failure, setFailure] = useState<string | null>(null);
    const [duplicate, setDuplicate] = useState<DuplicateLead | null>(null);
    const manualSources =
        sources?.filter((item) => item.active && item.kind === 'manual') ?? [];

    const methods = useForm<LeadFormValues>({
        resolver: zodResolver(leadFormSchema),
        defaultValues: {
            name: '',
            whatsapp: '',
            email: '',
            sourceId: manualSources.some((item) => item.id === lastSource)
                ? lastSource
                : '',
            sourceDetail: '',
            referredBy: '',
        },
    });

    const sourceId = useWatch({ control: methods.control, name: 'sourceId' });

    const submit = methods.handleSubmit(async (values) => {
        setFailure(null);
        setDuplicate(null);
        const source = manualSources.find(
            (item) => item.id === values.sourceId,
        );
        if (source?.requiresReferral && !values.referredBy) {
            methods.setError('referredBy', {
                type: 'manual',
                message: 'REQUIRED',
            });
            return;
        }
        try {
            const lead = await create.mutateAsync({
                ...toLeadRequest(values, source),
                leaveUnassigned: owner === 'none',
            });
            setLastSource(values.sourceId);
            onClose();
            toast('Lead criado em “Novo”.', {
                label: 'Abrir lead',
                onSelect: () =>
                    void navigate({
                        to: '/leads/$leadId',
                        params: { leadId: lead.id },
                    }),
            });
        } catch (error) {
            const existing = duplicateLeadId(error);
            if (existing !== null) {
                const known = queryClient
                    .getQueryData<LeadSummary[]>(leadsKey)
                    ?.find((item) => item.id === existing);
                setDuplicate({ id: existing, name: known?.name });
                return;
            }
            if (
                !applyServerFieldErrors(error, methods.setError, leadFormFields)
            )
                setFailure(describeError(error));
        }
    });

    return (
        <Drawer
            title="Novo lead"
            description="O lead será criado na etapa Novo."
            submitLabel="Criar lead"
            loading={create.isPending}
            onClose={onClose}
            onSubmit={submit}
        >
            {failure ? (
                <Alert tone="danger" title="Não foi possível criar o lead.">
                    {failure}
                </Alert>
            ) : null}
            <FormProvider {...methods}>
                <LeadFields
                    sources={manualSources}
                    autoFocus
                    duplicate={duplicate}
                    sourceHint={
                        lastSource && sourceId === lastSource
                            ? 'Última origem usada nesta sessão.'
                            : undefined
                    }
                />
            </FormProvider>
            <SelectField
                label="Responsável"
                value={owner}
                onChange={(event) =>
                    setOwner(event.target.value as 'me' | 'none')
                }
            >
                <option value="me">
                    {session?.user.fullName ?? 'Você'} (você)
                </option>
                <option value="none">Sem responsável</option>
            </SelectField>
        </Drawer>
    );
}
