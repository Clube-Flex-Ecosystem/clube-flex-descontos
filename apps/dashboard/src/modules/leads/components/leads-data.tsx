import type { LeadSource, LeadStage, LeadSummary } from '@flex/contracts';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { Alert } from '../../../shared/ui/alert';
import { controlClass } from '../../../shared/ui/form-controls';
import { LeadBoard } from './lead-board';

interface LeadsDataProps {
  leads: LeadSummary[];
  sources: LeadSource[] | undefined;
  search: string;
  onSearchChange: (search: string) => void;
  owner: string;
  onOwnerChange: (owner: string) => void;
  source: string;
  onSourceChange: (source: string) => void;
  interest: boolean;
  onInterestChange: () => void;
  pendingInterestCount: number;
  canMove: boolean;
  error: string | null;
  onMove: (lead: LeadSummary, stage: LeadStage) => void;
}

/** Controles de filtro e quadro; recebe os dados e as ações por props. */
export function LeadsData({
  leads,
  sources,
  search,
  onSearchChange,
  owner,
  onOwnerChange,
  source,
  onSourceChange,
  interest,
  onInterestChange,
  pendingInterestCount,
  canMove,
  error,
  onMove,
}: LeadsDataProps) {
  return (
    <>
      <section className="mb-3 rounded-card border border-border bg-surface py-2 pr-3 pl-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Filtrar leads</span>
            <Icon
              name="search"
              className="absolute top-2 left-2.5 text-muted-foreground"
            />
            <input
              className={`${controlClass} h-control-sm pl-8`}
              placeholder="Nome ou WhatsApp"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <select
            aria-label="Responsável"
            className={`${controlClass} h-control-sm w-auto`}
            value={owner}
            onChange={(event) => onOwnerChange(event.target.value)}
          >
            <option value="">Todos os responsáveis</option>
            <option value="me">Meus leads</option>
            <option value="none">Sem responsável</option>
          </select>
          <select
            aria-label="Origem"
            className={`${controlClass} h-control-sm w-auto`}
            value={source}
            onChange={(event) => onSourceChange(event.target.value)}
          >
            <option value="">Todas as origens</option>
            {sources?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Button
            compact
            aria-pressed={interest}
            onClick={onInterestChange}
            className="aria-pressed:border-selected aria-pressed:bg-selected aria-pressed:text-selected-foreground"
          >
            <span
              className="size-1.5 rounded-full bg-signal"
              aria-hidden="true"
            />
            Novo interesse
            <span className="tnum">{pendingInterestCount}</span>
          </Button>
          <span
            className="t-body-small ml-auto text-muted-foreground"
            aria-live="polite"
          >
            {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
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

      <LeadBoard leads={leads} canMove={canMove} onMove={onMove} />
    </>
  );
}
