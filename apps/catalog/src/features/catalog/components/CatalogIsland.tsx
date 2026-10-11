import { useEffect, useRef, useState } from 'react';
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
      <div className="section-head">
        <p className="eyebrow">Catálogo de parceiros</p>
        <h2 className="display" id="catalog-title">
          Encontre seu próximo serviço.
        </h2>
        <p>
          Escolha seu plano e filtre por categoria para encontrar o benefício
          que procura.
        </p>
      </div>
      <div className="controls">
        <div className="field plan-field">
          <label htmlFor="plan-select">Seu plano</label>
          <div className="select-wrap">
            <select
              id="plan-select"
              className={!plan ? 'empty' : ''}
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
            <span className="select-arrow" aria-hidden="true">
              ⌄
            </span>
          </div>
          <p className="hint">
            <span aria-hidden="true">ⓘ</span>O plano é informado por você e não
            é validado pelo Clube Flex.
          </p>
        </div>
        {plan && (
          <div className="field">
            <div className="chips-label">
              <span className="label" id="cat-label">
                Categorias
              </span>
              {category && (
                <button
                  className="link-btn"
                  type="button"
                  onClick={() => chooseCategory('')}
                >
                  Limpar filtro
                </button>
              )}
            </div>
            <div className="chips" role="group" aria-labelledby="cat-label">
              <button
                className="chip"
                type="button"
                aria-pressed={!category}
                onClick={() => chooseCategory('')}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  className="chip"
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
        <div className="alert warning" role="alert">
          O plano informado não está mais disponível. Escolha outra opção.
        </div>
      )}
      <div className="results-bar">
        <span aria-live="polite">
          {status === 'ready'
            ? `${partners.length} parceiro${partners.length === 1 ? '' : 's'} encontrado${partners.length === 1 ? '' : 's'}`
            : status === 'loading'
              ? 'Atualizando parceiros…'
              : ''}
        </span>
      </div>
      {!plan && (
        <div className="state">
          <span className="s-icon" aria-hidden="true">
            %
          </span>
          <h3>Escolha seu plano</h3>
          <p>
            Selecione acima o plano que você informa possuir para consultar os
            parceiros e descontos disponíveis.
          </p>
        </div>
      )}
      {status === 'loading' && (
        <div className="grid" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div className="card skeleton" key={n}>
              <div className="sk sk-tag" />
              <div className="sk sk-title" />
              <div className="sk sk-line" />
              <div className="sk sk-bottom" />
            </div>
          ))}
        </div>
      )}
      {status === 'error' && (
        <div className="state error" role="alert">
          <span className="s-icon">!</span>
          <h3>Não foi possível consultar o catálogo.</h3>
          <p>Verifique sua conexão e tente novamente.</p>
          <button className="btn secondary sm" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}
      {status === 'ready' && partners.length === 0 && (
        <div className="state">
          <span className="s-icon">%</span>
          <h3>Nenhum parceiro encontrado</h3>
          <p>Não há parceiros nesta categoria para o plano escolhido.</p>
          {category && (
            <button
              className="btn secondary sm"
              onClick={() => chooseCategory('')}
            >
              Ver todas as categorias
            </button>
          )}
        </div>
      )}
      {status === 'ready' && partners.length > 0 && (
        <div className="grid">
          {partners.map((p) => (
            <article
              className={`card${p.featured ? ' featured' : ''}`}
              key={p.slug}
            >
              <div className="card-top">
                <div className="cats">
                  {p.categories.map((c) => (
                    <span className="tag" key={c.id}>
                      {c.name}
                    </span>
                  ))}
                  {p.featured && (
                    <span className="tag featured">☆ Destaque</span>
                  )}
                </div>
                {p.coupon && <span className="tag coupon">Cupom</span>}
              </div>
              <h3>
                <a href={`/parceiros/${p.slug}?plano=${selectedSlug}`}>
                  {p.name}
                </a>
              </h3>
              <p className="loc">
                ⌖{' '}
                {p.units.length === 1
                  ? `${p.units[0]?.address.neighborhood}, ${p.units[0]?.address.city}`
                  : p.units.length
                    ? `${p.units.length} unidades`
                    : 'Atendimento online'}
              </p>
              <div className="card-bottom">
                <div className="pct">
                  <small>Desconto</small>
                  <strong>
                    <span>até</span>
                    {p.discountPercentage}%
                  </strong>
                </div>
                <span className="more">Ver detalhes →</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
