import type { Request, RequestHandler, Response } from 'express';
import {
  assigneeRequestSchema,
  createLeadRequestSchema,
  leadSourceRequestSchema,
  observationRequestSchema,
  stageTransitionRequestSchema,
  updateLeadRequestSchema,
  type ErrorCode,
  type FieldErrorCode,
} from '@flex/contracts';
import { sendProblem } from '../../http/problem';
import { parseBody, fieldError } from '../../http/validation';
import { readExpectedVersion, sendVersioned } from '../../http/versioning';
import {
  CommercialConflictError,
  CommercialForbiddenError,
  CommercialNotFoundError,
  CommercialService,
  CommercialValidationError,
} from './commercial.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function actor(req: Request) {
  const a = req.auth!;
  return {
    id: a.user.id,
    fullName: a.user.fullName,
    username: a.user.username,
    permissions: a.permissions,
  };
}
function fail(error: unknown, req: Request, res: Response) {
  if (error instanceof CommercialNotFoundError)
    sendProblem(req, res, 'RESOURCE_NOT_FOUND');
  else if (error instanceof CommercialForbiddenError)
    sendProblem(req, res, 'PERMISSION_DENIED');
  else if (error instanceof CommercialValidationError)
    sendProblem(req, res, 'VALIDATION_ERROR', {
      errors: [fieldError(error.field, error.code as FieldErrorCode)],
    });
  else if (error instanceof CommercialConflictError)
    sendProblem(req, res, error.code as ErrorCode, {
      ...(error.existingId ? { detail: error.existingId } : {}),
    });
  else throw error;
}
const wrap =
  (handler: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      fail(e, req, res);
    }
  };
const id = (req: Request, res: Response) => {
  const value = req.params.id;
  if (typeof value !== 'string' || !UUID.test(value)) {
    sendProblem(req, res, 'RESOURCE_NOT_FOUND');
    return;
  }
  return value;
};
const version = (req: Request, res: Response) => readExpectedVersion(req, res);
const parsed = <T>(
  schema: {
    safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown };
  },
  req: Request,
  res: Response,
): T | undefined => {
  const p = parseBody(schema as never, req.body);
  if (!p.success) {
    sendProblem(req, res, 'VALIDATION_ERROR', { errors: p.errors });
    return;
  }
  return p.data as T;
};

export function createCommercialControllers(service: CommercialService) {
  const leads = {
    list: wrap(async (req, res) => {
      res.json(await service.list(actor(req)));
    }),
    get: wrap(async (req, res) => {
      const i = id(req, res);
      if (i) sendVersioned(res, await service.detail(actor(req), i));
    }),
    create: wrap(async (req, res) => {
      const b = parsed(createLeadRequestSchema, req, res);
      if (b) sendVersioned(res, await service.create(actor(req), b), 201);
    }),
    update: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(updateLeadRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(res, await service.update(actor(req), i, v, b));
    }),
    stage: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(stageTransitionRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(
          res,
          await service.stage(actor(req), i, v, b.stage, b.lossReason),
        );
    }),
    assign: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(assigneeRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(
          res,
          await service.assign(actor(req), i, v, b.assigneeId),
        );
    }),
    observe: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(observationRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(
          res,
          await service.addObservation(actor(req), i, v, b.text),
          201,
        );
    }),
    editObservation: wrap(async (req, res) => {
      const i = id(req, res),
        oid = req.params.observationId,
        v = version(req, res),
        b = parsed(observationRequestSchema, req, res);
      if (
        i &&
        typeof oid === 'string' &&
        UUID.test(oid) &&
        v !== undefined &&
        b
      )
        sendVersioned(
          res,
          await service.editObservation(actor(req), i, oid, v, b.text),
        );
    }),
    resolve: wrap(async (req, res) => {
      const i = id(req, res),
        rid = req.params.requestId,
        v = version(req, res);
      if (i && typeof rid === 'string' && UUID.test(rid) && v !== undefined)
        sendVersioned(res, await service.resolve(actor(req), i, rid, v));
    }),
    remove: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res);
      if (i && v !== undefined)
        sendVersioned(res, await service.remove(actor(req), i, v));
    }),
    history: wrap(async (req, res) => {
      const i = id(req, res);
      if (i) res.json(await service.history(actor(req), i));
    }),
    assignees: wrap(async (_req, res) => {
      res.json(await service.activeUsers());
    }),
  };
  const sources = {
    list: wrap(async (_req, res) => {
      res.json(await service.listSources());
    }),
    create: wrap(async (req, res) => {
      const b = parsed(leadSourceRequestSchema, req, res);
      if (b) sendVersioned(res, await service.createSource(b), 201);
    }),
    get: wrap(async (req, res) => {
      const i = id(req, res);
      if (i) {
        const all = await service.listSources();
        const s = all.find((x) => x.id === i);
        if (!s) throw new CommercialNotFoundError();
        sendVersioned(res, s);
      }
    }),
    update: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(leadSourceRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(res, await service.updateSource(i, v, b));
    }),
    activate: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res);
      if (i && v !== undefined)
        sendVersioned(res, await service.setSourceActive(i, v, true));
    }),
    deactivate: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res);
      if (i && v !== undefined)
        sendVersioned(res, await service.setSourceActive(i, v, false));
    }),
    remove: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res);
      if (i && v !== undefined) res.json(await service.deleteSource(i, v));
    }),
  };
  return { leads, sources };
}
