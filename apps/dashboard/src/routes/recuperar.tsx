import { createFileRoute } from '@tanstack/react-router';
import { RecoveryPage } from '../modules/auth/pages/recovery-page';
import { pageHead } from '../shared/utils/page-head';

export const Route = createFileRoute('/recuperar')({
  head: () => pageHead('Recuperar acesso'),
  component: RecoveryPage,
});
