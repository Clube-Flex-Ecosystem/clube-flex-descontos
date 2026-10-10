import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ActiveStatus, Category } from '@flex/contracts';
import { useCan } from '../../auth';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { CellMain, DataTable } from '../../../shared/ui/data-table';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { Icon } from '../../../shared/ui/icon';
import { ListCard } from '../../../shared/ui/list-card';
import {
  EmptyState,
  ListSkeleton,
  PageHeader,
} from '../../../shared/ui/page-parts';
import { RowMenu, type RowMenuItem } from '../../../shared/ui/row-menu';
import { useListFilter } from '../../../shared/utils/use-list-filter';
import { CategoryFormDrawer } from '../components/category-form-drawer';
import { useSetCategoryStatus } from '../mutations/categories.mutations';
import { categoriesQueryOptions } from '../queries/categories.query';

const stateOf = (category: Category): ActiveStatus => category.status;
const textOf = (category: Category) => category.name;

export function CategoriesPage() {
  const categories = useQuery(categoriesQueryOptions);
  const canManage = useCan('categories.manage');
  const setStatus = useSetCategoryStatus();
  const toast = useToast();

  // Guarda o identificador, não o objeto: a edição sempre parte da versão em cache.
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [deactivating, setDeactivating] = useState<Category | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filter = useListFilter(categories.data ?? [], { stateOf, textOf });
  const editing =
    editingId && editingId !== 'new'
      ? categories.data?.find((category) => category.id === editingId)
      : undefined;

  const changeStatus = (category: Category, status: ActiveStatus) => {
    setActionError(null);
    setStatus.mutate(
      { id: category.id, version: category.version, status },
      {
        onSuccess: () =>
          toast(
            `“${category.name}” agora está ${status === 'active' ? 'ativa' : 'inativa'}.`,
          ),
        onError: (error) => setActionError(describeError(error)),
      },
    );
  };

  const menuItems = (category: Category): RowMenuItem[] =>
    canManage
      ? [
          { label: 'Editar', onSelect: () => setEditingId(category.id) },
          category.status === 'active'
            ? {
                label: 'Desativar',
                danger: true,
                separated: true,
                onSelect: () => setDeactivating(category),
              }
            : {
                label: 'Reativar',
                separated: true,
                onSelect: () => changeStatus(category, 'active'),
              },
        ]
      : [];

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Classificação dos parceiros e filtro do catálogo público."
        actions={
          canManage ? (
            <Button variant="primary" onClick={() => setEditingId('new')}>
              <Icon name="plus" />
              Nova categoria
            </Button>
          ) : null
        }
      />

      {actionError ? (
        <div className="mb-3">
          <Alert
            tone="danger"
            title="Não foi possível concluir a operação."
            action={
              <Button compact onClick={() => void categories.refetch()}>
                Atualizar listagem
              </Button>
            }
          >
            {actionError}
          </Alert>
        </div>
      ) : null}

      {categories.isPending ? (
        <ListSkeleton label="Carregando categorias" />
      ) : null}
      {categories.isError ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar as categorias."
          action={
            <Button
              compact
              onClick={() => void categories.refetch()}
              loading={categories.isFetching}
            >
              <Icon name="refresh" />
              Tentar novamente
            </Button>
          }
        >
          {describeError(categories.error)}
        </Alert>
      ) : null}

      {categories.isSuccess && categories.data.length === 0 ? (
        <EmptyState
          icon="category"
          title="Nenhuma categoria cadastrada"
          action={
            canManage ? (
              <Button
                variant="primary"
                compact
                onClick={() => setEditingId('new')}
              >
                Nova categoria
              </Button>
            ) : undefined
          }
        >
          Cadastre as categorias para classificar os parceiros e alimentar o
          filtro do catálogo público.
        </EmptyState>
      ) : null}

      {categories.isSuccess && categories.data.length > 0 ? (
        <ListCard
          tabs={[
            { value: '', label: 'Todas', count: filter.countOf('') },
            {
              value: 'active',
              label: 'Ativas',
              count: filter.countOf('active'),
            },
            {
              value: 'inactive',
              label: 'Inativas',
              count: filter.countOf('inactive'),
            },
          ]}
          activeTab={filter.state}
          onTabChange={filter.setState}
          search={filter.search}
          onSearchChange={filter.setSearch}
          searchLabel="Filtrar categorias"
          footer={
            filter.filtered.length === filter.total
              ? `${filter.total} ${filter.total === 1 ? 'categoria' : 'categorias'}`
              : `${filter.filtered.length} de ${filter.total} categorias`
          }
        >
          <DataTable
            rows={filter.filtered}
            rowKey={(category) => category.id}
            emptyTitle="Nenhuma categoria encontrada com esses filtros."
            columns={[
              {
                header: 'Categoria',
                cell: (category) => <CellMain title={category.name} />,
              },
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
            ]}
            actions={(category) => (
              <>
                {canManage ? (
                  <Button compact onClick={() => setEditingId(category.id)}>
                    Editar
                  </Button>
                ) : null}
                {canManage ? (
                  <RowMenu
                    label={`Mais ações para ${category.name}`}
                    items={menuItems(category)}
                  />
                ) : null}
              </>
            )}
          />
        </ListCard>
      ) : null}

      {editingId === 'new' || editing ? (
        <CategoryFormDrawer
          key={editing?.id ?? 'new'}
          {...(editing ? { category: editing } : {})}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      {deactivating ? (
        <ConfirmDialog
          title={`Desativar a categoria “${deactivating.name}”?`}
          body="A categoria deixa de aparecer no catálogo e nas seleções. As associações com parceiros são preservadas."
          confirmLabel="Desativar"
          onCancel={() => setDeactivating(null)}
          onConfirm={() => {
            changeStatus(deactivating, 'inactive');
            setDeactivating(null);
          }}
        />
      ) : null}
    </>
  );
}
