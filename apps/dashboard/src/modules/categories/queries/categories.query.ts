import { queryOptions } from '@tanstack/react-query';
import { listCategories } from '../api/categories.api';

export const categoriesKey = ['categories'] as const;

/** Coleção completa de planos (ativos e inativos); a listagem não é paginada. */
export const categoriesQueryOptions = queryOptions({
    queryKey: categoriesKey,
    queryFn: listCategories,
});
