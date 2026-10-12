import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    activateAccount,
    changePassword,
    login,
    logout,
    recoverAccess,
    requestRecovery,
} from '../api/auth.api';
import { clearListContexts } from '../../../shared/utils/list-context';
import { sessionKey, sessionQueryOptions } from '../queries/session.query';

export function useLogin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: login,
        // A sessão é consultada logo após o cookie ser emitido.
        onSuccess: () =>
            queryClient.fetchQuery({ ...sessionQueryOptions, staleTime: 0 }),
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: logout,
        onSettled: () => {
            // Nenhum dado do usuário anterior permanece em memória.
            queryClient.clear();
            clearListContexts();
            queryClient.setQueryData(sessionKey, null);
        },
    });
}

export const useActivateAccount = () =>
    useMutation({ mutationFn: activateAccount });

export const useRequestRecovery = () =>
    useMutation({ mutationFn: requestRecovery });

export const useRecoverAccess = () =>
    useMutation({ mutationFn: recoverAccess });

export const useChangePassword = () =>
    useMutation({ mutationFn: changePassword });
