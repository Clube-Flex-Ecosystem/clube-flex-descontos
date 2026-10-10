# ADR-0002 — Stack técnica base

**Estado:** Aceito  
**Decisão:** 2026-10-10

## Contexto

O projeto será mantido inicialmente por uma pessoa, hospedado em VPS com Coolify e precisa equilibrar SEO, simplicidade operacional e consistência entre aplicações.

## Decisão

- TypeScript em todas as aplicações.
- pnpm workspaces para o monorepo, sem orquestrador adicional inicialmente.
- Astro com SSR e adaptador Node para o catálogo.
- React, Vite e TanStack Router para o dashboard SPA.
- Express e REST para a API central.
- PostgreSQL para persistência relacional.
- Resend para e-mails transacionais.
- Docker e Coolify para implantações independentes.

## Consequências

### Positivas

- Linguagem comum reduz troca de contexto.
- A stack atende requisitos distintos sem introduzir microsserviços.
- O catálogo produz HTML indexável e o dashboard mantém uma SPA simples.
- PostgreSQL suporta integridade relacional e transações.
- Resend reduz o trabalho operacional de entrega de e-mails.

### Negativas

- O catálogo depende de runtime Node por utilizar SSR.
- Express exige escolhas explícitas para validação, segurança e estrutura.
- A operação da VPS, containers, banco e backups permanece sob responsabilidade do projeto.
- O provedor de e-mail é uma dependência externa.
