import { queryOptions } from '@tanstack/react-query';
import { fetchSession } from '../api/auth.api';

export const sessionKey = ['session'] as const;

/**
 * A sessão e as permissões atuais. O dado em cache é `null` para visitantes sem sessão,
 * o que permite às rotas decidir o redirecionamento sem tratar erro.
 */
export const sessionQueryOptions = queryOptions({
    queryKey: sessionKey,
    queryFn: fetchSession,
    staleTime: 30_000,
    retry: false,
});
