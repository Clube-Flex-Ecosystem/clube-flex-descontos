# Fundamentos compartilhados de interface

**Etapa:** 09 — Interface  
**Estado:** Aprovado — paleta e tipografia definidas pelo responsável em 2026-10-10; protótipos como referência obrigatória de construção

Este documento centraliza princípios visuais e comportamentos comuns ao catálogo e ao dashboard. Ele não determina compartilhamento de código nem uma biblioteca geral de componentes; para ícones, ambos os frontends adotam Lucide por meio de seus adaptadores locais.

## Fonte da interface

O fluxo de alteração é obrigatório: uma mudança de UI começa no protótipo
correspondente em [`specs/prototypes/`](../prototypes/), é submetida à
aprovação explícita e só depois pode ser aplicada em `apps/catalog/` ou
`apps/dashboard/`. Os aplicativos não são fonte para definir alterações
visuais. Consulte o [processo de evolução da interface](../ui-change-process.md).

A interface é construída a partir de três fontes, nesta ordem de precedência quando houver conflito:

1. **Especificação de interface** ([catálogo](catalog/interface.md) e [dashboard](dashboard/interface.md)): fluxos, copy aprovada, estados, regras e comportamento.
2. **Protótipos navegáveis** em [`specs/prototypes/`](../prototypes/): estrutura de página, composição, componentes, estados visuais e interações. São a referência de construção; a implementação reproduz sua estrutura e seus estados, e não os reinventa.
3. **Tokens** em [`apps/dashboard/src/styles/tailwind.css`](../../apps/dashboard/src/styles/tailwind.css): paleta, tipografia, escalas, raios, sombras e dimensões de controles.

Regras:

- Valores visuais (cores, tamanhos, sombras, raios) vêm dos tokens. Não são introduzidos valores literais nos componentes.
- Os protótipos espelham os valores dos tokens; ao alterar um token, os protótipos são atualizados na mesma mudança.
- O catálogo adota o mesmo bloco de tokens quando for construído (incremento 4); até lá, o arquivo do dashboard é a fonte única. Quando os dois apps o consumirem, o arquivo passa a um local compartilhado, mediante decisão arquitetural.
- Os protótipos não definem contratos, regras de negócio nem dados; usam dados ilustrativos.
- Divergência entre protótipo e especificação de interface é tratada como defeito de documentação e resolvida antes da implementação afetada.

## Linguagem visual

- As aplicações compartilham a identidade da marca: laranja como cor de ação e destaque, navy como superfície escura (sidebar, blocos de ênfase) e neutros azulados para fundos e bordas.
- O catálogo é mais expressivo e aberto, com maior escala tipográfica e blocos de destaque.
- O dashboard prioriza legibilidade, densidade controlada e clareza operacional.
- Tokens semânticos preservam o mesmo significado nas duas aplicações.
- Controles interativos usam a linguagem "elevada": face clara com borda e sombra sutis, e estado pressionado com sombra interna.

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

- `Geist` é a família única, em leitura, interface e títulos, nas duas aplicações.
- Escala: título de página `24/32`, seção `16/24`, título de cartão `14/20`, métrica `28/32`, corpo `14/20`, texto auxiliar e rótulo `13/18`, legenda `12/16`.
- A escala distingue os níveis sem depender apenas de cor. Dados numéricos usam algarismos tabulares.
- O catálogo pode ampliar títulos de destaque em relação à escala do dashboard, mantendo a mesma família.

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

### Contraste (estimativas a validar com ferramenta)

- Texto branco sobre `primary` (`#cc4a0a`): cerca de 4,6:1, adequado a texto pequeno.
- Texto branco sobre `primary-raised` (`#d1500e`): cerca de 4,3:1; usar em textos de tamanho maior ou em ações do dashboard, e preferir `primary` nos fluxos públicos com exigência WCAG 2.2 AA.
- Texto laranja sobre fundo claro: usar `accent-foreground` (`#b23f07`, cerca de 5,4:1), nunca `primary` ou `accent` em texto pequeno.

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
- Validar os contrastes estimados com ferramenta antes da primeira publicação.
- Dark mode está fora de escopo; o arquivo de tokens declara `color-scheme: light`.
