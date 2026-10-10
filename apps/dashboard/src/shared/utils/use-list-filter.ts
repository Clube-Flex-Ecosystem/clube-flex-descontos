import { useMemo, useState } from 'react';
import { normalizeNameKey } from '@flex/contracts';

interface ListFilterOptions<T, V extends string> {
  /** Estado do item usado pelas abas; `''` é a aba que mostra todos. */
  stateOf: (item: T) => V;
  /** Texto pesquisável do item. */
  textOf: (item: T) => string;
}

/**
 * Filtros locais de uma listagem completa: aba de estado e busca (sem acentos nem caixa).
 * A ordem inicial é alfabética pelo texto principal do item.
 */
export function useListFilter<T, V extends string>(
  items: readonly T[],
  { stateOf, textOf }: ListFilterOptions<T, V>,
) {
  const [state, setState] = useState<V | ''>('');
  const [search, setSearch] = useState('');

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        textOf(a).localeCompare(textOf(b), 'pt-BR', { sensitivity: 'base' }),
      ),
    [items, textOf],
  );

  const countOf = (value: V | '') =>
    sorted.filter((item) => !value || stateOf(item) === value).length;

  const query = normalizeNameKey(search);
  const filtered = sorted.filter(
    (item) =>
      (!state || stateOf(item) === state) &&
      (!query || normalizeNameKey(textOf(item)).includes(query)),
  );

  return {
    state,
    setState,
    search,
    setSearch,
    filtered,
    countOf,
    total: sorted.length,
  };
}
