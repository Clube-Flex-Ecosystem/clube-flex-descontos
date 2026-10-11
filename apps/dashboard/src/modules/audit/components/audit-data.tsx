import type { ComponentProps } from 'react';
import {
  auditActions,
  type AdminUser,
  type AuditEvent,
  type AuditEventPage,
} from '@flex/contracts';
import { auditActionLabel, formatAuditDate, presentAuditEvent } from '../audit-format';
import { initialsOf } from '../../../shared/utils/initials';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { TableSelect } from '../../../shared/ui/form-controls';

export type AuditPeriod = '30d' | '7d' | 'today' | 'all';

const PERIODS: { value: AuditPeriod; label: string }[] = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: 'today', label: 'Hoje' },
  { value: 'all', label: 'Todo o período' },
];

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

interface AuditDataProps {
  data: AuditEventPage;
  users: AdminUser[] | undefined;
  canViewUsers: boolean;
  period: AuditPeriod;
  action: string;
  actorId: string;
  targetId: string;
  onPeriodChange: (period: AuditPeriod) => void;
  onActionChange: (action: string) => void;
  onActorChange: (actorId: string) => void;
  onTargetChange: (targetId: string) => void;
  onReset: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onSelect: (event: AuditEvent) => void;
}

/** Filtros, tabela e paginação de auditoria, sem consultas próprias. */
export function AuditData({
  data,
  users,
  canViewUsers,
  period,
  action,
  actorId,
  targetId,
  onPeriodChange,
  onActionChange,
  onActorChange,
  onTargetChange,
  onReset,
  onPreviousPage,
  onNextPage,
  onSelect,
}: AuditDataProps) {
  const names = new Map((users ?? []).map((user) => [user.id, user.fullName]));
  const nameOf = (id: string | undefined, fallback: string) =>
    (id ? names.get(id) : undefined) ?? fallback;
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const firstRow = data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const lastRow =
    data.total > 0 ? firstRow + data.items.length - 1 : 0;

  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <FilterSelect
            aria-label="Período"
            value={period}
            onChange={(event) =>
              onPeriodChange(event.target.value as AuditPeriod)
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
            onChange={(event) => onActionChange(event.target.value)}
          >
            <option value="">Todas as ações</option>
            {auditActions.map((value) => (
              <option key={value} value={value}>
                {auditActionLabel(value)}
              </option>
            ))}
          </FilterSelect>
          {canViewUsers && users ? (
            <>
              <FilterSelect
                aria-label="Autor"
                value={actorId}
                onChange={(event) => onActorChange(event.target.value)}
              >
                <option value="">Todos os autores</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                aria-label="Usuário afetado"
                value={targetId}
                onChange={(event) => onTargetChange(event.target.value)}
              >
                <option value="">Todos os afetados</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </FilterSelect>
            </>
          ) : null}
        </div>
        <Button variant="quiet" compact onClick={onReset}>
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
                    if ((click.target as HTMLElement).closest('button')) return;
                    onSelect(event);
                  }}
                >
                  <td className="tnum h-12 border-b border-border px-4 py-1.5 whitespace-nowrap text-muted-foreground group-last:border-b-0 group-hover:bg-surface-hover">
                    {date}
                  </td>
                  <td className="h-12 border-b border-border px-4 py-1.5 font-semibold whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-hover">
                    {label}
                  </td>
                  <td className="h-12 border-b border-border px-4 py-1.5 whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-hover">
                    <Person name={nameOf(event.actor.id, event.actor.username)} />
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
                      onClick={() => onSelect(event)}
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
            disabled={data.page <= 1}
            onClick={onPreviousPage}
          >
            <Icon name="left" />
          </Button>
          <span>
            Página {data.page} de {pageCount}
          </span>
          <Button
            compact
            aria-label="Próxima página"
            disabled={data.page >= pageCount}
            onClick={onNextPage}
          >
            <Icon name="right" />
          </Button>
        </div>
      </div>
    </section>
  );
}
