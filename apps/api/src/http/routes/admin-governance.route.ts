import { Router, type RequestHandler } from 'express';
import { auditControllers } from '../../modules/audit/controllers/audit.controllers';
import { adminUserControllers } from '../../modules/identity/controllers/admin-users.controllers';
import { resolveSession } from '../../modules/identity/controllers/identity.controllers';
import { createAuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { csrfProtection } from '../middlewares/csrf.middleware';
import { requirePermissions } from '../middlewares/require-permissions.middleware';

export interface AdminGovernanceRouterDependencies {
  originGuard: RequestHandler;
}

const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('cache-control', 'no-store');
  next();
};

/**
 * Governança administrativa: usuários, permissões e auditoria. Em cada rota a ordem é a
 * da arquitetura: sessão, CSRF (nas operações mutáveis) e permissões, antes do controller.
 */
export function createAdminGovernanceRouter({
  originGuard,
}: AdminGovernanceRouterDependencies): Router {
  const router = Router();
  const users = adminUserControllers;
  const audit = auditControllers;

  router.use(
    noStore,
    originGuard,
    createAuthenticationMiddleware(resolveSession, { required: true }),
  );

  // Usuários
  router.get('/users', requirePermissions('users.view'), users.list);
  router.post(
    '/users',
    csrfProtection,
    requirePermissions('users.manage'),
    users.create,
  );
  router.get('/users/:id', requirePermissions('users.view'), users.get);
  router.patch(
    '/users/:id',
    csrfProtection,
    requirePermissions('users.manage'),
    users.update,
  );
  router.post(
    '/users/:id/activate',
    csrfProtection,
    requirePermissions('users.set-status'),
    users.activate,
  );
  router.post(
    '/users/:id/deactivate',
    csrfProtection,
    requirePermissions('users.set-status'),
    users.deactivate,
  );
  router.post(
    '/users/:id/access-codes',
    csrfProtection,
    requirePermissions('users.reset-access'),
    users.issueAccessCode,
  );

  // Permissões
  router.get(
    '/permissions',
    requirePermissions('permissions.view'),
    users.permissionCatalog,
  );
  router.put(
    '/users/:id/permissions',
    csrfProtection,
    requirePermissions('permissions.manage'),
    users.replacePermissions,
  );

  // Auditoria (somente leitura)
  router.get('/audit-events', requirePermissions('audit.view'), audit.list);
  router.get('/audit-events/:id', requirePermissions('audit.view'), audit.get);

  return router;
}
