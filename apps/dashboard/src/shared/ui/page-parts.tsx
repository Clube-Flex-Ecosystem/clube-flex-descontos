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
          className={`t-small muted mt-1 max-w-prose ${monoDescription ? 'font-mono' : ''}`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      {leading ? (
        <div className="flex min-w-0 items-center gap-3.5">
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

/** Estado vazio: explica a ausência e oferece somente a ação permitida. */
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
    <div className="rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center">
      <Icon
        name={icon}
        size="lg"
        className="mx-auto mb-2 text-muted-foreground"
      />
      <strong className="t-card block">{title}</strong>
      <p className="t-small muted mx-auto mt-0.5 mb-3 max-w-prose">
        {children}
      </p>
      {action}
    </div>
  );
}

const skeleton =
  'animate-[shimmer_1.4s_ease-in-out_infinite] bg-linear-to-r from-secondary via-muted to-secondary bg-[length:200%_100%]';

/** Carregamento estrutural: preserva a forma das linhas que serão exibidas. */
export function ListSkeleton({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl border border-border bg-surface p-4 shadow-sm"
      role="status"
      aria-label={label}
    >
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="grid grid-cols-[32px_1fr_90px_70px] items-center gap-3 border-b border-border py-2.5 last:border-b-0"
        >
          <div className={`${skeleton} size-8 rounded-md`} />
          <div className={`${skeleton} h-3 w-2/3 rounded-sm`} />
          <div className={`${skeleton} h-3 rounded-sm`} />
          <div className={`${skeleton} h-3 rounded-sm`} />
        </div>
      ))}
    </div>
  );
}
