export interface NewAuditEvent {
  action: string;
  occurredAt: Date;
  /** Usuário autor; nulo para atores técnicos como `system/bootstrap`. */
  actorUserId: string | null;
  actorLabel: string;
  targetType: string;
  targetId?: string;
  targetLabel?: string;
  /** Nunca contém senhas, códigos, sessões ou outros segredos. */
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AuditRepository {
  record(event: NewAuditEvent): Promise<void>;
}
