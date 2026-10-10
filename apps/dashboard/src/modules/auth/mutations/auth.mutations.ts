import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  activateAccount,
  changePassword,
  login,
  logout,
  recoverAccess,
  requestRecovery,
} from '../api/auth.api';
import { setCsrfToken } from '../../../shared/http/client';
import { sessionKey, sessionQueryOptions } from '../queries/session.query';

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    // A sessão (e o token CSRF) é consultada logo após o cookie ser emitido.
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
      setCsrfToken(undefined);
      queryClient.clear();
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
