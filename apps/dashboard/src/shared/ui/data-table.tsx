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

/** Célula com recuo de 16px. */
const cellX = 'px-4';

/**
 * Tabela de listagem: cabeçalho com borda, linhas de altura padrão,
 * coluna de identificação fixa na rolagem horizontal e ações à direita.
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-180 border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.header}
                scope="col"
                className={[
                  't-table-header h-table-header border-y border-border bg-surface whitespace-nowrap text-muted-foreground',
                  cellX,
                  column.align === 'right' ? 'text-right' : 'text-left',
                  index === 0 ? 'sticky left-0 z-1' : '',
                ].join(' ')}
              >
                {column.header}
              </th>
            ))}
            <th
              scope="col"
              className={`border-y border-border bg-surface ${cellX}`}
            >
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="t-body-small px-4 py-10 text-center text-muted-foreground"
              >
                <strong className="t-body block font-semibold text-foreground">
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
                    'h-row-default border-b border-border py-1 whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-muted',
                    cellX,
                    column.align === 'right' ? 'tnum text-right' : '',
                    index === 0 ? 'sticky left-0 z-1 bg-surface' : '',
                  ].join(' ')}
                >
                  {column.cell(row)}
                </td>
              ))}
              <td
                className={`h-row-default w-px border-b border-border py-1 text-right whitespace-nowrap group-last:border-b-0 group-hover:bg-surface-muted ${cellX}`}
              >
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

/**
 * Identificação de uma linha: nome e legenda secundária. Pessoas recebem avatar
 * circular; entidades, quadrado de iniciais.
 */
export function CellMain({
  title,
  subtitle,
  avatar,
  mark,
  mono = false,
  extra,
}: {
  title: string;
  subtitle?: string;
  /** Iniciais de uma pessoa. */
  avatar?: string;
  /** Iniciais de uma entidade (parceiro, plano). */
  mark?: string;
  /** Legenda em fonte monoespaçada, para identificadores. */
  mono?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {avatar ? (
        <span
          className="t-caption grid size-7 flex-none place-items-center rounded-full bg-identity font-semibold text-identity-foreground"
          aria-hidden="true"
        >
          {avatar}
        </span>
      ) : null}
      {mark ? (
        <span
          className="t-caption grid size-7.5 flex-none place-items-center rounded-control bg-surface-muted font-bold text-identity-foreground ring-1 ring-border ring-inset"
          aria-hidden="true"
        >
          {mark}
        </span>
      ) : null}
      <div className="min-w-0">
        <strong className="t-body block font-semibold">
          {title}
          {extra ? <span className="ml-1.5 align-middle">{extra}</span> : null}
        </strong>
        {subtitle ? (
          <small
            className={`t-caption block font-normal text-muted-foreground ${mono ? 'font-mono' : ''}`}
          >
            {subtitle}
          </small>
        ) : null}
      </div>
    </div>
  );
}
