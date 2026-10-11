# Dashboard — arquitetura

**Aplicação:** Dashboard interno  
**Estado:** Aprovada

## Decisões aprovadas

- TypeScript.
- React.
- Vite.
- TanStack Router sem SSR.
- TanStack Query para estado remoto e cache da API.
- React Hook Form para gerenciamento dos formulários.
- Zod Resolver para integrar os esquemas Zod à validação dos formulários.
- Axios como cliente HTTP.
- Tailwind CSS 4 como camada de estilos, com tokens em `src/styles/tailwind.css` e utilidades aplicadas diretamente nos componentes.
- Lucide React como biblioteca única de ícones do dashboard, encapsulada pelo componente semântico `shared/ui/icon.tsx`.
- Radix UI como base de comportamento para componentes interativos complexos: dialogs, sheets laterais, confirmações, menus contextuais e toasts.
- `@dnd-kit/core` para a movimentação entre as etapas fixas do Kanban; o módulo usa apenas sensores, cards arrastáveis e colunas de destino, sem a dependência de ordenação interna.
- `tailwind-variants` para variantes visuais e `tailwind-merge` com `clsx` para composição segura de classes Tailwind.
- Metadata do documento (título) declarada no `head` de cada rota e renderizada por `HeadContent`, sem efeitos manuais.
- SPA não indexável.
- Container Docker próprio publicado pelo Coolify.
- Consumo exclusivo da API central; sem acesso direto ao PostgreSQL.

## Evolução durante a implementação

A organização segue módulos verticais por domínio, com rotas finas e infraestrutura compartilhada mínima. Subdivisões só devem ser adicionadas quando houver uso real.

## Organização modular aprovada

```text
src/
  app/
    router.tsx
    providers.tsx
    app-shell.tsx
  routes/
    __root.tsx
    login.tsx
    _authenticated/
      route.tsx
      leads/
      partners/
      plans/
      categories/
      lead-sources/
      users/
      audit/
  modules/
    auth/
    leads/
    partners/
    plans/
    categories/
    lead-sources/
    users/
    audit/
  shared/
    http/
    ui/
    feedback/
    validation/
    utils/
```

- TanStack Router usa roteamento baseado em arquivos e divisão automática por rota.
- Arquivos de rota tratam URL, parâmetros, proteção e carregamento da página; não concentram formulários, chamadas Axios ou atualização de cache.
- Cada módulo pode possuir `api`, `queries`, `mutations`, `cache`, `schemas`, `pages` e `components`, somente quando necessários.
- Módulos expõem uma API pública e não importam arquivos internos de outros módulos.
- Código passa a `shared` somente após reutilização real.
- O frontend não replica controller, use case ou repository da API.

Fluxo principal:

`route → page → query ou mutation → função de API → Axios`

No retorno de uma mutação:

`resposta da API → mutation → atualização do cache → page e componentes`

### SOLID pragmático

- Pages compõem estados e componentes da tela.
- Componentes visuais não acessam Axios diretamente.
- Queries não contêm regras de apresentação.
- Atualizações de cache ficam centralizadas no módulo proprietário.
- Props e contratos locais permanecem pequenos e específicos.
- Não são criadas interfaces para bibliotecas ou componentes sem necessidade concreta de substituição.
- Ícones novos devem ser escolhidos do Lucide e adicionados ao mapa semântico de `shared/ui/icon.tsx`; páginas e módulos não importam ícones da biblioteca diretamente.
- Primitives Radix ficam encapsuladas em `shared/ui`; pages e módulos consomem somente os componentes locais (`Drawer`, `ConfirmDialog`, `RowMenu` e `useToast`).
- Componentes de baixa complexidade e sem comportamento composto, como alertas persistentes, badges e cards, permanecem locais e usam variantes Tailwind quando necessário.

## Estado remoto e cache

- A API é a fonte autoritativa; o dashboard não mantém uma segunda fonte global dos recursos remotos.
- O `QueryClient` aplica por padrão `staleTime` de 30 segundos e `gcTime` de 5 minutos: durante o período fresco, a montagem ou navegação entre telas reutiliza o cache sem refazer a consulta; queries sem observadores permanecem disponíveis para reutilização durante o `gcTime`.
- Queries específicas podem sobrescrever esses valores quando o domínio exigir uma política diferente (por exemplo, a sessão), mas a exceção deve ser explícita e justificada no módulo.
- Query keys são estáveis e representam coleções e detalhes, como `['leads']` e `['leads', leadId]`.
- Criações inserem a representação retornada na coleção correspondente e no cache de detalhe quando aplicável.
- Edições e mudanças de estado substituem imutavelmente o recurso nas coleções já carregadas e no detalhe.
- Exclusões removem o recurso das coleções e ajustam ou removem o detalhe conforme `deleted` ou `anonymized`.
- Mutações de itens internos retornam e atualizam o agregado completo: parceiro ou lead.
- Atualizações bem-sucedidas não invalidam nem refazem automaticamente a listagem quando a resposta já contém toda a informação necessária.
- `version` e `ETag` retornados pela API acompanham o recurso no cache e são usados na próxima mutação.
- `RESOURCE_VERSION_CONFLICT` impede a substituição local silenciosa e exige reconciliação com a versão atual do servidor.
- Atualizações do cache são imutáveis.
- Mutações não são repetidas automaticamente após falha ou resposta incerta.
- Queries ativas são atualizadas quando o usuário retorna à aba do navegador, respeitando o `staleTime`; não haverá polling contínuo ou WebSocket nesta entrega.

### Kanban de leads

- O Kanban é composto localmente por quadro, coluna, card, configuração das etapas e mutation; a página somente coordena filtros, criação e confirmação de transições sensíveis.
- A movimentação ocorre exclusivamente pelo arraste do card entre as colunas. A biblioteca fornece sensores de ponteiro e teclado, overlay e estado de destino sem listeners HTML5 manuais.
- A resposta da mudança de etapa substitui o lead nos caches de lista e detalhe, sem nova consulta da listagem.
- Uma atualização otimista pode mover o cartão antes da resposta para melhorar a percepção de velocidade.
- Quando usada, ela deve guardar o estado anterior e restaurá-lo em caso de erro.
- A resposta bem-sucedida sempre substitui a previsão otimista, incluindo a nova `version` e quaisquer mudanças calculadas pela API.
- Em conflito de versão, o cartão retorna ao estado confirmado e a interface informa que o lead foi alterado por outra pessoa.

## Formulários e HTTP

- React Hook Form gerencia estado, interação e submissão dos formulários.
- Zod Resolver aplica no cliente os esquemas de validação compatíveis com os contratos compartilhados.
- A validação do cliente melhora a experiência, mas não substitui a validação da API.
- Axios realiza as chamadas HTTP, incluindo credenciais de sessão conforme a política de cookies aprovada.
- A organização de instâncias, interceptadores, tratamento de erros e adaptação dos contratos permanece adiada.
- Esquemas de `packages/contracts` representam os contratos HTTP; schemas locais podem tratar confirmação, coerção e outros estados exclusivamente visuais.
- A transformação entre o formulário e o request ocorre em fronteira explícita do módulo.

## Referências oficiais

- [Roteamento baseado em arquivos](https://tanstack.com/router/latest/docs/routing/file-based-routing)
- [Divisão automática de código](https://tanstack.com/router/latest/docs/guide/code-splitting)
- [Query options](https://tanstack.com/query/latest/docs/framework/react/reference/functions/queryOptions)

## Operação

- Desenvolvimento inicialmente local.
- Produção em container independente no Coolify quando disponibilizada.
- Deploy automático somente após os testes obrigatórios.
- Verificação de processo ativo e logs estruturados sem dados pessoais.

## Referência oficial

- [TanStack Router com Vite](https://tanstack.com/router/latest/docs/installation/with-vite)
