import type { Request, RequestHandler } from 'express';
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  recoveryRequestSchema,
  setPasswordWithCodeRequestSchema,
  type RecoveryResponse,
  type SessionResponse,
} from '@flex/contracts';
import { sendProblem } from '../../../http/problem';
import { clearAuthCookie, setAuthCookie } from '../../../http/session-cookie';
import { fieldError, parseBody } from '../../../http/validation';
import {
  applicationLogger,
  clock,
  emailSender,
  hasher,
} from '../../../infrastructure/services';
import { DrizzleUnitOfWork } from '../../../infrastructure/database/drizzle/drizzle-unit-of-work';
import { DrizzleUserRepository } from '../repositories/drizzle-user.repository';
import { issueAuthToken } from '../../../infrastructure/security/jwt';
import { AccessCodeDelivery } from '../access-code-delivery';
import {
  InvalidAccessCodeError,
  InvalidCredentialsError,
  InvalidCurrentPasswordError,
  PasswordPolicyError,
} from '../errors';
import type { AccessCodePurpose } from '../repositories/access-code.repository';
import { AuthenticateUserUseCase } from '../use-cases/authenticate-user.use-case';
import { ChangePasswordUseCase } from '../use-cases/change-password.use-case';
import { RequestRecoveryUseCase } from '../use-cases/request-recovery.use-case';
import { SetPasswordWithAccessCodeUseCase } from '../use-cases/set-password-with-access-code.use-case';

const usersRepository = new DrizzleUserRepository();
const unitOfWork = new DrizzleUnitOfWork();
const delivery = new AccessCodeDelivery(
  emailSender,
  (process.env.DASHBOARD_ORIGIN ?? 'http://localhost:5173').replace(/\/+$/, ''),
);

const useCases = {
  authenticateUser: new AuthenticateUserUseCase(usersRepository, hasher),
  setPasswordWithAccessCode: new SetPasswordWithAccessCodeUseCase(
    unitOfWork,
    hasher,
    clock,
  ),
  requestRecovery: new RequestRecoveryUseCase(
    unitOfWork,
    delivery,
    clock,
    applicationLogger,
  ),
  changePassword: new ChangePasswordUseCase(unitOfWork, hasher, clock),
};

const NEUTRAL_RECOVERY_MESSAGE =
  'Se existir uma conta ativa com e-mail cadastrado para este usuário, enviaremos um código de recuperação.';

/** Controllers de identidade: validam a entrada, executam o caso de uso e montam a resposta. */
// A composição fica próxima dos controllers, como nas demais operações HTTP.
const login: RequestHandler = async (req, res) => {
  const body = parseBody(loginRequestSchema, req.body);
  if (!body.success) {
    sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
    return;
  }
  try {
    const identity = await useCases.authenticateUser.execute(body.data);
    const { token, expiresAt } = await issueAuthToken(identity, clock.now());
    setAuthCookie(res, token, expiresAt);
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
  clearAuthCookie(res);
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
    const user = await useCases.changePassword.execute({
      userId: auth.user.id,
      currentPassword: body.data.currentPassword,
      newPassword: body.data.newPassword,
    });
    const { token, expiresAt } = await issueAuthToken(
      { userId: user.id, authVersion: user.authVersion },
      clock.now(),
    );
    setAuthCookie(res, token, expiresAt);
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

export const identityControllers = {
  login,
  logout,
  session,
  activate: setPasswordWithCode('activation'),
  recover: setPasswordWithCode('recovery'),
  requestRecovery,
  changePassword,
};

function requireAuth(req: Request) {
  // A autenticação obrigatória precede estes controllers; a ausência é erro de composição.
  if (!req.auth) throw new Error('Rota autenticada sem sessão resolvida');
  return req.auth;
}
