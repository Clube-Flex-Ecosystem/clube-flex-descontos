import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
} from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';
import { ToastProvider } from '../shared/feedback/toast';
import { createAppRouter } from './router';

export function Providers() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Mutações nunca são repetidas automaticamente (arquitetura do dashboard).
          mutations: { retry: false },
          queries: {
            // Mantém os dados recentes como fonte local durante a navegação, evitando
            // uma nova consulta a cada montagem enquanto o cache ainda estiver fresco.
            staleTime: 30_000,
            // Conserva queries sem observadores para reutilização ao retornar à tela.
            gcTime: 5 * 60_000,
            retry: false,
            // Queries ativas podem ser atualizadas quando a aba volta ao foco, sem polling.
            refetchOnWindowFocus: true,
          },
        },
      }),
  );
  const [router] = useState(() => createAppRouter(queryClient));

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <QueryErrorResetBoundary>
          <RouterProvider router={router} />
        </QueryErrorResetBoundary>
      </ToastProvider>
    </QueryClientProvider>
  );
}
