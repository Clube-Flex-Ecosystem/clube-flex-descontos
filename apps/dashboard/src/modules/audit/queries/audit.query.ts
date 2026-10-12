import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { listAuditEvents, type AuditFilters } from '../api/audit.api';

export const auditKey = ['audit'] as const;

/** Uma página da auditoria; a página anterior permanece visível durante a troca. */
export const auditQueryOptions = (filters: AuditFilters) =>
    queryOptions({
        queryKey: [...auditKey, filters],
        queryFn: () => listAuditEvents(filters),
        placeholderData: keepPreviousData,
    });
