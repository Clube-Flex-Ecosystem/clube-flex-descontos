import { queryOptions } from '@tanstack/react-query';
import { leadsApi } from '../api/leads.api';
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
export const sourcesQueryOptions = queryOptions({
  queryKey: ['lead-sources'],
  queryFn: leadsApi.sources,
});
