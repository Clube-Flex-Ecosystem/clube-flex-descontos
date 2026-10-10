# Dashboard — design system

**Estado:** Tokens aprovados (2026-10-10); padrões de componentes em validação visual sobre o protótipo  
**Protótipo:** [dashboard](../../../prototypes/dashboard/index.html)  
**Tokens:** [`tailwind.css`](../../../../apps/dashboard/src/styles/tailwind.css)

Este documento complementa a [interface do dashboard](../interface.md) e os [fundamentos compartilhados](../../ui-foundations.md) sem alterar fluxos, módulos ou arquitetura. Valores (cores, tamanhos, sombras) vivem somente no arquivo de tokens; aqui constam apenas papéis e padrões, para evitar duplicação.

## Direção

O dashboard adota linguagem compacta de produto SaaS maduro: hierarquia direta, superfícies claras, alta legibilidade, bordas discretas e baixa ornamentação. A identidade do Clube Flex aparece no laranja de ação e em usos pontuais do gradiente da marca.

### Princípios de composição

- **Moldura escura, conteúdo claro:** a sidebar navy ancora a navegação e separa a estrutura do sistema da área de trabalho; o conteúdo permanece em superfícies claras sobre fundo neutro.
- **Densidade com função:** linhas de tabela, cartões e controles compactos; espaço vazio só quando separa grupos de informação.
- **Hierarquia em três níveis:** título de página, título de card com descrição curta e conteúdo. Cada card tem cabeçalho próprio, separado do corpo por divisória.
- **Controles junto aos dados:** filtros, abas de estado e busca ficam na barra do próprio card que afetam.
- **Cor reservada a significado:** laranja para ação primária e item ativo; cores semânticas apenas em estados; o acento sinaliza novo interesse.
- **Composição assimétrica:** páginas de detalhe usam coluna principal e coluna lateral de apoio, em vez de grades uniformes de cards.
- **Sem painel de métricas:** a densidade se aplica às telas operacionais existentes, sem criar indicadores não aprovados.

## Fundamentos

### Papéis de cor

| Papel | Tokens | Uso |
| --- | --- | --- |
| Fundo e superfícies | `background`, `surface`, `surface-muted`, `surface-hover` | Fundo geral; topbar, cards, tabelas e dialogs; seletores segmentados e campos somente leitura; hover de linhas |
| Bordas | `border`, `border-strong`, `control-border`, `control-border-hover` | Divisórias e contornos de cards; contorno de controles |
| Texto | `foreground`, `muted-foreground` | Texto principal e auxiliar |
| Navegação | `sidebar`, `sidebar-foreground`, `sidebar-muted`, `sidebar-hover`, `sidebar-active`, `sidebar-border` | Sidebar e item ativo |
| Ação | `primary`, `primary-raised`, `primary-edge`, `primary-hover`, `primary-active`, `primary-foreground` | Botão primário e estados |
| Marca e destaque | `accent`, `accent-soft`, `accent-subtle`, `accent-foreground`, `brand-gradient-*` | Novo interesse, marcas, texto de destaque |
| Estado | `success`, `warning`, `danger`, `info` (e `*-soft`) | Sucesso, atenção, erro e informação |
| Foco | `focus`, `focus-ring`, `danger-ring` | Indicador de foco e de erro em campos |

O acento de marca não é usado para erro. Todos os pares de texto e fundo devem ser verificados quanto a contraste (ver [fundamentos](../../ui-foundations.md)).

### Tipografia

- Família única: `Geist`.
- Títulos e textos seguem a escala dos fundamentos: página, seção, card, corpo, auxiliar, rótulo e legenda.
- Rótulo de grupo da sidebar: legenda em maiúsculas com espaçamento ampliado.
- Dados numéricos usam algarismos tabulares.

### Layout

- Sidebar desktop escura e fixa, com grupos rotulados e item ativo indicado por fundo, cor e marcador lateral; pode ser recolhida para trilho de ícones.
- Rodapé da sidebar: identidade do usuário com acessos a `Alterar senha` e `Sair`.
- Topbar com controle de recolhimento e trilha de navegação (área / página / registro).
- Cabeçalho de página compacto, com título e descrição de uma linha à esquerda e ação principal à direita; páginas de detalhe incluem retorno à listagem.
- Conteúdo fluido, com margem de `24px` no desktop e `16px` no celular.
- Formulários longos: largura de leitura limitada, preservando áreas laterais de navegação ou resumo quando aprovadas.
- No mobile, a sidebar vira menu sobreposto acionado pelo cabeçalho.

## Componentes

### Botões

- Variantes: primário, secundário, silencioso e destrutivo.
- Alturas conforme os fundamentos (`32`, `36`, `40px`; `44px` no móvel).
- Estados: padrão, hover, foco, pressionado, carregando e desabilitado.
- Botão iconográfico sempre possui nome acessível e tooltip quando o significado não for evidente.

### Campos

- Rótulo permanece visível; placeholder não substitui rótulo.
- Ajuda e erro aparecem abaixo do controle e são associados programaticamente.
- Erro usa texto e ícone além da cor.
- Ação em envio impede submissão duplicada sem apagar valores.

### Badges

- Variantes semânticas: neutro, informação, sucesso, atenção e perigo.
- Estados de negócio possuem texto explícito; cor não é o único indicador.

### Tabelas

- Tabela dentro de card, com barra de filtros no topo e rodapé com contagem.
- Abas de estado mostram a contagem de cada estado e ficam na mesma barra da busca local.
- Linhas conforme os fundamentos, cabeçalho sem preenchimento, divisórias discretas e números alinhados à direita.
- Filtros por estado atuam sobre a coleção carregada, conforme a especificação funcional.
- Ação principal fica visível; ações menos frequentes usam menu contextual.
- No mobile, a tabela preserva sua estrutura com rolagem horizontal; a coluna de identificação pode permanecer fixa quando necessário.

### Dialogs

- Dialog lateral atende formulários curtos e detalhes somente leitura.
- Dialog central atende confirmações sensíveis.
- Ambos contêm título, fechamento explícito, contenção de foco e restauração do foco de origem.

### Feedback

- Skeleton representa carregamento estrutural.
- Indicador local representa mutação pontual.
- Estado vazio explica a ausência e apresenta apenas a ação permitida.
- Erro persistente aparece junto da região afetada; toast apenas complementa.
- Conflito de versão interrompe a edição silenciosa e oferece reconciliação com o servidor.

## Padrões por contexto

### Kanban

- Colunas de largura legível e rolagem horizontal quando necessário.
- Cartão compacto com nome, WhatsApp, origem, responsável e novo interesse.
- Arrastar não substitui a ação acessível `Alterar etapa`.
- Estado otimista é visualmente discreto; falha restaura o estado confirmado e apresenta erro junto ao quadro.

### Formulário de parceiro

- Navegação interna apresenta seção atual, erros, completude e alterações não salvas.
- O formulário não simula um fluxo linear e realiza um único salvamento atômico.
- Sair com alterações pendentes exige confirmação.

## Como usar

O protótipo navegável é a referência de construção das telas: a implementação reproduz sua estrutura, seus componentes e seus estados, aplicando os tokens do arquivo `tailwind.css` por meio de utilidades Tailwind. Telas ainda não implementadas (leads, parceiros, planos, categorias, usuários, auditoria) seguem o protótipo quando seus incrementos forem executados.
