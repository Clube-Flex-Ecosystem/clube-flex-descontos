# ADR-0008 — Arquitetura interna dos frontends

**Estado:** Aceito  
**Decisão:** 2026-10-10

## Contexto

O catálogo prioriza conteúdo SSR e baixo JavaScript, enquanto o dashboard possui estado remoto, formulários e módulos administrativos que crescerão ao longo do projeto. As duas aplicações precisam permanecer compreensíveis para um único mantenedor sem perder limites claros.

## Decisão

### Catálogo

- Organizar por features: home, catálogo, parceiro e assistente.
- Usar Astro para composição e SSR.
- Hidratar React somente no catálogo interativo e no assistente.
- Entregar dados iniciais do servidor ao Island do catálogo.
- Manter plano e categoria na URL, sem estado global ou TanStack Query.
- Renderizar o detalhe do parceiro em rota Astro própria.
- Encapsular Axios em funções públicas por feature.
- Usar React Hook Form, Zod Resolver e `useReducer` no assistente.
- Usar Tailwind com os tokens de marca de `tailwind.css`, os mesmos do dashboard (revisão de 2026-10-10).

### Dashboard

- Organizar por módulos verticais de domínio.
- Manter rotas baseadas em arquivos pequenas e aplicar divisão automática por rota.
- Separar pages, componentes, API, queries, mutations, cache e schemas quando houver necessidade real.
- Usar TanStack Query como fonte do estado remoto no cliente e atualizar o cache a partir das respostas completas da API.
- Usar React Hook Form, Zod Resolver e Axios.
- Usar Tailwind CSS com os tokens de `src/styles/tailwind.css` (revisão de 2026-10-10).
- Declarar o título do documento no `head` das rotas do TanStack Router (revisão de 2026-10-10).
- Compartilhar somente infraestrutura e UI realmente reutilizadas.

### Limites comuns

- Não replicar no frontend as camadas controller, use case e repository da API.
- Não criar interfaces ou diretórios sem consumidor real.
- Consumir contratos de `packages/contracts` e manter validações específicas de interface próximas aos formulários.

## Consequências

### Positivas

- O catálogo envia pouco JavaScript e preserva SEO.
- O dashboard pode crescer por domínio sem concentrar toda a lógica em rotas ou pastas técnicas globais.
- Atualizações de cache evitam consultas redundantes.
- Fronteiras explícitas reduzem acoplamento entre módulos.

### Negativas

- Catálogo e dashboard adotam estratégias de estado diferentes.
- Módulos exigem disciplina para não acessar detalhes internos uns dos outros.
- Alguns contratos visuais existem apenas no frontend e precisam ser adaptados aos contratos HTTP.

## Revisão 2026-10-10

- **Estilos e tokens:** o responsável definiu o `index.css` fornecido como paleta principal de catálogo e dashboard. Ele passa a ser `apps/dashboard/src/styles/tailwind.css`, fonte de verdade dos tokens. O catálogo adota o mesmo bloco no incremento 4; um local compartilhado só será criado mediante decisão arquitetural.
- **Dashboard com Tailwind:** a decisão anterior de não definir biblioteca de estilos para o dashboard foi substituída pelo uso de Tailwind CSS 4.
- **Metadata:** o título deixa de ser atualizado por `useEffect` e passa a ser declarado no `head` de cada rota.
- **Protótipos:** passam a ser a fonte de construção da UI (ver [fundamentos de interface](../apps/ui-foundations.md)).

## Revisão 2026-10-11

- **Primitives interativas do dashboard:** Radix UI é adotado para dialogs, sheets laterais, confirmações, menus contextuais e toasts. As primitives permanecem encapsuladas em `shared/ui`; módulos não as importam diretamente.
- **Variantes e classes:** `tailwind-variants` define variantes dos componentes locais e `tailwind-merge` com `clsx` resolve conflitos de classes Tailwind. A adoção não transforma o projeto em uma biblioteca geral de componentes nem altera os tokens visuais aprovados.
