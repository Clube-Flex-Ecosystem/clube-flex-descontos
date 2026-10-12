import { useState, type SetStateAction } from 'react';

/**
 * Contexto das listagens (filtros, busca, aba, página) guardado em memória durante a
 * sessão do navegador: voltar de um detalhe reencontra a lista como foi deixada.
 * Não usa URL nem armazenamento persistente; recarregar a página ou encerrar a sessão
 * volta aos valores padrão.
 */
const contexts = new Map<string, unknown>();

export function useListContext<T>(
    key: string,
    initial: T,
): [T, (next: SetStateAction<T>) => void] {
    const [value, setValue] = useState<T>(() =>
        contexts.has(key) ? (contexts.get(key) as T) : initial,
    );

    // Grava de imediato no armazenamento, que é a referência do valor atual: o
    // componente pode desmontar logo depois (ex.: ao fechar um dialog).
    const update = (next: SetStateAction<T>) => {
        const current = contexts.has(key) ? (contexts.get(key) as T) : value;
        const resolved =
            typeof next === 'function'
                ? (next as (current: T) => T)(current)
                : next;
        contexts.set(key, resolved);
        setValue(resolved);
    };
    return [value, update];
}

/** Descarta todos os contextos (ao encerrar a sessão). */
export function clearListContexts(): void {
    contexts.clear();
}
