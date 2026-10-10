# API — módulos

**Aplicação:** API central  
**Endereço:** `api.flexclube.org`  
**Estado:** Aprovado

## Responsabilidade

Ser a fonte central de regras, dados, autorização e contratos utilizados pelo catálogo e dashboard.

## Módulos

### Catálogo público

- disponibilização de planos e categorias ativos;
- consulta de parceiros elegíveis;
- detalhe público do parceiro por endereço estável;
- aplicação de destaque, ordenação e visibilidade.

### Captação pública

- validação e normalização dos dados recebidos;
- identificação segura de WhatsApp existente;
- criação do lead ou da solicitação de contato;
- registro do consentimento;
- resposta pública neutra.

### Identidade e sessão

- ativação de contas;
- autenticação e encerramento de sessões;
- recuperação e alteração de senha;
- emissão, validação e invalidação de códigos de acesso.

### Autorização

- avaliação das permissões individuais em todas as operações internas;
- efeito imediato das alterações de permissão;
- aplicação das proteções contra autoalteração e perda do último administrador.

### Administração do catálogo

- regras e operações de planos, categorias, parceiros, contatos, unidades, benefícios e cupons;
- validações de publicação e visibilidade;
- preservação de associações e histórico.

### Operação comercial

- regras do pipeline;
- escopo de visualização e edição dos leads;
- atribuição e redistribuição;
- observações, histórico e novos interesses;
- administração das origens.

### Privacidade e auditoria

- exclusão ou anonimização autorizada;
- geração e consulta imutável dos eventos administrativos;
- retenção dos registros conforme especificado.

## Fora da responsabilidade

- renderizar as interfaces do catálogo ou dashboard;
- assumir regras específicas de um aplicativo móvel ainda não planejado;
- integrar plataformas de anúncios, cobrança ou base de assinantes nesta entrega.
