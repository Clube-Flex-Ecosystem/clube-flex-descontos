import { queryOptions } from '@tanstack/react-query';
import { getPartner, listPartners } from '../api/partners.api';

export const partnersKey = ['partners'] as const;

/** Coleção completa de parceiros em todos os estados; não é paginada. */
export const partnersQueryOptions = queryOptions({
    queryKey: partnersKey,
    queryFn: listPartners,
});

export const partnerKey = (id: string) => ['partners', id] as const;

export const partnerQueryOptions = (id: string) =>
    queryOptions({
        queryKey: partnerKey(id),
        queryFn: () => getPartner(id),
    });
