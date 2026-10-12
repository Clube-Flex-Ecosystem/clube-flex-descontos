import type { AuditEventPage, AuditQuery } from '@flex/contracts';
import { http } from '../../../shared/http/client';

export type AuditFilters = Partial<
    Pick<
        AuditQuery,
        'page' | 'pageSize' | 'actorId' | 'action' | 'targetId' | 'occurredFrom'
    >
>;

export async function listAuditEvents(
    filters: AuditFilters,
): Promise<AuditEventPage> {
    const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined),
    );
    return (
        await http.get<AuditEventPage>('/v1/admin/audit-events', { params })
    ).data;
}
