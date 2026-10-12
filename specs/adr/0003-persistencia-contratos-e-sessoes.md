# ADR-0003 — Persistência, contratos e sessões

**Estado:** Aceito  
**Decisão:** 2026-10-10

> A parte desta decisão relativa a sessões persistidas foi substituída pela revisão de 2026-10-12 do [ADR-0004](0004-seguranca-de-autenticacao.md). Persistência e contratos permanecem vigentes.

## Contexto

A API precisa manter integridade relacional, fornecer contratos consumidos por dois frontends e revogar acessos imediatamente após mudanças de conta, senha ou permissões.

## Decisão

- Utilizar Drizzle para acesso ao PostgreSQL e migrações.
- Descrever a API REST por OpenAPI.
- Compartilhar esquemas e tipos de contratos pelo pacote interno `packages/contracts`.
- Utilizar sessões opacas armazenadas no servidor.
- Transportar o identificador da sessão apenas por cookie seguro, inacessível ao JavaScript.
- Não utilizar cache de dados do catálogo nesta entrega.
- Enviar e-mails transacionais diretamente pela API, com repetição manual em caso de falha e sem worker inicialmente.
- Fixar uma versão LTS do Node no projeto.

## Consequências

### Positivas

- Sessões, contas e permissões podem ser revogadas imediatamente.
- O contrato documentado reduz divergência entre API e frontends.
- Drizzle mantém o esquema próximo ao SQL e gera migrações versionáveis.
- A ausência inicial de cache e filas reduz complexidade operacional.

### Negativas

- Sessões criam estado persistente adicional na API.
- Requisições autenticadas entre origens exigem CORS restritivo e cookies com `SameSite` adequado.
- Falhas temporárias do provedor de e-mail dependem de nova tentativa manual.
- A ausência de cache aumenta leituras da API e do banco.
