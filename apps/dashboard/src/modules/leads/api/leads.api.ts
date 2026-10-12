import type {
    CreateLeadRequest,
    Lead,
    LeadRemoval,
    LeadHistoryEvent,
    LeadSource,
    LeadStage,
    LeadSummary,
} from '@flex/contracts';
import { http } from '../../../shared/http/client';
const match = (version: number) => ({
    headers: { 'If-Match': `"${version}"` },
});
export type UpdateLeadRequest = Omit<CreateLeadRequest, 'leaveUnassigned'>;
export interface SourceRequest {
    name: string;
    requiresReferral: boolean;
}
export const leadsApi = {
    list: async () => (await http.get<LeadSummary[]>('/v1/admin/leads')).data,
    get: async (id: string) =>
        (await http.get<Lead>(`/v1/admin/leads/${id}`)).data,
    history: async (id: string) =>
        (await http.get<LeadHistoryEvent[]>(`/v1/admin/leads/${id}/history`))
            .data,
    create: async (data: CreateLeadRequest) =>
        (await http.post<Lead>('/v1/admin/leads', data)).data,
    update: async (id: string, version: number, data: UpdateLeadRequest) =>
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
    correctObservation: async (
        id: string,
        version: number,
        observationId: string,
        text: string,
    ) =>
        (
            await http.patch<Lead>(
                `/v1/admin/leads/${id}/observations/${observationId}`,
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
    remove: async (id: string, version: number) =>
        (
            await http.delete<LeadRemoval>(
                `/v1/admin/leads/${id}`,
                match(version),
            )
        ).data,
    assignees: async () =>
        (
            await http.get<{ id: string; fullName: string }[]>(
                '/v1/admin/leads/assignees',
            )
        ).data,
};

/** Tipos de origem administrados no dashboard. */
export const sourcesApi = {
    list: async () =>
        (await http.get<LeadSource[]>('/v1/admin/lead-sources')).data,
    create: async (body: SourceRequest) =>
        (await http.post<LeadSource>('/v1/admin/lead-sources', body)).data,
    update: async (id: string, version: number, body: SourceRequest) =>
        (
            await http.patch<LeadSource>(
                `/v1/admin/lead-sources/${id}`,
                body,
                match(version),
            )
        ).data,
    setActive: async (id: string, version: number, active: boolean) =>
        (
            await http.post<LeadSource>(
                `/v1/admin/lead-sources/${id}/${active ? 'activate' : 'deactivate'}`,
                {},
                match(version),
            )
        ).data,
    remove: async (id: string, version: number) => {
        await http.delete(`/v1/admin/lead-sources/${id}`, match(version));
    },
};
