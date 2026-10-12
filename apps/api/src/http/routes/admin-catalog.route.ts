import { Router } from 'express';
import { catalogControllers } from '../../modules/catalog/controllers/catalog.controllers';
import { requirePermissions } from '../middlewares/require-permissions.middleware';

export const adminCatalogRouter = Router();
const router = adminCatalogRouter;
const { plans, categories, partners } = catalogControllers;

// Planos
router.get('/plans', requirePermissions('plans.view'), plans.list);
router.post('/plans', requirePermissions('plans.manage'), plans.create);
router.get('/plans/:id', requirePermissions('plans.view'), plans.get);
router.patch('/plans/:id', requirePermissions('plans.manage'), plans.update);
router.post(
  '/plans/:id/activate',
  requirePermissions('plans.manage'),
  plans.activate,
);
router.post(
  '/plans/:id/deactivate',
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
  requirePermissions('categories.manage'),
  categories.update,
);
router.post(
  '/categories/:id/activate',
  requirePermissions('categories.manage'),
  categories.activate,
);
router.post(
  '/categories/:id/deactivate',
  requirePermissions('categories.manage'),
  categories.deactivate,
);

// Parceiros
router.get('/partners', requirePermissions('partners.view'), partners.list);
router.post(
  '/partners',
  requirePermissions('partners.create'),
  partners.create,
);
router.get('/partners/:id', requirePermissions('partners.view'), partners.get);
router.put(
  '/partners/:id',
  requirePermissions('partners.update'),
  partners.update,
);
router.delete(
  '/partners/:id',
  requirePermissions('partners.delete'),
  partners.remove,
);
router.post(
  '/partners/:id/publish',
  requirePermissions('partners.publish'),
  partners.publish,
);
router.post(
  '/partners/:id/deactivate',
  requirePermissions('partners.publish'),
  partners.deactivate,
);
router.post(
  '/partners/:id/move-to-draft',
  requirePermissions('partners.publish'),
  partners.moveToDraft,
);
