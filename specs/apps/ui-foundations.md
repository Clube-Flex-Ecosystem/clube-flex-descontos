# Fundamentos compartilhados de interface

**Etapa:** 09 — Interface  
**Estado:** Aprovado — paleta e tipografia do dashboard definidas pelo responsável em 2026-10-10; sistema visual próprio do catálogo aprovado em 2026-10-11 ([proposta](../prototypes/catalog/proposals/2026-10-sistema-visual/README.md)); protótipos como referência obrigatória de construção

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
- Catálogo e dashboard possuem paleta e tipografia próprias (decisão do responsável em 2026-10-11). Os nomes dos papéis semânticos (`primary`, `foreground`, `border`, `focus`…) são preservados quando o significado é o mesmo; os valores podem diferir. Os fundamentos do catálogo estão em [Fundamentos do catálogo](#fundamentos-do-catálogo); as demais seções valem para o dashboard e, quando não houver definição específica, para os dois apps.
- Os protótipos não definem contratos, regras de negócio nem dados; usam dados ilustrativos.
- Divergência entre protótipo e especificação de interface é tratada como defeito de documentação e resolvida antes da implementação afetada. O agente não escolhe uma fonte silenciosamente.

## Linguagem visual

- As aplicações compartilham a identidade da marca: laranja como cor de ação e destaque, navy como estrutura e superfície escura e neutros frios para fundos e bordas. A expressão de cada app é definida separadamente (dashboard abaixo; catálogo em [Fundamentos do catálogo](#fundamentos-do-catálogo)).
- O catálogo é mais expressivo e aberto, com maior escala tipográfica e blocos de destaque.
- O dashboard prioriza legibilidade, densidade controlada e clareza operacional.
- Tokens semânticos preservam o mesmo significado nas duas aplicações.
- No dashboard, controles interativos usam a linguagem "elevada": face clara com borda e sombra sutis, e estado pressionado com sombra interna.

## Escalas compartilhadas

### Espaçamento

Unidade-base de `4px`, com passos intermediários de `2px` e `6px` para ajustes finos: `2`, `4`, `6`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48` e `64px`. Valores fora da escala só são introduzidos diante de necessidade visual concreta.

### Raios

`4`, `6`, `8`, `10` e `12px`, além do formato circular (`999px`). Campos, botões e controles compactos usam `8px`; cartões, menus, dialogs e painéis usam `10` a `12px`. Superfícies de maior destaque do catálogo podem usar `16px` conforme o protótipo.

### Elevação

- Superfícies comuns são separadas por borda e contraste de fundo.
- Controles usam as sombras `control-inset`, `control-raised` e `control-pressed`; ações de marca usam `brand-raised`, `brand-raised-hover` e `brand-pressed`.
- Menus, dialogs e painéis flutuantes usam `shadow-md` ou `shadow-lg`.
- Sombras decorativas intensas não fazem parte da linguagem operacional do dashboard.

### Tipografia

- No dashboard, `Geist` é a família única, em leitura, interface e títulos. O catálogo usa `Archivo` (ver [Fundamentos do catálogo](#fundamentos-do-catálogo)).
- Escala: título de página `24/32`, seção `16/24`, título de cartão `14/20`, métrica `28/32`, corpo `14/20`, texto auxiliar e rótulo `13/18`, legenda `12/16`.
- A escala distingue os níveis sem depender apenas de cor. Dados numéricos usam algarismos tabulares.

### Controles

- Alturas: `32px` (compacto), `36px` (padrão) e `40px` (formulários).
- Em interações móveis, o alvo mínimo é de `44px` no catálogo e no dashboard.
- Linhas de tabela: `40px` ou `48px`.

## Responsividade

- O menor viewport suportado possui `320px` de largura.
- O catálogo é projetado primeiro para celular e amplia progressivamente sua grade.
- O dashboard preserva densidade operacional no desktop e adapta navegação, tabelas e Kanban sem esconder capacidades.
- Dimensões estruturais do dashboard vêm dos tokens: sidebar de `232px` (recolhida `56px`), cabeçalho de `48px`, item de menu de `32px` e conteúdo de até `1600px`.

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

O estado não pode ser comunicado somente por cor.

## Cores semânticas

- verde (`success`): sucesso;
- âmbar (`warning`): atenção;
- vermelho (`danger`): erro ou ação destrutiva;
- azul (`info`): informação;
- laranja (`primary`, `accent`): ação principal e destaque de marca; nunca representa erro por si só;
- indicador de foco (`focus`) com contraste mínimo de 3:1 contra cores adjacentes.

### Contraste do dashboard (estimativas a validar com ferramenta)

- Texto branco sobre `primary` (`#cc4a0a`): cerca de 4,6:1, adequado a texto pequeno.
- Texto branco sobre `primary-raised` (`#d1500e`): cerca de 4,3:1; usar em textos de tamanho maior ou em ações do dashboard, e preferir `primary` nos fluxos públicos com exigência WCAG 2.2 AA.
- Texto laranja sobre fundo claro: usar `accent-foreground` (`#b23f07`, cerca de 5,4:1), nunca `primary` ou `accent` em texto pequeno.

## Fundamentos do catálogo

Aprovados em 2026-10-11 (direção A — "Estrutura navy, ação luminosa"). A
auditoria, as alternativas descartadas e a justificativa estão na
[proposta](../prototypes/catalog/proposals/2026-10-sistema-visual/README.md).
Valores materializados em [`apps/catalog/src/styles/tailwind.css`](../../apps/catalog/src/styles/tailwind.css).

### Escalas de foundation

A escala navy serve ao mesmo tempo como neutro e como cor de marca; o laranja é
ancorado no logo de referência (`#FC5000`). Degraus de foundation não são usados
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

- A logo oficial ainda será fornecida. Até lá, as especificações indicam apenas um espaço reservado e não definem um ativo definitivo.
- Validar os contrastes estimados do dashboard com ferramenta antes da primeira publicação (os do catálogo foram calculados em 2026-10-11).
- A arte oficial do Flex Card ainda será fornecida; o catálogo usa uma representação ilustrativa provisória.
- Dark mode está fora de escopo; o arquivo de tokens declara `color-scheme: light`.
