export interface NewAuditEvent {
    action: string;
    occurredAt: Date;
    /** Usuário autor; nulo para atores técnicos como seeds e tarefas internas. */
    actorUserId: string | null;
    actorLabel: string;
    targetType: string;
    targetId?: string;
    targetLabel?: string;
    /** Nunca contém senhas, códigos, sessões ou outros segredos. */
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
}

export interface StoredAuditEvent {
    id: string;
    action: string;
    occurredAt: Date;
    actorUserId: string | null;
    actorLabel: string;
    targetType: string;
    targetId?: string;
    targetLabel?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
}

export interface AuditFilter {
    actorId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    occurredFrom?: Date;
    occurredTo?: Date;
}

export interface AuditRepository {
    record(event: NewAuditEvent): Promise<void>;
    /** Do evento mais recente para o mais antigo; `total` considera os filtros. */
    list(
        filter: AuditFilter,
        page: { offset: number; limit: number },
    ): Promise<{ items: StoredAuditEvent[]; total: number }>;
    find(id: string): Promise<StoredAuditEvent | null>;
}
