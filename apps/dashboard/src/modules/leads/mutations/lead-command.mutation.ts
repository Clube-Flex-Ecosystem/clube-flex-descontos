import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lead, LeadSummary } from '@flex/contracts';
import { upsertById } from '../../../shared/http/versioning';
import { leadsKey } from '../queries/leads.query';

/**
 * Operação sobre um lead que devolve o agregado completo (observar, tratar interesse,
 * atribuir, editar dados, mudar etapa). A resposta substitui o lead na coleção e no
 * detalhe e atualiza o histórico; cada instância tem o próprio estado de processamento.
 */
export function useLeadCommand() {
    const queryClient = useQueryClient();
    return useMutation<Lead, Error, () => Promise<Lead>>({
        mutationFn: (run) => run(),
        onSuccess: (lead) => {
            queryClient.setQueryData<Lead>([...leadsKey, lead.id], lead);
            queryClient.setQueryData<LeadSummary[]>(leadsKey, (current) =>
                current ? upsertById(current, lead) : current,
            );
            void queryClient.invalidateQueries({
                queryKey: [...leadsKey, lead.id, 'history'],
            });
        },
    });
}
