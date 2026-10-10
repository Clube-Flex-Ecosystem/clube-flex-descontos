import type { Request, RequestHandler } from 'express';
import { sendProblem } from '../problem';

export interface ProgressiveLimiterOptions {
  /** Tentativas toleradas antes do primeiro bloqueio. */
  freeAttempts: number;
  /** Duração do primeiro bloqueio; dobra a cada tentativa seguinte. */
  baseLockMs: number;
  maxLockMs: number;
  /** Sem novas tentativas por este período, o histórico é esquecido. */
  decayMs: number;
  now?: () => number;
}

interface Entry {
  attempts: number;
  lastAttemptAt: number;
}

/**
 * Limitação progressiva em memória (ADR-0004): o bloqueio cresce a cada tentativa excedente
 * e expira sozinho, sem bloqueio permanente. A API roda em uma única instância; ao escalar
 * horizontalmente, o estado precisará ser compartilhado.
 */
export class ProgressiveLimiter {
  private readonly entries = new Map<string, Entry>();
  private readonly now: () => number;

  constructor(private readonly options: ProgressiveLimiterOptions) {
    this.now = options.now ?? Date.now;
  }

  /** Milissegundos até a próxima tentativa ser aceita; `0` quando liberada. */
  retryAfterMs(key: string): number {
    const entry = this.live(key);
    if (!entry || entry.attempts < this.options.freeAttempts) return 0;
    const excess = entry.attempts - this.options.freeAttempts;
    const lock = Math.min(
      this.options.baseLockMs * 2 ** Math.min(excess, 30),
      this.options.maxLockMs,
    );
    return Math.max(0, entry.lastAttemptAt + lock - this.now());
  }

  record(key: string): void {
    if (this.entries.size > 10_000) this.purge();
    const entry = this.live(key) ?? { attempts: 0, lastAttemptAt: 0 };
    this.entries.set(key, {
      attempts: entry.attempts + 1,
      lastAttemptAt: this.now(),
    });
  }

  /** Devolve uma tentativa registrada antecipadamente que acabou sendo bem-sucedida. */
  forgive(key: string): void {
    const entry = this.entries.get(key);
    if (!entry) return;
    if (entry.attempts <= 1) this.entries.delete(key);
    else this.entries.set(key, { ...entry, attempts: entry.attempts - 1 });
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  private live(key: string): Entry | undefined {
    const entry = this.entries.get(key);
    if (entry && this.now() - entry.lastAttemptAt > this.options.decayMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }

  private purge(): void {
    for (const key of [...this.entries.keys()]) this.live(key);
  }
}

interface RateLimitOptions {
  limiter: ProgressiveLimiter;
  /** Chave da tentativa; sem chave, a requisição não é limitada. */
  key: (req: Request) => string | undefined;
  /**
   * `failures`: a tentativa só conta se a resposta for de erro, e um sucesso a devolve.
   * `always`: toda requisição conta, como em solicitações que sempre respondem 202.
   */
  count: 'failures' | 'always';
  /** Um sucesso zera o histórico da chave, como no login do mesmo usuário. */
  resetOnSuccess?: boolean;
}

export function rateLimit(options: RateLimitOptions): RequestHandler {
  return (req, res, next) => {
    const key = options.key(req);
    if (!key) {
      next();
      return;
    }

    const retryAfterMs = options.limiter.retryAfterMs(key);
    if (retryAfterMs > 0) {
      sendProblem(req, res, 'RATE_LIMIT_EXCEEDED', {
        headers: { 'retry-after': String(Math.ceil(retryAfterMs / 1000)) },
      });
      return;
    }

    // A tentativa é contada antes do processamento para que requisições concorrentes
    // não ultrapassem o limite; sucessos a devolvem ao final.
    options.limiter.record(key);
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      if (options.resetOnSuccess) options.limiter.reset(key);
      else if (options.count === 'failures') options.limiter.forgive(key);
    });
    next();
  };
}

export interface AuthRateLimiters {
  loginByUser: ProgressiveLimiter;
  loginByIp: ProgressiveLimiter;
  codeByIp: ProgressiveLimiter;
  recoveryByUser: ProgressiveLimiter;
  recoveryByIp: ProgressiveLimiter;
}

const MINUTE = 60_000;

export function createAuthRateLimiters(): AuthRateLimiters {
  const common = {
    baseLockMs: 30_000,
    maxLockMs: 15 * MINUTE,
    decayMs: 15 * MINUTE,
  };
  return {
    loginByUser: new ProgressiveLimiter({ ...common, freeAttempts: 5 }),
    loginByIp: new ProgressiveLimiter({ ...common, freeAttempts: 20 }),
    codeByIp: new ProgressiveLimiter({ ...common, freeAttempts: 10 }),
    recoveryByUser: new ProgressiveLimiter({ ...common, freeAttempts: 3 }),
    recoveryByIp: new ProgressiveLimiter({ ...common, freeAttempts: 10 }),
  };
}
