import type { ActiveStatus, Category } from '@flex/contracts';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import {
  CellMain,
  DataTable,
  type Column,
} from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/page-parts';
import { ListCard } from '../../../shared/ui/list-card';
import { RowMenu, type RowMenuItem } from '../../../shared/ui/row-menu';

interface CategoriesDataProps {
  categories: Category[];
  total: number;
  canManage: boolean;
  /** Parceiros associados à categoria; `null` quando a contagem não está disponível. */
  partnerCount: ((category: Category) => number) | null;
  activeStatus: ActiveStatus | '';
  onStatusChange: (status: ActiveStatus | '') => void;
  statusCount: (status: ActiveStatus | '') => number;
  search: string;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
  onCreate: () => void;
  onEdit: (category: Category) => void;
  onDeactivate: (category: Category) => void;
  onReactivate: (category: Category) => void;
}

/** Apresentação da lista: recebe dados e callbacks, sem buscar estado remoto. */
export function CategoriesData({
  categories,
  total,
  canManage,
  partnerCount,
  activeStatus,
  onStatusChange,
  statusCount,
  search,
  onSearchChange,
  onClearFilters,
  onCreate,
  onEdit,
  onDeactivate,
  onReactivate,
}: CategoriesDataProps) {
  if (total === 0) {
    return (
      <EmptyState
        icon="category"
        title="Nenhuma categoria cadastrada"
        action={
          canManage ? (
            <Button compact onClick={onCreate}>
              Nova categoria
            </Button>
          ) : undefined
        }
      >
        Cadastre as categorias para classificar os parceiros e alimentar o
        filtro do catálogo público.
      </EmptyState>
    );
  }

  // O menu reúne só o que não está visível na linha: a mudança de estado.
  const menuItems = (category: Category): RowMenuItem[] =>
    canManage
      ? [
          category.status === 'active'
            ? {
                label: 'Desativar',
                danger: true,
                onSelect: () => onDeactivate(category),
              }
            : { label: 'Reativar', onSelect: () => onReactivate(category) },
        ]
      : [];

  const columns: Column<Category>[] = [
    {
      header: 'Categoria',
      cell: (category) => <CellMain title={category.name} />,
    },
    ...(partnerCount
      ? [
          {
            header: 'Parceiros',
            align: 'right' as const,
            cell: (category: Category) => partnerCount(category),
          },
        ]
      : []),
    {
      header: 'Estado',
      cell: (category) =>
        category.status === 'active' ? (
          <Badge tone="success" dot>
            Ativa
          </Badge>
        ) : (
          <Badge dot>Inativa</Badge>
        ),
    },
  ];

  return (
    <ListCard
      tabs={[
        { value: '', label: 'Todas', count: statusCount('') },
        { value: 'active', label: 'Ativas', count: statusCount('active') },
        {
          value: 'inactive',
          label: 'Inativas',
          count: statusCount('inactive'),
        },
      ]}
      activeTab={activeStatus}
      onTabChange={onStatusChange}
      search={search}
      onSearchChange={onSearchChange}
      searchLabel="Filtrar categorias"
      footer={
        categories.length === total
          ? `${total} ${total === 1 ? 'categoria' : 'categorias'}`
          : `${categories.length} de ${total} categorias`
      }
    >
      <DataTable
        rows={categories}
        rowKey={(category) => category.id}
        emptyTitle="Nenhuma categoria encontrada com esses filtros."
        onClearFilters={onClearFilters}
        {...(canManage ? { onRowClick: onEdit } : {})}
        columns={columns}
        actions={(category) =>
          canManage ? (
            <>
              <Button compact onClick={() => onEdit(category)}>
                Editar
              </Button>
              <RowMenu
                label={`Mais ações para ${category.name}`}
                items={menuItems(category)}
              />
            </>
          ) : null
        }
      />
    </ListCard>
  );
}
