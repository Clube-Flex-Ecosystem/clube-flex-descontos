export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  status: 'active' | 'inactive';
  /** Ausente enquanto a conta aguarda ativação. */
  passwordHash?: string;
  /** Verdadeiro após a redefinição administrativa, até o usuário definir a nova senha. */
  passwordChangeRequired: boolean;
  version: number;
}

export interface NewUser {
  fullName: string;
  username: string;
  email?: string;
}

export interface UserProfile {
  fullName: string;
  username: string;
  email?: string;
}

export interface UserRepository {
  findById(id: string): Promise<UserAccount | null>;
  findByUsername(username: string): Promise<UserAccount | null>;
  /** Todas as contas, sem filtro: o volume previsto não exige paginação. */
  list(): Promise<UserAccount[]>;
  count(): Promise<number>;
  usernameExists(username: string): Promise<boolean>;
  /** Nomes de usuário iguais à base ou que a iniciam, para resolver colisões sequenciais. */
  usernamesStartingWith(base: string): Promise<string[]>;
  create(user: NewUser, now: Date): Promise<UserAccount>;
  /** Define a senha e encerra a exigência de troca pendente. */
  setPasswordHash(
    userId: string,
    passwordHash: string,
    now: Date,
  ): Promise<void>;
  /** Retorna `null` quando a versão persistida já não é a informada. */
  updateProfile(
    userId: string,
    expectedVersion: number,
    profile: UserProfile,
    now: Date,
  ): Promise<UserAccount | null>;
  setStatus(
    userId: string,
    expectedVersion: number,
    status: 'active' | 'inactive',
    now: Date,
  ): Promise<UserAccount | null>;
  /** Registra uma alteração do agregado (como as permissões) sem mudar outros campos. */
  touch(
    userId: string,
    expectedVersion: number,
    now: Date,
  ): Promise<UserAccount | null>;
  setPasswordChangeRequired(
    userId: string,
    required: boolean,
    now: Date,
  ): Promise<void>;
  /**
   * Contas ativas, com senha definida e capazes de administrar usuários e permissões,
   * exceto a informada (RN-021).
   */
  countOtherAdministrators(excludingUserId: string): Promise<number>;
  /** Serializa operações concorrentes que poderiam deixar o sistema sem administrador. */
  lockAdministration(): Promise<void>;
  /** Serializa operações concorrentes que dependem de a base não possuir usuários. */
  lockUserCreation(): Promise<void>;
}
