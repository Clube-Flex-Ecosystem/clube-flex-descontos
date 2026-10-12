import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  formatPhone,
  leadRemovalOutcome,
  type Lead,
  type LeadSummary,
} from '@flex/contracts';
import { useCan, useSession } from '../../auth';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { isVersionConflict } from '../../../shared/http/versioning';
import { Alert } from '../../../shared/ui/alert';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { CardHead, CardStack, DefinitionList } from '../../../shared/ui/card';
import { CopyButton } from '../../../shared/ui/copy-button';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { controlClass } from '../../../shared/ui/form-controls';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-parts';
import { leadsApi } from '../api/leads.api';
import { LeadEditDrawer } from '../components/lead-edit-drawer';
import { LeadHistoryCard } from '../components/lead-history-card';
import { LeadObservations } from '../components/lead-observations';
import { StageDialog } from '../components/stage-dialog';
import { formatLeadDate } from '../lead-dates';
import { leadStageName } from '../lead-stages';
import { useLeadCommand } from '../mutations/lead-command.mutation';
import {
  assigneesQueryOptions,
  historyQueryOptions,
  leadQueryOptions,
  leadsKey,
} from '../queries/leads.query';

/** Erro de uma área do detalhe, com reconciliação quando outra pessoa alterou o lead. */
function AreaError({
  error,
  title,
  onReload,
}: {
  error: Error | null;
  title: string;
  onReload: () => void;
}) {
  if (!error) return null;
  const conflict = isVersionConflict(error);
  return (
    <Alert
      tone={conflict ? 'warning' : 'danger'}
      title={conflict ? 'Outra pessoa alterou este lead.' : title}
      action={
        conflict ? (
          <Button compact onClick={onReload}>
            <Icon name="refresh" />
            Carregar versão atual
          </Button>
        ) : undefined
      }
    >
      {describeError(error)}
    </Alert>
  );
}

/** Detalhe do lead: o recurso inicial é carregado pela rota. */
export function LeadDetailPage({ lead: initial }: { lead: Lead }) {
  const query = useQuery({
    ...leadQueryOptions(initial.id),
    initialData: initial,
  });
  const lead = query.data;
  const history = useQuery(historyQueryOptions(lead.id));
  const queryClient = useQueryClient();
  const session = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const me = session?.user;

  // Um lead anonimizado preserva apenas a rastreabilidade e não aceita alterações.
  const locked = Boolean(lead.anonymized);
  const canUpdate = useCan('leads.update') && !locked;
  const canStage = useCan('leads.change-stage') && !locked;
  const canAssign = useCan('leads.assign') && !locked;
  const canViewAll = useCan('leads.view-all');
  const canDelete = useCan('leads.delete') && !locked;
  // A lista de contas atribuíveis exige visão global de leads.
  const assignees = useQuery({
    ...assigneesQueryOptions,
    enabled: canAssign && canViewAll,
  });

  const resolve = useLeadCommand();
  const assign = useLeadCommand();
  const stage = useLeadCommand();
  const [changingStage, setChangingStage] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  const reload = () => {
    resolve.reset();
    assign.reset();
    stage.reset();
    void query.refetch();
    void history.refetch();
  };

  const people = new Map<string, string>([
    ...(assignees.data ?? []).map((user) => [user.id, user.fullName] as const),
    ...(lead.assignee
      ? [[lead.assignee.id, lead.assignee.fullName] as const]
      : []),
    ...(me ? [[me.id, me.fullName] as const] : []),
  ]);
  const nameOf = (id: unknown) =>
    typeof id === 'string' ? people.get(id) : undefined;
  const assigneeOptions = [...people].map(([id, fullName]) => ({
    id,
    fullName,
  }));

  const pending = lead.contactRequests.filter((request) => !request.resolvedAt);
  const resolved = lead.contactRequests.filter((request) => request.resolvedAt);
  const isMine = Boolean(me && lead.assignee?.id === me.id);

  const removal = leadRemovalOutcome({
    observationCount: lead.observations.length,
    eventTypes: (history.data ?? []).map((event) => event.type),
  });
  const remove = async () => {
    setRemoving(true);
    setRemovalError(null);
    try {
      const result = await leadsApi.remove(lead.id, lead.version);
      queryClient.setQueryData<LeadSummary[]>(leadsKey, (old) =>
        old?.filter((item) => item.id !== lead.id),
      );
      queryClient.removeQueries({ queryKey: [...leadsKey, lead.id] });
      void queryClient.invalidateQueries({ queryKey: ['audit'] });
      toast(
        result.deleted
          ? 'Lead excluído.'
          : 'Lead anonimizado e removido do pipeline.',
      );
      void navigate({ to: '/leads' });
    } catch (error) {
      setConfirmingRemoval(false);
      setRemovalError(describeError(error));
    } finally {
      setRemoving(false);
    }
  };

  const assignTo = (assigneeId: string | null, message: string) =>
    assign.mutate(() => leadsApi.assign(lead.id, lead.version, assigneeId), {
      onSuccess: () => toast(message),
    });

  return (
    <>
      <PageHeader
        title={lead.name}
        description={`${formatPhone(lead.whatsapp)} · ${lead.source.name}`}
        status={
          <>
            {lead.stage === 'lost' ? (
              <Badge icon="x">{leadStageName(lead.stage)}</Badge>
            ) : (
              <Badge
                tone={lead.stage === 'converted' ? 'success' : 'neutral'}
                dot
              >
                {leadStageName(lead.stage)}
              </Badge>
            )}
            {lead.hasPendingInterest ? (
              <Badge tone="attention" dot>
                Novo interesse
              </Badge>
            ) : null}
          </>
        }
        actions={
          canUpdate || canStage ? (
            <>
              {canUpdate ? (
                <Button onClick={() => setEditing(true)}>
                  <Icon name="edit" />
                  Editar dados
                </Button>
              ) : null}
              {canStage ? (
                <Button
                  variant="primary"
                  onClick={() => setChangingStage(true)}
                >
                  <Icon name="swap" />
                  Alterar etapa
                </Button>
              ) : null}
            </>
          ) : undefined
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
      {stage.error ? (
        <div className="mb-3">
          <AreaError
            error={stage.error}
            title="Não foi possível alterar a etapa."
            onReload={reload}
          />
        </div>
      ) : null}

      {/* Novo interesse pendente: faixa de atenção, só enquanto existir. */}
      {pending.map((request) => (
        <div
          key={request.id}
          role="status"
          className="mb-4 flex flex-wrap items-center gap-3 rounded-card bg-attention-soft py-2.5 pr-3 pl-3.5"
        >
          <span
            className="size-2 flex-none rounded-full bg-signal"
            aria-hidden="true"
          />
          <div className="min-w-55 flex-1">
            <strong className="font-semibold text-attention-foreground">
              Novo interesse pendente
            </strong>
            <p className="t-body-small tnum text-foreground-soft">
              {formatLeadDate(request.createdAt)} · formulário do catálogo ·
              consentimento registrado
            </p>
          </div>
          {canUpdate ? (
            <Button
              compact
              loading={resolve.isPending}
              onClick={() =>
                resolve.mutate(
                  () => leadsApi.resolve(lead.id, lead.version, request.id),
                  {
                    onSuccess: () =>
                      toast('Novo interesse marcado como tratado.'),
                  },
                )
              }
            >
              <Icon name="check" />
              Marcar como tratada
            </Button>
          ) : null}
          {resolve.error ? (
            <div className="basis-full">
              <AreaError
                error={resolve.error}
                title="Não foi possível marcar como tratada."
                onReload={reload}
              />
            </div>
          ) : null}
        </div>
      ))}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CardStack>
          <LeadObservations
            lead={lead}
            canUpdate={canUpdate}
            currentUserId={me?.id}
            onReload={reload}
          />
          <LeadHistoryCard events={history.data} nameOf={nameOf} />
          {resolved.length > 0 ? (
            <details className="group rounded-card border border-border bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold group-open:border-b group-open:border-border [&::-webkit-details-marker]:hidden">
                {resolved.length}{' '}
                {resolved.length === 1
                  ? 'solicitação tratada'
                  : 'solicitações tratadas'}
                <span className="t-body-small font-medium text-muted-foreground">
                  <span className="group-open:hidden">Mostrar</span>
                  <span className="hidden group-open:inline">Ocultar</span>
                </span>
              </summary>
              <ul className="divide-y divide-border">
                {resolved.map((request) => (
                  <li key={request.id} className="px-4 py-3">
                    <strong className="font-semibold">
                      Solicitação tratada
                    </strong>
                    <p className="t-body-small tnum text-muted-foreground">
                      Recebida em {formatLeadDate(request.createdAt)} · tratada
                      {request.resolvedBy
                        ? ` por ${request.resolvedBy.fullName}`
                        : ''}
                      {request.resolvedAt
                        ? ` em ${formatLeadDate(request.resolvedAt)}`
                        : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </CardStack>

        <CardStack>
          <section className="rounded-card border border-border bg-surface">
            <CardHead title="Dados do lead" />
            <div className="px-4 py-1">
              <DefinitionList
                rows={[
                  {
                    label: 'WhatsApp',
                    value: (
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="tnum whitespace-nowrap">
                          {formatPhone(lead.whatsapp)}
                        </span>
                        {!locked ? (
                          <CopyButton
                            value={lead.whatsapp}
                            ariaLabel="Copiar WhatsApp"
                          />
                        ) : null}
                      </span>
                    ),
                  },
                  { label: 'E-mail', value: lead.email ?? 'Não informado' },
                  { label: 'Origem', value: lead.source.name },
                  ...(lead.sourceDetail
                    ? [{ label: 'Detalhe', value: lead.sourceDetail }]
                    : []),
                  ...(lead.referredBy
                    ? [{ label: 'Quem indicou', value: lead.referredBy }]
                    : []),
                  ...(lead.stage === 'lost'
                    ? [
                        {
                          label: 'Motivo da perda',
                          value: lead.lossReason ?? 'Não informado',
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </section>

          <section className="rounded-card border border-border bg-surface">
            <CardHead
              title="Responsável"
              aside={
                canAssign && !isMine && me ? (
                  <Button
                    compact
                    loading={assign.isPending}
                    onClick={() => assignTo(me.id, 'Lead atribuído a você.')}
                  >
                    Atribuir a mim
                  </Button>
                ) : undefined
              }
            />
            <div className="grid gap-2 p-4">
              {canAssign ? (
                <>
                  <label className="sr-only" htmlFor="lead-assignee">
                    Responsável
                  </label>
                  <select
                    id="lead-assignee"
                    className={`${controlClass} h-control-md pr-8`}
                    value={lead.assignee?.id ?? ''}
                    disabled={assign.isPending}
                    onChange={(event) =>
                      assignTo(
                        event.target.value || null,
                        'Responsável atualizado.',
                      )
                    }
                  >
                    <option value="">Sem responsável</option>
                    {assigneeOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <p>{lead.assignee?.fullName ?? 'Sem responsável'}</p>
              )}
              {!canAssign && isMine && !locked ? (
                <div>
                  <Button
                    compact
                    loading={assign.isPending}
                    onClick={() => assignTo(null, 'Lead devolvido.')}
                  >
                    Devolver lead
                  </Button>
                </div>
              ) : null}
              <p className="t-caption muted">
                A troca é registrada no histórico do lead.
              </p>
              <AreaError
                error={assign.error}
                title="Não foi possível alterar o responsável."
                onReload={reload}
              />
            </div>
          </section>

          {canDelete ? (
            <section className="rounded-card border border-border bg-surface">
              <CardHead
                title="Privacidade"
                description="Para revogações de consentimento validadas."
              />
              <div className="grid gap-3 p-4">
                <p className="t-body-small muted">
                  Leads com histórico são anonimizados; leads sem histórico
                  podem ser excluídos. A operação gera registro de auditoria.
                </p>
                {removalError ? (
                  <Alert
                    tone="danger"
                    title="Não foi possível concluir a operação."
                  >
                    {removalError}
                  </Alert>
                ) : null}
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
              </div>
            </section>
          ) : null}
        </CardStack>
      </div>

      {changingStage ? (
        <StageDialog
          name={lead.name}
          current={lead.stage}
          loading={stage.isPending}
          onClose={() => setChangingStage(false)}
          onConfirm={(target, lossReason) =>
            stage.mutate(
              () => leadsApi.stage(lead.id, lead.version, target, lossReason),
              {
                onSuccess: () =>
                  toast(
                    `${lead.name.split(' ')[0]} movido para “${leadStageName(target)}”.`,
                  ),
                onSettled: () => setChangingStage(false),
              },
            )
          }
        />
      ) : null}

      {editing ? (
        <LeadEditDrawer
          lead={lead}
          onClose={() => setEditing(false)}
          onReload={reload}
        />
      ) : null}

      {confirmingRemoval ? (
        <ConfirmDialog
          title={
            removal === 'anonymize'
              ? 'Anonimizar este lead?'
              : 'Excluir este lead?'
          }
          body={
            removal === 'anonymize'
              ? `${lead.name} possui histórico operacional. Nome, WhatsApp e e-mail serão substituídos de forma irreversível; o histórico e a auditoria são preservados.`
              : `${lead.name} não possui histórico operacional. O lead, suas solicitações de contato e seus consentimentos serão excluídos de forma irreversível; a operação fica registrada na auditoria.`
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
