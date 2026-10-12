import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState, useTransition } from 'react';
import type { AuditEvent } from '@flex/contracts';
import { useCan } from '../../auth';
import { usersQueryOptions } from '../../users';
import { useListContext } from '../../../shared/utils/list-context';
import { AuditEventDrawer } from './audit-event-drawer';
import { AuditData, type AuditPeriod } from './audit-data';
import { auditQueryOptions } from '../queries/audit.query';

/** Começo do período selecionado; indefinido representa todo o período. */
export function getAuditPeriodStart(period: AuditPeriod): string | undefined {
  const now = new Date();
  if (period === 'all') return undefined;
  if (period === 'today') {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
  }
  const days = period === '7d' ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

interface AuditFilters {
  period: AuditPeriod;
  /** Marco estável do período, recalculado só quando o período muda. */
  since: string | undefined;
  action: string;
  actorId: string;
  targetId: string;
  page: number;
}

const defaults = (since: string | undefined): AuditFilters => ({
  period: '30d',
  since,
  action: '',
  actorId: '',
  targetId: '',
  page: 1,
});

/**
 * Coordena filtros e paginação, preservados em memória durante a sessão. As trocas
 * acontecem em transição: a tabela anterior continua visível até a nova página chegar.
 */
export function AuditList({
  initialSince,
}: {
  initialSince: string | undefined;
}) {
  const canViewUsers = useCan('users.view');
  const users = useQuery({ ...usersQueryOptions, enabled: canViewUsers });
  const [filters, setFilters] = useListContext<AuditFilters>(
    'audit',
    defaults(initialSince),
  );
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const { data } = useSuspenseQuery(
    auditQueryOptions({
      page: filters.page,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.targetId ? { targetId: filters.targetId } : {}),
      ...(filters.since ? { occurredFrom: filters.since } : {}),
    }),
  );

  const apply = (next: Partial<AuditFilters>) =>
    startTransition(() =>
      setFilters((current) => ({ ...current, page: 1, ...next })),
    );
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const filtered = Boolean(
    filters.period !== '30d' ||
    filters.action ||
    filters.actorId ||
    filters.targetId,
  );

  return (
    <>
      <AuditData
        data={data}
        users={users.data}
        canViewUsers={canViewUsers}
        period={filters.period}
        action={filters.action}
        actorId={filters.actorId}
        targetId={filters.targetId}
        pending={pending}
        filtered={filtered}
        onPeriodChange={(period) =>
          apply({ period, since: getAuditPeriodStart(period) })
        }
        onActionChange={(action) => apply({ action })}
        onActorChange={(actorId) => apply({ actorId })}
        onTargetChange={(targetId) => apply({ targetId })}
        onReset={() => apply(defaults(getAuditPeriodStart('30d')))}
        onPreviousPage={() => apply({ page: Math.max(1, filters.page - 1) })}
        onNextPage={() =>
          apply({ page: Math.min(pageCount, filters.page + 1) })
        }
        onSelect={setSelected}
      />
      {selected ? (
        <AuditEventDrawer
          event={selected}
          users={users.data}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
