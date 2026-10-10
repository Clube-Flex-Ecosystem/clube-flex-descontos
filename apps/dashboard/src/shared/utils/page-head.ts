const SUFFIX = 'Clube Flex';

/** Metadata de uma rota: título do documento com o sufixo da aplicação em um só lugar. */
export function pageHead(title: string) {
  return { meta: [{ title: `${title} — ${SUFFIX}` }] };
}

export const defaultHead = { meta: [{ title: SUFFIX }] };
