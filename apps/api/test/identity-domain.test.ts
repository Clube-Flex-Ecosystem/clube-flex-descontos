import { describe, expect, it } from 'vitest';
import { ProgressiveLimiter } from '../src/http/middlewares/rate-limit.middleware';
import { Argon2PasswordHasher } from '../src/infrastructure/security/argon2-password-hasher';
import { checkPassword } from '../src/modules/identity/domain/password-policy';
import {
  deriveCsrfToken,
  generateAccessCode,
  hashAccessCode,
  normalizeAccessCode,
} from '../src/modules/identity/domain/secrets';
import {
  baseUsername,
  generateUsername,
} from '../src/modules/identity/domain/username';

// Texto não periódico de tamanho exato, para os limites de comprimento.
const varied = (length: number) =>
  Array.from({ length }, (_, i) =>
    String.fromCharCode(97 + ((i * 7 + Math.floor(i / 5)) % 26)),
  ).join('');

describe('política de senha', () => {
  it('aceita de 15 a 128 caracteres, com espaços e Unicode', () => {
    expect(checkPassword('uma frase longa e segura')).toBeNull();
    expect(checkPassword('á'.repeat(14))).toBe('PASSWORD_TOO_SHORT');
    expect(checkPassword('ação é um direito ✓ ok')).toBeNull();
    expect(checkPassword(varied(128))).toBeNull();
    expect(checkPassword(varied(129))).toBe('PASSWORD_TOO_LONG');
  });

  it('conta caracteres Unicode, não unidades UTF-16', () => {
    // 15 emojis ocupam 30 unidades UTF-16, mas são 15 caracteres.
    expect(checkPassword('🔑'.repeat(15))).toBe('PASSWORD_TOO_COMMON');
    expect(checkPassword('🔑🔒🔓🔐🗝️🛡️🧱🚪🏠🌳🌞🌙⭐🍀🎲')).toBeNull();
  });

  it('recusa senhas comuns e previsíveis, ignorando caixa e espaços', () => {
    expect(checkPassword('Password Password')).toBe('PASSWORD_TOO_COMMON');
    expect(checkPassword('1234567890123456')).toBe('PASSWORD_TOO_COMMON');
    expect(checkPassword('aaaaaaaaaaaaaaaa')).toBe('PASSWORD_TOO_COMMON');
    expect(checkPassword('abcdabcdabcdabcd')).toBe('PASSWORD_TOO_COMMON');
  });
});

describe('nome de usuário (RN-019)', () => {
  it('remove acentos e caracteres especiais e usa pontos', () => {
    expect(baseUsername('João da Silva')).toBe('joao.da.silva');
    expect(baseUsername("  Maria   D'Ávila-Souza ")).toBe('maria.davilasouza');
  });

  it('resolve colisões com sufixo numérico sequencial', () => {
    const taken = new Set(['joao.da.silva', 'joao.da.silva.2']);

    expect(generateUsername('João da Silva', (c) => taken.has(c))).toBe(
      'joao.da.silva.3',
    );
    expect(generateUsername('Ana Souza', (c) => taken.has(c))).toBe(
      'ana.souza',
    );
  });
});

describe('códigos e tokens', () => {
  it('gera códigos de 16 caracteres sem ambiguidade visual, em quatro grupos', () => {
    const code = generateAccessCode();

    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    expect(generateAccessCode()).not.toBe(code);
  });

  it('normaliza variações de digitação para o mesmo hash', () => {
    const code = 'AB12-CD34-EF56-GH78';

    expect(hashAccessCode(code.toLowerCase())).toBe(hashAccessCode(code));
    expect(hashAccessCode('AB12CD34EF56GH78')).toBe(hashAccessCode(code));
    expect(normalizeAccessCode('oIl0')).toBe('0110');
  });

  it('deriva um token CSRF estável por sessão e distinto entre sessões', () => {
    expect(deriveCsrfToken('sessao-a')).toBe(deriveCsrfToken('sessao-a'));
    expect(deriveCsrfToken('sessao-a')).not.toBe(deriveCsrfToken('sessao-b'));
    expect(deriveCsrfToken('sessao-a')).not.toContain('sessao-a');
  });
});

describe('Argon2id', () => {
  const hasher = new Argon2PasswordHasher({
    memory: 64,
    passes: 1,
    parallelism: 1,
  });

  it('verifica a senha correta e recusa a incorreta', async () => {
    const hash = await hasher.hash('uma frase longa e segura');

    expect(hash).toMatch(/^\$argon2id\$v=19\$m=64,t=1,p=1\$/);
    expect(await hasher.verify('uma frase longa e segura', hash)).toBe(true);
    expect(await hasher.verify('outra frase longa e segura', hash)).toBe(false);
  });

  it('usa sal distinto e continua verificando hashes de parâmetros anteriores', async () => {
    const first = await hasher.hash('uma frase longa e segura');
    const second = await hasher.hash('uma frase longa e segura');
    const recalibrated = new Argon2PasswordHasher({
      memory: 128,
      passes: 2,
      parallelism: 1,
    });

    expect(first).not.toBe(second);
    expect(await recalibrated.verify('uma frase longa e segura', first)).toBe(
      true,
    );
  });

  it('recusa hashes malformados sem lançar', async () => {
    expect(await hasher.verify('qualquer', 'nao-e-um-hash')).toBe(false);
  });
});

describe('limitador progressivo', () => {
  function createLimiter() {
    let now = 0;
    const limiter = new ProgressiveLimiter({
      freeAttempts: 3,
      baseLockMs: 1_000,
      maxLockMs: 8_000,
      decayMs: 60_000,
      now: () => now,
    });
    return { limiter, advance: (ms: number) => (now += ms) };
  }

  it('libera as tentativas gratuitas e bloqueia com duração crescente até o teto', () => {
    const { limiter, advance } = createLimiter();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(limiter.retryAfterMs('k')).toBe(0);
      limiter.record('k');
    }
    expect(limiter.retryAfterMs('k')).toBe(1_000);

    advance(1_000);
    expect(limiter.retryAfterMs('k')).toBe(0);
    limiter.record('k');
    expect(limiter.retryAfterMs('k')).toBe(2_000);

    advance(2_000);
    limiter.record('k');
    advance(4_000);
    limiter.record('k');
    limiter.record('k');
    expect(limiter.retryAfterMs('k')).toBe(8_000);
  });

  it('esquece o histórico depois do período de decaimento, sem bloqueio permanente', () => {
    const { limiter, advance } = createLimiter();
    for (let attempt = 0; attempt < 6; attempt += 1) limiter.record('k');
    expect(limiter.retryAfterMs('k')).toBeGreaterThan(0);

    advance(60_001);

    expect(limiter.retryAfterMs('k')).toBe(0);
  });

  it('isola chaves e permite devolver ou zerar tentativas', () => {
    const { limiter } = createLimiter();
    for (let attempt = 0; attempt < 3; attempt += 1) limiter.record('a');

    expect(limiter.retryAfterMs('a')).toBeGreaterThan(0);
    expect(limiter.retryAfterMs('b')).toBe(0);
    limiter.forgive('a');
    expect(limiter.retryAfterMs('a')).toBe(0);
    limiter.record('a');
    limiter.reset('a');
    expect(limiter.retryAfterMs('a')).toBe(0);
  });
});
