import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Partner } from '@flex/contracts';
import { removeById, upsertById } from '../../../shared/http/versioning';
import {
    createPartner,
    deletePartner,
    replacePartner,
    runPartnerCommand,
} from '../api/partners.api';
import { partnerKey, partnersKey } from '../queries/partners.query';

/**
 * O parceiro é o agregado usado para atualizar o cache: toda mutação devolve a
 * representação completa, que substitui o detalhe e o item da listagem sem nova consulta.
 * Os `warnings` são transitórios e por isso não são mantidos no cache.
 */
function usePartnersCache() {
    const queryClient = useQueryClient();
    return {
        write: (partner: Partner) => {
            const stored: Partner = { ...partner };
            delete stored.warnings;
            queryClient.setQueryData<Partner>(partnerKey(partner.id), stored);
            queryClient.setQueryData<Partner[]>(partnersKey, (current) =>
                current ? upsertById(current, stored) : current,
            );
        },
        remove: (partner: Partner) => {
            queryClient.removeQueries({ queryKey: partnerKey(partner.id) });
            queryClient.setQueryData<Partner[]>(partnersKey, (current) =>
                current ? removeById(current, partner.id) : current,
            );
        },
    };
}

export function useCreatePartner() {
    const cache = usePartnersCache();
    return useMutation({ mutationFn: createPartner, onSuccess: cache.write });
}

export function useReplacePartner() {
    const cache = usePartnersCache();
    return useMutation({ mutationFn: replacePartner, onSuccess: cache.write });
}

export function usePartnerCommand() {
    const cache = usePartnersCache();
    return useMutation({
        mutationFn: runPartnerCommand,
        onSuccess: cache.write,
    });
}

export function useDeletePartner() {
    const cache = usePartnersCache();
    return useMutation({ mutationFn: deletePartner, onSuccess: cache.remove });
}
