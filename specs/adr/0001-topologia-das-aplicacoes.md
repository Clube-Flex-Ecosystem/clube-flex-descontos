# ADR-0001 — Três aplicações em monorepo

**Estado:** Aceito  
**Decisão:** 2026-10-10

## Contexto

O catálogo público exige SEO, SSR e prioridade móvel. O dashboard é uma interface interna que pode operar como SPA. As regras e os dados precisam permanecer centralizados. Inicialmente haverá um único mantenedor e as aplicações devem permitir publicação independente.

## Alternativas consideradas

1. Uma única aplicação web com áreas pública e interna.
2. Dois frontends com API central.
3. Aplicações completas e independentes, com possível duplicação de regras e persistência.

## Decisão

Adotar um monorepo com três aplicações:

- catálogo público;
- dashboard interno;
- API central.

Cada aplicação possui container e implantação independentes no Coolify. A API é a única aplicação com acesso à persistência.

## Consequências

### Positivas

- Experiências pública e interna podem utilizar soluções adequadas às próprias necessidades.
- Regras e dados permanecem centralizados.
- Um único repositório simplifica manutenção e mudanças coordenadas.
- Um consumidor futuro pode reutilizar a API.

### Negativas

- Existem três processos de build e implantação.
- Contratos entre frontends e API precisam ser mantidos explicitamente.
- Comunicação entre subdomínios exige decisões de CORS e autenticação.
