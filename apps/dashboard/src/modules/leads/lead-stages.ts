import type { LeadStage } from '@flex/contracts';

export interface LeadStageDefinition {
  id: LeadStage;
  name: string;
  dotClassName: string;
  dropClassName: string;
}

/** Etapas fixas do pipeline e seus sinais visuais do protótipo. */
export const leadStages: readonly LeadStageDefinition[] = [
  {
    id: 'new',
    name: 'Novo',
    dotClassName: 'bg-border-strong',
    dropClassName: 'ring-border-strong',
  },
  {
    id: 'firstContact',
    name: 'Primeiro contato',
    dotClassName: 'bg-info',
    dropClassName: 'ring-info',
  },
  {
    id: 'negotiating',
    name: 'Em negociação',
    dotClassName: 'bg-accent',
    dropClassName: 'ring-accent',
  },
  {
    id: 'converted',
    name: 'Convertido',
    dotClassName: 'bg-success',
    dropClassName: 'ring-success',
  },
  {
    id: 'lost',
    name: 'Perdido',
    dotClassName: 'bg-danger',
    dropClassName: 'ring-danger',
  },
];

export function leadStageName(stage: LeadStage): string {
  return leadStages.find((item) => item.id === stage)?.name ?? stage;
}
