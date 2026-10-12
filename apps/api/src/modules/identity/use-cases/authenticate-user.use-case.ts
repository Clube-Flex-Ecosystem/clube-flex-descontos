import { InvalidCredentialsError } from '../errors';
import type { UserRepository } from '../repositories/user.repository';
import type { PasswordHasher } from '../services.types';

export interface AuthenticationResult {
    userId: string;
    authVersion: number;
}

export class AuthenticateUserUseCase {
    private dummyHash: Promise<string> | undefined;

    constructor(
        private readonly users: UserRepository,
        private readonly hasher: PasswordHasher,
    ) {}

    async execute(input: {
        username: string;
        password: string;
    }): Promise<AuthenticationResult> {
        const user = await this.users.findByUsername(
            input.username.trim().toLowerCase(),
        );
        const eligible =
            user?.status === 'active' &&
            user.passwordHash &&
            !user.passwordChangeRequired;
        const hash =
            (eligible && user?.passwordHash) || (await this.getDummyHash());
        const matches = await this.hasher.verify(input.password, hash);
        if (!eligible || !user || !matches) throw new InvalidCredentialsError();
        return { userId: user.id, authVersion: user.authVersion };
    }

    private getDummyHash(): Promise<string> {
        this.dummyHash ??= this.hasher.hash(
            'senha-inexistente-para-equalizar-tempo',
        );
        return this.dummyHash;
    }
}
