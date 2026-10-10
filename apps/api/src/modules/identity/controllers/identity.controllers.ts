import type { Request, RequestHandler } from 'express';
import {
  CSRF_HEADER,
  changePasswordRequestSchema,
  loginRequestSchema,
  recoveryRequestSchema,
  setPasswordWithCodeRequestSchema,
  type RecoveryResponse,
  type SessionResponse,
} from '@flex/contracts';
import { sendProblem } from '../../../http/problem';
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from '../../../http/session-cookie';
import { fieldError, parseBody } from '../../../http/validation';
import {
  InvalidAccessCodeError,
  InvalidCredentialsError,
  InvalidCurrentPasswordError,
  PasswordPolicyError,
} from '../errors';
import type { AccessCodePurpose } from '../repositories/access-code.repository.types';
import type { AuthenticateUserUseCase } from '../use-cases/authenticate-user.use-case';
import type { ChangePasswordUseCase } from '../use-cases/change-password.use-case';
import type { LogoutUseCase } from '../use-cases/logout.use-case';
import type { RequestRecoveryUseCase } from '../use-cases/request-recovery.use-case';
import type { SetPasswordWithAccessCodeUseCase } from '../use-cases/set-password-with-access-code.use-case';

export interface IdentityUseCases {
  authenticateUser: AuthenticateUserUseCase;
  logout: LogoutUseCase;
  setPasswordWithAccessCode: SetPasswordWithAccessCodeUseCase;
  requestRecovery: RequestRecoveryUseCase;
  changePassword: ChangePasswordUseCase;
}

const NEUTRAL_RECOVERY_MESSAGE =
  'Se existir uma conta ativa com e-mail cadastrado para este usuário, enviaremos um código de recuperação.';

/** Controllers de identidade: validam a entrada, executam o caso de uso e montam a resposta. */
export function createIdentityControllers(useCases: IdentityUseCases) {
  const login: RequestHandler = async (req, res) => {
    const body = parseBody(loginRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    try {
      const { sessionToken, expiresAt } =
        await useCases.authenticateUser.execute({
          username: body.data.username,
          password: body.data.password,
          previousSessionToken: readSessionToken(req),
        });
      setSessionCookie(res, sessionToken, expiresAt);
      res.status(204).end();
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        sendProblem(req, res, 'INVALID_CREDENTIALS');
        return;
      }
      throw error;
    }
  };

  const logout: RequestHandler = async (req, res) => {
    const sessionToken = readSessionToken(req);
    if (sessionToken) await useCases.logout.execute({ sessionToken });
    clearSessionCookie(res);
    res.status(204).end();
  };

  const session: RequestHandler = (req, res) => {
    const auth = requireAuth(req);
    const body: SessionResponse = {
      user: {
        id: auth.user.id,
        fullName: auth.user.fullName,
        username: auth.user.username,
        ...(auth.user.email ? { email: auth.user.email } : {}),
      },
      permissions: auth.permissions,
    };
    // O token CSRF acompanha a consulta da sessão; o corpo preserva o contrato aprovado.
    res.setHeader(CSRF_HEADER, auth.csrfToken);
    res.json(body);
  };

  const setPasswordWithCode =
    (purpose: AccessCodePurpose): RequestHandler =>
    async (req, res) => {
      const body = parseBody(setPasswordWithCodeRequestSchema, req.body);
      if (!body.success) {
        sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
        return;
      }
      try {
        await useCases.setPasswordWithAccessCode.execute({
          purpose,
          code: body.data.code,
          newPassword: body.data.newPassword,
        });
        res.status(204).end();
      } catch (error) {
        if (error instanceof InvalidAccessCodeError) {
          sendProblem(req, res, 'VALIDATION_ERROR', {
            errors: [fieldError('code', 'INVALID_ACCESS_CODE')],
          });
          return;
        }
        if (error instanceof PasswordPolicyError) {
          sendProblem(req, res, 'VALIDATION_ERROR', {
            errors: [fieldError('newPassword', error.code)],
          });
          return;
        }
        throw error;
      }
    };

  const requestRecovery: RequestHandler = async (req, res) => {
    const body = parseBody(recoveryRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    await useCases.requestRecovery.execute({ username: body.data.username });
    const response: RecoveryResponse = { message: NEUTRAL_RECOVERY_MESSAGE };
    res.status(202).json(response);
  };

  const changePassword: RequestHandler = async (req, res) => {
    const auth = requireAuth(req);
    const body = parseBody(changePasswordRequestSchema, req.body);
    if (!body.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
      return;
    }
    try {
      await useCases.changePassword.execute({
        userId: auth.user.id,
        sessionId: auth.sessionId,
        currentPassword: body.data.currentPassword,
        newPassword: body.data.newPassword,
      });
      res.status(204).end();
    } catch (error) {
      if (error instanceof InvalidCurrentPasswordError) {
        sendProblem(req, res, 'VALIDATION_ERROR', {
          errors: [fieldError('currentPassword', 'INVALID_CURRENT_PASSWORD')],
        });
        return;
      }
      if (error instanceof PasswordPolicyError) {
        sendProblem(req, res, 'VALIDATION_ERROR', {
          errors: [fieldError('newPassword', error.code)],
        });
        return;
      }
      throw error;
    }
  };

  return {
    login,
    logout,
    session,
    activate: setPasswordWithCode('activation'),
    recover: setPasswordWithCode('recovery'),
    requestRecovery,
    changePassword,
  };
}

function requireAuth(req: Request) {
  // A autenticação obrigatória precede estes controllers; a ausência é erro de composição.
  if (!req.auth) throw new Error('Rota autenticada sem sessão resolvida');
  return req.auth;
}
