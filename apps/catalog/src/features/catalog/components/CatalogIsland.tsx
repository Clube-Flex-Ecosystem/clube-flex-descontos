import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgePercent,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import type {
  PublicCategory,
  PublicPartner,
  PublicPlan,
} from '@flex/contracts';
import { listCategories, listPartners } from '../api/public-catalog';
interface Props {
  plans: PublicPlan[];
  initialPlan?: PublicPlan;
  initialCategory?: string;
  initialCategories: PublicCategory[];
  initialPartners: PublicPartner[];
  initialInvalid?: boolean;
}
export default function CatalogIsland(props: Props) {
  const [plan, setPlan] = useState(props.initialPlan?.id ?? '');
  const [category, setCategory] = useState(props.initialCategory ?? '');
  const [categories, setCategories] = useState(props.initialCategories);
  const [partners, setPartners] = useState(props.initialPartners);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    props.initialPlan ? 'ready' : 'idle',
  );
  const request = useRef(0);
  useEffect(() => {
    if (!plan) return;
    const current = ++request.current;
    setStatus('loading');
    Promise.all([
      listCategories(plan),
      listPartners(plan, category || undefined),
    ])
      .then(([cs, ps]) => {
        if (current !== request.current) return;
        setCategories(cs);
        setPartners(ps);
        setStatus('ready');
      })
      .catch(() => {
        if (current === request.current) setStatus('error');
      });
  }, [plan, category]);
  const updateUrl = (planId: string, categoryId = '') => {
    const selected = props.plans.find((p) => p.id === planId);
    const url = new URL(location.href);
    if (selected) url.searchParams.set('plano', selected.slug);
    else url.searchParams.delete('plano');
    if (categoryId) url.searchParams.set('categoria', categoryId);
    else url.searchParams.delete('categoria');
    history.pushState({}, '', url);
  };
  const choosePlan = (value: string) => {
    setPlan(value);
    setCategory('');
    updateUrl(value);
  };
  const chooseCategory = (value: string) => {
    setCategory(value);
    updateUrl(plan, value);
  };
  const retry = () => {
    const saved = plan;
    setPlan('');
    requestAnimationFrame(() => setPlan(saved));
  };
  const selectedSlug = props.plans.find((p) => p.id === plan)?.slug;
  return (
    <>
      <div className="max-w-[640px]">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-foreground">
          Catálogo de parceiros
        </p>
        <h2
          className="mt-2 font-display text-[clamp(32px,6vw,48px)] font-semibold leading-[1.08] tracking-[-0.02em]"
          id="catalog-title"
        >
          Encontre seu próximo serviço.
        </h2>
        <p className="mt-3 text-[17px] text-foreground-soft">
          Escolha seu plano e filtre por categoria para encontrar o benefício
          que procura.
        </p>
      </div>
      <div className="mt-8 grid gap-5 md:[&>.plan-field]:max-w-[420px]">
        <div className="grid gap-1.5">
          <label htmlFor="plan-select">Seu plano</label>
          <div className="relative">
            <select
              id="plan-select"
              className="min-h-[52px] w-full cursor-pointer appearance-none rounded-[8px] border-[1.5px] border-control-border bg-background px-4 pr-12 text-base font-medium"
              value={plan}
              onChange={(e) => choosePlan(e.target.value)}
            >
              <option value="">Selecione seu plano</option>
              {props.plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <ChevronDown
                className="h-4 w-4"
                aria-hidden="true"
                strokeWidth={1.75}
              />
            </span>
          </div>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <span aria-hidden="true">ⓘ</span>O plano é informado por você e não
            é validado pelo Clube Flex.
          </p>
        </div>
        {plan && (
          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold" id="cat-label">
                Categorias
              </span>
              {category && (
                <button
                  className="min-h-11 border-0 bg-transparent px-1 text-accent-foreground underline decoration-accent-foreground underline-offset-3"
                  type="button"
                  onClick={() => chooseCategory('')}
                >
                  Limpar filtro
                </button>
              )}
            </div>
            <div
              className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] min-[900px]:mx-0 min-[900px]:flex-wrap min-[900px]:overflow-visible min-[900px]:px-0"
              role="group"
              aria-labelledby="cat-label"
            >
              <button
                className="min-h-11 flex-none rounded-full border-[1.5px] border-control-border bg-background px-[18px] font-medium aria-pressed:bg-primary aria-pressed:text-background"
                type="button"
                aria-pressed={!category}
                onClick={() => chooseCategory('')}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  className="min-h-11 flex-none rounded-full border-[1.5px] border-control-border bg-background px-[18px] font-medium aria-pressed:bg-primary aria-pressed:text-background"
                  type="button"
                  key={c.id}
                  aria-pressed={category === c.id}
                  onClick={() => chooseCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {props.initialInvalid && !plan && (
        <div
          className="mt-5 rounded-lg border border-accent bg-accent-soft p-4 text-accent-foreground"
          role="alert"
        >
          O plano informado não está mais disponível. Escolha outra opção.
        </div>
      )}
      <div className="mt-7 flex min-h-6 items-center justify-between gap-3 text-[15px] text-muted-foreground">
        <span aria-live="polite">
          {status === 'ready'
            ? `${partners.length} parceiro${partners.length === 1 ? '' : 's'} encontrado${partners.length === 1 ? '' : 's'}`
            : status === 'loading'
              ? 'Atualizando parceiros…'
              : ''}
        </span>
      </div>
      {!plan && (
        <div className="mt-6 grid justify-items-center gap-3 rounded-lg border-[1.5px] border-dashed border-control-border bg-background px-6 py-10 text-center">
          <span
            className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-accent-foreground"
            aria-hidden="true"
          >
            <BadgePercent
              className="h-5 w-5"
              aria-hidden="true"
              strokeWidth={1.75}
            />
          </span>
          <h3>Escolha seu plano</h3>
          <p>
            Selecione acima o plano que você informa possuir para consultar os
            parceiros e descontos disponíveis.
          </p>
        </div>
      )}
      {status === 'loading' && (
        <div
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          aria-busy="true"
        >
          {[1, 2, 3].map((n) => (
            <div
              className="flex min-h-[220px] flex-col gap-3.5 rounded-lg border border-border bg-background p-[22px]"
              key={n}
            >
              <div className="h-6 w-[35%] rounded-md bg-[linear-gradient(90deg,var(--color-border)_25%,var(--color-surface-muted)_50%,var(--color-border)_75%)] bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
              <div className="h-6 w-[70%] rounded-md bg-[linear-gradient(90deg,var(--color-border)_25%,var(--color-surface-muted)_50%,var(--color-border)_75%)] bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
              <div className="h-[18px] w-[55%] rounded-md bg-[linear-gradient(90deg,var(--color-border)_25%,var(--color-surface-muted)_50%,var(--color-border)_75%)] bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
              <div className="mt-auto h-14 rounded-md bg-[linear-gradient(90deg,var(--color-border)_25%,var(--color-surface-muted)_50%,var(--color-border)_75%)] bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
            </div>
          ))}
        </div>
      )}
      {status === 'error' && (
        <div
          className="mt-6 grid justify-items-center gap-3 rounded-lg border-[1.5px] border-dashed border-control-border bg-background px-6 py-10 text-center"
          role="alert"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-accent-foreground">
            <AlertCircle
              className="h-5 w-5"
              aria-hidden="true"
              strokeWidth={1.75}
            />
          </span>
          <h3>Não foi possível consultar o catálogo.</h3>
          <p>Verifique sua conexão e tente novamente.</p>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-accent-foreground px-4 text-[15px] font-semibold text-accent-foreground"
            onClick={retry}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {status === 'ready' && partners.length === 0 && (
        <div className="mt-6 grid justify-items-center gap-3 rounded-lg border-[1.5px] border-dashed border-control-border bg-background px-6 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-accent-foreground">
            <BadgePercent
              className="h-5 w-5"
              aria-hidden="true"
              strokeWidth={1.75}
            />
          </span>
          <h3>Nenhum parceiro encontrado</h3>
          <p>Não há parceiros nesta categoria para o plano escolhido.</p>
          {category && (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-accent-foreground px-4 text-[15px] font-semibold text-accent-foreground"
              onClick={() => chooseCategory('')}
            >
              Ver todas as categorias
            </button>
          )}
        </div>
      )}
      {status === 'ready' && partners.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {partners.map((p) => (
            <article
              className={`relative flex min-h-0 flex-col gap-3.5 rounded-lg border bg-background p-[22px] ${p.featured ? 'border-accent-foreground shadow-[inset_0_0_0_1px_var(--color-primary)]' : 'border-border'}`}
              key={p.slug}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {p.categories.map((c) => (
                    <span
                      className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-[3px] text-[13px] font-medium text-foreground-soft"
                      key={c.id}
                    >
                      {c.name}
                    </span>
                  ))}
                  {p.featured && (
                    <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-[3px] text-[13px] font-medium text-background">
                      ☆ Destaque
                    </span>
                  )}
                </div>
                {p.coupon && (
                  <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-[3px] text-[13px] font-medium text-accent-foreground">
                    Cupom
                  </span>
                )}
              </div>
              <h3 className="text-[21px] leading-[1.2]">
                <a
                  className="text-foreground no-underline after:absolute after:inset-0"
                  href={`/parceiros/${p.slug}?plano=${selectedSlug}`}
                >
                  {p.name}
                </a>
              </h3>
              <p className="text-[14.5px] text-muted-foreground">
                <MapPin
                  className="mr-1 inline h-4 w-4"
                  aria-hidden="true"
                  strokeWidth={1.75}
                />{' '}
                {p.units.length === 1
                  ? `${p.units[0]?.address.neighborhood}, ${p.units[0]?.address.city}`
                  : p.units.length
                    ? `${p.units.length} unidades`
                    : 'Atendimento online'}
              </p>
              <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-control-border pt-4">
                <div>
                  <small className="block text-[13px] text-muted-foreground">
                    Desconto
                  </small>
                  <strong className="font-display text-[34px] font-semibold leading-none text-accent-foreground">
                    <span className="mr-1 text-lg text-foreground-soft">
                      até
                    </span>
                    {p.discountPercentage}%
                  </strong>
                </div>
                <span className="font-semibold text-accent-foreground underline decoration-accent-foreground underline-offset-3">
                  Ver detalhes{' '}
                  <ArrowRight
                    className="inline h-4 w-4"
                    aria-hidden="true"
                    strokeWidth={1.75}
                  />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
