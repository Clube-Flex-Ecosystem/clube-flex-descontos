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
| `DASHBOARD_ORIGIN`                                         | API       | Origem do dashboard (CORS, CSRF e links de e-mail). Obrigatória em produção; padrão `http://localhost:5173` |
| `TRUST_PROXY_HOPS`                                         | API       | Proxies confiáveis à frente da API (Coolify). `0` ignora `X-Forwarded-For`                                  |
| `RESEND_API_KEY`, `EMAIL_FROM`                             | API       | E-mails transacionais; sem chave, a entrega é manual                                                        |
| `ARGON2_MEMORY_KIB`, `ARGON2_PASSES`, `ARGON2_PARALLELISM` | API       | Custo do Argon2id (padrão: mínimo da OWASP), a calibrar na VPS                                              |
| `VITE_API_URL`                                             | Dashboard | Endereço da API; padrão `http://localhost:3000`. Em Docker, é um `--build-arg`                              |

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
