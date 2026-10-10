import { z } from 'zod';
import {
  planSchema,
  type ActiveStatus,
  type CreatePlanRequest,
  type Plan,
  type UpdatePlanRequest,
} from '@flex/contracts';
import { http } from '../../../shared/http/client';
import { ifMatch } from '../../../shared/http/versioning';

const plansSchema = z.array(planSchema);

export async function listPlans(): Promise<Plan[]> {
  const response = await http.get('/v1/admin/plans');
  return plansSchema.parse(response.data);
}

export async function createPlan(body: CreatePlanRequest): Promise<Plan> {
  const response = await http.post('/v1/admin/plans', body);
  return planSchema.parse(response.data);
}

export async function updatePlan(input: {
  id: string;
  version: number;
  body: UpdatePlanRequest;
}): Promise<Plan> {
  const response = await http.patch(
    `/v1/admin/plans/${input.id}`,
    input.body,
    ifMatch(input.version),
  );
  return planSchema.parse(response.data);
}

export async function setPlanStatus(input: {
  id: string;
  version: number;
  status: ActiveStatus;
}): Promise<Plan> {
  const action = input.status === 'active' ? 'activate' : 'deactivate';
  const response = await http.post(
    `/v1/admin/plans/${input.id}/${action}`,
    undefined,
    ifMatch(input.version),
  );
  return planSchema.parse(response.data);
}
