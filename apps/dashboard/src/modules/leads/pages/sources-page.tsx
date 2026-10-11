import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { http } from '../../../shared/http/client';
import { useCan } from '../../auth';
import { sourcesQueryOptions } from '../queries/leads.query';
import {
  PageHeader,
  ListSkeleton,
  EmptyState,
} from '../../../shared/ui/page-parts';
import { ListCard } from '../../../shared/ui/list-card';
import { DataTable, CellMain } from '../../../shared/ui/data-table';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { Drawer, ConfirmDialog } from '../../../shared/ui/dialogs';
import { Alert } from '../../../shared/ui/alert';
import { Icon } from '../../../shared/ui/icon';
import { controlClass } from '../../../shared/ui/form-controls';
import { describeError } from '../../../shared/http/problem';
import type { LeadSource } from '@flex/contracts';
const config = (version: number) => ({
  headers: { 'If-Match': `"${version}"` },
});
export function SourcesPage() {
  const q = useQuery(sourcesQueryOptions),
    qc = useQueryClient(),
    can = useCan('sources.manage');
  const [editing, setEditing] = useState<LeadSource | 'new' | null>(null),
    [deactivate, setDeactivate] = useState<LeadSource | null>(null),
    [name, setName] = useState(''),
    [referral, setReferral] = useState(false),
    [error, setError] = useState<string | null>(null);
  const open = (s: LeadSource | 'new') => {
    setEditing(s);
    setName(s === 'new' ? '' : s.name);
    setReferral(s === 'new' ? false : s.requiresReferral);
    setError(null);
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ['lead-sources'] });
  const save = async () => {
    try {
      if (editing === 'new')
        await http.post('/v1/admin/lead-sources', {
          name,
          requiresReferral: referral,
        });
      else if (editing)
        await http.patch(
          `/v1/admin/lead-sources/${editing.id}`,
          { name, requiresReferral: referral },
          config(editing.version),
        );
      await refresh();
      setEditing(null);
    } catch (e) {
      setError(describeError(e));
    }
  };
  const toggle = async (s: LeadSource, active: boolean) => {
    try {
      await http.post(
        `/v1/admin/lead-sources/${s.id}/${active ? 'activate' : 'deactivate'}`,
        {},
        config(s.version),
      );
      await refresh();
      setDeactivate(null);
    } catch (e) {
      setError(describeError(e));
    }
  };
  return (
    <>
      <PageHeader
        title="Origens"
        description="Canais de aquisição atribuídos aos leads."
        actions={
          can ? (
            <Button variant="primary" onClick={() => open('new')}>
              <Icon name="plus" />
              Nova origem
            </Button>
          ) : null
        }
      />
      {error ? (
        <div className="mb-3">
          <Alert tone="danger" title="Não foi possível concluir a operação.">
            {error}
          </Alert>
        </div>
      ) : null}
      {q.isPending ? <ListSkeleton label="Carregando origens" /> : null}
      {q.isError ? (
        <Alert tone="danger" title="Não foi possível carregar as origens.">
          {describeError(q.error)}
        </Alert>
      ) : null}
      {q.isSuccess && q.data.length === 0 ? (
        <EmptyState icon="source" title="Nenhuma origem cadastrada">
          Cadastre os canais usados pela operação comercial.
        </EmptyState>
      ) : null}
      {q.isSuccess && q.data.length ? (
        <ListCard
          tabs={[]}
          activeTab=""
          onTabChange={() => {}}
          search=""
          onSearchChange={() => {}}
          searchLabel="Filtrar origens"
          footer={`${q.data.length} origens`}
        >
          <DataTable
            rows={q.data}
            rowKey={(s) => s.id}
            columns={[
              {
                header: 'Origem',
                cell: (s) => (
                  <CellMain
                    title={s.name}
                    subtitle={
                      s.protected
                        ? 'Criada automaticamente pelo catálogo'
                        : s.requiresReferral
                          ? 'Exige identificação da indicação'
                          : 'Cadastro manual'
                    }
                  />
                ),
              },
              { header: 'Leads', cell: (s) => s.usageCount },
              {
                header: 'Estado',
                cell: (s) => (
                  <div className="flex gap-2">
                    <Badge tone={s.active ? 'success' : 'neutral'} dot>
                      {s.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    {s.protected ? <Badge>Protegida</Badge> : null}
                  </div>
                ),
              },
            ]}
            emptyTitle="Nenhuma origem encontrada."
            actions={(s) =>
              can && !s.protected ? (
                <div className="flex gap-2">
                  <Button compact onClick={() => open(s)}>
                    Editar
                  </Button>
                  <Button
                    compact
                    variant="quiet"
                    onClick={() =>
                      s.active ? setDeactivate(s) : void toggle(s, true)
                    }
                  >
                    {s.active ? 'Desativar' : 'Reativar'}
                  </Button>
                </div>
              ) : null
            }
          />
        </ListCard>
      ) : null}
      {editing ? (
        <Drawer
          title={editing === 'new' ? 'Nova origem' : 'Editar origem'}
          description="Canal usado para identificar como o lead chegou."
          onClose={() => setEditing(null)}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="grid gap-1.5">
            <span className="t-label">Nome</span>
            <input
              autoFocus
              className={`${controlClass} h-control-md`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={referral}
              onChange={(e) => setReferral(e.target.checked)}
            />
            <span>
              <strong className="t-label block">Origem por indicação</strong>
              <span className="t-body-small text-muted-foreground">
                Exige informar quem indicou no cadastro do lead.
              </span>
            </span>
          </label>
        </Drawer>
      ) : null}
      {deactivate ? (
        <ConfirmDialog
          title={`Desativar “${deactivate.name}”?`}
          body="A origem deixa de aparecer em novos cadastros. Os leads existentes são preservados."
          confirmLabel="Desativar"
          onCancel={() => setDeactivate(null)}
          onConfirm={() => void toggle(deactivate, false)}
        />
      ) : null}
    </>
  );
}
