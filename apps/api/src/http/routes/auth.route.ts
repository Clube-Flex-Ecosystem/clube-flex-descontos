import { Router, type RequestHandler } from 'express';
import {
  identityControllers,
  resolveSession,
} from '../../modules/identity/controllers/identity.controllers';
import { createAuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { csrfProtection } from '../middlewares/csrf.middleware';
import {
  rateLimit,
  type AuthRateLimiters,
} from '../middlewares/rate-limit.middleware';

export interface AuthRouterDependencies {
  limiters: AuthRateLimiters;
  originGuard: RequestHandler;
}

const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('cache-control', 'no-store');
  next();
};

function normalizedUsername(body: unknown): string | undefined {
  const username = (body as { username?: unknown } | undefined)?.username;
  return typeof username === 'string' && username.trim()
    ? username.trim().toLowerCase()
    : undefined;
}

export function createAuthRouter({
  limiters,
  originGuard,
}: AuthRouterDependencies): Router {
  const router = Router();

  const controllers = identityControllers;

  const authenticate = createAuthenticationMiddleware(resolveSession, {
    required: true,
  });

  const authenticateOptionally = createAuthenticationMiddleware(
    resolveSession,
    { required: false },
  );

  router.use(noStore, originGuard);

  router.post(
    '/login',
    rateLimit({
      limiter: limiters.loginByIp,
      key: (req) => `ip:${req.ip ?? 'desconhecido'}`,
      count: 'failures',
    }),
    rateLimit({
      limiter: limiters.loginByUser,
      key: (req) => normalizedUsername(req.body),
      count: 'failures',
      resetOnSuccess: true,
    }),
    controllers.login,
  );

  const codeLimit = rateLimit({
    limiter: limiters.codeByIp,
    key: (req) => `ip:${req.ip ?? 'desconhecido'}`,
    count: 'failures',
  });
  router.post('/activate', codeLimit, controllers.activate);
  router.post('/recover', codeLimit, controllers.recover);

  router.post(
    '/recovery-requests',
    rateLimit({
      limiter: limiters.recoveryByIp,
      key: (req) => `ip:${req.ip ?? 'desconhecido'}`,
      count: 'always',
    }),
    rateLimit({
      limiter: limiters.recoveryByUser,
      key: (req) => normalizedUsername(req.body),
      count: 'always',
    }),
    controllers.requestRecovery,
  );

  router.get('/session', authenticate, controllers.session);
  router.put(
    '/password',
    authenticate,
    csrfProtection,
    controllers.changePassword,
  );
  router.post(
    '/logout',
    authenticateOptionally,
    csrfProtection,
    controllers.logout,
  );

  return router;
}
