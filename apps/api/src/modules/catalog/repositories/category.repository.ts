import type { ActiveStatus } from '@flex/contracts';

export interface CategoryRecord {
  id: string;
  name: string;
  status: ActiveStatus;
  version: number;
}

export interface CategoryRepository {
  /** Em ordem alfabética. */
  list(): Promise<CategoryRecord[]>;
  findById(id: string): Promise<CategoryRecord | null>;
  findByIds(ids: readonly string[]): Promise<CategoryRecord[]>;
  /** Lança `DuplicateResourceError` quando o nome normalizado já existir. */
  create(input: { name: string }, now: Date): Promise<CategoryRecord>;
  update(
    id: string,
    expectedVersion: number,
    changes: { name?: string; status?: ActiveStatus },
    now: Date,
  ): Promise<CategoryRecord | null>;
}
