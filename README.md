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
pnpm dev:dashboard
pnpm dev:catalog
```

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
