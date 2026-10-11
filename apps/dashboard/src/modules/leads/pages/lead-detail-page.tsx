import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  leadRemovalOutcome,
  type Lead,
  type LeadStage,
  type LeadSummary,
} from '@flex/contracts';
import { leadsApi } from '../api/leads.api';
import {
  historyQueryOptions,
  leadQueryOptions,
  leadsKey,
} from '../queries/leads.query';
import { useToast } from '../../../shared/feedback/toast';
import { CardStack } from '../../../shared/ui/card';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { PageHeader, ListSkeleton } from '../../../shared/ui/page-parts';
import { Alert } from '../../../shared/ui/alert';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { controlClass } from '../../../shared/ui/form-controls';
import { describeError } from '../../../shared/http/problem';
import { useCan, useSession } from '../../auth';
const labels: Record<LeadStage, string> = {
  new: 'Novo',
  firstContact: 'Primeiro contato',
  negotiating: 'Em negociação',
  converted: 'Convertido',
  lost: 'Perdido',
};
const fmt = (v: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(v));
export function LeadDetailPage({ id }: { id: string }) {
  const q = useQuery(leadQueryOptions(id)),
    history = useQuery(historyQueryOptions(id)),
    qc = useQueryClient(),
    session = useSession();
  const [note, setNote] = useState(''),
    [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(),
    toast = useToast();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false),
    [removing, setRemoving] = useState(false);
  const canUpdateLead = useCan('leads.update'),
    canStageLead = useCan('leads.change-stage'),
    canAssignLead = useCan('leads.assign'),
    canDelete = useCan('leads.delete');
  // Um lead anonimizado preserva apenas a rastreabilidade e não aceita alterações.
  const locked = Boolean(q.data?.anonymized);
  const canUpdate = canUpdateLead && !locked,
    canStage = canStageLead && !locked,
    canAssign = canAssignLead && !locked;
  const assignees = useQuery({
    queryKey: ['lead-assignees'],
    queryFn: leadsApi.assignees,
    enabled: canAssign,
  });
  const commit = async (action: (l: Lead) => Promise<Lead>) => {
    if (!q.data) return;
    try {
      const updated = await action(q.data);
      qc.setQueryData([...leadsKey, id], updated);
      qc.setQueryData(leadsKey, (old: Lead[] | undefined) =>
        old?.map((x) => (x.id === id ? updated : x)),
      );
      void history.refetch();
      setError(null);
    } catch (e) {
      setError(describeError(e));
    }
  };
  if (q.isPending) return <ListSkeleton label="Carregando lead" />;
  if (q.isError || !q.data)
    return (
      <Alert tone="danger" title="Não foi possível carregar o lead.">
        {describeError(q.error)}
      </Alert>
    );
  const l = q.data;
  const removal = leadRemovalOutcome({
    observationCount: l.observations.length,
    eventTypes: (history.data ?? []).map((event) => event.type),
  });
  const remove = async () => {
    setRemoving(true);
    try {
      const result = await leadsApi.remove(l.id, l.version);
      qc.setQueryData<LeadSummary[]>(leadsKey, (old) =>
        old?.filter((item) => item.id !== l.id),
      );
      qc.removeQueries({ queryKey: [...leadsKey, l.id] });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast(
        result.deleted
          ? 'Lead excluído.'
          : 'Lead anonimizado e removido do pipeline.',
      );
      void navigate({ to: '/leads' });
    } catch (e) {
      setConfirmingRemoval(false);
      setError(describeError(e));
    } finally {
      setRemoving(false);
    }
  };
  return (
    <>
      <PageHeader
        title={l.name}
        description={`${l.whatsapp} · ${l.source.name}`}
        status={
          <>
            {l.stage === 'lost' ? (
              <Badge icon="x">{labels[l.stage]}</Badge>
            ) : (
              <Badge tone={l.stage === 'converted' ? 'success' : 'neutral'} dot>
                {labels[l.stage]}
              </Badge>
            )}
            {l.hasPendingInterest ? (
              <Badge tone="attention" dot>
                Novo interesse
              </Badge>
            ) : null}
          </>
        }
        actions={
          <>
            {canStage ? (
              <select
                aria-label="Etapa"
                className={`${controlClass} h-control-md w-auto`}
                value={l.stage}
                onChange={(e) =>
                  void commit((x) =>
                    leadsApi.stage(
                      x.id,
                      x.version,
                      e.target.value as LeadStage,
                    ),
                  )
                }
              >
                {Object.entries(labels).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            ) : null}
          </>
        }
      />
      {locked ? (
        <div className="mb-3">
          <Alert tone="info" title="Lead anonimizado.">
            Os dados pessoais foram removidos por revogação de consentimento. O
            histórico operacional e a auditoria foram preservados.
          </Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-3">
          <Alert tone="danger" title="Não foi possível salvar a alteração.">
            {error}
          </Alert>
        </div>
      ) : null}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CardStack>
          <section>
            <header className="border-b border-border px-4 py-3">
              <h2 className="t-section">Solicitações de contato</h2>
              <p className="t-caption mt-px font-normal text-muted-foreground">
                Envios do formulário público para este WhatsApp.
              </p>
            </header>
            <ul className="divide-y divide-border">
              {l.contactRequests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <strong className="t-body font-semibold">
                      {r.resolvedAt ? 'Primeira solicitação' : 'Novo interesse'}
                    </strong>
                    <p className="t-caption text-muted-foreground">
                      {fmt(r.createdAt)} · consentimento registrado
                    </p>
                  </div>
                  {!r.resolvedAt && canUpdate ? (
                    <Button
                      compact
                      onClick={() =>
                        void commit((x) =>
                          leadsApi.resolve(x.id, x.version, r.id),
                        )
                      }
                    >
                      <Icon name="check" />
                      Marcar como tratada
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <header className="border-b border-border px-4 py-3">
              <h2 className="t-section">Observações</h2>
              <p className="t-caption mt-px font-normal text-muted-foreground">
                Somente o autor pode corrigir a própria observação.
              </p>
            </header>
            <ul className="divide-y divide-border">
              {l.observations.map((o) => (
                <li key={o.id} className="p-4">
                  <p>{o.text}</p>
                  <p className="t-caption mt-1 text-muted-foreground">
                    {o.author.fullName} · {fmt(o.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
            {canUpdate ? (
              <form
                className="grid gap-2 border-t border-border p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (note.trim())
                    void commit((x) =>
                      leadsApi.observe(x.id, x.version, note.trim()),
                    ).then(() => setNote(''));
                }}
              >
                <textarea
                  className={`${controlClass} min-h-24 py-2`}
                  placeholder="Registrar uma observação sobre o atendimento…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div>
                  <Button compact type="submit">
                    Adicionar observação
                  </Button>
                </div>
              </form>
            ) : null}
          </section>
          <section>
            <header className="border-b border-border px-4 py-3">
              <h2 className="t-section">Histórico</h2>
              <p className="t-caption mt-px font-normal text-muted-foreground">
                Registro imutável das alterações relevantes.
              </p>
            </header>
            <ol className="grid gap-0 p-4">
              {history.data?.map((h) => (
                <li
                  key={h.id}
                  className="relative border-l border-border pb-5 pl-5 before:absolute before:top-1 before:-left-1 before:size-2 before:rounded-full before:bg-surface before:ring-2 before:ring-border-strong"
                >
                  <p className="t-heading">{h.type.replaceAll('.', ' · ')}</p>
                  <time className="t-caption text-muted-foreground">
                    {fmt(h.occurredAt)}
                    {h.actor ? ` · ${h.actor.fullName}` : ''}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        </CardStack>
        <CardStack>
          <section>
            <header className="border-b border-border px-4 py-3">
              <h2 className="t-section">Dados do lead</h2>
            </header>
            <dl className="divide-y divide-border px-4">
              <div className="py-3">
                <dt className="t-caption text-muted-foreground">WhatsApp</dt>
                <dd className="tnum">{l.whatsapp}</dd>
              </div>
              <div className="py-3">
                <dt className="t-caption text-muted-foreground">E-mail</dt>
                <dd>{l.email ?? 'Não informado'}</dd>
              </div>
              <div className="py-3">
                <dt className="t-caption text-muted-foreground">Origem</dt>
                <dd>{l.source.name}</dd>
              </div>
              {l.sourceDetail ? (
                <div className="py-3">
                  <dt className="t-caption text-muted-foreground">Detalhe</dt>
                  <dd>{l.sourceDetail}</dd>
                </div>
              ) : null}
            </dl>
          </section>
          <section className="p-4">
            <h2 className="t-section">Responsável</h2>
            <p className="mt-2">{l.assignee?.fullName ?? 'Sem responsável'}</p>
            {l.assignee?.id === session?.user.id ? (
              <Button
                className="mt-3"
                compact
                onClick={() =>
                  void commit((x) => leadsApi.assign(x.id, x.version, null))
                }
              >
                Devolver lead
              </Button>
            ) : null}
            {canAssign ? (
              <>
                <select
                  aria-label="Responsável"
                  className={`${controlClass} mt-3 h-control-md`}
                  value={l.assignee?.id ?? ''}
                  onChange={(e) =>
                    void commit((x) =>
                      leadsApi.assign(x.id, x.version, e.target.value || null),
                    )
                  }
                >
                  <option value="">Sem responsável</option>
                  {assignees.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
                <p className="t-caption mt-2 text-muted-foreground">
                  A troca é registrada no histórico do lead.
                </p>
              </>
            ) : null}
          </section>
          {canDelete && !locked ? (
            <section className="grid gap-3 p-4">
              <div>
                <h2 className="t-section">Privacidade</h2>
                <p className="t-caption mt-px font-normal text-muted-foreground">
                  Para revogações de consentimento validadas.
                </p>
              </div>
              <p className="t-body-small muted">
                Leads com histórico são anonimizados; leads sem histórico podem
                ser excluídos. A operação gera registro de auditoria.
              </p>
              <div>
                <Button
                  variant="danger-quiet"
                  disabled={!history.isSuccess}
                  onClick={() => setConfirmingRemoval(true)}
                >
                  <Icon name="trash" />
                  Excluir ou anonimizar
                </Button>
              </div>
            </section>
          ) : null}
        </CardStack>
      </div>
      {confirmingRemoval ? (
        <ConfirmDialog
          title={
            removal === 'anonymize'
              ? 'Anonimizar este lead?'
              : 'Excluir este lead?'
          }
          body={
            removal === 'anonymize'
              ? `${l.name} possui histórico operacional. Nome, WhatsApp e e-mail serão substituídos de forma irreversível; o histórico e a auditoria são preservados.`
              : `${l.name} não possui histórico operacional. O lead, suas solicitações de contato e seus consentimentos serão excluídos de forma irreversível; a operação fica registrada na auditoria.`
          }
          confirmLabel={
            removing
              ? 'Aguarde…'
              : removal === 'anonymize'
                ? 'Anonimizar'
                : 'Excluir'
          }
          onCancel={() => setConfirmingRemoval(false)}
          onConfirm={() => void remove()}
        />
      ) : null}
    </>
  );
}
