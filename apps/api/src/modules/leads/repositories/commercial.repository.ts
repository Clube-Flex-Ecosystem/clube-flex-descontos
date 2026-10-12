import type {
    Lead,
    LeadHistoryEvent,
    LeadStage,
    LeadSummary,
} from '@flex/contracts';

export interface LeadRecord {
    id: string;
    name: string;
    whatsapp: string;
    email: string | null;
    sourceId: string;
    sourceDetail: string | null;
    referredBy: string | null;
    assigneeId: string | null;
    stage: LeadStage;
    lossReason: string | null;
    hasPendingInterest: boolean;
    version: number;
    anonymizedAt: Date | null;
    updatedAt: Date;
}

export interface ObservationRecord {
    id: string;
    authorUserId: string;
    text: string;
}

export interface LeadChanges {
    name?: string;
    whatsapp?: string;
    email?: string;
    sourceId?: string;
    sourceDetail?: string;
    referredBy?: string;
    stage?: LeadStage;
    lossReason?: string | null;
    assigneeId?: string | null;
    hasPendingInterest?: boolean;
    version?: number;
}

export interface CommercialRepository {
    listRows(): Promise<LeadRecord[]>;
    row(id: string): Promise<LeadRecord | null>;
    summary(lead: LeadRecord): Promise<LeadSummary>;
    detail(lead: LeadRecord): Promise<Lead>;
    duplicate(
        whatsapp: string,
        exceptId?: string,
    ): Promise<{ id: string; assigneeId: string | null } | null>;
    create(
        input: {
            name: string;
            whatsapp: string;
            email?: string;
            sourceId: string;
            sourceDetail?: string;
            referredBy?: string;
            assigneeId: string | null;
        },
        now: Date,
    ): Promise<string>;
    update(id: string, changes: LeadChanges, now: Date): Promise<void>;
    event(
        leadId: string,
        type: string,
        actorId: string,
        now: Date,
        data?: Record<string, unknown>,
    ): Promise<void>;
    activeUser(id: string): Promise<boolean>;
    createObservation(
        leadId: string,
        authorId: string,
        text: string,
        now: Date,
    ): Promise<string>;
    observation(
        leadId: string,
        observationId: string,
    ): Promise<ObservationRecord | null>;
    editObservation(
        observationId: string,
        text: string,
        now: Date,
    ): Promise<void>;
    resolveRequest(
        leadId: string,
        requestId: string,
        actorId: string,
        now: Date,
    ): Promise<boolean>;
    hasPendingRequests(leadId: string): Promise<boolean>;
    history(id: string): Promise<LeadHistoryEvent[]>;
    historyTypes(id: string): Promise<string[]>;
    remove(
        id: string,
        version: number,
        outcome: 'delete' | 'anonymize',
        actor: { id: string; username: string },
        stage: LeadStage,
        now: Date,
    ): Promise<boolean>;
    activeUsers(): Promise<{ id: string; fullName: string }[]>;
}
