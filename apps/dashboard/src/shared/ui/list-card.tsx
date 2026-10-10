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
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div
          role="group"
          aria-label="Filtrar por estado"
          className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-md border border-border bg-surface-muted p-0.5"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={tab.value === activeTab}
              onClick={() => onTabChange(tab.value)}
              className="t-label inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-sm px-2.5 whitespace-nowrap text-muted-foreground hover:text-foreground aria-pressed:bg-surface aria-pressed:text-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-border md:min-h-control-sm"
            >
              {tab.label}
              <span className="tnum font-medium opacity-70">{tab.count}</span>
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
            className="min-h-11 w-full rounded-md border border-control-border bg-control pr-3 pl-9 shadow-control-inset hover:border-control-border-hover focus:border-focus focus:ring-4 focus:ring-focus-ring focus:outline-hidden md:min-h-control-md"
          />
        </div>
      </div>
      {children}
      <div className="t-small tnum flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-muted-foreground">
        <span aria-live="polite">{footer}</span>
        <span>Ordem alfabética · sem paginação</span>
      </div>
    </section>
  );
}
