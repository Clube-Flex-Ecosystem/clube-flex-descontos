import type { LeadSource, LeadStage, LeadSummary } from '@flex/contracts';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { cn } from '../../../shared/ui/cn';
import { controlClass } from '../../../shared/ui/form-controls';
import { Icon } from '../../../shared/ui/icon';
import { EmptyState } from '../../../shared/ui/page-parts';
import type { LeadFilters } from '../lead-filters';
import { LeadBoard } from './lead-board';

interface LeadsDataProps {
    leads: LeadSummary[];
    sources: LeadSource[] | undefined;
    filters: LeadFilters;
    onFiltersChange: (next: Partial<LeadFilters>) => void;
    onClearFilters: () => void;
    /** Pessoas presentes nos leads carregados; ausente quando o filtro não se aplica. */
    owners: { id: string; fullName: string }[] | null;
    pendingInterestCount: number;
    canMove: boolean;
    error: string | null;
    onDismissError: () => void;
    onMove: (lead: LeadSummary, stage: LeadStage) => void;
    onRequestStage: (lead: LeadSummary) => void;
}

/** Controles de filtro e quadro; recebe os dados e as ações por props. */
export function LeadsData({
    leads,
    sources,
    filters,
    onFiltersChange,
    onClearFilters,
    owners,
    pendingInterestCount,
    canMove,
    error,
    onDismissError,
    onMove,
    onRequestStage,
}: LeadsDataProps) {
    const filtered = Boolean(
        filters.search || filters.owner || filters.source || filters.interest,
    );

    return (
        <>
            <section className="mb-3 rounded-card border border-border bg-surface py-2 pr-3 pl-4">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="relative min-w-56 flex-1 md:max-w-60">
                        <span className="sr-only">
                            Filtrar leads por nome, WhatsApp ou e-mail
                        </span>
                        <Icon
                            name="search"
                            className="absolute top-2 left-2.5 text-muted-foreground"
                        />
                        <input
                            type="search"
                            className={`${controlClass} h-control-sm pl-8`}
                            placeholder="Nome, WhatsApp ou e-mail"
                            value={filters.search}
                            onChange={(event) =>
                                onFiltersChange({ search: event.target.value })
                            }
                        />
                    </label>
                    {owners ? (
                        <select
                            aria-label="Responsável"
                            className={cn(
                                controlClass,
                                'h-control-sm w-auto pr-8',
                            )}
                            value={filters.owner}
                            onChange={(event) =>
                                onFiltersChange({ owner: event.target.value })
                            }
                        >
                            <option value="">Todos os responsáveis</option>
                            <option value="me">Meus leads</option>
                            <option value="none">Sem responsável</option>
                            {owners.length > 0 ? (
                                <optgroup label="Pessoas">
                                    {owners.map((owner) => (
                                        <option key={owner.id} value={owner.id}>
                                            {owner.fullName}
                                        </option>
                                    ))}
                                </optgroup>
                            ) : null}
                        </select>
                    ) : null}
                    <select
                        aria-label="Origem"
                        className={cn(controlClass, 'h-control-sm w-auto pr-8')}
                        value={filters.source}
                        onChange={(event) =>
                            onFiltersChange({ source: event.target.value })
                        }
                    >
                        <option value="">Todas as origens</option>
                        {sources?.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Button
                            compact
                            aria-pressed={filters.interest}
                            onClick={() =>
                                onFiltersChange({ interest: !filters.interest })
                            }
                            className="aria-pressed:border-selected aria-pressed:bg-selected aria-pressed:text-selected-foreground"
                        >
                            <span
                                className="size-1.5 rounded-full bg-signal"
                                aria-hidden="true"
                            />
                            Novo interesse
                            <span className="tnum">{pendingInterestCount}</span>
                        </Button>
                        {filtered ? (
                            <Button
                                variant="quiet"
                                compact
                                onClick={onClearFilters}
                            >
                                Limpar filtros
                            </Button>
                        ) : null}
                        <span
                            className="h-5 w-px bg-border"
                            aria-hidden="true"
                        />
                        <span
                            className="t-body-small tnum text-muted-foreground"
                            aria-live="polite"
                        >
                            {leads.length}{' '}
                            {leads.length === 1 ? 'lead' : 'leads'}
                        </span>
                    </div>
                </div>
            </section>

            {error ? (
                <div className="mb-3">
                    <Alert
                        tone="danger"
                        title="Não foi possível mover o lead."
                        action={
                            <Button compact onClick={onDismissError}>
                                Entendi
                            </Button>
                        }
                    >
                        O card voltou para a etapa confirmada. {error}
                    </Alert>
                </div>
            ) : null}

            {filtered && leads.length === 0 ? (
                <EmptyState
                    icon="search"
                    title="Nenhum lead com estes filtros"
                    action={
                        <Button compact onClick={onClearFilters}>
                            Limpar filtros
                        </Button>
                    }
                >
                    Ajuste a busca ou remova filtros.
                </EmptyState>
            ) : (
                <LeadBoard
                    leads={leads}
                    canMove={canMove}
                    onMove={onMove}
                    onRequestStage={onRequestStage}
                />
            )}
        </>
    );
}
