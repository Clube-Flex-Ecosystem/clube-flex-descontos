# ADR-0005 — Implantação, observabilidade e adiamento de backup

**Estado:** Aceito  
**Decisão:** 2026-10-10

## Contexto

O projeto será desenvolvido inicialmente em ambiente local e, quando publicado, utilizará uma VPS com Coolify. Existe um requisito anterior de backup diário, mas foi decidido retirar backup e recuperação da primeira entrega.

## Decisão

- Trabalhar inicialmente apenas em ambiente local, sem staging permanente.
- Implantar produção no Coolify quando o ambiente for disponibilizado.
- Versionar o código no GitHub.
- Publicar automaticamente a branch principal após todos os testes obrigatórios passarem.
- Executar no GitHub Actions os testes obrigatórios com PostgreSQL isolado antes da publicação.
- Executar migrações versionadas antes da nova versão da API e abortar a publicação em caso de falha.
- Exigir revisão manual do SQL de migração antes de sua entrada na branch principal.
- Disponibilizar verificações de processo e prontidão.
- Emitir logs JSON em `stdout`, com identificador de requisição e sem segredos ou dados pessoais.
- Monitorar externamente a disponibilidade dos três subdomínios quando entrarem em produção.
- Versionar a API sob `/v1` e padronizar respostas de erro.
- Adiar backup do PostgreSQL e testes de restauração para versão futura.

## Risco aceito

Sem cópia externa, falha da VPS, do volume ou erro operacional poderá causar perda definitiva de parceiros, leads, consentimentos, contas e auditoria. As metas anteriores de perda máxima de 24 horas e restauração em 8 horas não se aplicam à primeira entrega.

## Consequências

### Positivas

- Menos infraestrutura durante o desenvolvimento inicial.
- Processo de publicação simples e verificável.
- Diagnóstico básico por health checks, logs e identificadores de requisição.

### Negativas

- Não existe garantia de recuperação de dados.
- Não haverá validação prévia em staging permanente.
- Uma migração aprovada incorretamente pode afetar diretamente produção.
