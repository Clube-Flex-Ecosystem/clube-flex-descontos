import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { leadRemovalOutcome, type LeadRemoval } from '@flex/contracts';
import type {
  Lead,
  LeadHistoryEvent,
  LeadSource,
  LeadSummary,
  LeadStage,
} from '@flex/contracts';
import type { Database } from '../../infrastructure/database/drizzle/client';
import { DrizzleAuditRepository } from '../../infrastructure/database/drizzle/repositories/drizzle-audit.repository';
import {
  leadConsents,
  leadContactRequests,
  leadHistory,
  leadObservations,
  leads,
  leadSources,
  users,
} from '../../infrastructure/database/drizzle/schema';
import type { Clock } from '../identity/services.types';

export class CommercialNotFoundError extends Error {}
export class CommercialConflictError extends Error {
  constructor(
    public readonly code = 'RESOURCE_VERSION_CONFLICT',
    public readonly existingId?: string,
  ) {
    super(code);
  }
}
export class CommercialForbiddenError extends Error {}
export class CommercialValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly code: string,
  ) {
    super(code);
  }
}

type Actor = {
  id: string;
  fullName: string;
  username: string;
  permissions: readonly string[];
};

/** Valores que substituem os dados pessoais; o WhatsApp continua único entre os leads. */
const ANONYMIZED_NAME = 'Lead anonimizado';
const anonymizedWhatsapp = (leadId: string) => `anonimizado:${leadId}`;
const canSee = (actor: Actor, lead: { assigneeId: string | null }) =>
  actor.permissions.includes('leads.view-all') ||
  (actor.permissions.includes('leads.view-own') &&
    lead.assigneeId === actor.id);
const canEdit = (actor: Actor, lead: { assigneeId: string | null }) =>
  actor.permissions.includes('leads.update') &&
  (lead.assigneeId === actor.id ||
    actor.permissions.includes('leads.view-all'));

export class CommercialService {
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
  ) {}

  async listSources(): Promise<LeadSource[]> {
    const rows = await this.db
      .select({
        source: leadSources,
        usageCount: sql<number>`count(${leads.id})::int`,
      })
      .from(leadSources)
      .leftJoin(leads, eq(leads.sourceId, leadSources.id))
      .groupBy(leadSources.id)
      .orderBy(asc(leadSources.name));
    return rows.map(({ source, usageCount }) => ({ ...source, usageCount }));
  }
  async source(id: string) {
    const [s] = await this.db
      .select()
      .from(leadSources)
      .where(eq(leadSources.id, id));
    if (!s) throw new CommercialNotFoundError();
    return s;
  }
  async createSource(input: { name: string; requiresReferral: boolean }) {
    try {
      const [s] = await this.db
        .insert(leadSources)
        .values({
          name: input.name,
          kind: 'manual',
          requiresReferral: input.requiresReferral,
        })
        .returning();
      return { ...s!, usageCount: 0 };
    } catch {
      throw new CommercialConflictError('DUPLICATE_RESOURCE');
    }
  }
  async updateSource(
    id: string,
    version: number,
    input: { name: string; requiresReferral: boolean },
  ) {
    const current = await this.source(id);
    if (current.protected)
      throw new CommercialConflictError('PROTECTED_RESOURCE');
    const [s] = await this.db
      .update(leadSources)
      .set({ ...input, version: version + 1 })
      .where(and(eq(leadSources.id, id), eq(leadSources.version, version)))
      .returning();
    if (!s) throw new CommercialConflictError();
    const usage =
      (await this.listSources()).find((x) => x.id === id)?.usageCount ?? 0;
    return { ...s, usageCount: usage };
  }
  async setSourceActive(id: string, version: number, active: boolean) {
    const current = await this.source(id);
    if (current.protected && !active)
      throw new CommercialConflictError('PROTECTED_RESOURCE');
    const [s] = await this.db
      .update(leadSources)
      .set({ active, version: version + 1 })
      .where(and(eq(leadSources.id, id), eq(leadSources.version, version)))
      .returning();
    if (!s) throw new CommercialConflictError();
    const usage =
      (await this.listSources()).find((x) => x.id === id)?.usageCount ?? 0;
    return { ...s, usageCount: usage };
  }
  async deleteSource(id: string, version: number) {
    const current = await this.source(id);
    if (current.protected)
      throw new CommercialConflictError('PROTECTED_RESOURCE');
    const used =
      (await this.listSources()).find((x) => x.id === id)?.usageCount ?? 0;
    if (used) throw new CommercialConflictError('PROTECTED_RESOURCE');
    const [s] = await this.db
      .delete(leadSources)
      .where(and(eq(leadSources.id, id), eq(leadSources.version, version)))
      .returning();
    if (!s) throw new CommercialConflictError();
    return { ...s, usageCount: 0, deleted: true };
  }

  async list(actor: Actor): Promise<LeadSummary[]> {
    const rows = await this.db
      .select()
      .from(leads)
      // Leads anonimizados saem do pipeline: nenhum novo contato pode se basear neles.
      .where(sql`${leads.anonymizedAt} is null`)
      .orderBy(desc(leads.updatedAt));
    return Promise.all(
      rows.filter((l) => canSee(actor, l)).map((l) => this.summary(l)),
    );
  }
  private async summary(l: typeof leads.$inferSelect): Promise<LeadSummary> {
    const [source] = await this.db
      .select()
      .from(leadSources)
      .where(eq(leadSources.id, l.sourceId));
    const owner = l.assigneeId
      ? (
          await this.db
            .select({ id: users.id, fullName: users.fullName })
            .from(users)
            .where(eq(users.id, l.assigneeId))
        )[0]
      : undefined;
    const usage =
      (
        await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(leads)
          .where(eq(leads.sourceId, l.sourceId))
      )[0]?.count ?? 0;
    return {
      id: l.id,
      name: l.name,
      whatsapp: l.whatsapp,
      ...(l.email ? { email: l.email } : {}),
      stage: l.stage as LeadStage,
      source: { ...source!, usageCount: usage },
      ...(owner ? { assignee: owner } : {}),
      hasPendingInterest: l.hasPendingInterest,
      ...(l.anonymizedAt ? { anonymized: true } : {}),
      version: l.version,
      updatedAt: l.updatedAt.toISOString(),
    };
  }
  private async row(id: string) {
    const [l] = await this.db.select().from(leads).where(eq(leads.id, id));
    if (!l) throw new CommercialNotFoundError();
    return l;
  }
  async detail(actor: Actor, id: string): Promise<Lead> {
    const l = await this.row(id);
    if (!canSee(actor, l)) throw new CommercialNotFoundError();
    const summary = await this.summary(l);
    const observations = await this.db
      .select({
        id: leadObservations.id,
        text: leadObservations.text,
        createdAt: leadObservations.createdAt,
        updatedAt: leadObservations.updatedAt,
        authorId: users.id,
        authorName: users.fullName,
      })
      .from(leadObservations)
      .innerJoin(users, eq(users.id, leadObservations.authorUserId))
      .where(eq(leadObservations.leadId, id))
      .orderBy(desc(leadObservations.createdAt));
    const requests = await this.db
      .select({
        request: leadContactRequests,
        resolverId: users.id,
        resolverName: users.fullName,
      })
      .from(leadContactRequests)
      .leftJoin(users, eq(users.id, leadContactRequests.resolvedBy))
      .where(eq(leadContactRequests.leadId, id))
      .orderBy(desc(leadContactRequests.createdAt));
    return {
      ...summary,
      ...(l.sourceDetail ? { sourceDetail: l.sourceDetail } : {}),
      ...(l.referredBy ? { referredBy: l.referredBy } : {}),
      ...(l.lossReason ? { lossReason: l.lossReason } : {}),
      observations: observations.map((o) => ({
        id: o.id,
        text: o.text,
        author: { id: o.authorId, fullName: o.authorName },
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
      contactRequests: requests.map(
        ({ request: r, resolverId, resolverName }) => ({
          id: r.id,
          submittedName: r.submittedName,
          submittedWhatsapp: r.submittedWhatsapp,
          ...(r.submittedEmail ? { submittedEmail: r.submittedEmail } : {}),
          source: r.source,
          createdAt: r.createdAt.toISOString(),
          ...(r.resolvedAt ? { resolvedAt: r.resolvedAt.toISOString() } : {}),
          ...(resolverId && resolverName
            ? { resolvedBy: { id: resolverId, fullName: resolverName } }
            : {}),
        }),
      ),
    };
  }
  private async event(
    leadId: string,
    type: string,
    actor: Actor,
    data?: Record<string, unknown>,
  ) {
    await this.db.insert(leadHistory).values({
      leadId,
      type,
      actorUserId: actor.id,
      occurredAt: this.clock.now(),
      data,
    });
  }
  private async assertVersion(
    id: string,
    version: number,
    actor: Actor,
    edit = false,
  ) {
    const l = await this.row(id);
    if (!canSee(actor, l)) throw new CommercialNotFoundError();
    // Um lead anonimizado preserva apenas a rastreabilidade e não aceita alterações.
    if (l.anonymizedAt)
      throw new CommercialConflictError('INVALID_RESOURCE_STATE');
    if (edit && !canEdit(actor, l)) throw new CommercialForbiddenError();
    if (l.version !== version) throw new CommercialConflictError();
    return l;
  }
  async create(
    actor: Actor,
    input: {
      name: string;
      whatsapp: string;
      email?: string;
      sourceId: string;
      sourceDetail?: string;
      referredBy?: string;
      leaveUnassigned: boolean;
    },
  ) {
    const source = await this.source(input.sourceId);
    if (!source.active || source.kind !== 'manual')
      throw new CommercialValidationError('sourceId', 'INVALID_VALUE');
    if (source.requiresReferral && !input.referredBy)
      throw new CommercialValidationError('referredBy', 'REQUIRED');
    const duplicate = (
      await this.db
        .select({ id: leads.id, assigneeId: leads.assigneeId })
        .from(leads)
        .where(eq(leads.whatsapp, input.whatsapp))
    )[0];
    if (duplicate)
      throw new CommercialConflictError(
        'DUPLICATE_RESOURCE',
        canSee(actor, duplicate) ? duplicate.id : undefined,
      );
    const now = this.clock.now();
    const [l] = await this.db
      .insert(leads)
      .values({
        ...input,
        assigneeId: input.leaveUnassigned ? null : actor.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await this.event(l!.id, 'lead.created', actor, {
      sourceId: input.sourceId,
    });
    return this.detail(actor, l!.id);
  }
  async update(
    actor: Actor,
    id: string,
    version: number,
    input: {
      name: string;
      whatsapp: string;
      email?: string;
      sourceId: string;
      sourceDetail?: string;
      referredBy?: string;
    },
  ) {
    const old = await this.assertVersion(id, version, actor, true);
    const source = await this.source(input.sourceId);
    if (!source.active && source.id !== old.sourceId)
      throw new CommercialValidationError('sourceId', 'INVALID_VALUE');
    if (source.requiresReferral && !input.referredBy)
      throw new CommercialValidationError('referredBy', 'REQUIRED');
    const dupe = (
      await this.db
        .select({ id: leads.id })
        .from(leads)
        .where(
          and(eq(leads.whatsapp, input.whatsapp), sql`${leads.id} <> ${id}`),
        )
    )[0];
    if (dupe) throw new CommercialConflictError('DUPLICATE_RESOURCE', dupe.id);
    const now = this.clock.now();
    await this.db
      .update(leads)
      .set({ ...input, version: version + 1, updatedAt: now })
      .where(eq(leads.id, id));
    await this.event(
      id,
      old.sourceId !== input.sourceId
        ? 'lead.source-changed'
        : 'lead.contact-updated',
      actor,
      { previousSourceId: old.sourceId },
    );
    return this.detail(actor, id);
  }
  async stage(
    actor: Actor,
    id: string,
    version: number,
    stage: LeadStage,
    lossReason?: string,
  ) {
    const old = await this.assertVersion(id, version, actor);
    if (
      !actor.permissions.includes('leads.change-stage') ||
      (!canEdit(actor, old) && old.assigneeId !== actor.id)
    )
      throw new CommercialForbiddenError();
    const now = this.clock.now();
    await this.db
      .update(leads)
      .set({
        stage,
        lossReason: stage === 'lost' ? lossReason : null,
        version: version + 1,
        updatedAt: now,
      })
      .where(eq(leads.id, id));
    await this.event(id, 'lead.stage-changed', actor, {
      from: old.stage,
      to: stage,
      lossReason,
    });
    return this.detail(actor, id);
  }
  async assign(
    actor: Actor,
    id: string,
    version: number,
    assigneeId: string | null,
  ) {
    const old = await this.assertVersion(id, version, actor);
    const selfReturn = old.assigneeId === actor.id && assigneeId === null;
    if (!selfReturn && !actor.permissions.includes('leads.assign'))
      throw new CommercialForbiddenError();
    if (assigneeId) {
      const [u] = await this.db
        .select()
        .from(users)
        .where(and(eq(users.id, assigneeId), eq(users.status, 'active')));
      if (!u)
        throw new CommercialValidationError('assigneeId', 'INVALID_VALUE');
    }
    const now = this.clock.now();
    await this.db
      .update(leads)
      .set({ assigneeId, version: version + 1, updatedAt: now })
      .where(eq(leads.id, id));
    await this.event(id, 'lead.assignee-changed', actor, {
      from: old.assigneeId,
      to: assigneeId,
    });
    // A devolução remove o lead do escopo "próprios", mas a própria mutação ainda
    // devolve a representação completa confirmada para reconciliar o cache.
    return this.detail(
      { ...actor, permissions: [...actor.permissions, 'leads.view-all'] },
      id,
    );
  }
  async addObservation(
    actor: Actor,
    id: string,
    version: number,
    text: string,
  ) {
    await this.assertVersion(id, version, actor, true);
    const now = this.clock.now();
    const [o] = await this.db
      .insert(leadObservations)
      .values({
        leadId: id,
        authorUserId: actor.id,
        text,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await this.db
      .update(leads)
      .set({ version: version + 1, updatedAt: now })
      .where(eq(leads.id, id));
    await this.event(id, 'lead.observation-created', actor, {
      observationId: o!.id,
    });
    return this.detail(actor, id);
  }
  async editObservation(
    actor: Actor,
    id: string,
    observationId: string,
    version: number,
    text: string,
  ) {
    await this.assertVersion(id, version, actor, true);
    const [old] = await this.db
      .select()
      .from(leadObservations)
      .where(
        and(
          eq(leadObservations.id, observationId),
          eq(leadObservations.leadId, id),
        ),
      );
    if (!old) throw new CommercialNotFoundError();
    if (old.authorUserId !== actor.id) throw new CommercialForbiddenError();
    const now = this.clock.now();
    await this.db
      .update(leadObservations)
      .set({ text, updatedAt: now })
      .where(eq(leadObservations.id, observationId));
    await this.db
      .update(leads)
      .set({ version: version + 1, updatedAt: now })
      .where(eq(leads.id, id));
    await this.event(id, 'lead.observation-corrected', actor, {
      observationId,
      previousText: old.text,
    });
    return this.detail(actor, id);
  }
  async resolve(actor: Actor, id: string, requestId: string, version: number) {
    await this.assertVersion(id, version, actor, true);
    const now = this.clock.now();
    const [r] = await this.db
      .update(leadContactRequests)
      .set({ resolvedAt: now, resolvedBy: actor.id })
      .where(
        and(
          eq(leadContactRequests.id, requestId),
          eq(leadContactRequests.leadId, id),
          sql`${leadContactRequests.resolvedAt} is null`,
        ),
      )
      .returning();
    if (!r) throw new CommercialNotFoundError();
    const pending =
      (
        await this.db
          .select({ id: leadContactRequests.id })
          .from(leadContactRequests)
          .where(
            and(
              eq(leadContactRequests.leadId, id),
              sql`${leadContactRequests.resolvedAt} is null`,
            ),
          )
      ).length > 0;
    await this.db
      .update(leads)
      .set({
        hasPendingInterest: pending,
        version: version + 1,
        updatedAt: now,
      })
      .where(eq(leads.id, id));
    await this.event(id, 'contact-request.resolved', actor, { requestId });
    return this.detail(actor, id);
  }
  async history(actor: Actor, id: string): Promise<LeadHistoryEvent[]> {
    const l = await this.row(id);
    if (!canSee(actor, l)) throw new CommercialNotFoundError();
    const rows = await this.db
      .select({
        event: leadHistory,
        actorId: users.id,
        actorName: users.fullName,
      })
      .from(leadHistory)
      .leftJoin(users, eq(users.id, leadHistory.actorUserId))
      .where(eq(leadHistory.leadId, id))
      .orderBy(desc(leadHistory.occurredAt));
    return rows.map(({ event: e, actorId, actorName }) => ({
      id: e.id,
      type: e.type,
      occurredAt: e.occurredAt.toISOString(),
      ...(actorId && actorName
        ? { actor: { id: actorId, fullName: actorName } }
        : {}),
      ...(e.data ? { data: e.data as Record<string, unknown> } : {}),
    }));
  }
  /**
   * Atende a revogação de consentimento (UC-022): exclui o lead quando nada operacional
   * precisa ser preservado e, caso contrário, anonimiza seus dados pessoais. A auditoria
   * registra a operação sem repetir os dados pessoais removidos.
   */
  async remove(
    actor: Actor,
    id: string,
    version: number,
  ): Promise<LeadRemoval> {
    const current = await this.row(id);
    if (!canSee(actor, current)) throw new CommercialNotFoundError();
    const lastRepresentation = await this.detail(actor, id);
    // Idempotente: um lead já anonimizado retorna a representação atual.
    if (current.anonymizedAt) {
      return { ...lastRepresentation, deleted: false, anonymized: true };
    }
    if (current.version !== version) throw new CommercialConflictError();

    const history = await this.db
      .select({ type: leadHistory.type })
      .from(leadHistory)
      .where(eq(leadHistory.leadId, id));
    const outcome = leadRemovalOutcome({
      observationCount: lastRepresentation.observations.length,
      eventTypes: history.map((event) => event.type),
    });
    const now = this.clock.now();

    await this.db.transaction(async (tx) => {
      const audit = new DrizzleAuditRepository(tx);
      const record = {
        occurredAt: now,
        actorUserId: actor.id,
        actorLabel: actor.username,
        targetType: 'lead',
        targetId: id,
        // Somente o início do identificador: nenhum dado pessoal integra a auditoria.
        targetLabel: `Lead ${id.slice(0, 8)}`,
      };

      if (outcome === 'delete') {
        await tx.delete(leadConsents).where(eq(leadConsents.leadId, id));
        await tx
          .delete(leadContactRequests)
          .where(eq(leadContactRequests.leadId, id));
        await tx.delete(leadHistory).where(eq(leadHistory.leadId, id));
        const removed = await tx
          .delete(leads)
          .where(and(eq(leads.id, id), eq(leads.version, version)))
          .returning({ id: leads.id });
        if (removed.length === 0) throw new CommercialConflictError();
        await audit.record({
          ...record,
          action: 'lead.deleted',
          before: { personalData: 'present', stage: current.stage },
          after: { personalData: 'deleted' },
        });
        return;
      }

      const [updated] = await tx
        .update(leads)
        .set({
          name: ANONYMIZED_NAME,
          whatsapp: anonymizedWhatsapp(id),
          email: null,
          referredBy: null,
          hasPendingInterest: false,
          anonymizedAt: now,
          version: version + 1,
          updatedAt: now,
        })
        .where(and(eq(leads.id, id), eq(leads.version, version)))
        .returning({ id: leads.id });
      if (!updated) throw new CommercialConflictError();
      // O que o formulário público enviou também é dado pessoal.
      await tx
        .update(leadContactRequests)
        .set({
          submittedName: ANONYMIZED_NAME,
          submittedWhatsapp: anonymizedWhatsapp(id),
          submittedEmail: null,
        })
        .where(eq(leadContactRequests.leadId, id));
      await tx.insert(leadHistory).values({
        leadId: id,
        type: 'lead.anonymized',
        actorUserId: actor.id,
        occurredAt: now,
      });
      await audit.record({
        ...record,
        action: 'lead.anonymized',
        before: { personalData: 'present', stage: current.stage },
        after: { personalData: 'anonymized' },
      });
    });

    if (outcome === 'delete') {
      return { ...lastRepresentation, deleted: true, anonymized: false };
    }
    // A leitura usa a linha confirmada, ainda que o ator tenha perdido o escopo próprio.
    const confirmed = await this.detail(
      { ...actor, permissions: [...actor.permissions, 'leads.view-all'] },
      id,
    );
    return { ...confirmed, deleted: false, anonymized: true };
  }

  async activeUsers() {
    return this.db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.status, 'active'))
      .orderBy(asc(users.fullName));
  }
}
