import { useState } from 'react';
import type { Lead } from '@flex/contracts';
import { describeError } from '../../../shared/http/problem';
import { isVersionConflict } from '../../../shared/http/versioning';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { controlClass } from '../../../shared/ui/form-controls';
import { Icon } from '../../../shared/ui/icon';
import { initialsOf } from '../../../shared/utils/initials';
import { leadsApi } from '../api/leads.api';
import { formatLeadDate } from '../lead-dates';
import { useLeadCommand } from '../mutations/lead-command.mutation';

/**
 * Observações: o registro fica no topo; a lista mostra a mais recente primeiro e o
 * autor pode corrigir a própria (a versão anterior permanece no histórico).
 */
export function LeadObservations({
  lead,
  canUpdate,
  currentUserId,
  onReload,
}: {
  lead: Lead;
  canUpdate: boolean;
  currentUserId: string | undefined;
  onReload: () => void;
}) {
  const observe = useLeadCommand();
  const correct = useLeadCommand();
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(
    null,
  );
  const observations = [...lead.observations].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const failure = observe.error ?? correct.error;

  const add = () => {
    const text = note.trim();
    if (!text) return;
    observe.mutate(() => leadsApi.observe(lead.id, lead.version, text), {
      onSuccess: () => setNote(''),
    });
  };

  const saveCorrection = () => {
    if (!editing?.text.trim()) return;
    const { id, text } = editing;
    correct.mutate(
      () => leadsApi.correctObservation(lead.id, lead.version, id, text.trim()),
      { onSuccess: () => setEditing(null) },
    );
  };

  return (
    <section className="rounded-card border border-border bg-surface">
      <header className="px-4 py-3">
        <h2 className="t-section">Observações</h2>
        <p className="t-caption mt-px font-normal text-muted-foreground">
          Mais recentes primeiro. Somente o autor pode corrigir a própria
          observação.
        </p>
      </header>
      {canUpdate ? (
        <form
          className="grid gap-2 border-y border-border px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <label className="sr-only" htmlFor="lead-note">
            Nova observação
          </label>
          <textarea
            id="lead-note"
            className={`${controlClass} min-h-16 resize-y py-2`}
            placeholder="Registrar uma observação sobre o atendimento…"
            value={note}
            disabled={observe.isPending}
            onChange={(event) => setNote(event.target.value)}
          />
          {failure ? (
            <Alert
              tone={isVersionConflict(failure) ? 'warning' : 'danger'}
              title={
                isVersionConflict(failure)
                  ? 'Outra pessoa alterou este lead.'
                  : 'Não foi possível salvar a observação.'
              }
              action={
                isVersionConflict(failure) ? (
                  <Button
                    compact
                    onClick={() => {
                      observe.reset();
                      correct.reset();
                      onReload();
                    }}
                  >
                    <Icon name="refresh" />
                    Carregar versão atual
                  </Button>
                ) : undefined
              }
            >
              {isVersionConflict(failure)
                ? 'O texto continua no campo. Carregue a versão atual e envie de novo.'
                : describeError(failure)}
            </Alert>
          ) : null}
          <div className="flex justify-end">
            <Button compact type="submit" loading={observe.isPending}>
              Adicionar observação
            </Button>
          </div>
        </form>
      ) : null}
      {observations.length === 0 ? (
        <p className="t-body-small border-t border-border px-4 py-6 text-center text-muted-foreground">
          Nenhuma observação registrada.
        </p>
      ) : (
        <ul
          className={`divide-y divide-border ${canUpdate ? '' : 'border-t border-border'}`}
        >
          {observations.map((observation) => {
            const mine = observation.author.id === currentUserId;
            const isEditing = editing?.id === observation.id;
            return (
              <li key={observation.id} className="px-4 py-3">
                <div className="t-caption mb-1 flex items-center gap-2 font-normal text-muted-foreground">
                  <span
                    className="grid size-5 place-items-center rounded-full bg-identity text-[0.5625rem] font-semibold text-identity-foreground"
                    aria-hidden="true"
                  >
                    {initialsOf(observation.author.fullName)}
                  </span>
                  <strong className="font-semibold text-foreground">
                    {observation.author.fullName}
                  </strong>
                  <span className="tnum">
                    {formatLeadDate(observation.createdAt)}
                    {observation.updatedAt !== observation.createdAt
                      ? ' · corrigida'
                      : ''}
                  </span>
                  {mine && canUpdate && !isEditing ? (
                    <Button
                      variant="quiet"
                      compact
                      className="ml-auto"
                      onClick={() =>
                        setEditing({
                          id: observation.id,
                          text: observation.text,
                        })
                      }
                    >
                      Corrigir
                    </Button>
                  ) : null}
                </div>
                {isEditing ? (
                  <div className="mt-1.5 grid gap-2">
                    <label
                      className="sr-only"
                      htmlFor={`edit-${observation.id}`}
                    >
                      Corrigir observação
                    </label>
                    <textarea
                      id={`edit-${observation.id}`}
                      autoFocus
                      className={`${controlClass} min-h-14 resize-y py-2`}
                      value={editing.text}
                      onChange={(event) =>
                        setEditing({ ...editing, text: event.target.value })
                      }
                    />
                    <p className="t-caption muted">
                      O texto anterior permanece no histórico.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button compact onClick={() => setEditing(null)}>
                        Cancelar
                      </Button>
                      <Button
                        compact
                        variant="primary"
                        loading={correct.isPending}
                        onClick={saveCorrection}
                      >
                        Salvar correção
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{observation.text}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
