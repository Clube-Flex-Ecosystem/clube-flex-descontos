import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead, LeadSummary } from '@flex/contracts';
import { leadsApi } from '../api/leads.api';
import { leadsKey } from '../queries/leads.query';

/** Cria um lead e atualiza a coleção e o detalhe com a resposta da API. */
export function useCreateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: leadsApi.create,
        onSuccess: (lead) => {
            queryClient.setQueryData<LeadSummary[]>(leadsKey, (current) =>
                current ? [lead, ...current] : current,
            );
            queryClient.setQueryData<Lead>([...leadsKey, lead.id], lead);
        },
    });
}
