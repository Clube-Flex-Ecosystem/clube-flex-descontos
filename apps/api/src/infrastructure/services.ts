import type {
  ApplicationLogger,
  Clock,
  EmailSender,
  PasswordHasher,
} from '../modules/identity/services.types';

interface Services {
  clock: Clock;
  hasher: PasswordHasher;
  emailSender: EmailSender;
  logger: ApplicationLogger;
}

let configured: Services | undefined;

function current(): Services {
  if (!configured) throw new Error('Serviços da API não inicializados');
  return configured;
}

/** Inicialização única do processo; os objetos abaixo permanecem estáveis nos controllers. */
export function setServices(services: Services): void {
  configured = services;
}

export const clock: Clock = { now: () => current().clock.now() };
export const hasher: PasswordHasher = {
  hash: (password) => current().hasher.hash(password),
  verify: (password, hash) => current().hasher.verify(password, hash),
};
export const emailSender: EmailSender = {
  send: (message) => current().emailSender.send(message),
};
export const applicationLogger: ApplicationLogger = {
  warn: (context, message) => current().logger.warn(context, message),
};
