# Contratos HTTP da API

**Etapa:** 08 — Contratos  
**Estado:** Aprovado

Este diretório é a fonte de referência humana dos contratos HTTP. Durante a implementação, o documento OpenAPI 3.1 gerado a partir dos esquemas Zod será a definição executável e deverá permanecer coerente com estas decisões.

## Convenções aprovadas

- Prefixo de versão: `/v1`.
- Corpos e respostas em JSON usam propriedades em `camelCase`.
- Identificadores públicos e internos usam UUID, exceto os endereços estáveis de parceiro e plano, que usam `slug`.
- Datas e horários usam RFC 3339 em UTC.
- Um recurso individual é retornado diretamente, sem envelope genérico.
- Listagens funcionais retornam coleções completas, sem paginação, pois o volume previsto é pequeno.
- Somente a listagem de auditoria é paginada e retorna `{ items, page, pageSize, total }`, com `pageSize` máximo de 100.
- Erros usam `application/problem+json`, seguindo RFC 9457, acrescidos de `code`, `requestId` e `errors` quando houver erros de campos.
- A especificação executável utiliza OpenAPI 3.1.
- Controllers constroem manualmente a representação de saída e nunca serializam diretamente resultados de use cases ou repositories.

### Retorno das mutações administrativas

- Toda criação administrativa retorna `201 Created` com a representação completa do recurso criado.
- Toda edição e mudança explícita de estado retorna `200 OK` com a representação completa resultante após a persistência.
- Toda exclusão elegível retorna `200 OK` com a última representação do recurso acrescida de `deleted: true`; esses processos não usam `204 No Content`.
- Mutações em contatos, unidades, benefícios ou cupons retornam o parceiro administrativo completo, pois o parceiro é o agregado usado para atualizar o cache do dashboard.
- Recursos não excluídos retornam `deleted: false` nas representações administrativas usadas pelo cache.
- Metadados transitórios, como alertas de possível duplicidade, podem ser incluídos em `warnings` na própria representação retornada, sem criar um envelope que oculte o recurso.
- O controller monta explicitamente a resposta a partir do resultado confirmado depois da persistência.
- Operações sem recurso administrativo resultante, como logout e solicitação de recuperação, mantêm os contratos específicos definidos neste documento.

### Concorrência e idempotência

- Recursos administrativos mutáveis possuem `version` inteiro; criações começam em `1` e cada mutação concluída retorna a nova versão.
- Edições, mudanças de estado e exclusões exigem a versão conhecida pelo cliente.
- A operação só é aplicada quando a versão informada ainda corresponde à versão persistida.
- Um conflito retorna `409 Conflict` com `code: "RESOURCE_VERSION_CONFLICT"` e não altera o recurso.
- Itens internos de um agregado, como observações, contatos e unidades, são protegidos pela versão do agregado retornado.
- Não haverá armazenamento genérico de `Idempotency-Key` nesta entrega.
- Ativar, desativar ou publicar um recurso que já esteja no estado solicitado retorna a representação atual sem repetir efeitos colaterais.
- Restrições de unicidade protegem as chaves naturais aplicáveis.
- O dashboard não repete automaticamente mutações que falharam ou ficaram sem resposta; operações não idempotentes exigem uma nova ação explícita do usuário.

### Transporte da versão

- Respostas de recursos administrativos mutáveis incluem `version` no JSON e o mesmo valor em `ETag`, entre aspas.
- `PUT`, `PATCH`, `DELETE` e comandos de mudança de estado exigem `If-Match` com a versão conhecida pelo cliente.
- A ausência de `If-Match` retorna `428 Precondition Required` com `RESOURCE_VERSION_REQUIRED`.
- Uma versão desatualizada retorna `409 Conflict` com `RESOURCE_VERSION_CONFLICT`.
- A resposta bem-sucedida devolve a nova `version` e o novo `ETag`.
- Criações por `POST` não exigem `If-Match`.

### Erros

Erros seguem `application/problem+json`:

```json
{
  "type": "urn:flex:error:validation-error",
  "title": "Dados inválidos",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "detail": "Revise os campos informados.",
  "requestId": "b6000f05-26cc-49d8-95d1-83f9a990d797",
  "errors": [
    {
      "field": "whatsapp",
      "code": "INVALID_PHONE_NUMBER",
      "message": "Informe um número válido com DDD."
    }
  ]
}
```

- `errors` só aparece quando houver erros localizáveis.
- `detail` nunca expõe stack trace, SQL ou detalhes internos.
- Mensagens destinadas à interface são escritas em português, mas consumidores tomam decisões pelo `code`, nunca pelo texto.

| HTTP | Códigos comuns |
| --- | --- |
| `400` | `MALFORMED_REQUEST` |
| `401` | `AUTHENTICATION_REQUIRED`, `INVALID_CREDENTIALS` |
| `403` | `PERMISSION_DENIED`, `CSRF_VALIDATION_FAILED` |
| `404` | `RESOURCE_NOT_FOUND` |
| `409` | `DUPLICATE_RESOURCE`, `INVALID_RESOURCE_STATE`, `RESOURCE_VERSION_CONFLICT`, `PROTECTED_RESOURCE` |
| `422` | `VALIDATION_ERROR`, `PUBLICATION_REQUIREMENTS_NOT_MET` |
| `428` | `RESOURCE_VERSION_REQUIRED` |
| `429` | `RATE_LIMIT_EXCEEDED` |
| `500` | `INTERNAL_SERVER_ERROR` |
| `503` | `SERVICE_UNAVAILABLE` |

- Credenciais incorretas, conta inexistente, inativa ou ainda não ativada resultam externamente no mesmo `401 INVALID_CREDENTIALS`.
- Recurso administrativo existente, mas fora do escopo de visualização do usuário, resulta em `404` para não revelar sua existência.
- Respostas `429` incluem `Retry-After` quando o período puder ser determinado.
- Uma URL pública anterior de parceiro retorna `308 Permanent Redirect` para o `slug` atual.

## Verificações operacionais

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/health/live` | Processo ativo; não consulta dependências |
| `GET` | `/v1/health/ready` | Prontidão; exige conexão com o PostgreSQL |

- Ambos respondem `200 OK` com `{ "status": "ok" }`, não exigem autenticação e não recebem o cookie de sessão.
- A prontidão responde `503 SERVICE_UNAVAILABLE` no formato de erro padronizado quando o banco estiver inacessível.
- Catálogo e dashboard expõem `GET /health` com o mesmo corpo para verificação de processo ativo.

## Catálogo público

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/public/plans` | Listar planos ativos disponíveis no seletor público |
| `GET` | `/v1/public/categories` | Listar categorias ativas com parceiros visíveis para o plano selecionado |
| `GET` | `/v1/public/partners` | Listar parceiros visíveis para o plano selecionado |
| `GET` | `/v1/public/partners/{slug}` | Consultar o detalhe público de um parceiro para o plano selecionado |
| `GET` | `/v1/public/contact-consent` | Consultar texto e versão vigentes do consentimento comercial |
| `POST` | `/v1/public/contact-requests` | Receber uma solicitação pública de contato com consentimento |

### Parâmetros de consulta

- `planId` é obrigatório nas consultas públicas de categorias e na listagem de parceiros.
- No detalhe do parceiro, `planId` é opcional: sem ele, a API retorna os dados gerais e omite percentual e cupom; com ele, acrescenta o benefício correspondente.
- `categoryId` é opcional na listagem de parceiros.
- Categorias sem parceiros publicáveis para o plano selecionado não aparecem no catálogo.
- A listagem aplica primeiro o destaque e depois a ordem alfabética definida nas regras de negócio.

### Representações públicas

- Todas as listagens públicas são retornadas como coleções completas, sem paginação.
- Tanto a listagem quanto o detalhe retornam a representação pública completa do parceiro.
- O parceiro público contém `slug`, nome, categorias, descrição, percentual, site opcional, contatos, cupom efetivo opcional, instruções de uso e unidades.
- O indicador de destaque pode integrar a representação para sustentar a ordenação e a apresentação do catálogo.
- O percentual é transmitido como número inteiro entre 1 e 100; o frontend é responsável por apresentá-lo como `até X%`.
- Cada unidade contém identificação, endereço, contatos efetivos, horário opcional e instruções específicas opcionais.
- Contatos usam `type` (`phone` ou `whatsapp`), `value` normalizado e `label` opcional.
- Contatos efetivos da unidade já consideram a herança dos contatos gerais do parceiro prevista nas regras de negócio e usam `inherited: true` quando vierem do parceiro.
- Campos opcionais sem valor são omitidos do JSON, em vez de retornarem `null`.
- `planId`, `categoryId` ou `slug` informado e inexistente ou indisponível publicamente resulta em `404`, sem revelar o estado administrativo do registro.
- O parceiro continua elegível para o detalhe geral quando estiver publicado, possuir categoria ativa e ao menos um benefício para plano ativo; nenhuma condição específica é escolhida sem `planId`.

Planos públicos contêm `id`, `name` e `slug`; categorias públicas contêm `id` e `name`.

Representação completa do parceiro público:

```json
{
  "slug": "clinica-exemplo",
  "name": "Clínica Exemplo",
  "description": "Descrição",
  "featured": true,
  "discountPercentage": 80,
  "coupon": "FLEX80",
  "website": "https://exemplo.com",
  "usageInstructions": "Apresente a carteirinha.",
  "categories": [{ "id": "uuid", "name": "Saúde" }],
  "contacts": [
    {
      "type": "whatsapp",
      "value": "+5521999999999",
      "label": "Comercial"
    }
  ],
  "units": [
    {
      "id": "uuid",
      "name": "Unidade Centro",
      "address": {
        "postalCode": "20000000",
        "street": "Rua Exemplo",
        "number": "100",
        "neighborhood": "Centro",
        "city": "Rio de Janeiro",
        "state": "RJ"
      },
      "openingHours": "Segunda a sexta, das 8h às 18h",
      "instructions": "Agendamento prévio.",
      "contacts": [
        {
          "type": "phone",
          "value": "+552130000000",
          "inherited": true
        }
      ]
    }
  ]
}
```

### Resposta pública de contato

`GET /v1/public/contact-consent` retorna a definição vigente:

```json
{
  "version": "2026-10-01",
  "text": "Autorizo o Clube Flex a utilizar estes dados para contato comercial.",
  "privacyUrl": "/privacidade"
}
```

- A API é a fonte oficial da versão aceita.
- Texto e versão permanecem versionados no código nesta entrega e não são administráveis pelo dashboard.
- O catálogo apresenta essa definição e envia exatamente a versão consultada.
- A versão ilustrada será substituída pela versão inicial efetivamente publicada, sem alterar o formato do contrato.

A origem técnica informada pelo catálogo é aceita somente entre valores conhecidos. O servidor determina a origem efetiva e ignora valores arbitrários enviados pelo navegador.

A resposta usa `202 Accepted` e não revela se o WhatsApp já existia. Reenvios identificados retornam imediatamente a mesma confirmação neutra. Eles não sobrescrevem o lead, mas geram a solicitação, o consentimento, o evento de histórico e a marcação de novo interesse definidos nos requisitos.

Entrada aprovada:

```json
{
  "name": "Nome da pessoa",
  "whatsapp": "+5521999999999",
  "email": "email@exemplo.com",
  "consent": true,
  "consentVersion": "2026-10-01",
  "source": "catalog"
}
```

- `email` é opcional e, quando ausente, é omitido.
- `consent` deve ser `true`.
- O servidor aceita somente a versão de consentimento vigente e rejeita versão desconhecida ou desatualizada.
- `source` aceita somente valores técnicos conhecidos; o servidor define a origem de negócio efetiva.

Resposta `202 Accepted`:

```json
{
  "message": "Recebemos seus dados. Nossa equipe entrará em contato."
}
```

O `requestId` permanece no header `x-request-id` e não é duplicado no corpo de sucesso.

## Identidade e sessão

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `POST` | `/v1/auth/activate` | Definir a senha inicial por código de ativação |
| `POST` | `/v1/auth/login` | Autenticar e criar a sessão por cookie |
| `POST` | `/v1/auth/logout` | Encerrar a sessão atual |
| `GET` | `/v1/auth/session` | Consultar o usuário autenticado e suas permissões atuais |
| `POST` | `/v1/auth/recovery-requests` | Solicitar recuperação de acesso por nome de usuário |
| `POST` | `/v1/auth/recover` | Definir nova senha por código de recuperação |
| `PUT` | `/v1/auth/password` | Alterar a própria senha durante uma sessão autenticada |

### Comportamento aprovado

- Ativação e recuperação não iniciam sessão automaticamente; o usuário deve autenticar-se depois.
- Login bem-sucedido retorna `204 No Content` e cria o cookie seguro da sessão.
- Logout é idempotente e retorna `204 No Content`, inclusive quando a sessão já estiver ausente ou expirada.
- A solicitação de recuperação sempre retorna `202 Accepted`, sem revelar se o usuário, o e-mail ou uma conta ativa existem.
- Código inválido, expirado, utilizado ou associado a uma conta indisponível produz a mesma resposta de erro.
- Ativação e recuperação recebem `code`, `newPassword` e `newPasswordConfirmation`.
- Alteração autenticada recebe `currentPassword`, `newPassword` e `newPasswordConfirmation`.
- Campos de confirmação são validados, mas nunca persistidos.

Resposta de `GET /v1/auth/session`:

```json
{
  "user": {
    "id": "b6000f05-26cc-49d8-95d1-83f9a990d797",
    "fullName": "Nome Completo",
    "username": "nome.completo",
    "email": "email@exemplo.com"
  },
  "permissions": [
    "partners.view",
    "partners.update"
  ]
}
```

O e-mail é omitido quando não estiver cadastrado. A resposta sempre representa as permissões atuais, não uma cópia congelada no início da sessão.

## Administração do catálogo

### Planos

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/admin/plans` | Listar planos ativos e inativos |
| `POST` | `/v1/admin/plans` | Criar plano |
| `GET` | `/v1/admin/plans/{id}` | Consultar plano |
| `PATCH` | `/v1/admin/plans/{id}` | Editar plano |
| `POST` | `/v1/admin/plans/{id}/activate` | Reativar plano |
| `POST` | `/v1/admin/plans/{id}/deactivate` | Desativar plano |

### Categorias

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/admin/categories` | Listar categorias ativas e inativas |
| `POST` | `/v1/admin/categories` | Criar categoria |
| `GET` | `/v1/admin/categories/{id}` | Consultar categoria |
| `PATCH` | `/v1/admin/categories/{id}` | Editar categoria |
| `POST` | `/v1/admin/categories/{id}/activate` | Reativar categoria |
| `POST` | `/v1/admin/categories/{id}/deactivate` | Desativar categoria |

### Parceiros

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/admin/partners` | Listar parceiros em todos os estados |
| `POST` | `/v1/admin/partners` | Criar parceiro como rascunho |
| `GET` | `/v1/admin/partners/{id}` | Consultar agregado administrativo completo |
| `PUT` | `/v1/admin/partners/{id}` | Substituir a representação editável completa |
| `DELETE` | `/v1/admin/partners/{id}` | Excluir parceiro elegível |
| `POST` | `/v1/admin/partners/{id}/publish` | Publicar ou republicar parceiro elegível |
| `POST` | `/v1/admin/partners/{id}/deactivate` | Desativar parceiro |
| `POST` | `/v1/admin/partners/{id}/move-to-draft` | Retornar parceiro desativado para rascunho |

### Comportamento do agregado

- A criação e a edição recebem dados principais, categorias, contatos, unidades, benefícios e cupons em uma única representação.
- A edição usa `PUT` e exige a representação editável completa; omissões não são interpretadas implicitamente como alterações parciais.
- O salvamento do agregado é atômico e utiliza Unit of Work.
- Mudanças de estado não integram o `PUT` e usam operações explícitas.
- Publicar um parceiro que não atende às condições obrigatórias retorna `422 Unprocessable Content` com erros localizados.
- Conflitos de unicidade retornam `409 Conflict`.
- Nome semelhante não impede o salvamento; a resposta pode incluir o alerta `POSSIBLE_DUPLICATE_PARTNER` em `warnings`.
- A exclusão só é realizada quando o parceiro atende às regras de preservação; caso contrário, retorna `409 Conflict` e o registro poderá ser desativado.

### Representação administrativa do catálogo

- Plano contém `id`, `name`, `slug`, `status`, `version` e `deleted`.
- Categoria contém `id`, `name`, `status`, `version` e `deleted`.
- Parceiro contém os campos públicos e também `id`, `status`, `generalCoupon`, categorias com estado, contatos e unidades com identificadores, unidades com estado, benefícios, `version`, `deleted` e `warnings` quando existirem.
- Estado de parceiro: `draft`, `published` ou `inactive`.
- Estado de plano, categoria e unidade: `active` ou `inactive`.
- Benefício contém a referência do plano, `discountPercentage` e `coupon` específico opcional.
- Criação e edição de parceiro recebem `categoryIds` e coleções completas de `contacts`, `units` e `benefits`.
- Itens já persistidos carregam `id`; itens novos omitem `id`.
- A ausência de item existente na representação completa solicita sua remoção. Se ele precisar ser preservado pelas regras de integridade, toda a operação é recusada com erro localizado.

## Limites e normalização das entradas

| Campo | Limite |
| --- | --- |
| Nome de pessoa, parceiro, plano, categoria, unidade ou origem | 1–120 caracteres |
| Nome de usuário | 3–80 caracteres |
| E-mail | até 254 caracteres |
| Descrição do parceiro | até 2.000 caracteres |
| Instruções gerais ou da unidade | até 4.000 caracteres |
| Horário em texto livre | até 500 caracteres |
| Identificação de contato | até 80 caracteres |
| Cupom | até 100 caracteres |
| Detalhe de origem ou identificação da indicação | até 500 caracteres |
| Observação do lead ou motivo de perda | até 4.000 caracteres |
| Site | até 2.048 caracteres |
| Slug | 3–120 caracteres |

- Slugs aceitam letras minúsculas, números e hífens.
- Espaços externos são removidos dos campos textuais.
- Texto obrigatório composto apenas por espaços é recusado.
- A capitalização é preservada, exceto nos campos que possuem normalização expressamente definida nas regras de negócio.

## Usuários e permissões

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/admin/users` | Listar usuários internos |
| `POST` | `/v1/admin/users` | Criar usuário interno |
| `GET` | `/v1/admin/users/{id}` | Consultar usuário interno |
| `PATCH` | `/v1/admin/users/{id}` | Editar nome completo, nome de usuário ou e-mail |
| `POST` | `/v1/admin/users/{id}/activate` | Reativar a conta |
| `POST` | `/v1/admin/users/{id}/deactivate` | Desativar a conta e revogar suas sessões |
| `POST` | `/v1/admin/users/{id}/access-codes` | Emitir código de ativação ou recuperação |
| `GET` | `/v1/admin/permissions` | Listar o catálogo fixo de permissões implementadas |
| `PUT` | `/v1/admin/users/{id}/permissions` | Substituir atomicamente as permissões concedidas |

Representação administrativa:

```json
{
  "id": "b6000f05-26cc-49d8-95d1-83f9a990d797",
  "fullName": "Nome Completo",
  "username": "nome.completo",
  "email": "email@exemplo.com",
  "status": "active",
  "accessStatus": "pendingActivation",
  "permissions": [],
  "deleted": false
}
```

- `status` assume `active` ou `inactive`.
- `accessStatus` assume `pendingActivation`, `active` ou `passwordChangeRequired`.
- O e-mail é omitido quando não existir.
- A criação recebe nome completo e e-mail opcional; o servidor gera o nome de usuário, cria a conta ativa, ainda não ativada e sem permissões, e emite o código de ativação.
- Se houver e-mail, a representação informa `accessCodeDelivery: "email"` e nunca expõe o código.
- Sem e-mail, a representação inclui transitoriamente `accessCodeDelivery: "manual"` e `accessCode`; o código só aparece nessa resposta.
- Se o envio pelo Resend falhar depois da persistência, a conta não é desfeita: a resposta usa `accessCodeDelivery: "manual"`, expõe o código uma única vez e inclui o warning `EMAIL_DELIVERY_FAILED`.
- Solicitação pública de recuperação mantém a resposta neutra mesmo quando o provedor de e-mail falhar; a falha é registrada somente nos logs internos.
- A emissão administrativa de código recebe `purpose` igual a `activation` ou `recovery`, invalida os códigos anteriores da mesma finalidade e retorna o usuário completo com a informação transitória de entrega.
- A substituição de permissões recebe a lista completa desejada, calcula concessões e revogações atomicamente e retorna o usuário completo.
- Permissões são definidas pela aplicação e não podem ser criadas ou renomeadas pelo dashboard.
- Desativar a conta revoga todas as suas sessões antes de retornar a representação atualizada.
- Autoalteração de permissões, concessão de capacidade ausente no autor ou operação que deixe o sistema sem administrador elegível retorna `409 Conflict`.

## Operação comercial

### Leads

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/admin/leads` | Listar os leads visíveis para o usuário autenticado |
| `POST` | `/v1/admin/leads` | Cadastrar lead manualmente |
| `GET` | `/v1/admin/leads/{id}` | Consultar o agregado completo do lead |
| `PATCH` | `/v1/admin/leads/{id}` | Editar dados permitidos do lead |
| `DELETE` | `/v1/admin/leads/{id}` | Excluir ou anonimizar conforme as dependências existentes |
| `POST` | `/v1/admin/leads/{id}/stage-transitions` | Alterar ou reabrir a etapa do lead |
| `PUT` | `/v1/admin/leads/{id}/assignee` | Atribuir, redistribuir ou devolver o lead |
| `POST` | `/v1/admin/leads/{id}/observations` | Criar observação |
| `PATCH` | `/v1/admin/leads/{id}/observations/{observationId}` | Corrigir observação do próprio autor |
| `POST` | `/v1/admin/leads/{id}/contact-requests/{requestId}/resolve` | Tratar uma solicitação de contato pendente |
| `GET` | `/v1/admin/leads/{id}/history` | Consultar o histórico imutável do lead |

- A listagem é completa e a API aplica automaticamente o escopo de leads próprios ou todos; o cliente não pode ampliar esse escopo.
- O detalhe inclui dados principais, origem, responsável, observações e solicitações de contato. O histórico fica separado por poder crescer continuamente.
- Todas as mutações internas do agregado retornam o lead completo atualizado.

Cadastro manual:

```json
{
  "name": "Nome",
  "whatsapp": "+5521999999999",
  "email": "email@exemplo.com",
  "sourceId": "b6000f05-26cc-49d8-95d1-83f9a990d797",
  "sourceDetail": "Informação opcional",
  "referredBy": "Nome de quem indicou",
  "leaveUnassigned": false
}
```

- Campos opcionais sem valor são omitidos.
- `referredBy` é obrigatório quando a origem selecionada representar indicação.
- WhatsApp duplicado no cadastro manual retorna `409 Conflict`. O `id` do lead existente só integra o erro se o usuário puder visualizá-lo.

Mudança de etapa:

```json
{
  "stage": "lost",
  "lossReason": "Motivo opcional"
}
```

Valores estáveis de `stage`: `new`, `firstContact`, `negotiating`, `converted` e `lost`.

- A atribuição recebe `assigneeId`; `null` significa devolver explicitamente o lead à condição sem responsável.
- Criar ou corrigir observação retorna o agregado com as observações atuais; a versão anterior da correção permanece apenas no histórico.
- Tratar solicitação registra autor e horário, remove a pendência correspondente e não altera automaticamente a etapa.
- Se o lead puder ser removido, `DELETE` retorna sua última representação com `deleted: true`.
- Se houver histórico que exija preservação, `DELETE` anonimiza os dados pessoais e retorna a representação resultante com `anonymized: true` e `deleted: false`.

### Origens de leads

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/admin/lead-sources` | Listar origens ativas e inativas |
| `POST` | `/v1/admin/lead-sources` | Criar origem |
| `GET` | `/v1/admin/lead-sources/{id}` | Consultar origem |
| `PATCH` | `/v1/admin/lead-sources/{id}` | Editar origem permitida |
| `POST` | `/v1/admin/lead-sources/{id}/activate` | Reativar origem |
| `POST` | `/v1/admin/lead-sources/{id}/deactivate` | Desativar origem |
| `DELETE` | `/v1/admin/lead-sources/{id}` | Excluir origem nunca utilizada |

- Origem já utilizada não pode ser excluída; a tentativa retorna `409 Conflict` e ela deverá ser desativada.
- A origem protegida `catálogo/site` não pode ser editada nem excluída.

## Auditoria administrativa

| Método | Caminho | Finalidade |
| --- | --- | --- |
| `GET` | `/v1/admin/audit-events` | Consultar eventos com paginação e filtros |
| `GET` | `/v1/admin/audit-events/{id}` | Consultar um evento específico |

- Esta é a única listagem paginada do sistema.
- `page` inicia em 1; `pageSize` usa 50 por padrão e aceita no máximo 100.
- A ordenação é decrescente por data e horário, do evento mais recente para o mais antigo.
- Filtros opcionais: `actorId`, `action`, `targetType`, `targetId`, `occurredFrom` e `occurredTo`.
- Eventos são imutáveis e não possuem endpoints de criação, edição ou remoção.
- Senhas, códigos, cookies, tokens, sessões e outros segredos nunca integram os valores anterior ou novo.

Representação do evento:

```json
{
  "id": "b6000f05-26cc-49d8-95d1-83f9a990d797",
  "action": "user.permissions.updated",
  "occurredAt": "2026-10-10T15:30:00Z",
  "actor": {
    "id": "6f8ec62f-c1ab-4800-b4c9-fbe89983fa27",
    "username": "supervisora"
  },
  "target": {
    "type": "user",
    "id": "d14e5c5f-a65c-4b12-988e-d3a29fa18276",
    "label": "nome.usuario"
  },
  "before": {
    "permissions": ["partners.view"]
  },
  "after": {
    "permissions": ["partners.view", "partners.update"]
  }
}
```

## Rastreabilidade

| Requisitos | Casos de uso | Contratos responsáveis |
| --- | --- | --- |
| `RF-001` a `RF-004` | `UC-001` a `UC-003` | Planos, categorias e parceiros públicos |
| `RF-005` | `UC-004` | Solicitações públicas de contato |
| `RF-017` | `UC-005` | Sem contrato de API; conteúdo estático do catálogo direciona ao e-mail oficial |
| `RF-015` | `UC-006` a `UC-009`, `UC-023` | Identidade, sessão e administração de usuários |
| `RF-010` | `UC-010` | Administração de planos |
| `RF-011` | `UC-011` | Administração de categorias |
| `RF-012` a `RF-014` | `UC-012` a `UC-014` | Agregado administrativo de parceiro e comandos de estado |
| `RF-006` a `RF-009` | `UC-015` a `UC-021` | Leads, etapas, atribuições, observações, solicitações e origens |
| `RNF-008` e regras de privacidade | `UC-022` | Exclusão ou anonimização de lead |
| `RF-016` | `UC-024` | Catálogo e substituição de permissões, além da autorização aplicada às rotas |
| `RNF-007` | `UC-025` | Consulta paginada e imutável da auditoria |

As regras de negócio `RN-001` a `RN-040` são aplicadas pelos use cases correspondentes e materializadas nos contratos por validações, visibilidade, comandos de estado, códigos de erro e representações descritas acima. A matriz detalhada entre cada regra e requisito permanece em suas fontes oficiais para evitar duplicação.

## Pendências não bloqueantes para a implementação

- Materializar os contratos aprovados em esquemas Zod e OpenAPI 3.1 quando a implementação for autorizada.
- Complementar exemplos e descrições do OpenAPI sem alterar as decisões registradas.
