import type {
  EmailMessage,
  EmailSender,
} from '../../modules/identity/services.types';
import {
  ResendEmailSender,
  UnavailableEmailSender,
} from './resend-email-sender';

export class MemoryEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  failing = false;

  async send(message: EmailMessage): Promise<void> {
    if (this.failing) throw new Error('falha simulada do provedor');
    this.sent.push(message);
  }

  lastCodeFor(to: string): string | undefined {
    return [...this.sent]
      .reverse()
      .find((message) => message.to === to)
      ?.text.match(/[0-9A-Z]{4}(?:-[0-9A-Z]{4}){3}/)?.[0];
  }
}

export const emailSender: EmailSender =
  process.env.NODE_ENV === 'test'
    ? new MemoryEmailSender()
    : process.env.RESEND_API_KEY && process.env.EMAIL_FROM
      ? new ResendEmailSender(
          process.env.RESEND_API_KEY,
          process.env.EMAIL_FROM,
        )
      : new UnavailableEmailSender();
