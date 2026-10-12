import type { Request, RequestHandler } from 'express';
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  recoveryRequestSchema,
  setPasswordWithCodeRequestSchema,
  type RecoveryResponse,
  type SessionResponse,
} from '@flex/contracts';
import { clearAuthCookie, setAuthCookie } from '../../../http/session-cookie';
import { clock } from '../../../infrastructure/clock';
import { emailSender } from '../../../infrastructure/email/email';
import { passwordHash } from '../../../infrastructure/security/password';
import { DrizzleUnitOfWork } from '../../../infrastructure/database/drizzle/drizzle-unit-of-work';
import { DrizzleUserRepository } from '../repositories/drizzle-user.repository';
import { issueAuthToken } from '../../../infrastructure/security/jwt';
import { AccessCodeDelivery } from '../access-code-delivery';
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
  authenticateUser: new AuthenticateUserUseCase(usersRepository, passwordHash),
  setPasswordWithAccessCode: new SetPasswordWithAccessCodeUseCase(
    unitOfWork,
    passwordHash,
    clock,
  ),
  requestRecovery: new RequestRecoveryUseCase(
    unitOfWork,
    delivery,
    clock,
    console,
  ),
  changePassword: new ChangePasswordUseCase(unitOfWork, passwordHash, clock),
};

const NEUTRAL_RECOVERY_MESSAGE =
  'Se existir uma conta ativa com e-mail cadastrado para este usuário, enviaremos um código de recuperação.';

/** Controllers de identidade: validam a entrada, executam o caso de uso e montam a resposta. */
// A composição fica próxima dos controllers, como nas demais operações HTTP.
const login: RequestHandler = async (req, res) => {
  const body = loginRequestSchema.parse(req.body);
  const identity = await useCases.authenticateUser.execute(body);
  const { token, expiresAt } = await issueAuthToken(identity, clock.now());
  setAuthCookie(res, token, expiresAt);
  res.status(204).end();
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
    const body = setPasswordWithCodeRequestSchema.parse(req.body);
    await useCases.setPasswordWithAccessCode.execute({
      purpose,
      code: body.code,
      newPassword: body.newPassword,
    });
    res.status(204).end();
  };

const requestRecovery: RequestHandler = async (req, res) => {
  const body = recoveryRequestSchema.parse(req.body);
  await useCases.requestRecovery.execute({ username: body.username });
  const response: RecoveryResponse = { message: NEUTRAL_RECOVERY_MESSAGE };
  res.status(202).json(response);
};

const changePassword: RequestHandler = async (req, res) => {
  const auth = requireAuth(req);
  const body = changePasswordRequestSchema.parse(req.body);
  const user = await useCases.changePassword.execute({
    userId: auth.user.id,
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  });
  const { token, expiresAt } = await issueAuthToken(
    { userId: user.id, authVersion: user.authVersion },
    clock.now(),
  );
  setAuthCookie(res, token, expiresAt);
  res.status(204).end();
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
