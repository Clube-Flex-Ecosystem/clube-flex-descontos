const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Regras da ADR-0004. */
export const ACCESS_CODE_TTL_MS = 30 * MINUTE;
export const ACCESS_CODE_MAX_FAILED_ATTEMPTS = 5;
export const SESSION_IDLE_TIMEOUT_MS = 8 * HOUR;
export const SESSION_ABSOLUTE_LIFETIME_MS = 24 * HOUR;
/** Evita escrever a cada requisição; o prazo de inatividade é de horas. */
export const SESSION_ACTIVITY_RESOLUTION_MS = MINUTE;
