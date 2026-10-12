import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { Partner } from '@flex/contracts';
import { useCan } from '../../auth';
import { plansQueryOptions } from '../../plans';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { useListFilter } from '../../../shared/utils/use-list-filter';
import type { PartnerCommand } from '../api/partners.api';
import {
    useDeletePartner,
    usePartnerCommand,
    useReplacePartner,
} from '../mutations/partners.mutations';
import { partnersQueryOptions } from '../queries/partners.query';
import { toFormValues, toRequest } from '../schemas/partner-form';
import { PartnersData } from './partners-data';

const stateOf = (partner: Partner) => partner.status;
const textOf = (partner: Partner) => partner.name;

type Confirmation =
    | { kind: 'deactivate'; partner: Partner }
    | { kind: 'delete'; partner: Partner };

/** Carrega a listagem e coordena filtros, permissões e ações do agregado. */
export function PartnersList() {
    const { data: partners, refetch } = useSuspenseQuery(partnersQueryOptions);
    const { data: plans } = useQuery(plansQueryOptions);
    const canCreate = useCan('partners.create');
    const canUpdate = useCan('partners.update');
    const canPublish = useCan('partners.publish');
    const canDelete = useCan('partners.delete');
    const navigate = useNavigate();
    const toast = useToast();
    const replace = useReplacePartner();
    const command = usePartnerCommand();
    const remove = useDeletePartner();
    const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const filter = useListFilter('partners', partners, { stateOf, textOf });
    const activePlans =
        plans?.filter((plan) => plan.status === 'active').length ?? null;

    const openPartner = (partner: Partner) =>
        void navigate({
            to: '/parceiros/$partnerId',
            params: { partnerId: partner.id },
        });

    const fail = (error: unknown) => setActionError(describeError(error));

    const runCommand = (
        partner: Partner,
        name: PartnerCommand,
        message: string,
    ) => {
        setActionError(null);
        command.mutate(
            { id: partner.id, version: partner.version, command: name },
            { onSuccess: () => toast(message), onError: fail },
        );
    };

    /** O destaque reenvia o agregado completo, pois faz parte dos benefícios. */
    const toggleFeatured = (partner: Partner) => {
        if (!plans) return;
        setActionError(null);
        const values = {
            ...toFormValues(partner, plans),
            featured: !partner.featured,
        };
        const { body } = toRequest(values);
        replace.mutate(
            { id: partner.id, version: partner.version, body },
            {
                onSuccess: () => toast('Destaque atualizado.'),
                onError: fail,
            },
        );
    };

    const createPartner = () => void navigate({ to: '/parceiros/novo' });

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

            <PartnersData
                partners={filter.filtered}
                total={filter.total}
                canCreate={canCreate}
                canUpdate={canUpdate}
                canPublish={canPublish}
                canDelete={canDelete}
                activePlans={activePlans}
                activeStatus={filter.state}
                onStatusChange={filter.setState}
                statusCount={filter.countOf}
                search={filter.search}
                onSearchChange={filter.setSearch}
                onClearFilters={filter.clear}
                onOpen={openPartner}
                onCreate={createPartner}
                onToggleFeatured={toggleFeatured}
                onRepublish={(partner) =>
                    runCommand(
                        partner,
                        'publish',
                        `${partner.name} republicado.`,
                    )
                }
                onMoveToDraft={(partner) =>
                    runCommand(
                        partner,
                        'move-to-draft',
                        `${partner.name} enviado para rascunho.`,
                    )
                }
                onDeactivate={(partner) =>
                    setConfirmation({ kind: 'deactivate', partner })
                }
                onDelete={(partner) =>
                    setConfirmation({ kind: 'delete', partner })
                }
            />

            {confirmation?.kind === 'deactivate' ? (
                <ConfirmDialog
                    title={`Desativar ${confirmation.partner.name}?`}
                    body="O parceiro deixa de aparecer no catálogo imediatamente. Dados, unidades e benefícios são preservados e ele pode ser republicado."
                    confirmLabel="Desativar"
                    onCancel={() => setConfirmation(null)}
                    onConfirm={() => {
                        const { partner } = confirmation;
                        setConfirmation(null);
                        runCommand(
                            partner,
                            'deactivate',
                            `${partner.name} desativado.`,
                        );
                    }}
                />
            ) : null}

            {confirmation?.kind === 'delete' ? (
                <ConfirmDialog
                    title={`Excluir o rascunho ${confirmation.partner.name}?`}
                    body="O rascunho, nunca publicado, será removido definitivamente junto com suas unidades, contatos e benefícios."
                    confirmLabel="Excluir"
                    onCancel={() => setConfirmation(null)}
                    onConfirm={() => {
                        const { partner } = confirmation;
                        setConfirmation(null);
                        setActionError(null);
                        remove.mutate(
                            { id: partner.id, version: partner.version },
                            {
                                onSuccess: () =>
                                    toast(`${partner.name} excluído.`),
                                onError: fail,
                            },
                        );
                    }}
                />
            ) : null}
        </>
    );
}
