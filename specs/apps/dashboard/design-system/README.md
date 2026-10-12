# Dashboard — design system

**Estado:** Aprovado — direção A ("Moldura navy"), 2026-10-11, em substituição à direção B aprovada anteriormente no mesmo dia ([proposta e auditoria](../../../prototypes/dashboard/proposals/2026-10-sistema-visual/README.md))  
**Protótipo:** [dashboard](../../../prototypes/dashboard/index.html)  
**Tokens:** [`ui-foundations.md` — Fundamentos do dashboard](../../ui-foundations.md#fundamentos-do-dashboard), materializados em [`tailwind.css`](../../../../apps/dashboard/src/styles/tailwind.css)

Este documento complementa a [interface do dashboard](../interface.md) e os [fundamentos compartilhados](../../ui-foundations.md) sem alterar fluxos, módulos ou arquitetura. Valores (cores, tamanhos, sombras) vivem nos fundamentos e no arquivo de tokens; aqui constam apenas papéis e padrões, para evitar duplicação.

## Direção

A marca estrutura a tela por uma moldura navy escura: a navegação é o bloco de cor da interface, e o conteúdo é claro e plano. Laranja representa ação (a ação principal da região), posição (o item atual da navegação) e seleção (checkbox, switch, chip e filtros alternados). A identidade vem da foundation compartilhada com o catálogo, da família `Archivo` e do contraste "moldura escura, conteúdo claro".

### Princípios de composição

- **Moldura escura, conteúdo claro:** sidebar navy, topbar branca e canvas claro.
- **Densidade estável:** a mesma densidade padrão em listagens, formulários e Kanban; o acesso sem sessão é confortável.
- **Hierarquia por tipografia e agrupamento:** título de página, título de seção e conteúdo. Cor reforça a hierarquia, não a constrói.
- **Controles junto aos dados:** filtros, abas de estado e busca ficam na barra da própria região que afetam.
- **Laranja com papéis definidos:** ação principal, posição e seleção; cores de estado em famílias.
- **Superfícies planas:** cartões e tabelas com borda e sem sombra; sombra apenas em elementos que flutuam. Cartão dentro de cartão é proibido.
- **Composição assimétrica:** páginas de detalhe usam coluna principal e coluna lateral de apoio, com cartões independentes por seção.
- **Sem painel de métricas:** a densidade se aplica às telas operacionais existentes, sem criar indicadores não aprovados.

## Fundamentos

### Papéis de cor

| Papel | Tokens | Uso |
| --- | --- | --- |
| Fundo e superfícies | `background`, `surface`, `surface-muted` | Canvas; painéis, tabelas, controles e overlays; trilhos, somente leitura, hover, coluna do Kanban, iniciais e desabilitado |
| Texto | `foreground`, `foreground-soft`, `muted-foreground`, `placeholder` | Principal; secundário; metadado; placeholder e desabilitado |
| Bordas | `border`, `border-strong`, `control-border`, `control-border-hover` | Divisórias e cabeçalho de tabela; botão secundário; limite de campos |
| Ação | `primary`, `primary-hover`, `primary-active`, `primary-foreground` | Botão primário e estados |
| Seleção | `selected`, `selected-foreground`, `selected-soft`, `selected-soft-foreground`, `selected-border` | Checkbox, switch e filtro alternado (preenchido); chip (suave) |
| Atenção | `signal`, `attention-soft`, `attention-foreground` | Novo interesse |
| Identidade | `identity`, `identity-foreground` | Avatar de pessoa; iniciais de entidade |
| Navegação | `sidebar`, `sidebar-hover`, `sidebar-selected`, `sidebar-foreground`, `sidebar-muted`, `sidebar-selected-foreground`, `sidebar-border`, `signal-inverse`, `focus-inverse`, `sidebar-scrollbar` | Moldura navy, item atual, marca invertida e foco sobre fundo escuro |
| Estado | `success`, `warning`, `danger`, `info` (e `*-soft`), `danger-hover`, `danger-foreground` | Famílias de estado e ação destrutiva |
| Apoio | `inverse`, `inverse-foreground`, `overlay`, `focus`, `selection`, `scrollbar-thumb` | Tooltip, toast, backdrop, foco, seleção de texto, scrollbar |

As regras de uso e a tabela de contraste validado estão nos [fundamentos](../../ui-foundations.md#fundamentos-do-dashboard).

### Tipografia

- `Archivo` para toda a interface (`wdth 100`); o título de página usa `wdth 110` e peso 650.
- Identificadores (slug, nome de usuário, cupom, código emitido) usam a pilha monoespaçada do sistema.
- Escala: `page-title`, `section-title`, `heading`, `body`, `body-small`, `label`, `button`, `table-header`, `caption`, `overline` e `mono`, conforme os fundamentos.
- O rótulo de grupo da sidebar é o único uso de `overline`.
- Dados numéricos usam algarismos tabulares.

### Layout

- Sidebar navy (`sidebar`), grupos rotulados em `sidebar-muted` e item atual com fundo `sidebar-selected`, texto 600 em `sidebar-selected-foreground`, ícone e marcador de 3px em `signal-inverse` na borda esquerda; pode ser recolhida para trilho de ícones. Ícones de 16px.
- Topo da sidebar: logo para fundo escuro (espaço reservado até a entrega do logo oficial) e "Painel interno".
- Rodapé da sidebar: identidade do usuário com acessos a `Alterar senha` e `Sair`.
- Topbar de 48px, branca, com controle de recolhimento e breadcrumb (área / página / registro). Nas páginas de detalhe, o nível anterior do breadcrumb é o link de retorno à listagem.
- Cabeçalho de página compacto, sem cartão: título e descrição de uma linha à esquerda e ações à direita, com no máximo uma primária.
- Conteúdo fluido, com margem horizontal de `28px` no desktop e `16px` no celular.
- Formulários longos: coluna principal de até `720px`, preservando áreas laterais de navegação ou resumo quando aprovadas.
- No mobile, a sidebar vira menu sobreposto acionado pelo cabeçalho.

## Componentes

### Ícones

- O dashboard usa `lucide-react` como biblioteca única de ícones.
- O componente `shared/ui/icon.tsx` mantém um mapa semântico (`plus`, `search`, `partner`, etc.) e traduz esses nomes para os ícones Lucide.
- Telas e módulos não importam ícones Lucide diretamente; novos ícones entram primeiro no mapa semântico.
- Ícones decorativos usam `aria-hidden="true"`; ações iconográficas continuam obrigadas a possuir nome acessível no controle que as contém.
- A espessura padrão é `1.75`. Tamanho e cor continuam vindo das classes e tokens existentes.

### Botões

- Variantes: primário (`primary` com rótulo `primary-foreground`), secundário (`surface` + `border-strong`), silencioso (sem borda, `foreground-soft`), entrada destrutiva (secundário com texto `danger` e hover `danger-soft`) e destrutivo (`danger` preenchido, somente no ponto de confirmação).
- Planos: sem sombra nem relevo; pressionado por cor. Filtro alternado pressionado usa `selected`.
- Alturas conforme os fundamentos (`32`, `36`, `40px`; `44px` em `pointer: coarse`); raio `control`; texto `button`.
- Estados: padrão, hover, foco, pressionado, carregando (indicador no lugar do ícone, rótulo mantido) e desabilitado (sem opacidade).
- Botão iconográfico sempre possui nome acessível e tooltip quando o significado não for evidente.
- As variantes de botão são declaradas com `tailwind-variants`; `tailwind-merge` resolve classes conflitantes recebidas pelo componente.

### Campos

- Rótulo permanece visível; placeholder não substitui rótulo.
- Limite `control-border`; foco com borda e anel de 1px `focus`; somente leitura em `surface-muted` com texto `foreground`.
- Checkbox e switch marcados usam `selected`; chip pressionado usa `selected-soft`, borda `selected-border` e marca ✓.
- Ajuda e erro aparecem abaixo do controle e são associados programaticamente.
- Erro usa borda `danger`, ícone e texto.
- Ação em envio impede submissão duplicada sem apagar valores.

### Badges

- Famílias: `success`, `info`, `neutral`, `warning`, `danger` e `attention`, conforme o mapeamento dos fundamentos.
- Badge de estado: 20px, raio `badge`, fundo suave, texto da família e ponto. Tag de metadado: contorno `border-strong`, texto `foreground-soft` e ícone.
- Estados de negócio possuem texto explícito; cor não é o único indicador.

### Tabelas

- Tabela dentro de um painel com borda, sem sombra, com barra de filtros no topo e rodapé com contagem.
- Abas de estado mostram a contagem de cada estado e ficam na mesma barra da busca local.
- Cabeçalho de 36px em `table-header` com base `border`; linhas de 48px em todas as listagens; padding de célula de 16px; hover `surface-muted`; sem zebra; números alinhados à direita.
- Nome da entidade em peso 600. Entidades (parceiros, planos) usam quadrado de iniciais com raio `control`; pessoas usam avatar circular `identity`.
- O carregamento preserva a barra e o cabeçalho, com skeleton nas linhas.
- O vazio distingue "nenhum cadastro" (explicação e ação permitida, secundária quando a página já possui a primária) de "nenhum resultado" (com limpeza dos filtros).
- Filtros por estado atuam sobre a coleção carregada, conforme a especificação funcional.
- A linha inteira abre o registro. A ação mais frequente fica visível como botão compacto; o menu contextual reúne apenas o que não está visível (mudanças de estado e, separadas, as destrutivas) e não aparece quando ficaria vazio.
- O rodapé mostra somente a contagem (`N itens` ou `N de M itens`).
- No mobile, a tabela preserva sua estrutura com rolagem horizontal; a coluna de identificação pode permanecer fixa quando necessário.

### Dialogs

- `Drawer` e `DetailDrawer` são sheets laterais compostos com Radix Dialog; atendem, respectivamente, formulários curtos e detalhes somente leitura. Usam `shadow-overlay`, sem raio.
- `ConfirmDialog` usa Radix Alert Dialog para confirmações sensíveis e não permite fechamento acidental por overlay ou Escape. Em confirmações destrutivas, um ícone `danger` acompanha o título neutro e o corpo descreve a consequência.
- Dialogs e sheets possuem título, fechamento explícito, contenção e restauração de foco administradas pela primitive.

### Menus contextuais

- `RowMenu` usa Radix Dropdown Menu para posicionamento, foco e navegação por teclado.
- Superfície `surface`, borda `border`, raio `tile` e `shadow-floating`; item de 32px com raio `badge` e destaque `surface-muted`.
- Itens perigosos mantêm texto e tom destrutivo; divisores continuam sendo declarados no contrato local do menu.

### Feedback

- Skeleton representa carregamento estrutural.
- Indicador local representa mutação pontual.
- Estado vazio explica a ausência e apresenta apenas a ação permitida, sem caixa tracejada.
- Erro persistente aparece junto da região afetada; toast apenas complementa.
- Toasts de sucesso usam Radix Toast, são inversos (`inverse`, ícone `signal-inverse`, raio `tile`), dispensáveis e de duração curta; erros não dependem exclusivamente deles.
- Conflito de versão interrompe a edição silenciosa e oferece reconciliação com o servidor.
- Toast pode trazer uma ação de continuidade (botão compacto no próprio toast).
- **Barra de salvamento:** faixa fixa no rodapé do conteúdo (`surface`, borda superior `border`, `shadow-floating`) visível somente com alterações pendentes; à esquerda o indicador "Alterações não salvas" (`warning`) e o resumo, à direita "Descartar" (quiet) e a ação primária. Usada em formulários longos (parceiro, usuário).
- **Copiar:** botão compacto com ícone; após copiar, troca para "Copiado" com ícone de confirmação por cerca de 2s, sem toast.

## Padrões por contexto

### Kanban

- Barra de filtros dentro de um painel com borda, acima do quadro.
- Colunas `surface-muted` de largura legível e rolagem horizontal quando necessário.
- Cartão com raio `tile`, sem sombra: nome (600), WhatsApp, novo interesse e, abaixo de uma divisória, origem e responsável.
- Novo interesse: rótulo `attention-foreground` com ponto `signal`.
- Etapas abertas sem cor própria; desfechos conforme as famílias de estado.
- Arrastar não substitui a ação acessível `Alterar etapa`.
- Estado otimista é visualmente discreto; falha restaura o estado confirmado e apresenta erro junto ao quadro.

### Formulário de parceiro

- Navegação interna apresenta seção atual, erros, completude e alterações não salvas.
- O formulário não simula um fluxo linear e realiza um único salvamento atômico.
- Sair com alterações pendentes exige confirmação.
- Salvar e descartar ficam na barra de salvamento; publicar e mudanças de estado ficam no resumo lateral.
- Benefícios: caixa de seleção com o nome do plano na primeira coluna.

## Como usar

O protótipo navegável é a referência de construção das telas: a implementação reproduz sua estrutura, seus componentes e seus estados, aplicando os tokens do arquivo `tailwind.css` por meio de utilidades Tailwind. Componentes consomem papéis semânticos (`bg-surface`, `text-muted-foreground`, `rounded-control`, `shadow-floating`…), nunca degraus de foundation nem valores literais.
