import type {
  AuditRepository,
  NewAuditEvent,
} from '../../../../modules/audit/repositories/audit.repository.types';
import type { DatabaseExecutor } from '../client';
import { auditEvents } from '../schema';

export class DrizzleAuditRepository implements AuditRepository {
  constructor(private readonly db: DatabaseExecutor) {}

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
}
