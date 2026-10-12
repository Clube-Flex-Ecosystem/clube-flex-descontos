import type { ComponentProps } from 'react';
import {
    auditActions,
    type AdminUser,
    type AuditEvent,
    type AuditEventPage,
} from '@flex/contracts';
import {
    auditActionLabel,
    formatAuditDate,
    presentAuditEvent,
} from '../audit-format';
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
                className="t-caption grid size-5 flex-none place-items-center rounded-full bg-identity text-[0.5625rem] font-semibold text-identity-foreground"
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
    /** Nova página a caminho: a tabela anterior fica esmaecida. */
    pending: boolean;
    /** Algum filtro difere do padrão. */
    filtered: boolean;
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
    pending,
    filtered,
    onPeriodChange,
    onActionChange,
    onActorChange,
    onTargetChange,
    onReset,
    onPreviousPage,
    onNextPage,
    onSelect,
}: AuditDataProps) {
    const names = new Map(
        (users ?? []).map((user) => [user.id, user.fullName]),
    );
    const nameOf = (id: string | undefined, fallback: string) =>
        (id ? names.get(id) : undefined) ?? fallback;
    const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
    const firstRow = data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
    const lastRow = data.total > 0 ? firstRow + data.items.length - 1 : 0;

    return (
        <section className="rounded-card border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 py-2 pr-3 pl-4">
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
                                onChange={(event) =>
                                    onActorChange(event.target.value)
                                }
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
                                onChange={(event) =>
                                    onTargetChange(event.target.value)
                                }
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
                {filtered ? (
                    <Button variant="quiet" compact onClick={onReset}>
                        Limpar filtros
                    </Button>
                ) : null}
            </div>
            {pending ? (
                <div
                    className="h-0.5 overflow-hidden bg-surface-muted"
                    role="progressbar"
                    aria-label="Atualizando eventos"
                >
                    <div className="h-full w-2/5 animate-[indeterminate_1s_ease-in-out_infinite] bg-selected" />
                </div>
            ) : null}

            <div className="overflow-x-auto">
                <table className="w-full min-w-180 border-separate border-spacing-0">
                    <thead>
                        <tr>
                            {[
                                'Data e hora',
                                'Ação',
                                'Autor',
                                'Afetado',
                                'Objeto',
                            ].map((header) => (
                                <th
                                    key={header}
                                    scope="col"
                                    className="t-table-header h-table-header border-y border-border bg-surface px-4 text-left whitespace-nowrap text-muted-foreground"
                                >
                                    {header}
                                </th>
                            ))}
                            <th
                                scope="col"
                                className="border-y border-border bg-surface"
                            >
                                <span className="sr-only">Detalhes</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody
                        className={pending ? 'opacity-50' : undefined}
                        aria-busy={pending || undefined}
                    >
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
                                    {filtered ? (
                                        <span className="mt-2.5 block">
                                            <Button compact onClick={onReset}>
                                                Limpar filtros
                                            </Button>
                                        </span>
                                    ) : null}
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
                                        if (
                                            (
                                                click.target as HTMLElement
                                            ).closest('button')
                                        )
                                            return;
                                        onSelect(event);
                                    }}
                                >
                                    <td className="tnum h-row-default border-b border-border px-4 py-1 whitespace-nowrap text-muted-foreground group-last:border-b-0 group-hover:bg-surface-muted">
                                        {date}
                                    </td>
                                    <td className="h-row-default border-b border-border px-4 py-1 font-semibold whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-muted">
                                        {label}
                                    </td>
                                    <td className="h-row-default border-b border-border px-4 py-1 whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-muted">
                                        <Person
                                            name={nameOf(
                                                event.actor.id,
                                                event.actor.username,
                                            )}
                                        />
                                    </td>
                                    <td className="h-row-default border-b border-border px-4 py-1 whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-muted">
                                        {event.target.type === 'user' &&
                                        event.target.label ? (
                                            <Person
                                                name={nameOf(
                                                    event.target.id,
                                                    event.target.label,
                                                )}
                                            />
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="h-row-default border-b border-border px-4 py-1 whitespace-nowrap text-muted-foreground group-last:border-b-0 group-hover:bg-surface-muted">
                                        {view.object}
                                    </td>
                                    <td className="h-row-default w-px border-b border-border px-4 py-1 text-right whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-muted">
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

            <div className="t-caption tnum flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2 font-normal text-muted-foreground">
                <span aria-live="polite">
                    {pending
                        ? 'Atualizando…'
                        : data.total === 0
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
