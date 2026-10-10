# ADR-0004 — Segurança de autenticação e proteção contra abuso

**Estado:** Aceito  
**Decisão:** 2026-10-10

## Contexto

O dashboard administra dados pessoais e permissões granulares. A autenticação em dois fatores foi retirada do escopo, tornando necessárias senhas fortes, sessões revogáveis e controles contra ataques automatizados.

## Decisão

- Armazenar senhas com Argon2id.
- Exigir de 15 a 128 caracteres, sem regras artificiais de composição ou expiração periódica.
- Recusar senhas comuns ou comprometidas.
- Utilizar sessões opacas persistidas no PostgreSQL, guardando somente o hash do identificador.
- Expirar sessões após 8 horas de inatividade ou 24 horas absolutas.
- Transportar a sessão em cookie host-only `__Host-`, `Secure`, `HttpOnly` e com política `SameSite` adequada.
- Proteger operações autenticadas com token CSRF vinculado à sessão, validação de origem e CORS explícito.
- Limitar tentativas de autenticação, códigos e formulário público.
- Permitir uso transitório do IP para rate limiting, sem persistência como dado do lead ou consentimento.
- Tornar códigos de ativação e recuperação únicos, válidos por 30 minutos e limitados a cinco tentativas.

## Consequências

### Positivas

- Contas e sessões podem ser revogadas de forma centralizada.
- Reduz riscos de força bruta, fixação de sessão e CSRF.
- O sistema não amplia desnecessariamente os dados pessoais armazenados.

### Negativas

- A API precisa manter sessões e proteções CSRF corretamente.
- Senhas de 15 caracteres exigem comunicação clara e bom suporte a gerenciadores de senha.
- Rate limiting precisa considerar o proxy do Coolify sem confiar em cabeçalhos arbitrários.

## Referências

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
