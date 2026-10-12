# Clube Flex

Monorepo com três aplicações e um pacote de contratos. As especificações oficiais estão em [specs/](specs/README.md).

| Pacote               | Descrição                                    |
| -------------------- | -------------------------------------------- |
| `apps/api`           | API central (Express, Drizzle, PostgreSQL)   |
| `apps/dashboard`     | Dashboard interno (React, Vite)              |
| `apps/catalog`       | Catálogo público (Astro SSR, adaptador Node) |
| `packages/contracts` | Esquemas Zod e tipos compartilhados          |

## Requisitos

- Node.js 24 (LTS), conforme `.node-version`
- pnpm 12 (versão fixada em `packageManager`)
- Docker, para o PostgreSQL local

## Desenvolvimento

```bash
pnpm install
pnpm db:up                         # PostgreSQL de desenvolvimento (5434) e de testes (5433)
cp apps/api/.env.example apps/api/.env
pnpm --filter @flex/api db:migrate # aplica as migrations
pnpm dev:api                       # http://localhost:3000/v1/health/ready
pnpm dev:dashboard                 # http://localhost:5173
pnpm dev:catalog
```

### Primeiro administrador

O primeiro acesso é criado por um comando local, nunca por HTTP. Ele recusa a execução se já existir qualquer usuário e não recebe nem define senha:

```bash
pnpm --filter @flex/api bootstrap --name "Nome Completo" [--email email@exemplo.org]
# em produção, no console do container: node dist/bootstrap.js --name "Nome Completo"
```

Com e-mail, o código de ativação é enviado automaticamente. Sem e-mail (ou sem `RESEND_API_KEY`), o código é exibido uma única vez no terminal. A pessoa define a própria senha em `/ativar` no dashboard.

### Variáveis de ambiente

| Variável                                                   | Aplicação | Descrição                                                                                                   |
| ---------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`, `PORT`, `DATABASE_URL` | API | Ambiente, porta HTTP e conexão com o PostgreSQL (`3000` e `postgres://flex:flex@localhost:5434/flex` por padrão para desenvolvimento) |
| `AUTH_SECRET` | API | Segredo para assinar JWTs; obrigatório em produção |
| `LOG_LEVEL` | API | Nível de log (`fatal`, `error`, `warn`, `info`, `debug`, `trace` ou `silent`) |
| `DASHBOARD_ORIGIN`, `CATALOG_ORIGIN` | API | Origens do dashboard e do catálogo para CORS e links; padrões locais `http://localhost:5173` e `http://localhost:4321` |
| `TRUST_PROXY_HOPS` | API | Proxies confiáveis à frente da API (Coolify); `0` ignora `X-Forwarded-For` |
| `RESEND_API_KEY`, `EMAIL_FROM` | API | E-mails transacionais; sem chave, a entrega é manual |
| `BCRYPT_ROUNDS` | API | Custo do bcrypt; padrão `12` |
| `SEED_SUPPORT_PASSWORD` | API (seed) | Senha usada somente pelo comando de seed do usuário de suporte |
| `TEST_DATABASE_URL` | API (testes) | Conexão com o PostgreSQL descartável dos testes; padrão `postgres://flex:flex@localhost:5433/flex_test` |
| `API_URL` | Catálogo | Endereço da API central usado pelo SSR e pelas ilhas; padrão `http://localhost:3000` |
| `VITE_API_URL` | Dashboard | Endereço da API embutido no bundle; padrão `http://localhost:3000` e, em Docker, informado como `--build-arg` |

Cada app possui um modelo copiável em `apps/<app>/.env.example`. Os arquivos
`.env` locais são ignorados pelo Git.

O cookie de sessão usa o prefixo `__Host-`, que exige `Secure`; navegadores aceitam esse cookie em `http://localhost`, mas não em outros hosts sem HTTPS.

## Verificações

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test     # exige `pnpm db:up`; recria o banco de testes e aplica as migrations
pnpm build
```

## Migrations

- O esquema Drizzle (`apps/api/src/infrastructure/database/drizzle/schema.ts`) é a fonte do esquema.
- `pnpm --filter @flex/api db:generate` gera o SQL em `apps/api/drizzle`, que deve ser revisado antes de entrar na branch principal.
- Em produção, `node dist/migrate.js` é executado antes de iniciar a nova versão da API.

## Imagens Docker

O contexto de build é a raiz do repositório:

```bash
docker build -f apps/api/Dockerfile -t flex-api .
docker build -f apps/catalog/Dockerfile -t flex-catalog .
docker build -f apps/dashboard/Dockerfile -t flex-dashboard .
```
