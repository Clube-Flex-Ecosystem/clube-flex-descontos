# ADR-0004 — Segurança de autenticação e proteção contra abuso

**Estado:** Aceito  
**Decisão:** 2026-10-10
**Revisão:** 2026-10-12

## Contexto

O dashboard administra dados pessoais e permissões granulares. A autenticação em dois fatores foi retirada do escopo, tornando necessárias senhas fortes, sessões revogáveis e controles contra ataques automatizados.

## Decisão

- Armazenar senhas com bcrypt, usando 12 rounds por padrão.
- Exigir de 15 a 128 caracteres, sem regras artificiais de composição ou expiração periódica.
- Recusar senhas comuns ou comprometidas.
- Utilizar JWT assinado, com validade de 8 horas, sem refresh token e sem persistência de sessão.
- Transportar o JWT em cookie host-only `__Host-`, `Secure`, `HttpOnly` e `SameSite=Strict`.
- Manter uma versão de autenticação na conta. Alterar ou recuperar a senha e desativar a conta incrementam essa versão e invalidam os JWTs anteriores.
- Consultar a situação da conta e as permissões em toda requisição autenticada, preservando o efeito imediato dessas alterações.
- Proteger o cookie com `SameSite=Strict` e permitir no CORS somente as origens configuradas.
- Limitar tentativas de autenticação, códigos e formulário público.
- Permitir uso transitório do IP para rate limiting, sem persistência como dado do lead ou consentimento.
- Tornar códigos de ativação e recuperação únicos, válidos por 30 minutos e limitados a cinco tentativas.

## Consequências

### Positivas

- Tokens anteriores podem ser invalidados por conta sem uma tabela de sessões.
- Reduz riscos de força bruta, fixação de sessão e CSRF.
- O sistema não amplia desnecessariamente os dados pessoais armazenados.

### Negativas

- Logout apaga o cookie do navegador, mas um token copiado permanece válido até expirar ou até a versão de autenticação da conta mudar.
- A proteção por origem pressupõe que o dashboard e a API permaneçam em origens explicitamente configuradas.
- Senhas de 15 caracteres exigem comunicação clara e bom suporte a gerenciadores de senha.
- Rate limiting precisa considerar o proxy do Coolify sem confiar em cabeçalhos arbitrários.

## Referências

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
