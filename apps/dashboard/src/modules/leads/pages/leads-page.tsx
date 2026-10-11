import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import type { LeadStage, LeadSummary } from '@flex/contracts';
import { useCan } from '../../auth';
import { leadsApi } from '../api/leads.api';
import {
  leadsKey,
  leadsQueryOptions,
  sourcesQueryOptions,
} from '../queries/leads.query';
import { PageHeader, ListSkeleton } from '../../../shared/ui/page-parts';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Badge } from '../../../shared/ui/badge';
import { Icon } from '../../../shared/ui/icon';
import { describeError } from '../../../shared/http/problem';
import { Drawer } from '../../../shared/ui/dialogs';

const stages: { id: LeadStage; name: string }[] = [
  { id: 'new', name: 'Novo' },
  { id: 'firstContact', name: 'Primeiro contato' },
  { id: 'negotiating', name: 'Em negociação' },
  { id: 'converted', name: 'Convertido' },
  { id: 'lost', name: 'Perdido' },
];
function LeadCard({
  lead,
  onMove,
}: {
  lead: LeadSummary;
  onMove: (l: LeadSummary, s: LeadStage) => void;
}) {
  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', lead.id)}
      className={`relative rounded-lg border bg-surface px-3 py-2.5 shadow-sm hover:border-border-strong ${lead.hasPendingInterest ? 'border-l-[3px] border-l-accent' : ''}`}
    >
      <div className="flex items-start gap-2">
        <Link
          to="/leads/$leadId"
          params={{ leadId: lead.id }}
          className="t-card min-w-0 flex-1 text-foreground no-underline hover:text-accent-foreground hover:underline"
        >
          {lead.name}
        </Link>
        <select
          aria-label={`Alterar etapa de ${lead.name}`}
          className="size-7 rounded-md border border-transparent bg-transparent text-transparent hover:border-border"
          value=""
          onChange={(e) => onMove(lead, e.target.value as LeadStage)}
        >
          <option value="">Mover</option>
          {stages
            .filter((s) => s.id !== lead.stage)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </div>
      <p className="t-small tnum text-muted-foreground">{lead.whatsapp}</p>
      {lead.hasPendingInterest ? (
        <p className="t-caption mt-2 font-semibold text-accent-foreground">
          ● &nbsp;Novo interesse pendente
        </p>
      ) : null}
      <div className="t-caption mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2 text-muted-foreground">
        <span className="truncate">{lead.source.name}</span>
        <span className="shrink-0">
          {lead.assignee?.fullName ?? 'Sem responsável'}
        </span>
      </div>
    </article>
  );
}

export function LeadsPage() {
  const query = useQuery(leadsQueryOptions),
    sources = useQuery(sourcesQueryOptions),
    qc = useQueryClient();
  const canCreate = useCan('leads.create');
  const [q, setQ] = useState(''),
    [owner, setOwner] = useState(''),
    [source, setSource] = useState(''),
    [interest, setInterest] = useState(false),
    [error, setError] = useState<string | null>(null),
    [creating, setCreating] = useState(false),
    [form, setForm] = useState({
      name: '',
      whatsapp: '',
      email: '',
      sourceId: '',
      sourceDetail: '',
      referredBy: '',
      leaveUnassigned: false,
    });
  const filtered = useMemo(
    () =>
      query.data?.filter(
        (l) =>
          (!q ||
            `${l.name} ${l.whatsapp}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (!owner ||
            (owner === 'none' ? !l.assignee : l.assignee?.id === owner)) &&
          (!source || l.source.id === source) &&
          (!interest || l.hasPendingInterest),
      ) ?? [],
    [query.data, q, owner, source, interest],
  );
  const move = async (l: LeadSummary, s: LeadStage) => {
    if (
      (s === 'converted' || s === 'lost') &&
      !confirm(
        `Mover ${l.name} para “${stages.find((x) => x.id === s)?.name}”?`,
      )
    )
      return;
    const previous = query.data;
    qc.setQueryData(
      leadsKey,
      previous?.map((x) => (x.id === l.id ? { ...x, stage: s } : x)),
    );
    try {
      const updated = await leadsApi.stage(l.id, l.version, s);
      qc.setQueryData(
        leadsKey,
        previous?.map((x) => (x.id === l.id ? updated : x)),
      );
      setError(null);
    } catch (e) {
      qc.setQueryData(leadsKey, previous);
      setError(describeError(e));
    }
  };
  const create = async () => {
    try {
      await leadsApi.create({
        ...form,
        email: form.email || undefined,
        sourceDetail: form.sourceDetail || undefined,
        referredBy: form.referredBy || undefined,
      });
      await qc.invalidateQueries({ queryKey: leadsKey });
      setCreating(false);
      setError(null);
    } catch (e) {
      setError(describeError(e));
    }
  };
  return (
    <>
      <PageHeader
        title="Leads"
        description="Pipeline comercial dos contatos que você pode visualizar."
        actions={
          canCreate ? (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Icon name="plus" />
              Novo lead
            </Button>
          ) : null
        }
      />
      <section className="mb-3 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Filtrar leads</span>
            <Icon
              name="search"
              className="absolute top-2.5 left-3 text-muted-foreground"
            />
            <input
              className="h-control-md w-full rounded-md border border-control-border bg-control pr-3 pl-9"
              placeholder="Nome ou WhatsApp"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <select
            className="h-control-md rounded-md border border-control-border bg-control px-3"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="">Todos os responsáveis</option>
            <option value="none">Sem responsável</option>
          </select>
          <select
            className="h-control-md rounded-md border border-control-border bg-control px-3"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">Todas as origens</option>
            {sources.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button
            compact
            variant={interest ? 'primary' : 'quiet'}
            onClick={() => setInterest(!interest)}
          >
            <Badge tone="accent" dot>
              Novo interesse
            </Badge>
          </Button>
          <span className="t-small ml-auto text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'lead' : 'leads'}
          </span>
        </div>
      </section>
      {error ? (
        <div className="mb-3">
          <Alert tone="danger" title="Não foi possível mover o lead.">
            O card voltou para a etapa confirmada. {error}
          </Alert>
        </div>
      ) : null}
      {query.isPending ? <ListSkeleton label="Carregando leads" /> : null}
      {query.isError ? (
        <Alert tone="danger" title="Não foi possível carregar os leads.">
          {describeError(query.error)}
        </Alert>
      ) : null}
      {query.isSuccess ? (
        <div className="overflow-x-auto pb-3">
          <div className="grid min-w-[1180px] grid-cols-5 gap-3">
            {stages.map((stage) => {
              const items = filtered.filter((l) => l.stage === stage.id);
              return (
                <section
                  key={stage.id}
                  aria-label={`${stage.name}, ${items.length} leads`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const l = query.data.find(
                      (x) => x.id === e.dataTransfer.getData('text/plain'),
                    );
                    if (l && l.stage !== stage.id) void move(l, stage.id);
                  }}
                  className="min-h-80 rounded-xl bg-surface-muted p-2.5"
                >
                  <header className="mb-2.5 flex items-center justify-between px-1">
                    <h2 className="t-card">{stage.name}</h2>
                    <span className="t-caption grid min-w-6 place-items-center rounded-full border border-border bg-surface px-1.5 py-0.5">
                      {items.length}
                    </span>
                  </header>
                  <div className="grid gap-2">
                    {items.map((l) => (
                      <LeadCard
                        key={l.id}
                        lead={l}
                        onMove={(a, b) => void move(a, b)}
                      />
                    ))}
                    {!items.length ? (
                      <p className="t-small py-8 text-center text-muted-foreground">
                        Nenhum lead nesta etapa
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}
      {creating ? (
        <Drawer
          title="Novo lead"
          description="O lead será criado na etapa Novo."
          submitLabel="Criar lead"
          onClose={() => setCreating(false)}
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <label className="grid gap-1.5">
            <span className="t-label">Nome</span>
            <input
              className="h-control-md rounded-md border border-control-border bg-control px-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="t-label">WhatsApp</span>
            <input
              className="h-control-md rounded-md border border-control-border bg-control px-3"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="t-label">E-mail (opcional)</span>
            <input
              type="email"
              className="h-control-md rounded-md border border-control-border bg-control px-3"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="t-label">Origem</span>
            <select
              className="h-control-md rounded-md border border-control-border bg-control px-3"
              value={form.sourceId}
              onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
              required
            >
              <option value="">Selecione</option>
              {sources.data
                ?.filter((s) => s.active && s.kind === 'manual')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="t-label">Detalhe da origem</span>
            <textarea
              className="min-h-20 rounded-md border border-control-border bg-control p-3"
              value={form.sourceDetail}
              onChange={(e) =>
                setForm({ ...form, sourceDetail: e.target.value })
              }
            />
          </label>
          {sources.data?.find((s) => s.id === form.sourceId)
            ?.requiresReferral ? (
            <label className="grid gap-1.5">
              <span className="t-label">Quem indicou</span>
              <input
                className="h-control-md rounded-md border border-control-border bg-control px-3"
                value={form.referredBy}
                onChange={(e) =>
                  setForm({ ...form, referredBy: e.target.value })
                }
                required
              />
            </label>
          ) : null}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.leaveUnassigned}
              onChange={(e) =>
                setForm({ ...form, leaveUnassigned: e.target.checked })
              }
            />
            <span className="t-label">Deixar sem responsável</span>
          </label>
        </Drawer>
      ) : null}
    </>
  );
}
