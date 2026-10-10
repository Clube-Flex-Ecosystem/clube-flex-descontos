import { createFileRoute } from '@tanstack/react-router';
import { ActivatePage } from '../modules/auth/pages/activate-page';
import { pageHead } from '../shared/utils/page-head';

export const Route = createFileRoute('/ativar')({
  head: () => pageHead('Ativar conta'),
  component: ActivatePage,
});
