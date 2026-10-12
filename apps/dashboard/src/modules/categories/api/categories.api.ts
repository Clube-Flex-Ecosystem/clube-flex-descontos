import { z } from 'zod';
import {
    categorySchema,
    type ActiveStatus,
    type Category,
    type CategoryRequest,
} from '@flex/contracts';
import { http } from '../../../shared/http/client';
import { ifMatch } from '../../../shared/http/versioning';

const categoriesSchema = z.array(categorySchema);

export async function listCategories(): Promise<Category[]> {
    const response = await http.get('/v1/admin/categories');
    return categoriesSchema.parse(response.data);
}

export async function createCategory(body: CategoryRequest): Promise<Category> {
    const response = await http.post('/v1/admin/categories', body);
    return categorySchema.parse(response.data);
}

export async function updateCategory(input: {
    id: string;
    version: number;
    body: CategoryRequest;
}): Promise<Category> {
    const response = await http.patch(
        `/v1/admin/categories/${input.id}`,
        input.body,
        ifMatch(input.version),
    );
    return categorySchema.parse(response.data);
}

export async function setCategoryStatus(input: {
    id: string;
    version: number;
    status: ActiveStatus;
}): Promise<Category> {
    const action = input.status === 'active' ? 'activate' : 'deactivate';
    const response = await http.post(
        `/v1/admin/categories/${input.id}/${action}`,
        undefined,
        ifMatch(input.version),
    );
    return categorySchema.parse(response.data);
}
