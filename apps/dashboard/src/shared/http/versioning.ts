import type { AxiosRequestConfig } from 'axios';
import { toProblem } from './problem';

/** Cabeçalho `If-Match` com a versão conhecida pelo cliente (concorrência otimista). */
export function ifMatch(version: number): AxiosRequestConfig {
  return { headers: { 'If-Match': `"${version}"` } };
}

/** Outra pessoa alterou o recurso: a operação não foi aplicada. */
export function isVersionConflict(error: unknown): boolean {
  return toProblem(error)?.code === 'RESOURCE_VERSION_CONFLICT';
}

/** Insere ou substitui, imutavelmente, um recurso identificado em uma coleção. */
export function upsertById<T extends { id: string }>(
  items: readonly T[] | undefined,
  item: T,
): T[] {
  const current = items ?? [];
  return current.some((existing) => existing.id === item.id)
    ? current.map((existing) => (existing.id === item.id ? item : existing))
    : [...current, item];
}

export function removeById<T extends { id: string }>(
  items: readonly T[] | undefined,
  id: string,
): T[] {
  return (items ?? []).filter((item) => item.id !== id);
}
