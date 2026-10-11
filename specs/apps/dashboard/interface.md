# Dashboard — interface

**Etapa:** 09 — Interface  
**Estado:** Aprovado

## Navegação

A navegação lateral é agrupada por responsabilidade:

- **Comercial:** Leads e Origens.
- **Catálogo:** Parceiros, Planos e Categorias.
- **Administração:** Usuários e Auditoria.
- **Conta:** Alterar senha e Sair.

- Permissões são administradas no detalhe do usuário, sem página isolada.
- Itens sem permissão de visualização são ocultados, mas a API continua sendo a autoridade de acesso.
- Não haverá página inicial de métricas sem indicadores de negócio aprovados.
- Após autenticação, o usuário segue para o primeiro módulo que possui permissão para visualizar.

## Direção visual

- Aparência funcional e menos decorativa que o catálogo público.
- Tipografia, paleta e escalas vêm dos [fundamentos de interface](../ui-foundations.md) e do arquivo de tokens; `Geist` é a família única.
- A estrutura de telas, componentes e estados segue o [protótipo do dashboard](../../prototypes/dashboard/index.html), com prioridade para legibilidade, densidade controlada e estados operacionais claros.
- O dashboard não possui compromisso formal WCAG nesta entrega, mas mantém práticas básicas de teclado, foco, rótulos e contraste.

## Acesso sem sessão

- Login, ativação, solicitação de recuperação e definição de nova senha utilizam layout simples e centralizado.
- A navegação interna não é exibida antes da autenticação.
- Erros de credenciais usam mensagem neutra.
- Solicitar recuperação nunca confirma se a conta existe, possui e-mail ou está ativa.
- Critérios da senha são apresentados antes da submissão e erros permanecem associados ao campo correspondente.

## Leads

- O pipeline utiliza quadro Kanban com as cinco etapas fixas.
- A movimentação ocorre exclusivamente pelo arraste do cartão entre as colunas, incluindo o sensor de teclado do Kanban; não há botão ou dialog de seleção manual de etapa.
- Cada coluna apresenta o nome da etapa e a quantidade de leads.
- Em larguras insuficientes, o quadro utiliza rolagem horizontal e preserva a largura legível dos cartões.
- Cada cartão apresenta nome, WhatsApp, origem, responsável e indicador de novo interesse pendente.
- Selecionar o cartão abre uma página própria de detalhe, não um modal.
- O detalhe reúne dados, etapa, responsável, observações, solicitações de contato pendentes e histórico.
- Soltar em `converted` ou `lost` exige confirmação; ao mover para `lost`, a confirmação permite informar o motivo opcional.
- As demais mudanças de etapa são aplicadas diretamente.
- O cartão é atualizado no cache com a representação completa retornada pela mutação.
- Falhas restauram o estado confirmado e exibem mensagem acionável próxima ao quadro; um toast pode complementar, mas não é o único feedback.
- Conflitos de versão informam que outra pessoa alterou o lead e impedem sobrescrita silenciosa.

## Parceiros

O formulário do agregado é dividido em:

1. Dados principais.
2. Categorias e contatos.
3. Unidades.
4. Benefícios e cupons.
5. Publicação.

Em desktop, as seções utilizam navegação lateral interna, sem transformar o formulário em um assistente linear. O salvamento continua sendo uma única operação atômica do agregado completo.

A navegação interna informa:

- seção atual;
- seção com erro;
- seção completa;
- existência de alterações ainda não salvas.

Ao tentar sair do formulário com alterações não salvas, o dashboard solicita confirmação.

## Listagens administrativas

- Parceiros, planos, categorias, origens e usuários utilizam tabelas sem paginação.
- A ordem inicial é alfabética.
- Filtros por estado operam localmente sobre a coleção completa já carregada.
- Estado e ações permitidas são apresentados em cada linha.
- Planos, categorias e origens usam formulário em dialog lateral por possuírem poucos campos.
- Parceiros, usuários e leads utilizam páginas próprias.

## Usuários

A página de detalhe reúne:

- dados da conta;
- estado e situação do acesso;
- permissões individuais agrupadas por área;
- emissão de código de ativação ou recuperação;
- ativação ou desativação.

Detalhes de recursos administrativos seguem o comportamento comum abaixo:

- o recurso é carregado antes da composição da page;
- um identificador inexistente retorna à listagem da feature;
- falhas de rede ou servidor exibem erro acionável com nova tentativa;
- o detalhe continua refletindo as respostas confirmadas das mutações pelo
  cache do TanStack Query.

## Auditoria

- Tabela paginada com filtros na parte superior: período, ação, autor e usuário afetado. As listas de autor e usuário afetado dependem de `users.view`; sem ela, somente período e ação são exibidos.
- Evento selecionado é exibido em dialog lateral somente para leitura.
- Valores anterior e novo são apresentados de forma legível, sem permitir edição.

## Confirmações e feedback

- Exclusão, anonimização, desativação e outras ações sensíveis exigem confirmação que descreva o efeito.
- Não é necessário digitar o nome do recurso para confirmar nesta entrega.
- Erros de campo aparecem junto ao respectivo controle.
- Erros gerais aparecem no início do formulário ou junto à área afetada.
- Sucesso pode usar toast curto.
- Toast não é a única forma de comunicar erros.
- Botões indicam processamento e impedem submissão duplicada.
- Skeleton é usado em carregamentos estruturais.
- Estados vazios explicam o que falta e oferecem a ação que o usuário possui permissão para executar.

## Pendências

- A logo oficial permanece como pendência não bloqueante, conforme [fundamentos compartilhados](../ui-foundations.md).
