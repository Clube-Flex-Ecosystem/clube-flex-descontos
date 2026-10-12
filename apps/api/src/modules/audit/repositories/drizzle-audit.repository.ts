import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type {
  AuditFilter,
  AuditRepository,
  NewAuditEvent,
  StoredAuditEvent,
} from './audit.repository';
import {
  db,
  type DatabaseExecutor,
} from '../../../infrastructure/database/drizzle/client';
import { auditEvents } from '../../../infrastructure/database/drizzle/schema';

type AuditRow = typeof auditEvents.$inferSelect;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

function toStored(row: AuditRow): StoredAuditEvent {
  const before = asRecord(row.before);
  const after = asRecord(row.after);
  return {
    id: row.id,
    action: row.action,
    occurredAt: row.occurredAt,
    actorUserId: row.actorUserId,
    actorLabel: row.actorLabel,
    targetType: row.targetType,
    ...(row.targetId ? { targetId: row.targetId } : {}),
    ...(row.targetLabel ? { targetLabel: row.targetLabel } : {}),
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
  };
}

export class DrizzleAuditRepository implements AuditRepository {
  private transaction?: DatabaseExecutor;

  private get db(): DatabaseExecutor {
    return this.transaction ?? db;
  }

  /** Escopo interno usado somente por Unit of Work. */
  withTransaction(transaction: DatabaseExecutor): this {
    this.transaction = transaction;
    return this;
  }

  async record(event: NewAuditEvent): Promise<void> {
    await this.db.insert(auditEvents).values({
      action: event.action,
      occurredAt: event.occurredAt,
      actorUserId: event.actorUserId,
      actorLabel: event.actorLabel,
      targetType: event.targetType,
      targetId: event.targetId ?? null,
      targetLabel: event.targetLabel ?? null,
      before: event.before ?? null,
      after: event.after ?? null,
    });
  }

  async list(
    filter: AuditFilter,
    page: { offset: number; limit: number },
  ): Promise<{ items: StoredAuditEvent[]; total: number }> {
    const conditions: SQL[] = [];
    if (filter.actorId)
      conditions.push(eq(auditEvents.actorUserId, filter.actorId));
    if (filter.action) conditions.push(eq(auditEvents.action, filter.action));
    if (filter.targetType)
      conditions.push(eq(auditEvents.targetType, filter.targetType));
    if (filter.targetId)
      conditions.push(eq(auditEvents.targetId, filter.targetId));
    if (filter.occurredFrom)
      conditions.push(gte(auditEvents.occurredAt, filter.occurredFrom));
    if (filter.occurredTo)
      conditions.push(lte(auditEvents.occurredAt, filter.occurredTo));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(auditEvents)
        .where(where)
        // O identificador desempata eventos simultâneos para uma paginação estável.
        .orderBy(desc(auditEvents.occurredAt), desc(auditEvents.id))
        .limit(page.limit)
        .offset(page.offset),
      this.db.select({ total: count() }).from(auditEvents).where(where),
    ]);
    return { items: rows.map(toStored), total: totals[0]?.total ?? 0 };
  }

  async find(id: string): Promise<StoredAuditEvent | null> {
    const [row] = await this.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.id, id));
    return row ? toStored(row) : null;
  }
}
