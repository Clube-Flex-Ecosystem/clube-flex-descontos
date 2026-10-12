import type { Permission } from '@flex/contracts';
import type { RequestHandler } from 'express';
import { verifyAuthToken } from '../../infrastructure/security/jwt';
import { clock } from '../../infrastructure/clock';
import { DrizzlePermissionRepository } from '../../modules/identity/repositories/drizzle-permission.repository';
import { DrizzleUserRepository } from '../../modules/identity/repositories/drizzle-user.repository';
import { HttpError } from '../../errors/app-error';
import { clearAuthCookie, readAuthToken } from '../session-cookie';

export interface AuthenticatedContext {
  user: {
    id: string;
    fullName: string;
    username: string;
    email?: string;
  };
  permissions: Permission[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthenticatedContext;
    }
  }
}

const users = new DrizzleUserRepository();
const permissions = new DrizzlePermissionRepository();

export const authenticate: RequestHandler = async (req, res, next) => {
  const raw = readAuthToken(req);
  const token = raw ? await verifyAuthToken(raw, clock.now()) : null;
  const user = token ? await users.findById(token.userId) : null;
  if (
    !token ||
    !user ||
    user.status !== 'active' ||
    user.authVersion !== token.authVersion
  ) {
    if (raw) clearAuthCookie(res);
    throw new HttpError('AUTHENTICATION_REQUIRED');
  }

  req.auth = {
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      ...(user.email ? { email: user.email } : {}),
    },
    permissions: await permissions.listForUser(user.id),
  };
  req.log = req.log.child({ userId: user.id });
  next();
};
