import type {
    EmailMessage,
    EmailSender,
} from '../../modules/identity/services.types';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const REQUEST_TIMEOUT_MS = 10_000;

/** Envio direto pela API HTTP do Resend, sem fila ou worker (ADR-0003). */
export class ResendEmailSender implements EmailSender {
    constructor(
        private readonly apiKey: string,
        private readonly from: string,
    ) {}

    async send(message: EmailMessage): Promise<void> {
        const response = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                authorization: `Bearer ${this.apiKey}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                from: this.from,
                to: message.to,
                subject: message.subject,
                text: message.text,
            }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error(`Resend respondeu com status ${response.status}`);
        }
    }
}

/** Usado quando nenhum provedor está configurado: toda entrega cai no fluxo manual. */
export class UnavailableEmailSender implements EmailSender {
    async send(): Promise<void> {
        throw new Error('Envio de e-mail não configurado');
    }
}
