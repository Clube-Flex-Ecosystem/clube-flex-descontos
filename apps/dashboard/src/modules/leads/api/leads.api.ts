import type {
  CreateLeadRequest,
  Lead,
  LeadHistoryEvent,
  LeadSource,
  LeadStage,
  LeadSummary,
} from '@flex/contracts';
import { http } from '../../../shared/http/client';
const match = (version: number) => ({
  headers: { 'If-Match': `"${version}"` },
});
export const leadsApi = {
  list: async () => (await http.get<LeadSummary[]>('/v1/admin/leads')).data,
  get: async (id: string) =>
    (await http.get<Lead>(`/v1/admin/leads/${id}`)).data,
  history: async (id: string) =>
    (await http.get<LeadHistoryEvent[]>(`/v1/admin/leads/${id}/history`)).data,
  create: async (data: CreateLeadRequest) =>
    (await http.post<Lead>('/v1/admin/leads', data)).data,
  update: async (
    id: string,
    version: number,
    data: Omit<CreateLeadRequest, 'leaveUnassigned'>,
  ) =>
    (await http.patch<Lead>(`/v1/admin/leads/${id}`, data, match(version)))
      .data,
  stage: async (
    id: string,
    version: number,
    stage: LeadStage,
    lossReason?: string,
  ) =>
    (
      await http.post<Lead>(
        `/v1/admin/leads/${id}/stage-transitions`,
        { stage, lossReason },
        match(version),
      )
    ).data,
  assign: async (id: string, version: number, assigneeId: string | null) =>
    (
      await http.put<Lead>(
        `/v1/admin/leads/${id}/assignee`,
        { assigneeId },
        match(version),
      )
    ).data,
  observe: async (id: string, version: number, text: string) =>
    (
      await http.post<Lead>(
        `/v1/admin/leads/${id}/observations`,
        { text },
        match(version),
      )
    ).data,
  resolve: async (id: string, version: number, requestId: string) =>
    (
      await http.post<Lead>(
        `/v1/admin/leads/${id}/contact-requests/${requestId}/resolve`,
        {},
        match(version),
      )
    ).data,
  sources: async () =>
    (await http.get<LeadSource[]>('/v1/admin/lead-sources')).data,
  assignees: async () =>
    (
      await http.get<{ id: string; fullName: string }[]>(
        '/v1/admin/leads/assignees',
      )
    ).data,
};
