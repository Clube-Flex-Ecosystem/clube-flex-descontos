import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { LeadStage, LeadSummary } from '@flex/contracts';
import { useCan, useSession } from '../../auth';
import { Alert } from '../../../shared/ui/alert';
import { ConfirmDialog } from '../../../shared/ui/dialogs';
import { describeError } from '../../../shared/http/problem';
import { leadStageName } from '../lead-stages';
import { useMoveLead } from '../mutations/move-lead.mutation';
import { leadsQueryOptions, sourcesQueryOptions } from '../queries/leads.query';
import { LeadsData } from './leads-data';

/** Carrega e coordena os dados, filtros e transições do quadro de leads. */
export function LeadsList() {
  const { data: leads } = useSuspenseQuery(leadsQueryOptions);
  const { data: sources } = useQuery(sourcesQueryOptions);
  const session = useSession();
  const canMove = useCan('leads.change-stage');
  const moveLead = useMoveLead();
  const [search, setSearch] = useState('');
  const [owner, setOwner] = useState('');
  const [source, setSource] = useState('');
  const [interest, setInterest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    lead: LeadSummary;
    stage: LeadStage;
  } | null>(null);
  const [lossReason, setLossReason] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = search.replace(/\D/g, '');
    return leads.filter((lead) => {
      const matchesSearch =
        !search ||
        lead.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
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
    });
  }, [interest, leads, owner, search, session?.user.id, source]);

  const pendingInterestCount = useMemo(
    () => leads.filter((lead) => lead.hasPendingInterest).length,
    [leads],
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

  return (
    <>
      <LeadsData
        leads={filtered}
        sources={sources}
        search={search}
        onSearchChange={setSearch}
        owner={owner}
        onOwnerChange={setOwner}
        source={source}
        onSourceChange={setSource}
        interest={interest}
        onInterestChange={() => setInterest((current) => !current)}
        pendingInterestCount={pendingInterestCount}
        canMove={canMove && !moveLead.isPending}
        error={error}
        onMove={requestMove}
      />

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
    </>
  );
}
