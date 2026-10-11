# Proposta — sistema visual do catálogo (paleta, tipografia e estados globais)

**Escopo:** catálogo público (`apps/catalog/`), com impacto potencial nos fundamentos compartilhados  
**Estado:** Aprovado em 2026-10-11 — direção A, escopo restrito ao catálogo; consolidado em [`ui-foundations.md`](../../../../apps/ui-foundations.md#fundamentos-do-catálogo) e no [protótipo do catálogo](../../index.html). Este documento permanece como registro da auditoria e das alternativas.  
**Data:** 2026-10-11  
**Protótipo comparativo:** [index.html](index.html)

Este documento audita o sistema visual atual do catálogo e propõe sua evolução.
Ele não altera decisões aprovadas: enquanto não houver aprovação explícita,
continuam vinculantes [`ui-foundations.md`](../../../../apps/ui-foundations.md),
[`catalog/interface.md`](../../../../apps/catalog/interface.md) e o
[protótipo aprovado](../../index.html). Nenhum arquivo de `apps/` foi alterado.

Fluxo seguido ([processo de evolução da interface](../../../../ui-change-process.md)):

```text
auditoria → proposta → protótipo comparativo → validação visual → aprovação
→ ui-foundations.md / interface.md → protótipo consolidado → tokens → estados globais → componentes
```

Todas as razões de contraste deste documento foram calculadas com a fórmula de
luminância relativa da WCAG 2.2; o protótipo comparativo recalcula os pares
principais ao vivo a partir das variáveis de cada direção.

---

## 1. Diagnóstico da paleta atual

Fontes analisadas: `apps/catalog/src/styles/tailwind.css`, o bloco `:root` do
protótipo aprovado, `apps/dashboard/src/styles/tailwind.css` e o ativo
`assets/logo-parceiros-flex.png` (cores dominantes medidas: laranja `#FC5000`,
navy `#001438`).

| Cor | Valor atual | Observação |
| --- | --- | --- |
| `primary` | `#cc4a0a` | H 20°, S 91%, L 42%. Passa com texto branco (4,61:1), mas o componente azul (`0a`) e a baixa luminosidade o deslocam para o terroso. Fica **muito distante do laranja do logo** (`#FC5000`). |
| `primary-hover` | `#b83f08` | Mais escuro ainda; o hover aproxima a ação do marrom. |
| `accent` | `#f4651a` | Laranja mais próximo do logo, mas usado só em formas e no foco. |
| `accent-foreground` | `#b23f07` | Praticamente igual a `primary-hover` (`#b83f08`). Usado em headline, percentuais, links, logo, ícones e eyebrow — é o laranja **mais visto** da página e é o mais escuro. |
| `gradient-to` | `#f68d36` | Existe só para o glifo `✺` da faixa. |
| `primary-edge` | `#92350a` | Um único uso. |
| `foreground` | `#0a1428` | Navy de texto. |
| `sidebar` | `#071024` | Navy de superfície. Visualmente indistinguível de `foreground`, com valor diferente. |
| Navy do logo | `#001438` | Mais azul e saturado que os dois acima; não existe como token. |

Conclusões:

- **O laranja que o visitante mais vê é o mais escuro.** Headline, percentuais,
  links e ícones usam `#b23f07`. O laranja vibrante (`#f4651a`) aparece só em
  blobs e no foco. A página lê como "laranja queimado", não como Flex.
- **Existem três navies sem função distinta** (`#0a1428`, `#071024` e o navy do
  logo, ausente).
- **Não há escala.** São valores avulsos (`primary`, `hover`, `edge`, `accent`,
  `accent-soft`, `accent-subtle`, `accent-foreground`, `gradient-to`), sem
  relação perceptiva entre si; não é possível escolher "um degrau acima".
- **Limite físico não documentado:** nenhum laranja vibrante passa 4,5:1 com
  texto branco. O laranja do logo dá 3,34:1; para chegar a 4,5:1 com branco o
  laranja precisa descer para L≈41% (`#d24300`, 4,62:1), que é justamente a
  zona terrosa. Enquanto o rótulo do CTA for branco, o CTA será escuro. A
  saída é trocar o rótulo, não o laranja (ver §11).

## 2. Diagnóstico dos neutros

| Token | Valor | Contraste com `background` |
| --- | --- | --- |
| `background` | `#f5f7f8` | — |
| `surface` | `#ffffff` | 1,07:1 |
| `surface-muted` | `#f1f3f5` | 1,04:1 |
| `border` | `#cbd3dc` | 1,41:1 |
| `control-border` | `#c4ccd5` | 1,51:1 |

- Os neutros não derivam do navy: `#f5f7f8` e `#f1f3f5` são cinzas de matiz
  ~200–210° quase sem croma. Ficam **cinzas**, não "azulados" — a sensação de
  peso vem da falta de luminosidade e de separação, não do matiz.
- **Cards usam `background`, não `surface`.** No protótipo e no app, cartões,
  painéis, passos, assistente e chips usam a mesma cor da página. O branco
  (`surface`) praticamente não aparece. O resultado é a página "toda cinza"
  da captura: card cinza sobre fundo cinza separado só por uma borda de 1,41:1.
- **`background` e `surface-muted` são o mesmo tom** (1,04:1). A banda do
  catálogo e o fundo da página não se distinguem; por isso a seção precisa de
  bordas superior e inferior para existir.
- **`border` e `control-border` são redundantes** (`#cbd3dc` × `#c4ccd5`) e
  nenhum dos dois atinge 3:1, exigido pela WCAG 1.4.11 para a borda que
  identifica um campo (select de plano, campos do assistente).
- `foreground-soft` (8,86:1) e `muted-foreground` (5,83:1) funcionam, mas o
  primeiro é usado tanto em corpo de texto quanto em rótulos e o segundo em
  hints, legendas e preços; a hierarquia entre eles depende de tamanho, não de
  papel.

## 3. Diagnóstico da tipografia

`Geist` é a família única (400–700). Pontos fortes: excelente legibilidade,
algarismos limpos, um único arquivo. Problemas para o catálogo:

- **Personalidade de produto de software.** Geist foi desenhada pela Vercel
  para interfaces de desenvolvedor e é hoje assinatura visual de SaaS e
  ferramentas de IA — exatamente a estética que o Flex deve evitar. Ela é
  neutra, estreita e técnica; não comunica família, varejo nem proximidade.
- **Display fraco.** A headline usa 600 com `-0.02em`. Em 68px o peso médio
  fica fino para um hero comercial, e a hierarquia é carregada pela cor laranja
  em vez da forma das letras.
- **Desconexão com a marca.** O wordmark de referência é um grotesco pesado,
  largo e inclinado. Nada na tipografia da interface ecoa essa voz.
- **Escala com degraus pequenos e valores quebrados.** O protótipo usa
  `13`, `14`, `14.5`, `15`, `16`, `17`, `18`, `19`, `20`, `21`px — dez tamanhos
  entre 13 e 21px, vários a 1px de distância. O app replica isso em
  `text-[13px]`, `text-[14.5px]`, `text-[15px]`, `text-[17px]`, `text-[19px]`,
  `text-[21px]`.
- **Números sem presença própria.** Percentuais usam o mesmo 600 do display,
  em `accent-foreground` escuro; "até 80%" é o principal argumento comercial e
  é tratado como texto comum.
- `ui-foundations.md` define uma escala do dashboard (`24/32`, `16/24`…), mas o
  catálogo não tem escala própria documentada; o protótipo improvisa.

## 4. Problemas de hierarquia (leitura da tela)

| Pergunta | Resposta atual |
| --- | --- |
| O que chama atenção primeiro? | O blob navy da direita e o círculo laranja, não a headline nem o CTA. |
| O CTA principal está identificado? | Parcialmente. `Vem ser Flex` (pill `#cc4a0a`) compete com o fragmento laranja da headline logo acima, com o selo laranja e com o círculo laranja da arte. Há quatro laranjas no primeiro viewport. |
| O navy funciona como estrutura? | Só no rodapé, na faixa e no blob. No resto da página o navy é apenas cor de texto. |
| O laranja funciona como ação? | Não exclusivamente: é ação, headline, percentual, link, ícone, logo, eyebrow, foco, número de passo e estrela. Laranja deixou de significar "clique aqui". |
| Os neutros servem à hierarquia? | Não. Fundo, card, banda e chip têm o mesmo tom; tudo é separado por bordas fracas. |
| Tons quase iguais sem função? | Sim: `background`/`surface-muted`, `border`/`control-border`, `foreground`/`sidebar`, `accent-foreground`/`primary-hover`. |
| Áreas escuras parecem a mesma marca? | Sim no valor, mas a faixa usa um terceiro laranja (`gradient-to`) e o rodapé usa `rgba(255,255,255,.12)` literal. |
| Estados interativos parecem do mesmo sistema? | Não: hover de card usa sombra preta neutra (`rgba(20,20,20,.08)`); foco é laranja claro; chip selecionado usa `primary` + borda `accent-foreground`; botão pressionado só desloca 1px. |
| Browser chrome conversa com a identidade? | Não. Seleção azul do sistema, scrollbar padrão, caret padrão, autofill azul do Chrome. |
| Personalidade própria? | Pouca: é um layout de landing page competente com laranja e navy aplicados por cima. O ativo mais forte (Flex Card) não aparece. |

Hero, em detalhe:

- Headline em 4 linhas no desktop, coluna de 1.1fr, 600, `-0.02em`. Com
  `você e sua família` em laranja escuro, ~35% da frase é colorida; sem a cor a
  headline perde quase toda a força — sinal de que a hierarquia depende da cor.
- Selo superior: pill cinza sobre fundo cinza, quase invisível; o ícone laranja
  é o único ponto de contraste.
- CTAs: primário pill laranja escuro + secundário outline laranja escuro. Os dois
  usam a mesma cor e disputam peso.
- Composição direita: formas abstratas (blob navy, círculo laranja, círculo
  cinza) com três cartões flutuantes. Não representa o produto; não há espaço
  previsto para o Flex Card.
- Faixa abaixo: inclinada, navy, glifo `✺` em terceiro laranja. Funciona como
  ritmo, mas o glifo não tem relação com a marca.

## 5. Problemas de contraste

| Par | Razão | Exigência | Resultado |
| --- | --- | --- | --- |
| `focus` `#f4651a` / `background` | 2,91:1 | 3:1 (1.4.11) | **Falha** |
| `focus` / `surface` | 3,12:1 | 3:1 | Limite |
| `focus` / `surface-muted` (banda do catálogo) | 2,81:1 | 3:1 | **Falha** |
| `focus` / `primary` (anel colado ao botão) | 1,48:1 | 3:1 | **Falha** onde não há offset |
| `control-border` / `background` | 1,51:1 | 3:1 para identificar campo | **Falha** |
| `control-border` / `surface-muted` | 1,46:1 | 3:1 | **Falha** |
| `border` / `background` | 1,41:1 | decorativa | Ok, mas não separa |
| `surface-muted` / `background` | 1,04:1 | — | Sem distinção |
| `primary` como texto (`#cc4a0a`) / `background` | 4,29:1 | 4,5:1 texto pequeno | **Falha** se usado em texto pequeno (as regras atuais já proíbem; o protótipo respeita) |
| branco / `primary` | 4,61:1 | 4,5:1 | Passa com margem mínima |
| `accent-foreground` / `accent-soft` | 5,15:1 | 4,5:1 | Passa |
| `muted-foreground` / `surface-muted` | 5,63:1 | 4,5:1 | Passa |
| `sidebar-muted` / `sidebar` | 8,30:1 | 4,5:1 | Passa |

Os contrastes de texto estão corretos; **os problemas estão no foco e nas
bordas de controle**, ou seja, justamente onde a acessibilidade de interação
depende de cor.

## 6. Tokens redundantes

- `surface-muted` ≈ `background` (1,04:1).
- `control-border` ≈ `border` (1,07:1 entre si).
- `sidebar` ≈ `foreground` (dois navies quase idênticos).
- `primary-hover` ≈ `accent-foreground`.
- `accent` = `focus` (mesmo valor, papéis diferentes — aceitável, mas o valor falha como foco).
- `gradient-to` (um uso decorativo) e `primary-edge` (um uso).
- `shadow-float` = alias de `shadow-lg`; `shadow-md` não é usado pelo catálogo.
- `radius-md` (12px) quase não é usado; cartões usam `radius-lg`.

## 7. Tokens ausentes

- **Escala de foundation** de navy e laranja (hoje só existem papéis avulsos).
- `primary-foreground`, `primary-active`, `primary-disabled` no catálogo (o dashboard tem parte deles).
- `border-strong` no catálogo (existe no dashboard).
- `focus-on-dark` (o foco sobre o rodapé navy não tem token).
- `selection-bg` / `selection-foreground`.
- `scrollbar-track` / `scrollbar-thumb` / `scrollbar-thumb-hover`.
- `placeholder` e `caret`.
- `success`, `warning`, `info` no `tailwind.css` do catálogo (o protótipo usa, o app não declara — drift).
- Sombras por função (`soft`, `card`, `float`, `signature`) e sombras de marca do CTA.
- Tokens de raio por função (`control`, `card`, `panel`, `signature`, `pill`).
- Escala tipográfica do catálogo e tokens de família/peso de display.
- Tokens de movimento (duração e curva).

## 8. Estados globais do browser

| Estado | Atual | Problema |
| --- | --- | --- |
| Seleção de texto | Azul do sistema | Única cor azul saturada da página; não pertence ao sistema. |
| Scrollbar | Padrão do sistema | No Windows, barra cinza clara larga com setas, desconectada do canvas. |
| `focus-visible` | `2px` (app) / `3px` (protótipo) `#f4651a`, offset 3/2px | Falha 3:1 sobre o fundo; espessura difere entre app e protótipo. |
| Caret | Padrão | Neutro; aceitável, mas pode carregar a marca sem custo. |
| Placeholder | Padrão do browser (~`#757575`) | Cinza genérico fora da escala. |
| Autofill | Azul claro do Chrome | Conflita com campos do assistente. |
| Disabled | `opacity: .5` | Laranja a 50% sobre cinza vira salmão; perde contraste de forma imprevisível. |
| Loading | Spinner na cor `background` | Aceitável. |

Observação de implementação (fora do escopo de paleta, mas relevante para a
percepção de qualidade): a página de parceiro em produção
(`apps/catalog/src/pages/parceiros/[slug].astro`) **diverge do protótipo
aprovado** — títulos sem estilo, `select` nativo sem `appearance: none` (duas
setas), bloco de benefício sem a superfície navy, e textos colados
(`Seu descontoaté15%`, `WhatsApp+55…`). Parte da "fraqueza visual" percebida
é esse defeito, não a paleta. Deve ser corrigido como defeito de implementação
(alinhar ao protótipo), independentemente desta proposta.

---

## 9. Três propostas

Todas preservam navy + laranja + neutros, usam uma **única escala navy** (que
serve como neutro e como marca) e uma **escala laranja ancorada no logo**. Elas
variam em temperatura, proporção navy/laranja, tipografia, contraste e
materialidade.

### Foundation comum

**Navy** (matiz ~219°, ancorado no navy do logo):

| Degrau | HEX | Uso principal |
| --- | --- | --- |
| `navy-50` | `#FAFBFD` | canvas (direção A) |
| `navy-100` | `#EEF2F7` | `surface-muted`, bandas, tags |
| `navy-200` | `#DCE2EC` | `border` |
| `navy-300` | `#B4BFD0` | `border-strong`, `sidebar-muted` |
| `navy-400` | `#7A879E` | `control-border`, `scrollbar-thumb` |
| `navy-500` | `#5E6A82` | placeholder, texto desabilitado |
| `navy-600` | `#4A5670` | `muted-foreground`, `scrollbar-thumb-hover` |
| `navy-700` | `#333F59` | `foreground-soft` |
| `navy-800` | `#18284A` | superfície elevada sobre navy, hover em áreas escuras |
| `navy-900` | `#04173A` | **navy Flex**: `foreground`, `sidebar`, faixa, face do Flex Card |

Não há `navy-950`: um único navy de marca serve texto e superfície. `navy-800`
existe só para elevação dentro de áreas escuras.

**Laranja** (matiz ~20°, ancorado no logo `#FC5000`):

| Degrau | HEX | Uso principal |
| --- | --- | --- |
| `orange-50` | `#FFF6F0` | `accent-subtle` |
| `orange-100` | `#FFE9DB` | `accent-soft` (cupom, fundo de tag) |
| `orange-200` | `#FFCFB2` | `selection` |
| `orange-400` | `#FF6B1F` | `primary-hover`, `focus-on-dark` |
| `orange-500` | `#FD5200` | **laranja Flex**: `primary`, sinal gráfico |
| `orange-600` | `#EA4B00` | `primary-active`, números grandes, `focus` |
| `orange-700` | `#B83A00` | `accent-foreground` (texto laranja pequeno) |

`orange-300`, `-800` e `-900` foram omitidos por falta de uso real.

**Semânticas** (mantidas; contraste revalidado): `success #157347` sobre
`#E7F6EE` 5,26:1 · `warning #8A5A00` sobre `#FDF3D7` 5,36:1 · `danger #B4233A`
sobre `#FDECEE` 5,68:1 · `info #1F56C4` sobre `#E8EFFC` 5,71:1. Nenhuma usa
matiz próximo de 20° ou 219° com saturação alta; não competem com a marca.

---

### Direção A — Estrutura navy, ação luminosa *(recomendada)*

**Intenção:** canvas quase branco e frio; navy como a estrutura de toda a
página; laranja do logo, na intensidade real, reservado à ação e ao valor.

**Paleta (papéis)**

| Token semântico | Valor | Papel |
| --- | --- | --- |
| `background` | `navy-50` `#FAFBFD` | canvas |
| `surface` | `#FFFFFF` | cartões, painéis, controles |
| `surface-muted` | `navy-100` `#EEF2F7` | bandas de seção, tags, bolha do bot |
| `surface-inverse` (`sidebar`) | `navy-900` `#04173A` | rodapé, faixa, bloco de benefício |
| `foreground` | `navy-900` | texto principal |
| `foreground-soft` | `navy-700` `#333F59` | texto de apoio |
| `muted-foreground` | `navy-600` `#4A5670` | legendas, hints, metadados |
| `border` | `navy-200` `#DCE2EC` | separação de conteúdo |
| `border-strong` | `navy-300` `#B4BFD0` | hover de card, contorno de chip |
| `control-border` | `navy-400` `#7A879E` | campos e select (≥3:1) |
| `primary` | `orange-500` `#FD5200` | CTA |
| `primary-foreground` | `navy-900` | rótulo do CTA |
| `primary-hover` | `orange-400` `#FF6B1F` | hover (clareia: "acende") |
| `primary-active` | `orange-600` `#EA4B00` | pressionado |
| `primary-disabled` | `navy-100` + texto `navy-500` | desabilitado |
| `accent-foreground` | `orange-700` `#B83A00` | texto laranja pequeno (eyebrow) |
| `accent-strong` | `orange-600` `#EA4B00` | percentuais e números grandes (≥24px) |
| `accent-soft` / `accent-subtle` | `orange-100` / `orange-50` | cupom, instruções |
| `sidebar-foreground` | `navy-100` `#EEF2F7` | texto sobre navy |
| `sidebar-muted` | `navy-300` `#B4BFD0` | texto secundário sobre navy |
| `focus` | `orange-600` `#EA4B00` | anel em superfícies claras |
| `focus-on-dark` | `orange-400` `#FF6B1F` | anel sobre navy |

**Regras de uso de cor**

- Laranja preenchido significa **ação**. Laranja em texto grande significa
  **valor** (percentual). Fora isso, laranja aparece só como sinal gráfico
  (o `+`, o ponto do selo, a faixa do Flex Card).
- Links de texto (`Ver detalhes`, `Voltar para parceiros`) são navy com
  sublinhado laranja — leem como marca sem competir com o CTA.
- Chip selecionado e bolha do usuário no assistente são **navy**, não laranja:
  seleção é estado, não ação.
- A headline é inteiramente navy. A cor não carrega hierarquia; o peso carrega.

**Tipografia — `Archivo` (família única, eixos `wght` e `wdth`)**

| Nível | Tamanho / entrelinha | Peso | Largura | Tracking |
| --- | --- | --- | --- | --- |
| hero | `clamp(40px, 2.6vw + 30px, 76px)` / 0.98 | 800 | 112% | -0.035em |
| display (título de seção) | `clamp(32px, 1.6vw + 26px, 52px)` / 1.02 | 750 | 110% | -0.03em |
| heading (card, painel, passo) | 22px / 1.2 | 650 | 100% | -0.012em |
| body-lg (apoio do hero) | 19px / 1.55 | 400 | 100% | 0 |
| body | 16px / 1.55 | 400 | 100% | 0 |
| small | 14px / 1.45 | 450 | 100% | 0 |
| control (botão, select, chip) | 16px / 1.25 (15px compacto) | 650 | 100% | 0.005em |
| navigation | 15px / 1.2 | 550 | 100% | 0 |
| caption | 13px / 1.35 | 500 | 100% | 0.01em |
| eyebrow | 13px / 1.2, caixa alta | 700 | 115% | 0.1em |
| número de destaque (percentual detalhe) | `clamp(56px, 4vw + 40px, 72px)` / 1 | 800 | 108% | -0.03em, `tnum` |
| número de cartão | 40px / 1 | 800 | 108% | -0.03em, `tnum` |

Pesos solicitados: um único arquivo variável `wght 400–800`, `wdth 100–125`.
Uma família, duas vozes: larga e pesada nos títulos (eco do wordmark), normal
no corpo.

**Raios**

| Papel | Valor | Onde |
| --- | --- | --- |
| `radius-control` | 12px | botões, select, inputs, nav hover |
| `radius-card` | 16px | cartão de parceiro, passos, valores, estados |
| `radius-panel` | 24px | palco do hero (Flex Card), bloco de benefício, assistente |
| `radius-signature` | 14px | Flex Card (proporção de cartão ISO 7810) |
| `radius-pill` | 999px | selo, chips, tags, FAB, status |

O CTA deixa de ser pill: o retângulo de 12px conversa com o Flex Card e com o
wordmark anguloso, e diferencia ação (retângulo) de filtro (pill).

**Sombras e materialidade**

| Token | Onde pode aparecer |
| --- | --- |
| `shadow-soft` | controles em repouso (botão secundário, select) |
| `shadow-card` | **somente** hover/foco de cartão acionável e cartões flutuantes do hero |
| `shadow-float` | assistente, FAB, menus, toast |
| `shadow-signature` | **exclusiva** do Flex Card |
| `shadow-brand` / `shadow-brand-pressed` | **exclusivas** do CTA primário (realce interno superior + borda inferior laranja escura; pressionado com sombra interna) |

Superfícies de conteúdo são planas: borda `navy-200` e contraste de superfície.
Materialidade só no Flex Card e no CTA primário. Sem glass, sem neumorphism.

**Movimento:** `120ms` (hover/press), `200ms` (entrada de elementos pequenos),
`320ms` (painéis); curva `cubic-bezier(.2, .7, .2, 1)`. Flutuação contínua só
no Flex Card (8s). Faixa de categorias 40s. Tudo desligado sob
`prefers-reduced-motion`.

**Estados do browser**

| Estado | Decisão | Contraste |
| --- | --- | --- |
| Seleção | fundo `orange-200` `#FFCFB2`, texto `navy-900` | 12,47:1 |
| Scrollbar track | `background` (canvas) | — |
| Scrollbar thumb | `navy-400` `#7A879E`, 6px visíveis em 12px de calha | 3,50:1 com o canvas |
| Scrollbar thumb hover | `navy-600` `#4A5670` | 7,10:1 |
| Foco | anel 3px `orange-600`, offset 2px; `orange-400` sobre navy | 3,68:1 canvas · 3,81:1 branco · 6,20:1 navy |
| Caret | `orange-600` | — |
| Placeholder | `navy-500` `#5E6A82` | 5,25:1 canvas · 5,44:1 branco |
| Autofill | fundo `orange-50`, texto `foreground` via `:autofill` | 16,5:1 |
| Disabled | fundo `navy-100`, texto `navy-500`, borda `navy-200`, `cursor: not-allowed`; sem opacidade | estado também comunicado por `disabled`/`aria-disabled` |

**Impacto na interface**

- **Header:** canvas translúcido `navy-50`; navegação navy 550 sem pill;
  hover com fundo `navy-100` raio 12; CTA compacto laranja/navy.
- **Hero:** headline navy inteira, 800, 3 linhas no desktop; selo branco com
  ponto laranja; CTA primário laranja luminoso + secundário branco/navy; arte
  da direita vira um **palco claro** (`surface-muted`, raio 24) com o Flex Card
  navy inclinado e dois cartões de benefício. O cartão é a maior massa escura do
  hero e, portanto, o ponto focal. O círculo laranja da composição atual
  permanece como eco atrás do cartão. (Um palco navy foi testado no protótipo e
  descartado: o cartão navy se perde sobre ele.)
- **CTA:** o elemento laranja mais luminoso da página. Um por viewport.
- **Background:** quase branco; bandas `navy-100` separam regiões sem bordas.
- **Cards:** brancos sobre a banda; percentual em `orange-600` 800 com `tnum`;
  destaque com selo navy e filete laranja superior, não borda laranja inteira.
- **Catálogo:** select branco com borda 3:1; chips pill brancos; selecionado navy.
- **Rodapé:** mesmo `navy-900` da faixa e do cartão; divisor `navy-800`.
- **Assistente:** FAB navy com ponto laranja (não compete com o CTA);
  bolha do bot `navy-100`, do usuário `navy-900`; botão enviar laranja.
- **Flex Card:** cartão navy sobre canvas e palco claros = maior contraste da
  página; nada ao redor usa sombra comparável. Em áreas navy (rodapé, bloco de
  benefício) o cartão navy depende só da sombra — se for usado ali, precisa de
  borda clara ou da face clara.

**Trade-offs**

- Vantagens: laranja idêntico ao logo; CTA vibrante **e** AA (5,37:1); uma
  escala para neutros e marca; hierarquia legível mesmo em monocromia; foco e
  bordas de controle passam a cumprir 3:1.
- Riscos: rótulo navy sobre laranja é menos convencional que branco — precisa
  de validação com a supervisora; a associação laranja+azul-escuro existe em
  outras marcas brasileiras (já existia antes, pela própria marca); trocar
  pill por retângulo no CTA muda a silhueta aprovada.
- Acessibilidade: todos os pares de texto ≥ 4,5:1; números grandes ≥ 3:1
  (`orange-600` 3,68–3,81:1); foco ≥ 3:1 em todas as superfícies.
- Personalidade: Archivo largo e pesado dá voz própria sem depender de cor.
- Manutenção: 10 + 7 degraus de foundation, ~30 tokens semânticos; remove
  8 tokens redundantes.
- Performance: troca uma família variável por outra; arquivo com dois eixos é
  maior que o Geist com um eixo (estimativa: +30–50 KB woff2 latin; medir no
  build).

---

### Direção B — Palco navy

**Intenção:** o navy como palco principal. Header e hero escuros, faixa
laranja, catálogo claro. Máximo contraste, cara de produto premium.

| Papel | Valor |
| --- | --- |
| `background` | `#FFFFFF` |
| `surface-muted` | `#F1F4F9` |
| `hero/header` | `navy-900` com texto `navy-100` |
| `primary` | `#D24300` (laranja AA com branco) |
| `primary-foreground` | `#FFFFFF` (4,62:1) |
| `primary-hover` / `active` | `orange-700` `#B83A00` (5,76:1) / `#A23300` |
| faixa de categorias | `orange-500` com texto `navy-900` (5,37:1) |
| `focus` | `navy-900` em claro (17,66:1); branco sobre navy |
| seleção | `navy-900` com texto branco (17,66:1) |
| scrollbar | track branco · thumb `navy-400` (3,63:1) · hover `navy-900` |

- **Tipografia:** `Bricolage Grotesque` (display, 700–800, `opsz` 96) +
  `Geist` (corpo, 400–600). Display expressivo com contraste ótico; corpo
  inalterado reduz o risco de migração.
- **Raios:** controles 10px, cartões 12px, CTAs pill (mantém a silhueta atual).
- **Materialidade:** cartões flutuantes do hero com sombra forte sobre navy;
  Flex Card com reflexo.
- **Impacto:** hero vira um bloco escuro de alto impacto; o Flex Card branco
  ou navy-com-borda se destaca muito bem; rodapé e hero emolduram a página;
  assistente e catálogo continuam claros.
- **Vantagens:** contraste máximo; leitura "premium"; o hero escuro dá muito
  impacto ao primeiro viewport.
- **Riscos:** o Flex Card navy desaparece sobre o hero navy — o protótipo
  precisa usar uma face clara do cartão, o que condiciona a arte oficial;
  página pesada e institucional (banco/cartão de crédito), menos
  "família"; laranja do CTA continua na zona escura (o problema do marrom
  permanece, só disfarçado pelo fundo navy); Bricolage é uma escolha muito
  associada à estética de 2024 — risco de datar; duas famílias = duas
  requisições de fonte.
- **Acessibilidade:** excelente em texto; atenção a texto `navy-300` sobre
  navy em tamanhos pequenos (9,51:1, ok).
- **Performance:** duas famílias variáveis (+~60–90 KB).

### Direção C — Comercial e acolhedora

**Intenção:** varejo caloroso. Bandas pêssego, mais laranja visível, formas
mais redondas, tipografia amigável.

| Papel | Valor |
| --- | --- |
| `background` | `#FFFFFF` |
| `surface-muted` | `orange-50` `#FFF6F0` |
| `border` | `#EDE3DB` (neutro quente) |
| `muted-foreground` | `#5F5650` (7,16:1 branco) |
| `foreground-soft` | `#3D3835` |
| `primary` | `orange-500` com rótulo `navy-900` (5,37:1) |
| headline | fragmento `você e sua família` em `orange-600` (3,81:1 — texto grande) |
| `focus` | `orange-600`; seleção `#FFD9C2` com `navy-900` (13,42:1) |
| scrollbar | track `orange-50` · thumb `#8C7F76` (3,64:1) · hover `#5F5650` |

- **Tipografia:** `Plus Jakarta Sans` (família única, 400–800). Geométrica
  humanista, terminais abertos, simpática em pesos altos.
- **Raios:** tudo mais redondo — controles pill, cartões 20px, painéis 28px.
- **Impacto:** a página fica mais quente e comercial; o catálogo sobre pêssego
  faz os cartões brancos saltarem; o navy fica restrito a texto e rodapé.
- **Vantagens:** acolhedora, alinhada a "família" e "economia"; CTA vibrante AA.
- **Riscos:** neutros quentes reintroduzem o caminho "cream/off-white" que
  foi substituído em 2026-10-10; laranja em excesso dilui o CTA (volta o
  problema da §4); Plus Jakarta Sans é onipresente em templates de startup
  brasileiros — personalidade genérica; o Flex Card (frio: branco, navy, cinzas)
  briga com o entorno quente.
- **Performance:** uma família variável, equivalente ao Geist.

## 10. Comparação

| Critério | A — Estrutura navy | B — Palco navy | C — Comercial |
| --- | --- | --- | --- |
| Reconhecimento da marca | ●●● laranja e navy do logo, papéis claros | ●●● navy dominante | ●●○ laranja dominante, navy enfraquece |
| Qualidade visual | ●●● limpa, precisa | ●●● impacto alto | ●●○ calorosa, menos precisa |
| Usabilidade do catálogo | ●●● cartões brancos sobre banda | ●●○ catálogo bom, hero rouba atenção | ●●○ excesso de laranja disputa com filtros |
| Conversão (CTA) | ●●● CTA é o único laranja luminoso | ●●○ CTA escuro sobre navy | ●●○ CTA compete com headline e bandas |
| Acessibilidade | ●●● | ●●● | ●●○ números/headline em limite de texto grande |
| Manutenção | ●●● uma família, uma escala fria | ●●○ duas famílias | ●●○ escala quente paralela |
| Relação com o Flex Card | ●●● cartão navy sobre canvas frio | ●○○ exige face clara do cartão | ●●○ funciona, mas o entorno quente compete |
| Risco de regressão a decisões rejeitadas | baixo | baixo | **alto** (off-white quente) |

## 11. Recomendação

**Direção A — Estrutura navy, ação luminosa.**

Como design lead, recomendo A porque é a única que resolve as três causas
raiz ao mesmo tempo:

1. **O laranja volta a ser o do logo** sem violar AA, porque o rótulo do CTA
   passa a ser navy (5,37:1). As outras saídas (rótulo branco) obrigam o
   laranja a ficar na faixa terrosa — B prova isso.
2. **Cada cor ganha um único papel**: navy = estrutura e estado; laranja
   preenchido = ação; laranja em número = valor. Com isso o CTA é
   identificado imediatamente e o catálogo comunica o desconto com força.
3. **A hierarquia passa para a tipografia e as superfícies**: canvas
   quase branco, cartões brancos, bandas `navy-100`, headline 800 larga. A
   página continua legível em monocromia.

Ela também é a que melhor emoldura o Flex Card (objeto frio sobre canvas frio
e palco claro), a mais barata de manter (uma família, uma escala) e a que menos
arrisca voltar a decisões já substituídas. De B, A herda o navy como massa
estrutural — concentrado no cartão, na faixa e no rodapé. De C, nada além do rótulo navy no CTA.

Pontos que exigem decisão explícita na aprovação:

- rótulo navy no CTA laranja (em vez de branco);
- CTA retangular (12px) em vez de pill;
- troca de `Geist` por `Archivo` no catálogo;
- escopo nos apps (ver §19).

## 12. Paleta final recomendada

Ver **Foundation comum** (§9) e a tabela de papéis da Direção A. Tokens
removidos: `accent` (substituído por `orange-500` como sinal gráfico),
`gradient-to`, `primary-edge` (absorvido em `shadow-brand`), duplicação
`sidebar`/`foreground` (ambos `navy-900`).

## 13. Tipografia final recomendada

`Archivo`, família única, variável (`wght 400–800`, `wdth 100–125`), escala da
Direção A. Display e números com `font-stretch` 108–115%; corpo, controles e
navegação a 100%. Algarismos tabulares (`font-variant-numeric: tabular-nums`)
em percentuais, telefones e contagens.

Por que não duas famílias: o eixo de largura do Archivo entrega o contraste
display/corpo que uma segunda família traria, com um único arquivo e sem
problema de harmonização. Não há ganho de identidade que justifique a segunda
requisição.

Alternativas avaliadas (detalhe no protótipo):

| Direção tipográfica | Display / Corpo | Pesos | Por que funciona | Riscos | Performance |
| --- | --- | --- | --- | --- | --- |
| **Archivo** (recomendada) | Archivo largo / Archivo normal | 400–800, wdth 100–125 | Grotesco robusto, comercial, legível; o eixo de largura ecoa o wordmark pesado; números fortes | Menos "simpática" que humanistas; exige disciplina de largura (só display) | 1 família variável, 2 eixos |
| Bricolage Grotesque + Geist | Bricolage / Geist | 700–800 + 400–600 | Display com muita personalidade e contraste ótico; corpo já validado | Estética muito associada a 2024; duas famílias para harmonizar | 2 famílias |
| Plus Jakarta Sans | única | 400–800 | Amigável, legível, bons pesos altos | Onipresente em templates; personalidade genérica | 1 família, 1 eixo |
| Geist (atual) | única | 400–700 | Ótima legibilidade, já implantada | Assinatura de SaaS/IA; display fraco | 1 família, 1 eixo |

Carregamento (após aprovação): somente no `PublicLayout.astro`, por `<link>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800&display=swap" />
```

O `tailwind.css` declara apenas `--font-sans`/`--font-display` com a pilha de
fallback; nunca `@import url(...)`.

## 14. Tokens semânticos propostos (catálogo)

```text
foundation
  navy-50 … navy-900            orange-50, -100, -200, -400, -500, -600, -700

superfícies                      texto
  background   navy-50             foreground         navy-900
  surface      #FFFFFF             foreground-soft    navy-700
  surface-muted navy-100           muted-foreground   navy-600
  sidebar      navy-900            placeholder        navy-500
  sidebar-raised navy-800          sidebar-foreground navy-100
                                   sidebar-muted      navy-300

bordas                           ação
  border         navy-200          primary            orange-500
  border-strong  navy-300          primary-hover      orange-400
  control-border navy-400          primary-active     orange-600
                                   primary-foreground navy-900
                                   primary-disabled   navy-100 (+ texto navy-500)

destaque                         estados
  accent-foreground orange-700     focus              orange-600
  accent-strong     orange-600     focus-on-dark      orange-400
  accent-soft       orange-100     selection          orange-200
  accent-subtle     orange-50      selection-foreground navy-900
  brand-signal      orange-500     scrollbar-track    background
                                   scrollbar-thumb    navy-400
                                   scrollbar-thumb-hover navy-600

semânticas: success, success-soft, warning, warning-soft, danger, danger-soft, info, info-soft (valores atuais)

raios: radius-control 12 · radius-card 16 · radius-panel 24 · radius-signature 14 · radius-pill 999
sombras: shadow-soft · shadow-card · shadow-float · shadow-signature · shadow-brand · shadow-brand-pressed
movimento: duration-fast 120ms · duration-base 200ms · duration-slow 320ms · ease-out cubic-bezier(.2,.7,.2,1)
```

Componentes consomem apenas papéis semânticos (`bg-primary`,
`text-accent-strong`, `border-control-border`…). Degraus de foundation não são
usados diretamente em componentes.

## 15. Seleção de texto

```css
::selection { background: var(--color-selection); color: var(--color-selection-foreground); }
```

`orange-200` + `navy-900` = 12,47:1. A seleção é visivelmente da marca, mas
clara o bastante para não "gritar" sobre parágrafos longos. A regra define
também `color`, portanto mantém leitura sobre o rodapé navy. `::-moz-selection`
não é mais necessário (Firefox ≥ 62 suporta `::selection`).

## 16. Scrollbar

```css
/* Chromium e Safari */
::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-track { background: var(--color-scrollbar-track); }
::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar-thumb);
  border: 3px solid var(--color-scrollbar-track);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover { background: var(--color-scrollbar-thumb-hover); }
::-webkit-scrollbar-corner { background: var(--color-scrollbar-track); }

/* Firefox (sem pseudo-elementos WebKit) */
@supports not selector(::-webkit-scrollbar) {
  html { scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track); }
}
```

- `scrollbar-color` fica restrito aos browsers sem `::-webkit-scrollbar`:
  no Chromium ≥ 121, definir `scrollbar-color` desativa os pseudo-elementos e,
  com eles, o hover do thumb. Assim Chromium/Safari têm thumb + hover e o
  Firefox tem thumb e track nas mesmas cores (sem hover, limitação do padrão).
- `scrollbar-width` não é alterado (`auto`): não se afina a barra principal.
- Scrollbars overlay (macOS, iOS, Android) continuam nativas.
- Contêineres que já escondem a barra (chips no celular) não mudam.
- Thumb `navy-400` sobre canvas: 3,50:1 — discreto, mas identificável.

## 17. Verificações de acessibilidade (Direção A)

| Par | Razão | Exigência | |
| --- | --- | --- | --- |
| `foreground` / `background` | 17,06 | 4,5 | ✅ |
| `foreground` / `surface` | 17,66 | 4,5 | ✅ |
| `foreground` / `surface-muted` | 15,58 | 4,5 | ✅ |
| `foreground-soft` / `background` | 10,16 | 4,5 | ✅ |
| `muted-foreground` / `background` | 7,10 | 4,5 | ✅ |
| `muted-foreground` / `surface` | 7,35 | 4,5 | ✅ |
| `muted-foreground` / `surface-muted` | 6,54 | 4,5 | ✅ |
| `placeholder` / `surface` | 5,44 | 4,5 | ✅ |
| `primary-foreground` / `primary` | 5,37 | 4,5 | ✅ |
| `primary-foreground` / `primary-hover` | 6,20 | 4,5 | ✅ |
| `primary-foreground` / `primary-active` | 4,63 | 4,5 | ✅ |
| `primary` / `background` (forma do botão) | 3,18 | 3 | ✅ |
| `accent-strong` / `surface` (número ≥24px) | 3,81 | 3 | ✅ |
| `accent-strong` / `surface-muted` | 3,39 | 3 | ✅ |
| `accent-foreground` / `background` | 5,57 | 4,5 | ✅ |
| `accent-foreground` / `accent-soft` | 4,92 | 4,5 | ✅ |
| `sidebar-foreground` / `sidebar` | 15,58 | 4,5 | ✅ |
| `sidebar-muted` / `sidebar` | 9,51 | 4,5 | ✅ |
| `focus` / `background` | 3,68 | 3 | ✅ |
| `focus` / `surface` | 3,81 | 3 | ✅ |
| `focus` / `surface-muted` | 3,39 | 3 | ✅ |
| `focus-on-dark` / `sidebar` | 6,20 | 3 | ✅ |
| `control-border` / `surface` | 3,63 | 3 | ✅ |
| `control-border` / `surface-muted` | 3,23 | 3 | ✅ |
| `border` / `background` | 1,26 | decorativa | — |
| `selection` / texto | 12,47 | 4,5 | ✅ |
| `scrollbar-thumb` / track | 3,50 | 3 | ✅ |
| semânticas sobre `*-soft` | 5,26–5,71 | 4,5 | ✅ |

Outros critérios: estados não dependem só de cor (chip selecionado ganha ícone
de check; desabilitado usa atributo + cursor + troca de superfície; destaque
tem rótulo `Destaque`); foco nunca é removido; alvos ≥ 44px preservados.
Validação com axe e leitor de tela fica para a etapa de implementação, conforme
[`quality/strategy.md`](../../../../quality/strategy.md).

## 18. Impacto esperado nos componentes

| Componente | Mudança |
| --- | --- |
| `Header.astro` | fundo `background` translúcido; links navy 550; CTA compacto novo; logo provisório em navy com `+` laranja. |
| `HeroSection.astro` | headline sem `<em>` colorido; nova escala; selo branco; palco claro com Flex Card navy no lugar dos blobs (requer arte do Flex Card). |
| `CategoryRibbon.astro` | glifo `+` em `brand-signal` no lugar de `✺`/`gradient-to`. |
| `AboutSection.astro` | cartões `surface` com borda; ícones navy em `surface-muted`. |
| `CatalogSection` / `CatalogIsland.tsx` | banda `surface-muted` sem bordas; select com `control-border`; chips com estado navy; cartão branco; percentual `accent-strong`; link navy sublinhado. |
| `HowItWorksSection.astro` | números de passo em `accent-strong` 800 largo. |
| `Footer.astro` | divisor `sidebar-raised`; foco `focus-on-dark`. |
| `AssistantIsland.tsx` | FAB navy; bolhas navy/`surface-muted`; `placeholder`, `caret`, `autofill`. |
| `parceiros/[slug].astro` | bloco de benefício navy (já previsto no protótipo, hoje não implementado) com número grande. |
| `tailwind.css` | foundation + semânticos + base global (`::selection`, scrollbar, foco, caret, placeholder, autofill, reduced motion). Nenhuma classe de componente. |
| `PublicLayout.astro` | `<link>` do Archivo no lugar do Geist. |

## 19. Arquivos de spec que mudam após aprovação

1. `specs/apps/ui-foundations.md` — foundation navy/laranja, papéis semânticos,
   regras de uso de cor, tipografia do catálogo, raios, sombras, movimento,
   estados globais do browser e a tabela de contraste validada (resolve a
   pendência "validar contrastes estimados").
2. `specs/apps/catalog/interface.md` — seção "Direção visual" (família, regra
   de laranja na headline, CTA) e registro de revisão.
3. `specs/prototypes/catalog/index.html` — consolidação da direção aprovada.
4. `specs/apps/catalog/architecture.md` — apenas se a família mudar
   ("carrega a fonte aprovada" continua válido; nenhuma mudança estrutural).
5. `specs/README.md` — retirar a proposta do índice ao consolidar.

### Decisão bloqueante: escopo nos apps

`ui-foundations.md` define que catálogo e dashboard compartilham os mesmos
tokens semânticos e que o arquivo do dashboard é a materialização atual. Esta
proposta foi desenhada para o catálogo. Antes de atualizar as specs, é
preciso decidir:

- **(recomendado)** a foundation (escalas navy/laranja e papéis de cor) passa a
  valer para os dois apps; a expressão do catálogo (Archivo, raios maiores,
  palco do hero, Flex Card) fica registrada como específica do catálogo. A
  migração do dashboard vira uma proposta separada no protótipo do dashboard;
- ou a mudança vale só para o catálogo, e `ui-foundations.md` passa a admitir
  paletas por aplicação.

### Lacuna registrada: Flex Card

O Flex Card como objeto-assinatura da marca não está registrado em nenhuma
especificação do repositório e não há arte oficial. O protótipo usa uma
**representação ilustrativa** para avaliar a paleta ao redor do objeto. A
definição do cartão (arte, conteúdo exibido, uso no hero) precisa entrar em
`catalog/interface.md` antes de ser implementada.
