import type { ActiveStatus, Plan } from '@flex/contracts';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { CellMain, DataTable } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/page-parts';
import { ListCard } from '../../../shared/ui/list-card';
import { RowMenu, type RowMenuItem } from '../../../shared/ui/row-menu';
import { entityInitialsOf } from '../../../shared/utils/initials';

interface PlansDataProps {
  plans: Plan[];
  total: number;
  canManage: boolean;
  activeStatus: ActiveStatus | '';
  onStatusChange: (status: ActiveStatus | '') => void;
  statusCount: (status: ActiveStatus | '') => number;
  search: string;
  onSearchChange: (search: string) => void;
  onCreate: () => void;
  onEdit: (plan: Plan) => void;
  onDeactivate: (plan: Plan) => void;
  onReactivate: (plan: Plan) => void;
}

/** Apresentação da lista: recebe dados e callbacks, sem buscar estado remoto. */
export function PlansData({
  plans,
  total,
  canManage,
  activeStatus,
  onStatusChange,
  statusCount,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onDeactivate,
  onReactivate,
}: PlansDataProps) {
  if (total === 0) {
    return (
      <EmptyState
        icon="plan"
        title="Nenhum plano cadastrado"
        action={
          canManage ? (
            <Button compact onClick={onCreate}>
              Novo plano
            </Button>
          ) : undefined
        }
      >
        Cadastre os planos do Clube Flex para que o visitante possa escolher o
        seu no catálogo.
      </EmptyState>
    );
  }

  const menuItems = (plan: Plan): RowMenuItem[] =>
    canManage
      ? [
          { label: 'Editar', onSelect: () => onEdit(plan) },
          plan.status === 'active'
            ? {
                label: 'Desativar',
                danger: true,
                separated: true,
                onSelect: () => onDeactivate(plan),
              }
            : {
                label: 'Reativar',
                separated: true,
                onSelect: () => onReactivate(plan),
              },
        ]
      : [];

  return (
    <ListCard
      tabs={[
        { value: '', label: 'Todos', count: statusCount('') },
        { value: 'active', label: 'Ativos', count: statusCount('active') },
        {
          value: 'inactive',
          label: 'Inativos',
          count: statusCount('inactive'),
        },
      ]}
      activeTab={activeStatus}
      onTabChange={onStatusChange}
      search={search}
      onSearchChange={onSearchChange}
      searchLabel="Filtrar planos"
      footer={
        plans.length === total
          ? `${total} ${total === 1 ? 'plano' : 'planos'}`
          : `${plans.length} de ${total} planos`
      }
    >
      <DataTable
        rows={plans}
        rowKey={(plan) => plan.id}
        emptyTitle="Nenhum plano encontrado com esses filtros."
        columns={[
          {
            header: 'Plano',
            cell: (plan) => (
              <CellMain title={plan.name} mark={entityInitialsOf(plan.name)} />
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
              <Button compact onClick={() => onEdit(plan)}>
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
  );
}
