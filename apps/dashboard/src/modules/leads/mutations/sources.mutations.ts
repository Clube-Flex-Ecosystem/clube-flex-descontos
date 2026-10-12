import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LeadSource } from '@flex/contracts';
import { removeById, upsertById } from '../../../shared/http/versioning';
import { sourcesApi, type SourceRequest } from '../api/leads.api';
import { sourcesKey } from '../queries/leads.query';

/** A resposta substitui a origem na coleção sem nova consulta da listagem. */
function useWriteSource() {
    const queryClient = useQueryClient();
    return (source: LeadSource) =>
        queryClient.setQueryData<LeadSource[]>(sourcesKey, (current) =>
            upsertById(current, source),
        );
}

export function useCreateSource() {
    const write = useWriteSource();
    return useMutation({
        mutationFn: (body: SourceRequest) => sourcesApi.create(body),
        onSuccess: write,
    });
}

export function useUpdateSource() {
    const write = useWriteSource();
    return useMutation({
        mutationFn: ({
            id,
            version,
            body,
        }: {
            id: string;
            version: number;
            body: SourceRequest;
        }) => sourcesApi.update(id, version, body),
        onSuccess: write,
    });
}

export function useSetSourceActive() {
    const write = useWriteSource();
    return useMutation({
        mutationFn: ({
            id,
            version,
            active,
        }: {
            id: string;
            version: number;
            active: boolean;
        }) => sourcesApi.setActive(id, version, active),
        onSuccess: write,
    });
}

export function useDeleteSource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, version }: { id: string; version: number }) =>
            sourcesApi.remove(id, version),
        onSuccess: (_result, { id }) =>
            queryClient.setQueryData<LeadSource[]>(sourcesKey, (current) =>
                removeById(current, id),
            ),
    });
}
