import { queryOptions } from '@tanstack/react-query';
import { listPlans } from '../api/plans.api';

export const plansKey = ['plans'] as const;

/** Coleção completa de planos (ativos e inativos); a listagem não é paginada. */
export const plansQueryOptions = queryOptions({
    queryKey: plansKey,
    queryFn: listPlans,
});
