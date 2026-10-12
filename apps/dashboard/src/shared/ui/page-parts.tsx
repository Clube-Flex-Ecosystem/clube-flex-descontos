import type { ReactNode } from 'react';
import { Icon, type IconName } from './icon';

/** Cabeçalho compacto: título e descrição de uma linha, ação principal à direita. */
export function PageHeader({
    title,
    description,
    actions,
    status,
    leading,
    monoDescription = false,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
    /** Estado do registro, ao lado do título (ex.: badge de rascunho). */
    status?: ReactNode;
    /** Marca à esquerda do título, como o avatar de uma conta. */
    leading?: ReactNode;
    /** Descrição em fonte monoespaçada, para identificadores. */
    monoDescription?: boolean;
}) {
    const heading = (
        <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="t-page">{title}</h1>
                {status}
            </div>
            {description ? (
                <p
                    className={`t-body-small muted mt-0.5 max-w-prose ${monoDescription ? 'font-mono' : ''}`}
                >
                    {description}
                </p>
            ) : null}
        </div>
    );
    return (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {leading ? (
                <div className="flex min-w-0 items-center gap-3">
                    {leading}
                    {heading}
                </div>
            ) : (
                heading
            )}
            {actions ? (
                <div className="flex flex-none flex-wrap gap-2">{actions}</div>
            ) : null}
        </div>
    );
}

/**
 * Estado vazio dentro da região que ficou vazia: explica a ausência e oferece somente
 * a ação permitida (secundária quando a página já possui a ação principal).
 */
export function EmptyState({
    icon,
    title,
    children,
    action,
}: {
    icon: IconName;
    title: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="rounded-card border border-border bg-surface px-4 py-10 text-center">
            <Icon
                name={icon}
                size="lg"
                className="mx-auto mb-1.5 text-placeholder"
            />
            <strong className="t-body block font-semibold">{title}</strong>
            <p className="t-body-small muted mx-auto mt-0.5 mb-3 max-w-prose">
                {children}
            </p>
            {action}
        </div>
    );
}

const skeleton =
    'animate-[shimmer_1.4s_ease-in-out_infinite] rounded-badge bg-linear-to-r from-surface-muted via-background to-surface-muted bg-[length:200%_100%]';

/** Carregamento estrutural: preserva a moldura e a altura das linhas da tabela. */
export function ListSkeleton({ label }: { label: string }) {
    return (
        <div
            className="overflow-hidden rounded-card border border-border bg-surface"
            role="status"
            aria-label={label}
        >
            <div className="h-12 border-b border-border" />
            <div className="h-table-header border-b border-border-strong" />
            {[0, 1, 2, 3, 4].map((row) => (
                <div
                    key={row}
                    className="grid h-row-default grid-cols-[1fr_120px_72px] items-center gap-3 border-b border-border px-4 last:border-b-0"
                >
                    <div className={`${skeleton} h-2.5 w-2/3`} />
                    <div className={`${skeleton} h-2.5`} />
                    <div className={`${skeleton} h-4`} />
                </div>
            ))}
        </div>
    );
}
