import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ActiveStatus, Category } from '@flex/contracts';
import { useCan } from '../../auth';
import { partnersQueryOptions } from '../../partners';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { useListFilter } from '../../../shared/utils/use-list-filter';
import { useSetCategoryStatus } from '../mutations/categories.mutations';
import { categoriesQueryOptions } from '../queries/categories.query';
import { CategoriesData } from './categories-data';

const stateOf = (category: Category): ActiveStatus => category.status;
const textOf = (category: Category) => category.name;

/** Busca categorias e coordena filtros, mudanças de estado e confirmação. */
export function CategoriesList({
    canManage,
    onCreate,
    onEdit,
}: {
    canManage: boolean;
    onCreate: () => void;
    onEdit: (category: Category | 'new') => void;
}) {
    const { data: categories, refetch } = useSuspenseQuery(
        categoriesQueryOptions,
    );
    const setStatus = useSetCategoryStatus();
    const toast = useToast();
    const [deactivating, setDeactivating] = useState<Category | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const filter = useListFilter('categories', categories, { stateOf, textOf });
    // Contagem derivada da coleção de parceiros, para quem pode visualizá-los.
    const canViewPartners = useCan('partners.view');
    const partners = useQuery({
        ...partnersQueryOptions,
        enabled: canViewPartners,
    });
    const partnerCount = partners.data
        ? (category: Category) =>
              partners.data.filter((partner) =>
                  partner.categories.some((item) => item.id === category.id),
              ).length
        : null;

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

            <CategoriesData
                categories={filter.filtered}
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
                onReactivate={(category) => changeStatus(category, 'active')}
            />

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
