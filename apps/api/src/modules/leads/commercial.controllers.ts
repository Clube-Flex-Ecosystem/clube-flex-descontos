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
  CommercialValidationError,
} from './commercial.errors';
import { clock } from '../../infrastructure/services';
import { DrizzleCommercialRepository } from './repositories/drizzle-commercial.repository';
import { ListCommercialLeadsUseCase } from './use-cases/list-commercial-leads.use-case';
import { GetCommercialLeadUseCase } from './use-cases/get-commercial-lead.use-case';
import { CreateCommercialLeadUseCase } from './use-cases/create-commercial-lead.use-case';
import { UpdateCommercialLeadUseCase } from './use-cases/update-commercial-lead.use-case';
import { ChangeLeadStageUseCase } from './use-cases/change-lead-stage.use-case';
import { AssignLeadUseCase } from './use-cases/assign-lead.use-case';
import { AddLeadObservationUseCase } from './use-cases/add-lead-observation.use-case';
import { EditLeadObservationUseCase } from './use-cases/edit-lead-observation.use-case';
import { ResolveLeadRequestUseCase } from './use-cases/resolve-lead-request.use-case';
import { RemoveCommercialLeadUseCase } from './use-cases/remove-commercial-lead.use-case';
import { GetLeadHistoryUseCase } from './use-cases/get-lead-history.use-case';
import { ListActiveAssigneesUseCase } from './use-cases/list-active-assignees.use-case';
import { DrizzleLeadSourceRepository } from './repositories/drizzle-lead-source.repository';
import { ListLeadSourcesUseCase } from './use-cases/list-lead-sources.use-case';
import { GetLeadSourceUseCase } from './use-cases/get-lead-source.use-case';
import { CreateLeadSourceUseCase } from './use-cases/create-lead-source.use-case';
import { UpdateLeadSourceUseCase } from './use-cases/update-lead-source.use-case';
import { SetLeadSourceActiveUseCase } from './use-cases/set-lead-source-active.use-case';
import { DeleteLeadSourceUseCase } from './use-cases/delete-lead-source.use-case';

const sourceRepository = new DrizzleLeadSourceRepository();
const listSources = new ListLeadSourcesUseCase(sourceRepository);
const getSource = new GetLeadSourceUseCase(sourceRepository);
const createSource = new CreateLeadSourceUseCase(sourceRepository);
const updateSource = new UpdateLeadSourceUseCase(sourceRepository);
const setSourceActive = new SetLeadSourceActiveUseCase(sourceRepository);
const deleteSource = new DeleteLeadSourceUseCase(sourceRepository);
const leadRepository = new DrizzleCommercialRepository();
const listLeads = new ListCommercialLeadsUseCase(leadRepository);
const getLead = new GetCommercialLeadUseCase(leadRepository);
const createLead = new CreateCommercialLeadUseCase(
  leadRepository,
  sourceRepository,
  clock,
);
const updateLead = new UpdateCommercialLeadUseCase(
  leadRepository,
  sourceRepository,
  clock,
);
const changeStage = new ChangeLeadStageUseCase(leadRepository, clock);
const assignLead = new AssignLeadUseCase(leadRepository, clock);
const addObservation = new AddLeadObservationUseCase(leadRepository, clock);
const editObservation = new EditLeadObservationUseCase(leadRepository, clock);
const resolveRequest = new ResolveLeadRequestUseCase(leadRepository, clock);
const removeLead = new RemoveCommercialLeadUseCase(leadRepository, clock);
const getHistory = new GetLeadHistoryUseCase(leadRepository);
const listAssignees = new ListActiveAssigneesUseCase(leadRepository);

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

export const commercialControllers = {
  leads: {
    list: wrap(async (req, res) => {
      res.json(await listLeads.execute(actor(req)));
    }),
    get: wrap(async (req, res) => {
      const i = id(req, res);
      if (i) sendVersioned(res, await getLead.execute(actor(req), i));
    }),
    create: wrap(async (req, res) => {
      const b = parsed(createLeadRequestSchema, req, res);
      if (b) sendVersioned(res, await createLead.execute(actor(req), b), 201);
    }),
    update: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(updateLeadRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(res, await updateLead.execute(actor(req), i, v, b));
    }),
    stage: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(stageTransitionRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(
          res,
          await changeStage.execute(actor(req), i, v, b.stage, b.lossReason),
        );
    }),
    assign: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(assigneeRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(
          res,
          await assignLead.execute(actor(req), i, v, b.assigneeId),
        );
    }),
    observe: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(observationRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(
          res,
          await addObservation.execute(actor(req), i, v, b.text),
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
          await editObservation.execute(actor(req), i, oid, v, b.text),
        );
    }),
    resolve: wrap(async (req, res) => {
      const i = id(req, res),
        rid = req.params.requestId,
        v = version(req, res);
      if (i && typeof rid === 'string' && UUID.test(rid) && v !== undefined)
        sendVersioned(res, await resolveRequest.execute(actor(req), i, rid, v));
    }),
    remove: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res);
      if (i && v !== undefined)
        sendVersioned(res, await removeLead.execute(actor(req), i, v));
    }),
    history: wrap(async (req, res) => {
      const i = id(req, res);
      if (i) res.json(await getHistory.execute(actor(req), i));
    }),
    assignees: wrap(async (_req, res) => {
      res.json(await listAssignees.execute());
    }),
  },
  sources: {
    list: wrap(async (_req, res) => {
      res.json(await listSources.execute());
    }),
    create: wrap(async (req, res) => {
      const b = parsed(leadSourceRequestSchema, req, res);
      if (b) sendVersioned(res, await createSource.execute(b), 201);
    }),
    get: wrap(async (req, res) => {
      const i = id(req, res);
      if (i) {
        sendVersioned(res, await getSource.execute(i));
      }
    }),
    update: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res),
        b = parsed(leadSourceRequestSchema, req, res);
      if (i && v !== undefined && b)
        sendVersioned(res, await updateSource.execute(i, v, b));
    }),
    activate: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res);
      if (i && v !== undefined)
        sendVersioned(res, await setSourceActive.execute(i, v, true));
    }),
    deactivate: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res);
      if (i && v !== undefined)
        sendVersioned(res, await setSourceActive.execute(i, v, false));
    }),
    remove: wrap(async (req, res) => {
      const i = id(req, res),
        v = version(req, res);
      if (i && v !== undefined) res.json(await deleteSource.execute(i, v));
    }),
  },
};
