import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { Partner, PartnerStatus } from '@flex/contracts';
import { useCan } from '../../auth';
import { plansQueryOptions } from '../../plans';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { CellMain, DataTable } from '../../../shared/ui/data-table';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { Icon } from '../../../shared/ui/icon';
import { ListCard } from '../../../shared/ui/list-card';
import {
  EmptyState,
  ListSkeleton,
  PageHeader,
} from '../../../shared/ui/page-parts';
import { RowMenu, type RowMenuItem } from '../../../shared/ui/row-menu';
import { useListFilter } from '../../../shared/utils/use-list-filter';
import { PartnerStatusBadge } from '../components/partner-status-badge';
import {
  useDeletePartner,
  usePartnerCommand,
  useReplacePartner,
} from '../mutations/partners.mutations';
import { partnersQueryOptions } from '../queries/partners.query';
import { toFormValues, toRequest } from '../schemas/partner-form';
import type { PartnerCommand } from '../api/partners.api';

const stateOf = (partner: Partner): PartnerStatus => partner.status;
const textOf = (partner: Partner) => partner.name;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^\p{Lu}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

type Confirmation =
  | { kind: 'deactivate'; partner: Partner }
  | { kind: 'delete'; partner: Partner };

export function PartnersPage() {
  const partners = useQuery(partnersQueryOptions);
  const plans = useQuery(plansQueryOptions);
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
  const filter = useListFilter(partners.data ?? [], { stateOf, textOf });
  const activePlans =
    plans.data?.filter((plan) => plan.status === 'active').length ?? null;

  const open = (partner: Partner) =>
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

  /** O destaque faz parte da representação editável: reenvia o agregado completo. */
  const toggleFeatured = (partner: Partner) => {
    if (!plans.data) return;
    setActionError(null);
    const values = {
      ...toFormValues(partner, plans.data),
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

  const menuItems = (partner: Partner): RowMenuItem[] => {
    const items: RowMenuItem[] = [];
    items.push({
      label: canUpdate ? 'Editar' : 'Abrir',
      onSelect: () => open(partner),
    });
    if (canUpdate && partner.status === 'published' && plans.data) {
      items.push({
        label: partner.featured ? 'Remover destaque' : 'Destacar',
        onSelect: () => toggleFeatured(partner),
      });
    }
    if (canPublish && partner.status === 'inactive') {
      items.push(
        {
          label: 'Republicar',
          onSelect: () =>
            runCommand(partner, 'publish', `${partner.name} republicado.`),
        },
        {
          label: 'Enviar para rascunho',
          onSelect: () =>
            runCommand(
              partner,
              'move-to-draft',
              `${partner.name} enviado para rascunho.`,
            ),
        },
      );
    }
    if (canPublish && partner.status === 'published') {
      items.push({
        label: 'Desativar',
        danger: true,
        separated: true,
        onSelect: () => setConfirmation({ kind: 'deactivate', partner }),
      });
    }
    if (canDelete && partner.status === 'draft') {
      items.push({
        label: 'Excluir rascunho',
        danger: true,
        separated: true,
        onSelect: () => setConfirmation({ kind: 'delete', partner }),
      });
    }
    return items;
  };

  return (
    <>
      <PageHeader
        title="Parceiros"
        description="Estabelecimentos e profissionais exibidos no catálogo público."
        actions={
          canCreate ? (
            <Link
              to="/parceiros/novo"
              className="t-label inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary-edge bg-primary-raised px-3 whitespace-nowrap text-primary-foreground no-underline shadow-brand-raised hover:bg-primary-raised-hover md:min-h-control-md"
            >
              <Icon name="plus" />
              Novo parceiro
            </Link>
          ) : null
        }
      />

      {actionError ? (
        <div className="mb-3">
          <Alert
            tone="danger"
            title="Não foi possível concluir a operação."
            action={
              <Button compact onClick={() => void partners.refetch()}>
                Atualizar listagem
              </Button>
            }
          >
            {actionError}
          </Alert>
        </div>
      ) : null}

      {partners.isPending ? (
        <ListSkeleton label="Carregando parceiros" />
      ) : null}
      {partners.isError ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar os parceiros."
          action={
            <Button
              compact
              loading={partners.isFetching}
              onClick={() => void partners.refetch()}
            >
              <Icon name="refresh" />
              Tentar novamente
            </Button>
          }
        >
          {describeError(partners.error)}
        </Alert>
      ) : null}

      {partners.isSuccess && partners.data.length === 0 ? (
        <EmptyState
          icon="partner"
          title="Nenhum parceiro cadastrado"
          action={
            canCreate ? (
              <Link
                to="/parceiros/novo"
                className="t-label inline-flex min-h-11 items-center rounded-md border border-primary-edge bg-primary-raised px-3 text-primary-foreground no-underline shadow-brand-raised md:min-h-control-sm"
              >
                Novo parceiro
              </Link>
            ) : undefined
          }
        >
          Cadastre o primeiro parceiro para começar o catálogo.
        </EmptyState>
      ) : null}

      {partners.isSuccess && partners.data.length > 0 ? (
        <ListCard
          tabs={[
            { value: '', label: 'Todos', count: filter.countOf('') },
            {
              value: 'published',
              label: 'Publicados',
              count: filter.countOf('published'),
            },
            {
              value: 'draft',
              label: 'Rascunhos',
              count: filter.countOf('draft'),
            },
            {
              value: 'inactive',
              label: 'Desativados',
              count: filter.countOf('inactive'),
            },
          ]}
          activeTab={filter.state}
          onTabChange={filter.setState}
          search={filter.search}
          onSearchChange={filter.setSearch}
          searchLabel="Filtrar por nome"
          footer={
            filter.filtered.length === filter.total
              ? `${filter.total} ${filter.total === 1 ? 'parceiro' : 'parceiros'}`
              : `${filter.filtered.length} de ${filter.total} parceiros`
          }
        >
          <DataTable
            rows={filter.filtered}
            rowKey={(partner) => partner.id}
            emptyTitle="Nenhum parceiro encontrado com esses filtros."
            columns={[
              {
                header: 'Parceiro',
                cell: (partner) => (
                  <CellMain
                    title={partner.name}
                    subtitle={`/${partner.slug}`}
                    mark={initials(partner.name)}
                    extra={
                      partner.featured ? (
                        <Badge tone="outline" icon="star">
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
                <Button compact onClick={() => open(partner)}>
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
      ) : null}

      {confirmation?.kind === 'deactivate' ? (
        <ConfirmDialog
          title={`Desativar ${confirmation.partner.name}?`}
          body="O parceiro deixa de aparecer no catálogo imediatamente. Dados, unidades e benefícios são preservados e ele pode ser republicado."
          confirmLabel="Desativar"
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            const { partner } = confirmation;
            setConfirmation(null);
            runCommand(partner, 'deactivate', `${partner.name} desativado.`);
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
                onSuccess: () => toast(`${partner.name} excluído.`),
                onError: fail,
              },
            );
          }}
        />
      ) : null}
    </>
  );
}
