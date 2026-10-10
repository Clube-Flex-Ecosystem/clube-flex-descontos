import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { sessionKey } from '../modules/auth/queries/session.query';
import { setUnauthenticatedHandler } from '../shared/http/client';
import { routeTree } from '../routeTree.gen';

export interface RouterContext {
  queryClient: QueryClient;
}

export function createAppRouter(queryClient: QueryClient) {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
  });

  // Sessão encerrada no servidor (expiração, revogação ou desativação): volta ao login
  // sem manter nenhum dado do usuário em memória.
  setUnauthenticatedHandler(() => {
    queryClient.clear();
    queryClient.setQueryData(sessionKey, null);
    void router.navigate({ to: '/login' });
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
