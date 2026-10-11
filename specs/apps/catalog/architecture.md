# Catálogo — arquitetura

**Aplicação:** Catálogo público  
**Estado:** Aprovada

## Decisões aprovadas

- TypeScript.
- Astro.
- Tailwind para estilos, com os tokens definidos em `tailwind.css` (ver [fundamentos de interface](../ui-foundations.md)).
- Renderização no servidor para páginas públicas dinâmicas.
- Adaptador oficial Node do Astro.
- Container Docker próprio publicado pelo Coolify.
- Consumo da API central; sem acesso direto ao PostgreSQL.
- SEO e experiência móvel como prioridades.
- Página inicial predominantemente composta por componentes Astro e HTML renderizado no servidor.
- `@lucide/astro` como biblioteca única de ícones do catálogo, importada diretamente pelos componentes que os utilizam.
- Dados iniciais do catálogo consultados no servidor e entregues ao componente interativo como propriedades.
- Catálogo interativo implementado como React Island hidratado, sem uso de `client:only`.
- Assistente virtual implementado como React Island independente do catálogo.
- Detalhe de parceiro renderizado por rota Astro SSR própria e compartilhável.
- Axios como cliente HTTP dos fluxos interativos.
- React Hook Form e Zod Resolver no formulário do assistente virtual.

## Evolução durante a implementação

Nomes de arquivos e subdivisões internas podem ser ajustados conforme surgirem consumidores reais, sem romper as fronteiras aprovadas entre páginas Astro, features, Islands e código compartilhado.

## Organização modular aprovada

```text
src/
  pages/
    index.astro
    privacidade.astro
    404.astro
    parceiros/[slug].astro
  layouts/
    public-layout.astro
  features/
    home/
      components/
    catalog/
      api/
      components/
      schemas/
      index.ts
    partner/
      api/
      components/
      index.ts
    assistant/
      api/
      components/
      flow/
      schemas/
      index.ts
  shared/
    http/
    seo/
    ui/
    utils/
    config/
  styles/
    tailwind.css
```

- A árvore define limites; diretórios sem arquivos reais não devem ser criados antecipadamente.
- Páginas compõem features e não concentram toda a interface ou lógica HTTP.
- Features expõem somente sua API pública e não importam detalhes internos umas das outras.
- Código só passa a `shared` quando houver reutilização concreta.
- Não serão replicadas no frontend as camadas controller, use case e repository da API.

## Fronteiras aprovadas de renderização

```text
Página inicial Astro SSR
├── conteúdo institucional em Astro
├── catálogo em React Island com dados iniciais do SSR
├── assistente virtual em React Island independente
└── rodapé em Astro

Página de parceiro Astro SSR
└── /parceiros/{slug}
```

- O servidor Astro consulta a API para produzir o HTML inicial do catálogo.
- O React assume seleção de plano, filtro por categoria, atualização da listagem e estados operacionais depois da hidratação.
- Uma falha no assistente não deve impedir o funcionamento do catálogo, e vice-versa.
- O detalhe não será um modal; sua rota própria preserva indexação, compartilhamento, histórico e acessibilidade.
- A página inicial lê `plano` e `categoria` da URL, consulta a API no servidor e fornece os dados iniciais ao Island.
- Plano e categoria são a fonte compartilhável de estado; não haverá store global para esse contexto.
- A página de parceiro permanece majoritariamente Astro e troca o plano por navegação SSR.

## Estado e acesso à API

- TanStack Query não será utilizado no catálogo nesta entrega.
- O Island usa estado local, cancela consultas superadas e aplica somente a resposta da seleção atual.
- Não há cache de aplicação para dados do catálogo.
- Axios fica encapsulado em um cliente HTTP público pequeno e em funções semânticas por feature; componentes não o acessam diretamente.
- O cliente HTTP trata configuração comum e converte `application/problem+json`, mas não exibe feedback nem contém regras de negócio.
- Contratos vêm de `packages/contracts`; validação do cliente não substitui a API.

## Assistente virtual

- React Hook Form e Zod Resolver gerenciam o formulário guiado.
- `useReducer` representa o fluxo determinístico, sem biblioteca externa de máquina de estados.
- Estados conceituais: fechado, boas-vindas, instruções de parceria, coleta de nome, WhatsApp e e-mail, consentimento, revisão, envio, sucesso e erro.
- Dados não enviados permanecem somente em memória durante a navegação atual.

## Restrição já aprovada de cache

- Dados de catálogo não utilizarão cache de aplicação nesta entrega, para que alterações publicadas apareçam imediatamente.
- Arquivos estáticos podem utilizar cache HTTP de longa duração com versionamento de conteúdo.

## Operação

- Desenvolvimento inicialmente local.
- Produção em container independente no Coolify quando disponibilizada.
- Deploy automático somente após os testes obrigatórios.
- Verificação de processo ativo e logs estruturados sem dados pessoais.

## Referência oficial

- [Renderização sob demanda do Astro](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Arquitetura de Islands do Astro](https://docs.astro.build/en/concepts/islands/)
