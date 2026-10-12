import type { Request, RequestHandler, Response } from 'express';
import {
    assigneeRequestSchema,
    createLeadRequestSchema,
    leadSourceRequestSchema,
    observationRequestSchema,
    stageTransitionRequestSchema,
    updateLeadRequestSchema,
} from '@flex/contracts';
import { HttpError } from '../../errors/app-error';
import { readExpectedVersion, sendVersioned } from '../../http/versioning';
import { clock } from '../../infrastructure/clock';
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
const id = (req: Request, _res: Response) => {
    void _res;
    const value = req.params.id;
    if (typeof value !== 'string' || !UUID.test(value)) {
        throw new HttpError('RESOURCE_NOT_FOUND');
    }
    return value;
};
const version = (req: Request, res: Response) => readExpectedVersion(req, res);
const parsed = <T>(
    schema: {
        parse: (value: unknown) => T;
    },
    req: Request,
): T | undefined => {
    return schema.parse(req.body);
};

export const listCommercialLeadsController: RequestHandler = async (
    req,
    res,
) => {
    res.json(await listLeads.execute(actor(req)));
};

export const getCommercialLeadController: RequestHandler = async (req, res) => {
    const i = id(req, res);
    if (i) sendVersioned(res, await getLead.execute(actor(req), i));
};

export const createCommercialLeadController: RequestHandler = async (
    req,
    res,
) => {
    const b = parsed(createLeadRequestSchema, req);
    if (b) sendVersioned(res, await createLead.execute(actor(req), b), 201);
};

export const updateCommercialLeadController: RequestHandler = async (
    req,
    res,
) => {
    const i = id(req, res),
        v = version(req, res),
        b = parsed(updateLeadRequestSchema, req);
    if (i && v !== undefined && b)
        sendVersioned(res, await updateLead.execute(actor(req), i, v, b));
};

export const changeLeadStageController: RequestHandler = async (req, res) => {
    const i = id(req, res),
        v = version(req, res),
        b = parsed(stageTransitionRequestSchema, req);
    if (i && v !== undefined && b)
        sendVersioned(
            res,
            await changeStage.execute(actor(req), i, v, b.stage, b.lossReason),
        );
};

export const assignLeadController: RequestHandler = async (req, res) => {
    const i = id(req, res),
        v = version(req, res),
        b = parsed(assigneeRequestSchema, req);
    if (i && v !== undefined && b)
        sendVersioned(
            res,
            await assignLead.execute(actor(req), i, v, b.assigneeId),
        );
};

export const addLeadObservationController: RequestHandler = async (
    req,
    res,
) => {
    const i = id(req, res),
        v = version(req, res),
        b = parsed(observationRequestSchema, req);
    if (i && v !== undefined && b)
        sendVersioned(
            res,
            await addObservation.execute(actor(req), i, v, b.text),
            201,
        );
};

export const editLeadObservationController: RequestHandler = async (
    req,
    res,
) => {
    const i = id(req, res),
        oid = req.params.observationId,
        v = version(req, res),
        b = parsed(observationRequestSchema, req);
    if (i && typeof oid === 'string' && UUID.test(oid) && v !== undefined && b)
        sendVersioned(
            res,
            await editObservation.execute(actor(req), i, oid, v, b.text),
        );
};

export const resolveLeadRequestController: RequestHandler = async (
    req,
    res,
) => {
    const i = id(req, res),
        rid = req.params.requestId,
        v = version(req, res);
    if (i && typeof rid === 'string' && UUID.test(rid) && v !== undefined)
        sendVersioned(res, await resolveRequest.execute(actor(req), i, rid, v));
};

export const removeCommercialLeadController: RequestHandler = async (
    req,
    res,
) => {
    const i = id(req, res),
        v = version(req, res);
    if (i && v !== undefined)
        sendVersioned(res, await removeLead.execute(actor(req), i, v));
};

export const getLeadHistoryController: RequestHandler = async (req, res) => {
    const i = id(req, res);
    if (i) res.json(await getHistory.execute(actor(req), i));
};

export const listLeadAssigneesController: RequestHandler = async (
    _req,
    res,
) => {
    res.json(await listAssignees.execute());
};

export const listLeadSourcesController: RequestHandler = async (_req, res) => {
    res.json(await listSources.execute());
};

export const createLeadSourceController: RequestHandler = async (req, res) => {
    const b = parsed(leadSourceRequestSchema, req);
    if (b) sendVersioned(res, await createSource.execute(b), 201);
};

export const getLeadSourceController: RequestHandler = async (req, res) => {
    const i = id(req, res);
    if (i) {
        sendVersioned(res, await getSource.execute(i));
    }
};

export const updateLeadSourceController: RequestHandler = async (req, res) => {
    const i = id(req, res),
        v = version(req, res),
        b = parsed(leadSourceRequestSchema, req);
    if (i && v !== undefined && b)
        sendVersioned(res, await updateSource.execute(i, v, b));
};

export const activateLeadSourceController: RequestHandler = async (
    req,
    res,
) => {
    const i = id(req, res),
        v = version(req, res);
    if (i && v !== undefined)
        sendVersioned(res, await setSourceActive.execute(i, v, true));
};

export const deactivateLeadSourceController: RequestHandler = async (
    req,
    res,
) => {
    const i = id(req, res),
        v = version(req, res);
    if (i && v !== undefined)
        sendVersioned(res, await setSourceActive.execute(i, v, false));
};

export const removeLeadSourceController: RequestHandler = async (req, res) => {
    const i = id(req, res),
        v = version(req, res);
    if (i && v !== undefined) res.json(await deleteSource.execute(i, v));
};
