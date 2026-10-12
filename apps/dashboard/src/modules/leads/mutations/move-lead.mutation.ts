import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead, LeadStage, LeadSummary } from '@flex/contracts';
import { leadsApi } from '../api/leads.api';
import { leadsKey } from '../queries/leads.query';
import { upsertById } from '../../../shared/http/versioning';

interface MoveLeadInput {
    lead: LeadSummary;
    stage: LeadStage;
    lossReason?: string;
}

interface MoveLeadSnapshot {
    list?: LeadSummary[];
    detail?: Lead;
}

/**
 * Move um card sem refazer a listagem: a previsão otimista é substituída pela
 * representação versionada devolvida pela API e restaurada integralmente em falha.
 */
export function useMoveLead() {
    const queryClient = useQueryClient();

    return useMutation<Lead, Error, MoveLeadInput, MoveLeadSnapshot>({
        mutationFn: ({ lead, stage, lossReason }) =>
            leadsApi.stage(lead.id, lead.version, stage, lossReason),
        onMutate: async ({ lead, stage }) => {
            await queryClient.cancelQueries({ queryKey: leadsKey });
            const snapshot = {
                list: queryClient.getQueryData<LeadSummary[]>(leadsKey),
                detail: queryClient.getQueryData<Lead>([...leadsKey, lead.id]),
            };

            queryClient.setQueryData<LeadSummary[]>(leadsKey, (current) =>
                current?.map((item) =>
                    item.id === lead.id ? { ...item, stage } : item,
                ),
            );
            queryClient.setQueryData<Lead>([...leadsKey, lead.id], (current) =>
                current ? { ...current, stage } : current,
            );
            return snapshot;
        },
        onError: (_error, variables, snapshot) => {
            queryClient.setQueryData(leadsKey, snapshot?.list);
            queryClient.setQueryData(
                [...leadsKey, variables.lead.id],
                snapshot?.detail,
            );
        },
        onSuccess: (lead) => {
            queryClient.setQueryData<LeadSummary[]>(leadsKey, (current) =>
                current ? upsertById(current, lead) : current,
            );
            queryClient.setQueryData<Lead>([...leadsKey, lead.id], lead);
        },
    });
}
