import type { LeadSource } from '@flex/contracts';

export type LeadSourceRecord = Omit<LeadSource, 'usageCount'>;

export interface LeadSourceRepository {
    list(): Promise<LeadSource[]>;
    findById(id: string): Promise<LeadSourceRecord | null>;
    create(input: {
        name: string;
        requiresReferral: boolean;
    }): Promise<LeadSourceRecord>;
    update(
        id: string,
        version: number,
        changes: Partial<
            Pick<LeadSourceRecord, 'name' | 'requiresReferral' | 'active'>
        >,
    ): Promise<LeadSourceRecord | null>;
    delete(id: string, version: number): Promise<LeadSourceRecord | null>;
}
