import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { auditActions, type AuditEvent } from '@flex/contracts';
import { useCan } from '../../auth';
import { usersQueryOptions } from '../../users';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { TableSelect } from '../../../shared/ui/form-controls';
import type { ComponentProps } from 'react';
import { ListSkeleton, PageHeader } from '../../../shared/ui/page-parts';
import { initialsOf } from '../../../shared/utils/initials';
import { AuditEventDrawer } from '../components/audit-event-drawer';
import {
  auditActionLabel,
  formatAuditDate,
  presentAuditEvent,
} from '../audit-format';
import { auditQueryOptions } from '../queries/audit.query';

const PERIODS = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: 'today', label: 'Hoje' },
  { value: 'all', label: 'Todo o período' },
] as const;
type Period = (typeof PERIODS)[number]['value'];

/** Início do período escolhido, em ISO; `undefined` para todo o período. */
function periodStart(period: Period): string | undefined {
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

/** Seletor da barra de filtros: largura do conteúdo, não da linha. */
function FilterSelect(props: ComponentProps<typeof TableSelect>) {
  return (
    <span className="inline-block max-w-full">
      <TableSelect {...props} />
    </span>
  );
}

function Person({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="t-caption grid size-5.5 flex-none place-items-center rounded-full bg-accent-soft font-bold text-accent-foreground"
        aria-hidden="true"
      >
        {initialsOf(name)}
      </span>
      {name}
    </span>
  );
}

export function AuditPage() {
  const canViewUsers = useCan('users.view');
  const users = useQuery({ ...usersQueryOptions, enabled: canViewUsers });
  const [period, setPeriod] = useState<Period>('30d');
  // O início do período é fixado ao escolhê-lo para manter a consulta estável.
  const [since, setSince] = useState<string | undefined>(() =>
    periodStart('30d'),
  );
  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const events = useQuery(
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
    setSince(periodStart('30d'));
    setAction('');
    setActorId('');
    setTargetId('');
    setPage(1);
  };
  const onFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const names = new Map((users.data ?? []).map((u) => [u.id, u.fullName]));
  const nameOf = (id: string | undefined, fallback: string) =>
    (id ? names.get(id) : undefined) ?? fallback;

  const data = events.data;
  const pageCount = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;
  const firstRow =
    data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const lastRow = data
    ? firstRow + data.items.length - (data.total > 0 ? 1 : 0)
    : 0;

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Registro imutável de operações administrativas sensíveis."
      />

      {events.isPending ? <ListSkeleton label="Carregando eventos" /> : null}
      {events.isError ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar a auditoria."
          action={
            <Button
              compact
              loading={events.isFetching}
              onClick={() => void events.refetch()}
            >
              <Icon name="refresh" />
              Tentar novamente
            </Button>
          }
        >
          {describeError(events.error)}
        </Alert>
      ) : null}

      {data ? (
        <section className="rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <FilterSelect
                aria-label="Período"
                value={period}
                onChange={(event) =>
                  onFilter(() => {
                    const next = event.target.value as Period;
                    setPeriod(next);
                    setSince(periodStart(next));
                  })
                }
              >
                {PERIODS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                aria-label="Ação"
                value={action}
                onChange={(event) =>
                  onFilter(() => setAction(event.target.value))
                }
              >
                <option value="">Todas as ações</option>
                {auditActions.map((value) => (
                  <option key={value} value={value}>
                    {auditActionLabel(value)}
                  </option>
                ))}
              </FilterSelect>
              {canViewUsers && users.data ? (
                <>
                  <FilterSelect
                    aria-label="Autor"
                    value={actorId}
                    onChange={(event) =>
                      onFilter(() => setActorId(event.target.value))
                    }
                  >
                    <option value="">Todos os autores</option>
                    {users.data.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </FilterSelect>
                  <FilterSelect
                    aria-label="Usuário afetado"
                    value={targetId}
                    onChange={(event) =>
                      onFilter(() => setTargetId(event.target.value))
                    }
                  >
                    <option value="">Todos os afetados</option>
                    {users.data.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </FilterSelect>
                </>
              ) : null}
            </div>
            <Button variant="quiet" compact onClick={reset}>
              Limpar filtros
            </Button>
          </div>

          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-180 border-separate border-spacing-0">
              <thead>
                <tr>
                  {['Data e hora', 'Ação', 'Autor', 'Afetado', 'Objeto'].map(
                    (header) => (
                      <th
                        key={header}
                        scope="col"
                        className="t-small h-9 border-b border-border bg-surface px-4 text-left font-medium whitespace-nowrap text-muted-foreground"
                      >
                        {header}
                      </th>
                    ),
                  )}
                  <th scope="col" className="border-b border-border bg-surface">
                    <span className="sr-only">Detalhes</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      <strong className="block font-semibold text-foreground">
                        Nenhum evento com esses filtros.
                      </strong>
                      Amplie o período ou remova filtros.
                    </td>
                  </tr>
                ) : null}
                {data.items.map((event) => {
                  const view = presentAuditEvent(event);
                  const label = auditActionLabel(event.action);
                  const date = formatAuditDate(event.occurredAt);
                  return (
                    <tr
                      key={event.id}
                      className="group cursor-pointer"
                      onClick={(click) => {
                        if ((click.target as HTMLElement).closest('button'))
                          return;
                        setSelected(event);
                      }}
                    >
                      <td className="tnum h-12 border-b border-border px-4 py-1.5 whitespace-nowrap text-muted-foreground group-last:border-b-0 group-hover:bg-surface-hover">
                        {date}
                      </td>
                      <td className="h-12 border-b border-border px-4 py-1.5 font-semibold whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-hover">
                        {label}
                      </td>
                      <td className="h-12 border-b border-border px-4 py-1.5 whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-hover">
                        <Person
                          name={nameOf(event.actor.id, event.actor.username)}
                        />
                      </td>
                      <td className="h-12 border-b border-border px-4 py-1.5 whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-hover">
                        {event.target.type === 'user' && event.target.label ? (
                          <Person
                            name={nameOf(event.target.id, event.target.label)}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="h-12 border-b border-border px-4 py-1.5 whitespace-nowrap text-muted-foreground group-last:border-b-0 group-hover:bg-surface-hover">
                        {view.object}
                      </td>
                      <td className="h-12 w-px border-b border-border px-2.5 py-1.5 text-right whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-hover">
                        <Button
                          variant="quiet"
                          compact
                          aria-label={`Ver detalhes: ${label} em ${date}`}
                          onClick={() => setSelected(event)}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="t-small tnum flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-muted-foreground">
            <span aria-live="polite">
              {data.total === 0
                ? '0 eventos'
                : `${firstRow}–${lastRow} de ${data.total} ${data.total === 1 ? 'evento' : 'eventos'}`}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                compact
                aria-label="Página anterior"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <Icon name="left" />
              </Button>
              <span>
                Página {data.page} de {pageCount}
              </span>
              <Button
                compact
                aria-label="Próxima página"
                disabled={page >= pageCount}
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
              >
                <Icon name="right" />
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {selected ? (
        <AuditEventDrawer event={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
