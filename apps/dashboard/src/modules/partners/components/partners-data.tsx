import type { Partner, PartnerStatus } from '@flex/contracts';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { CellMain, DataTable } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/page-parts';
import { ListCard } from '../../../shared/ui/list-card';
import { RowMenu, type RowMenuItem } from '../../../shared/ui/row-menu';
import { entityInitialsOf } from '../../../shared/utils/initials';
import { PartnerStatusBadge } from './partner-status-badge';

interface PartnersDataProps {
    partners: Partner[];
    total: number;
    canCreate: boolean;
    canUpdate: boolean;
    canPublish: boolean;
    canDelete: boolean;
    activePlans: number | null;
    activeStatus: PartnerStatus | '';
    onStatusChange: (status: PartnerStatus | '') => void;
    statusCount: (status: PartnerStatus | '') => number;
    search: string;
    onSearchChange: (search: string) => void;
    onClearFilters: () => void;
    onOpen: (partner: Partner) => void;
    onCreate: () => void;
    onToggleFeatured: (partner: Partner) => void;
    onRepublish: (partner: Partner) => void;
    onMoveToDraft: (partner: Partner) => void;
    onDeactivate: (partner: Partner) => void;
    onDelete: (partner: Partner) => void;
}

/** Apresentação da lista: recebe dados e callbacks, sem buscar estado remoto. */
export function PartnersData({
    partners,
    total,
    canCreate,
    canUpdate,
    canPublish,
    canDelete,
    activePlans,
    activeStatus,
    onStatusChange,
    statusCount,
    search,
    onSearchChange,
    onClearFilters,
    onOpen,
    onCreate,
    onToggleFeatured,
    onRepublish,
    onMoveToDraft,
    onDeactivate,
    onDelete,
}: PartnersDataProps) {
    if (total === 0) {
        return (
            <EmptyState
                icon="partner"
                title="Nenhum parceiro cadastrado"
                action={
                    canCreate ? (
                        <Button compact onClick={onCreate}>
                            Novo parceiro
                        </Button>
                    ) : undefined
                }
            >
                Cadastre o primeiro parceiro para começar o catálogo.
            </EmptyState>
        );
    }

    // O menu reúne só o que não está visível na linha: estado e ações destrutivas.
    const menuItems = (partner: Partner): RowMenuItem[] => {
        const items: RowMenuItem[] = [];
        if (
            canUpdate &&
            partner.status === 'published' &&
            activePlans !== null
        ) {
            items.push({
                label: partner.featured ? 'Remover destaque' : 'Destacar',
                onSelect: () => onToggleFeatured(partner),
            });
        }
        if (canPublish && partner.status === 'inactive') {
            items.push(
                { label: 'Republicar', onSelect: () => onRepublish(partner) },
                {
                    label: 'Enviar para rascunho',
                    onSelect: () => onMoveToDraft(partner),
                },
            );
        }
        if (canPublish && partner.status === 'published') {
            items.push({
                label: 'Desativar',
                danger: true,
                separated: true,
                onSelect: () => onDeactivate(partner),
            });
        }
        if (canDelete && partner.status === 'draft') {
            items.push({
                label: 'Excluir rascunho',
                danger: true,
                separated: true,
                onSelect: () => onDelete(partner),
            });
        }
        return items;
    };

    return (
        <ListCard
            tabs={[
                { value: '', label: 'Todos', count: statusCount('') },
                {
                    value: 'published',
                    label: 'Publicados',
                    count: statusCount('published'),
                },
                {
                    value: 'draft',
                    label: 'Rascunhos',
                    count: statusCount('draft'),
                },
                {
                    value: 'inactive',
                    label: 'Desativados',
                    count: statusCount('inactive'),
                },
            ]}
            activeTab={activeStatus}
            onTabChange={onStatusChange}
            search={search}
            onSearchChange={onSearchChange}
            searchLabel="Filtrar por nome"
            footer={
                partners.length === total
                    ? `${total} ${total === 1 ? 'parceiro' : 'parceiros'}`
                    : `${partners.length} de ${total} parceiros`
            }
        >
            <DataTable
                rows={partners}
                rowKey={(partner) => partner.id}
                emptyTitle="Nenhum parceiro encontrado com esses filtros."
                onClearFilters={onClearFilters}
                onRowClick={onOpen}
                columns={[
                    {
                        header: 'Parceiro',
                        cell: (partner) => (
                            <CellMain
                                title={partner.name}
                                subtitle={`/${partner.slug}`}
                                mark={entityInitialsOf(partner.name)}
                                mono
                                extra={
                                    partner.featured ? (
                                        <Badge tone="tag" icon="star">
                                            Destaque
                                        </Badge>
                                    ) : null
                                }
                            />
                        ),
                    },
                    {
                        header: 'Categorias',
                        cell: (partner) =>
                            partner.categories.length > 0 ? (
                                partner.categories
                                    .map((category) => category.name)
                                    .join(', ')
                            ) : (
                                <span className="muted">—</span>
                            ),
                    },
                    {
                        header: 'Unidades',
                        align: 'right',
                        cell: (partner) => partner.units.length || '—',
                    },
                    {
                        header: 'Planos com benefício',
                        align: 'right',
                        cell: (partner) =>
                            partner.benefits.length === 0
                                ? '—'
                                : activePlans === null
                                  ? partner.benefits.length
                                  : `${partner.benefits.length} de ${activePlans}`,
                    },
                    {
                        header: 'Estado',
                        cell: (partner) => (
                            <PartnerStatusBadge status={partner.status} />
                        ),
                    },
                ]}
                actions={(partner) => (
                    <>
                        <Button compact onClick={() => onOpen(partner)}>
                            {canUpdate ? 'Editar' : 'Abrir'}
                        </Button>
                        <RowMenu
                            label={`Mais ações para ${partner.name}`}
                            items={menuItems(partner)}
                        />
                    </>
                )}
            />
        </ListCard>
    );
}
