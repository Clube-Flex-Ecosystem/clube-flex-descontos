# Casos de uso

**Etapa:** 04 — Casos de uso  
**Estado:** Aprovada  
**Referências:** [Visão geral](overview.md) · [Requisitos](requirements.md) · [Regras de negócio](business-rules.md)

## Atores

### Visitante

Pessoa que acessa o site público. Pode ser assinante ou potencial cliente, mas o sistema não conhece nem valida essa condição nesta entrega.

### Usuário interno

Pessoa autenticada no dashboard. Suas ações são determinadas pelas permissões individuais; funções organizacionais como vendedor e supervisora não são papéis fixos do sistema.

### Usuário autorizado

Especialização contextual de usuário interno: significa que a pessoa possui todas as permissões exigidas pelo caso de uso em questão.

## Inventário

| ID | Caso de uso | Ator principal | Estado |
| --- | --- | --- | --- |
| UC-001 | Consultar catálogo por plano | Visitante | Aprovado |
| UC-002 | Filtrar parceiros por categoria | Visitante | Aprovado |
| UC-003 | Consultar detalhes e instruções de um parceiro | Visitante | Aprovado |
| UC-004 | Enviar interesse comercial | Visitante | Aprovado |
| UC-005 | Consultar instruções para se tornar parceiro | Visitante | Aprovado |
| UC-006 | Ativar conta e definir senha | Usuário interno | Aprovado |
| UC-007 | Autenticar-se no dashboard | Usuário interno | Aprovado |
| UC-008 | Recuperar acesso | Usuário interno | Aprovado |
| UC-009 | Alterar a própria senha | Usuário interno | Aprovado |
| UC-010 | Administrar planos | Usuário autorizado | Aprovado |
| UC-011 | Administrar categorias | Usuário autorizado | Aprovado |
| UC-012 | Administrar parceiros e unidades | Usuário autorizado | Aprovado |
| UC-013 | Configurar benefícios e cupons | Usuário autorizado | Aprovado |
| UC-014 | Publicar, desativar e republicar parceiro | Usuário autorizado | Aprovado |
| UC-015 | Cadastrar lead manualmente | Usuário autorizado | Aprovado |
| UC-016 | Consultar leads permitidos | Usuário interno | Aprovado |
| UC-017 | Atribuir, redistribuir ou devolver lead | Usuário autorizado | Aprovado |
| UC-018 | Atualizar lead e movimentá-lo no pipeline | Usuário autorizado | Aprovado |
| UC-019 | Registrar e corrigir observações | Usuário autorizado | Aprovado |
| UC-020 | Tratar novo interesse de lead existente | Usuário autorizado | Aprovado |
| UC-021 | Administrar origens de leads | Usuário autorizado | Aprovado |
| UC-022 | Atender revogação de consentimento | Usuário autorizado | Aprovado |
| UC-023 | Administrar usuários internos | Usuário autorizado | Aprovado |
| UC-024 | Administrar permissões individuais | Usuário autorizado | Aprovado |
| UC-025 | Consultar auditoria administrativa | Usuário autorizado | Aprovado |

## Catálogo público

### UC-001 — Consultar catálogo por plano

**Ator principal:** Visitante  
**Objetivo:** Encontrar parceiros e descontos aplicáveis ao plano que o visitante informa possuir.  
**Pré-condições:** Existem planos ativos e parceiros publicamente elegíveis.  
**Pós-condição:** O catálogo apresenta somente parceiros aplicáveis ao plano selecionado.  
**Rastreabilidade:** `RF-001`, `RF-002`; `RN-003`, `RN-013`, `RN-014`.

**Fluxo principal**

1. O visitante acessa o catálogo sem autenticação.
2. O sistema apresenta os planos ativos sem selecionar um deles.
3. O visitante escolhe seu plano.
4. O sistema lista os parceiros publicados e ativos que possuem benefício para o plano.
5. O sistema apresenta os parceiros destacados primeiro e ordena alfabeticamente cada grupo.

**Fluxos alternativos**

- `A1` — Se não houver parceiros para o plano, o sistema apresenta a mensagem de que nenhum parceiro foi encontrado.
- `A2` — Se o visitante trocar o plano, o sistema recalcula imediatamente a listagem e as condições exibidas.

### UC-002 — Filtrar parceiros por categoria

**Ator principal:** Visitante  
**Objetivo:** Restringir o catálogo a uma categoria de interesse.  
**Pré-condição:** O visitante selecionou um plano.  
**Pós-condição:** A listagem apresenta somente parceiros compatíveis com o plano e a categoria.  
**Rastreabilidade:** `RF-002`, `RF-003`; `RN-003`, `RN-013`.

**Fluxo principal**

1. O sistema apresenta as categorias ativas disponíveis.
2. O visitante seleciona uma categoria.
3. O sistema restringe a listagem aos parceiros associados à categoria e elegíveis para o plano selecionado.

**Fluxos alternativos**

- `A1` — O visitante remove o filtro e o sistema volta a mostrar todos os parceiros elegíveis para o plano.
- `A2` — Nenhum parceiro atende à combinação; o sistema apresenta estado vazio sem alterar a seleção do plano.

### UC-003 — Consultar detalhes e instruções de um parceiro

**Ator principal:** Visitante  
**Objetivo:** Conhecer o desconto e como utilizá-lo.  
**Pré-condição:** O parceiro está disponível para o plano selecionado.  
**Pós-condição:** Nenhuma alteração de dados é realizada.  
**Rastreabilidade:** `RF-004`; `RN-014`, `RN-016`, `RN-027`, `RN-028`, `RN-029`.

**Fluxo principal**

1. O visitante abre um parceiro da listagem.
2. O sistema apresenta nome, categorias, descrição e percentual aplicável ao plano selecionado.
3. O sistema apresenta instruções de uso, site e contatos disponíveis.
4. O sistema apresenta o cupom específico do plano ou, na ausência dele, o cupom geral, quando existente.
5. O sistema apresenta as unidades ativas e seus dados.
6. Quando uma unidade não possui um tipo de contato próprio, o sistema apresenta o contato geral correspondente do parceiro.

**Fluxo alternativo**

- `A1` — Se o visitante acessar diretamente o parceiro sem plano selecionado, o sistema exige a seleção antes de exibir desconto e cupom.

### UC-004 — Enviar interesse comercial

**Ator principal:** Visitante  
**Objetivo:** Solicitar contato da equipe comercial.  
**Pré-condição:** O formulário público está disponível.  
**Pós-condição:** Um lead novo é criado ou um novo interesse é registrado no lead existente, sem revelar qual situação ocorreu.  
**Rastreabilidade:** `RF-005`; `RN-006`, `RN-017`, `RN-026`; `RNF-001`, `RNF-008`.

**Fluxo principal — contato novo**

1. O visitante informa nome e WhatsApp e, opcionalmente, e-mail.
2. O visitante concorda com o uso dos dados para contato comercial.
3. O sistema valida os dados e normaliza o WhatsApp.
4. O sistema verifica que o WhatsApp ainda não pertence a um lead.
5. O sistema cria um lead na etapa `novo`, sem responsável e com origem automática `catálogo/site`.
6. O sistema registra data, horário, versão do consentimento e origem do envio.
7. O sistema apresenta uma mensagem neutra de recebimento.

**Fluxo alternativo — contato existente**

1. O sistema identifica um lead com o mesmo WhatsApp normalizado.
2. O sistema não sobrescreve dados, etapa, responsável ou origem.
3. O sistema registra a solicitação e o novo consentimento no histórico.
4. O sistema marca o lead com `novo interesse pendente`.
5. O sistema apresenta a mesma mensagem neutra do fluxo principal.

**Exceções**

- `E1` — Dados inválidos: o sistema identifica os campos que precisam ser corrigidos e não envia o formulário.
- `E2` — Consentimento ausente: o sistema não aceita o envio.

### UC-005 — Consultar instruções para se tornar parceiro

**Ator principal:** Visitante  
**Objetivo:** Descobrir como propor uma parceria ao Clube Flex.  
**Pré-condição:** Nenhuma.  
**Pós-condição:** Nenhum registro é criado no painel.  
**Rastreabilidade:** `RF-017`.

**Fluxo principal**

1. O visitante acessa a opção destinada a interessados em parceria.
2. O sistema orienta o envio para `comercial@flexcard.org.br` dos seguintes dados: nome do responsável, nome da empresa ou profissional, telefone ou WhatsApp, cidade, serviços oferecidos e breve proposta de desconto.
3. A continuidade do processo ocorre fora do sistema nesta entrega.

## Acesso interno

### UC-006 — Ativar conta e definir senha

**Ator principal:** Usuário interno  
**Objetivo:** Realizar o primeiro acesso sem que um administrador conheça sua senha.  
**Pré-condições:** A conta está ativa e um usuário autorizado emitiu um código de ativação de uso único.  
**Pós-condição:** A senha foi definida e o código não pode ser utilizado novamente.  
**Rastreabilidade:** `RF-015`; `RN-023`.

**Fluxo principal**

1. O usuário acessa o fluxo de ativação e informa o código recebido.
2. O sistema valida o código e identifica a conta.
3. O usuário define e confirma sua senha.
4. O sistema salva a credencial de forma segura e invalida o código.
5. O sistema confirma a ativação do acesso.
6. O usuário deve autenticar-se normalmente para iniciar uma sessão.

**Exceções**

- `E1` — Código inválido, expirado ou já utilizado: o sistema recusa a ativação sem revelar dados adicionais da conta.
- `E2` — Senha fora das regras de segurança: o sistema informa os critérios não atendidos.
- `E3` — Conta inativa: o sistema recusa a ativação.

### UC-007 — Autenticar-se no dashboard

**Ator principal:** Usuário interno  
**Objetivo:** Acessar o dashboard de acordo com suas permissões.  
**Pré-condição:** A conta está ativa e possui senha definida.  
**Pós-condição:** Uma sessão autenticada é iniciada.  
**Rastreabilidade:** `RF-015`, `RF-016`; `RNF-002`, `RNF-012`.

**Fluxo principal**

1. O usuário informa nome de usuário e senha.
2. O sistema valida as credenciais e o estado da conta.
3. O sistema inicia a sessão e apresenta somente as capacidades permitidas.

**Exceções**

- `E1` — Credenciais inválidas: o sistema recusa o acesso sem indicar qual campo está incorreto.
- `E2` — Conta inativa: o sistema recusa o acesso e não cria sessão.

### UC-008 — Recuperar acesso

**Ator principal:** Usuário interno  
**Objetivo:** Definir uma nova senha quando não puder acessar a conta.  
**Pré-condição:** A conta existe e está ativa.  
**Pós-condição:** A nova senha passa a ser válida e o código utilizado é invalidado.  
**Rastreabilidade:** `RF-015`; `RN-023`, `RNF-002`.

**Fluxo principal — conta com e-mail**

1. O usuário solicita recuperação e informa seu nome de usuário.
2. O sistema responde de forma neutra, sem confirmar a existência da conta.
3. Se houver conta ativa com e-mail cadastrado, o sistema envia um código de uso único.
4. O usuário informa o código e define uma nova senha.
5. O sistema invalida o código, encerra as demais sessões ativas e conclui a recuperação.

**Fluxo alternativo — conta sem e-mail**

1. O usuário solicita a recuperação a um administrador.
2. Um usuário autorizado emite um código de uso único.
3. O usuário informa o código e define uma nova senha.
4. O sistema invalida o código, encerra as demais sessões ativas e conclui a recuperação.

**Exceções**

- `E1` — Código inválido, expirado ou utilizado: o sistema recusa a redefinição.
- `E2` — Conta inativa: o acesso não pode ser recuperado até sua reativação.

### UC-009 — Alterar a própria senha

**Ator principal:** Usuário interno  
**Objetivo:** Substituir sua senha durante uma sessão autenticada.  
**Pré-condição:** O usuário possui sessão ativa.  
**Pós-condição:** A nova senha substitui a anterior.  
**Rastreabilidade:** `RF-015`; `RN-023`, `RNF-002`.

**Fluxo principal**

1. O usuário acessa as configurações da própria conta.
2. O usuário informa a senha atual, a nova senha e sua confirmação.
3. O sistema valida a senha atual e as regras da nova senha.
4. O sistema substitui a credencial, encerra as demais sessões ativas e confirma a alteração.

**Exceções**

- `E1` — Senha atual inválida: o sistema não realiza a alteração.
- `E2` — Nova senha fora das regras: o sistema informa os critérios não atendidos.

## Administração do catálogo

### UC-010 — Administrar planos

**Ator principal:** Usuário autorizado  
**Objetivo:** Manter os planos disponíveis para associação e consulta pública.  
**Pré-condição:** O usuário possui permissão para administrar planos.  
**Pós-condição:** O plano é criado, atualizado, desativado ou reativado.  
**Rastreabilidade:** `RF-010`, `RF-016`; `RN-003`, `RN-030`.

**Fluxo principal**

1. O usuário acessa a administração de planos.
2. O sistema apresenta planos ativos e inativos.
3. O usuário escolhe criar ou editar um plano.
4. O sistema valida a obrigatoriedade e a unicidade normalizada do nome.
5. O usuário salva as alterações.
6. O sistema atualiza as opções aplicáveis do dashboard e do catálogo.

**Fluxos alternativos**

- `A1` — O usuário desativa um plano; ele deixa de aparecer publicamente, preservando benefícios e cupons associados.
- `A2` — O usuário reativa um plano; suas associações preservadas voltam a ser aplicáveis.
- `A3` — Um registro nunca utilizado pode ser excluído por usuário autorizado.

**Exceções**

- `E1` — Nome vazio ou equivalente a outro plano: o sistema impede o salvamento.

### UC-011 — Administrar categorias

**Ator principal:** Usuário autorizado  
**Objetivo:** Manter as categorias utilizadas na organização e no filtro do catálogo.  
**Pré-condição:** O usuário possui permissão para administrar categorias.  
**Pós-condição:** A categoria é criada, atualizada, desativada ou reativada.  
**Rastreabilidade:** `RF-003`, `RF-011`, `RF-016`; `RN-003`, `RN-030`.

**Fluxo principal**

1. O usuário acessa a administração de categorias.
2. O sistema apresenta categorias ativas e inativas.
3. O usuário escolhe criar ou editar uma categoria.
4. O sistema valida a obrigatoriedade e a unicidade normalizada do nome.
5. O usuário salva as alterações.

**Fluxos alternativos**

- `A1` — Ao desativar uma categoria, o sistema preserva suas associações e a remove das seleções ativas e do filtro público.
- `A2` — Parceiros associados a outra categoria ativa permanecem elegíveis para publicação.
- `A3` — O usuário reativa uma categoria e suas associações preservadas voltam a ser consideradas.
- `A4` — Um registro nunca utilizado pode ser excluído por usuário autorizado.

**Exceções**

- `E1` — Nome vazio ou equivalente a outra categoria: o sistema impede o salvamento.

### UC-012 — Administrar parceiros e unidades

**Ator principal:** Usuário autorizado  
**Objetivo:** Manter os dados cadastrais dos parceiros e suas unidades.  
**Pré-condição:** O usuário possui as permissões correspondentes à ação.  
**Pós-condição:** O parceiro ou suas unidades são criados ou atualizados.  
**Rastreabilidade:** `RF-012`, `RF-013`, `RF-016`; `RN-001`, `RN-002`, `RN-027`, `RN-028`, `RN-031`, `RN-032`, `RN-033`.

**Fluxo principal — parceiro**

1. O usuário inicia o cadastro de um parceiro.
2. O usuário informa os dados cadastrais, contatos, categorias, instruções e indicador de destaque.
3. O sistema valida os campos e alerta, sem bloquear, quando identificar nome possivelmente duplicado.
4. O usuário salva o parceiro.
5. O sistema cria o registro como rascunho.

**Fluxo alternativo — unidade**

1. O usuário adiciona uma unidade ao parceiro.
2. O usuário informa identificação, endereço e, opcionalmente, contatos, horário e instruções próprios.
3. O sistema valida os campos e salva a unidade como ativa por padrão.
4. Na ausência de um tipo de contato próprio, a unidade utiliza para exibição o contato geral correspondente do parceiro.

**Fluxos alternativos adicionais**

- `A1` — O parceiro pode ser mantido sem unidade física.
- `A2` — O usuário edita um parceiro publicado; alterações válidas aparecem imediatamente no catálogo.
- `A3` — O usuário desativa ou reativa uma unidade.
- `A4` — Uma unidade nunca utilizada pode ser excluída por usuário autorizado.

**Exceções**

- `E1` — Telefone ou WhatsApp inválido: o sistema impede o salvamento.
- `E2` — Site inválido: o sistema impede o salvamento.
- `E3` — Unidade com endereço incompleto: o sistema impede seu salvamento.

### UC-013 — Configurar benefícios e cupons

**Ator principal:** Usuário autorizado  
**Objetivo:** Definir as condições oferecidas pelo parceiro para cada plano.  
**Pré-condição:** Existem parceiro e plano cadastrados, e o usuário possui permissão para editar parceiros. A administração do cadastro de planos é independente.  
**Pós-condição:** Benefícios e cupons ficam associados ao parceiro.  
**Rastreabilidade:** `RF-014`, `RF-016`; `RN-004`, `RN-014`, `RN-015`, `RN-016`, `RN-029`, `RN-034`.

**Fluxo principal**

1. O usuário acessa as condições de um parceiro.
2. O usuário escolhe um plano ativo.
3. O usuário informa um percentual inteiro entre 1 e 100.
4. Opcionalmente, informa um cupom específico para o plano.
5. Opcionalmente, informa um cupom geral do parceiro.
6. O sistema normaliza espaços externos dos cupons e salva as condições.

**Fluxos alternativos**

- `A1` — O usuário remove a condição de um plano; o parceiro deixa de aparecer para esse plano.
- `A2` — Quando existem cupom específico e geral, o específico prevalece para o plano.
- `A3` — Benefícios e cupons permanecem válidos até alteração manual.

**Exceções**

- `E1` — Percentual ausente, fracionário ou fora do intervalo: o sistema impede o salvamento.
- `E2` — Tentativa de cadastrar mais de um cupom geral ou mais de um cupom para o mesmo plano: o sistema impede o salvamento.

### UC-014 — Publicar, desativar e republicar parceiro

**Ator principal:** Usuário autorizado  
**Objetivo:** Controlar a disponibilidade pública do parceiro.  
**Pré-condição:** O usuário possui permissão para publicar e desativar parceiros.  
**Pós-condição:** O estado do parceiro e sua disponibilidade pública são atualizados.  
**Rastreabilidade:** `RF-002`, `RF-012`, `RF-014`, `RF-016`; `RN-001`, `RN-003`, `RN-005`.

**Fluxo principal — publicar**

1. O usuário solicita a publicação de um parceiro em rascunho.
2. O sistema verifica nome, descrição, instruções, contato, categoria ativa, benefício para plano ativo e completude das unidades existentes.
3. O sistema altera o estado para publicado.
4. O parceiro passa a aparecer para planos e categorias elegíveis.

**Fluxos alternativos**

- `A1` — O usuário desativa um parceiro publicado; ele sai do catálogo e suas associações são preservadas.
- `A2` — O usuário envia um parceiro desativado para rascunho.
- `A3` — O usuário republica diretamente um parceiro desativado que continua atendendo às condições.
- `A4` — Um parceiro publicado perde sua última categoria ativa ou último benefício aplicável; ele deixa automaticamente o catálogo sem perder o estado e os dados administrativos.

**Exceções**

- `E1` — Alguma condição de publicação não é atendida: o sistema mantém o estado atual e informa todas as pendências identificadas.

## Gestão comercial

### UC-015 — Cadastrar lead manualmente

**Ator principal:** Usuário autorizado  
**Objetivo:** Registrar um contato obtido fora do formulário público.  
**Pré-condição:** O usuário possui permissão para criar leads.  
**Pós-condição:** Um lead novo é criado na etapa `novo`.  
**Rastreabilidade:** `RF-006`, `RF-007`, `RF-008`, `RF-009`; `RN-008`, `RN-024`, `RN-032`.

**Fluxo principal**

1. O usuário informa nome, WhatsApp e, opcionalmente, e-mail.
2. O usuário escolhe uma origem ativa e informa seus detalhes obrigatórios.
3. O sistema normaliza e valida o WhatsApp.
4. O sistema confirma que o número ainda não pertence a outro lead.
5. O sistema cria o lead em `novo`, atribuído ao usuário autenticado.
6. O sistema registra a criação no histórico.

**Fluxos alternativos**

- `A1` — O usuário marca a opção “sem responsável”; o lead é criado sem atribuição.
- `A2` — Para origem `indicação`, o usuário identifica obrigatoriamente quem indicou.

**Exceções**

- `E1` — WhatsApp inválido: o sistema impede o cadastro.
- `E2` — WhatsApp existente: o sistema não cria nem modifica o lead e informa qual registro já utiliza o número.
- `E3` — Origem ou detalhe obrigatório ausente: o sistema impede o cadastro.

### UC-016 — Consultar leads permitidos

**Ator principal:** Usuário interno  
**Objetivo:** Visualizar os leads aos quais possui acesso.  
**Pré-condição:** O usuário está autenticado e possui alguma permissão de visualização de leads.  
**Pós-condição:** Nenhum dado é alterado.  
**Rastreabilidade:** `RF-008`, `RF-009`, `RF-016`; `RN-007`.

**Fluxo principal — próprios leads**

1. O usuário acessa a gestão de leads.
2. O sistema verifica suas permissões.
3. Com `visualizar próprios`, o sistema apresenta somente os leads atribuídos ao usuário.
4. O sistema organiza os leads pelas etapas do pipeline.

**Fluxo alternativo — visão global**

- `A1` — Com `visualizar todos`, o sistema apresenta leads de todos os responsáveis e os leads sem responsável.

### UC-017 — Atribuir, redistribuir ou devolver lead

**Ator principal:** Usuário autorizado  
**Objetivo:** Definir ou remover o responsável operacional por um lead.  
**Pré-condição:** O usuário pode visualizar o lead e possui a permissão necessária à ação.  
**Pós-condição:** O responsável é atualizado e a alteração entra no histórico.  
**Rastreabilidade:** `RF-009`, `RF-016`; `RN-006`, `RN-007`, `RN-008`, `RN-010`.

**Fluxo principal — atribuir ou redistribuir**

1. O usuário abre um lead visível.
2. O usuário escolhe um responsável ativo.
3. O sistema atualiza a atribuição.
4. O sistema registra responsável anterior, novo responsável, autor, data e horário.

**Fluxo alternativo — devolver**

1. O responsável atual devolve seu próprio lead para “sem responsável”.
2. O sistema remove a atribuição e registra a alteração no histórico.

### UC-018 — Atualizar lead e movimentá-lo no pipeline

**Ator principal:** Usuário autorizado  
**Objetivo:** Manter os dados e o estado comercial do lead.  
**Pré-condição:** O usuário pode visualizar e editar o lead conforme as regras de responsabilidade.  
**Pós-condição:** Dados ou etapa são atualizados e registrados no histórico.  
**Rastreabilidade:** `RF-008`, `RF-009`, `RF-016`; `RN-009`, `RN-032`.

**Fluxo principal**

1. O usuário abre um lead permitido.
2. O usuário corrige dados de contato ou escolhe uma etapa do pipeline.
3. O sistema valida os dados e a permissão necessária.
4. O sistema salva a alteração.
5. O sistema registra valores anterior e novo, autor, data e horário.

**Fluxos alternativos**

- `A1` — O usuário move livremente o lead entre etapas, sem sequência obrigatória.
- `A2` — O usuário marca o lead como perdido, com motivo opcional.
- `A3` — O usuário reabre um lead convertido ou perdido e escolhe a nova etapa.
- `A4` — O usuário corrige a origem; o sistema preserva a origem anterior no histórico.

**Exceções**

- `E1` — O novo WhatsApp é inválido ou já pertence a outro lead: o sistema impede a alteração.
- `E2` — O usuário não possui acesso ao lead ou à ação: o sistema recusa a alteração.

### UC-019 — Registrar e corrigir observações

**Ator principal:** Usuário autorizado  
**Objetivo:** Acrescentar informações de acompanhamento sem sobrescrever o histórico.  
**Pré-condição:** O usuário pode visualizar e editar o lead.  
**Pós-condição:** Uma observação é criada ou corrigida com rastreabilidade.  
**Rastreabilidade:** `RF-008`, `RF-016`; `RN-009`, `RN-012`, `RNF-003`.

**Fluxo principal**

1. O usuário abre um lead permitido.
2. O usuário adiciona uma observação.
3. O sistema registra conteúdo, autor, data e horário.

**Fluxo alternativo — correção**

1. O autor corrige sua própria observação.
2. O sistema preserva o conteúdo anterior e registra autor, data e horário da correção.

### UC-020 — Tratar novo interesse de lead existente

**Ator principal:** Usuário autorizado  
**Objetivo:** Avaliar uma nova solicitação pública associada a um lead existente.  
**Pré-condição:** O lead possui a marcação `novo interesse pendente`.  
**Pós-condição:** A marcação é tratada e, opcionalmente, o lead é reaberto.  
**Rastreabilidade:** `RF-005`, `RF-008`; `RN-026`, `RNF-003`.

**Fluxo principal**

1. O usuário acessa um lead sinalizado.
2. O sistema apresenta o evento do novo envio e sua evidência de consentimento.
3. O usuário avalia o contato e marca o interesse como tratado.
4. O sistema remove a pendência e registra a ação no histórico.

**Fluxo alternativo**

- `A1` — Se o lead estiver convertido ou perdido, o usuário pode reabri-lo e escolher a nova etapa antes de concluir o tratamento.

### UC-021 — Administrar origens de leads

**Ator principal:** Usuário autorizado  
**Objetivo:** Manter os tipos de origem usados pela operação comercial.  
**Pré-condição:** O usuário possui permissão para administrar origens.  
**Pós-condição:** A origem é criada, editada, desativada ou reativada.  
**Rastreabilidade:** `RF-007`, `RF-016`; `RN-011`, `RN-025`, `RN-030`.

**Fluxo principal**

1. O usuário acessa a administração de origens.
2. O sistema apresenta origens ativas e inativas.
3. O usuário cria ou edita uma origem.
4. O sistema valida a obrigatoriedade e a unicidade normalizada do nome.
5. O sistema salva a origem.

**Fluxos alternativos**

- `A1` — Uma origem nunca utilizada pode ser excluída.
- `A2` — Uma origem utilizada pode ser apenas desativada e posteriormente reativada.

**Exceções**

- `E1` — A origem automática `catálogo/site` não pode ser renomeada nem excluída.
- `E2` — Nome vazio ou equivalente a outra origem: o sistema impede o salvamento.

### UC-022 — Atender revogação de consentimento

**Ator principal:** Usuário autorizado  
**Objetivo:** Interromper o uso comercial dos dados de um lead após solicitação.  
**Pré-condição:** A identidade ou o contato da pessoa foi localizado e a solicitação foi validada operacionalmente.  
**Pós-condição:** Os dados são excluídos ou anonimizados e não podem mais sustentar contato comercial.  
**Rastreabilidade:** `RF-005`, `RF-016`; `RN-018`, `RNF-008`.

**Fluxo principal — lead sem histórico ou dependências**

1. O usuário autorizado localiza o lead.
2. O sistema identifica que não existem histórico ou dependências a preservar.
3. O usuário confirma a revogação.
4. O sistema exclui o lead e registra a operação na auditoria administrativa.

**Fluxo alternativo — lead com histórico**

1. O sistema identifica histórico operacional ou dependências.
2. O usuário confirma a revogação.
3. O sistema anonimiza os dados pessoais, preserva a rastreabilidade operacional e registra a operação na auditoria.

**Resultado posterior**

- Um novo envio voluntário com novo consentimento pode gerar outro lead para a mesma pessoa.
- A verificação da identidade do solicitante ocorre manualmente, fora do sistema, antes da operação.

## Administração e controle

### UC-023 — Administrar usuários internos

**Ator principal:** Usuário autorizado  
**Objetivo:** Criar e manter as contas que acessam o dashboard.  
**Pré-condição:** O usuário possui a permissão correspondente à ação.  
**Pós-condição:** A conta é criada, atualizada, ativada, desativada ou tem seu acesso redefinido.  
**Rastreabilidade:** `RF-015`, `RF-016`; `RN-019`, `RN-020`, `RN-021`, `RN-022`, `RN-023`, `RN-037`.

**Fluxo principal — criar conta**

1. O usuário informa o nome completo e, opcionalmente, o e-mail.
2. O sistema gera um nome de usuário normalizado e resolve colisões com sufixo sequencial.
3. O sistema cria a conta ativa, sem permissões e ainda sem acesso liberado.
4. O sistema emite um código de ativação de uso único.
5. Com e-mail cadastrado, o sistema envia o código automaticamente; sem e-mail, exibe-o uma única vez ao administrador.
6. O sistema registra a criação na auditoria.

**Fluxos alternativos**

- `A1` — O usuário autorizado edita nome completo, e-mail ou nome de usuário; o sistema valida a unicidade e audita a alteração.
- `A2` — O usuário desativa uma conta; o sistema encerra suas sessões e preserva históricos e leads atribuídos.
- `A3` — O usuário reativa uma conta.
- `A4` — Para recuperar uma conta sem e-mail, o usuário autorizado emite um novo código de uso único.

**Exceções**

- `E1` — Nome de usuário duplicado: o sistema impede o salvamento.
- `E2` — Tentativa de desativar a própria conta: o sistema recusa a ação.
- `E3` — Tentativa de desativar o último administrador ativo: o sistema recusa a ação.

### UC-024 — Administrar permissões individuais

**Ator principal:** Usuário autorizado  
**Objetivo:** Definir individualmente as capacidades de outro usuário interno.  
**Pré-condição:** O ator possui permissão para administrar permissões.  
**Pós-condição:** As permissões aprovadas produzem efeito imediato e a alteração fica auditada.  
**Rastreabilidade:** `RF-016`; `RN-021`, `RN-022`, `RN-038`; `RNF-002`, `RNF-007`.

**Fluxo principal**

1. O usuário seleciona outra conta interna.
2. O sistema apresenta o catálogo de permissões e as capacidades atuais dessa conta.
3. O usuário habilita ou desabilita permissões que ele próprio possui.
4. O sistema valida as proteções administrativas.
5. O sistema salva as alterações com efeito imediato.
6. O sistema registra autor, usuário afetado, valores anteriores e novos, data e horário.

**Exceções**

- `E1` — Tentativa de alterar as próprias permissões: o sistema recusa a ação.
- `E2` — Tentativa de conceder permissão que o ator não possui: o sistema recusa a ação.
- `E3` — Alteração deixaria o sistema sem administrador ativo: o sistema recusa a ação.

### UC-025 — Consultar auditoria administrativa

**Ator principal:** Usuário autorizado  
**Objetivo:** Examinar alterações realizadas em usuários e permissões.  
**Pré-condição:** O usuário possui permissão para visualizar a auditoria.  
**Pós-condição:** Nenhum registro é modificado.  
**Rastreabilidade:** `RF-016`; `RNF-007`.

**Fluxo principal**

1. O usuário acessa a auditoria administrativa.
2. O sistema apresenta os eventos em ordem cronológica.
3. O usuário filtra por usuário afetado, autor, período ou tipo de alteração.
4. O sistema apresenta autor, data, horário e valores alterados de cada evento.

**Restrições**

- Os registros não podem ser editados ou removidos.
- Os registros são mantidos durante toda a vida do sistema.
- A exportação não faz parte desta entrega.
