# Fundamentos compartilhados de interface

**Etapa:** 09 — Interface  
**Estado:** Aprovado — sistema visual do dashboard aprovado em 2026-10-11 ([proposta](../prototypes/dashboard/proposals/2026-10-sistema-visual/README.md), direção A, que substitui a direção B aprovada anteriormente no mesmo dia); sistema visual próprio do catálogo aprovado em 2026-10-11 ([proposta](../prototypes/catalog/proposals/2026-10-sistema-visual/README.md)); protótipos como referência obrigatória de construção

Este documento centraliza princípios visuais e comportamentos comuns ao catálogo e ao dashboard. Ele não determina compartilhamento de código nem uma biblioteca geral de componentes; o catálogo importa ícones diretamente de `@lucide/astro`, enquanto o dashboard segue o adaptador definido em sua arquitetura.

## Fonte da interface

O fluxo de alteração é obrigatório: uma mudança de UI começa no protótipo
correspondente em [`specs/prototypes/`](../prototypes/), é submetida à
aprovação explícita e só depois pode ser aplicada em `apps/catalog/` ou
`apps/dashboard/`. Os aplicativos não são fonte para definir alterações
visuais. Consulte o [processo de evolução da interface](../ui-change-process.md).

A interface separa as fontes por responsabilidade, sem criar uma precedência
única que permita uma fonte substituir outra:

1. **Especificação de interface** ([catálogo](catalog/interface.md) e [dashboard](dashboard/interface.md)): fluxos, copy aprovada, requisitos funcionais, regras e comportamento.
2. **Protótipos navegáveis** em [`specs/prototypes/`](../prototypes/): fonte vinculante para estrutura visual, composição, componentes, medidas, tipografia, pesos, cores, espaçamentos, estados visuais, interações e animações. A implementação reproduz sua estrutura e seus estados, e não os reinventa.
3. **Tokens** definidos neste documento: valores de cor, tipografia, escalas, raios, sombras e dimensões de controles. Cada aplicativo materializa os seus em `src/styles/tailwind.css` ([dashboard](../../apps/dashboard/src/styles/tailwind.css) e [catálogo](../../apps/catalog/src/styles/tailwind.css)); esses arquivos não são fontes concorrentes.

Regras:

- Valores visuais (cores, tamanhos, sombras, raios) vêm dos tokens. Não são introduzidos valores literais nos componentes.
- Os protótipos espelham os valores dos tokens; ao alterar um token, os protótipos e a materialização nos aplicativos são atualizados na mesma mudança.
- Catálogo e dashboard compartilham a foundation de marca (escalas `navy-*` e `orange-*`) e as cores de estado, e possuem mapeamento semântico, tipografia, raios, elevação e densidade próprios (decisões de 2026-10-11). Os nomes dos papéis semânticos (`primary`, `foreground`, `border`, `focus`…) são preservados quando o significado é o mesmo. Os fundamentos específicos estão em [Fundamentos do dashboard](#fundamentos-do-dashboard) e [Fundamentos do catálogo](#fundamentos-do-catálogo); as demais seções valem para os dois apps.
- Os protótipos não definem contratos, regras de negócio nem dados; usam dados ilustrativos.
- Divergência entre protótipo e especificação de interface é tratada como defeito de documentação e resolvida antes da implementação afetada. O agente não escolhe uma fonte silenciosamente.

## Linguagem visual

- As aplicações compartilham a identidade da marca por uma **foundation comum**:
  as escalas `navy-*` e `orange-*` (tabela em
  [Escalas de foundation](#escalas-de-foundation)), ancoradas no logo de
  referência, e as cores de estado. Navy é estrutura (texto, limites e, no
  dashboard, a moldura de navegação); laranja preenchido significa ação.
  Componentes não consomem degraus de foundation diretamente: consomem papéis
  semânticos.
- A expressão de cada app é definida separadamente
  ([dashboard](#fundamentos-do-dashboard) e
  [catálogo](#fundamentos-do-catálogo)). O catálogo é mais expressivo e aberto,
  com maior escala tipográfica e blocos de destaque. O dashboard é emoldurado
  por uma navegação navy escura, com conteúdo claro: prioriza legibilidade,
  densidade estável e clareza operacional.
- Tokens semânticos preservam o mesmo nome e significado nas duas aplicações.
- No dashboard, controles e superfícies são planos: limites por borda, estados
  por cor, elevação somente em elementos que flutuam (decisão de 2026-10-11,
  que substitui a linguagem "elevada" aprovada em 2026-10-10).

## Escalas compartilhadas

### Espaçamento

Unidade-base de `4px`, com passos intermediários de `2px` e `6px` para ajustes finos: `2`, `4`, `6`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48` e `64px`. Valores fora da escala só são introduzidos diante de necessidade visual concreta.

### Raios

Raios são nomeados por função, e não por tamanho. Os valores de cada app
estão em seus fundamentos: dashboard `6/8/10/12px`
([Raios e elevação](#raios-e-elevação)); catálogo `12/16/24px`
([Raios, sombras e materialidade](#raios-sombras-e-materialidade)). Ambos usam
`999px` para formas circulares.

### Elevação

- Superfícies comuns são separadas por borda e contraste de fundo, sem sombra.
- Sombra representa elevação real: menus, popovers, toasts, dialogs, sheets e
  objetos sendo arrastados. Cada app define seus níveis em seus fundamentos.
- Sombras decorativas intensas não fazem parte da linguagem operacional do dashboard.

### Tipografia

- Os dois apps usam `Archivo`. O dashboard usa o eixo `wdth 100` na
  interface e `wdth 110` apenas no título de página; identificadores usam a
  pilha monoespaçada do sistema (ver [Tipografia do dashboard](#tipografia-do-dashboard)).
  A expressão do catálogo está em [Fundamentos do catálogo](#fundamentos-do-catálogo).
- A escala distingue os níveis sem depender apenas de cor. Dados numéricos usam algarismos tabulares.
- Fontes remotas são carregadas por `<link>` (com `preconnect`) no documento-base de cada app, nunca por `@import` no CSS, e somente com os pesos usados.

### Controles

- Dashboard: `32px` (barras de filtro, ações de linha, sub-tabelas), `36px` (padrão: formulários, sheets, dialogs, cabeçalho de página) e `40px` (acesso sem sessão).
- Em interações móveis (`pointer: coarse`), o alvo mínimo é de `44px` no catálogo e no dashboard.
- Linhas de tabela do dashboard: `48px` em todas as listagens, inclusive a auditoria; cabeçalho de `36px`.

## Responsividade

- O menor viewport suportado possui `320px` de largura.
- O catálogo é projetado primeiro para celular e amplia progressivamente sua grade.
- O dashboard preserva densidade operacional no desktop e adapta navegação, tabelas e Kanban sem esconder capacidades.
- Dimensões estruturais do dashboard vêm dos tokens: sidebar de `232px` (recolhida `56px`), cabeçalho de `48px`, item de menu de `32px`, conteúdo de até `1600px` com margem horizontal de `28px` no desktop e `16px` no celular.

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

No dashboard, primitives externas são usadas apenas quando o comportamento composto justificar: Radix UI administra foco, overlay, teclado e posicionamento de dialogs, sheets, confirmações, menus e toasts. A aparência continua sendo construída com tokens e Tailwind pelos componentes locais. Alertas persistentes, badges, cartões e controles simples não exigem primitive externa.

## Estados de controles

Controles interativos contemplam, quando aplicável:

- padrão;
- hover;
- foco visível;
- pressionado;
- desabilitado;
- carregando;
- inválido.

O estado não pode ser comunicado somente por cor. Desabilitado não usa
opacidade: tem fundo, texto e borda próprios.

## Cores semânticas

- verde (`success`): sucesso;
- âmbar (`warning`): atenção;
- vermelho (`danger`): erro ou ação destrutiva;
- azul (`info`): informação;
- laranja (`primary`): ação principal; no dashboard também posição, seleção, `signal` e `attention` ("precisa de você"). Nunca representa erro por si só;
- indicador de foco (`focus`) com contraste mínimo de 3:1 contra cores adjacentes.

Valores: `success #157347` / `#E7F6EE`, `warning #8A5A00` / `#FDF3D7`,
`danger #B4233A` / `#FDECEE` (hover `#9C1C31`), `info #1F56C4` / `#E8EFFC`.

## Fundamentos do dashboard

Aprovados em 2026-10-11 (direção A — "Moldura navy"), em substituição à
direção B aprovada no mesmo dia e revertida pelo responsável. A auditoria, as
alternativas e a comparação estão na
[proposta](../prototypes/dashboard/proposals/2026-10-sistema-visual/README.md).
Valores materializados em [`apps/dashboard/src/styles/tailwind.css`](../../apps/dashboard/src/styles/tailwind.css).

O dashboard usa a foundation comum (`navy-*`, `orange-*`, incluindo
`navy-800`). A marca estrutura a tela por uma moldura navy escura (sidebar);
o conteúdo é claro e plano. Laranja representa ação, posição e seleção; navy
resolve estrutura, texto e limites.

### Papéis semânticos do dashboard

| Papel | Valor | Uso |
| --- | --- | --- |
| `background` | `navy-50` | canvas da área de trabalho |
| `surface` | `#FFFFFF` | tabelas, painéis, controles, overlays |
| `surface-muted` | `navy-100` | trilho de segmentado, campo somente leitura, hover de linha e de menu, coluna do Kanban, skeleton, desabilitado, quadrado de iniciais |
| `foreground` | `navy-900` | texto principal |
| `foreground-soft` | `navy-700` | células secundárias |
| `muted-foreground` | `navy-600` | metadado, cabeçalho de tabela, hint |
| `placeholder` | `navy-500` | placeholder e texto desabilitado |
| `border` | `navy-200` | divisórias, moldura e base do cabeçalho de tabela (decorativa) |
| `border-strong` | `navy-300` | botão secundário, hover de cartão |
| `control-border` / `control-border-hover` | `navy-400` / `navy-500` | limite de campos, select e checkbox (≥ 3:1) |
| `primary` / `primary-hover` / `primary-active` | `orange-500` / `orange-400` / `orange-600` | ação principal (uma por região) |
| `primary-foreground` | `navy-900` | rótulo sobre `primary` |
| `selected` / `selected-foreground` | `orange-600` / `navy-900` | checkbox, switch, filtro alternado pressionado, alvo de soltura no Kanban |
| `selected-soft` / `selected-soft-foreground` / `selected-border` | `orange-50` / `orange-700` / `orange-500` | chip pressionado |
| `signal` | `orange-600` | ponto de novo interesse (não textual) |
| `attention-soft` / `attention-foreground` | `orange-50` / `orange-700` | badge e rótulo "Novo interesse" |
| `identity` / `identity-foreground` | `orange-50` / `orange-700` | avatar de pessoa; `identity-foreground` também nas iniciais de entidades (sobre `surface-muted`) |
| `sidebar` / `sidebar-hover` / `sidebar-selected` | `navy-900` / `navy-800` / `navy-700` | moldura de navegação, hover e item atual |
| `sidebar-foreground` / `sidebar-muted` / `sidebar-selected-foreground` | `navy-100` / `navy-300` / `#FFFFFF` | item / rótulo de grupo, ícone e usuário / item atual |
| `sidebar-border` | `navy-800` | divisórias internas da sidebar |
| `signal-inverse` | `orange-400` | marcador e ícone do item atual, "+Flex" da marca invertida, ícone do toast |
| `focus-inverse` | `orange-400` | anel de foco sobre superfícies escuras (sidebar, painel de acesso) |
| `sidebar-scrollbar` | `navy-700` | thumb da barra de rolagem na sidebar |
| `danger-hover` / `danger-foreground` | `#9C1C31` / `#FFFFFF` | botão destrutivo |
| `inverse` / `inverse-foreground` | `navy-900` / `navy-50` | tooltip e toast |
| `focus` | `orange-600` | anel de foco sobre superfícies claras |
| `overlay` | `rgb(4 23 58 / .45)` | backdrop de dialog e sheet |
| `selection` / `selection-foreground` | `orange-200` / `navy-900` | seleção de texto |
| `scrollbar-thumb` / `scrollbar-thumb-hover` | `navy-400` / `navy-600` | barra de rolagem |

### Regras de uso de cor do dashboard

- No máximo uma ação `primary` por região visível. Ações secundárias usam
  `surface`, borda `border-strong` e texto `foreground`.
- Seleção usa laranja: preenchida (`selected`, com marca navy) em checkbox,
  switch e filtro alternado; suave (`selected-soft` com borda
  `selected-border`) em chips. O segmentado continua neutro (`surface` com
  contorno `border-strong`).
- Na sidebar, o item atual combina fundo `sidebar-selected`, texto 600,
  ícone e marcador de 3px em `signal-inverse`; a posição não depende só da
  cor.
- Avatares de pessoas usam `identity`; entidades (parceiros, planos)
  usam quadrado de iniciais `surface-muted` com texto `identity-foreground`.
  Etapas abertas e pontos de linha do tempo são neutros.
- `danger` aparece apenas no ponto de decisão: botão de entrada destrutiva
  (contorno, texto `danger`) e botão de confirmação (preenchido). Zonas de
  ação destrutiva não recebem borda nem título vermelhos.
- Links de texto usam `foreground` com sublinhado; o sublinhado pode usar
  `primary` como sinal de marca.

### Famílias de estado

| Família | Estados de negócio |
| --- | --- |
| `success` | Publicado, Ativa, Ativada, Convertido |
| `info` | Rascunho, Aguardando ativação |
| `neutral` (`foreground-soft` sobre `surface-muted`) | Desativado, Inativa, Perdido (com ícone ✕) |
| `warning` | Conflito de versão, alterações não salvas |
| `danger` | Erro, falha |
| `attention` | Novo interesse |

Etapas abertas do Kanban não têm cor própria (ponto `control-border`);
"Convertido" usa `success` e "Perdido", `muted-foreground`. Metadados
(Protegida, Destaque) usam tag neutra com contorno `border-strong` e ícone.
Estados sempre têm texto; badges de estado têm ponto.

### Tipografia do dashboard

`Archivo` (família do catálogo), fonte variável carregada por `<link>` em
`apps/dashboard/index.html` com `wght 400–700` e `wdth 100–110`. A interface
usa `wdth 100`; somente o título de página usa `wdth 110`. Identificadores
usam a pilha monoespaçada do sistema (`ui-monospace`, `SF Mono`, `Menlo`,
`Consolas`), sem fonte remota.

| Papel | Tamanho / entrelinha | Peso | Tracking | Uso |
| --- | --- | --- | --- | --- |
| `page-title` | 22 / 28, `wdth 110` | 650 | −0.015em | h1 da página |
| `section-title` | 16 / 22 | 600 | −0.005em | seção de painel, título de dialog e sheet |
| `heading` | 13 / 18 | 600 | 0 | coluna do Kanban, área de permissão, subgrupo |
| `body` | 14 / 20 | 400 | 0 | texto e células |
| `body-small` | 13 / 18 | 400 | 0 | metadado, hint, descrição |
| `label` | 13 / 18 | 500 | 0 | rótulo de campo, item de navegação |
| `button` | 13 / 18 | 600 | 0 | botões, segmentado |
| `table-header` | 12 / 16 | 500 | 0.01em | cabeçalho de tabela |
| `caption` | 12 / 16 | 500 | 0 | data, rodapé, badge |
| `overline` | 11 / 16 | 600 | 0.06em, caixa alta | rótulo de grupo da sidebar |
| `mono` | 13 / 18 (16 / 24 em código emitido) | 400 | 0 (0.08em em código) | slug, usuário, cupom, código |

Nomes de entidade nas tabelas e no Kanban usam peso 600. Números usam
algarismos tabulares; contagens enfatizadas usam peso 500.

### Raios e elevação

| Raio | Valor | Uso |
| --- | --- | --- |
| `badge` | 6px | badge, tag, tooltip, item de menu |
| `control` | 8px | botão, campo, select, segmentado, item de navegação, quadrado de iniciais |
| `tile` | 10px | menu, toast, cartão do Kanban |
| `card` | 12px | moldura de tabela, painel, alerta, coluna do Kanban, barra de filtros |
| `overlay` | 12px | dialog central |
| `full` | 999px | avatar, switch, contador |

O sheet lateral não tem raio.

| Sombra | Valor | Uso |
| --- | --- | --- |
| `shadow-floating` | `0 1px 2px rgb(4 23 58 / .06), 0 6px 16px rgb(4 23 58 / .10)` | menu, popover, toast, cartão sendo arrastado |
| `shadow-overlay` | `0 2px 6px rgb(4 23 58 / .08), 0 24px 48px rgb(4 23 58 / .18)` | dialog, sheet |

Cartões, tabelas, botões e campos não têm sombra; os limites vêm da borda.
Pressionado é resolvido por cor. Cartão dentro de cartão é proibido: páginas
de detalhe empilham cartões independentes, um por seção, com `16px` entre
eles.

### Densidade do dashboard

Densidade única: controles de `36px` (`32px` em barras de filtro e ações de
linha), linhas de tabela de `48px` em todas as listagens (inclusive a
auditoria), cabeçalho de tabela de `36px`, padding de célula de `16px` e
conteúdo com margem horizontal de `28px` no desktop.

### Estados globais do browser (dashboard)

| Estado | Decisão |
| --- | --- |
| Seleção | `selection` + `selection-foreground` |
| Scrollbar | `::-webkit-scrollbar` de 10px com thumb visível de 6px (`scrollbar-thumb`, borda transparente), calha transparente e hover `scrollbar-thumb-hover`; na sidebar, thumb `sidebar-scrollbar`; `scrollbar-color` + `scrollbar-width: thin` apenas onde os pseudo-elementos WebKit não existem; scrollbars overlay não são alteradas |
| Foco | `outline` de 2px, offset 2px: `focus` sobre superfícies claras e `focus-inverse` sobre a sidebar; campos usam borda `focus` + anel de 1px |
| Caret | `focus` |
| Placeholder | `placeholder` com opacidade total |
| Autofill | fundo `surface-muted` e texto `foreground` |
| Desabilitado | fundo `surface-muted`, texto `placeholder`, borda `border`, `cursor: not-allowed`; sem opacidade |

### Contraste validado (dashboard)

Calculado em 2026-10-11 com a fórmula de luminância relativa da WCAG 2.2.

| Par | Razão | Mínimo |
| --- | --- | --- |
| `foreground` / `background` · `surface-muted` | 17,06 · 15,71 | 4,5 |
| `foreground-soft` / `surface` | 10,52 | 4,5 |
| `muted-foreground` / `surface` · `surface-muted` | 7,35 · 6,54 | 4,5 |
| `placeholder` / `surface` · `surface-muted` | 5,44 · 4,84 | 4,5 |
| `primary-foreground` / `primary` · `primary-hover` · `primary-active` | 5,37 · 6,20 · 4,63 | 4,5 |
| `danger-foreground` / `danger` · `danger-hover` | 6,48 · 8,00 | 4,5 |
| `attention-foreground` · `identity-foreground` · `selected-soft-foreground` / `orange-50` | 5,41 | 4,5 |
| `identity-foreground` / `surface-muted` | 5,13 | 4,5 |
| `success` · `warning` · `danger` · `info` / `*-soft` | 5,26 · 5,36 · 5,68 · 5,71 | 4,5 |
| `selected-foreground` / `selected` | 4,63 | 4,5 |
| `sidebar-foreground` / `sidebar` · `sidebar-hover` | 15,71 · 12,96 | 4,5 |
| `sidebar-muted` / `sidebar` · `sidebar-hover` | 9,51 · 7,84 | 4,5 |
| `sidebar-selected-foreground` / `sidebar-selected` | 10,52 | 4,5 |
| `inverse-foreground` / `inverse` | 17,06 | 4,5 |
| `control-border` / `surface` · `surface-muted` | 3,63 · 3,23 | 3 |
| `selected` / `surface` · `background` | 3,81 · 3,68 | 3 |
| `focus` / `surface` · `background` | 3,81 · 3,68 | 3 |
| `focus-inverse` · `signal-inverse` / `sidebar` · `sidebar-hover` · `sidebar-selected` | 6,20 · 5,12 · 3,69 | 3 |
| `signal` / `surface` | 3,81 | 3 |
| `selection-foreground` / `selection` | 12,47 | 4,5 |
| `scrollbar-thumb` / `surface` | 3,63 | 3 |

Exceções conhecidas e aceitas na direção A: o item atual da sidebar
(`sidebar-selected` sobre `sidebar`, 1,68:1) é identificado também pelo
marcador, pelo ícone em `signal-inverse` e pelo peso 600; o thumb da
scrollbar da sidebar (`sidebar-scrollbar`, 1,68:1) segue a proposta aprovada
e aparece somente quando a lista excede a altura; a borda `selected-border`
do chip (3,29:1) acompanha o texto `selected-soft-foreground` e a marca ✓.

## Fundamentos do catálogo

Aprovados em 2026-10-11 (direção A — "Estrutura navy, ação luminosa"). A
auditoria, as alternativas descartadas e a justificativa estão na
[proposta](../prototypes/catalog/proposals/2026-10-sistema-visual/README.md).
Valores materializados em [`apps/catalog/src/styles/tailwind.css`](../../apps/catalog/src/styles/tailwind.css).

### Escalas de foundation

A escala navy serve ao mesmo tempo como neutro e como cor de marca; o laranja é
ancorado no logo de referência (`#FC5000`). Estas escalas são a foundation
comum aos dois apps. Degraus de foundation não são usados
diretamente em componentes: componentes consomem papéis semânticos.

| Navy | HEX | Laranja | HEX |
| --- | --- | --- | --- |
| `navy-50` | `#FAFBFD` | `orange-50` | `#FFF6F0` |
| `navy-100` | `#EEF2F7` | `orange-100` | `#FFE9DB` |
| `navy-200` | `#DCE2EC` | `orange-200` | `#FFCFB2` |
| `navy-300` | `#B4BFD0` | `orange-400` | `#FF6B1F` |
| `navy-400` | `#7A879E` | `orange-500` | `#FD5200` |
| `navy-500` | `#5E6A82` | `orange-600` | `#EA4B00` |
| `navy-600` | `#4A5670` | `orange-700` | `#B83A00` |
| `navy-700` | `#333F59` | | |
| `navy-800` | `#18284A` | | |
| `navy-900` | `#04173A` | | |

### Papéis semânticos

| Papel | Valor | Uso |
| --- | --- | --- |
| `background` | `navy-50` | canvas da página |
| `surface` | `#FFFFFF` | cartões, painéis, controles |
| `surface-muted` | `navy-100` | bandas de seção, tags, bolha do assistente, palco do hero |
| `sidebar` | `navy-900` | superfície escura: rodapé, faixa, bloco de benefício |
| `sidebar-raised` | `navy-800` | divisores e elevação dentro de superfícies escuras |
| `foreground` | `navy-900` | texto principal |
| `foreground-soft` | `navy-700` | texto de apoio |
| `muted-foreground` | `navy-600` | legendas, hints, metadados |
| `placeholder` | `navy-500` | placeholder e texto desabilitado |
| `sidebar-foreground` / `sidebar-muted` | `navy-100` / `navy-300` | texto sobre navy |
| `border` | `navy-200` | separação de conteúdo (decorativa) |
| `border-strong` | `navy-300` | hover de cartão, contorno de chip e de botão secundário |
| `control-border` | `navy-400` | borda que identifica campos e selects (≥ 3:1) |
| `primary` | `orange-500` | ação principal |
| `primary-hover` / `primary-active` | `orange-400` / `orange-600` | estados da ação principal |
| `primary-foreground` | `navy-900` | rótulo sobre `primary` |
| `accent-foreground` | `orange-700` | texto laranja pequeno (eyebrow, título de instruções) |
| `accent-strong` | `orange-600` | percentuais e números de destaque (≥ 24px) |
| `accent-soft` / `accent-subtle` | `orange-100` / `orange-50` | cupom, instruções de uso, autofill |
| `brand-signal` | `orange-500` | sinal gráfico (`+`, ponto do selo, formas) e percentual sobre navy |
| `focus` / `focus-on-dark` | `orange-600` / `orange-400` | anel de foco em superfícies claras / sobre navy |
| `selection` / `selection-foreground` | `orange-200` / `navy-900` | seleção de texto |
| `scrollbar-track` / `scrollbar-thumb` / `scrollbar-thumb-hover` | `background` / `navy-400` / `navy-600` | barra de rolagem |

As cores semânticas de estado mantêm os valores compartilhados: `success #157347`,
`warning #8A5A00`, `danger #B4233A`, `info #1F56C4` e seus fundos `*-soft`.

### Regras de uso de cor

- Laranja preenchido significa ação. Laranja em número grande significa valor.
  Fora disso, laranja aparece apenas como sinal gráfico.
- Há no máximo uma ação `primary` por região visível; ações secundárias usam
  `surface` com borda `border-strong` e texto `foreground`.
- Links de texto são `foreground` com sublinhado `brand-signal`.
- Estados de seleção (chip ativo, bolha do visitante no assistente, selo de
  destaque) usam navy, não laranja.
- Títulos não usam laranja para criar hierarquia; a hierarquia vem da
  tipografia.
- O botão flutuante do assistente é navy, para não competir com a ação `primary`.

### Tipografia

`Archivo` é a família única do catálogo, carregada como fonte variável
(`wght 400–800`, `wdth 100–125`) por `<link>` no layout público. Títulos e
números usam largura expandida; corpo, controles e navegação usam largura
normal. Números de destaque, telefones e contagens usam algarismos tabulares.

| Nível | Tamanho / entrelinha | Peso | Largura | Tracking |
| --- | --- | --- | --- | --- |
| hero | `clamp(40px, 4.4vw, 64px)` / 0.98 | 800 | 112% | -0.035em |
| display (seção) | `clamp(32px, 4.8vw, 52px)` / 1.04 | 750 | 110% | -0.03em |
| title (página interna) | `clamp(34px, 5vw, 56px)` / 1.02 | 800 | 110% | -0.03em |
| heading (cartão, painel, passo) | 22px / 1.2 | 650 | 100% | -0.012em |
| body-lg | 19px / 1.55 | 400 | 100% | 0 |
| body | 16px / 1.55 | 400 | 100% | 0 |
| small | 14px / 1.45 | 400 | 100% | 0 |
| control | 16px / 1.25 (15px compacto) | 650 | 100% | 0 |
| navigation | 15px | 500 | 100% | 0 |
| caption | 13px / 1.35 | 500 | 100% | 0 |
| eyebrow | 13px, caixa alta | 750 | 115% | 0.1em |
| número de cartão | 40px / 1 | 800 | 108% | -0.03em |
| número de destaque | 72px / 1 | 800 | 108% | -0.03em |

### Raios, sombras e materialidade

| Raio | Valor | Uso |
| --- | --- | --- |
| `control` | 12px | botões, campos, select, cupom, itens de navegação |
| `card` | 16px | cartões de parceiro, de valor e de passo, estados, unidades |
| `panel` | 24px | palco do hero, painéis da página de parceiro, assistente |
| `signature` | 14px | Flex Card |
| `pill` | 999px | selo, chips, tags, botão flutuante |

| Sombra | Onde pode aparecer |
| --- | --- |
| `shadow-soft` | controles em repouso (botão secundário, select) |
| `shadow-card` | somente hover de cartão acionável e cartões flutuantes do hero |
| `shadow-float` | assistente, botão flutuante, toast |
| `shadow-signature` | exclusiva do Flex Card |
| `shadow-brand` / `shadow-brand-pressed` | exclusivas da ação `primary` |

Superfícies de conteúdo são planas e separadas por superfície e borda.
A materialidade fica restrita ao Flex Card e à ação `primary`.

### Movimento

Durações de `120ms` (hover e pressionado), `200ms` (elementos pequenos) e
`320ms` (painéis), com curva `cubic-bezier(.2, .7, .2, 1)`. Movimento contínuo
apenas na faixa de categorias e na flutuação do Flex Card. Tudo é interrompido
com `prefers-reduced-motion`.

### Estados globais do browser

| Estado | Decisão |
| --- | --- |
| Seleção | `selection` + `selection-foreground` (12,47:1) |
| Scrollbar | `::-webkit-scrollbar` com calha de 12px, thumb de 6px visíveis (`scrollbar-thumb`, 3,50:1) e hover `scrollbar-thumb-hover`; `scrollbar-color` apenas onde os pseudo-elementos WebKit não existem; largura nativa preservada; scrollbars overlay não são alteradas |
| Foco | anel de 3px `focus`, offset 2px; `focus-on-dark` sobre superfícies escuras |
| Caret | `focus` |
| Placeholder | `placeholder` com opacidade total |
| Autofill | fundo `accent-subtle` e texto `foreground` |
| Desabilitado | fundo `surface-muted`, texto `placeholder`, borda `border`, `cursor: not-allowed`; sem opacidade |

### Contraste validado

| Par | Razão | Mínimo |
| --- | --- | --- |
| `foreground` / `background` · `surface` · `surface-muted` | 17,06 · 17,66 · 15,58 | 4,5 |
| `foreground-soft` / `background` | 10,16 | 4,5 |
| `muted-foreground` / `background` · `surface` · `surface-muted` | 7,10 · 7,35 · 6,54 | 4,5 |
| `placeholder` / `surface` | 5,44 | 4,5 |
| `primary-foreground` / `primary` · `primary-hover` · `primary-active` | 5,37 · 6,20 · 4,63 | 4,5 |
| `accent-strong` / `surface` · `surface-muted` (≥ 24px) | 3,81 · 3,39 | 3 |
| `accent-foreground` / `background` · `accent-soft` | 5,57 · 4,92 | 4,5 |
| `brand-signal` / `sidebar` (≥ 24px) | 5,37 | 3 |
| `sidebar-foreground` · `sidebar-muted` / `sidebar` | 15,58 · 9,51 | 4,5 |
| `focus` / `background` · `surface` · `surface-muted` | 3,68 · 3,81 · 3,39 | 3 |
| `focus-on-dark` / `sidebar` | 6,20 | 3 |
| `control-border` / `surface` · `surface-muted` | 3,63 · 3,23 | 3 |
| `selection-foreground` / `selection` | 12,47 | 4,5 |
| `scrollbar-thumb` / `scrollbar-track` | 3,50 | 3 |

## Feedback e acessibilidade básica

- Rótulos permanecem associados aos controles.
- Mensagens de erro identificam o campo ou a operação afetada.
- Foco por teclado é sempre perceptível.
- Dialogs administram entrada, contenção e restauração de foco.
- Ações em processamento impedem repetição acidental sem remover o contexto do usuário.
- Toasts complementam feedback persistente e não são a única fonte de erro.
- Movimento respeita `prefers-reduced-motion`.
- O título do documento reflete a página exibida; no dashboard ele é declarado pela rota.

## Pendências

- A logo oficial ainda será fornecida, incluindo a versão para fundo escuro exigida pela sidebar do dashboard. Até lá, as especificações indicam apenas um espaço reservado e não definem um ativo definitivo.
- A arte oficial do Flex Card ainda será fornecida; o catálogo usa uma representação ilustrativa provisória.
- Dark mode está fora de escopo; o arquivo de tokens declara `color-scheme: light`.
