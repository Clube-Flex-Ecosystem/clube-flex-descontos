import { Router } from 'express';
import { auditControllers } from '../../modules/audit/controllers/audit.controllers';
import { adminUserControllers } from '../../modules/identity/controllers/admin-users.controllers';
import { requirePermissions } from '../middlewares/require-permissions.middleware';

export const adminGovernanceRouter = Router();
const router = adminGovernanceRouter;
const users = adminUserControllers;
const audit = auditControllers;

// Usuários
router.get('/users', requirePermissions('users.view'), users.list);
router.post('/users', requirePermissions('users.manage'), users.create);
router.get('/users/:id', requirePermissions('users.view'), users.get);
router.patch('/users/:id', requirePermissions('users.manage'), users.update);
router.post(
  '/users/:id/activate',
  requirePermissions('users.set-status'),
  users.activate,
);
router.post(
  '/users/:id/deactivate',
  requirePermissions('users.set-status'),
  users.deactivate,
);
router.post(
  '/users/:id/access-codes',
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
  requirePermissions('permissions.manage'),
  users.replacePermissions,
);

// Auditoria (somente leitura)
router.get('/audit-events', requirePermissions('audit.view'), audit.list);
router.get('/audit-events/:id', requirePermissions('audit.view'), audit.get);
