import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { LeadSource } from '@flex/contracts';
import { useCan } from '../../auth';
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
import {
  SourceFormDrawer,
  sourceDeactivationBody,
} from '../components/source-form-drawer';
import {
  useDeleteSource,
  useSetSourceActive,
} from '../mutations/sources.mutations';
import { sourcesQueryOptions } from '../queries/leads.query';

const stateOf = (source: LeadSource) =>
  source.active ? ('active' as const) : ('inactive' as const);
const textOf = (source: LeadSource) => source.name;

type Confirmation =
  | { kind: 'deactivate'; source: LeadSource }
  | { kind: 'delete'; source: LeadSource };

/** Tipos de origem dos leads; a origem automática do catálogo é protegida. */
export function SourcesPage() {
  const query = useQuery(sourcesQueryOptions);
  const canManage = useCan('sources.manage');
  const toast = useToast();
  const setActive = useSetSourceActive();
  const remove = useDeleteSource();
  const [editing, setEditing] = useState<LeadSource | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const filter = useListFilter('sources', query.data ?? [], {
    stateOf,
    textOf,
  });

  const fail = (error: unknown) => setActionError(describeError(error));
  const changeActive = (source: LeadSource, active: boolean) => {
    setActionError(null);
    setActive.mutate(
      { id: source.id, version: source.version, active },
      {
        onSuccess: () =>
          toast(`“${source.name}” agora está ${active ? 'ativa' : 'inativa'}.`),
        onError: fail,
      },
    );
  };

  const editable = (source: LeadSource) => canManage && !source.protected;
  const menuItems = (source: LeadSource): RowMenuItem[] => {
    if (!editable(source)) return [];
    const items: RowMenuItem[] = [
      source.active
        ? {
            label: 'Desativar',
            onSelect: () => setConfirmation({ kind: 'deactivate', source }),
          }
        : { label: 'Reativar', onSelect: () => changeActive(source, true) },
    ];
    if (source.usageCount === 0)
      items.push({
        label: 'Excluir',
        danger: true,
        separated: true,
        onSelect: () => setConfirmation({ kind: 'delete', source }),
      });
    return items;
  };

  return (
    <>
      <PageHeader
        title="Origens"
        description="Canais de aquisição atribuídos aos leads."
        actions={
          canManage ? (
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Icon name="plus" />
              Nova origem
            </Button>
          ) : null
        }
      />
      {actionError ? (
        <div className="mb-3">
          <Alert
            tone="danger"
            title="Não foi possível concluir a operação."
            action={
              <Button compact onClick={() => void query.refetch()}>
                Atualizar listagem
              </Button>
            }
          >
            {actionError}
          </Alert>
        </div>
      ) : null}
      {query.isPending ? <ListSkeleton label="Carregando origens" /> : null}
      {query.isError ? (
        <Alert
          tone="danger"
          title="Não foi possível carregar as origens."
          action={
            <Button compact onClick={() => void query.refetch()}>
              <Icon name="refresh" />
              Tentar novamente
            </Button>
          }
        >
          {describeError(query.error)}
        </Alert>
      ) : null}
      {query.isSuccess && filter.total === 0 ? (
        <EmptyState
          icon="source"
          title="Nenhuma origem cadastrada"
          action={
            canManage ? (
              <Button compact onClick={() => setEditing('new')}>
                Nova origem
              </Button>
            ) : undefined
          }
        >
          Cadastre os canais usados pela operação comercial.
        </EmptyState>
      ) : null}
      {query.isSuccess && filter.total > 0 ? (
        <ListCard
          tabs={[
            { value: '', label: 'Todas', count: filter.countOf('') },
            {
              value: 'active',
              label: 'Ativas',
              count: filter.countOf('active'),
            },
            {
              value: 'inactive',
              label: 'Inativas',
              count: filter.countOf('inactive'),
            },
          ]}
          activeTab={filter.state}
          onTabChange={filter.setState}
          search={filter.search}
          onSearchChange={filter.setSearch}
          searchLabel="Filtrar origens"
          footer={
            filter.filtered.length === filter.total
              ? `${filter.total} ${filter.total === 1 ? 'origem' : 'origens'}`
              : `${filter.filtered.length} de ${filter.total} origens`
          }
        >
          <DataTable
            rows={filter.filtered}
            rowKey={(source) => source.id}
            emptyTitle="Nenhuma origem encontrada com esses filtros."
            onClearFilters={filter.clear}
            {...(canManage
              ? {
                  onRowClick: (source: LeadSource) => {
                    if (!source.protected) setEditing(source);
                  },
                }
              : {})}
            columns={[
              {
                header: 'Origem',
                cell: (source) => (
                  <CellMain
                    title={source.name}
                    {...(source.protected
                      ? { subtitle: 'Automática, usada pelo catálogo' }
                      : source.requiresReferral
                        ? { subtitle: 'Exige identificação da indicação' }
                        : {})}
                    extra={
                      source.protected ? (
                        <Badge tone="tag" icon="lock">
                          Protegida
                        </Badge>
                      ) : null
                    }
                  />
                ),
              },
              {
                header: 'Leads',
                align: 'right',
                cell: (source) => source.usageCount,
              },
              {
                header: 'Estado',
                cell: (source) =>
                  source.active ? (
                    <Badge tone="success" dot>
                      Ativa
                    </Badge>
                  ) : (
                    <Badge dot>Inativa</Badge>
                  ),
              },
            ]}
            actions={(source) =>
              editable(source) ? (
                <>
                  <Button compact onClick={() => setEditing(source)}>
                    Editar
                  </Button>
                  <RowMenu
                    label={`Mais ações para ${source.name}`}
                    items={menuItems(source)}
                  />
                </>
              ) : null
            }
          />
        </ListCard>
      ) : null}

      {editing ? (
        <SourceFormDrawer
          key={editing === 'new' ? 'new' : editing.id}
          {...(editing === 'new' ? {} : { source: editing })}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {confirmation?.kind === 'deactivate' ? (
        <ConfirmDialog
          title={`Desativar “${confirmation.source.name}”?`}
          body={sourceDeactivationBody}
          confirmLabel="Desativar"
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            changeActive(confirmation.source, false);
            setConfirmation(null);
          }}
        />
      ) : null}
      {confirmation?.kind === 'delete' ? (
        <ConfirmDialog
          title={`Excluir “${confirmation.source.name}”?`}
          body="A origem nunca foi utilizada e será removida definitivamente."
          confirmLabel="Excluir"
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            const { source } = confirmation;
            setConfirmation(null);
            setActionError(null);
            remove.mutate(
              { id: source.id, version: source.version },
              {
                onSuccess: () => toast(`“${source.name}” foi excluída.`),
                onError: fail,
              },
            );
          }}
        />
      ) : null}
    </>
  );
}
