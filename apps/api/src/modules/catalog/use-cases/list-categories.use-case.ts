import type {
  CategoryRecord,
  CategoryRepository,
} from '../repositories/category.repository';

export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  execute(): Promise<CategoryRecord[]> {
    return this.categories.list();
  }
}
