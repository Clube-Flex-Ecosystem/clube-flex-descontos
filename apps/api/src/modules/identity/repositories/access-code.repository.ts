export type AccessCodePurpose = 'activation' | 'recovery';

export interface AccessCodeRecord {
    id: string;
    userId: string;
    purpose: AccessCodePurpose;
    expiresAt: Date;
    failedAttempts: number;
    usedAt?: Date;
    invalidatedAt?: Date;
}

export interface NewAccessCode {
    userId: string;
    purpose: AccessCodePurpose;
    codeHash: string;
    now: Date;
    expiresAt: Date;
}

export interface AccessCodeRepository {
    create(code: NewAccessCode): Promise<void>;
    /** Invalida os códigos ainda disponíveis da mesma finalidade. */
    invalidateOpen(
        userId: string,
        purpose: AccessCodePurpose,
        now: Date,
    ): Promise<void>;
    findByCodeHash(codeHash: string): Promise<AccessCodeRecord | null>;
    registerFailedAttempt(codeId: string): Promise<void>;
    /** Retorna `false` quando outro processo já utilizou ou invalidou o código. */
    markUsed(codeId: string, now: Date): Promise<boolean>;
}
