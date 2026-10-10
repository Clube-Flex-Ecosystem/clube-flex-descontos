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
- Usar Tailwind com os tokens de marca definidos no CSS global.

### Dashboard

- Organizar por módulos verticais de domínio.
- Manter rotas baseadas em arquivos pequenas e aplicar divisão automática por rota.
- Separar pages, componentes, API, queries, mutations, cache e schemas quando houver necessidade real.
- Usar TanStack Query como fonte do estado remoto no cliente e atualizar o cache a partir das respostas completas da API.
- Usar React Hook Form, Zod Resolver e Axios.
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
