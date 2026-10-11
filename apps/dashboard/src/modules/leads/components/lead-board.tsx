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
import type { LeadStage, LeadSummary } from '@flex/contracts';
import { leadStages, type LeadStageDefinition } from '../lead-stages';

interface LeadBoardProps {
  leads: LeadSummary[];
  canMove: boolean;
  onMove: (lead: LeadSummary, stage: LeadStage) => void;
}

export function LeadBoard({ leads, canMove, onMove }: LeadBoardProps) {
  const [activeLead, setActiveLead] = useState<LeadSummary | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const byStage = useMemo(
    () =>
      leads.reduce<Record<LeadStage, LeadSummary[]>>(
        (groups, lead) => {
          groups[lead.stage].push(lead);
          return groups;
        },
        { new: [], firstContact: [], negotiating: [], converted: [], lost: [] },
      ),
    [leads],
  );

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
        setActiveLead(leads.find((lead) => lead.id === active.id) ?? null)
      }
      onDragCancel={() => setActiveLead(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1120px] grid-cols-5 gap-3">
          {leadStages.map((stage) => (
            <LeadColumn
              key={stage.id}
              stage={stage}
              leads={byStage[stage.id]}
              canMove={canMove}
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
}: {
  stage: LeadStageDefinition;
  leads: LeadSummary[];
  canMove: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    disabled: !canMove,
  });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${stage.name}, ${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`}
      className={`flex min-h-130 flex-col gap-1.5 rounded-xl bg-secondary p-1.5 transition-shadow ${
        isOver ? `ring-2 ${stage.dropClassName}` : ''
      }`}
    >
      <header className="flex items-center gap-2 px-2 py-1.5">
        <span className={`size-2 rounded-full ${stage.dotClassName}`} />
        <h2 className="t-card">{stage.name}</h2>
        <span className="t-caption ml-auto grid min-w-5 place-items-center rounded-sm border border-border bg-surface px-1.5 py-0.5 text-muted-foreground">
          {leads.length}
        </span>
      </header>
      {leads.map((lead) => (
        <DraggableLeadCard key={lead.id} lead={lead} disabled={!canMove} />
      ))}
      {!leads.length ? (
        <p className="t-small m-0.5 rounded-lg border border-dashed border-border-strong px-2 py-4 text-center text-muted-foreground">
          Nenhum lead nesta etapa
        </p>
      ) : null}
    </section>
  );
}

function DraggableLeadCard({
  lead,
  disabled,
}: {
  lead: LeadSummary;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      disabled,
    });
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
        dragAttributes={attributes}
        dragListeners={listeners}
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
  dragAttributes,
  dragListeners,
}: {
  lead: LeadSummary;
  overlay?: boolean;
  dragAttributes?: ReturnType<typeof useDraggable>['attributes'];
  dragListeners?: ReturnType<typeof useDraggable>['listeners'];
}) {
  const owner = lead.assignee;
  return (
    <article
      {...dragAttributes}
      {...dragListeners}
      className={`relative rounded-lg border border-border bg-surface px-3 py-2.5 shadow-sm transition-shadow hover:border-border-strong hover:shadow-md ${
        lead.hasPendingInterest ? 'border-l-[3px] border-l-accent' : ''
      } ${overlay ? 'rotate-1 cursor-grabbing shadow-lg' : 'cursor-grab'}`}
    >
      <Link
        to="/leads/$leadId"
        params={{ leadId: lead.id }}
        className="t-card block min-w-0 pr-4 text-foreground no-underline hover:text-accent-foreground hover:underline"
      >
        {lead.name}
      </Link>
      <p className="t-small tnum mt-0.5 text-muted-foreground">
        {lead.whatsapp}
      </p>
      {lead.hasPendingInterest ? (
        <p className="t-caption mt-2 inline-flex items-center gap-1.5 font-semibold text-accent-foreground before:size-1.5 before:rounded-full before:bg-current before:content-['']">
          Novo interesse pendente
        </p>
      ) : null}
      <div className="t-caption mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2 text-muted-foreground">
        <span className="min-w-0 truncate">{lead.source.name}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span
            className={`grid size-5 place-items-center rounded-full text-[9px] font-semibold ${
              owner
                ? 'bg-accent-soft text-accent-foreground'
                : 'border border-border text-muted-foreground'
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
