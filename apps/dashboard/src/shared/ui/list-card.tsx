import type { ReactNode } from 'react';
import { Icon } from './icon';

export interface StateTab<V extends string> {
    value: V;
    label: string;
    count: number;
}

interface ListCardProps<V extends string> {
    tabs: StateTab<V>[];
    activeTab: V;
    onTabChange: (value: V) => void;
    search: string;
    onSearchChange: (value: string) => void;
    searchLabel: string;
    /** Contagem exibida no rodapé, como `8 parceiros`. */
    footer: string;
    children: ReactNode;
}

/**
 * Cartão de listagem administrativa: filtros de estado e busca locais na mesma barra,
 * tabela e rodapé com contagem. A coleção completa já está carregada (sem paginação).
 */
export function ListCard<V extends string>({
    tabs,
    activeTab,
    onTabChange,
    search,
    onSearchChange,
    searchLabel,
    footer,
    children,
}: ListCardProps<V>) {
    return (
        <section className="rounded-card border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 py-2 pr-3 pl-4">
                <div
                    role="group"
                    aria-label="Filtrar por estado"
                    className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-control border border-border bg-surface-muted p-0.5"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            aria-pressed={tab.value === activeTab}
                            onClick={() => onTabChange(tab.value)}
                            className="t-button inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-badge px-2.5 whitespace-nowrap text-muted-foreground hover:text-foreground aria-pressed:bg-surface aria-pressed:text-foreground aria-pressed:ring-1 aria-pressed:ring-border-strong md:min-h-[calc(var(--control-sm)-6px)]"
                        >
                            {tab.label}
                            <span className="tnum font-medium text-muted-foreground">
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative flex w-full items-center md:w-60">
                    <Icon
                        name="search"
                        className="pointer-events-none absolute left-3 text-muted-foreground"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        aria-label={searchLabel}
                        placeholder={searchLabel}
                        className="min-h-11 w-full rounded-control border border-control-border bg-surface pr-3 pl-9 hover:border-control-border-hover focus-visible:border-focus focus-visible:ring-1 focus-visible:ring-focus focus-visible:outline-hidden md:min-h-control-sm"
                    />
                </div>
            </div>
            {children}
            <div className="t-caption tnum flex items-center justify-between gap-3 border-t border-border px-4 py-2 font-normal text-muted-foreground">
                <span aria-live="polite">{footer}</span>
            </div>
        </section>
    );
}
