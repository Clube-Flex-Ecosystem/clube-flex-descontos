export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  status: 'active' | 'inactive';
  /** Ausente enquanto a conta aguarda ativação. */
  passwordHash?: string;
}

export interface NewUser {
  fullName: string;
  username: string;
  email?: string;
}

export interface UserRepository {
  findById(id: string): Promise<UserAccount | null>;
  findByUsername(username: string): Promise<UserAccount | null>;
  count(): Promise<number>;
  usernameExists(username: string): Promise<boolean>;
  create(user: NewUser, now: Date): Promise<UserAccount>;
  setPasswordHash(
    userId: string,
    passwordHash: string,
    now: Date,
  ): Promise<void>;
  /** Serializa operações concorrentes que dependem de a base não possuir usuários. */
  lockUserCreation(): Promise<void>;
}
