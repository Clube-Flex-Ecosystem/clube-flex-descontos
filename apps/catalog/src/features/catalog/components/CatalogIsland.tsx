import { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    ArrowRight,
    BadgePercent,
    Check,
    ChevronDown,
    MapPin,
    Star,
    Ticket,
} from 'lucide-react';
import type {
    PublicCategory,
    PublicPartner,
    PublicPlan,
} from '@flex/contracts';
import { listCategories, listPartners } from '../api/public-catalog';
import { button } from '../../../components/ui/button';

const chip =
    'group inline-flex min-h-11 flex-none items-center gap-2 rounded-full border-[1.5px] border-border-strong bg-surface px-4.5 text-control-sm font-medium text-foreground transition-colors duration-120 hover:border-muted-foreground aria-pressed:border-sidebar aria-pressed:bg-sidebar aria-pressed:text-surface';
const tag =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.75 text-caption font-medium';
const stateBox =
    'mt-6 grid justify-items-center gap-3 rounded-card border-[1.5px] border-dashed border-border-strong bg-surface px-6 py-10 text-center';
const stateIcon =
    'grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-foreground';
const stateTitle = 'font-display text-subheading';
const skeleton =
    'rounded-md bg-[linear-gradient(90deg,var(--color-surface-muted)_25%,var(--color-background)_50%,var(--color-surface-muted)_75%)] bg-size-[200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] motion-reduce:animate-none';

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
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'ready' | 'error'
    >(props.initialPlan ? 'ready' : 'idle');
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
    const pressedMark = (
        <Check
            className="hidden h-3.5 w-3.5 group-aria-pressed:block"
            aria-hidden="true"
            strokeWidth={3}
        />
    );
    return (
        <>
            <div className="max-w-170">
                <p className="text-eyebrow font-stretch-115% uppercase text-accent-foreground">
                    Catálogo de parceiros
                </p>
                <h2
                    className="mt-2.5 font-display text-display font-stretch-110%"
                    id="catalog-title"
                >
                    Encontre seu próximo serviço.
                </h2>
                <p className="mt-3.5 text-[17px] text-foreground-soft">
                    Escolha seu plano e filtre por categoria para encontrar o
                    benefício que procura.
                </p>
            </div>
            <div className="mt-8 grid gap-5">
                <div className="grid gap-1.5 md:max-w-105">
                    <label
                        className="text-control-sm font-semibold"
                        htmlFor="plan-select"
                    >
                        Seu plano
                    </label>
                    <div className="relative">
                        <select
                            id="plan-select"
                            className="min-h-13 w-full cursor-pointer appearance-none rounded-control border-[1.5px] border-control-border bg-surface px-4 pr-12 text-base font-medium text-foreground shadow-soft hover:border-muted-foreground"
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
                        <ChevronDown
                            className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-soft"
                            aria-hidden="true"
                            strokeWidth={1.75}
                        />
                    </div>
                </div>
                {plan && (
                    <div className="grid gap-1.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                            <span
                                className="text-control-sm font-semibold"
                                id="cat-label"
                            >
                                Categorias
                            </span>
                            {category && (
                                <button
                                    className="min-h-11 border-0 bg-transparent px-1 font-semibold text-foreground underline decoration-brand-signal decoration-2 underline-offset-4"
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
                                className={chip}
                                type="button"
                                aria-pressed={!category}
                                onClick={() => chooseCategory('')}
                            >
                                {pressedMark}
                                Todas
                            </button>
                            {categories.map((c) => (
                                <button
                                    className={chip}
                                    type="button"
                                    key={c.id}
                                    aria-pressed={category === c.id}
                                    onClick={() => chooseCategory(c.id)}
                                >
                                    {pressedMark}
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {props.initialInvalid && !plan && (
                <div
                    className="mt-5 rounded-control bg-warning-soft p-4 text-warning"
                    role="alert"
                >
                    O plano informado não está mais disponível. Escolha outra
                    opção.
                </div>
            )}
            <div className="mt-7 flex min-h-6 items-center justify-between gap-3 text-control-sm text-muted-foreground">
                <span aria-live="polite">
                    {status === 'ready'
                        ? `${partners.length} parceiro${partners.length === 1 ? '' : 's'} encontrado${partners.length === 1 ? '' : 's'}`
                        : status === 'loading'
                          ? 'Atualizando parceiros…'
                          : ''}
                </span>
            </div>
            {!plan && (
                <div className={stateBox}>
                    <span className={stateIcon} aria-hidden="true">
                        <BadgePercent
                            className="h-5 w-5"
                            aria-hidden="true"
                            strokeWidth={1.75}
                        />
                    </span>
                    <h3 className={stateTitle}>Escolha seu plano</h3>
                    <p className="max-w-[30em] text-foreground-soft">
                        Selecione acima o plano que você informa possuir para
                        consultar os parceiros e descontos disponíveis.
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
                            className="flex min-h-55 flex-col gap-3.5 rounded-card border border-border bg-surface p-5.5"
                            key={n}
                        >
                            <div className={`h-6 w-[35%] ${skeleton}`} />
                            <div className={`h-6 w-[70%] ${skeleton}`} />
                            <div className={`h-4.5 w-[55%] ${skeleton}`} />
                            <div className={`mt-auto h-14 ${skeleton}`} />
                        </div>
                    ))}
                </div>
            )}
            {status === 'error' && (
                <div className={stateBox} role="alert">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-danger-soft text-danger">
                        <AlertCircle
                            className="h-5 w-5"
                            aria-hidden="true"
                            strokeWidth={1.75}
                        />
                    </span>
                    <h3 className={stateTitle}>
                        Não foi possível consultar o catálogo.
                    </h3>
                    <p className="text-foreground-soft">
                        Verifique sua conexão e tente novamente.
                    </p>
                    <button className={button('primary', 'sm')} onClick={retry}>
                        Tentar novamente
                    </button>
                </div>
            )}
            {status === 'ready' && partners.length === 0 && (
                <div className={stateBox}>
                    <span className={stateIcon}>
                        <BadgePercent
                            className="h-5 w-5"
                            aria-hidden="true"
                            strokeWidth={1.75}
                        />
                    </span>
                    <h3 className={stateTitle}>Nenhum parceiro encontrado</h3>
                    <p className="text-foreground-soft">
                        Não há parceiros nesta categoria para o plano escolhido.
                    </p>
                    {category && (
                        <button
                            className={button('secondary', 'sm')}
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
                            className={`relative flex min-h-0 flex-col gap-3.5 overflow-hidden rounded-card border border-border bg-surface p-5.5 transition-[border-color,box-shadow,transform] duration-200 ease-out focus-within:border-border-strong hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card motion-reduce:hover:translate-y-0 ${p.featured ? 'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-brand-signal' : ''}`}
                            key={p.slug}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {p.categories.map((c) => (
                                        <span
                                            className={`${tag} bg-surface-muted text-foreground-soft`}
                                            key={c.id}
                                        >
                                            {c.name}
                                        </span>
                                    ))}
                                    {p.featured && (
                                        <span
                                            className={`${tag} bg-sidebar text-surface`}
                                        >
                                            <Star
                                                className="h-3.5 w-3.5"
                                                aria-hidden="true"
                                                strokeWidth={1.75}
                                            />
                                            Destaque
                                        </span>
                                    )}
                                </div>
                                {p.coupon && (
                                    <span
                                        className={`${tag} shrink-0 bg-accent-soft text-accent-foreground`}
                                    >
                                        <Ticket
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                            strokeWidth={1.75}
                                        />
                                        Cupom
                                    </span>
                                )}
                            </div>
                            <h3 className="font-display text-heading">
                                <a
                                    className="text-foreground no-underline outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-focus"
                                    href={`/parceiros/${p.slug}?plano=${selectedSlug}`}
                                >
                                    {p.name}
                                </a>
                            </h3>
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin
                                    className="h-4 w-4 shrink-0"
                                    aria-hidden="true"
                                    strokeWidth={1.75}
                                />
                                {p.units.length === 1
                                    ? `${p.units[0]?.address.neighborhood}, ${p.units[0]?.address.city}`
                                    : p.units.length
                                      ? `${p.units.length} unidades`
                                      : 'Atendimento online'}
                            </p>
                            <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
                                <div>
                                    <small className="block text-caption text-muted-foreground">
                                        Desconto
                                    </small>
                                    <strong className="font-display text-number font-stretch-108% tabular-nums text-accent-strong">
                                        <span className="mr-1 font-sans text-[17px] font-semibold font-stretch-100% tracking-normal text-foreground-soft">
                                            até
                                        </span>
                                        {p.discountPercentage}%
                                    </strong>
                                </div>
                                <span className="inline-flex items-center gap-1 font-semibold text-foreground underline decoration-brand-signal decoration-2 underline-offset-4">
                                    Ver detalhes
                                    <ArrowRight
                                        className="h-4 w-4"
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
