import { Router, type RequestHandler } from 'express';
import {
    activateLeadSourceController,
    addLeadObservationController,
    assignLeadController,
    changeLeadStageController,
    createCommercialLeadController,
    createLeadSourceController,
    deactivateLeadSourceController,
    editLeadObservationController,
    getCommercialLeadController,
    getLeadHistoryController,
    getLeadSourceController,
    listCommercialLeadsController,
    listLeadAssigneesController,
    listLeadSourcesController,
    removeCommercialLeadController,
    removeLeadSourceController,
    resolveLeadRequestController,
    updateCommercialLeadController,
    updateLeadSourceController,
} from '../../modules/leads/commercial.controllers';
import { requirePermissions } from '../middlewares/require-permissions.middleware';
import { HttpError } from '../../errors/app-error';

export const adminCommercialRouter = Router();
const router = adminCommercialRouter;
const viewLeads: RequestHandler = (req, res, next) =>
    req.auth?.permissions.some(
        (p) => p === 'leads.view-own' || p === 'leads.view-all',
    )
        ? next()
        : (() => {
              throw new HttpError('PERMISSION_DENIED');
          })();
router.get('/leads', viewLeads, listCommercialLeadsController);
router.get(
    '/leads/assignees',
    requirePermissions('leads.view-all'),
    listLeadAssigneesController,
);
router.post(
    '/leads',
    requirePermissions('leads.create'),
    createCommercialLeadController,
);
router.get('/leads/:id', viewLeads, getCommercialLeadController);
router.patch(
    '/leads/:id',
    requirePermissions('leads.update'),
    updateCommercialLeadController,
);
router.delete(
    '/leads/:id',
    requirePermissions('leads.delete'),
    removeCommercialLeadController,
);
router.post(
    '/leads/:id/stage-transitions',
    requirePermissions('leads.change-stage'),
    changeLeadStageController,
);
router.put('/leads/:id/assignee', assignLeadController);
router.post(
    '/leads/:id/observations',
    requirePermissions('leads.update'),
    addLeadObservationController,
);
router.patch(
    '/leads/:id/observations/:observationId',
    requirePermissions('leads.update'),
    editLeadObservationController,
);
router.post(
    '/leads/:id/contact-requests/:requestId/resolve',
    requirePermissions('leads.update'),
    resolveLeadRequestController,
);
router.get('/leads/:id/history', viewLeads, getLeadHistoryController);
router.get(
    '/lead-sources',
    requirePermissions('sources.view'),
    listLeadSourcesController,
);
router.post(
    '/lead-sources',
    requirePermissions('sources.manage'),
    createLeadSourceController,
);
router.get(
    '/lead-sources/:id',
    requirePermissions('sources.view'),
    getLeadSourceController,
);
router.patch(
    '/lead-sources/:id',
    requirePermissions('sources.manage'),
    updateLeadSourceController,
);
router.post(
    '/lead-sources/:id/activate',
    requirePermissions('sources.manage'),
    activateLeadSourceController,
);
router.post(
    '/lead-sources/:id/deactivate',
    requirePermissions('sources.manage'),
    deactivateLeadSourceController,
);
router.delete(
    '/lead-sources/:id',
    requirePermissions('sources.manage'),
    removeLeadSourceController,
);
