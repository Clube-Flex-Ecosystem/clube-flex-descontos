import { SESSION_ABSOLUTE_LIFETIME_MS } from '../constants';
import { generateSessionToken, hashSessionToken } from '../domain/secrets';
import { InvalidCredentialsError } from '../errors';
import type { SessionRepository } from '../repositories/session.repository.types';
import type { UserRepository } from '../repositories/user.repository.types';
import type { Clock, PasswordHasher } from '../services.types';

export interface AuthenticationResult {
  sessionToken: string;
  expiresAt: Date;
}

export class AuthenticateUserUseCase {
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
  ) {}

  /**
   * Conta inexistente, inativa, sem senha ou senha incorreta resultam no mesmo erro, com
   * custo equivalente de verificação para não distinguir os casos pelo tempo de resposta.
   */
  async execute(input: {
    username: string;
    password: string;
    /** Sessão anterior do navegador, encerrada ao autenticar (renovação do identificador). */
    previousSessionToken?: string;
  }): Promise<AuthenticationResult> {
    const user = await this.users.findByUsername(
      input.username.trim().toLowerCase(),
    );
    // A redefinição administrativa exige a senha nova: a anterior deixa de valer (RF-015).
    const eligible =
      user?.status === 'active' &&
      user.passwordHash &&
      !user.passwordChangeRequired;
    const hash =
      (eligible && user?.passwordHash) || (await this.getDummyHash());
    const matches = await this.hasher.verify(input.password, hash);
    if (!eligible || !user || !matches) throw new InvalidCredentialsError();

    const now = this.clock.now();
    if (input.previousSessionToken) {
      const previous = await this.sessions.findByTokenHash(
        hashSessionToken(input.previousSessionToken),
      );
      if (previous) await this.sessions.revoke(previous.id, now);
    }

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_LIFETIME_MS);
    await this.sessions.create({
      userId: user.id,
      tokenHash: hashSessionToken(sessionToken),
      now,
      expiresAt,
    });
    return { sessionToken, expiresAt };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash(
      'senha-inexistente-para-equalizar-tempo',
    );
    return this.dummyHash;
  }
}
