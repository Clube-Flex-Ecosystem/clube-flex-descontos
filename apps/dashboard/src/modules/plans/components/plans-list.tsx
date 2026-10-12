import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ActiveStatus, Plan } from '@flex/contracts';
import { useCan } from '../../auth';
import { partnersQueryOptions } from '../../partners';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { useListFilter } from '../../../shared/utils/use-list-filter';
import { useSetPlanStatus } from '../mutations/plans.mutations';
import { plansQueryOptions } from '../queries/plans.query';
import { PlansData } from './plans-data';

const stateOf = (plan: Plan): ActiveStatus => plan.status;
const textOf = (plan: Plan) => plan.name;

/** Busca os planos e coordena filtros, edição e mudanças de estado. */
export function PlansList({
  canManage,
  onCreate,
  onEdit,
}: {
  canManage: boolean;
  onCreate: () => void;
  onEdit: (plan: Plan | 'new') => void;
}) {
  const { data: plans, refetch } = useSuspenseQuery(plansQueryOptions);
  const setStatus = useSetPlanStatus();
  const toast = useToast();
  const [deactivating, setDeactivating] = useState<Plan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const filter = useListFilter('plans', plans, { stateOf, textOf });
  // Contagem derivada da coleção de parceiros, para quem pode visualizá-los.
  const canViewPartners = useCan('partners.view');
  const partners = useQuery({
    ...partnersQueryOptions,
    enabled: canViewPartners,
  });
  const partnerCount = partners.data
    ? (plan: Plan) =>
        partners.data.filter((partner) =>
          partner.benefits.some((benefit) => benefit.planId === plan.id),
        ).length
    : null;

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

  return (
    <>
      {actionError ? (
        <div className="mb-3">
          <Alert
            tone="danger"
            title="Não foi possível concluir a operação."
            action={
              <Button compact onClick={() => void refetch()}>
                Atualizar listagem
              </Button>
            }
          >
            {actionError}
          </Alert>
        </div>
      ) : null}

      <PlansData
        plans={filter.filtered}
        total={filter.total}
        canManage={canManage}
        partnerCount={partnerCount}
        activeStatus={filter.state}
        onStatusChange={filter.setState}
        statusCount={filter.countOf}
        search={filter.search}
        onSearchChange={filter.setSearch}
        onClearFilters={filter.clear}
        onCreate={onCreate}
        onEdit={onEdit}
        onDeactivate={setDeactivating}
        onReactivate={(plan) => changeStatus(plan, 'active')}
      />

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
