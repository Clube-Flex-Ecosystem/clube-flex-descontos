# Processo de evolução da interface

**Escopo:** `apps/catalog/` e `apps/dashboard/`

Este documento define o fluxo obrigatório para qualquer alteração de interface
do catálogo ou do dashboard.

## Regra principal

Toda mudança de UI deve começar no protótipo navegável correspondente em
[`specs/prototypes/`](prototypes/):

- [`catalog/index.html`](prototypes/catalog/index.html) para o catálogo;
- [`dashboard/index.html`](prototypes/dashboard/index.html) para o dashboard.

É proibido iniciar uma alteração visual ou estrutural diretamente em
`apps/catalog/` ou `apps/dashboard/`. Os aplicativos são a implementação do
protótipo aprovado, não a fonte para definir uma nova interface.

## Fluxo obrigatório

1. Identificar a necessidade e os requisitos afetados.
2. Alterar o protótipo navegável correspondente, incluindo layout,
   componentes, copy, estados e interações necessários.
3. Validar a coerência da proposta com a especificação de interface, os
   fundamentos compartilhados, os tokens e os contratos existentes.
4. Submeter a alteração do protótipo para aprovação explícita do responsável
   pelo projeto.
5. Somente após a aprovação, aplicar a mudança aprovada no aplicativo
   correspondente.
6. Executar as verificações de qualidade aplicáveis e registrar a mudança na
   documentação afetada.

Até a aprovação, o protótipo pode representar uma proposta em validação, mas
a implementação nos aplicativos não deve ser iniciada.

## Limites da implementação

- Uma mudança no app deve reproduzir o protótipo aprovado; diferenças exigem
  nova alteração no protótipo e nova aprovação.
- Ajustes exclusivamente técnicos, de acessibilidade, integração ou correção
  de defeito podem ser feitos no app quando não alterarem a interface aprovada.
  Se alterarem aparência, estrutura, copy, estados ou interação, voltam a
  seguir este fluxo.
- Alterações em tokens compartilhados também devem atualizar os protótipos na
  mesma proposta e passar por aprovação antes de serem aplicadas nos apps.
- A especificação de interface continua sendo a fonte para requisitos e
  comportamento; o protótipo é a fonte visual e estrutural da implementação.

## Critério de aceite

Uma alteração de UI só está concluída quando o protótipo correspondente e o
app estão alinhados, a aprovação está registrada ou vinculada à mudança, e as
verificações aplicáveis foram executadas.
