import type { LeadSource, LeadStage, LeadSummary } from '@flex/contracts';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { Alert } from '../../../shared/ui/alert';
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
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <select
            aria-label="Responsável"
            className="h-control-md rounded-md border border-control-border bg-control px-3"
            value={owner}
            onChange={(event) => onOwnerChange(event.target.value)}
          >
            <option value="">Todos os responsáveis</option>
            <option value="me">Meus leads</option>
            <option value="none">Sem responsável</option>
          </select>
          <select
            aria-label="Origem"
            className="h-control-md rounded-md border border-control-border bg-control px-3"
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
            variant={interest ? 'primary' : 'quiet'}
            aria-pressed={interest}
            onClick={onInterestChange}
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
