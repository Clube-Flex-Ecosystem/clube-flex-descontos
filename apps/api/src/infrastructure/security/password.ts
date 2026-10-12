import { Bcrypt } from './bcrypt';

const rounds =
    process.env.NODE_ENV === 'test'
        ? 4
        : Number(process.env.BCRYPT_ROUNDS ?? 12);

export const passwordHash = new Bcrypt(rounds);
