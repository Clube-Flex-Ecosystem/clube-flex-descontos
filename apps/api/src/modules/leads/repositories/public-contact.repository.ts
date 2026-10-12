import type { PublicContactRequest } from '@flex/contracts';

export interface PublicContactTransaction {
  findSource(): Promise<string | null>;
  createSource(): Promise<string | null>;
  findLead(whatsapp: string): Promise<string | null>;
  createLead(
    input: PublicContactRequest,
    sourceId: string,
    now: Date,
  ): Promise<string | null>;
  markPending(leadId: string, now: Date): Promise<void>;
  createRequest(
    leadId: string,
    input: PublicContactRequest,
    now: Date,
  ): Promise<string>;
  recordConsent(
    leadId: string,
    requestId: string,
    input: PublicContactRequest,
    now: Date,
  ): Promise<void>;
  recordHistory(
    leadId: string,
    requestId: string,
    consentVersion: string,
    existing: boolean,
    now: Date,
  ): Promise<void>;
}

export interface PublicContactRepository {
  run<T>(
    work: (transaction: PublicContactTransaction) => Promise<T>,
  ): Promise<T>;
}
