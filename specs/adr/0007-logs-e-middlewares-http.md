# ADR-0007 — Logs e middlewares HTTP

**Estado:** Aceito  
**Decisão:** 2026-10-10

## Contexto

A API precisa permitir diagnóstico por um único mantenedor sem expor credenciais ou dados pessoais. Autenticação, autorização e tradução de erros também precisam permanecer na fronteira HTTP, sem acoplar casos de uso ao Express ou ao Drizzle.

## Alternativas consideradas

1. Logs textuais livres e tratamento de erro em cada controller.
2. Logger estruturado e pipeline central de middlewares HTTP.
3. Plataforma externa de observabilidade e transporte dedicado desde a primeira entrega.

## Decisão

- Utilizar Pino e `pino-http`.
- Emitir JSON em `stdout` em produção e usar `pino-pretty` somente no desenvolvimento.
- Não adotar transporte externo de logs nesta entrega.
- Correlacionar requisições e erros por `requestId` UUID.
- Registrar somente campos técnicos expressamente permitidos e aplicar redação defensiva a segredos.
- Não registrar corpos, query strings, cookies, cabeçalhos de autenticação, IP ou dados pessoais por padrão.
- Organizar componentes Express em `http/middlewares`.
- Resolver sessão e permissões atuais por use case e repositories, sem acesso direto ao Drizzle pelos middlewares.
- Aplicar autenticação, CSRF e autorização antes dos controllers conforme a natureza da rota.
- Centralizar rotas inexistentes e tradução de erros em middlewares finais.
- Expor erros inesperados de forma genérica e registrar internamente o stack trace com o mesmo `requestId`.

## Consequências

### Positivas

- Logs pesquisáveis e correlacionáveis com respostas de suporte.
- Menor risco de vazamento de credenciais e dados de leads.
- Controllers permanecem focados na tradução HTTP da operação.
- Alterações de permissão têm efeito imediato em sessões existentes.

### Negativas

- Consultar permissões atuais em cada requisição autenticada adiciona acesso ao banco.
- Sem agregador externo, a investigação depende inicialmente dos logs disponibilizados pelo ambiente de execução.
- A lista de campos e caminhos de redação deverá acompanhar novos dados sensíveis.
