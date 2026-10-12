import { z } from 'zod';

/**
 * Catálogo fixo de permissões (RF-016). Os identificadores são definidos pela aplicação
 * e não podem ser criados ou renomeados pelo dashboard.
 */
export const permissions = [
    'plans.view',
    'plans.manage',
    'categories.view',
    'categories.manage',
    'partners.view',
    'partners.create',
    'partners.update',
    'partners.publish',
    'partners.delete',
    'leads.view-own',
    'leads.view-all',
    'leads.create',
    'leads.update',
    'leads.change-stage',
    'leads.assign',
    'leads.delete',
    'sources.view',
    'sources.manage',
    'users.view',
    'users.manage',
    'users.set-status',
    'users.reset-access',
    'permissions.view',
    'permissions.manage',
    'audit.view',
] as const;

export const permissionSchema = z.enum(permissions);
export type Permission = z.infer<typeof permissionSchema>;
