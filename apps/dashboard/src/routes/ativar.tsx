import { createFileRoute } from '@tanstack/react-router';
import { ActivatePage } from '../modules/auth/pages/activate-page';

export const Route = createFileRoute('/ativar')({
  head: () => ({ meta: [{ title: 'Ativar conta — Clube Flex' }] }),
  component: ActivatePage,
});
