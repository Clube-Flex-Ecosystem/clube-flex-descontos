# Dashboard — interface

**Etapa:** 09 — Interface  
**Estado:** Aprovado  
**Última revisão:** 2026-10-11 — fluxos e interação, conforme a [auditoria de UX aprovada](../../prototypes/dashboard/proposals/2026-10-ux-fluxos/README.md).

## Processo de alteração

Alterações de UI do dashboard começam exclusivamente no [protótipo navegável](../../prototypes/dashboard/index.html).
Depois de revisadas e aprovadas, são aplicadas em `apps/dashboard/`. Não se
deve definir uma alteração diretamente no app. O fluxo completo está
documentado no [processo de evolução da interface](../../ui-change-process.md).

O protótipo é a fonte da verdade da construção da interface: tudo o que ele
demonstra (componentes, ações, estados e interações) deve existir no app, nos
limites das capacidades da API.

## Navegação

A navegação lateral é agrupada por responsabilidade:

- **Comercial:** Leads e Origens.
- **Catálogo:** Parceiros, Planos e Categorias.
- **Administração:** Usuários e Auditoria.

- O rodapé da navegação identifica a conta (iniciais, nome e nome de usuário) e oferece, por ícone, **Alterar senha** e **Sair**.
- O item Leads exibe a quantidade de leads com novo interesse pendente; com a navegação recolhida, um ponto indica a pendência.
- Em desktop, um botão na barra superior recolhe a navegação para somente ícones (`--sidebar-width-collapsed`) e a expande de novo.
- Em telas estreitas, a navegação é um painel sobreposto aberto por botão de ícone na barra superior.
- Permissões são administradas no detalhe do usuário, sem página isolada.
- Itens sem permissão de visualização são ocultados, mas a API continua sendo a autoridade de acesso.
- Não haverá página inicial de métricas sem indicadores de negócio aprovados.
- Após autenticação, o usuário segue para o primeiro módulo que possui permissão para visualizar.

## Preservação de contexto

- Filtros, busca, aba de estado e página de cada listagem são preservados **em memória durante a sessão do navegador**: ao abrir um registro e voltar (pela trilha, por "Cancelar" ou pelo navegador), a listagem reaparece como foi deixada. Recarregar a página volta aos valores padrão.
- Os filtros **não** são refletidos na URL.
- A posição de rolagem é restaurada ao voltar a uma página já visitada.

## Direção visual

- Aparência funcional e menos decorativa que o catálogo público.
- Tipografia, paleta e escalas vêm dos [fundamentos do dashboard](../ui-foundations.md#fundamentos-do-dashboard) e do arquivo de tokens: moldura navy (sidebar escura) com conteúdo claro, laranja para ação, posição e seleção, `Archivo` para texto e pilha monoespaçada do sistema para identificadores (direção A, aprovada em 2026-10-11).
- A estrutura de telas, componentes e estados segue o [protótipo do dashboard](../../prototypes/dashboard/index.html), com prioridade para legibilidade, densidade controlada e estados operacionais claros.
- O dashboard não possui compromisso formal WCAG nesta entrega, mas mantém práticas básicas de teclado, foco, rótulos e contraste.

## Acesso sem sessão

- Login, ativação, solicitação de recuperação e definição de nova senha usam duas colunas: painel navy com a marca e uma frase institucional, e o formulário centralizado na coluna clara. Em telas estreitas o painel é ocultado.
- A navegação interna não é exibida antes da autenticação.
- Erros de credenciais usam mensagem neutra.
- Solicitar recuperação nunca confirma se a conta existe, possui e-mail ou está ativa.
- Critérios da senha são apresentados antes da submissão, como lista que marca cada critério verificável enquanto a pessoa digita; erros permanecem associados ao campo correspondente.

## Leads

### Quadro

- O pipeline utiliza quadro Kanban com as cinco etapas fixas.
- A etapa muda pelo arraste do cartão entre as colunas (inclusive pelo sensor de teclado) ou pelo botão "Alterar etapa" do cartão, que abre o dialog de etapa.
- Soltar em "Convertido" ou "Perdido" abre o dialog de etapa já preenchido com o destino; as demais mudanças por arraste são aplicadas diretamente.
- Cada coluna apresenta o nome da etapa e a quantidade de leads; dentro da coluna, leads com novo interesse pendente aparecem primeiro.
- Em larguras insuficientes, o quadro utiliza rolagem horizontal e preserva a largura legível dos cartões.
- Cada cartão apresenta nome, WhatsApp, origem, responsável e indicador de novo interesse pendente. O cartão inteiro abre a página de detalhe do lead.
- Filtros: busca por nome, WhatsApp ou e-mail; responsável (todos, meus, sem responsável e as pessoas presentes nos leads carregados — oculto para quem só vê os próprios leads); origem; "Novo interesse" com a contagem. "Limpar filtros" aparece quando há filtro ativo.
- Sem resultado para os filtros, o quadro é substituído por um estado vazio com "Limpar filtros".
- O cartão é atualizado no cache com a representação completa retornada pela mutação.
- Falhas restauram o estado confirmado e exibem mensagem acionável próxima ao quadro, que pode ser dispensada ("Entendi"); um toast pode complementar, mas não é o único feedback.
- Conflitos de versão informam que outra pessoa alterou o lead e impedem sobrescrita silenciosa.

### Dialog de etapa

- Mostra a etapa atual, um seletor com as demais etapas e, para "Perdido", o motivo opcional.
- Para "Convertido" ou "Perdido", informa que o lead pode ser reaberto depois e o botão nomeia a confirmação ("Confirmar conversão", "Confirmar perda").
- É o mesmo dialog no cartão do quadro e no detalhe.

### Novo lead

- Dialog lateral com nome, WhatsApp (dica "Com DDD"), e-mail opcional, origem, detalhe da origem, quem indicou (quando a origem exige) e responsável (a própria conta ou sem responsável).
- A última origem escolhida é lembrada durante a sessão do navegador; na primeira abertura nenhuma origem vem selecionada.
- WhatsApp já cadastrado é informado no campo, com o nome do lead quando ele está entre os já carregados e o link "Abrir lead existente".
- Depois de criar, o toast oferece "Abrir lead".

### Detalhe

- Selecionar o cartão abre uma página própria de detalhe, não um modal.
- Cabeçalho: nome, etapa, indicador de novo interesse, WhatsApp e origem; ações "Editar dados" e "Alterar etapa" (principal).
- Novo interesse pendente aparece em faixa de atenção no topo, somente enquanto existir, com "Marcar como tratada".
- Observações: o campo de registro fica no topo do cartão; a lista mostra a mais recente primeiro, com autor e data; o autor pode corrigir a própria observação, e a versão anterior permanece no histórico.
- Histórico: frases legíveis (quem fez o quê); exibe os eventos mais recentes e "Ver histórico completo".
- Solicitações já tratadas ficam em seção recolhida, com quem tratou e quando.
- Coluna lateral: dados do lead (WhatsApp com "Copiar", e-mail, origem, detalhe da origem, quem indicou e motivo da perda quando houver), responsável e privacidade.
- Responsável: com permissão de atribuição, seletor de responsável e "Atribuir a mim" quando o lead não é seu; sem essa permissão, o responsável atual pode "Devolver lead".
- "Editar dados" abre dialog lateral com nome, WhatsApp, e-mail, origem e detalhes; a troca de origem é preservada no histórico.
- Erros e conflitos aparecem junto à área afetada; conflitos oferecem "Carregar versão atual".

## Parceiros

O formulário do agregado é dividido em:

1. Dados principais.
2. Categorias e contatos.
3. Unidades.
4. Benefícios e cupons.
5. Publicação.

Em desktop, as seções utilizam navegação lateral interna, sem transformar o formulário em um assistente linear. O salvamento continua sendo uma única operação atômica do agregado completo.

A navegação interna informa:

- seção atual, acompanhando a rolagem;
- seção com erro;
- seção completa;
- existência de alterações ainda não salvas.

- Salvar fica em uma barra fixa no rodapé do conteúdo, visível enquanto houver alterações não salvas (e sempre no cadastro), com "Descartar" e "Salvar". O cabeçalho não repete essas ações.
- Publicar, republicar, enviar para rascunho e desativar ficam no resumo lateral e exigem que as alterações estejam salvas. Salvar e publicar são ações separadas.
- Benefícios: cada plano é habilitado por uma caixa de seleção na primeira coluna, junto ao nome; ao habilitar, o foco vai ao percentual. Nenhum percentual é sugerido.
- Unidades: "Adicionar unidade" fica no cabeçalho da seção; a linha oferece "Editar"; "Remover unidade" fica dentro da edição, separado; uma unidade removida permanece indicada com "Desfazer" até o salvamento.
- Ao tentar sair do formulário com alterações não salvas, o dashboard solicita confirmação.

## Listagens administrativas

- Parceiros, planos, categorias, origens e usuários utilizam tabelas sem paginação, com abas de estado e busca locais.
- A ordem inicial é alfabética. O rodapé apresenta somente a contagem.
- Filtros por estado operam localmente sobre a coleção completa já carregada.
- A linha inteira abre o registro. O botão visível da linha é a ação mais frequente (Editar ou Abrir); o menu "…" contém apenas ações que não estão visíveis — mudanças de estado e, separadas, as destrutivas. Sem itens, o menu não aparece.
- Estado vazio por filtro oferece "Limpar filtros"; estado vazio por coleção vazia oferece a criação permitida.
- Planos mostram a quantidade de parceiros com benefício; categorias, a quantidade de parceiros associados. As contagens vêm da coleção de parceiros e só aparecem para quem pode visualizá-los.
- Origens: a origem automática exibe "Protegida" e não é editável; origens nunca utilizadas podem ser excluídas pelo menu.
- Planos, categorias e origens usam formulário em dialog lateral por possuírem poucos campos, incluindo o interruptor "Ativo". Desativar pelo dialog pede a mesma confirmação da ação do menu.
- Parceiros, usuários e leads utilizam páginas próprias.

## Usuários

A página de detalhe reúne:

- dados da conta;
- estado e situação do acesso;
- permissões individuais agrupadas por área, com "Marcar todas"/"Desmarcar todas" por área limitado às permissões que o autor pode conceder;
- emissão de código de ativação ou recuperação;
- ativação ou desativação.

- Código emitido sem envio por e-mail aparece em faixa no topo da página, com "Copiar código", e não é exibido de novo.
- Salvar fica na barra fixa de alterações, com o resumo de permissões concedidas e revogadas, "Descartar" e "Salvar alterações".
- Sair com alterações não salvas pede confirmação.

Detalhes de recursos administrativos seguem o comportamento comum abaixo:

- o recurso é carregado antes da composição da page;
- um identificador inexistente retorna à listagem da feature;
- falhas de rede ou servidor exibem erro acionável com nova tentativa;
- o detalhe continua refletindo as respostas confirmadas das mutações pelo
  cache do TanStack Query.

## Auditoria

- Tabela paginada com filtros na parte superior: período, ação, autor e usuário afetado. As listas de autor e usuário afetado dependem de `users.view`; sem ela, somente período e ação são exibidos.
- Trocar filtro ou página mantém a barra e a tabela anterior esmaecida com indicador até a nova página chegar.
- "Limpar filtros" aparece quando algum filtro difere do padrão e no estado vazio.
- Evento selecionado é exibido em dialog lateral somente para leitura.
- Valores anterior e novo são apresentados de forma legível, sem permitir edição.

## Confirmações e feedback

- Exclusão, anonimização, desativação e outras ações sensíveis exigem confirmação que descreva o efeito.
- Não é necessário digitar o nome do recurso para confirmar nesta entrega.
- Erros de campo aparecem junto ao respectivo controle.
- Erros gerais aparecem no início do formulário ou junto à área afetada; em dialogs, dentro do próprio dialog.
- Sucesso pode usar toast curto, que pode oferecer uma ação de continuidade (por exemplo, "Abrir lead").
- Toast não é a única forma de comunicar erros.
- Botões indicam processamento e impedem submissão duplicada.
- "Copiar" confirma no próprio botão ("Copiado") por alguns segundos, sem toast.
- Skeleton é usado em carregamentos estruturais.
- Estados vazios explicam o que falta e oferecem a ação que o usuário possui permissão para executar.

## Pendências

- A logo oficial permanece como pendência não bloqueante, conforme [fundamentos compartilhados](../ui-foundations.md).
