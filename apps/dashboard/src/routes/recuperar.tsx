import { createFileRoute } from '@tanstack/react-router';
import { RecoveryPage } from '../modules/auth/pages/recovery-page';

export const Route = createFileRoute('/recuperar')({
    head: () => ({ meta: [{ title: 'Recuperar acesso — Clube Flex' }] }),
    component: RecoveryPage,
});
