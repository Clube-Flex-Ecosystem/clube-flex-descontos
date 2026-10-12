import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { LeadStage, LeadSummary } from '@flex/contracts';
import { useCan, useSession } from '../../auth';
import { useToast } from '../../../shared/feedback/toast';
import { describeError } from '../../../shared/http/problem';
import { useListContext } from '../../../shared/utils/list-context';
import {
    defaultLeadFilters,
    filterLeads,
    ownersOf,
    type LeadFilters,
} from '../lead-filters';
import { leadStageName } from '../lead-stages';
import { useMoveLead } from '../mutations/move-lead.mutation';
import { leadsQueryOptions, sourcesQueryOptions } from '../queries/leads.query';
import { LeadsData } from './leads-data';
import { StageDialog } from './stage-dialog';

/** Carrega e coordena os dados, filtros e transições do quadro de leads. */
export function LeadsList() {
    const { data: leads } = useSuspenseQuery(leadsQueryOptions);
    const { data: sources } = useQuery(sourcesQueryOptions);
    const session = useSession();
    const userId = session?.user.id;
    const canMove = useCan('leads.change-stage');
    const canViewAll = useCan('leads.view-all');
    const moveLead = useMoveLead();
    const toast = useToast();
    const [filters, setFilters] = useListContext<LeadFilters>(
        'leads',
        defaultLeadFilters,
    );
    const [error, setError] = useState<string | null>(null);
    const [stageRequest, setStageRequest] = useState<{
        lead: LeadSummary;
        preset?: LeadStage;
    } | null>(null);

    const filtered = filterLeads(leads, filters, userId);
    const pendingInterestCount = leads.filter(
        (lead) => lead.hasPendingInterest,
    ).length;

    const move = (lead: LeadSummary, stage: LeadStage, lossReason?: string) => {
        setError(null);
        moveLead.mutate(
            { lead, stage, lossReason },
            {
                onSuccess: () => {
                    setStageRequest(null);
                    toast(
                        `${lead.name.split(' ')[0]} movido para “${leadStageName(stage)}”.`,
                    );
                },
                onError: (cause) => {
                    setStageRequest(null);
                    setError(describeError(cause));
                },
            },
        );
    };

    // Soltar em "Convertido" ou "Perdido" abre o dialog de etapa já preenchido.
    const dropOn = (lead: LeadSummary, stage: LeadStage) => {
        if (stage === 'converted' || stage === 'lost') {
            setStageRequest({ lead, preset: stage });
            return;
        }
        move(lead, stage);
    };

    return (
        <>
            <LeadsData
                leads={filtered}
                sources={sources}
                filters={filters}
                onFiltersChange={(next) =>
                    setFilters((current) => ({ ...current, ...next }))
                }
                onClearFilters={() => setFilters(defaultLeadFilters)}
                // Quem só vê os próprios leads não precisa filtrar por responsável.
                owners={canViewAll ? ownersOf(leads, userId) : null}
                pendingInterestCount={pendingInterestCount}
                canMove={canMove && !moveLead.isPending}
                error={error}
                onDismissError={() => setError(null)}
                onMove={dropOn}
                onRequestStage={(lead) => setStageRequest({ lead })}
            />

            {stageRequest ? (
                <StageDialog
                    name={stageRequest.lead.name}
                    current={stageRequest.lead.stage}
                    preset={stageRequest.preset}
                    loading={moveLead.isPending}
                    onClose={() => setStageRequest(null)}
                    onConfirm={(stage, lossReason) =>
                        move(stageRequest.lead, stage, lossReason)
                    }
                />
            ) : null}
        </>
    );
}
