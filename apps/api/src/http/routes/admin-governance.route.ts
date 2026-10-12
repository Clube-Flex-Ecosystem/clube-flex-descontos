import { Router } from 'express';
import {
    getAuditEventController,
    listAuditEventsController,
} from '../../modules/audit/controllers/audit.controllers';
import {
    activateUserController,
    createUserController,
    deactivateUserController,
    getUserController,
    issueAccessCodeController,
    listPermissionCatalogController,
    listUsersController,
    replaceUserPermissionsController,
    updateUserController,
} from '../../modules/identity/controllers/admin-users.controllers';
import { requirePermissions } from '../middlewares/require-permissions.middleware';

export const adminGovernanceRouter = Router();
const router = adminGovernanceRouter;
// Usuários
router.get('/users', requirePermissions('users.view'), listUsersController);
router.post('/users', requirePermissions('users.manage'), createUserController);
router.get('/users/:id', requirePermissions('users.view'), getUserController);
router.patch(
    '/users/:id',
    requirePermissions('users.manage'),
    updateUserController,
);
router.post(
    '/users/:id/activate',
    requirePermissions('users.set-status'),
    activateUserController,
);
router.post(
    '/users/:id/deactivate',
    requirePermissions('users.set-status'),
    deactivateUserController,
);
router.post(
    '/users/:id/access-codes',
    requirePermissions('users.reset-access'),
    issueAccessCodeController,
);

// Permissões
router.get(
    '/permissions',
    requirePermissions('permissions.view'),
    listPermissionCatalogController,
);
router.put(
    '/users/:id/permissions',
    requirePermissions('permissions.manage'),
    replaceUserPermissionsController,
);

// Auditoria (somente leitura)
router.get(
    '/audit-events',
    requirePermissions('audit.view'),
    listAuditEventsController,
);
router.get(
    '/audit-events/:id',
    requirePermissions('audit.view'),
    getAuditEventController,
);
