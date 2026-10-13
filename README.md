# Clube Flex

Monorepo do Clube Flex, formado por três aplicações publicáveis
independentemente e um pacote de contratos compartilhados. As especificações
oficiais estão em [specs/](specs/README.md).

| Pacote               | Responsabilidade                            | Execução padrão         |
| -------------------- | ------------------------------------------- | ----------------------- |
| `apps/api`           | API central (Express, Drizzle e PostgreSQL) | `http://localhost:3000` |
| `apps/dashboard`     | Dashboard interno (React e Vite)            | `http://localhost:5173` |
| `apps/catalog`       | Catálogo público (Astro SSR e Node)         | `http://localhost:4321` |
| `packages/contracts` | Esquemas Zod e tipos compartilhados         | —                       |

## Requisitos

- Node.js 24, conforme [`.node-version`](.node-version)
- pnpm 12.3.4, fixado em [`package.json`](package.json)
- Docker com Docker Compose, para os bancos locais

## Desenvolvimento local

Na raiz do repositório:

```bash
pnpm install
pnpm db:up

cp apps/api/.env.example apps/api/.env
cp apps/catalog/.env.example apps/catalog/.env
cp apps/dashboard/.env.example apps/dashboard/.env

pnpm --filter @flex/api db:migrate
```

O Compose cria dois PostgreSQL:

- `localhost:5434`: banco persistente de desenvolvimento (`flex`);
- `localhost:5433`: banco descartável dos testes (`flex_test`).

Inicie cada aplicação em um terminal separado:

```bash
pnpm dev:api       # http://localhost:3000
pnpm dev:dashboard # http://localhost:5173
pnpm dev:catalog   # http://localhost:4321
```

Verifique a API em [`/v1/health/ready`](http://localhost:3000/v1/health/ready).
O endpoint `live` verifica somente o processo; o endpoint `ready` também exige
conexão com o PostgreSQL.

Para parar os containers locais:

```bash
pnpm db:down
```

`pnpm db:down` preserva o volume de desenvolvimento. Para apagar
explicitamente os dados locais, use `docker compose down -v` sabendo que a
operação é irreversível.

### Primeiro usuário local

O seed cria ou atualiza o usuário `suporte`, concede todas as permissões e
garante a origem protegida `catálogo/site`. Ele exige uma senha somente durante
a execução:

```powershell
$env:SEED_SUPPORT_PASSWORD = 'troque-esta-senha'
pnpm --filter @flex/api db:seed
Remove-Item Env:SEED_SUPPORT_PASSWORD
```

Em Bash, use `SEED_SUPPORT_PASSWORD='troque-esta-senha' pnpm --filter @flex/api db:seed`.
O seed é idempotente, mas substitui a senha do usuário `suporte` a cada
execução. Nunca comite a senha nem a coloque em um arquivo versionado.

## Variáveis de ambiente

Os modelos copiáveis estão em `apps/api/.env.example`,
`apps/catalog/.env.example` e `apps/dashboard/.env.example`. Os arquivos `.env`
locais são ignorados pelo Git.

### API

| Variável                | Obrigatória   | Padrão / observação                                                                                       |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`              | Não           | `development`; valores aceitos: `development`, `test` e `production`                                      |
| `PORT`                  | Não           | `3000`                                                                                                    |
| `DATABASE_URL`          | Sim           | URL do PostgreSQL                                                                                         |
| `AUTH_SECRET`           | Produção      | Segredo longo e aleatório para assinar os JWTs; há um valor apenas para desenvolvimento local             |
| `DASHBOARD_ORIGIN`      | Produção      | Origem exata do dashboard, usada no CORS e nos links de e-mail; sem barra final                           |
| `CATALOG_ORIGIN`        | Não           | `http://localhost:4321`; origem do catálogo usada nos links                                               |
| `LOG_LEVEL`             | Não           | `debug` fora de produção e `info` em produção; também aceita `fatal`, `error`, `warn`, `trace` e `silent` |
| `TRUST_PROXY_HOPS`      | Não           | `0`; número de proxies confiáveis à frente da API (normalmente `1` atrás do proxy do Coolify)             |
| `RESEND_API_KEY`        | Não           | Chave do Resend. Se definida, `EMAIL_FROM` também é obrigatório                                           |
| `EMAIL_FROM`            | Condicional   | Remetente verificado no Resend, por exemplo `Clube Flex <nao-responda@flexclube.org>`                     |
| `BCRYPT_ROUNDS`         | Não           | `12`; inteiro entre `10` e `15`                                                                           |
| `SEED_SUPPORT_PASSWORD` | Só no seed    | Senha temporária fornecida ao executar `db:seed`; não é usada pelo servidor HTTP                          |
| `TEST_DATABASE_URL`     | Só nos testes | `postgres://flex:flex@localhost:5433/flex_test`; normalmente é definida pelo CI                           |

Em produção, a API falha ao iniciar se `AUTH_SECRET` ou `DASHBOARD_ORIGIN`
estiverem ausentes. Se `RESEND_API_KEY` não estiver configurada, códigos de
ativação e recuperação seguem o fluxo manual e são exibidos uma única vez no
terminal do comando que os gerou.

### Catálogo e dashboard

| Variável         | Aplicação | Obrigatória | Quando é lida                                  |
| ---------------- | --------- | ----------- | ---------------------------------------------- |
| `PUBLIC_API_URL` | Catálogo  | Não         | No build Astro; padrão `http://localhost:3000` |
| `VITE_API_URL`   | Dashboard | Não         | No build Vite; padrão `http://localhost:3000`  |

Essas duas variáveis são públicas: não coloque segredos nelas. Em imagens
Docker, elas precisam apontar para a URL pública da API no momento do build;
alterar a variável depois que a imagem foi construída não altera o bundle já
gerado.

O cookie de sessão usa o prefixo `__Host-`, portanto exige HTTPS fora de
`localhost`. Não tente publicar o dashboard em HTTP em produção.

## Testes e verificações

Os testes da API usam o PostgreSQL descartável. Suba os bancos antes de testar:

```bash
pnpm db:up
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

O CI executa as mesmas verificações e também constrói as três imagens Docker.

## Produção no Coolify

A arquitetura aprovada usa uma aplicação Coolify independente para cada
container: API, catálogo e dashboard. Use uma única instância PostgreSQL de
produção (gerenciada pelo ambiente ou por um serviço PostgreSQL confiável); só
a API recebe a `DATABASE_URL`.

### 1. Preparar o banco e os domínios

Configure o PostgreSQL de produção e crie os três serviços no Coolify a partir
do mesmo repositório Git. Os domínios recomendados são:

- `api.flexclube.org` → API, porta interna `3000`;
- `parceiros.flexclube.org` → catálogo, porta interna `4321`;
- `painel.flexclube.org` → dashboard, porta interna `8080`.

Ative HTTPS nos três domínios e confirme que o proxy encaminha os health
checks. A API deve responder em `/v1/health/live` e `/v1/health/ready`;
catálogo e dashboard devem responder em `/health`.

### 2. Criar o serviço da API

No serviço da API, selecione Dockerfile, informe como caminho
`apps/api/Dockerfile` e mantenha o contexto de build na raiz do repositório.
Configure estas variáveis:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://USUARIO:SENHA@HOST:5432/NOME
AUTH_SECRET=gere-um-segredo-longo-e-aleatorio
DASHBOARD_ORIGIN=https://painel.flexclube.org
CATALOG_ORIGIN=https://parceiros.flexclube.org
TRUST_PROXY_HOPS=1
LOG_LEVEL=info
```

Adicione `RESEND_API_KEY` e `EMAIL_FROM` somente quando o domínio remetente
estiver verificado no Resend. O `EMAIL_FROM` é obrigatório quando a chave é
informada.

Antes de iniciar uma nova versão da API, execute a migração dentro do
container novo, usando as mesmas variáveis de produção:

```bash
node dist/migrate.js
```

No Coolify, isso pode ser configurado como comando de pré-deploy/release. A
publicação deve ser interrompida se esse comando falhar. Depois da migração,
inicie o serviço com o comando padrão da imagem:

```bash
node dist/server.js
```

Na primeira publicação, execute o seed uma única vez com uma senha temporária
fornecida como variável de execução e remova-a depois:

```bash
SEED_SUPPORT_PASSWORD='senha-temporaria' node dist/seed.js
```

O usuário inicial é `suporte`; altere a senha pelo fluxo de segurança do
dashboard assim que o acesso estiver confirmado.

### 3. Criar o serviço do catálogo

Selecione `apps/catalog/Dockerfile`, com contexto na raiz. Passe a URL pública
da API como argumento de build:

```text
PUBLIC_API_URL=https://api.flexclube.org
```

No Coolify, configure `PUBLIC_API_URL` em Build Arguments (ou no campo
equivalente de argumentos do Dockerfile), não apenas nas variáveis de runtime.
O container escuta na porta `4321` e inicia com `node dist/server/entry.mjs`.

### 4. Criar o serviço do dashboard

Selecione `apps/dashboard/Dockerfile`, com contexto na raiz, e passe
`VITE_API_URL=https://api.flexclube.org` como Build Argument. Essa URL é
embutida no bundle Vite. O container Nginx escuta na porta `8080` e seu health
check é `/health`.

### 5. Smoke test pós-publicação

Depois de cada deploy, confirme os três serviços e faça uma verificação não
destrutiva:

```bash
curl -fsS https://api.flexclube.org/v1/health/live
curl -fsS https://api.flexclube.org/v1/health/ready
curl -fsS https://parceiros.flexclube.org/health
curl -fsS https://painel.flexclube.org/health
```

Em seguida, valide no navegador o catálogo, o login do dashboard e a leitura
de um parceiro. Não use o smoke test para criar ou alterar dados.

## Imagens Docker

O contexto de build é a raiz do repositório:

```bash
docker build -f apps/api/Dockerfile -t flex-api .
docker build -f apps/catalog/Dockerfile --build-arg PUBLIC_API_URL=https://api.flexclube.org -t flex-catalog .
docker build -f apps/dashboard/Dockerfile --build-arg VITE_API_URL=https://api.flexclube.org -t flex-dashboard .
```

As imagens da API e do catálogo já incluem o processo de produção e os health
checks. O dashboard é servido pelo Nginx. Não inclua arquivos `.env` ou
segredos no contexto de build.

## Migrations e banco de dados

- O esquema Drizzle em `apps/api/src/infrastructure/database/drizzle/schema.ts`
  é a fonte do esquema.
- Gere migrations com `pnpm --filter @flex/api db:generate`, revise o SQL e
  versione os arquivos em `apps/api/drizzle`.
- Nunca use `docker compose down -v` em produção.
- A primeira entrega não inclui backup externo nem recuperação do PostgreSQL;
  configure essa proteção operacionalmente antes de tratar o ambiente como
  tolerante a perda de dados.

## Referências

- [Especificações do projeto](specs/README.md)
- [Contratos HTTP](specs/apps/api/contracts/README.md)
- [Estratégia de qualidade](specs/quality/strategy.md)
- [Plano de implementação](specs/delivery/implementation-plan.md)
