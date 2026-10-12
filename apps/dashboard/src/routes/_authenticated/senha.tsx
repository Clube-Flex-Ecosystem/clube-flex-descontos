import { createFileRoute } from '@tanstack/react-router';
import { ChangePasswordPage } from '../../modules/auth/pages/change-password-page';

export const Route = createFileRoute('/_authenticated/senha')({
    head: () => ({ meta: [{ title: 'Alterar senha — Clube Flex' }] }),
    component: ChangePasswordPage,
});
