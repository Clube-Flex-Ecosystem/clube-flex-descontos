import type { ReactNode } from 'react';

/** Painel plano: separado por borda, sem sombra. */
export function Card({ children }: { children: ReactNode }) {
    return (
        <section className="rounded-card border border-border bg-surface">
            {children}
        </section>
    );
}

/**
 * Coluna de uma página de detalhe: cartões independentes, um por seção, sem
 * aninhamento (cartão dentro de cartão é proibido).
 */
export function CardStack({ children }: { children: ReactNode }) {
    return <div className="grid content-start gap-4">{children}</div>;
}

/** Cabeçalho do painel: título, descrição opcional e conteúdo à direita. */
export function CardHead({
    title,
    description,
    aside,
    divided = true,
    headingLevel: Heading = 'h2',
}: {
    title: string;
    description?: string;
    aside?: ReactNode;
    /** Linha divisória abaixo, quando o cabeçalho é seguido por conteúdo. */
    divided?: boolean;
    headingLevel?: 'h2' | 'h3';
}) {
    return (
        <header
            className={`flex items-center justify-between gap-3 px-4 py-3 ${divided ? 'border-b border-border' : ''}`}
        >
            <div className="min-w-0">
                <Heading className="t-section">{title}</Heading>
                {description ? (
                    <p className="t-caption mt-px font-normal text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {aside}
        </header>
    );
}

/** Corpo do painel com o espaçamento padrão. */
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
                grid ? 'grid gap-4 p-4 sm:grid-cols-2' : 'grid gap-2 p-4'
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
                    <dt className="t-body-small text-muted-foreground">
                        {row.label}
                    </dt>
                    <dd className="min-w-0 wrap-anywhere">{row.value}</dd>
                </div>
            ))}
        </dl>
    );
}
