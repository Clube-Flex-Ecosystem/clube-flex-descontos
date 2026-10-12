import type { Request, RequestHandler } from 'express';
import {
    auditQuerySchema,
    type AuditEvent,
    type AuditEventPage,
} from '@flex/contracts';
import { HttpError } from '../../../errors/app-error';
import { DrizzleAuditRepository } from '../repositories/drizzle-audit.repository';
import { QueryAuditEventsUseCase } from '../use-cases/query-audit-events.use-case';

const useCase = new QueryAuditEventsUseCase(new DrizzleAuditRepository());

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Consulta da auditoria composta diretamente no controller.
export const listAuditEventsController: RequestHandler = async (
    req: Request,
    res,
) => {
    const query = auditQuerySchema.parse(req.query);
    const { page, pageSize, occurredFrom, occurredTo, ...rest } = query;
    const result = await useCase.list({
        page,
        pageSize,
        filter: {
            ...rest,
            ...(occurredFrom ? { occurredFrom: new Date(occurredFrom) } : {}),
            ...(occurredTo ? { occurredTo: new Date(occurredTo) } : {}),
        },
    });
    const body: AuditEventPage = {
        items: result.items.map((event) => ({
            id: event.id,
            action: event.action,
            occurredAt: event.occurredAt.toISOString(),
            actor: {
                ...(event.actorUserId ? { id: event.actorUserId } : {}),
                username: event.actorLabel,
            },
            target: {
                type: event.targetType,
                ...(event.targetId ? { id: event.targetId } : {}),
                ...(event.targetLabel ? { label: event.targetLabel } : {}),
            },
            ...(event.before ? { before: event.before } : {}),
            ...(event.after ? { after: event.after } : {}),
        })),
        page,
        pageSize,
        total: result.total,
    };
    res.json(body);
};

export const getAuditEventController: RequestHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !UUID.test(id)) {
        throw new HttpError('RESOURCE_NOT_FOUND');
    }
    const event = await useCase.get(id);
    const body: AuditEvent = {
        id: event.id,
        action: event.action,
        occurredAt: event.occurredAt.toISOString(),
        actor: {
            ...(event.actorUserId ? { id: event.actorUserId } : {}),
            username: event.actorLabel,
        },
        target: {
            type: event.targetType,
            ...(event.targetId ? { id: event.targetId } : {}),
            ...(event.targetLabel ? { label: event.targetLabel } : {}),
        },
        ...(event.before ? { before: event.before } : {}),
        ...(event.after ? { after: event.after } : {}),
    };
    res.json(body);
};
