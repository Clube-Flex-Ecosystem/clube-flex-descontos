import { useQuery } from '@tanstack/react-query';
import type { Permission, SessionResponse } from '@flex/contracts';
import { sessionQueryOptions } from './queries/session.query';

/** API pública do módulo de acesso para os demais módulos do dashboard. */

/** Sessão atual com as permissões vigentes (renovadas quando a aba volta ao foco). */
export function useSession(): SessionResponse | undefined {
  return useQuery(sessionQueryOptions).data?.session;
}

/**
 * Indica se o usuário possui a permissão. Serve apenas para ocultar controles: a API
 * continua sendo a autoridade de acesso.
 */
export function useCan(permission: Permission): boolean {
  return useSession()?.permissions.includes(permission) ?? false;
}
