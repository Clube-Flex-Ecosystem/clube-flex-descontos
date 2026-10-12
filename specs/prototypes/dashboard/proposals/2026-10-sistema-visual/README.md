# Proposta — sistema visual do dashboard

**Escopo:** dashboard interno (`apps/dashboard/`), com impacto nos fundamentos compartilhados  
**Estado:** Aprovado em 2026-10-11 — direção A ("Moldura navy"), conforme demonstrada no protótipo comparativo, incluindo o mapeamento de estados (§13) e o breadcrumb como retorno à listagem; logo (versão para fundo escuro) segue pendente. A direção B, recomendada nesta proposta, chegou a ser aprovada e aplicada no mesmo dia e foi substituída pela A por decisão do responsável; a recomendação (§19) permanece como registro da análise. Consolidado em [`ui-foundations.md`](../../../../apps/ui-foundations.md#fundamentos-do-dashboard), no [design system do dashboard](../../../../apps/dashboard/design-system/README.md) e no [protótipo do dashboard](../../index.html). Este documento permanece como registro da auditoria e das alternativas.  
**Data:** 2026-10-11  
**Protótipo comparativo:** [index.html](index.html). Ele mostra as telas Parceiros, Leads, Usuário e Fundamentos nas quatro variantes (Atual, A, B e C), nos modos alternar (teclas 1–4) e lado a lado. Uma vista pode ser compartilhada pelo hash, por exemplo `#mode=compare&screen=leads` ou `#dir=b&open=confirm`.

Este documento audita o sistema visual atual do dashboard e propõe sua
evolução. Ele não altera decisões aprovadas: até a aprovação explícita,
continuam vinculantes [`ui-foundations.md`](../../../../apps/ui-foundations.md),
[`dashboard/interface.md`](../../../../apps/dashboard/interface.md), o
[design system do dashboard](../../../../apps/dashboard/design-system/README.md)
e o [protótipo aprovado](../../index.html). Nenhum arquivo de `apps/` foi
alterado.

Fluxo ([processo de evolução da interface](../../../../ui-change-process.md)):

```text
auditoria → diagnóstico → 3 direções → comparação → recomendação
→ protótipo comparativo → validação visual → APROVAÇÃO   ← estamos aqui
→ ui-foundations.md → dashboard/interface.md e design-system → protótipo consolidado
→ tokens executáveis → primitives (shared/ui) → componentes de feature → validação
```

Todas as razões de contraste foram calculadas com a fórmula de luminância
relativa da WCAG 2.2. O protótipo comparativo recalcula os pares principais a
partir das variáveis de cada direção.

**Fontes auditadas:** `apps/dashboard/src/styles/tailwind.css`,
`apps/dashboard/src/shared/ui/*`, `shared/feedback/toast.tsx`,
`app/app-shell.tsx`, componentes de `modules/*`, o protótipo aprovado
`specs/prototypes/dashboard/index.html`, os fundamentos do catálogo aprovados
em 2026-10-11 e o ativo de referência `prototypes/catalog/assets/logo-parceiros-flex.png`.

---

## 1. Resumo executivo

O dashboard tem uma base funcional sólida: rótulos visíveis, erros associados
aos campos, Radix para foco e overlays, algarismos tabulares, uma única
família e escalas de espaçamento coerentes. Os problemas estão no **sistema
de cor e de superfície**, e não na estrutura das telas.

1. **O laranja significa coisas demais.** Ele representa ação primária, item
   ativo da navegação, foco, novo interesse, a etapa "Em negociação", link,
   avatar, marca de linha de tabela, ponto de timeline, chip selecionado,
   switch ligado, seleção de texto e scrollbar. Quando tudo é laranja, nada é
   prioritário: o usuário não consegue usar a cor para responder "o que
   precisa da minha atenção?".
2. **Existem três laranjas no dashboard** (`#cc4a0a`, `#d1500e`, `#f4651a`) e
   nenhum deles é o laranja da marca (`#FD5200`/`#FC5000`), que o catálogo já
   adotou. A identidade fica fragmentada justamente onde deveria ser comum.
3. **Os controles não têm contraste de limite.** A borda de inputs e selects
   tem 1,62:1 (o mínimo para componentes é 3:1), o foco sobre o canvas tem
   2,91:1, o halo de foco dos campos tem 1,17:1, o hover de linha tem 1,06:1
   e o item ativo da sidebar tem 1,18:1 contra o fundo. Os estados existem no
   código, mas são quase invisíveis.
4. **A materialidade "elevada" custa caro e não ajuda a tarefa.** São dez
   sombras para botões, inputs e cartões, além de gradiente na marca e
   sombra em todo cartão. Em telas densas, isso gera ruído e esconde a
   elevação real dos overlays.
5. **A sidebar navy escura é pesada para a navegação que ela carrega** (oito
   destinos) e é incompatível com o único logo de referência disponível, que
   tem a palavra navy e foi desenhado para fundo claro.

**Recomendação:** a **direção B — "Mesa clara, sinal de marca"**. Ela usa a
mesma foundation navy/laranja do catálogo, com HEX idênticos, e uma expressão
própria de ferramenta:

- sidebar tonal clara;
- laranja **somente** na ação principal e no sinal "precisa de você" (novo
  interesse e marcador de posição);
- navy para seleção e estrutura;
- superfícies planas, densidade por região e raios por função;
- duas sombras;
- Geist mantida, com Geist Mono para identificadores.

O dashboard vai de 57 tokens de cor para 37, e de 10 sombras para 2.

---

## 2. Papel do dashboard

| Pergunta | Resposta (a partir de `overview.md`, `requirements.md` e `interface.md`) |
| --- | --- |
| Quem usa? | **Vendedores**: leads próprios, uso diário e várias vezes ao dia. **Supervisora**: acompanha a operação, redistribui leads e administra usuários, permissões e auditoria. **Mantenedores do catálogo**: parceiros, planos e categorias, com uso semanal e em rajadas. |
| Para quais tarefas? | Localizar um lead e avançar sua etapa; registrar uma observação; atender um novo interesse; cadastrar e publicar parceiros (formulário longo); manter listas curtas (planos, categorias, origens); conceder permissões; consultar a auditoria. |
| Com que frequência? | Kanban e detalhe do lead: alta. Listagens administrativas: média. Formulário de parceiro: baixa, mas em sessões longas. Usuários e auditoria: baixa. |
| Informação de maior prioridade | Lead com **novo interesse pendente**; etapa e responsável do lead; estado de publicação do parceiro; erros de validação e de conflito. |
| Ações de maior risco | Excluir ou anonimizar lead (irreversível); desativar conta; revogar permissões; desativar ou excluir parceiro; mover lead para `converted` ou `lost`; sair de um formulário com alterações não salvas. |
| Telas de maior densidade | Kanban (5 colunas), auditoria (tabela paginada com 4 filtros), formulário de parceiro (5 seções com sub-tabelas), permissões (8 áreas e cerca de 25 caixas de seleção). |

**Consequência de design.** O sinal mais importante do produto não é uma
métrica, e sim *"este lead precisa de contato"*. A cor de marca deve ser
reservada para isso e para a ação principal. A estrutura (onde estou, o que
está selecionado) deve ser resolvida com navy, tipografia e superfície. Não
há home de métricas (`interface.md`: "Não haverá página inicial de métricas")
nem gráficos. Esta proposta **não cria** nenhum dos dois.

---

## 3. Diagnóstico do design system atual

| Aspecto | Situação | Efeito na interface |
| --- | --- | --- |
| Fonte de tokens | `tailwind.css` com 57 cores, 10 sombras e 5 raios nomeados por tamanho (`xs`…`xl`) | Os componentes escolhem raio e sombra por gosto, e não por função |
| Protótipo × app | Divergem: topbar 60 × 48px, conteúdo 1480 × 1600px, botão 34 × 36px, peso do botão 600 × 500, título 22/700 × 24/600, cartões sem sombra × `shadow-sm`, item ativo com texto laranja × branco, `border-strong` com valores trocados | A "fonte vinculante" não corresponde ao que o usuário vê |
| Literais no protótipo | `#fff`, `#aeb8c4`, `#9c1c31`, `#e6ecf0`, `#f3c3cb`, `#ffb48a`, `#d9a521`, chevron `%23646d67` (cinza esverdeado de outra paleta) | Violam a regra "sem valores literais" e mostram que a paleta não cobre os casos reais |
| Defeito no protótipo | `.diff .after` usa texto `#a53806` (laranja) sobre `success-soft` | O valor "novo" da auditoria aparece em laranja sobre verde |
| Família de componentes | Overlays coerentes (Radix), mas o toast é escuro, o menu é claro, o dialog não tem borda e o menu tem | Os overlays não parecem da mesma família |
| Cartões | `Card`, `ListCard` e `ListSkeleton` com `rounded-xl` + `shadow-sm`; detalhe com 4 a 6 cartões empilhados; "zona de perigo" como cartão com borda vermelha | Quase tudo é cartão; a hierarquia vem da moldura, e não do conteúdo |
| Fonte | `@import url(...)` no CSS, com pesos 400/500/600/700 (o 700 só aparece na marca "F") | Bloqueia a renderização e baixa um peso desnecessário |

---

## 4. Diagnóstico da paleta

| Token | Valor | H / S / L | Diagnóstico |
| --- | --- | --- | --- |
| `primary` | `#cc4a0a` | 20° / 91% / 42% | Terroso e distante do logo (`#FC5000`). É usado em seleção de texto, switch e skip link, mas **não** no botão primário. |
| `primary-raised` | `#d1500e` | 20° / 87% / 44% | É o que o botão realmente usa. Texto branco tem **4,32:1** e reprova AA para o rótulo de 13px/500. |
| `primary-hover` / `-active` / `-raised-hover` / `-edge` | 4 valores | — | Seis tokens para um botão. `primary-edge` existe só para a borda do relevo. |
| `accent` | `#f4651a` | 21° / 91% / 53% | Mesmo valor de `focus`. Branco sobre ele tem 3,12:1. É usado como marcador de nav, etapa, ponto de timeline e borda de "novo interesse". |
| `accent-foreground` | `#b23f07` | — | Praticamente igual a `primary-hover`. É usado em links, iniciais de linha e avatar de responsável. |
| `brand-gradient-*` | `#f2520c → #f68d36` | — | Existe só para o quadrado "F" da marca. É decoração. |
| `secondary` / `-hover` | `#e6ecf0` / `#d9e1e7` | — | Não é ação secundária: é o fundo da coluna do Kanban e do skeleton. `-hover` não é usado. |
| `neutral` / `neutral-soft` | `#3b4659` / `#eef2f6` | — | Existem só para o badge neutro; duplicam `muted-foreground`/`surface-muted`. |
| `on-dark-*` | 3 valores | — | Não são usados. |
| Semânticas (`success`, `warning`, `danger`, `info` e `*-soft`) | — | — | **Funcionam**: 5,3 a 5,7:1 sobre os fundos suaves. São compartilhadas com o catálogo e serão preservadas. |

**Uso fora de função.** A etapa "Em negociação" é laranja e colide com ação e
com novo interesse. "Perdido" é vermelho, mas é desfecho de negócio, e não
erro. "Rascunho" é âmbar (*warning*), mas rascunho não é alerta. As iniciais
da linha de parceiro são laranja e repetem a marca N vezes por tabela.

**O que falta:** limite de controle ≥ 3:1, cor de seleção de texto adequada,
tokens de scrollbar, placeholder, desabilitado sem opacidade, um par
"inverso" para tooltip e um papel explícito de "atenção" separado de "ação".

---

## 5. Diagnóstico dos neutros

Os neutros atuais não formam uma escala. São valores avulsos com matiz
oscilante: `#f5f7f8` (≈ 200°, esverdeado), `#f1f3f5`, `#f7f8f9`, `#cbd3dc` e
`#c4ccd5` (≈ 210°), e a sidebar `#071024` (≈ 222°).

| Problema | Medida |
| --- | --- |
| `surface-hover` (`#f7f8f9`) é **mais claro** que o canvas (`#f5f7f8`) | Hover de linha a 1,06:1 sobre branco, imperceptível |
| `border` (`#cbd3dc`) e `control-border` (`#c4ccd5`) são quase iguais | 1,04:1 entre si; os campos não se distinguem das divisórias |
| `control` (`#fdfdfe`) existe só para diferir do branco em 0,4% | Redundante |
| `muted` = `surface-muted` (`#f1f3f5`) | Duplicado |
| `border-strong` (`#8a95a6`, 3,03:1) é usado como trilho de switch e ponto de etapa | É o único neutro ≥ 3:1, mas fica fora dos campos |
| `muted-foreground` (`#566173`) tem 5,83:1 | Adequado; é usado 61 vezes, o que comprova que é o neutro mais importante do sistema |

O catálogo já possui uma escala navy coerente (`navy-50` a `navy-900`,
matiz ≈ 218°, ancorada no navy do logo). **Ela cobre todas as necessidades do
dashboard sem criar degraus novos** (ver §19).

---

## 6. Diagnóstico da sidebar

| Item | Atual | Diagnóstico |
| --- | --- | --- |
| Fundo | `#071024` (quase preto azulado) | É o maior bloco de cor da tela e carrega oito links: atrai o olhar periférico o dia inteiro. |
| Logo | Quadrado "F" com gradiente e relevo | Decorativo. O logo de referência (`Parceiros + Flex`) tem a palavra **navy**, que desaparece sobre navy escuro. Seria necessária uma versão invertida, que não existe (logo oficial pendente). |
| Selecionado | Fundo `#16213a` (**1,18:1** contra o fundo), texto semibold e barra laranja de 3px | Na prática, só a barra comunica a posição. No protótipo, o texto também fica laranja; no app, não. |
| Hover | `#0f1930` (1,08:1) | Imperceptível. |
| Rótulo de grupo | 12px, caixa alta, `sidebar-muted` 8,3:1 | Legível; a caixa alta com tracking compete com os itens. |
| Ícones | 20px (`size="lg"`) | Grandes para itens de 32px e um rótulo de 13px. |
| Rodapé | Avatar, nome, usuário e "Sair" (texto) | No protótipo são dois botões de ícone. Diverge. |
| Recolhida | Token existe (56px); protótipo implementa; app não | Lacuna de implementação, fora do escopo visual. |
| Scroll | `scrollbar-color: primary` | Thumb laranja sobre navy. |

**Conclusão:** a sidebar escura não é necessária para estruturar o
dashboard. Uma sidebar **tonal clara** separa a navegação pelo tom e pela
borda, deixa o item selecionado ser o elemento mais forte da coluna e
funciona com o logo existente.

---

## 7. Diagnóstico das superfícies

Hoje há canvas, `surface`, `surface-muted`, `surface-hover`, `control`,
`secondary` e `muted`: são **sete fundos para três funções** (canvas,
conteúdo e conteúdo atenuado). Ao mesmo tempo, faltam superfícies onde elas
importam:

- **Tudo é cartão com sombra.** Uma página de detalhe empilha 4 a 6 cartões
  `rounded-xl shadow-sm`, e a sombra de 1px não separa nada que a borda já
  não separe.
- **Overlays sem identidade de elevação.** Menu e cartões compartilham a
  mesma borda e o mesmo raio; a sombra é a única diferença, e ela é parecida
  com a do cartão.
- **Topbar translúcida** (`bg-surface/90 backdrop-blur`). Não há conteúdo
  colorido passando por baixo que justifique o efeito.
- **Zona de perigo como cartão vermelho.** O vermelho vira decoração
  permanente na lateral do detalhe, mesmo quando o usuário não vai agir.

---

## 8. Diagnóstico da tipografia

`Geist` é uma boa escolha para UI densa: altura-x generosa, algarismos
tabulares, desenho neutro e fonte variável. **O problema é a escala, e não a
família.**

| Papel | Atual | Diagnóstico |
| --- | --- | --- |
| Título de página | 24/32, 600, −0.025em | Salto grande para uma página que já tem breadcrumb; consome altura nas listagens. |
| Seção | 16/24, 600 | Fica perto do título de cartão (14/20) e do corpo (14/20). |
| Título de cartão | 14/20, 600 | Igual ao corpo em tamanho; diferencia-se só pelo peso. |
| Métrica | 28/32 | **Sem uso** (não há métricas aprovadas). |
| Corpo | 14/20 | Adequado. |
| Auxiliar e rótulo | 13/18 (`t-small` = `t-label`, mudando só o peso) | Dois tokens para o mesmo tamanho. |
| Botão | `t-label` 13/18, **500** | Mais fraco que o rótulo do campo ao lado (também 500); o protótipo usa 600. |
| Cabeçalho de tabela | 13/18, 500, muted | Do mesmo tamanho das células; a coluna não se ancora. |
| Monoespaçada | `font-mono` do sistema (Consolas/Menlo/SF Mono) | Aparência diferente em cada sistema operacional em slugs, usuários, cupons e códigos de ativação. |

---

## 9. Diagnóstico de densidade

| Região | Atual | Avaliação |
| --- | --- | --- |
| Linha de tabela | 48px em todas | Adequada para identificação em duas linhas (parceiros, usuários); excessiva para a auditoria (uma linha por evento, paginada). |
| Cabeçalho de tabela | 36px | Pode ser 32px. |
| Padding de célula | 16px | Adequado nas bordas; entre colunas, 12px bastam. |
| Controles | 36px (barras) e 40px (formulários) | Formulários a 40px no desktop deixam o de parceiro mais longo que o necessário. |
| Botões | 36px | Adequado. |
| Gap de formulário | 14–16px | Adequado. |
| Kanban | Coluna `minmax(212px,1fr)`, cartão com padding de 10–12px, rodapé com divisória | O cartão tem quatro faixas (nome, telefone, sinal e rodapé); a divisória interna é desnecessária. |
| Conteúdo | Padding de 32px (token) × 24px (design system) | Divergência. |

Classificação proposta:

| Densidade | Onde |
| --- | --- |
| **Confortável** | Acesso sem sessão, alterar senha, leitura de detalhe |
| **Padrão** | Formulários (página e sheet), dialogs, detalhe |
| **Compacta** | Tabelas, barras de filtro, Kanban, menus |

---

## 10. Diagnóstico de tabelas

| Item | Atual | Problema |
| --- | --- | --- |
| Moldura | Tabela dentro de `ListCard` com sombra | Correto conter a tabela; a sombra é desnecessária. |
| Cabeçalho | 13px muted, sem fundo, borda `border` | Pouca ancoragem: mesmo tamanho das células e a mesma divisória das linhas. |
| Zebra | Não há | **Correto**: manter assim. |
| Hover | 1,06:1 | Imperceptível. |
| Selecionado | Não existe | Correto: não há seleção múltipla nas especificações. |
| Identificação | Quadrado de iniciais com texto **laranja** + nome + slug | A cor da marca se repete em toda linha e o quadrado não acrescenta informação. |
| Números | `tnum` + alinhamento à direita | **Correto**. |
| Estado | Badge com ponto | Correto; o mapeamento de cores precisa de famílias (§13). |
| Ações | Menu `⋯` *quiet* | Correto: não compete com os dados. |
| Vazio | Texto centralizado na célula | Correto. Falta distinguir "nenhum cadastro" de "nenhum resultado para o filtro". |
| Carregando | `ListSkeleton` como cartão próprio, fora da tabela | Muda a moldura ao carregar; deveria preservar o cabeçalho e a barra. |
| Ordenação | Fixa (alfabética) | Correta; o rodapé "Ordem alfabética · sem paginação" é metadado de implementação exibido ao usuário. |
| Filtros | Segmentado com contagens + busca, na mesma barra | **Bom padrão**: manter. |
| Paginação (auditoria) | Botões ‹ › + "Página 1 de 13" | Adequada. |

---

## 11. Diagnóstico de formulários

| Item | Atual | Problema |
| --- | --- | --- |
| Rótulo | Visível, 13/18, 500 | Correto. |
| Borda do campo | `#c4ccd5`, **1,62:1** | Reprova o contraste de componente (1.4.11): o campo não se distingue da divisória. |
| Fundo | `control` `#fdfdfe` + `shadow-control-inset` | Relevo interno sem função. |
| Foco | `focus:` (não `focus-visible`), borda laranja (3,12:1) + halo de 14% (**1,17:1**) | Na prática, o foco é 1px laranja. |
| Erro | Borda `danger` + texto `danger` | O `FieldFrame` reserva espaço para ícone, mas **não renderiza ícone** (o design system exige "texto e ícone"). |
| Somente leitura | `surface-muted` + texto **muted** | Dado real exibido como se estivesse desabilitado. |
| Desabilitado | `opacity-60` | Reduz também o rótulo e o texto, sem estado próprio. |
| Opcional | "(opcional)" muted | Correto: o padrão marca o opcional, não o obrigatório. |
| Switch | Ligado = `primary` laranja | Seleção pintada com a cor de ação. |
| Chip | Pressionado = `accent-soft` + borda laranja | Idem. |
| Checkbox | `accent-color: primary` (protótipo) | Idem. |
| Placeholder | Cor padrão do browser | Sem token. |

---

## 12. Diagnóstico de ações

**Hierarquia atual:** `primary`, `secondary`, `quiet`, `danger`,
`danger-quiet` e `sidebar`. A estrutura é boa, mas:

- `primary` com rótulo branco sobre `#d1500e` tem **4,32:1**, abaixo de AA
  para o rótulo de 13px;
- o relevo (`brand-raised`, `control-raised`, `pressed`) soma 7 sombras só
  para botões;
- `disabled:opacity-60` também aplica ao botão primário, que vira um laranja
  pálido ainda "chamativo";
- `sidebar` é uma variante de botão que existe só por causa da sidebar
  escura;
- no detalhe do lead (protótipo), "Editar dados" e "Alterar etapa" (primário)
  aparecem no cabeçalho; no rodapé da sidebar de resumo do parceiro, há
  "Salvar" primário **e** "Salvar" primário no cabeçalho: **duas ações
  primárias idênticas na mesma tela**.

**Ações destrutivas:** a zona de perigo é um cartão com borda vermelha, título
vermelho e botão `danger-quiet`. A confirmação (`ConfirmDialog`) está
correta no comportamento (Alert Dialog, sem fechamento acidental), e
visualmente é um dialog neutro com botão vermelho, o que é adequado.

---

## 13. Diagnóstico de estados

### Estados de negócio (badges)

| Estado | Atual | Família proposta |
| --- | --- | --- |
| Publicado · Ativa · Ativada · Convertido | `success` | **success** |
| Rascunho | `warning` | **info**: estado transitório, não um alerta |
| Aguardando ativação | `info` | **info** |
| Desativado · Inativa | `neutral` | **neutral** |
| Perdido | `danger` | **neutral** com ícone ✕: desfecho de negócio, não erro |
| Novo interesse | `accent` (laranja) | **attention**: é o único sinal "precisa de você" |
| Erro · falha | `danger` | **danger** |
| Conflito de versão · não salvo | `warning` | **warning** |
| Protegida · Destaque | `outline` com ícone | **tag** neutra (metadado, não estado) |

Resultado: **cinco famílias** (`success`, `info`, `neutral`, `warning`,
`danger`) mais **uma família de marca** (`attention`). Etapas do Kanban não
ganham cor própria: as etapas abertas são neutras e somente os desfechos
usam família.

### Estados interativos

| Estado | Atual | Problema |
| --- | --- | --- |
| Hover | 1,06–1,08:1 em linha, menu e sidebar | Imperceptível |
| Ativo/pressionado | Sombra interna | Depende do relevo |
| Selecionado | Laranja (nav, chip, switch) | Colide com ação |
| Foco | Laranja 2px a 2,91:1 sobre o canvas; campos com 1,17:1 | Abaixo de 3:1 |
| Desabilitado | Opacidade de 60% | Perde também o texto |
| Carregando | Spinner + `aria-busy` | Correto; o rótulo deve permanecer ("Salvando…") |
| Expandido | Menu `⋯` sem estado visual de aberto | Falta `aria-expanded` com tom de pressionado |
| Destrutivo | `danger-quiet` e `danger` | Correto, mas com a zona vermelha permanente |

### Estados assíncronos

Skeleton (estrutural), spinner em botão (mutação), `Alert` persistente (erro
de região) e toast (sucesso) estão **coerentes com a especificação**. Lacunas:

- o skeleton não preserva a moldura da tabela;
- falta um estado "atualizando em segundo plano", discreto, para o refetch ao
  voltar à aba;
- o toast escuro com ícone laranja comunica "marca", e não "sucesso".

---

## 14. Diagnóstico dos estados do browser

| Estado | Atual | Problema |
| --- | --- | --- |
| Seleção | `primary` + branco | Bloco laranja saturado ao copiar telefone ou código: chamativo demais. |
| Scrollbar | `* { scrollbar-color: primary transparent }` | Thumb laranja permanente na página, na sidebar, no Kanban, nas tabelas e nos sheets. No Chromium ≥ 121, `scrollbar-color` também anula `::-webkit-scrollbar`, sem controle de espessura. |
| Focus-visible | 2px `#f4651a`, offset 2px | 2,91:1 sobre o canvas e 3,12:1 sobre branco; sobre a sidebar escura funciona (6,06:1). |
| Caret | Padrão | Sem decisão. |
| Placeholder | Padrão | Sem token. |
| Autofill | Padrão do Chrome (azul) | Destoa no login. |

---

## 15. Tokens redundantes (remover)

`muted` (= `surface-muted`) · `control` (≈ `surface`) · `surface-hover`
(mais claro que o canvas) · `secondary` e `secondary-hover` (não são ação) ·
`primary-raised`, `primary-raised-hover` e `primary-edge` · `danger-raised` e
`danger-edge` · `accent` (= `focus`) · `accent-soft` e `accent-subtle`
(substituídos por `attention-soft`) · `brand-gradient-from`/`-to` ·
`neutral` e `neutral-soft` · `sidebar-active` e `sidebar-border` ·
`on-dark-success`/`-danger`/`-info` (sem uso) · `focus-ring` e `danger-ring`
(halos invisíveis) · `--text-metric-*` (sem uso) · `--text-small` (= label) ·
`--brand-skew` (sem uso) · `--font-display` (= `font-body`) · `shadow-sm`,
`control-inset`, `control-raised`, `control-raised-hover`, `control-pressed`,
`brand-raised`, `brand-raised-hover`, `brand-pressed`, `md`, `lg` (dez →
duas) · raios `xs`, `sm`, `md`, `lg` e `xl` (por tamanho → por função).

## 16. Tokens ausentes (criar)

`foreground-soft` · `placeholder` · `control-border-hover` com contraste real ·
`selected` / `selected-foreground` · `signal` (marcador não textual da marca) ·
`attention-soft` / `attention-foreground` · `inverse` /
`inverse-foreground` (tooltip) · `selection` / `selection-foreground` ·
`scrollbar-thumb` / `scrollbar-thumb-hover` · `radius-badge`,
`radius-control`, `radius-card` e `radius-overlay` · `shadow-floating` e
`shadow-overlay` · `row-compact` e `row-default` · `table-header` ·
`--font-mono`.

---

## 17. Três direções visuais

As três partem da **mesma foundation de marca do catálogo** (escalas navy e
laranja, com HEX idênticos) e das **mesmas cores semânticas de estado**.
Elas diferem na estratégia.

### Foundation de marca (comum às três)

| Navy | HEX | Função | Laranja | HEX | Função |
| --- | --- | --- | --- | --- | --- |
| `navy-50` | `#FAFBFD` | canvas | `orange-50` | `#FFF6F0` | fundo de atenção |
| `navy-100` | `#EEF2F7` | superfície atenuada, hover | `orange-100` | `#FFE9DB` | — |
| `navy-200` | `#DCE2EC` | borda decorativa | `orange-200` | `#FFCFB2` | seleção de texto |
| `navy-300` | `#B4BFD0` | borda forte | `orange-400` | `#FF6B1F` | hover da ação |
| `navy-400` | `#7A879E` | limite de controle, scrollbar | `orange-500` | `#FD5200` | ação primária |
| `navy-500` | `#5E6A82` | placeholder, desabilitado | `orange-600` | `#EA4B00` | ação pressionada, foco, sinal |
| `navy-600` | `#4A5670` | metadado | `orange-700` | `#B83A00` | texto de atenção |
| `navy-700` | `#333F59` | texto de apoio | | | |
| `navy-800` | `#18284A` | — | | | |
| `navy-900` | `#04173A` | texto principal, seleção | | | |

Estado (inalterados): `success #157347` / `#E7F6EE`, `warning #8A5A00` /
`#FDF3D7`, `danger #B4233A` / `#FDECEE` (hover `#9C1C31`), `info #1F56C4` /
`#E8EFFC`.

---

### Direção A — "Moldura navy" *(brand-led navigation)*

**Estratégia:** evoluir o sistema atual sem mudar sua natureza. A marca
estrutura a tela por uma moldura navy escura; o laranja continua sendo ação
e posição. Ela corrige contraste, redundância e materialidade, mas preserva o
contraste "moldura escura, conteúdo claro".

| Grupo | Decisão |
| --- | --- |
| Canvas / surface / muted | `navy-50` / `#FFF` / `navy-100` |
| Sidebar | `navy-900`; hover `navy-800`; selecionado `navy-700` (1,68:1) com texto `#FFF`, marcador `orange-400` e ícone laranja; texto `navy-100`; rótulos `navy-300` (9,51:1) |
| Ação primária | `orange-500` preenchido com rótulo `navy-900` (5,37:1) |
| Seleção (chip, switch, segmentado) | Laranja suave (`orange-50` + borda `orange-500`) |
| Bordas | `border navy-200`, `control-border navy-400` (3,63:1) |
| Tipografia | **Archivo** (família do catálogo): UI em `wdth 100`; título de página em `wdth 110`, 650 |
| Raios | controle 8 · cartão 12 · overlay 12 · badge 6 |
| Elevação | Cartões só com borda; `shadow-floating` e `shadow-overlay` |
| Densidade | Padrão em todo lugar (linha de 48px, controle de 36px) |
| Foco | `orange-600` no claro (3,81:1) e `orange-400` na sidebar (6,20:1) |
| Toast / tooltip | Inversos (`navy-900`) |
| Seleção / scrollbar | `orange-200` + `navy-900` / thumb `navy-400`; na sidebar, `navy-700` |

**Trade-offs.** Maior reconhecimento de marca e menor migração. Por outro
lado, mantém o maior bloco de cor da tela na navegação, exige logo invertido
(inexistente) e dois tokens de foco, e o laranja continua dividindo ação com
posição e seleção. Archivo deixa a UI cerca de 6% mais larga em 13–14px.

**Consolidação (após a aprovação da A).** Onde esta tabela resume e o protótipo comparativo detalha, vale o protótipo, que é a fonte visual: checkbox, switch e filtro alternado pressionado usam laranja preenchido (`orange-600` com marca navy); somente o chip usa laranja suave; o segmentado permanece neutro. Também vêm do protótipo: quadrado de iniciais para entidades, avatar laranja suave para pessoas, barra de filtros dos leads em painel, divisória no rodapé do cartão do Kanban, cartões independentes nas páginas de detalhe, cabeçalho de tabela com base `navy-200`, nomes em 600, raio de 10px em menu, toast e cartão do Kanban, overlay a 45% e margem de conteúdo de 28px. Os tokens consolidados estão em [`ui-foundations.md`](../../../../apps/ui-foundations.md#fundamentos-do-dashboard).

---

### Direção B — "Mesa clara, sinal de marca" *(neutral workspace)* — **recomendada**

**Estratégia:** o dashboard é uma mesa de trabalho clara e estável. **Navy
é a estrutura** (texto, seleção, limites). **Laranja é o sinal**: aparece
somente onde o usuário deve agir (o botão principal da região e o "novo
interesse") e onde ele está (o marcador da navegação). A identidade vem da
foundation compartilhada e da disciplina de uso, e não da quantidade de
cor.

#### Color foundation

A foundation comum acima, sem degraus novos.

#### Semantic tokens

| Token | Valor | Responsabilidade |
| --- | --- | --- |
| `background` | `navy-50` | canvas |
| `surface` | `#FFFFFF` | tabelas, painéis, controles, overlays |
| `surface-muted` | `navy-100` | trilho de segmentado, somente leitura, hover de linha e menu, coluna de Kanban, skeleton |
| `foreground` | `navy-900` | texto principal (17,06:1) |
| `foreground-soft` | `navy-700` | células secundárias, itens da sidebar (10,52:1) |
| `muted-foreground` | `navy-600` | metadado, cabeçalho de tabela, hint (7,35:1) |
| `placeholder` | `navy-500` | placeholder, texto desabilitado (5,44:1) |
| `border` | `navy-200` | divisórias e moldura (decorativa) |
| `border-strong` | `navy-300` | botão secundário, base do cabeçalho de tabela, hover de cartão |
| `control-border` | `navy-400` | limite de campos, select e checkbox (3,63:1) |
| `control-border-hover` | `navy-500` | hover de campo |
| `primary` | `orange-500` | ação principal (uma por região) |
| `primary-hover` / `primary-active` | `orange-400` / `orange-600` | estados |
| `primary-foreground` | `navy-900` | rótulo sobre a ação (5,37 · 6,20 · 4,63:1) |
| `selected` / `selected-foreground` | `navy-900` / `#FFF` | checkbox, switch, chip pressionado, página atual |
| `signal` | `orange-600` | marcador da nav, ponto de novo interesse (3,39:1 sobre `navy-100`) |
| `attention-soft` / `attention-foreground` | `orange-50` / `orange-700` | badge e rótulo "Novo interesse" (5,41:1) |
| `sidebar` | `navy-100` | trilho de navegação |
| `sidebar-hover` | `navy-200` | hover de item |
| `sidebar-selected` | `#FFF` (+ borda `border`) | item atual |
| `sidebar-foreground` / `sidebar-muted` | `navy-700` / `navy-600` | item / rótulo de grupo e usuário |
| `success`, `warning`, `danger`, `info` + `*-soft` | inalterados | estados |
| `danger-hover` | `#9C1C31` | hover do botão destrutivo |
| `inverse` / `inverse-foreground` | `navy-900` / `navy-50` | tooltip |
| `focus` | `orange-600` | anel de foco (3,81 · 3,68 · 3,39:1) |
| `overlay` | `rgb(4 23 58 / .40)` | backdrop |
| `selection` / `selection-foreground` | `orange-200` / `navy-900` | seleção de texto (12,47:1) |
| `scrollbar-thumb` / `scrollbar-thumb-hover` | `navy-400` / `navy-600` | scrollbar |

São 37 tokens de cor (eram 57).

#### Typography

**Geist** (UI) + **Geist Mono** (identificadores), pesos 400, 500 e 600 e
Mono 400. Escala em §20.

#### Surface model

| Camada | Valor | Uso |
| --- | --- | --- |
| Canvas | `background` | fundo da área de trabalho |
| Surface | `surface` + `border` | tabela, painel de detalhe, formulário, cartão de Kanban |
| Muted | `surface-muted` | coluna do Kanban, trilho do segmentado, campos somente leitura, hover |
| Elevated | `surface` + `border` + `shadow-floating` | menu, popover, toast, cartão sendo arrastado |
| Overlay | `surface` + `shadow-overlay` sobre `overlay` | dialog, sheet |
| Sidebar | `sidebar` + borda direita `border` | navegação |

#### Component impact

| Componente | Mudança |
| --- | --- |
| Sidebar | Tonal clara, logo na versão para fundo claro, itens de 32px com ícone de 16px, selecionado como "folha branca" com borda, texto 600 e marcador `signal` de 2px; rótulos de grupo de 11/16 em caixa alta discreta; rodapé com avatar neutro e botões de ícone |
| Header | 48px, branco, borda inferior, sem blur; breadcrumb com o nível anterior como link (substitui o "← Voltar" acima do título) |
| Page header | Título de 20/28, descrição de 13/18 em uma linha, ação primária à direita, sem cartão |
| Button | Raio de 6, 13/18 600, plano; primário laranja com rótulo navy; secundário branco com `border-strong`; ghost; `danger-secondary` (entrada de ação destrutiva); `danger` (somente dentro da confirmação) |
| Input / Select | 36px, raio 6, `control-border` (3,63:1), foco com borda e anel de 1px `focus`; erro com borda, ícone e texto; somente leitura legível |
| Table | Moldura com borda de raio 8 e sem sombra; cabeçalho de 32px em 12/16 500 com base `border-strong`; linhas de 44px (padrão) ou 36px (auditoria); hover `surface-muted`; sem quadrado de iniciais em entidades que não são pessoas |
| Card | Usado só quando agrupa conteúdo independente; detalhe vira painel único com seções separadas por divisória |
| Badge | Raio 4, 20px, 12/16 500, ponto apenas em estado; tag neutra para metadado |
| Dialog | Raio 12, `shadow-overlay`, título neutro; destrutivo com ícone `danger` de 20px ao lado do título e consequência no corpo |
| Dropdown | Raio 8, borda + `shadow-floating`; item de 32px; destaque por teclado em `surface-muted` + texto `foreground`; item destrutivo em `danger` |
| Toast | Claro (mesma família do menu), ícone de estado colorido, raio 8 |
| Empty state | Dentro da região que ficou vazia, sem caixa tracejada; ícone de 20px, título, explicação e ação permitida (secundária quando a página já tem a primária) |

#### States

| Estado | Tratamento |
| --- | --- |
| Hover | `surface-muted` em linhas, menus e ghost; `navy-50` em botão secundário; borda `control-border-hover` em campos |
| Selecionado | `selected` (navy) |
| Foco | `outline: 2px solid focus; offset 2px`; campos com borda `focus` + anel de 1px |
| Desabilitado | Fundo `surface-muted`, texto `placeholder`, borda `border`, sem opacidade |
| Perigo | `danger` no texto ou no preenchimento apenas no ponto de decisão |
| Sucesso | Badge `success`; toast com ícone `success` |
| Carregando | Spinner de 14px no lugar do ícone, rótulo mantido ("Salvando…"), largura preservada; skeleton dentro da moldura da tabela |

#### Browser chrome

Seleção `orange-200`/`navy-900`; scrollbar com thumb de 6px `navy-400`,
calha transparente e hover `navy-600`; foco `orange-600` 2px (ver §26).

#### Trade-offs

| Critério | Avaliação |
| --- | --- |
| Usabilidade | ★★★★★ O laranja volta a significar "aja aqui"; o selecionado é inequívoco |
| Densidade | ★★★★☆ Densidade por região; tabelas mais compactas sem apertar formulários |
| Acessibilidade | ★★★★★ Todos os pares ≥ 4,5:1 (texto) e ≥ 3:1 (limites e foco) |
| Reconhecimento de marca | ★★★★☆ Foundation idêntica à do catálogo, logo legível; menos cor de marca em área |
| Manutenção | ★★★★★ 37 cores, 2 sombras, 4 raios; foundation compartilhada |
| Qualidade visual | ★★★★☆ Calma e precisa; depende da execução tipográfica |

---

### Direção C — "Alta clareza operacional" *(high-clarity, flat)*

**Estratégia:** máxima legibilidade e densidade, sem cartões. As seções
são separadas apenas por divisórias e espaço, os neutros são **quentes**
(*stone*) para harmonizar com o laranja, e a ação usa um **laranja escuro
com rótulo branco**. A identidade se apoia na tipografia (IBM Plex, mais
técnica) e na ausência de ornamento.

| Grupo | Decisão |
| --- | --- |
| Neutros | Escala *stone* própria do dashboard: `#FAFAF9`, `#F5F5F4`, `#E7E5E4`, `#D6D3D1`, `#8A8580` (controle, 3,65:1), `#57534E` (metadado, 7,63:1), `#1C1917` (texto, 16,74:1) |
| Sidebar | Branca, borda direita; selecionado com fundo `#F5F5F4` e texto 600 em `#1C1917`, sem marcador |
| Ação primária | `orange-700` `#B83A00` com rótulo branco (5,76:1) |
| Seleção | Ink `#1C1917` |
| Superfícies | Sem cartões: seções com título e divisória; tabelas sem moldura |
| Badges | Contorno de 1px na cor do estado, sem fundo |
| Tipografia | **IBM Plex Sans** + **IBM Plex Mono** |
| Raios | controle 4 · overlay 6 · badge 2 |
| Densidade | Compacta em tudo (linha de 36px, controle de 32px) |
| Foco | `orange-700` 2px |

**Trade-offs.** É a mais densa e a mais "ferramenta". Porém, cria uma
segunda escala de neutros (divergindo do catálogo sem ganho funcional
mensurável), afasta a marca (o navy desaparece; o laranja escuro fica
terroso, o mesmo problema que o catálogo acabou de corrigir), deixa o
formulário de parceiro, que é longo e pouco frequente, apertado demais e
troca a família inteira.

---

## 18. Comparação objetiva

| Critério (peso) | Atual | A — Moldura navy | **B — Mesa clara** | C — Alta clareza |
| --- | --- | --- | --- | --- |
| Uso diário: o sinal "precisa de você" é inequívoco (3) | 1 | 3 | **5** | 4 |
| Densidade adequada por tarefa (2) | 3 | 3 | **5** | 4 |
| Conclusão de tarefa: ação e seleção distinguíveis (3) | 2 | 3 | **5** | 4 |
| Prevenção de erro: destrutivo distinto, foco visível (3) | 2 | 4 | **5** | 4 |
| Acessibilidade: contraste de limites e foco (3) | 1 | 4 | **5** | 5 |
| Marca: coerência com o catálogo e com o logo (2) | 2 | 4 | **4** | 2 |
| Manutenção: número de tokens, compartilhamento (2) | 1 | 4 | **5** | 3 |
| Escalabilidade: novos módulos sem novas cores (2) | 2 | 3 | **5** | 4 |
| Custo de migração (1) | 5 | 4 | 3 | 1 |
| **Total ponderado (de 105)** | 39 | 74 | **101** | 78 |

---

## 19. Recomendação

**Direção B — "Mesa clara, sinal de marca".**

- **Uso diário.** O vendedor abre o Kanban várias vezes ao dia. Na B, a única
  cor quente nas colunas é o "Novo interesse", o que torna a tarefa "quem eu
  contato agora?" uma leitura de 1 segundo. No sistema atual, o mesmo laranja
  aparece em "Em negociação", nos avatares e nos links.
- **Densidade.** Linhas de 44px nas listagens e de 36px na auditoria,
  controles de 36px nos formulários e cartões de Kanban sem divisória interna.
  A tela ganha cerca de 15% de conteúdo visível sem apertar as tarefas de
  edição.
- **Conclusão de tarefa.** Ação (laranja) e seleção (navy) deixam de
  disputar a mesma cor. Há no máximo um primário por região; o resumo do
  parceiro deixa de repetir "Salvar".
- **Prevenção de erro.** Limites de campo a 3,63:1, foco a ≥ 3,39:1 em todas
  as superfícies e desabilitado sem opacidade. O destrutivo aparece em
  vermelho somente no ponto de decisão (botão `danger-secondary` e dialog com
  `danger`), e não como painel permanente.
- **Acessibilidade.** Todos os pares de texto ≥ 4,5:1 e todos os pares não
  textuais ≥ 3:1, conforme a tabela do protótipo. O estado nunca depende só
  da cor (ponto + texto, ícone no erro, peso e borda no selecionado).
- **Marca.** O dashboard passa a usar **exatamente** o navy e o laranja do
  catálogo e do logo. A marca sobrevive pela coerência e pela escassez: o
  laranja vira sinal, como no catálogo ("laranja preenchido significa ação").
- **Manutenção e escalabilidade.** As escalas são as do catálogo, os papéis
  semânticos usam os mesmos nomes e um módulo novo (por exemplo, um futuro
  cadastro de assinantes) não precisa de cor nova: só de famílias existentes.

**Por que não a A?** Ela é o melhor caminho de baixa migração, mas mantém a
navegação como o elemento mais pesado da tela, depende de um logo invertido
inexistente e precisa de tokens duplicados para superfícies escuras.

**Por que não a C?** Os ganhos de densidade da C são alcançáveis dentro da B
pelas regiões compactas. Os custos (segunda escala de neutros, troca de
família, laranja terroso e afastamento do catálogo) não se pagam.

**Por que a ação não é navy ("ink")?** Isso foi avaliado. Um botão primário
navy fica igual ao estado selecionado (checkbox, chip e paginação em navy) e
rompe a regra compartilhada do ecossistema ("laranja preenchido = ação").
Rótulo navy sobre `orange-500` tem 5,37:1 e resolve o contraste que motivava
o laranja escurecido.

---

## 20. Tipografia recomendada

### Alternativas avaliadas

| | T1 — Geist + Geist Mono *(recomendada)* | T2 — Archivo (família do catálogo) | T3 — IBM Plex Sans + Plex Mono |
| --- | --- | --- | --- |
| UI | Geist 400/500/600 | Archivo `wdth 100`, 400/500/600 | Plex Sans 400/500/600 |
| Display | Não (o título usa Geist 600) | Archivo `wdth 110` no título | Não |
| Mono | Geist Mono 400 | Sistema | Plex Mono 400 |
| Vantagens | Já carregada; desenhada para UI de 12–14px; `tnum` nativo; Mono da mesma superfamília (métricas e ritmo iguais) | Uma família para todo o ecossistema; reconhecimento de marca | Personalidade técnica; Sans e Mono muito coerentes; excelente em dados |
| Riscos | Neutra; a personalidade precisa vir de cor e composição | ~6% mais larga em 13px; o eixo `wdth` traz voz de campanha a uma ferramenta; arquivo variável maior | Troca total; mais larga que Geist; sem relação com a marca |
| Performance | 1 família variável (≈ 30 kB woff2 latin) + Mono com um peso (≈ 20 kB) | Variável com 2 eixos (≈ 60–70 kB) | 3 pesos estáticos + 1 Mono (≈ 4 arquivos) |

**Uma família ou duas?** Uma família de texto (Geist). A **Geist Mono** não
é uma "segunda voz", mas um papel funcional: slugs, nomes de usuário,
cupons e códigos de ativação (`7K4M-92QD-R8WX-3HNB`) precisam de glifos
inequívocos (0/O, 1/l/I) e de aparência idêntica em todos os sistemas.
Nenhuma fonte display: o título de página não precisa de outra família para
criar hierarquia.

### Carregamento

O dashboard é uma SPA Vite; o equivalente ao `BaseLayout` é
`apps/dashboard/index.html`. O `@import url(...)` sai de `tailwind.css`.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Geist+Mono:wght@400&display=swap">
```

### Escala (produto operacional)

| Papel | Tamanho / linha | Peso | Tracking | Uso |
| --- | --- | --- | --- | --- |
| `page-title` | 20 / 28 | 600 | −0.01em | h1 da página |
| `section-title` | 15 / 20 | 600 | −0.005em | seção de painel, título de dialog/sheet |
| `heading` | 13 / 18 | 600 | 0 | coluna do Kanban, área de permissão, subgrupo |
| `body` | 14 / 20 | 400 | 0 | texto e células |
| `body-small` | 13 / 18 | 400 | 0 | metadado, hint, descrição |
| `label` | 13 / 18 | 500 | 0 | rótulo de campo, item de nav |
| `button` | 13 / 18 | 600 | 0 | botões, segmentado |
| `table-header` | 12 / 16 | 500 | 0.01em | cabeçalho de tabela |
| `caption` | 12 / 16 | 500 | 0 | data, rodapé, badge |
| `overline` | 11 / 16 | 600 | 0.06em, caixa alta | rótulo de grupo da sidebar (único uso) |
| `numeric` | herda o tamanho, `tnum`, 500 quando enfatizado | — | — | contagens, telefones, valores |
| `mono` | 13 / 18 (16 / 24 em código emitido) | 400 | 0 (0.08em em código) | slug, usuário, cupom, código |

Os saltos são 20 → 15 → 13/14, contidos, mas com hierarquia clara porque
peso e cor também mudam.

---

## 21. Semantic tokens recomendados

Os tokens são os da direção B (§17). No Tailwind, ficam expostos como
utilidades semânticas, por exemplo:

```text
bg-background bg-surface bg-surface-muted
text-foreground text-foreground-soft text-muted-foreground placeholder:text-placeholder
border-border border-border-strong border-control-border hover:border-control-border-hover
bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground
bg-selected text-selected-foreground
bg-signal bg-attention-soft text-attention-foreground
bg-sidebar hover:bg-sidebar-hover bg-sidebar-selected text-sidebar-foreground text-sidebar-muted
text-danger bg-danger hover:bg-danger-hover bg-danger-soft (idem success, warning, info)
bg-inverse text-inverse-foreground
outline-focus ring-focus
rounded-badge rounded-control rounded-card rounded-overlay
shadow-floating shadow-overlay
h-control-sm h-control-md h-control-lg h-row-compact h-row-default
font-sans font-mono
```

Foundation (`navy-*`, `orange-*`) **não** é exposta para uso direto em
componentes: ela alimenta apenas os papéis.

## 22. Surface model

Ver a tabela "Surface model" da direção B (§17). Regra adicional: **cartão
dentro de cartão é proibido**. Um painel pode conter seções separadas por
divisória, mas não outro painel com borda.

## 23. Radius model

| Token | Valor | Uso |
| --- | --- | --- |
| `radius-badge` | 4px | badge, tag, tooltip, item de menu |
| `radius-control` | 6px | botão, campo, select, segmentado, item de nav, cartão de Kanban |
| `radius-card` | 8px | moldura de tabela, painel, alerta, coluna de Kanban, menu, popover, toast |
| `radius-overlay` | 12px | dialog |
| `radius-pill` | 999px | avatar, trilho do switch, contador |

O sheet lateral não tem raio, porque está ancorado à borda da tela.

## 24. Elevation model

| Token | Valor | Uso |
| --- | --- | --- |
| `shadow-floating` | `0 1px 2px rgb(4 23 58 / .06), 0 6px 16px rgb(4 23 58 / .10)` | menu, popover, toast, cartão sendo arrastado |
| `shadow-overlay` | `0 2px 6px rgb(4 23 58 / .08), 0 24px 48px rgb(4 23 58 / .18)` | dialog, sheet |

Nenhuma sombra em cartões, tabelas, botões ou campos. Pressionado é
resolvido por cor (`primary-active`, `navy-100`), e não por sombra interna.
**Esta é uma mudança de decisão aprovada:** `ui-foundations.md` define hoje a
"linguagem elevada" para controles.

## 25. Density guidelines

| Token | Valor | Região |
| --- | --- | --- |
| `control-sm` | 32px | barras de filtro, ações de linha, sub-tabelas, paginação |
| `control-md` | 36px | formulários (página, sheet e dialog), cabeçalho de página |
| `control-lg` | 40px | acesso sem sessão |
| `touch` | 44px | mínimo de qualquer alvo em `pointer: coarse` |
| `row-default` | 44px | listagens com identificação em duas linhas |
| `row-compact` | 36px | auditoria e listas de uma linha |
| `table-header` | 32px | cabeçalho |
| Padding de célula | 16px nas bordas e 12px entre colunas | |
| Gap de campos | 16px horizontal, 16px vertical; 24px entre seções | |
| Largura de formulário | Até 720px na coluna principal; campos curtos (cupom, percentual) com largura de conteúdo | |
| Conteúdo | Padding de 24px no desktop e 16px no celular; máximo de 1600px | |

## 26. Scrollbar, seleção e foco

```css
/* Seleção: tom de marca leve, sem bloco saturado. */
::selection      { background: var(--color-selection); color: var(--color-selection-foreground); }
::-moz-selection { background: var(--color-selection); color: var(--color-selection-foreground); }

/* WebKit/Blink: calha de 10px, thumb visível de 6px. */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar-thumb);
  border: 2px solid transparent; background-clip: padding-box;
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover { background-color: var(--color-scrollbar-thumb-hover); }

/* Firefox: só onde não há pseudo-elementos WebKit (no Chromium ≥ 121,
   scrollbar-color anularia o bloco acima). */
@supports not selector(::-webkit-scrollbar) {
  * { scrollbar-color: var(--color-scrollbar-thumb) transparent; scrollbar-width: thin; }
}

:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
input, textarea { caret-color: var(--color-focus); }
::placeholder { color: var(--color-placeholder); opacity: 1; }
input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px var(--color-surface-muted) inset; -webkit-text-fill-color: var(--color-foreground); }
```

| Contexto | Decisão |
| --- | --- |
| Documento | Thumb `navy-400` (3,63:1 sobre branco); a discrição vem da espessura (6px) |
| Tabela e Kanban (horizontal) | A mesma; a rolagem horizontal do Kanban precisa ser percebida |
| Sidebar | A mesma (3,23:1 sobre `navy-100`); só aparece quando a lista excede a altura |
| Dialog/sheet | A mesma, dentro do corpo rolável; cabeçalho e rodapé fixos |
| Scrollbars overlay (macOS) | Não alteradas |
| Foco | 2px + offset de 2px (a densidade não comporta 3px sem invadir vizinhos); 3,81:1 sobre branco, 3,68:1 sobre o canvas e 3,39:1 sobre a sidebar; o mesmo token em todo o app, porque não há superfície escura |
| Campos | `:focus-visible` com borda `focus` + anel de 1px (2px de laranja no total); erro mantém a borda `danger` e recebe anel `focus` |

Sem JavaScript e sem biblioteca de scrollbar.

## 27. Relação entre catálogo e dashboard

| Compartilhado com o catálogo | Próprio do dashboard |
| --- | --- |
| Logo e regras de uso | Sidebar tonal clara e marcador `signal` |
| Escalas `navy-*` e `orange-*` (HEX idênticos) | Mapeamento das superfícies (sem bandas, sem palco, sem Flex Card) |
| Nomes e significados dos papéis semânticos | Família `attention` ("precisa de você") |
| "Laranja preenchido = ação"; rótulo navy sobre laranja | Seleção em navy (checkbox, switch, chip, página) |
| Cores de estado (`success`, `warning`, `danger`, `info`) | Mapeamento de estados de negócio em famílias (§13) |
| `focus` = `orange-600`; seleção `orange-200`; thumb `navy-400` | Foco de 2px (catálogo: 3px); sem `focus-on-dark` |
| Desabilitado sem opacidade | Densidade por região; tabelas, formulários e Kanban |
| Movimento respeitando `prefers-reduced-motion` | Raios 4/6/8/12 (catálogo: 12/16/24) e duas sombras |
| | Geist + Geist Mono (catálogo: Archivo) |

**Princípio:** a mesma marca e a mesma gramática de cor, com expressões
diferentes. O catálogo convida; o dashboard trabalha.

---

## 28. Arquivos de spec afetados (após aprovação)

1. `specs/apps/ui-foundations.md`:
   - "Linguagem visual": navy deixa de ser "superfície escura" no dashboard;
     a "linguagem elevada" é removida;
   - escalas de raios, elevação e controles;
   - tipografia do dashboard (escala §20 e Geist Mono);
   - nova seção "Fundamentos do dashboard" (papéis semânticos, regras de cor,
     famílias de estado, estados do browser e contraste validado), espelhando
     a do catálogo;
   - foundation navy/laranja promovida a comum aos dois apps;
   - resolução da pendência "validar contrastes estimados do dashboard".
2. `specs/apps/dashboard/design-system/README.md`: "Direção", "Princípios de
   composição" ("Moldura escura" → "Mesa clara"), papéis de cor, layout da
   sidebar, botões (variantes), badges (famílias), tabelas (densidade),
   dialogs e feedback.
3. `specs/apps/dashboard/interface.md`: somente a "Direção visual" (Geist +
   Geist Mono). Fluxos e comportamento não mudam.
4. `specs/prototypes/dashboard/index.html`: consolidação da direção aprovada
   em todas as telas (inclui a correção dos literais e do defeito
   `.diff .after`).
5. `specs/README.md`: índice (esta proposta passa a "registro da decisão").

Depois disso: `apps/dashboard/index.html` (fontes), `tailwind.css`
(tokens), `shared/ui/*` (primitives), `app/app-shell.tsx`, `shared/feedback/toast.tsx`,
`modules/leads/lead-stages.ts` (sinais das etapas) e os componentes de
feature que usam `accent`, `brand-gradient` e `shadow-*`.

## 29. Decisões que exigem o responsável

1. **Aprovação da direção B**, incluindo as mudanças em decisões aprovadas:
   sidebar escura → tonal; "linguagem elevada" → plana; laranja `#cc4a0a`
   → `orange-500` com rótulo navy; escala tipográfica; raios por função.
2. **Mapeamento de estados** (§13): "Rascunho" → `info`; "Perdido" →
   `neutral`; etapas abertas sem cor própria. É um mapeamento visual, não uma
   regra de negócio.
3. **Breadcrumb como retorno** à listagem nas páginas de detalhe, no lugar
   do link "← Voltar" acima do título (`design-system` exige "retorno à
   listagem"; o breadcrumb continua atendendo).
4. **Logo:** a B assume a versão para fundo claro. O logo oficial continua
   pendente; o protótipo usa um espaço reservado tipográfico.

### Divergência documental encontrada (fora do escopo visual)

`dashboard/interface.md` diz que a movimentação de etapa ocorre
**exclusivamente** pelo arraste ("não há botão ou dialog de seleção manual
de etapa"). Já `design-system/README.md` diz que "Arrastar não substitui a
ação acessível `Alterar etapa`", e o protótipo aprovado mostra o botão
"Alterar etapa" e o dialog. O protótipo comparativo não mostra controles
manuais de etapa. A divergência precisa ser resolvida nas specs de
comportamento antes da consolidação do protótipo.
