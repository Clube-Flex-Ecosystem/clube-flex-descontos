# Fundamentos compartilhados de interface

**Etapa:** 09 — Interface  
**Estado:** Em validação visual

Este documento centraliza princípios visuais e comportamentos comuns ao catálogo e ao dashboard. Ele não determina compartilhamento de código, biblioteca de componentes ou arquitetura interna dos frontends.

## Linguagem visual

- As aplicações compartilham a identidade geral da marca.
- O catálogo possui expressão editorial e maior uso de tipografia de destaque.
- O dashboard prioriza legibilidade, densidade controlada e clareza operacional.
- Tokens semânticos devem preservar o mesmo significado entre as aplicações, ainda que sua implementação seja separada.

## Escalas compartilhadas

### Espaçamento

A escala utiliza uma unidade-base de \`4px\`: \`4\`, \`8\`, \`12\`, \`16\`, \`20\`, \`24\`, \`32\`, \`40\`, \`48\` e \`64px\`. Valores intermediários só devem ser introduzidos quando uma necessidade visual concreta não puder ser atendida pela escala.

### Raios

- \`8px\`: campos, botões, seletores e controles compactos;
- \`12px\`: cartões, menus, dialogs e painéis operacionais;
- \`16px\`: superfícies de maior destaque no catálogo;
- formato circular: avatares, indicadores e botões exclusivamente iconográficos.

### Elevação

- Superfícies comuns são separadas principalmente por borda e contraste de fundo.
- Sombras discretas identificam elementos flutuantes, menus e dialogs.
- Sombras decorativas intensas não fazem parte da linguagem operacional do dashboard.

### Tipografia

- \`DM Sans\` é a família de leitura e interface nas duas aplicações.
- \`Fraunces\` é a família de expressão editorial do catálogo e pode aparecer pontualmente nas telas de acesso do dashboard.
- Textos operacionais e dados tabulares não utilizam \`Fraunces\`.
- A escala deve distinguir título de página, título de seção, corpo, rótulo, texto auxiliar e legenda sem depender apenas de cor.

## Responsividade

- O menor viewport suportado possui \`320px\` de largura.
- Controles essenciais preservam alvo de interação de ao menos \`44px\` no catálogo e em interações móveis do dashboard.
- O catálogo é projetado primeiro para celular e amplia progressivamente sua grade.
- O dashboard preserva densidade operacional no desktop e adapta navegação, tabelas e Kanban sem esconder capacidades.

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

## Pendências de validação

A logo oficial ainda será fornecida. Até lá, as especificações indicam apenas um espaço reservado e não definem um ativo definitivo.

Os valores visuais propostos neste documento dependem da aprovação dos protótipos antes de o design ser considerado concluído.
