import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ActiveStatus, Plan } from '@flex/contracts';
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
import { PlanFormDrawer } from '../components/plan-form-drawer';
import { useSetPlanStatus } from '../mutations/plans.mutations';
import { plansQueryOptions } from '../queries/plans.query';

const stateOf = (plan: Plan): ActiveStatus => plan.status;
const textOf = (plan: Plan) => plan.name;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

export function PlansPage() {
  const plans = useQuery(plansQueryOptions);
  const canManage = useCan('plans.manage');
  const setStatus = useSetPlanStatus();
  const toast = useToast();

  // Guarda o identificador, não o objeto: a edição sempre parte da versão em cache.
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [deactivating, setDeactivating] = useState<Plan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filter = useListFilter(plans.data ?? [], { stateOf, textOf });
  const editing =
    editingId && editingId !== 'new'
      ? plans.data?.find((plan) => plan.id === editingId)
      : undefined;

  const changeStatus = (plan: Plan, status: ActiveStatus) => {
    setActionError(null);
    setStatus.mutate(
      { id: plan.id, version: plan.version, status },
      {
        onSuccess: () =>
          toast(
            `“${plan.name}” agora está ${status === 'active' ? 'ativo' : 'inativo'}.`,
          ),
        onError: (error) => setActionError(describeError(error)),
      },
    );
  };

  const menuItems = (plan: Plan): RowMenuItem[] =>
    canManage
      ? [
          { label: 'Editar', onSelect: () => setEditingId(plan.id) },
          plan.status === 'active'
            ? {
                label: 'Desativar',
                danger: true,
                separated: true,
                onSelect: () => setDeactivating(plan),
              }
            : {
                label: 'Reativar',
                separated: true,
                onSelect: () => changeStatus(plan, 'active'),
              },
        ]
      : [];

  return (
    <>
      <PageHeader
        title="Planos"
        description="Modalidades exibidas no seletor do catálogo público."
        actions={
          canManage ? (
            <Button variant="primary" onClick={() => setEditingId('new')}>
              <Icon name="plus" />
              Novo plano
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
              <Button compact onClick={() => void plans.refetch()}>
                Atualizar listagem
              </Button>
            }
          >
            {actionError}
          </Alert>
        </div>
      ) : null}

      {plans.isPending ? <ListSkeleton label="Carregando planos" /> : null}
      {plans.isError ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar os planos."
          action={
            <Button
              compact
              onClick={() => void plans.refetch()}
              loading={plans.isFetching}
            >
              <Icon name="refresh" />
              Tentar novamente
            </Button>
          }
        >
          {describeError(plans.error)}
        </Alert>
      ) : null}

      {plans.isSuccess && plans.data.length === 0 ? (
        <EmptyState
          icon="plan"
          title="Nenhum plano cadastrado"
          action={
            canManage ? (
              <Button
                variant="primary"
                compact
                onClick={() => setEditingId('new')}
              >
                Novo plano
              </Button>
            ) : undefined
          }
        >
          Cadastre os planos do Clube Flex para que o visitante possa escolher o
          seu no catálogo.
        </EmptyState>
      ) : null}

      {plans.isSuccess && plans.data.length > 0 ? (
        <ListCard
          tabs={[
            { value: '', label: 'Todos', count: filter.countOf('') },
            {
              value: 'active',
              label: 'Ativos',
              count: filter.countOf('active'),
            },
            {
              value: 'inactive',
              label: 'Inativos',
              count: filter.countOf('inactive'),
            },
          ]}
          activeTab={filter.state}
          onTabChange={filter.setState}
          search={filter.search}
          onSearchChange={filter.setSearch}
          searchLabel="Filtrar planos"
          footer={
            filter.filtered.length === filter.total
              ? `${filter.total} ${filter.total === 1 ? 'plano' : 'planos'}`
              : `${filter.filtered.length} de ${filter.total} planos`
          }
        >
          <DataTable
            rows={filter.filtered}
            rowKey={(plan) => plan.id}
            emptyTitle="Nenhum plano encontrado com esses filtros."
            columns={[
              {
                header: 'Plano',
                cell: (plan) => (
                  <CellMain title={plan.name} mark={initials(plan.name)} />
                ),
              },
              {
                header: 'Identificador público',
                cell: (plan) => (
                  <span className="font-mono text-muted-foreground">
                    {plan.slug}
                  </span>
                ),
              },
              {
                header: 'Estado',
                cell: (plan) =>
                  plan.status === 'active' ? (
                    <Badge tone="success" dot>
                      Ativo
                    </Badge>
                  ) : (
                    <Badge dot>Inativo</Badge>
                  ),
              },
            ]}
            actions={(plan) => (
              <>
                {canManage ? (
                  <Button compact onClick={() => setEditingId(plan.id)}>
                    Editar
                  </Button>
                ) : null}
                {canManage ? (
                  <RowMenu
                    label={`Mais ações para ${plan.name}`}
                    items={menuItems(plan)}
                  />
                ) : null}
              </>
            )}
          />
        </ListCard>
      ) : null}

      {editingId === 'new' || editing ? (
        <PlanFormDrawer
          key={editing?.id ?? 'new'}
          {...(editing ? { plan: editing } : {})}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      {deactivating ? (
        <ConfirmDialog
          title={`Desativar o plano “${deactivating.name}”?`}
          body="O plano sai do seletor público. Benefícios e cupons associados são preservados e voltam com a reativação."
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
