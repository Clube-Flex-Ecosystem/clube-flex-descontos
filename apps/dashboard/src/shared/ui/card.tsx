import type { ReactNode } from 'react';

/** Cartão do protótipo; `danger` destaca zonas de ações destrutivas. */
export function Card({
  danger = false,
  children,
}: {
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border bg-surface shadow-sm ${danger ? 'border-danger/30' : 'border-border'}`}
    >
      {children}
    </section>
  );
}

/** Cabeçalho do cartão: título, descrição opcional e conteúdo à direita. */
export function CardHead({
  title,
  description,
  aside,
  danger = false,
  divided = true,
  headingLevel: Heading = 'h2',
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  danger?: boolean;
  /** Linha divisória abaixo, quando o cabeçalho é seguido por conteúdo. */
  divided?: boolean;
  headingLevel?: 'h2' | 'h3';
}) {
  return (
    <header
      className={`flex items-center justify-between gap-3 px-4 py-3.5 ${divided ? 'border-b border-border' : ''}`}
    >
      <div className="min-w-0">
        <Heading className={`t-card ${danger ? 'text-danger' : ''}`}>
          {title}
        </Heading>
        {description ? (
          <p className="t-caption font-normal text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {aside}
    </header>
  );
}

/** Corpo do cartão com o espaçamento padrão. */
export function CardBody({
  grid = false,
  children,
}: {
  /** Duas colunas de campos, que se empilham no móvel. */
  grid?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        grid ? 'grid gap-x-4 gap-y-3.5 p-4 sm:grid-cols-2' : 'grid gap-2 p-4'
      }
    >
      {children}
    </div>
  );
}

/** Lista de definições (rótulo e valor) com divisórias entre as linhas. */
export function DefinitionList({
  rows,
}: {
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid items-baseline gap-0.5 border-b border-border py-2 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-3"
        >
          <dt className="t-small text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 font-medium [overflow-wrap:anywhere]">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
