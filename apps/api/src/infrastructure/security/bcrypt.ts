import bcrypt from 'bcryptjs';

export class Bcrypt {
  constructor(private readonly rounds = 12) {}

  hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.rounds);
  }

  compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }

  verify(value: string, hash: string): Promise<boolean> {
    return this.compare(value, hash);
  }
}
