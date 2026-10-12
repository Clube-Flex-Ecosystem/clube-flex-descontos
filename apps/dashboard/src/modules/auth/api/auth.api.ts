import axios from 'axios';
import {
  sessionResponseSchema,
  type ChangePasswordRequest,
  type LoginRequest,
  type RecoveryRequest,
  type SessionResponse,
  type SetPasswordWithCodeRequest,
} from '@flex/contracts';
import { http } from '../../../shared/http/client';

export interface SessionState {
  session: SessionResponse;
}

/** Consulta a sessão atual. Retorna `null` quando não há sessão autenticada. */
export async function fetchSession(): Promise<SessionState | null> {
  try {
    const response = await http.get('/v1/auth/session', {
      skipUnauthenticatedHandler: true,
    });
    return {
      session: sessionResponseSchema.parse(response.data),
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login(body: LoginRequest): Promise<void> {
  await http.post('/v1/auth/login', body);
}

export async function logout(): Promise<void> {
  await http.post('/v1/auth/logout');
}

export async function activateAccount(
  body: SetPasswordWithCodeRequest,
): Promise<void> {
  await http.post('/v1/auth/activate', body);
}

export async function requestRecovery(body: RecoveryRequest): Promise<void> {
  await http.post('/v1/auth/recovery-requests', body);
}

export async function recoverAccess(
  body: SetPasswordWithCodeRequest,
): Promise<void> {
  await http.post('/v1/auth/recover', body);
}

export async function changePassword(
  body: ChangePasswordRequest,
): Promise<void> {
  await http.put('/v1/auth/password', body);
}
