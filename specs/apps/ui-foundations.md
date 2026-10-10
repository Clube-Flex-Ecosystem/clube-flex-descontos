# Fundamentos compartilhados de interface

**Etapa:** 09 — Interface  
**Estado:** Aprovado

Este documento centraliza princípios visuais e comportamentos comuns ao catálogo e ao dashboard. Ele não determina compartilhamento de código, biblioteca de componentes ou arquitetura interna dos frontends.

## Linguagem visual

- As aplicações compartilham a identidade geral da marca.
- O catálogo possui expressão editorial e maior uso de tipografia de destaque.
- O dashboard prioriza legibilidade, densidade controlada e clareza operacional.
- Tokens semânticos devem preservar o mesmo significado entre as aplicações, ainda que sua implementação seja separada.

## Componentes essenciais

- botão;
- link;
- campo de texto;
- seletor;
- checkbox;
- badge de estado;
- cartão;
- tabela;
- dialog central e dialog lateral;
- toast;
- skeleton;
- mensagem vazia;
- mensagem de erro;
- confirmação de ação.

Só devem ser criados componentes que tenham uso real. Esta relação define necessidades de interface, não obriga uma biblioteca abstrata antecipada.

## Estados de controles

Controles interativos contemplam, quando aplicável:

- padrão;
- hover;
- foco visível;
- pressionado;
- desabilitado;
- carregando;
- inválido.

O estado não pode ser comunicado somente por cor.

## Cores semânticas

- verde: sucesso;
- âmbar: atenção;
- vermelho: erro ou ação destrutiva;
- azul: informação;
- indicador de foco com contraste mínimo de 3:1 contra cores adjacentes.

O coral da marca não representa automaticamente erro. Os valores exatos dos tokens semânticos serão validados visualmente durante a implementação, respeitando os requisitos de contraste.

## Feedback e acessibilidade básica

- Rótulos permanecem associados aos controles.
- Mensagens de erro identificam o campo ou a operação afetada.
- Foco por teclado é sempre perceptível.
- Dialogs administram entrada, contenção e restauração de foco.
- Ações em processamento impedem repetição acidental sem remover o contexto do usuário.
- Toasts complementam feedback persistente e não são a única fonte de erro.
- Movimento respeita `prefers-reduced-motion`.

## Pendência não bloqueante

A logo oficial ainda será fornecida. Até lá, as especificações indicam apenas um espaço reservado e não definem um ativo definitivo.
