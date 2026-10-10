import type { ActiveStatus } from '@flex/contracts';

export interface PlanRecord {
  id: string;
  name: string;
  slug: string;
  status: ActiveStatus;
  version: number;
}

export interface PlanRepository {
  /** Em ordem alfabética. */
  list(): Promise<PlanRecord[]>;
  findById(id: string): Promise<PlanRecord | null>;
  findByIds(ids: readonly string[]): Promise<PlanRecord[]>;
  slugExists(slug: string): Promise<boolean>;
  /** Lança `DuplicateResourceError` quando o nome normalizado ou o slug já existir. */
  create(input: { name: string; slug: string }, now: Date): Promise<PlanRecord>;
  /**
   * Aplica as mudanças somente se a versão ainda for a informada e a incrementa. Retorna
   * `null` quando nenhuma linha foi alterada.
   */
  update(
    id: string,
    expectedVersion: number,
    changes: { name?: string; status?: ActiveStatus },
    now: Date,
  ): Promise<PlanRecord | null>;
}
