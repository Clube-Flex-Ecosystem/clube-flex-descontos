import { Router, type RequestHandler } from 'express';
import { commercialControllers } from '../../modules/leads/commercial.controllers';
import { requirePermissions } from '../middlewares/require-permissions.middleware';
import { HttpError } from '../../errors/app-error';

export const adminCommercialRouter = Router();
const router = adminCommercialRouter;
const { leads, sources } = commercialControllers;
const viewLeads: RequestHandler = (req, res, next) =>
  req.auth?.permissions.some(
    (p) => p === 'leads.view-own' || p === 'leads.view-all',
  )
    ? next()
    : (() => {
        throw new HttpError('PERMISSION_DENIED');
      })();
router.get('/leads', viewLeads, leads.list);
router.get(
  '/leads/assignees',
  requirePermissions('leads.view-all'),
  leads.assignees,
);
router.post('/leads', requirePermissions('leads.create'), leads.create);
router.get('/leads/:id', viewLeads, leads.get);
router.patch('/leads/:id', requirePermissions('leads.update'), leads.update);
router.delete('/leads/:id', requirePermissions('leads.delete'), leads.remove);
router.post(
  '/leads/:id/stage-transitions',
  requirePermissions('leads.change-stage'),
  leads.stage,
);
router.put('/leads/:id/assignee', leads.assign);
router.post(
  '/leads/:id/observations',
  requirePermissions('leads.update'),
  leads.observe,
);
router.patch(
  '/leads/:id/observations/:observationId',
  requirePermissions('leads.update'),
  leads.editObservation,
);
router.post(
  '/leads/:id/contact-requests/:requestId/resolve',
  requirePermissions('leads.update'),
  leads.resolve,
);
router.get('/leads/:id/history', viewLeads, leads.history);
router.get('/lead-sources', requirePermissions('sources.view'), sources.list);
router.post(
  '/lead-sources',
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
  requirePermissions('sources.manage'),
  sources.update,
);
router.post(
  '/lead-sources/:id/activate',
  requirePermissions('sources.manage'),
  sources.activate,
);
router.post(
  '/lead-sources/:id/deactivate',
  requirePermissions('sources.manage'),
  sources.deactivate,
);
router.delete(
  '/lead-sources/:id',
  requirePermissions('sources.manage'),
  sources.remove,
);
