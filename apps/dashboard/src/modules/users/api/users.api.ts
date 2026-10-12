import type {
    AccessCodePurposeValue,
    AdminUser,
    CreateUserRequest,
    Permission,
    UpdateUserRequest,
} from '@flex/contracts';
import { http } from '../../../shared/http/client';
import { ifMatch } from '../../../shared/http/versioning';

export async function listUsers(): Promise<AdminUser[]> {
    return (await http.get<AdminUser[]>('/v1/admin/users')).data;
}

export async function getUser(id: string): Promise<AdminUser> {
    return (await http.get<AdminUser>(`/v1/admin/users/${id}`)).data;
}

export async function createUser(body: CreateUserRequest): Promise<AdminUser> {
    return (await http.post<AdminUser>('/v1/admin/users', body)).data;
}

export async function updateUser(input: {
    id: string;
    version: number;
    body: UpdateUserRequest;
}): Promise<AdminUser> {
    return (
        await http.patch<AdminUser>(
            `/v1/admin/users/${input.id}`,
            input.body,
            ifMatch(input.version),
        )
    ).data;
}

export async function setUserStatus(input: {
    id: string;
    version: number;
    status: 'active' | 'inactive';
}): Promise<AdminUser> {
    const action = input.status === 'active' ? 'activate' : 'deactivate';
    return (
        await http.post<AdminUser>(
            `/v1/admin/users/${input.id}/${action}`,
            undefined,
            ifMatch(input.version),
        )
    ).data;
}

export async function issueAccessCode(input: {
    id: string;
    purpose: AccessCodePurposeValue;
}): Promise<AdminUser> {
    return (
        await http.post<AdminUser>(`/v1/admin/users/${input.id}/access-codes`, {
            purpose: input.purpose,
        })
    ).data;
}

export async function replacePermissions(input: {
    id: string;
    version: number;
    permissions: Permission[];
}): Promise<AdminUser> {
    return (
        await http.put<AdminUser>(
            `/v1/admin/users/${input.id}/permissions`,
            { permissions: input.permissions },
            ifMatch(input.version),
        )
    ).data;
}
