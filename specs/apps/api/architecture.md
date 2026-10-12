# API — arquitetura

**Aplicação:** API central  
**Estado:** Aprovada

## Decisões aprovadas

- TypeScript.
- Express.
- API REST.
- PostgreSQL como banco relacional.
- Resend como provedor de e-mails transacionais.
- Drizzle para acesso ao PostgreSQL e migrações.
- OpenAPI como descrição dos contratos HTTP.
- JWT assinado, stateless e transportado por cookie seguro.
- Envio direto de e-mails transacionais, sem fila ou worker nesta entrega.
- Versão LTS do Node fixada e atualizada de forma controlada.
- Zod como fonte dos esquemas de validação e geração compatível com OpenAPI.
- Migrações SQL do Drizzle geradas, revisadas e versionadas.
- Container Docker próprio publicado pelo Coolify.
- Fonte central de regras de negócio, autenticação, autorização, persistência e auditoria.

## Direção estrutural

A API será um monólito modular. Os módulos internos acompanharão as responsabilidades descritas em [modules.md](modules.md), sem separar serviços ou bancos antecipadamente.

### Fluxo de uma operação

`rota → controller → use case → interface de repository → implementação Drizzle`

Na composição aprovada em 2026-10-12, `[modulo].route.ts` registra os
controllers e middlewares. O controller instancia os repositories Drizzle sem
passar a instância do banco e cria os use cases que chama. O repository importa
o cliente compartilhado da infraestrutura e implementa o contrato do módulo.
Cada use case mantém arquivo próprio em `use-cases/`. A composição central de
todos os use cases é dispensada; Unit of Work permanece quando o use case
coordena vários repositories em uma única transação. Transações encapsuladas
por um repository permanecem nele. Ver [ADR-0006](../../adr/0006-arquitetura-interna-da-api.md).

- A rota associa o endpoint ao controller e aos middlewares aplicáveis.
- O controller recebe a requisição, valida seus dados com o esquema de contrato, chama o use case e traduz o resultado para HTTP.
- O use case contém a coordenação e as regras da operação. Não acessa o banco diretamente e não conhece Express, Drizzle ou detalhes HTTP.
- O use case depende de interfaces de repository específicas às necessidades do módulo.
- Implementações Drizzle ficam junto aos contratos do módulo e satisfazem essas interfaces; o cliente e o esquema do banco permanecem na infraestrutura compartilhada.
- Regras e erros de aplicação não utilizam tipos HTTP.
- Controllers constroem manualmente o objeto de resposta e nunca retornam diretamente o resultado do use case.

### Organização dos módulos

```text
apps/api/src/
  infrastructure/
    database/
      drizzle/
        client.ts
        schema.ts
    email/
    logger/
    security/
  modules/
    catalog/
      controllers/
        catalog.controllers.ts
      use-cases/
        publish-partner.use-case.ts
      repositories/
        partner.repository.ts
        drizzle-partner.repository.ts
      public-catalog.controller.ts
      public-catalog.route.ts
    leads/
    identity/
    audit/
  http/
    middlewares/
      authentication.middleware.ts
      require-permissions.middleware.ts
      not-found.middleware.ts
      global-error-handler.middleware.ts
    routes/
      admin-catalog.route.ts
      auth.route.ts
```

A estrutura pode ser reduzida em módulos pequenos; diretórios vazios ou abstrações sem consumidor não devem ser criados.

### Fronteira HTTP e middlewares

- Middlewares dependentes do Express ficam em `http/middlewares`; não contêm regras de negócio nem acessam Drizzle diretamente.
- O middleware valida o JWT e consulta a situação atual do usuário e suas permissões pelos repositories do módulo.
- As permissões são carregadas a cada requisição autenticada para que alterações tenham efeito imediato nos tokens já emitidos.
- O middleware de autorização declara as permissões exigidas pela rota; ocultar elementos no dashboard não substitui a autorização na API.
- Em operações mutáveis, a API rejeita origens declaradas diferentes da origem configurada para o dashboard.
- Rotas inexistentes são convertidas para o contrato padronizado pelo middleware de `not found`.
- O tratador global de erros é o último middleware e converte falhas conhecidas para o contrato HTTP sem expor detalhes internos.

Ordem conceitual:

`request id/log HTTP → proteções HTTP e parsing → CORS e validação de origem → rate limit quando aplicável → autenticação → autorização → controller → not found → tratador global de erros`

### Logs

- Pino é o logger da API e `pino-http` instrumenta o ciclo de requisições.
- Em produção, os logs são JSON em `stdout`, coletados pelo Docker/Coolify; não haverá transporte externo nesta entrega.
- `pino-pretty` é restrito ao desenvolvimento local.
- O nível padrão é `debug` em desenvolvimento e `info` em produção; falhas esperadas relevantes usam `warn` e falhas inesperadas usam `error`.
- Cada requisição possui um UUID em `requestId`, devolvido em `x-request-id` e no corpo dos erros. Um valor recebido só é reutilizado se estiver no formato aceito.
- Logs HTTP usam lista positiva de campos: método, caminho sem query string, status, duração, `requestId` e, quando aplicável, UUID interno do usuário.
- Corpo, query string, cookies, cabeçalhos de autenticação, IP e dados pessoais não são registrados por padrão.
- Há redação defensiva explícita de `authorization`, `cookie`, `set-cookie`, senhas, tokens e códigos.
- Erros inesperados registram stack trace internamente, mas retornam ao cliente apenas mensagem genérica, código estável e `requestId`.
- Loggers filhos podem acrescentar contexto técnico, mas não conteúdo de leads, consentimentos ou credenciais.

### SOLID pragmático

- Controllers tratam somente a fronteira HTTP.
- Cada use case representa um objetivo de aplicação coeso, possui arquivo próprio e é implementado como classe com método `execute`.
- Interfaces pertencem ao código que as consome, não à implementação Drizzle.
- Repositories expõem contratos explícitos de métodos, parâmetros e retornos orientados aos use cases, não uma interface CRUD genérica universal.
- Tipos de repository são próprios do módulo e não expõem linhas ou tipos inferidos do Drizzle.
- Implementações concretas seguem nomes como `DrizzleLeadRepository`.
- Dependências são recebidas pelo construtor e as implementações concretas são conectadas manualmente em um ponto de composição, sem biblioteca de DI.
- Casos de uso que coordenam operações atômicas entre vários repositories utilizam um contrato de Unit of Work implementado com transações Drizzle.
- Novas abstrações exigem uma necessidade real, evitando complexidade apenas para seguir um padrão.

### Controllers

- Cada módulo pode manter seus controllers em um único arquivo.
- Cada controller valida a entrada, executa um use case e mapeia explicitamente o resultado para o contrato HTTP.
- Objetos de domínio, retornos de repository e resultados internos do use case não são serializados diretamente.
- Erros de aplicação são independentes de HTTP e convertidos pelo controller ou tratador HTTP central.

### Estratégia de testes prevista

- Testes de integração da API exercitam a aplicação por HTTP, incluindo controllers, use cases, repositories Drizzle, migrações e PostgreSQL real em ambiente descartável. A API mantém somente essa suíte automatizada.
- Localmente, o PostgreSQL de testes é iniciado por Docker Compose.
- No GitHub Actions, cada execução utiliza uma instância isolada de PostgreSQL.
- Todas as migrações são aplicadas antes da suíte.
- O banco é limpo ou recriado entre conjuntos de testes para impedir dependência de ordem.
- PostgreSQL e repositories Drizzle não são substituídos por mocks nos testes de integração.
- Serviços externos, como Resend, são substituídos por adaptadores de teste nas suítes automatizadas.
- Falha nos testes obrigatórios impede merge protegido e deploy.
- A validação detalhada de ferramentas, cobertura, dados de teste, contratos e fluxos ponta a ponta ocorrerá na etapa 10 — Qualidade.

## Encaminhamentos de implementação

- Materializar esquemas Zod e OpenAPI conforme os contratos aprovados.
- Manter a limpeza de códigos expirados sem criar infraestrutura periódica enquanto o volume não a exigir.
- Métricas, alertas e agregador externo de logs permanecem fora da primeira entrega.

## Referências oficiais

- [Express](https://expressjs.com/)
- [Resend com Node.js](https://resend.com/docs/send-with-nodejs)
- [Migrações com Drizzle](https://orm.drizzle.team/docs/migrations)
- [JSON Schema com Zod](https://zod.dev/json-schema)
- [Armazenamento de senhas — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Sessões — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Prevenção de CSRF — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## Persistência e migrações

- O esquema TypeScript do Drizzle é a fonte do esquema relacional.
- Alterações geram migrações SQL revisáveis e versionadas no Git.
- Produção recebe somente migrações versionadas.
- `drizzle-kit push` é permitido apenas em ambiente local descartável.

## Segurança de autenticação

### Senhas

- Hash de senhas com bcrypt e custo configurável, usando 12 rounds por padrão.
- Comprimento entre 15 e 128 caracteres.
- Unicode, espaços e colagem permitidos.
- Sem regras obrigatórias de composição e sem expiração periódica.
- Senhas comuns ou conhecidas como comprometidas devem ser recusadas.

### Autenticação

- JWT assinado com validade de 8 horas e sem refresh token.
- Cookie host-only da API com prefixo `__Host-`, `Secure`, `HttpOnly` e `SameSite=Strict`.
- Cada login emite um token novo.
- Alterar ou recuperar a senha e desativar a conta incrementam `authVersion`, invalidando tokens anteriores.
- Não há tabela ou serviço de sessões.

### CORS e origem

- Origens permitidas são declaradas explicitamente; `*` não é permitido com credenciais.
- Operações mutáveis nunca utilizam `GET`.
- O CORS aceita somente as origens configuradas para o dashboard e o catálogo; a política `SameSite=Strict` impede o envio normal do cookie em contexto entre sites.
- Endpoints públicos do catálogo não recebem o cookie administrativo.

### Códigos de acesso

- Uso único.
- Validade de 30 minutos.
- Máximo de cinco tentativas.
- Novo código invalida os anteriores da mesma finalidade.
- Valores não são registrados em logs nem armazenados em texto puro.

### Proteção contra abuso

- Limitação progressiva de tentativas de login e códigos, sem bloqueio permanente automático.
- Rate limiting no formulário público.
- Endereço IP pode ser processado transitoriamente para limitação, mas não integra o lead, o consentimento ou seu histórico.

## Operação

- Desenvolvimento inicialmente local, sem ambiente de staging permanente.
- Produção será implantada em container independente no Coolify quando o ambiente for disponibilizado.
- O código será versionado no GitHub.
- Deploy automático da branch principal após aprovação de todos os testes obrigatórios.
- Migrações versionadas executadas antes da entrada da nova versão; falha impede a publicação da API.
- O SQL gerado por migrações exige revisão manual antes de entrar na branch principal.
- Endpoints distintos de processo ativo e prontidão; prontidão depende da conexão com PostgreSQL.
- Logs JSON em `stdout` com identificador de requisição.
- Senhas, cookies, códigos, tokens, conteúdo de consentimento e dados pessoais não são registrados em logs.
- Rotas da API utilizam o prefixo `/v1`.
- Erros seguem formato padronizado e incluem identificador de requisição seguro para suporte.
- Falha de e-mail posterior à persistência preserva a operação e permite entrega manual única do código ao administrador autorizado.
- Falhas de recuperação pública por e-mail permanecem neutras externamente e são registradas nos logs internos.
- Backup do PostgreSQL foi explicitamente adiado para versão futura, com risco de perda aceito para a primeira entrega.
