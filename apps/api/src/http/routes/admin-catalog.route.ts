import { Router } from 'express';
import {
    activateCategoryController,
    activatePlanController,
    createCategoryController,
    createPartnerController,
    createPlanController,
    deactivateCategoryController,
    deactivatePartnerController,
    deactivatePlanController,
    deletePartnerController,
    getCategoryController,
    getPartnerController,
    getPlanController,
    listCategoriesController,
    listPartnersController,
    listPlansController,
    movePartnerToDraftController,
    publishPartnerController,
    updateCategoryController,
    updatePartnerController,
    updatePlanController,
} from '../../modules/catalog/controllers/catalog.controllers';
import { requirePermissions } from '../middlewares/require-permissions.middleware';

export const adminCatalogRouter = Router();
const router = adminCatalogRouter;
// Planos
router.get('/plans', requirePermissions('plans.view'), listPlansController);
router.post('/plans', requirePermissions('plans.manage'), createPlanController);
router.get('/plans/:id', requirePermissions('plans.view'), getPlanController);
router.patch(
    '/plans/:id',
    requirePermissions('plans.manage'),
    updatePlanController,
);
router.post(
    '/plans/:id/activate',
    requirePermissions('plans.manage'),
    activatePlanController,
);
router.post(
    '/plans/:id/deactivate',
    requirePermissions('plans.manage'),
    deactivatePlanController,
);

// Categorias
router.get(
    '/categories',
    requirePermissions('categories.view'),
    listCategoriesController,
);
router.post(
    '/categories',
    requirePermissions('categories.manage'),
    createCategoryController,
);
router.get(
    '/categories/:id',
    requirePermissions('categories.view'),
    getCategoryController,
);
router.patch(
    '/categories/:id',
    requirePermissions('categories.manage'),
    updateCategoryController,
);
router.post(
    '/categories/:id/activate',
    requirePermissions('categories.manage'),
    activateCategoryController,
);
router.post(
    '/categories/:id/deactivate',
    requirePermissions('categories.manage'),
    deactivateCategoryController,
);

// Parceiros
router.get(
    '/partners',
    requirePermissions('partners.view'),
    listPartnersController,
);
router.post(
    '/partners',
    requirePermissions('partners.create'),
    createPartnerController,
);
router.get(
    '/partners/:id',
    requirePermissions('partners.view'),
    getPartnerController,
);
router.put(
    '/partners/:id',
    requirePermissions('partners.update'),
    updatePartnerController,
);
router.delete(
    '/partners/:id',
    requirePermissions('partners.delete'),
    deletePartnerController,
);
router.post(
    '/partners/:id/publish',
    requirePermissions('partners.publish'),
    publishPartnerController,
);
router.post(
    '/partners/:id/deactivate',
    requirePermissions('partners.publish'),
    deactivatePartnerController,
);
router.post(
    '/partners/:id/move-to-draft',
    requirePermissions('partners.publish'),
    movePartnerToDraftController,
);
