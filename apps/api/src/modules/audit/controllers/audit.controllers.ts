import type { Request, RequestHandler } from 'express';
import {
  auditQuerySchema,
  type AuditEvent,
  type AuditEventPage,
} from '@flex/contracts';
import { sendProblem } from '../../../http/problem';
import { parseBody } from '../../../http/validation';
import type { StoredAuditEvent } from '../repositories/audit.repository.types';
import {
  AuditEventNotFoundError,
  type QueryAuditEventsUseCase,
} from '../use-cases/query-audit-events.use-case';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Montagem explícita da saída: nada do registro persistido é serializado diretamente. */
function toRepresentation(event: StoredAuditEvent): AuditEvent {
  return {
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
}

export function createAuditControllers(useCase: QueryAuditEventsUseCase) {
  const list: RequestHandler = async (req: Request, res) => {
    const query = parseBody(auditQuerySchema, req.query);
    if (!query.success) {
      sendProblem(req, res, 'VALIDATION_ERROR', { errors: query.errors });
      return;
    }
    const { page, pageSize, occurredFrom, occurredTo, ...rest } = query.data;
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
      items: result.items.map(toRepresentation),
      page,
      pageSize,
      total: result.total,
    };
    res.json(body);
  };

  const get: RequestHandler = async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !UUID.test(id)) {
      sendProblem(req, res, 'RESOURCE_NOT_FOUND');
      return;
    }
    try {
      res.json(toRepresentation(await useCase.get(id)));
    } catch (error) {
      if (error instanceof AuditEventNotFoundError) {
        sendProblem(req, res, 'RESOURCE_NOT_FOUND');
        return;
      }
      throw error;
    }
  };

  return { list, get };
}
