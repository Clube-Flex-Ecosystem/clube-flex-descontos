const formatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** Data e hora curtas usadas no detalhe do lead (ex.: 03/10/2026, 14:22). */
export function formatLeadDate(value: string): string {
  return formatter.format(new Date(value));
}
