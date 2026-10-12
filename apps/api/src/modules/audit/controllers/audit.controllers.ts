import type { Request, RequestHandler } from 'express';
import {
  auditQuerySchema,
  type AuditEvent,
  type AuditEventPage,
} from '@flex/contracts';
import { HttpError } from '../../../errors/app-error';
import { DrizzleAuditRepository } from '../repositories/drizzle-audit.repository';
import type { StoredAuditEvent } from '../repositories/audit.repository';
import { QueryAuditEventsUseCase } from '../use-cases/query-audit-events.use-case';

const useCase = new QueryAuditEventsUseCase(new DrizzleAuditRepository());

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

// Consulta da auditoria composta diretamente no controller.
const list: RequestHandler = async (req: Request, res) => {
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
    throw new HttpError('RESOURCE_NOT_FOUND');
  }
  res.json(toRepresentation(await useCase.get(id)));
};

export const auditControllers = { list, get };
