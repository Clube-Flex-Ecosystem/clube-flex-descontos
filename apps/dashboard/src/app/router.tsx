import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { sessionKey } from '../modules/auth/queries/session.query';
import { setUnauthenticatedHandler } from '../shared/http/client';
import { clearListContexts } from '../shared/utils/list-context';
import { routeTree } from '../routeTree.gen';

export interface RouterContext {
    queryClient: QueryClient;
}

export function createAppRouter(queryClient: QueryClient) {
    const router = createRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: 'intent',
        // Voltar a uma página já visitada (ex.: do detalhe à listagem) restaura a rolagem.
        scrollRestoration: true,
    });

    // Sessão encerrada no servidor (expiração, revogação ou desativação): volta ao login
    // sem manter nenhum dado do usuário em memória.
    setUnauthenticatedHandler(() => {
        queryClient.clear();
        clearListContexts();
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
