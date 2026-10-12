import type { LeadSummary } from '@flex/contracts';

/** Filtros do quadro de leads, preservados em memória durante a sessão. */
export interface LeadFilters {
  search: string;
  /** `''` todos, `me`, `none` ou o id de uma pessoa. */
  owner: string;
  source: string;
  interest: boolean;
}

export const defaultLeadFilters: LeadFilters = {
  search: '',
  owner: '',
  source: '',
  interest: false,
};

/** Busca por nome, e-mail ou dígitos do WhatsApp; os demais filtros são exatos. */
export function filterLeads(
  leads: readonly LeadSummary[],
  filters: LeadFilters,
  currentUserId: string | undefined,
): LeadSummary[] {
  const text = filters.search.trim().toLocaleLowerCase('pt-BR');
  const digits = filters.search.replace(/\D/g, '');
  return leads.filter((lead) => {
    const matchesSearch =
      !text ||
      lead.name.toLocaleLowerCase('pt-BR').includes(text) ||
      (lead.email ?? '').toLocaleLowerCase('pt-BR').includes(text) ||
      (Boolean(digits) && lead.whatsapp.replace(/\D/g, '').includes(digits));
    const matchesOwner =
      !filters.owner ||
      (filters.owner === 'none'
        ? !lead.assignee
        : filters.owner === 'me'
          ? lead.assignee?.id === currentUserId
          : lead.assignee?.id === filters.owner);
    return (
      matchesSearch &&
      matchesOwner &&
      (!filters.source || lead.source.id === filters.source) &&
      (!filters.interest || lead.hasPendingInterest)
    );
  });
}

/** Pessoas responsáveis presentes nos leads carregados, exceto o próprio usuário. */
export function ownersOf(
  leads: readonly LeadSummary[],
  currentUserId: string | undefined,
): { id: string; fullName: string }[] {
  const owners = new Map<string, string>();
  for (const lead of leads) {
    if (lead.assignee && lead.assignee.id !== currentUserId)
      owners.set(lead.assignee.id, lead.assignee.fullName);
  }
  return [...owners]
    .map(([id, fullName]) => ({ id, fullName }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
}
