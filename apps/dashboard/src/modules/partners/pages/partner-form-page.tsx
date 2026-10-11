import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import type { Category, Partner, Plan } from '@flex/contracts';
import { categoriesQueryOptions } from '../../categories';
import { plansQueryOptions } from '../../plans';
import { describeError } from '../../../shared/http/problem';
import { Alert } from '../../../shared/ui/alert';
import { Button } from '../../../shared/ui/button';
import { ListSkeleton } from '../../../shared/ui/page-parts';
import { PartnerForm } from '../components/partner-form';
import {
  partnerQueryOptions,
  partnersQueryOptions,
} from '../queries/partners.query';

interface PartnerDetailInitialData {
  partner: Partner;
  plans: Plan[];
  categories: Category[];
  partners: Partner[];
}

/** Cadastro (`partnerId` ausente) ou edição de um parceiro. */
export function PartnerFormPage({
  partnerId,
  initialData,
}: {
  partnerId?: string;
  initialData?: PartnerDetailInitialData;
}) {
  if (initialData && partnerId) {
    return (
      <LoadedPartnerForm partnerId={partnerId} initialData={initialData} />
    );
  }

  return <PartnerCreateFormPage partnerId={partnerId} />;
}

function PartnerCreateFormPage({ partnerId }: { partnerId?: string }) {
  const partner = useQuery({
    ...partnerQueryOptions(partnerId ?? ''),
    enabled: Boolean(partnerId),
    // O formulário parte de uma versão fixa: alterações de terceiros aparecem como
    // conflito ao salvar, nunca descartando silenciosamente o que está sendo editado.
    refetchOnWindowFocus: false,
  });
  const plans = useQuery(plansQueryOptions);
  const categories = useQuery(categoriesQueryOptions);
  const partners = useQuery(partnersQueryOptions);

  const dependencyError = [plans, categories].find((query) => query.isError);
  const notFound =
    partner.isError &&
    axios.isAxiosError(partner.error) &&
    partner.error.response?.status === 404;

  const back = (
    <Link
      to="/parceiros"
      className="t-label inline-flex min-h-11 items-center rounded-md border border-control-border bg-control px-3 text-foreground no-underline shadow-control-raised md:min-h-control-sm"
    >
      Voltar para parceiros
    </Link>
  );

  if (notFound) {
    return (
      <Alert tone="danger" title="Parceiro não encontrado." action={back}>
        O registro não existe ou foi excluído.
      </Alert>
    );
  }

  if (partner.isError || dependencyError) {
    const failed = dependencyError ?? partner;
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar os dados do formulário."
        action={
          <Button
            compact
            onClick={() => {
              void partner.refetch();
              void plans.refetch();
              void categories.refetch();
            }}
          >
            Tentar novamente
          </Button>
        }
      >
        {describeError(failed.error)} O cadastro de parceiros depende da
        consulta de planos e categorias.
      </Alert>
    );
  }

  const ready =
    plans.data && categories.data && (partnerId ? partner.data : true);
  if (!ready) return <ListSkeleton label="Carregando parceiro" />;

  return (
    <PartnerForm
      // A nova versão devolvida pela API reinicia o formulário sem alterações pendentes.
      key={partner.data ? `${partner.data.id}:${partner.data.version}` : 'new'}
      {...(partner.data ? { partner: partner.data } : {})}
      plans={plans.data}
      categories={categories.data}
      partners={partners.data ?? []}
    />
  );
}

function LoadedPartnerForm({
  partnerId,
  initialData,
}: {
  partnerId: string;
  initialData: PartnerDetailInitialData;
}) {
  const partner = useQuery({
    ...partnerQueryOptions(partnerId),
    initialData: initialData.partner,
    // O formulário parte de uma versão fixa: alterações de terceiros aparecem como
    // conflito ao salvar, nunca descartando silenciosamente o que está sendo editado.
    refetchOnWindowFocus: false,
  });
  const plans = useQuery({
    ...plansQueryOptions,
    initialData: initialData.plans,
  });
  const categories = useQuery({
    ...categoriesQueryOptions,
    initialData: initialData.categories,
  });
  const partners = useQuery({
    ...partnersQueryOptions,
    initialData: initialData.partners,
  });

  return (
    <PartnerForm
      key={`${partner.data.id}:${partner.data.version}`}
      partner={partner.data}
      plans={plans.data}
      categories={categories.data}
      partners={partners.data}
    />
  );
}
