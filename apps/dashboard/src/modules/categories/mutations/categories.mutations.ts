import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@flex/contracts';
import { upsertById } from '../../../shared/http/versioning';
import {
    createCategory,
    setCategoryStatus,
    updateCategory,
} from '../api/categories.api';
import { categoriesKey } from '../queries/categories.query';

/**
 * A resposta da API traz a representação completa e a nova versão: ela substitui o
 * recurso no cache sem nova consulta da listagem. Em conflito de versão nada é
 * substituído; a tela oferece a reconciliação explícita com o servidor.
 */
function useWriteCategory() {
    const queryClient = useQueryClient();
    return (category: Category) =>
        queryClient.setQueryData<Category[]>(categoriesKey, (current) =>
            upsertById(current, category),
        );
}

export function useCreateCategory() {
    const write = useWriteCategory();
    return useMutation({ mutationFn: createCategory, onSuccess: write });
}

export function useUpdateCategory() {
    const write = useWriteCategory();
    return useMutation({
        mutationFn: updateCategory,
        onSuccess: write,
    });
}

export function useSetCategoryStatus() {
    const write = useWriteCategory();
    return useMutation({
        mutationFn: setCategoryStatus,
        onSuccess: write,
    });
}
