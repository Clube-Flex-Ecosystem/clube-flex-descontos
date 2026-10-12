import { useState } from 'react';
import type { LeadHistoryEvent } from '@flex/contracts';
import { Button } from '../../../shared/ui/button';
import { formatLeadDate } from '../lead-dates';
import { describeHistoryEvent } from '../lead-history';

const RECENT = 5;

/** Histórico legível: os eventos mais recentes e, sob demanda, todos. */
export function LeadHistoryCard({
  events,
  nameOf,
}: {
  events: LeadHistoryEvent[] | undefined;
  nameOf: (id: unknown) => string | undefined;
}) {
  const [all, setAll] = useState(false);
  const ordered = [...(events ?? [])].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );
  const shown = all ? ordered : ordered.slice(0, RECENT);

  return (
    <section className="rounded-card border border-border bg-surface">
      <header className="border-b border-border px-4 py-3">
        <h2 className="t-section">Histórico</h2>
        <p className="t-caption mt-px font-normal text-muted-foreground">
          Registro imutável das alterações relevantes.
        </p>
      </header>
      {events === undefined ? (
        <p
          className="t-body-small px-4 py-6 text-muted-foreground"
          role="status"
        >
          Carregando histórico…
        </p>
      ) : (
        <ol className="px-4 pt-1.5 pb-3.5">
          {shown.map((event) => {
            const line = describeHistoryEvent(event, nameOf);
            return (
              <li
                key={event.id}
                className="t-body-small relative py-2 pl-5.5 before:absolute before:top-3.25 before:left-1 before:size-1.75 before:rounded-full before:bg-surface before:ring-2 before:ring-border-strong after:absolute after:top-6 after:-bottom-2 after:left-1.75 after:w-px after:bg-border last:after:hidden"
              >
                <p>
                  {line.actor ? (
                    <strong className="font-semibold">{line.actor} </strong>
                  ) : null}
                  {line.text}
                </p>
                <time className="t-caption tnum block font-normal text-muted-foreground">
                  {formatLeadDate(event.occurredAt)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
      {ordered.length > RECENT ? (
        <div className="t-caption tnum flex items-center justify-between gap-3 border-t border-border px-4 py-2 font-normal text-muted-foreground">
          <span>
            {shown.length} de {ordered.length} eventos
          </span>
          <Button variant="quiet" compact onClick={() => setAll(!all)}>
            {all ? 'Mostrar menos' : 'Ver histórico completo'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
