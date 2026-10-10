import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PasswordHasher } from '../../modules/identity/services.types';

const derive = promisify(argon2);

const SALT_BYTES = 16;
const TAG_BYTES = 32;
const VERSION = 19;

export interface Argon2Parameters {
  /** Memória em KiB. */
  memory: number;
  passes: number;
  parallelism: number;
}

// Mínimo recomendado pela OWASP (19 MiB, 2 passes, 1 thread); calibrado na VPS por ambiente.
export const defaultArgon2Parameters: Argon2Parameters = {
  memory: 19_456,
  passes: 2,
  parallelism: 1,
};

/**
 * Argon2id via `node:crypto`. O hash guarda seus próprios parâmetros em formato PHC, de modo
 * que senhas antigas continuam verificáveis depois de uma recalibração.
 */
export class Argon2PasswordHasher implements PasswordHasher {
  constructor(
    private readonly parameters: Argon2Parameters = defaultArgon2Parameters,
  ) {}

  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const tag = await this.compute(password, salt, this.parameters);
    const { memory, passes, parallelism } = this.parameters;
    return [
      '',
      'argon2id',
      `v=${VERSION}`,
      `m=${memory},t=${passes},p=${parallelism}`,
      salt.toString('base64url'),
      tag.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const parsed = parse(passwordHash);
    if (!parsed) return false;
    const tag = await this.compute(password, parsed.salt, parsed.parameters);
    return tag.length === parsed.tag.length && timingSafeEqual(tag, parsed.tag);
  }

  private async compute(
    password: string,
    salt: Buffer,
    { memory, passes, parallelism }: Argon2Parameters,
  ): Promise<Buffer> {
    return derive('argon2id', {
      message: Buffer.from(password.normalize('NFKC'), 'utf8'),
      nonce: salt,
      parallelism,
      tagLength: TAG_BYTES,
      memory,
      passes,
    });
  }
}

function parse(passwordHash: string) {
  const [, algorithm, version, params, salt, tag] = passwordHash.split('$');
  if (algorithm !== 'argon2id' || version !== `v=${VERSION}`) return null;
  const match = /^m=(\d+),t=(\d+),p=(\d+)$/.exec(params ?? '');
  if (!match || !salt || !tag) return null;
  return {
    parameters: {
      memory: Number(match[1]),
      passes: Number(match[2]),
      parallelism: Number(match[3]),
    },
    salt: Buffer.from(salt, 'base64url'),
    tag: Buffer.from(tag, 'base64url'),
  };
}
