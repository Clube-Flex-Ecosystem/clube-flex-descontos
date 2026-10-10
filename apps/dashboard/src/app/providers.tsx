import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
          queries: { retry: false },
        },
      }),
  );
  const [router] = useState(() => createAppRouter(queryClient));

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
