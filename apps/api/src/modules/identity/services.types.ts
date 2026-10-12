export interface PasswordHasher {
    hash(password: string): Promise<string>;
    verify(password: string, passwordHash: string): Promise<boolean>;
}

export interface Clock {
    now(): Date;
}

export interface EmailMessage {
    to: string;
    subject: string;
    text: string;
}

export interface EmailSender {
    send(message: EmailMessage): Promise<void>;
}

/** Subconjunto do logger usado pela camada de aplicação, sem acoplamento ao Pino. */
export interface ApplicationLogger {
    warn(context: Record<string, unknown>, message: string): void;
}
