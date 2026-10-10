import { Router, type RequestHandler } from 'express';
import {
  createCatalogControllers,
  type CatalogUseCases,
} from '../../modules/catalog/controllers/catalog.controllers';
import type { AuthenticatedContext } from '../../modules/identity/use-cases/resolve-session.use-case';
import { createAuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { csrfProtection } from '../middlewares/csrf.middleware';
import { requirePermissions } from '../middlewares/require-permissions.middleware';

export interface AdminCatalogRouterDependencies {
  useCases: CatalogUseCases;
  resolveSession: (input: {
    sessionToken: string;
  }) => Promise<AuthenticatedContext | null>;
  originGuard: RequestHandler;
}

const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('cache-control', 'no-store');
  next();
};

/**
 * Administração do catálogo. Em cada rota a ordem é a da arquitetura: sessão, CSRF (nas
 * operações mutáveis) e permissões, antes do controller.
 */
export function createAdminCatalogRouter({
  useCases,
  resolveSession,
  originGuard,
}: AdminCatalogRouterDependencies): Router {
  const router = Router();
  const { plans, categories, partners } = createCatalogControllers(useCases);

  router.use(
    noStore,
    originGuard,
    createAuthenticationMiddleware(resolveSession, { required: true }),
  );

  // Planos
  router.get('/plans', requirePermissions('plans.view'), plans.list);
  router.post(
    '/plans',
    csrfProtection,
    requirePermissions('plans.manage'),
    plans.create,
  );
  router.get('/plans/:id', requirePermissions('plans.view'), plans.get);
  router.patch(
    '/plans/:id',
    csrfProtection,
    requirePermissions('plans.manage'),
    plans.update,
  );
  router.post(
    '/plans/:id/activate',
    csrfProtection,
    requirePermissions('plans.manage'),
    plans.activate,
  );
  router.post(
    '/plans/:id/deactivate',
    csrfProtection,
    requirePermissions('plans.manage'),
    plans.deactivate,
  );

  // Categorias
  router.get(
    '/categories',
    requirePermissions('categories.view'),
    categories.list,
  );
  router.post(
    '/categories',
    csrfProtection,
    requirePermissions('categories.manage'),
    categories.create,
  );
  router.get(
    '/categories/:id',
    requirePermissions('categories.view'),
    categories.get,
  );
  router.patch(
    '/categories/:id',
    csrfProtection,
    requirePermissions('categories.manage'),
    categories.update,
  );
  router.post(
    '/categories/:id/activate',
    csrfProtection,
    requirePermissions('categories.manage'),
    categories.activate,
  );
  router.post(
    '/categories/:id/deactivate',
    csrfProtection,
    requirePermissions('categories.manage'),
    categories.deactivate,
  );

  // Parceiros
  router.get('/partners', requirePermissions('partners.view'), partners.list);
  router.post(
    '/partners',
    csrfProtection,
    requirePermissions('partners.create'),
    partners.create,
  );
  router.get(
    '/partners/:id',
    requirePermissions('partners.view'),
    partners.get,
  );
  router.put(
    '/partners/:id',
    csrfProtection,
    requirePermissions('partners.update'),
    partners.update,
  );
  router.delete(
    '/partners/:id',
    csrfProtection,
    requirePermissions('partners.delete'),
    partners.remove,
  );
  router.post(
    '/partners/:id/publish',
    csrfProtection,
    requirePermissions('partners.publish'),
    partners.publish,
  );
  router.post(
    '/partners/:id/deactivate',
    csrfProtection,
    requirePermissions('partners.publish'),
    partners.deactivate,
  );
  router.post(
    '/partners/:id/move-to-draft',
    csrfProtection,
    requirePermissions('partners.publish'),
    partners.moveToDraft,
  );

  return router;
}
