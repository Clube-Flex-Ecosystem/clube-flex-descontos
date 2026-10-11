import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  /** Valores numéricos ficam alinhados à direita. */
  align?: 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions: (row: T) => ReactNode;
  emptyTitle: string;
  /** Torna a linha clicável; os controles internos continuam funcionando por conta própria. */
  onRowClick?: (row: T) => void;
}

/**
 * Tabela de listagem: cabeçalho sem preenchimento, divisórias discretas, coluna de
 * identificação fixa na rolagem horizontal e ações à direita.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  emptyTitle,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto border-t border-border">
      <table className="w-full min-w-180 border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.header}
                scope="col"
                className={[
                  't-small h-9 border-b border-border bg-surface px-4 font-medium whitespace-nowrap text-muted-foreground',
                  column.align === 'right' ? 'text-right' : 'text-left',
                  index === 0 ? 'sticky left-0 z-1' : '',
                ].join(' ')}
              >
                {column.header}
              </th>
            ))}
            <th scope="col" className="border-b border-border bg-surface">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                <strong className="block font-semibold text-foreground">
                  {emptyTitle}
                </strong>
                Ajuste a busca ou o filtro de estado.
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? 'group cursor-pointer' : 'group'}
              onClick={
                onRowClick
                  ? (event) => {
                      if (
                        (event.target as HTMLElement).closest(
                          'button, a, input, select, textarea',
                        )
                      )
                        return;
                      onRowClick(row);
                    }
                  : undefined
              }
            >
              {columns.map((column, index) => (
                <td
                  key={column.header}
                  className={[
                    'h-12 border-b border-border px-4 py-1.5 whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-hover',
                    column.align === 'right' ? 'tnum text-right' : '',
                    index === 0
                      ? 'sticky left-0 z-1 bg-surface group-hover:bg-surface-hover'
                      : '',
                  ].join(' ')}
                >
                  {column.cell(row)}
                </td>
              ))}
              <td className="h-12 w-px border-b border-border px-2.5 py-1.5 text-right whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-hover">
                <div className="inline-flex items-center gap-0.5">
                  {actions(row)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Identificação de uma linha: marca com iniciais, nome e legenda secundária. */
export function CellMain({
  title,
  subtitle,
  mark,
  extra,
}: {
  title: string;
  subtitle?: string;
  mark?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {mark ? (
        <span
          className="t-caption grid size-8 flex-none place-items-center rounded-md bg-surface-muted font-bold text-accent-foreground ring-1 ring-border ring-inset"
          aria-hidden="true"
        >
          {mark}
        </span>
      ) : null}
      <div className="min-w-0">
        <strong className="t-card block">
          {title}
          {extra ? <span className="ml-1.5 align-middle">{extra}</span> : null}
        </strong>
        {subtitle ? (
          <small className="t-small block text-muted-foreground">
            {subtitle}
          </small>
        ) : null}
      </div>
    </div>
  );
}
