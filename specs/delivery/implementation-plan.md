# Plano de implementação

**Etapa:** 11 — Implementação  
**Estado:** Aprovado

Este documento organiza a futura implementação. Ele não autoriza o início do desenvolvimento, que depende de autorização explícita após a revisão das especificações.

## Princípios de entrega

- Cada incremento termina integrado, testável e coerente com os contratos aprovados.
- Não haverá uma fase final dedicada a conectar partes desenvolvidas isoladamente.
- Infraestrutura e abstrações são criadas quando o incremento consumidor precisar delas.
- Migrações, contratos e testes acompanham a funcionalidade correspondente.
- Nenhum incremento amplia o escopo funcional sem nova aprovação.

## Incremento 1 — Fundação

### Objetivo

Estabelecer a base executável comum sem implementar fluxos completos de negócio.

### Entregas

- monorepo com pnpm workspaces;
- aplicações API, dashboard e catálogo inicializáveis;
- pacote de contratos compartilhados;
- TypeScript, formatação e lint;
- PostgreSQL local descartável;
- Drizzle e primeira migration;
- composição inicial da API Express;
- Pino, `requestId` e tratamento global de erros;
- endpoints de processo ativo e prontidão;
- pipeline inicial do GitHub Actions;
- builds Docker reproduzíveis.

### Critério de saída

As três aplicações compilam, a API conecta ao banco migrado, os checks obrigatórios iniciais passam e nenhum dado funcional fictício é necessário.

### Registro de execução

Executado em 2026-10-10. Decisões tomadas durante a execução, dentro do escopo aprovado:

- **Migration inicial:** `0000_baseline` não cria tabelas; estabelece o histórico versionado. As tabelas de domínio nascem nos incrementos que as consomem.
- **Dependências adiadas até o consumidor real:** TanStack Router/Query, React Hook Form, Axios e a integração React do Astro entram nos incrementos 2 e 4; Tailwind entra no dashboard no incremento 2 e no catálogo no incremento 4. Os tokens de marca ainda não existiam nas especificações; passaram a vir do `tailwind.css` (ver incremento 2).
- **TypeScript 6:** typescript-eslint e `astro check` ainda não suportam o TypeScript 7.
- **Contratos:** `@flex/contracts` é consumido como TypeScript e embutido no bundle da API.
- **Health checks:** `/v1/health/live` e `/v1/health/ready` na API; `/health` no catálogo e no dashboard (ver contratos).
- **Dashboard em container:** arquivos estáticos servidos por nginx.
- **Não coberto:** E2E, OpenAPI gerado e deploy automático dependem de fluxos e incrementos posteriores; o pipeline do GitHub Actions ainda não foi executado, pois o repositório não está versionado.

## Incremento 2 — Identidade e acesso

### Objetivo

Permitir o primeiro acesso seguro e estabelecer a autorização usada pelos incrementos seguintes.

### Entregas

- usuários, credenciais, sessões, códigos e permissões;
- comando de bootstrap do primeiro administrador;
- login, logout, ativação, recuperação e alteração de senha;
- middlewares de sessão, autenticação, CSRF e permissões;
- catálogo fixo de permissões;
- shell autenticado e telas de acesso do dashboard;
- testes de integração de autenticação, sessão e autorização.

### Bootstrap inicial

- executado somente por terminal local ou console do container;
- recebe nome completo e e-mail opcional;
- cria o primeiro usuário ativo com todas as permissões existentes;
- emite código de ativação pelas mesmas regras das demais contas;
- nunca recebe nem define a senha;
- recusa execução quando já existir qualquer usuário;
- registra auditoria com ator técnico `system/bootstrap`.

### Critério de saída

O primeiro administrador consegue ativar a conta, autenticar-se e acessar somente operações permitidas. Sessão, CSRF e revogação estão cobertos por integração.

### Registro de execução

Executado em 2026-10-10. Decisões tomadas durante a execução, dentro do escopo aprovado e detalhadas nos [contratos](../apps/api/contracts/README.md):

- **Argon2id sem dependência nova:** usa `crypto.argon2` do Node 24. O hash guarda seus parâmetros (PHC), de modo que uma recalibração na VPS não invalida senhas existentes. Os parâmetros vêm do ambiente, com o mínimo da OWASP como padrão.
- **Senhas comuns:** a recusa usa uma lista curta embutida e a detecção de padrões repetidos. A verificação contra bases de vazamentos exige serviço externo e não foi implementada.
- **E-mail:** a API chama diretamente a API HTTP do Resend por `fetch`, sem SDK. Sem `RESEND_API_KEY`, toda entrega cai no fluxo manual previsto (código exibido uma única vez).
- **Token CSRF:** derivado da sessão (HMAC do identificador, sem novo armazenamento) e entregue no cabeçalho `X-CSRF-Token` da consulta da sessão, preservando o corpo contratado.
- **Limitação de tentativas:** limitador progressivo em memória, adequado a uma única instância da API.
- **Estilos do dashboard:** Tailwind CSS 4 com os tokens do `index.css` do responsável, hoje em `apps/dashboard/src/styles/tailwind.css` (paleta laranja/navy e Geist, substituindo a paleta verde proposta). Os protótipos foram realinhados aos tokens e passam a ser a fonte de construção da UI.
- **Metadata de rota:** o título do documento é declarado no `head` de cada rota (`HeadContent` na raiz), sem `useEffect`.
- **Auditoria:** a tabela de eventos nasce aqui para registrar o bootstrap (`user.created`, `user.permissions.updated`, `user.access-code.issued`); imutabilidade reforçada no banco, consulta e filtros ficam para o incremento 7.
- **Catálogo de permissões:** identificadores definidos em `packages/contracts` (ver contratos).
- **Navegação do dashboard:** somente o grupo Conta existe; os demais grupos entram com seus módulos.

Pendências conhecidas, sem bloqueio para os próximos incrementos:

- **Troca de senha obrigatória após redefinição administrativa (`CA-RF-015-11`):** o fluxo aprovado define a senha pelo próprio usuário com o código, e a especificação não descreve como o estado `passwordChangeRequired` é atribuído ou removido. Resolvido no incremento 7 (ver seu registro de execução).
- **Limpeza de sessões e códigos expirados:** registros expirados são recusados, mas ainda não removidos (encaminhamento da arquitetura da API).
- **E2E e axe:** a jornada `autenticar no dashboard` da suíte E2E entra no incremento 8; o fluxo foi verificado manualmente em navegador durante a execução.

## Incremento 3 — Administração do catálogo

### Objetivo

Permitir cadastrar e publicar os dados que alimentarão o catálogo público.

### Entregas

- planos e identificadores públicos estáveis;
- categorias;
- parceiros, contatos, unidades, benefícios e cupons;
- agregado transacional de parceiro;
- publicação, desativação, rascunho e republicação;
- controle otimista por `version`, `ETag` e `If-Match`;
- tabelas e formulário administrativo do dashboard;
- testes das regras de publicação, visibilidade, contatos e cupons.

### Dados iniciais

- Tradicional, Multi e Família são cadastrados manualmente pelo administrador, após confirmação dos nomes.
- Nenhum parceiro fictício é inserido.

### Critério de saída

Um usuário autorizado consegue cadastrar um parceiro completo e publicá-lo; entradas inválidas não alteram parcialmente o agregado.

### Registro de execução

Executado em 2026-10-10. Decisões tomadas durante a execução, dentro do escopo aprovado e detalhadas nos [contratos](../apps/api/contracts/README.md):

- **Regras compartilhadas em `packages/contracts`:** normalização de nomes, telefones e CEP, esquemas de entrada, regra de publicação (RN-001), visibilidade (RN-003), cupom efetivo (RN-016) e herança de contatos (RN-027). O dashboard reutiliza a mesma regra de publicação na lista "Para publicar".
- **Visibilidade, cupom efetivo e contatos herdados** existem como funções puras testadas, sem endpoint: serão consumidas pelo catálogo público no incremento 4.
- **Exclusão:** somente rascunho nunca publicado (`first_published_at` nulo); demais casos retornam `409 PROTECTED_RESOURCE`. Planos e categorias não possuem `DELETE`, pois o contrato aprovado não o define. Unidades e contatos são removidos pela omissão no `PUT`.
- **Endereços anteriores** de parceiros ficam em `partner_slug_history`; o redirecionamento público é entregue no incremento 4. O identificador de um plano é imutável depois de criado.
- **Autorização:** o formulário de parceiro lê planos e categorias, portanto quem edita parceiros também precisa de `plans.view` e `categories.view`.
- **Listagens do dashboard:** as colunas "parceiros com benefício" de planos e categorias do protótipo não foram implementadas, pois o contrato não expõe essa contagem. O protótipo usava o prefixo `/p/` para o endereço do parceiro; prevalece `/parceiros/{slug}` da especificação do catálogo (protótipo corrigido).
- **Rotas do dashboard** em português (`/parceiros`, `/planos`, `/categorias`), como `/senha`. Após a autenticação o usuário segue ao primeiro módulo que pode visualizar.
- **Não coberto:** E2E `cadastrar e publicar parceiro` (incremento 8) e testes automatizados do dashboard; a jornada foi verificada em navegador (Chromium headless) contra API e PostgreSQL reais.

## Incremento 4 — Catálogo público

### Objetivo

Disponibilizar a consulta pública indexável e prioritariamente móvel.

### Entregas

- landing page e copy aprovadas;
- planos, categorias e grade de parceiros;
- React Island hidratado com dados iniciais do SSR;
- URLs de plano e categoria;
- página Astro SSR compartilhável do parceiro;
- redirecionamento permanente de slug anterior;
- metadados, dados estruturados e estados operacionais;
- responsividade e requisitos públicos de acessibilidade.

### Critério de saída

O visitante seleciona um plano, filtra por categoria, consulta um parceiro e compartilha sua URL. Conteúdo geral do parceiro é indexável sem seleção automática de plano.

### Registro de execução

Executado em 2026-10-10. Decisões tomadas durante a execução, dentro do escopo aprovado:

- **API pública:** planos, categorias, grade e detalhe usam as regras compartilhadas de visibilidade, precedência de cupom e herança de contatos. Slugs anteriores respondem com redirecionamento permanente.
- **Renderização:** a home e o detalhe são Astro SSR; somente os filtros do catálogo hidratam como React Island, recebendo o resultado inicial do servidor.
- **Contexto compartilhável:** `plano` usa o slug público na URL e `categoria` usa UUID; nenhum plano é recuperado de armazenamento local.
- **Interface:** estrutura, copy e estados seguem o protótipo e os tokens aprovados.
- **SEO:** detalhe com metadados próprios e JSON-LD; conteúdo geral permanece disponível sem plano.
- **Incremento 5 preservado:** o assistente e a captação não foram antecipados. As chamadas comerciais usam o e-mail oficial até essa entrega.
- **Verificações:** integração cobre elegibilidade, ordenação, cupons, detalhe geral e redirecionamento; E2E, axe e Core Web Vitals permanecem no incremento 8.

## Incremento 5 — Assistente e captação pública

### Objetivo

Captar interesse comercial e orientar interessados em parceria.

### Entregas

- assistente virtual determinístico;
- jornada `Quero ser Flex` com consentimento e revisão;
- jornada `Quero ser parceiro` com orientação por e-mail;
- origem protegida `catálogo/site` criada automaticamente;
- solicitação de contato, consentimento e resposta neutra;
- endpoint público da definição vigente de consentimento;
- tratamento seguro de WhatsApp já existente;
- rate limiting e testes contra enumeração.

### Critério de saída

Contato novo cria lead sem responsável; contato existente registra novo interesse sem sobrescrever o lead; ambas as respostas públicas são indistinguíveis.

### Registro de execução

Executado em 2026-10-10. Decisões tomadas durante a execução, dentro do escopo aprovado:

- **Assistente independente:** React Island determinístico com `useReducer`, React Hook Form e Zod Resolver; os dados permanecem apenas em memória até o envio.
- **Consentimento versionado:** a API publica a definição vigente e aceita somente sua versão; a evidência registra data, versão e origem, sem IP.
- **Captação transacional:** a origem protegida `catálogo/site` nasce automaticamente. Um WhatsApp novo cria lead sem responsável; um existente preserva os dados e registra nova solicitação, consentimento, histórico e interesse pendente.
- **Proteção pública:** as duas situações retornam a mesma resposta `202`; o endpoint possui rate limiting por IP processado apenas em memória.
- **Interface:** os estados, textos, medidas e responsividade foram transcritos do protótipo do catálogo; a jornada de parceria continua por e-mail e não persiste dados.
- **Verificações:** testes de integração cobrem criação, duplicidade neutra, não sobrescrita, consentimento vigente e ausência de IP. A comparação visual automatizada em navegador não foi executada porque nenhum navegador estava disponível na sessão.

## Incremento 6 — Operação comercial

### Objetivo

Substituir a planilha na operação inicial de leads.

### Entregas

- cadastro manual e administração de origens;
- Kanban das cinco etapas;
- atribuição, redistribuição e devolução;
- edição de contato e origem;
- observações corrigíveis com preservação histórica;
- tratamento de novo interesse;
- histórico do lead;
- atualização otimista e reconciliação do cache.

### Critério de saída

Usuários veem somente os leads permitidos, operam o pipeline e recebem histórico consistente sem sobrescritas silenciosas.

### Registro de execução

Executado em 2026-10-10. Decisões tomadas durante a execução, dentro do escopo aprovado:

- **Agregado e concorrência:** leads, origens, observações e solicitações foram integrados ao PostgreSQL; toda mutação interna do lead usa `version`, `ETag` e `If-Match` e devolve a representação completa atualizada.
- **Escopo:** `leads.view-own` limita a consulta aos leads atribuídos ao usuário; `leads.view-all` inclui todos e os sem responsável. Editar outro responsável exige visualização global, e o responsável pode devolver o próprio lead sem a permissão de redistribuição.
- **Histórico:** criação, contato/origem, etapa, atribuição, observações e tratamento de interesse produzem eventos imutáveis. A correção de observação preserva o texto anterior no evento.
- **Interface:** Kanban, filtros, destaque de novo interesse, detalhe, histórico, cadastro manual e origens seguem o protótipo do dashboard e os tokens existentes. Em 2026-10-11, o Kanban passou a usar `@dnd-kit/core`, com movimentação exclusivamente por arraste, sensores de ponteiro e teclado, overlay e confirmação ao soltar em etapas sensíveis; não há controle ou dialog de seleção manual de etapa.
- **Limite do incremento:** exclusão ou anonimização de lead permanece no incremento 7, como definido no plano; o incremento 6 não expõe essa operação na interface.
- **Verificações:** testes de integração cobrem cadastro, pipeline, conflito de versão, histórico, escopo próprio e devolução; lint, TypeScript e builds foram executados.

## Incremento 7 — Administração e privacidade

### Objetivo

Completar a governança administrativa da primeira entrega.

### Entregas

- administração de usuários e códigos de acesso;
- concessão e revogação de permissões;
- proteções contra autoalteração e perda do último administrador;
- exclusão ou anonimização de leads;
- auditoria imutável, filtros e detalhe;
- atualização direcionada dos caches administrativos.

### Critério de saída

As operações administrativas sensíveis respeitam permissões, produzem auditoria e preservam dados conforme as regras aprovadas.

### Registro de execução

Executado em 2026-10-10. Decisões tomadas durante a execução, dentro do escopo aprovado e detalhadas nos [contratos](../apps/api/contracts/README.md):

- **Troca de senha obrigatória (`CA-RF-015-11`) — pendência do incremento 2 resolvida:** a emissão administrativa de código de recuperação marca a conta como `passwordChangeRequired`; a senha anterior deixa de autenticar até a definição da nova com o código, que limpa a marca. A situação é exibida no dashboard.
- **Administrador elegível:** conta ativa, com senha definida, que possui `users.manage` e `permissions.manage`. Desativação, revogação e perda do último administrador são recusadas sob trava transacional; autoalteração e concessão de permissão ausente no autor também.
- **Versão da conta:** `users.version` protege edição, estado e substituição de permissões; o dashboard grava dados e permissões em duas chamadas sequenciais, cada uma com a versão devolvida pela anterior.
- **Auditoria:** consulta paginada e filtrada, evento somente leitura e imutabilidade reforçada por gatilho no banco (`0006_administration_and_privacy`). O dashboard oferece, além dos filtros do protótipo (período, ação e autor), o filtro por usuário afetado exigido por `RNF-007`; o protótipo foi atualizado.
- **Exclusão ou anonimização:** regra única em `packages/contracts` (`leadRemovalOutcome`), aplicada pela API e usada pelo dashboard apenas para descrever o efeito. Observações, solicitações já tratadas e eventos de histórico posteriores à entrada contam como histórico a preservar. Texto livre de observações, detalhe de origem e motivo de perda são preservados na anonimização; a auditoria não repete dados pessoais.
- **Código de acesso:** entregue ao detalhe do usuário somente em memória após a criação, nunca em URL, armazenamento do navegador ou cache de consultas. O campo de nome de usuário do cadastro é apenas informativo (gerado pelo servidor); o protótipo foi alinhado a isso.
- **Atualização dos caches:** as mutações de usuário substituem a conta na listagem e no detalhe com a resposta confirmada e invalidam somente a consulta de auditoria; a remoção de lead retira o item do cache de leads.
- **Fora do incremento:** E2E dos fluxos administrativos e verificação axe permanecem no incremento 8.
- **Verificações:** testes de integração cobrem criação, colisão de nomes, entrega manual e por e-mail, versão, permissões por rota, emissão e invalidação de códigos, recuperação administrativa, proteções, desativação com revogação de sessões, auditoria (ordem, filtros, paginação, imutabilidade e ausência de segredos) e exclusão ou anonimização de lead. A interface foi comparada ao protótipo em navegador Chromium contra API e PostgreSQL reais.

## Incremento 8 — Hardening e publicação

### Objetivo

Validar o conjunto integrado e prepará-lo para operação na VPS.

### Entregas

- suíte E2E crítica;
- validação de segurança e privacidade;
- axe e verificação manual de teclado e leitor de tela;
- metas de desempenho do catálogo;
- validação cross-browser;
- revisão de logs e ausência de dados sensíveis;
- containers finais e configuração do Coolify;
- migrations validadas em banco vazio;
- aceite em build local de produção;
- deploy automático condicionado aos checks;
- smoke test não destrutivo em produção.

### Critério de saída

Todos os critérios obrigatórios da estratégia de qualidade passam, o aceite manual é concluído e não existem pendências bloqueantes para publicação.

## Dependências principais

```mermaid
flowchart LR
    I1[1. Fundação] --> I2[2. Identidade e acesso]
    I2 --> I3[3. Administração do catálogo]
    I3 --> I4[4. Catálogo público]
    I2 --> I5[5. Assistente e captação]
    I4 --> I5
    I5 --> I6[6. Operação comercial]
    I2 --> I7[7. Administração e privacidade]
    I6 --> I7
    I3 --> I8[8. Hardening e publicação]
    I4 --> I8
    I5 --> I8
    I6 --> I8
    I7 --> I8
```

## Refatoração transversal — páginas de detalhe do dashboard

### Objetivo

Reduzir responsabilidades acumuladas nas páginas de detalhe e uniformizar o
carregamento de recursos obrigatórios, começando pelo detalhe de usuários.

### Execução inicial

Executada em 2026-10-11:

- autorização permanece no `beforeLoad`;
- o detalhe de usuário carrega sua conta no `loader` com `ensureQueryData`;
- 404 redireciona para `/usuarios`;
- erros de carregamento usam o boundary da rota e o reset do TanStack Query;
- `UserDetailPage` recebe o usuário inicial e mantém a observação do cache para
  as mutações e a reconciliação de versão.

### Próximos incrementos

- extrair seções de apresentação do detalhe de usuários quando houver ganho de
  leitura comprovado;
- aplicar o padrão ao detalhe de leads, separando dados obrigatórios e
  secundários;
- aplicar o padrão ao formulário/detalhe de parceiros, incluindo suas
  dependências;
- adicionar testes de rota para recurso existente, 404, erro recuperável e
  reconciliação após conflito.

## Fora deste plano

- base de assinantes e validação do plano contratado;
- cobrança;
- aplicativo móvel;
- integrações com anúncios;
- agendamentos;
- notificações e alertas de próximo contato;
- vigência automática de benefícios e cupons;
- filas e workers;
- backup e recuperação do banco nesta primeira entrega.
