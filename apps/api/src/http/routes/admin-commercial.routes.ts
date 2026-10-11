import { Router, type RequestHandler } from 'express';
import type { AuthenticatedContext } from '../../modules/identity/use-cases/resolve-session.use-case';
import type { CommercialService } from '../../modules/leads/commercial.service';
import { createCommercialControllers } from '../../modules/leads/commercial.controllers';
import { createAuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { csrfProtection } from '../middlewares/csrf.middleware';
import { requirePermissions } from '../middlewares/require-permissions.middleware';
import { sendProblem } from '../problem';

export function createAdminCommercialRouter(deps: {
  service: CommercialService;
  resolveSession: (i: {
    sessionToken: string;
  }) => Promise<AuthenticatedContext | null>;
  originGuard: RequestHandler;
}) {
  const router = Router(),
    { leads, sources } = createCommercialControllers(deps.service);
  router.use(
    (_q, r, n) => {
      r.setHeader('cache-control', 'no-store');
      n();
    },
    deps.originGuard,
    createAuthenticationMiddleware(deps.resolveSession, { required: true }),
  );
  const viewLeads: RequestHandler = (req, res, next) =>
    req.auth?.permissions.some(
      (p) => p === 'leads.view-own' || p === 'leads.view-all',
    )
      ? next()
      : sendProblem(req, res, 'PERMISSION_DENIED');
  router.get('/leads', viewLeads, leads.list);
  router.get(
    '/leads/assignees',
    requirePermissions('leads.view-all'),
    leads.assignees,
  );
  router.post(
    '/leads',
    csrfProtection,
    requirePermissions('leads.create'),
    leads.create,
  );
  router.get('/leads/:id', viewLeads, leads.get);
  router.patch(
    '/leads/:id',
    csrfProtection,
    requirePermissions('leads.update'),
    leads.update,
  );
  router.post(
    '/leads/:id/stage-transitions',
    csrfProtection,
    requirePermissions('leads.change-stage'),
    leads.stage,
  );
  router.put('/leads/:id/assignee', csrfProtection, leads.assign);
  router.post(
    '/leads/:id/observations',
    csrfProtection,
    requirePermissions('leads.update'),
    leads.observe,
  );
  router.patch(
    '/leads/:id/observations/:observationId',
    csrfProtection,
    requirePermissions('leads.update'),
    leads.editObservation,
  );
  router.post(
    '/leads/:id/contact-requests/:requestId/resolve',
    csrfProtection,
    requirePermissions('leads.update'),
    leads.resolve,
  );
  router.get('/leads/:id/history', viewLeads, leads.history);
  router.get('/lead-sources', requirePermissions('sources.view'), sources.list);
  router.post(
    '/lead-sources',
    csrfProtection,
    requirePermissions('sources.manage'),
    sources.create,
  );
  router.get(
    '/lead-sources/:id',
    requirePermissions('sources.view'),
    sources.get,
  );
  router.patch(
    '/lead-sources/:id',
    csrfProtection,
    requirePermissions('sources.manage'),
    sources.update,
  );
  router.post(
    '/lead-sources/:id/activate',
    csrfProtection,
    requirePermissions('sources.manage'),
    sources.activate,
  );
  router.post(
    '/lead-sources/:id/deactivate',
    csrfProtection,
    requirePermissions('sources.manage'),
    sources.deactivate,
  );
  router.delete(
    '/lead-sources/:id',
    csrfProtection,
    requirePermissions('sources.manage'),
    sources.remove,
  );
  return router;
}
