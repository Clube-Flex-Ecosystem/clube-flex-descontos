# Requisitos do produto

**Etapa:** 02 — Requisitos  
**Estado:** Aprovada  
**Escopo:** Primeira entrega descrita em [overview.md](overview.md)

Este documento registra somente requisitos derivados das informações confirmadas. Detalhes ainda não discutidos estão listados como pendências, sem serem tratados como decisões.

## Catálogo público

### RF-001 — Selecionar plano

O visitante deve poder selecionar o plano que informa possuir, sem autenticação ou validação de vínculo.

**Critérios de aceite**

- `CA-RF-001-01` — O catálogo pode ser acessado sem login.
- `CA-RF-001-02` — O visitante consegue selecionar um plano ativo.
- `CA-RF-001-03` — A interface não afirma que o plano selecionado foi validado.
- `CA-RF-001-04` — Nenhum plano vem selecionado inicialmente; o visitante deve realizar uma escolha explícita.
- `CA-RF-001-05` — Ao trocar o plano, a listagem e as condições exibidas são atualizadas para a nova seleção.
- `CA-RF-001-06` — Cada plano possui identificador público estável para compor o contexto compartilhável da URL.
- `CA-RF-001-07` — Sem plano na URL, nenhuma seleção anterior do navegador é aplicada automaticamente.

### RF-002 — Listar parceiros por plano

O catálogo deve listar apenas parceiros publicados e ativos que possuam benefício para o plano selecionado.

**Critérios de aceite**

- `CA-RF-002-01` — Um parceiro sem benefício para o plano selecionado não é exibido.
- `CA-RF-002-02` — Parceiros em rascunho ou desativados não são exibidos.
- `CA-RF-002-03` — Parceiros destacados aparecem antes dos demais.
- `CA-RF-002-04` — Entre parceiros com a mesma condição de destaque, a ordenação é alfabética pelo nome.

### RF-003 — Filtrar parceiros por categoria

O visitante deve poder filtrar o catálogo por categoria.

**Critérios de aceite**

- `CA-RF-003-01` — O filtro apresenta somente categorias disponíveis para consulta pública.
- `CA-RF-003-02` — Ao selecionar uma categoria, apenas parceiros associados a ela são exibidos.
- `CA-RF-003-03` — Um parceiro pode estar associado a mais de uma categoria.

### RF-004 — Consultar parceiro

O visitante deve poder consultar os dados públicos e as condições de um parceiro para o plano selecionado.

**Dados confirmados**

- nome;
- categorias;
- descrição;
- percentual de desconto no formato “até X%”;
- site;
- contatos;
- cupom, quando aplicável;
- instruções para utilizar o desconto;
- unidades, incluindo endereço, cidade, bairro, contatos, horários e instruções pertinentes.

**Obrigatoriedade confirmada**

- Nome, descrição e instruções de uso são obrigatórios.
- Deve existir ao menos uma categoria ativa associada.
- Deve existir ao menos um contato entre telefone e WhatsApp.
- Deve existir benefício para ao menos um plano.
- Site e cupom são opcionais.
- O indicador de destaque inicia desabilitado.
- O parceiro pode operar com ou sem unidade física.

**Critérios de aceite**

- `CA-RF-004-01` — É exibida somente a condição correspondente ao plano selecionado.
- `CA-RF-004-02` — O percentual é único para o parceiro dentro de cada plano.
- `CA-RF-004-03` — O cupom pode ser geral ou específico do plano.
- `CA-RF-004-04` — Um parceiro pode possuir mais de uma unidade.
- `CA-RF-004-05` — Um parceiro sem unidade física pode ser publicado quando cumprir os demais requisitos.
- `CA-RF-004-06` — Um parceiro pode possuir vários telefones e vários números de WhatsApp.
- `CA-RF-004-07` — Cada parceiro possui uma URL pública estável.
- `CA-RF-004-08` — Alterar o nome não altera automaticamente a URL; uma alteração explícita do identificador público preserva redirecionamento permanente da URL anterior.

## Captação de leads

### RF-005 — Enviar interesse comercial pelo site

O potencial cliente deve poder enviar seus dados para receber contato da equipe comercial.

**Dados confirmados**

- nome;
- WhatsApp;
- e-mail opcional;
- concordância com o uso dos dados para contato comercial.

**Critérios de aceite**

- `CA-RF-005-01` — Nome, WhatsApp e concordância são obrigatórios.
- `CA-RF-005-02` — E-mail é opcional.
- `CA-RF-005-03` — Sem concordância, o formulário não é aceito.
- `CA-RF-005-04` — Um contato novo gera um lead com origem identificada como proveniente do catálogo/site.
- `CA-RF-005-05` — Um WhatsApp já existente não cria outro lead nem sobrescreve seus dados, sua etapa, seu responsável ou sua origem.
- `CA-RF-005-06` — A resposta pública não revela se o WhatsApp já estava cadastrado.
- `CA-RF-005-07` — A identificação de duplicidade utiliza o WhatsApp normalizado com DDD e código do país.
- `CA-RF-005-08` — O consentimento registra data, horário, versão do texto aceito e origem do envio.
- `CA-RF-005-09` — O endereço IP não é coletado como prova de consentimento nesta entrega.
- `CA-RF-005-10` — Um novo envio para WhatsApp existente registra solicitação de contato e novo consentimento no histórico e marca o lead com interesse pendente.

### RF-006 — Cadastrar lead manualmente

Um usuário autorizado deve poder cadastrar um lead obtido fora do site.

**Critérios de aceite**

- `CA-RF-006-01` — O cadastro registra nome, WhatsApp e, opcionalmente, e-mail.
- `CA-RF-006-02` — O usuário informa a origem e pode complementar seu detalhe.
- `CA-RF-006-03` — Uma indicação permite identificar quem indicou.
- `CA-RF-006-04` — O lead pode ser atribuído a um responsável.
- `CA-RF-006-05` — No cadastro manual, um WhatsApp já existente não gera outro lead e o painel informa qual registro já utiliza o número.
- `CA-RF-006-06` — A origem é obrigatória no cadastro manual.
- `CA-RF-006-07` — Quando a origem for indicação, a identificação de quem indicou é obrigatória.
- `CA-RF-006-08` — Todo lead novo inicia na etapa `novo`.

### RF-007 — Registrar origem do lead

O sistema deve registrar o tipo, o detalhe e o meio de registro da origem do lead.

**Critérios de aceite**

- `CA-RF-007-01` — A origem pode ser determinada automaticamente ou informada manualmente, conforme o canal.
- `CA-RF-007-02` — O detalhe comporta informações como indicador ou campanha futura.
- `CA-RF-007-03` — Integrações com plataformas de anúncios não fazem parte desta entrega.
- `CA-RF-007-04` — Usuários autorizados podem administrar os tipos de origem disponíveis para seleção manual.
- `CA-RF-007-05` — Tipos de origem possuem estados ativo e inativo e podem ser reativados.
- `CA-RF-007-06` — Uma origem já utilizada não pode ser excluída, apenas desativada.
- `CA-RF-007-07` — A origem automática `catálogo/site` não pode ser excluída nem renomeada.
- `CA-RF-007-08` — A origem de um lead pode ser corrigida por usuário autorizado, preservando o valor anterior no histórico.

### RF-008 — Acompanhar pipeline

Usuários autorizados devem poder acompanhar e movimentar leads pelo pipeline inicial.

**Etapas confirmadas**

1. Novo.
2. Primeiro contato.
3. Em negociação.
4. Convertido.
5. Perdido.

**Critérios de aceite**

- `CA-RF-008-01` — O responsável pode alterar a etapa quando possuir a permissão necessária.
- `CA-RF-008-02` — A conversão é registrada manualmente e não cria um assinante.
- `CA-RF-008-03` — Um lead pode ser marcado como perdido sem informar motivo.
- `CA-RF-008-04` — Alterações relevantes ficam disponíveis no histórico do lead.
- `CA-RF-008-05` — As etapas podem ser alteradas livremente, sem obrigatoriedade de seguir uma sequência linear.
- `CA-RF-008-06` — Um lead convertido ou perdido pode ser reaberto e o usuário autorizado escolhe sua nova etapa.
- `CA-RF-008-07` — As observações são registros separados, preservando autor e data, em vez de um único campo continuamente sobrescrito.
- `CA-RF-008-08` — Um usuário autorizado pode tratar um novo interesse, reabrir o lead em uma etapa escolhida quando necessário e remover a marcação pendente.
- `CA-RF-008-09` — Leads com novo interesse pendente aparecem destacados para todos os usuários que podem visualizá-los.
- `CA-RF-008-10` — Somente o autor pode corrigir sua observação; o conteúdo anterior permanece no histórico.

**Eventos confirmados do histórico**

- Criação do lead.
- Mudança de etapa.
- Troca de responsável.
- Alteração dos dados de contato.
- Alteração da origem.
- Inclusão ou alteração de observações.
- Novo envio do formulário público para o WhatsApp existente.
- Tratamento da marcação de novo interesse.

Cada evento deve identificar data, horário e usuário responsável.

### RF-009 — Atribuir leads

O sistema deve permitir atribuir um lead a um usuário responsável.

**Critérios de aceite**

- `CA-RF-009-01` — Um usuário com acesso apenas aos próprios leads não visualiza leads atribuídos a outras pessoas.
- `CA-RF-009-02` — Um usuário com permissão global pode visualizar os leads de todos os responsáveis.
- `CA-RF-009-03` — Um usuário autorizado pode redistribuir um lead.
- `CA-RF-009-04` — Um lead somente pode ser atribuído a uma conta ativa.

## Administração do catálogo

### RF-010 — Administrar planos

Usuários autorizados devem poder cadastrar, consultar, editar e desativar planos.

**Critérios de aceite confirmados**

- `CA-RF-010-01` — Planos ativos ficam disponíveis no seletor público.
- `CA-RF-010-02` — Um plano desativado permanece no dashboard e deixa de estar disponível publicamente.
- `CA-RF-010-03` — Um plano inativo pode ser reativado.
- `CA-RF-010-04` — Benefícios e cupons associados ao plano são preservados durante sua inatividade e recuperados com sua reativação.

**Planos iniciais conhecidos**

- Tradicional.
- Multi.
- Família.

Os planos serão cadastrados pelo dashboard; esta lista deverá ser confirmada durante o cadastro inicial.

**Campos confirmados**

- Nome obrigatório e único após normalização de maiúsculas, minúsculas e acentos.
- Estado ativo ou inativo.

### RF-011 — Administrar categorias

Usuários autorizados devem poder cadastrar, consultar, editar e desativar categorias.

**Critérios de aceite confirmados**

- `CA-RF-011-01` — Categorias ativas podem ser associadas a parceiros.
- `CA-RF-011-02` — Categorias desativadas permanecem no dashboard e deixam de aparecer no catálogo.
- `CA-RF-011-03` — Ao desativar uma categoria, suas associações são preservadas, mas ela deixa de aparecer nas listagens de categorias ativas.
- `CA-RF-011-04` — Um parceiro associado a outra categoria ativa continua disponível por essa categoria, desde que satisfaça as demais condições de publicação.
- `CA-RF-011-05` — Uma categoria inativa pode ser reativada.
- `CA-RF-011-06` — Um parceiro não pode ser publicado sem ao menos uma categoria ativa.

**Campos confirmados**

- Nome obrigatório e único após normalização de maiúsculas, minúsculas e acentos.
- Estado ativo ou inativo.

### RF-012 — Administrar parceiros

Usuários autorizados devem poder cadastrar, consultar, editar, publicar e desativar parceiros.

**Critérios de aceite**

- `CA-RF-012-01` — Um novo parceiro é criado como rascunho.
- `CA-RF-012-02` — Somente um usuário com a permissão correspondente pode publicá-lo.
- `CA-RF-012-03` — Um parceiro pode ser associado a várias categorias.
- `CA-RF-012-04` — Um parceiro pode ser marcado ou desmarcado como destaque.
- `CA-RF-012-05` — Um parceiro desativado permanece visível no dashboard e deixa de aparecer no catálogo.
- `CA-RF-012-06` — Um parceiro desativado pode retornar a rascunho ou ser republicado por usuário autorizado.
- `CA-RF-012-07` — Parceiros podem possuir nomes iguais, mas o dashboard alerta sobre possível duplicidade antes do salvamento.

### RF-013 — Administrar unidades

Usuários autorizados devem poder administrar uma ou mais unidades de cada parceiro.

**Critérios de aceite**

- `CA-RF-013-01` — Cada unidade pertence a um parceiro.
- `CA-RF-013-02` — Uma unidade desativada permanece no dashboard e deixa de aparecer no catálogo.
- `CA-RF-013-03` — Uma unidade pode estar ativa ou inativa.
- `CA-RF-013-04` — Uma unidade inativa pode ser reativada.

**Campos obrigatórios quando existir uma unidade**

- Identificação ou nome da unidade.
- CEP.
- Logradouro.
- Número ou indicação `s/n`.
- Bairro.
- Cidade.
- Estado, limitado inicialmente ao Rio de Janeiro.

**Campos opcionais**

- Complemento do endereço.
- Horário de atendimento.
- Instruções específicas da unidade.
- Telefones e números de WhatsApp próprios.

**Regras de contato da unidade**

- Uma unidade pode possuir vários telefones e números de WhatsApp.
- Quando um tipo de contato não for informado na unidade, deve ser exibido o contato geral correspondente do parceiro.
- O horário de atendimento é um texto livre nesta entrega.

### RF-014 — Administrar benefícios e cupons

Usuários autorizados devem poder definir a condição de cada parceiro por plano.

**Critérios de aceite**

- `CA-RF-014-01` — A condição registra um percentual no formato “até X%”.
- `CA-RF-014-01A` — O percentual aceita somente números inteiros de 1 a 100.
- `CA-RF-014-02` — Existe no máximo um percentual para cada combinação de parceiro e plano.
- `CA-RF-014-03` — O cupom pode ser comum a todos os planos ou específico de um plano.
- `CA-RF-014-03A` — Quando existirem cupom geral e cupom específico para o plano selecionado, o cupom específico prevalece.
- `CA-RF-014-03B` — Cada parceiro pode possuir no máximo um cupom geral e um cupom específico para cada plano.
- `CA-RF-014-05` — Espaços no início e no fim de um cupom são removidos antes do salvamento, preservando os demais caracteres.
- `CA-RF-014-04` — A ausência de condição para um plano impede que o parceiro seja listado para esse plano.

## Usuários e autorização

### RF-015 — Administrar usuários internos

Um usuário autorizado deve poder administrar os usuários internos que acessam o dashboard.

**Critérios de aceite**

- `CA-RF-015-01` — Não existe cadastro público de usuários internos.
- `CA-RF-015-02` — Somente um usuário com a permissão correspondente pode criar contas.
- `CA-RF-015-03` — A conta utiliza um nome de usuário como identificador de acesso.
- `CA-RF-015-03A` — O nome de usuário é gerado pelo sistema a partir do nome completo normalizado em letras minúsculas.
- `CA-RF-015-03B` — A geração remove acentos e caracteres especiais, substitui espaços por pontos e adiciona sufixo numérico sequencial em caso de colisão.
- `CA-RF-015-03C` — Um usuário com a permissão adequada pode editar o nome de usuário, respeitando sua unicidade.
- `CA-RF-015-04` — O e-mail da conta é opcional.
- `CA-RF-015-05` — Uma conta pode estar ativa ou inativa.
- `CA-RF-015-06` — Uma conta inativa não pode acessar o dashboard.
- `CA-RF-015-07` — A desativação preserva as associações da conta com históricos e leads.
- `CA-RF-015-08` — Leads permanecem atribuídos à conta desativada até serem redistribuídos manualmente.
- `CA-RF-015-09` — Uma conta com e-mail cadastrado pode solicitar recuperação de acesso por e-mail.
- `CA-RF-015-10` — Um usuário com permissão administrativa pode redefinir o acesso de uma conta sem e-mail.
- `CA-RF-015-11` — Após uma redefinição administrativa, o usuário deve trocar a senha no próximo login.
- `CA-RF-015-12` — Ao desativar uma conta, todos os JWTs emitidos anteriormente para ela devem ser invalidados.
- `CA-RF-015-13` — O nome de usuário de uma conta desativada não pode ser reutilizado.
- `CA-RF-015-14` — Um usuário não pode desativar a própria conta.
- `CA-RF-015-15` — O último usuário ativo capaz de administrar usuários e permissões não pode ser desativado.
- `CA-RF-015-16` — Uma conta nova inicia sem permissões; todas as capacidades devem ser atribuídas explicitamente.
- `CA-RF-015-17` — O usuário define sua própria senha por meio de um código de ativação de uso único emitido por usuário autorizado.
- `CA-RF-015-18` — Para uma conta sem e-mail, um usuário autorizado pode emitir um novo código de uso único para recuperação.
- `CA-RF-015-19` — O usuário autenticado pode alterar sua própria senha.
- `CA-RF-015-20` — O administrador não define nem precisa conhecer a senha do usuário.
- `CA-RF-015-21` — Emitir um novo código de ativação ou recuperação invalida todos os códigos anteriores da mesma finalidade.
- `CA-RF-015-22` — Alterar ou recuperar a senha invalida todos os JWTs emitidos anteriormente para a conta.
- `CA-RF-015-23` — Nome completo é obrigatório e e-mail é opcional.
- `CA-RF-015-24` — Uma conta nova é criada ativa, mas não pode acessar o sistema antes de concluir a ativação e definir sua senha.
- `CA-RF-015-25` — Quando houver e-mail, o código de ativação é enviado automaticamente; sem e-mail, é exibido uma única vez ao administrador para entrega fora do sistema.

### RF-016 — Administrar permissões individuais

Um usuário autorizado deve poder habilitar ou desabilitar permissões individualmente para cada usuário interno, sem depender de papéis fixos.

**Catálogo inicial de permissões**

| Área | Permissões |
| --- | --- |
| Planos | visualizar; administrar |
| Categorias | visualizar; administrar |
| Parceiros | visualizar; criar; editar; publicar/desativar; excluir registros elegíveis |
| Leads | visualizar próprios; visualizar todos; criar; editar; alterar etapa; atribuir/redistribuir; excluir ou anonimizar |
| Origens | visualizar; administrar |
| Usuários | visualizar; criar/editar; ativar/desativar; redefinir acesso |
| Permissões | visualizar; administrar |
| Auditoria | visualizar histórico administrativo |

Administrar planos ou categorias inclui criar, editar, ativar e desativar.

**Critérios de aceite**

- `CA-RF-016-01` — As permissões podem ser habilitadas ou desabilitadas por usuário.
- `CA-RF-016-02` — A ausência de permissão impede a ação correspondente.
- `CA-RF-016-03` — O sistema não exige que o usuário pertença a um papel fixo.
- `CA-RF-016-04` — Visualizar todos os leads também permite visualizar os próprios.
- `CA-RF-016-05` — Alterar observações ou dados de contato exige a permissão de editar leads.
- `CA-RF-016-07` — Um usuário não pode alterar as próprias permissões.
- `CA-RF-016-08` — Um usuário não pode conceder uma permissão que ele próprio não possui.
- `CA-RF-016-09` — Deve existir ao menos um usuário ativo capaz de administrar usuários e permissões.
- `CA-RF-016-10` — Excluir ou anonimizar um lead exige permissão específica e gera registro de auditoria.
- `CA-RF-016-11` — O histórico de auditoria pode ser consultado, mas não alterado.
- `CA-RF-016-12` — Alterações de permissões produzem efeito imediato, inclusive para sessões já abertas.

## Contato para parcerias

### RF-017 — Orientar interessado em parceria

O site deve orientar interessados em se tornar parceiros a enviar os dados necessários para `comercial@flexcard.org.br`.

**Critérios de aceite**

- `CA-RF-017-01` — O contato de parceria não gera registro no painel nesta entrega.
- `CA-RF-017-02` — A pessoa responsável pelo contato com o interessado pode ser diferente de quem posteriormente cadastra o parceiro.

## Requisitos não funcionais confirmados

### RNF-001 — Privacidade contra enumeração de contatos

A interface e a resposta pública do envio de interesse não devem revelar se um WhatsApp já está cadastrado.

### RNF-002 — Controle de acesso

Todas as operações do dashboard devem exigir autenticação e a permissão correspondente, exceto quando forem explicitamente definidas como públicas.

> O mecanismo aprovado utiliza JWT assinado em cookie seguro, sem refresh token ou sessão persistida, conforme a arquitetura da API e o ADR-0004.

### RNF-003 — Rastreabilidade de leads

O sistema deve preservar o histórico confirmado em `RF-008`, identificando data, horário e usuário responsável por cada evento.

### RNF-004 — Responsividade e prioridade móvel

O catálogo público deve funcionar em celulares, tablets e computadores. A experiência móvel é prioritária, pois aproximadamente 99% do público acessa por celular. Essa prioridade não se aplica ao dashboard interno.

### RNF-005 — Acessibilidade

Os fluxos públicos essenciais devem adotar WCAG 2.2 nível AA como referência de acessibilidade.

O dashboard não possui compromisso de conformidade formal nesta entrega, sem prejuízo da adoção de práticas básicas de acessibilidade.

### RNF-006 — Desempenho percebido

Páginas e operações comuns devem responder em até 2 segundos sob condições normais, desconsiderando atrasos de serviços externos.

> Volume, percentil, ambiente e condições de rede para medição ainda precisam ser definidos.

### RNF-007 — Auditoria administrativa

Alterações em usuários e permissões devem registrar autor, data, horário e valores alterados.

Os registros dessa auditoria devem ser preservados durante toda a vida do sistema.

A consulta deve permitir filtros por usuário afetado, autor da ação, período e tipo de alteração. A exportação da auditoria não faz parte desta entrega.

### RNF-008 — Revogação e tratamento de dados pessoais

Um usuário autorizado deve poder localizar um lead e atender a uma solicitação de revogação por exclusão ou anonimização dos dados pessoais.

- O lead deve ser anonimizado quando possuir histórico operacional que precise ser preservado.
- O lead deve ser excluído quando ainda não possuir histórico ou dependências.
- Após a revogação, nenhum novo contato comercial pode ser realizado com base no consentimento revogado.
- Após exclusão ou anonimização, um novo envio voluntário com novo consentimento pode gerar outro lead para a mesma pessoa.

### RNF-009 — Disponibilidade

O sistema deve ser destinado a uso contínuo, sem SLA formal na primeira entrega. Manutenções programadas são admitidas.

### RNF-010 — Backup e recuperação — adiado

**Estado:** Adiado para versão futura por decisão arquitetural de 2026-10-10.

Backup do PostgreSQL e metas formais de recuperação não fazem parte da primeira entrega. Foram definidos como objetivos futuros:

- backup diário;
- retenção por 30 dias;
- perda máxima aceitável de 24 horas de dados;
- restauração pretendida em até 8 horas após incidente grave.

A primeira versão aceita o risco de perda definitiva dos dados em caso de falha grave da VPS ou do armazenamento.

### RNF-011 — Compatibilidade de navegadores

O sistema deve suportar as duas versões estáveis mais recentes de Chrome, Safari, Edge e Firefox.

## Estados confirmados

- Planos: ativo e inativo.
- Categorias: ativa e inativa.
- Unidades: ativa e inativa.
- Parceiros: rascunho, publicado e desativado.
- Um parceiro desativado pode voltar para rascunho ou ser republicado.

## Exclusão e preservação

- Um registro pode ser excluído definitivamente somente quando estiver em rascunho ou nunca tiver sido utilizado.
- Registros com associações ou histórico devem ser desativados, preservando suas referências.

## Requisitos explicitamente fora da primeira entrega

- Autenticação ou cadastro de assinantes.
- Validação do plano contratado.
- Conversão de lead em cadastro de assinante.
- Cobrança e pagamentos.
- Agendamentos.
- Autorização ou comprovação digital do benefício.
- Registro de utilização dos benefícios.
- Agendamento ou alerta de próximo contato dos leads.
- Integração com anúncios.
- Integração com a futura base de assinantes.
- Gestão de interessados em parceria no dashboard.
- Exportação do histórico de auditoria administrativa.
- Backup do banco de dados e garantia de recuperação após perda da VPS.

## Pendências não bloqueantes

- Confirmar no cadastro inicial os nomes Tradicional, Multi e Família.
- Submeter a retenção de leads por prazo indeterminado à validação jurídica da organização antes da operação definitiva.
