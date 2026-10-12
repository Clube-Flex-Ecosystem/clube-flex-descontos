import { ResourceNotFoundError } from '../errors';
import type {
  CategoryRecord,
  CategoryRepository,
} from '../repositories/category.repository';

export class GetCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(input: { id: string }): Promise<CategoryRecord> {
    const category = await this.categories.findById(input.id);
    if (!category) throw new ResourceNotFoundError();
    return category;
  }
}
