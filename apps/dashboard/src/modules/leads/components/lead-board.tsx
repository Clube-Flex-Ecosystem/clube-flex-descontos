import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { Link } from '@tanstack/react-router';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { formatPhone, type LeadStage, type LeadSummary } from '@flex/contracts';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { leadStages, type LeadStageDefinition } from '../lead-stages';

interface LeadBoardProps {
    leads: LeadSummary[];
    canMove: boolean;
    onMove: (lead: LeadSummary, stage: LeadStage) => void;
    /** Abre o dialog de etapa (botão do cartão). */
    onRequestStage: (lead: LeadSummary) => void;
}

export function LeadBoard({
    leads,
    canMove,
    onMove,
    onRequestStage,
}: LeadBoardProps) {
    const [activeLead, setActiveLead] = useState<LeadSummary | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        // Enter abre o detalhe (link do cartão); Espaço inicia e conclui o arraste.
        useSensor(KeyboardSensor, {
            keyboardCodes: {
                start: ['Space'],
                cancel: ['Escape'],
                end: ['Space', 'Enter'],
            },
        }),
    );
    // Dentro de cada coluna, novo interesse pendente aparece primeiro.
    const byStage = useMemo(() => {
        const groups: Record<LeadStage, LeadSummary[]> = {
            new: [],
            firstContact: [],
            negotiating: [],
            converted: [],
            lost: [],
        };
        for (const lead of leads) groups[lead.stage].push(lead);
        for (const stage of Object.keys(groups) as LeadStage[]) {
            groups[stage] = [
                ...groups[stage].filter((lead) => lead.hasPendingInterest),
                ...groups[stage].filter((lead) => !lead.hasPendingInterest),
            ];
        }
        return groups;
    }, [leads]);

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveLead(null);
        if (!over) return;
        const lead = leads.find((item) => item.id === active.id);
        const stage = leadStages.find((item) => item.id === over.id)?.id;
        if (lead && stage && lead.stage !== stage) onMove(lead, stage);
    };

    return (
        <DndContext
            sensors={canMove ? sensors : undefined}
            onDragStart={({ active }) =>
                setActiveLead(
                    leads.find((lead) => lead.id === active.id) ?? null,
                )
            }
            onDragCancel={() => setActiveLead(null)}
            onDragEnd={handleDragEnd}
        >
            <div className="overflow-x-auto pb-2">
                <div className="grid min-w-[1120px] grid-cols-5 items-start gap-3">
                    {leadStages.map((stage) => (
                        <LeadColumn
                            key={stage.id}
                            stage={stage}
                            leads={byStage[stage.id]}
                            canMove={canMove}
                            onRequestStage={onRequestStage}
                        />
                    ))}
                </div>
            </div>
            <DragOverlay dropAnimation={null}>
                {activeLead ? <LeadCard lead={activeLead} overlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function LeadColumn({
    stage,
    leads,
    canMove,
    onRequestStage,
}: {
    stage: LeadStageDefinition;
    leads: LeadSummary[];
    canMove: boolean;
    onRequestStage: (lead: LeadSummary) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id,
        disabled: !canMove,
    });

    return (
        <section
            ref={setNodeRef}
            aria-label={`${stage.name}, ${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`}
            className={`flex min-h-130 flex-col gap-1.5 rounded-card bg-surface-muted p-1.5 transition-shadow ${
                isOver ? `ring-2 ring-inset ${stage.dropClassName}` : ''
            }`}
        >
            <header className="flex items-center gap-2 px-1.5 pt-1.5 pb-1">
                <span className={`size-2 rounded-full ${stage.dotClassName}`} />
                <h2 className="t-heading">{stage.name}</h2>
                <span className="t-caption tnum ml-auto text-muted-foreground">
                    {leads.length}
                </span>
            </header>
            {leads.map((lead) => (
                <DraggableLeadCard
                    key={lead.id}
                    lead={lead}
                    canMove={canMove}
                    onRequestStage={onRequestStage}
                />
            ))}
            {!leads.length ? (
                <p className="t-caption m-0.5 px-2 py-4 text-center font-normal text-muted-foreground">
                    Nenhum lead nesta etapa
                </p>
            ) : null}
        </section>
    );
}

function DraggableLeadCard({
    lead,
    canMove,
    onRequestStage,
}: {
    lead: LeadSummary;
    canMove: boolean;
    onRequestStage: (lead: LeadSummary) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        isDragging,
    } = useDraggable({ id: lead.id, disabled: !canMove });
    const style: CSSProperties | undefined = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? 'opacity-45' : ''}
        >
            <LeadCard
                lead={lead}
                // O link do cartão é o único ponto focável e também a alça de arraste.
                activator={{
                    ref: setActivatorNodeRef,
                    listeners: canMove ? listeners : undefined,
                    describedBy: canMove
                        ? attributes['aria-describedby']
                        : undefined,
                }}
                {...(canMove
                    ? { onRequestStage: () => onRequestStage(lead) }
                    : {})}
            />
        </div>
    );
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('');
}

function LeadCard({
    lead,
    overlay = false,
    activator,
    onRequestStage,
}: {
    lead: LeadSummary;
    overlay?: boolean;
    activator?: {
        ref: (element: HTMLElement | null) => void;
        listeners: ReturnType<typeof useDraggable>['listeners'];
        describedBy: string | undefined;
    };
    onRequestStage?: () => void;
}) {
    const owner = lead.assignee;
    return (
        <article
            className={`group/card relative rounded-tile border border-border bg-surface px-3 py-2.5 hover:border-control-border has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus ${
                overlay
                    ? 'rotate-1 cursor-grabbing border-border-strong shadow-floating'
                    : ''
            }`}
        >
            <div className="flex items-start gap-2">
                <Link
                    ref={activator?.ref}
                    {...activator?.listeners}
                    aria-describedby={activator?.describedBy}
                    to="/leads/$leadId"
                    params={{ leadId: lead.id }}
                    className="t-body block min-w-0 flex-1 font-semibold text-foreground no-underline decoration-primary underline-offset-3 outline-hidden after:absolute after:inset-0 after:rounded-tile after:content-[''] hover:underline"
                >
                    {lead.name}
                </Link>
                {onRequestStage ? (
                    <Button
                        variant="quiet"
                        compact
                        className="relative z-1 -mt-1 -mr-1.5 min-h-8 w-8 px-0 md:min-h-8"
                        aria-label={`Alterar etapa de ${lead.name}`}
                        title="Alterar etapa"
                        onClick={onRequestStage}
                    >
                        <Icon name="swap" />
                    </Button>
                ) : null}
            </div>
            <p className="t-body-small tnum mt-0.5 text-muted-foreground">
                {formatPhone(lead.whatsapp)}
            </p>
            {lead.hasPendingInterest ? (
                <p className="t-caption mt-1.5 inline-flex items-center gap-1.5 font-semibold text-attention-foreground before:size-1.5 before:rounded-full before:bg-signal before:content-['']">
                    Novo interesse pendente
                </p>
            ) : null}
            <div className="t-caption mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2 font-normal text-muted-foreground">
                <span className="min-w-0 truncate">{lead.source.name}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                    <span
                        className={`grid size-5 place-items-center rounded-full text-[0.5625rem] font-semibold ${
                            owner
                                ? 'bg-identity text-identity-foreground'
                                : 'border border-border-strong text-muted-foreground'
                        }`}
                    >
                        {owner ? initials(owner.fullName) : '–'}
                    </span>
                    {owner?.fullName.split(' ')[0] ?? 'Sem responsável'}
                </span>
            </div>
        </article>
    );
}
