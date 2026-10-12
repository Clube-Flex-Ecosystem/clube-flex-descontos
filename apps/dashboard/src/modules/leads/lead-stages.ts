import type { LeadStage } from '@flex/contracts';

export interface LeadStageDefinition {
  id: LeadStage;
  name: string;
  dotClassName: string;
  dropClassName: string;
}

/**
 * Etapas fixas do pipeline e seus sinais visuais do protótipo: etapas abertas não
 * têm cor própria; os desfechos seguem as famílias de estado.
 */
export const leadStages: readonly LeadStageDefinition[] = [
  {
    id: 'new',
    name: 'Novo',
    dotClassName: 'bg-control-border',
    dropClassName: 'ring-selected',
  },
  {
    id: 'firstContact',
    name: 'Primeiro contato',
    dotClassName: 'bg-control-border',
    dropClassName: 'ring-selected',
  },
  {
    id: 'negotiating',
    name: 'Em negociação',
    dotClassName: 'bg-control-border',
    dropClassName: 'ring-selected',
  },
  {
    id: 'converted',
    name: 'Convertido',
    dotClassName: 'bg-success',
    dropClassName: 'ring-selected',
  },
  {
    id: 'lost',
    name: 'Perdido',
    dotClassName: 'bg-muted-foreground',
    dropClassName: 'ring-selected',
  },
];

export function leadStageName(stage: LeadStage): string {
  return leadStages.find((item) => item.id === stage)?.name ?? stage;
}
