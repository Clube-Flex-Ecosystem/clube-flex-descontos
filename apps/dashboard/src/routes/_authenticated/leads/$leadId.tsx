import {
  createFileRoute,
  redirect,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import axios from 'axios';
import { LeadDetailPage } from '../../../modules/leads';
import { leadQueryOptions } from '../../../modules/leads/queries/leads.query';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { requireAnyPermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/leads/$leadId')({
  beforeLoad: ({ context }) =>
    requireAnyPermission(context.session, ['leads.view-own', 'leads.view-all']),
  loader: async ({ params, context }) => {
    try {
      return {
        lead: await context.queryClient.ensureQueryData(
          leadQueryOptions(params.leadId),
        ),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw redirect({ to: '/leads' });
      }
      throw error;
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.lead.name ?? 'Lead'} — Clube Flex` }],
  }),
  component: LeadRoute,
  errorComponent: LeadError,
});

function LeadRoute() {
  const { lead } = Route.useLoaderData();
  return <LeadDetailPage key={lead.id} lead={lead} />;
}

function LeadError({ error, reset }: ErrorComponentProps) {
  const queryErrorReset = useQueryErrorResetBoundary();

  return (
    <Alert
      tone="danger"
      title="Não foi possível carregar o lead."
      action={
        <Button
          compact
          onClick={() => {
            queryErrorReset.reset();
            reset();
          }}
        >
          <Icon name="refresh" />
          Tentar novamente
        </Button>
      }
    >
      {describeError(error)}
    </Alert>
  );
}
