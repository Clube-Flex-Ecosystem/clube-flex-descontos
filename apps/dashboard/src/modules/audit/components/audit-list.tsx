import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { AuditEvent } from '@flex/contracts';
import { useCan } from '../../auth';
import { usersQueryOptions } from '../../users';
import { AuditEventDrawer } from './audit-event-drawer';
import { AuditData, type AuditPeriod } from './audit-data';
import { auditQueryOptions } from '../queries/audit.query';

/** Começo do período selecionado; indefinido representa todo o período. */
export function getAuditPeriodStart(period: AuditPeriod): string | undefined {
  const now = new Date();
  if (period === 'all') return undefined;
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  const days = period === '7d' ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Coordena filtros e paginação; o componente de dados recebe valores e eventos. */
export function AuditList({ initialSince }: { initialSince: string | undefined }) {
  const canViewUsers = useCan('users.view');
  const users = useQuery({ ...usersQueryOptions, enabled: canViewUsers });
  const [period, setPeriod] = useState<AuditPeriod>('30d');
  // Mantém o marco estável durante a consulta; só muda quando o filtro é aplicado.
  const [since, setSince] = useState<string | undefined>(initialSince);
  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const { data } = useSuspenseQuery(
    auditQueryOptions({
      page,
      ...(action ? { action } : {}),
      ...(actorId ? { actorId } : {}),
      ...(targetId ? { targetId } : {}),
      ...(since ? { occurredFrom: since } : {}),
    }),
  );

  const reset = () => {
    setPeriod('30d');
    setSince(getAuditPeriodStart('30d'));
    setAction('');
    setActorId('');
    setTargetId('');
    setPage(1);
  };

  const onFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <AuditData
        data={data}
        users={users.data}
        canViewUsers={canViewUsers}
        period={period}
        action={action}
        actorId={actorId}
        targetId={targetId}
        onPeriodChange={(next) =>
          onFilter(() => {
            setPeriod(next);
            setSince(getAuditPeriodStart(next));
          })
        }
        onActionChange={(next) => onFilter(() => setAction(next))}
        onActorChange={(next) => onFilter(() => setActorId(next))}
        onTargetChange={(next) => onFilter(() => setTargetId(next))}
        onReset={reset}
        onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => setPage((current) => Math.min(pageCount, current + 1))}
        onSelect={setSelected}
      />
      {selected ? (
        <AuditEventDrawer
          event={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
