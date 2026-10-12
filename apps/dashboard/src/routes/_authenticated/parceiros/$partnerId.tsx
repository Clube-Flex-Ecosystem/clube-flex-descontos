import {
  createFileRoute,
  redirect,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import axios from 'axios';
import { PartnerFormPage } from '../../../modules/partners';
import { categoriesQueryOptions } from '../../../modules/categories';
import { plansQueryOptions } from '../../../modules/plans';
import {
  partnerQueryOptions,
  partnersQueryOptions,
} from '../../../modules/partners/queries/partners.query';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { Icon } from '../../../shared/ui/icon';
import { requirePermission } from '../../../shared/utils/route-guards';

export const Route = createFileRoute('/_authenticated/parceiros/$partnerId')({
  beforeLoad: ({ context }) =>
    requirePermission(context.session, 'partners.view'),
  loader: async ({ params, context }) => {
    try {
      const [partner, plans, categories, partners] = await Promise.all([
        context.queryClient.ensureQueryData(
          partnerQueryOptions(params.partnerId),
        ),
        context.queryClient.ensureQueryData(plansQueryOptions),
        context.queryClient.ensureQueryData(categoriesQueryOptions),
        context.queryClient.ensureQueryData(partnersQueryOptions),
      ]);

      return { partner, plans, categories, partners };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw redirect({ to: '/parceiros' });
      }
      throw error;
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.partner.name ?? 'Parceiro'} — Clube Flex` }],
  }),
  component: PartnerRoute,
  errorComponent: PartnerError,
});

function PartnerRoute() {
  const { partnerId } = Route.useParams();
  return (
    <PartnerFormPage
      partnerId={partnerId}
      initialData={Route.useLoaderData()}
    />
  );
}

function PartnerError({ error, reset }: ErrorComponentProps) {
  const queryErrorReset = useQueryErrorResetBoundary();

  return (
    <Alert
      tone="danger"
      title="Não foi possível carregar o parceiro."
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
