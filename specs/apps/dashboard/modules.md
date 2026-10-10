# Dashboard — módulos

**Aplicação:** Dashboard interno  
**Endereço:** `painel.flexclube.org`  
**Estado:** Aprovado

## Responsabilidade

Oferecer as operações internas do catálogo e do processo comercial, limitadas pelas permissões individuais do usuário autenticado.

O dashboard não precisa ser indexado e pode operar como SPA.

## Módulos

### Acesso e conta

- ativação da conta;
- autenticação e encerramento de sessão;
- recuperação de acesso;
- alteração da própria senha.

### Administração do catálogo

- planos;
- categorias;
- parceiros e contatos;
- unidades;
- benefícios e cupons;
- publicação, destaque, desativação e republicação.

### Operação comercial

- cadastro manual de leads;
- visualização do pipeline conforme escopo de acesso;
- atribuição, redistribuição e devolução;
- atualização de etapa e dados;
- observações e histórico;
- tratamento de novo interesse;
- administração de origens.

### Usuários e permissões

- criação, edição, ativação e desativação de contas;
- emissão de códigos de acesso;
- concessão e revogação de permissões individuais;
- aplicação das proteções administrativas.

### Privacidade e auditoria

- atendimento manual a revogações validadas;
- exclusão ou anonimização de leads;
- consulta da auditoria administrativa e seus filtros.

## Fora da responsabilidade

- implementar autorização apenas pela ocultação visual;
- acessar diretamente a persistência;
- definir regras de negócio divergentes da API;
- administrar assinantes, cobrança, agendamentos ou integrações de anúncios.
