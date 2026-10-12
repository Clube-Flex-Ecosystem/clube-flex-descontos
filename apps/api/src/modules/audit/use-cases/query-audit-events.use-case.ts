import { AppError } from '../../../errors/app-error';
import type {
  AuditFilter,
  AuditRepository,
  StoredAuditEvent,
} from '../repositories/audit.repository';

export class AuditEventNotFoundError extends AppError {
  constructor() {
    super('RESOURCE_NOT_FOUND');
  }
}

/** Consulta somente leitura: a auditoria é imutável e não possui operações de escrita. */
export class QueryAuditEventsUseCase {
  constructor(private readonly audit: AuditRepository) {}

  list(input: {
    filter: AuditFilter;
    page: number;
    pageSize: number;
  }): Promise<{ items: StoredAuditEvent[]; total: number }> {
    return this.audit.list(input.filter, {
      offset: (input.page - 1) * input.pageSize,
      limit: input.pageSize,
    });
  }

  async get(id: string): Promise<StoredAuditEvent> {
    const event = await this.audit.find(id);
    if (!event) throw new AuditEventNotFoundError();
    return event;
  }
}
