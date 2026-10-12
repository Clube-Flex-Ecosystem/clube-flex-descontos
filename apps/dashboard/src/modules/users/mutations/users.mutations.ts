import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUser } from '@flex/contracts';
import { upsertById } from '../../../shared/http/versioning';
import { auditKey } from '../../audit';
import {
    createUser,
    issueAccessCode,
    replacePermissions,
    setUserStatus,
    updateUser,
} from '../api/users.api';
import { usersKey } from '../queries/users.query';

/** Mantém no cache apenas o recurso; o código de acesso é exibido uma única vez. */
function persisted(user: AdminUser): AdminUser {
    return {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        ...(user.email ? { email: user.email } : {}),
        status: user.status,
        accessStatus: user.accessStatus,
        permissions: user.permissions,
        version: user.version,
        deleted: false,
    };
}

/**
 * A resposta traz a representação completa e a nova versão: ela substitui a conta na
 * listagem e no detalhe sem nova consulta. Como as operações geram eventos de auditoria,
 * apenas essa consulta é invalidada (atualização direcionada).
 */
function useWriteUser() {
    const queryClient = useQueryClient();
    return (user: AdminUser) => {
        const cached = persisted(user);
        queryClient.setQueryData<AdminUser[]>(usersKey, (current) =>
            current ? upsertById(current, cached) : current,
        );
        queryClient.setQueryData<AdminUser>([...usersKey, user.id], cached);
        void queryClient.invalidateQueries({ queryKey: auditKey });
    };
}

export function useCreateUser() {
    return useMutation({
        mutationFn: createUser,
        onSuccess: useWriteUser(),
    });
}

export function useUpdateUser() {
    return useMutation({ mutationFn: updateUser, onSuccess: useWriteUser() });
}

export function useSetUserStatus() {
    return useMutation({
        mutationFn: setUserStatus,
        onSuccess: useWriteUser(),
    });
}

export function useIssueAccessCode() {
    return useMutation({
        mutationFn: issueAccessCode,
        onSuccess: useWriteUser(),
    });
}

export function useReplacePermissions() {
    return useMutation({
        mutationFn: replacePermissions,
        onSuccess: useWriteUser(),
    });
}
