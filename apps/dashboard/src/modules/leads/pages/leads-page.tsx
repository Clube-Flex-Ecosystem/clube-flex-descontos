import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { LeadSource, LeadStage, LeadSummary } from '@flex/contracts';
import { useCan, useSession } from '../../auth';
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
import { ConfirmDialog, Drawer } from '../../../shared/ui/dialogs';
import { LeadBoard } from '../components/lead-board';
import { leadStageName } from '../lead-stages';
import { useMoveLead } from '../mutations/move-lead.mutation';

interface LeadFormData {
  name: string;
  whatsapp: string;
  email: string;
  sourceId: string;
  sourceDetail: string;
  referredBy: string;
  leaveUnassigned: boolean;
}

export function LeadsPage() {
  const query = useQuery(leadsQueryOptions);
  const sources = useQuery(sourcesQueryOptions);
  const queryClient = useQueryClient();
  const session = useSession();
  const canCreate = useCan('leads.create');
  const canMove = useCan('leads.change-stage');
  const moveLead = useMoveLead();
  const [q, setQ] = useState('');
  const [owner, setOwner] = useState('');
  const [source, setSource] = useState('');
  const [interest, setInterest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    lead: LeadSummary;
    stage: LeadStage;
  } | null>(null);
  const [lossReason, setLossReason] = useState('');
  const [form, setForm] = useState({
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
      query.data?.filter((lead) => {
        const normalizedQuery = q.replace(/\D/g, '');
        const matchesSearch =
          !q ||
          lead.name.toLocaleLowerCase().includes(q.toLocaleLowerCase()) ||
          (Boolean(normalizedQuery) &&
            lead.whatsapp.replace(/\D/g, '').includes(normalizedQuery));
        const matchesOwner =
          !owner ||
          (owner === 'none'
            ? !lead.assignee
            : owner === 'me'
              ? lead.assignee?.id === session?.user.id
              : lead.assignee?.id === owner);
        return (
          matchesSearch &&
          matchesOwner &&
          (!source || lead.source.id === source) &&
          (!interest || lead.hasPendingInterest)
        );
      }) ?? [],
    [interest, owner, q, query.data, session?.user, source],
  );
  const pendingInterestCount = useMemo(
    () => query.data?.filter((lead) => lead.hasPendingInterest).length ?? 0,
    [query.data],
  );

  const move = (lead: LeadSummary, stage: LeadStage, reason?: string) => {
    moveLead.mutate(
      { lead, stage, lossReason: reason },
      {
        onSuccess: () => setError(null),
        onError: (cause) => setError(describeError(cause)),
      },
    );
  };
  const requestMove = (lead: LeadSummary, stage: LeadStage) => {
    if (stage === 'converted' || stage === 'lost') {
      setLossReason('');
      setPendingMove({ lead, stage });
      return;
    }
    move(lead, stage);
  };
  const create = async () => {
    try {
      const lead = await leadsApi.create({
        ...form,
        email: form.email || undefined,
        sourceDetail: form.sourceDetail || undefined,
        referredBy: form.referredBy || undefined,
      });
      queryClient.setQueryData<LeadSummary[]>(leadsKey, (current) =>
        current ? [lead, ...current] : current,
      );
      queryClient.setQueryData([...leadsKey, lead.id], lead);
      setCreating(false);
      setError(null);
    } catch (cause) {
      setError(describeError(cause));
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
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
          <select
            aria-label="Responsável"
            className="h-control-md rounded-md border border-control-border bg-control px-3"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          >
            <option value="">Todos os responsáveis</option>
            <option value="me">Meus leads</option>
            <option value="none">Sem responsável</option>
          </select>
          <select
            aria-label="Origem"
            className="h-control-md rounded-md border border-control-border bg-control px-3"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="">Todas as origens</option>
            {sources.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Button
            compact
            variant={interest ? 'primary' : 'quiet'}
            aria-pressed={interest}
            onClick={() => setInterest((current) => !current)}
          >
            <Badge tone="accent" dot>
              Novo interesse
            </Badge>
            <span className="tnum">{pendingInterestCount}</span>
          </Button>
          <span
            className="t-small ml-auto text-muted-foreground"
            aria-live="polite"
          >
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
        <LeadBoard
          leads={filtered}
          canMove={canMove && !moveLead.isPending}
          onMove={requestMove}
        />
      ) : null}
      {pendingMove ? (
        <ConfirmDialog
          title={`Mover para ${leadStageName(pendingMove.stage)}?`}
          confirmLabel="Mover lead"
          tone="primary"
          body={
            <div className="grid gap-3">
              <span>
                {pendingMove.lead.name} será movido para “
                {leadStageName(pendingMove.stage)}”.
              </span>
              {pendingMove.stage === 'lost' ? (
                <label className="grid gap-1.5">
                  <span className="t-label">Motivo da perda (opcional)</span>
                  <textarea
                    className="min-h-20 rounded-md border border-control-border bg-control p-3"
                    value={lossReason}
                    onChange={(event) => setLossReason(event.target.value)}
                  />
                </label>
              ) : null}
            </div>
          }
          onCancel={() => setPendingMove(null)}
          onConfirm={() => {
            move(pendingMove.lead, pendingMove.stage, lossReason || undefined);
            setPendingMove(null);
          }}
        />
      ) : null}
      {creating ? (
        <Drawer
          title="Novo lead"
          description="O lead será criado na etapa Novo."
          submitLabel="Criar lead"
          onClose={() => setCreating(false)}
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <LeadForm form={form} setForm={setForm} sources={sources.data} />
        </Drawer>
      ) : null}
    </>
  );
}

function LeadForm({
  form,
  setForm,
  sources,
}: {
  form: LeadFormData;
  setForm: (form: LeadFormData) => void;
  sources: LeadSource[] | undefined;
}) {
  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm({ ...form, [key]: value });
  return (
    <>
      <label className="grid gap-1.5">
        <span className="t-label">Nome</span>
        <input
          className="h-control-md rounded-md border border-control-border bg-control px-3"
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          required
        />
      </label>
      <label className="grid gap-1.5">
        <span className="t-label">WhatsApp</span>
        <input
          className="h-control-md rounded-md border border-control-border bg-control px-3"
          value={form.whatsapp}
          onChange={(event) => update('whatsapp', event.target.value)}
          required
        />
      </label>
      <label className="grid gap-1.5">
        <span className="t-label">E-mail (opcional)</span>
        <input
          type="email"
          className="h-control-md rounded-md border border-control-border bg-control px-3"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="t-label">Origem</span>
        <select
          className="h-control-md rounded-md border border-control-border bg-control px-3"
          value={form.sourceId}
          onChange={(event) => update('sourceId', event.target.value)}
          required
        >
          <option value="">Selecione</option>
          {sources
            ?.filter((item) => item.active && item.kind === 'manual')
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="t-label">Detalhe da origem</span>
        <textarea
          className="min-h-20 rounded-md border border-control-border bg-control p-3"
          value={form.sourceDetail}
          onChange={(event) => update('sourceDetail', event.target.value)}
        />
      </label>
      {sources?.find((item) => item.id === form.sourceId)?.requiresReferral ? (
        <label className="grid gap-1.5">
          <span className="t-label">Quem indicou</span>
          <input
            className="h-control-md rounded-md border border-control-border bg-control px-3"
            value={form.referredBy}
            onChange={(event) => update('referredBy', event.target.value)}
            required
          />
        </label>
      ) : null}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.leaveUnassigned}
          onChange={(event) => update('leaveUnassigned', event.target.checked)}
        />
        <span className="t-label">Deixar sem responsável</span>
      </label>
    </>
  );
}
