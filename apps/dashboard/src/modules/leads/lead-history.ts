import type { LeadHistoryEvent, LeadStage } from '@flex/contracts';
import { leadStageName } from './lead-stages';

/** Ator e texto legível de um evento do histórico do lead. */
export interface HistoryLine {
  actor?: string;
  text: string;
}

const stageOf = (value: unknown) =>
  typeof value === 'string' ? leadStageName(value as LeadStage) : undefined;

/**
 * Traduz os tipos de evento emitidos pela API em frases. `nameOf` resolve ids de
 * contas já conhecidas pelo cliente; sem o nome, a frase continua correta e genérica.
 */
export function describeHistoryEvent(
  event: LeadHistoryEvent,
  nameOf: (id: unknown) => string | undefined,
): HistoryLine {
  const actor = event.actor?.fullName;
  const data = event.data ?? {};
  const withActor = (text: string): HistoryLine =>
    actor
      ? { actor, text }
      : { text: text.charAt(0).toUpperCase() + text.slice(1) };

  switch (event.type) {
    case 'lead.created':
      return actor
        ? { actor, text: 'criou o lead' }
        : { text: 'Lead criado pelo formulário do catálogo' };
    case 'contact-request.received':
      return { text: 'Nova solicitação pelo formulário do catálogo' };
    case 'contact-request.resolved':
      return withActor('tratou a solicitação de contato');
    case 'lead.stage-changed': {
      const from = stageOf(data.from);
      const to = stageOf(data.to);
      return withActor(
        from && to ? `moveu de “${from}” para “${to}”` : 'alterou a etapa',
      );
    }
    case 'lead.assignee-changed': {
      if (data.to === null || data.to === undefined)
        return withActor('removeu o responsável');
      const to = nameOf(data.to);
      return withActor(to ? `atribuiu a ${to}` : 'alterou o responsável');
    }
    case 'lead.source-changed':
      return withActor('alterou a origem');
    case 'lead.contact-updated':
      return withActor('alterou os dados de contato');
    case 'lead.observation-created':
      return withActor('registrou uma observação');
    case 'lead.observation-corrected':
      return withActor('corrigiu uma observação');
    case 'lead.anonymized':
      return withActor('anonimizou o lead');
    default:
      return withActor('registrou uma alteração');
  }
}
