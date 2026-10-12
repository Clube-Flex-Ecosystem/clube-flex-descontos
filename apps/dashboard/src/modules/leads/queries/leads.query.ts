import { queryOptions } from '@tanstack/react-query';
import { leadsApi, sourcesApi } from '../api/leads.api';
export const leadsKey = ['leads'] as const;
export const leadsQueryOptions = queryOptions({
    queryKey: leadsKey,
    queryFn: leadsApi.list,
});
export const leadQueryOptions = (id: string) =>
    queryOptions({
        queryKey: [...leadsKey, id],
        queryFn: () => leadsApi.get(id),
    });
export const historyQueryOptions = (id: string) =>
    queryOptions({
        queryKey: [...leadsKey, id, 'history'],
        queryFn: () => leadsApi.history(id),
    });
export const sourcesKey = ['lead-sources'] as const;
export const sourcesQueryOptions = queryOptions({
    queryKey: sourcesKey,
    queryFn: sourcesApi.list,
});
/** Contas ativas que podem receber leads; a rota exige `leads.view-all`. */
export const assigneesQueryOptions = queryOptions({
    queryKey: ['lead-assignees'],
    queryFn: leadsApi.assignees,
});
