import { queryOptions } from '@tanstack/react-query';
import { getUser, listUsers } from '../api/users.api';

export const usersKey = ['users'] as const;

/** Coleção completa de contas internas; a listagem não é paginada. */
export const usersQueryOptions = queryOptions({
    queryKey: usersKey,
    queryFn: listUsers,
});

export const userQueryOptions = (id: string) =>
    queryOptions({
        queryKey: [...usersKey, id],
        queryFn: () => getUser(id),
    });
