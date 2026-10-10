# Dashboard — design system

**Estado:** Proposto para validação visual  
**Protótipo:** [dashboard](../../../prototypes/dashboard/index.html)

Este documento complementa a [interface do dashboard](../interface.md) sem alterar seus fluxos, módulos ou arquitetura.

## Direção

O dashboard adota linguagem compacta de produto SaaS maduro: hierarquia direta, superfícies claras, alta legibilidade, bordas discretas e baixa ornamentação. A identidade do Clube Flex aparece no verde institucional e em usos pontuais do coral, sem reproduzir a expressão editorial ampla do catálogo.

### Princípios de composição

- **Moldura escura, conteúdo claro:** a sidebar escura ancora a navegação e separa a estrutura do sistema da área de trabalho; o conteúdo permanece em superfícies claras sobre fundo neutro.
- **Densidade com função:** linhas de tabela, cartões e controles compactos; espaço vazio só quando separa grupos de informação.
- **Hierarquia em três níveis:** título de página, título de card com descrição curta e conteúdo. Cada card tem cabeçalho próprio, separado do corpo por divisória.
- **Controles junto aos dados:** filtros, abas de estado e busca ficam na barra do próprio card que afetam.
- **Cor reservada a significado:** verde institucional para ação primária e item ativo; cores semânticas apenas em estados; o coral sinaliza novo interesse.
- **Composição assimétrica:** páginas de detalhe usam coluna principal e coluna lateral de apoio, em vez de grades uniformes de cards.
- **Sem painel de métricas:** a densidade se aplica às telas operacionais existentes, sem criar indicadores não aprovados.

## Foundations

### Cores

| Token | Valor proposto | Uso |
| --- | --- | --- |
| \`canvas\` | \`#f4f5f3\` | Fundo geral |
| \`surface\` | \`#ffffff\` | Topbar, cards, tabelas, formulários e dialogs |
| \`surface-subtle\` | \`#f0f2ef\` | Seletores segmentados, campos somente leitura e estados neutros |
| \`border\` | \`#e3e6e2\` | Divisórias e contornos |
| \`border-strong\` | \`#cfd5d0\` | Contorno de controles |
| \`text\` | \`#151916\` | Texto principal |
| \`text-muted\` | \`#646d67\` | Texto auxiliar |
| \`nav-bg\` | \`#0f1613\` | Fundo da sidebar e do painel lateral de acesso |
| \`nav-text\` | \`#b3bcb6\` | Itens da sidebar |
| \`nav-active\` | \`#86d3ad\` | Item ativo e marca sobre fundo escuro |
| \`primary\` | \`#0b3d2e\` | Ações primárias |
| \`primary-subtle\` | \`#e6f0eb\` | Seleções e avatares |
| \`brand-accent\` | \`#b8482c\` | Destaques de marca, nunca erro |
| \`info\` | \`#2563eb\` | Informação |
| \`success\` | \`#16815d\` | Sucesso e estados positivos |
| \`warning\` | \`#b7791f\` | Atenção e pendência |
| \`danger\` | \`#c23b33\` | Erro e ações destrutivas |
| \`focus\` | \`#2563eb\` | Indicador de foco |

Todos os pares de texto e fundo devem ser verificados quanto a contraste antes da aprovação final.

### Tipografia

- Família principal: \`DM Sans\`; \`Fraunces\` apenas nas telas de acesso.
- Título de página: \`22px/28px\`, peso 700.
- Título de card: \`14.5px/20px\`, peso 600, com descrição de \`12.5px\` em texto auxiliar.
- Corpo e controles: \`14px/20px\`, peso 400 ou 500.
- Cabeçalho de tabela, rótulo e metadado: \`12–13px\`, peso 500.
- Rótulo de grupo da sidebar: \`11px\`, maiúsculas, espaçamento \`0.08em\`.
- Dados numéricos usam algarismos tabulares quando a fonte e o contexto permitirem.

### Layout

- Sidebar desktop: \`236px\`, escura e fixa, com grupos rotulados e item ativo indicado por fundo, cor e marcador lateral; pode ser recolhida para trilho de ícones de \`68px\`.
- Rodapé da sidebar: identidade do usuário com acessos a \`Alterar senha\` e \`Sair\`.
- Topbar: \`60px\`, com controle de recolhimento e trilha de navegação (área / página / registro).
- Cabeçalho de página: compacto, com título e descrição de uma linha à esquerda e ação principal à direita; páginas de detalhe incluem retorno à listagem.
- Conteúdo: fluido, com \`24px\` de margem no desktop e \`16px\` no celular.
- Formulários longos: largura de leitura limitada, preservando áreas laterais de navegação ou resumo quando aprovadas.
- No mobile, a sidebar vira menu sobreposto acionado pelo cabeçalho.

## Componentes

### Botões

- Variantes: primário, secundário, silencioso e destrutivo.
- Tamanhos: compacto \`28px\`, padrão \`34px\` e móvel \`44px\`.
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
- Linhas de \`48px\`, cabeçalho sem preenchimento, divisórias discretas e números alinhados à direita.
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
- Arrastar não substitui a ação acessível \`Alterar etapa\`.
- Estado otimista é visualmente discreto; falha restaura o estado confirmado e apresenta erro junto ao quadro.

### Formulário de parceiro

- Navegação interna apresenta seção atual, erros, completude e alterações não salvas.
- O formulário não simula um fluxo linear e realiza um único salvamento atômico.
- Sair com alterações pendentes exige confirmação.

## Estado de aprovação

Os tokens e padrões permanecem propostos até a revisão visual do protótipo. A aprovação deste documento não autoriza implementação de produção.
