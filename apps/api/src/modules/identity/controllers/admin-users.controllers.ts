import type { Request, RequestHandler, Response } from 'express';
import {
  createUserRequestSchema,
  issueAccessCodeRequestSchema,
  permissionAreas,
  replacePermissionsRequestSchema,
  updateUserRequestSchema,
  type AdminUser,
  type PermissionCatalogEntry,
} from '@flex/contracts';
import { sendProblem } from '../../../http/problem';
import { fieldError, parseBody } from '../../../http/validation';
import { readExpectedVersion, sendVersioned } from '../../../http/versioning';
import { clock, emailSender } from '../../../infrastructure/services';
import { DrizzleUnitOfWork } from '../../../infrastructure/database/drizzle/drizzle-unit-of-work';
import { DrizzleUserRepository } from '../repositories/drizzle-user.repository';
import { DrizzlePermissionRepository } from '../repositories/drizzle-permission.repository';
import { AccessCodeDelivery } from '../access-code-delivery';
import type {
  AdminActor,
  UserView,
  UserWithAccessCode,
} from '../admin-user.types';
import {
  InvalidUserStateError,
  ProtectedUserOperationError,
  UserNotFoundError,
  UsernameTakenError,
  UserVersionConflictError,
} from '../errors';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';
import { GetUserUseCase } from '../use-cases/get-user.use-case';
import { IssueAccessCodeUseCase } from '../use-cases/issue-access-code.use-case';
import { ListUsersUseCase } from '../use-cases/list-users.use-case';
import { ReplaceUserPermissionsUseCase } from '../use-cases/replace-user-permissions.use-case';
import { SetUserStatusUseCase } from '../use-cases/set-user-status.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';

const usersRepository = new DrizzleUserRepository();
const permissionsRepository = new DrizzlePermissionRepository();
const unitOfWork = new DrizzleUnitOfWork();
const delivery = new AccessCodeDelivery(
  emailSender,
  (process.env.DASHBOARD_ORIGIN ?? 'http://localhost:5173').replace(/\/+$/, ''),
);

const useCases = {
  listUsers: new ListUsersUseCase(unitOfWork),
  getUser: new GetUserUseCase(usersRepository, permissionsRepository),
  createUser: new CreateUserUseCase(unitOfWork, delivery, clock),
  updateUser: new UpdateUserUseCase(unitOfWork, clock),
  setUserStatus: new SetUserStatusUseCase(unitOfWork, clock),
  issueAccessCode: new IssueAccessCodeUseCase(unitOfWork, delivery, clock),
  replaceUserPermissions: new ReplaceUserPermissionsUseCase(unitOfWork, clock),
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Montagem explícita da representação administrativa (nunca expõe hash ou códigos persistidos). */
function toAdminUser(
  view: UserView,
  issued?: UserWithAccessCode['issued'],
): AdminUser {
  const { account } = view;
  return {
    id: account.id,
    fullName: account.fullName,
    username: account.username,
    ...(account.email ? { email: account.email } : {}),
    status: account.status,
    accessStatus: !account.passwordHash
      ? 'pendingActivation'
      : account.passwordChangeRequired
        ? 'passwordChangeRequired'
        : 'active',
    permissions: view.permissions,
    version: account.version,
    deleted: false,
    ...(issued
      ? {
          accessCodeDelivery: issued.delivery,
          accessCodeExpiresAt: issued.expiresAt.toISOString(),
          ...(issued.code ? { accessCode: issued.code } : {}),
          ...(issued.deliveryFailed
            ? { warnings: ['EMAIL_DELIVERY_FAILED' as const] }
            : {}),
        }
      : {}),
  };
}

// Use cases e adapter Drizzle são ligados junto aos controllers HTTP.
const actorOf = (req: Request): AdminActor => {
  // A autenticação obrigatória precede estes controllers.
  if (!req.auth) throw new Error('Rota autenticada sem sessão resolvida');
  return { id: req.auth.user.id, username: req.auth.user.username };
};

const idOf = (req: Request, res: Response): string | undefined => {
  const id = req.params.id;
  if (typeof id === 'string' && UUID.test(id)) return id;
  sendProblem(req, res, 'RESOURCE_NOT_FOUND');
  return undefined;
};

/** Traduz os erros de aplicação para o contrato HTTP; os demais seguem ao handler global. */
const guarded =
  (handler: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        sendProblem(req, res, 'RESOURCE_NOT_FOUND');
      } else if (error instanceof UserVersionConflictError) {
        sendProblem(req, res, 'RESOURCE_VERSION_CONFLICT');
      } else if (error instanceof UsernameTakenError) {
        sendProblem(req, res, 'VALIDATION_ERROR', {
          errors: [fieldError('username', 'DUPLICATE_USERNAME')],
        });
      } else if (error instanceof ProtectedUserOperationError) {
        sendProblem(req, res, 'PROTECTED_RESOURCE', {
          detail: error.message,
        });
      } else if (error instanceof InvalidUserStateError) {
        sendProblem(req, res, 'INVALID_RESOURCE_STATE', {
          detail: error.message,
        });
      } else {
        throw error;
      }
    }
  };

const list = guarded(async (_req, res) => {
  const views = await useCases.listUsers.execute();
  res.json(views.map((view) => toAdminUser(view)));
});

const get = guarded(async (req, res) => {
  const id = idOf(req, res);
  if (!id) return;
  sendVersioned(res, toAdminUser(await useCases.getUser.execute(id)));
});

const create = guarded(async (req, res) => {
  const body = parseBody(createUserRequestSchema, req.body);
  if (!body.success) {
    sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
    return;
  }
  const result = await useCases.createUser.execute({
    actor: actorOf(req),
    fullName: body.data.fullName,
    ...(body.data.email ? { email: body.data.email } : {}),
  });
  sendVersioned(res, toAdminUser(result, result.issued), 201);
});

const update = guarded(async (req, res) => {
  const id = idOf(req, res);
  if (!id) return;
  const version = readExpectedVersion(req, res);
  if (version === undefined) return;
  const body = parseBody(updateUserRequestSchema, req.body);
  if (!body.success) {
    sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
    return;
  }
  const view = await useCases.updateUser.execute({
    actor: actorOf(req),
    userId: id,
    expectedVersion: version,
    fullName: body.data.fullName,
    username: body.data.username,
    ...(body.data.email ? { email: body.data.email } : {}),
  });
  sendVersioned(res, toAdminUser(view));
});

const setStatus = (status: 'active' | 'inactive') =>
  guarded(async (req, res) => {
    const id = idOf(req, res);
    if (!id) return;
    const version = readExpectedVersion(req, res);
    if (version === undefined) return;
    const view = await useCases.setUserStatus.execute({
      actor: actorOf(req),
      userId: id,
      expectedVersion: version,
      status,
    });
    sendVersioned(res, toAdminUser(view));
  });

const issueAccessCode = guarded(async (req, res) => {
  const id = idOf(req, res);
  if (!id) return;
  const body = parseBody(issueAccessCodeRequestSchema, req.body);
  if (!body.success) {
    sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
    return;
  }
  const result = await useCases.issueAccessCode.execute({
    actor: actorOf(req),
    userId: id,
    purpose: body.data.purpose,
  });
  // O código aparece somente nesta resposta e não deve ser armazenado em cache.
  sendVersioned(res, toAdminUser(result, result.issued), 201);
});

const replacePermissions = guarded(async (req, res) => {
  const id = idOf(req, res);
  if (!id) return;
  const version = readExpectedVersion(req, res);
  if (version === undefined) return;
  const body = parseBody(replacePermissionsRequestSchema, req.body);
  if (!body.success) {
    sendProblem(req, res, 'VALIDATION_ERROR', { errors: body.errors });
    return;
  }
  const view = await useCases.replaceUserPermissions.execute({
    actor: actorOf(req),
    userId: id,
    expectedVersion: version,
    permissions: body.data.permissions,
  });
  sendVersioned(res, toAdminUser(view));
});

const permissionCatalog: RequestHandler = (_req, res) => {
  const entries: PermissionCatalogEntry[] = permissionAreas.flatMap(
    ({ area, items }) =>
      items.map((item) => ({ id: item.id, area, label: item.label })),
  );
  res.json(entries);
};

export const adminUserControllers = {
  list,
  get,
  create,
  update,
  activate: setStatus('active'),
  deactivate: setStatus('inactive'),
  issueAccessCode,
  replacePermissions,
  permissionCatalog,
};
