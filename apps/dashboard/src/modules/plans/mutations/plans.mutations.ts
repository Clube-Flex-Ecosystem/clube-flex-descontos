import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Plan } from '@flex/contracts';
import { upsertById } from '../../../shared/http/versioning';
import { createPlan, setPlanStatus, updatePlan } from '../api/plans.api';
import { plansKey } from '../queries/plans.query';

/**
 * A resposta da API traz a representação completa e a nova versão: ela substitui o
 * recurso no cache sem nova consulta da listagem. Em conflito de versão nada é
 * substituído; a tela oferece a reconciliação explícita com o servidor.
 */
function useWritePlan() {
    const queryClient = useQueryClient();
    return (plan: Plan) =>
        queryClient.setQueryData<Plan[]>(plansKey, (current) =>
            upsertById(current, plan),
        );
}

export function useCreatePlan() {
    const write = useWritePlan();
    return useMutation({ mutationFn: createPlan, onSuccess: write });
}

export function useUpdatePlan() {
    const write = useWritePlan();
    return useMutation({
        mutationFn: updatePlan,
        onSuccess: write,
    });
}

export function useSetPlanStatus() {
    const write = useWritePlan();
    return useMutation({
        mutationFn: setPlanStatus,
        onSuccess: write,
    });
}
