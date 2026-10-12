import type { ActiveStatus, Plan } from '@flex/contracts';
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
import { entityInitialsOf } from '../../../shared/utils/initials';

interface PlansDataProps {
  plans: Plan[];
  total: number;
  canManage: boolean;
  /** Parceiros com benefício no plano; `null` quando a contagem não está disponível. */
  partnerCount: ((plan: Plan) => number) | null;
  activeStatus: ActiveStatus | '';
  onStatusChange: (status: ActiveStatus | '') => void;
  statusCount: (status: ActiveStatus | '') => number;
  search: string;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
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

  // O menu reúne só o que não está visível na linha: a mudança de estado.
  const menuItems = (plan: Plan): RowMenuItem[] =>
    canManage
      ? [
          plan.status === 'active'
            ? {
                label: 'Desativar',
                danger: true,
                onSelect: () => onDeactivate(plan),
              }
            : { label: 'Reativar', onSelect: () => onReactivate(plan) },
        ]
      : [];

  const columns: Column<Plan>[] = [
    {
      header: 'Plano',
      cell: (plan) => (
        <CellMain title={plan.name} mark={entityInitialsOf(plan.name)} />
      ),
    },
    {
      header: 'Identificador público',
      cell: (plan) => (
        <span className="font-mono text-muted-foreground">{plan.slug}</span>
      ),
    },
    ...(partnerCount
      ? [
          {
            header: 'Parceiros com benefício',
            align: 'right' as const,
            cell: (plan: Plan) => partnerCount(plan),
          },
        ]
      : []),
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
  ];

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
        onClearFilters={onClearFilters}
        {...(canManage ? { onRowClick: onEdit } : {})}
        columns={columns}
        actions={(plan) =>
          canManage ? (
            <>
              <Button compact onClick={() => onEdit(plan)}>
                Editar
              </Button>
              <RowMenu
                label={`Mais ações para ${plan.name}`}
                items={menuItems(plan)}
              />
            </>
          ) : null
        }
      />
    </ListCard>
  );
}
