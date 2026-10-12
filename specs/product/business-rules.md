# Regras de negócio

**Etapa:** 03 — Regras de negócio  
**Estado:** Aprovada  
**Referências:** [Visão geral](overview.md) · [Requisitos](requirements.md)

Este documento registra apenas regras confirmadas. Novas regras serão adicionadas progressivamente após validação.

## Catálogo e publicação

### RN-001 — Publicação inicial do parceiro

Um parceiro novo deve ser criado como rascunho e somente pode ser publicado por um usuário com a permissão correspondente.

Para publicação, o parceiro deve possuir:

- nome;
- descrição;
- instruções para utilização do desconto;
- ao menos uma categoria ativa;
- ao menos um contato entre telefone e WhatsApp;
- benefício válido para ao menos um plano ativo;
- dados obrigatórios completos de cada unidade cadastrada.

Um parceiro não precisa possuir unidade física.

**Rastreabilidade:** `RF-012`, `RF-013`, `RF-014`, `RF-016`.

### RN-002 — Edição de parceiro publicado

Alterações salvas em um parceiro publicado devem ser refletidas imediatamente no catálogo, sem novo ciclo de aprovação ou republicação, desde que o registro continue atendendo às condições de publicação.

**Rastreabilidade:** `RF-002`, `RF-004`, `RF-012`.

### RN-003 — Elegibilidade para exibição pública

Um parceiro somente pode aparecer no catálogo quando todas as condições abaixo forem atendidas:

- estiver publicado;
- não estiver desativado;
- possuir ao menos uma categoria ativa;
- possuir benefício para o plano ativo selecionado pelo visitante.

Se perder sua última categoria ativa ou seu último benefício aplicável a planos ativos, o parceiro deve deixar automaticamente o catálogo. O registro administrativo e suas associações permanecem preservados.

**Rastreabilidade:** `RF-002`, `RF-003`, `RF-010`, `RF-011`, `RF-012`, `RF-014`.

### RN-004 — Vigência manual de benefícios e cupons

Benefícios e cupons não possuem período automático de vigência nesta entrega. Permanecem aplicáveis até serem alterados ou desativados manualmente.

**Rastreabilidade:** `RF-004`, `RF-014`.

### RN-005 — Preservação após desativação do parceiro

Ao desativar um parceiro, suas unidades, benefícios, cupons, categorias e demais associações devem ser preservados para consulta administrativa e eventual republicação.

O parceiro e suas unidades deixam de aparecer no catálogo durante a desativação.

**Rastreabilidade:** `RF-012`, `RF-013`, `RF-014`.

### RN-027 — Contatos do parceiro e das unidades

- Um parceiro pode possuir vários telefones e vários números de WhatsApp.
- Uma unidade pode possuir seus próprios telefones e números de WhatsApp.
- Quando um tipo de contato não for informado na unidade, ela deve herdar para exibição os contatos gerais correspondentes do parceiro.

**Rastreabilidade:** `RF-004`, `RF-012`, `RF-013`.

### RN-028 — Endereço e horário da unidade

Uma unidade física deve informar CEP, logradouro, número ou indicação `s/n`, bairro, cidade e estado. O complemento é opcional e o estado fica limitado ao Rio de Janeiro nesta entrega.

O horário de atendimento é opcional e registrado como texto livre.

**Rastreabilidade:** `RF-004`, `RF-013`.

### RN-029 — Quantidade de cupons

Cada parceiro pode possuir no máximo um cupom geral e um cupom específico para cada plano.

**Rastreabilidade:** `RF-004`, `RF-014`.

### RN-030 — Unicidade de cadastros auxiliares

Nomes de planos, categorias e origens devem ser únicos após normalização de maiúsculas, minúsculas e acentos. Por exemplo, `Família` e `familia` representam o mesmo nome para fins de unicidade.

**Rastreabilidade:** `RF-007`, `RF-010`, `RF-011`.

### RN-031 — Possível duplicidade de parceiro

Parceiros podem possuir nomes iguais. Quando um nome igual ou equivalente já existir, o dashboard deve alertar sobre possível duplicidade sem impedir o salvamento.

**Rastreabilidade:** `RF-012`.

### RN-032 — Validação de contatos

Telefones e números de WhatsApp devem ser normalizados com código do país e DDD. Um número inválido deve impedir o salvamento.

**Rastreabilidade:** `RF-004`, `RF-005`, `RF-006`, `RF-012`, `RF-013`.

### RN-033 — Validação do endereço e site

- O CEP deve possuir formato válido, mas não precisa ser consultado para confirmar sua correspondência geográfica com o estado.
- O site do parceiro, quando informado, deve ser um endereço válido com protocolo `http://` ou `https://`.

**Rastreabilidade:** `RF-004`, `RF-012`, `RF-013`.

### RN-034 — Normalização de cupom

Espaços acidentais no início e no fim do cupom devem ser removidos antes do salvamento. Os demais caracteres e sua capitalização devem ser preservados.

**Rastreabilidade:** `RF-004`, `RF-014`.

### RN-039 — Estabilidade da URL do parceiro

- Cada parceiro possui um identificador público único e uma URL estável.
- Alterar o nome do parceiro não altera automaticamente esse identificador.
- Quando um usuário autorizado alterar explicitamente o identificador público, a URL anterior deve redirecionar permanentemente para a nova.

**Rastreabilidade:** `RF-004`, `RF-012`.

### RN-040 — Contexto público do plano

- Cada plano possui identificador público único e estável.
- Alterar o nome do plano não altera automaticamente esse identificador.
- A URL é a fonte do plano selecionado no catálogo; não há seleção automática por armazenamento local.
- Sem identificador de plano na URL, o visitante deve realizar uma escolha explícita.

**Rastreabilidade:** `RF-001`, `RF-010`.

## Leads

### RN-006 — Responsável inicial do lead público

Um lead captado pelo formulário público deve ser criado inicialmente sem responsável. Sua atribuição será realizada posteriormente por um usuário com a permissão correspondente.

**Rastreabilidade:** `RF-005`, `RF-009`, `RF-016`.

### RN-007 — Visibilidade de lead sem responsável

Um lead sem responsável pode ser visto por usuários com permissão para visualizar todos os leads. Ele não deve aparecer para usuários que possuem somente a permissão de visualizar os próprios leads.

**Rastreabilidade:** `RF-009`, `RF-016`.

### RN-008 — Responsável inicial do lead manual

No cadastro manual, o sistema deve atribuir o lead ao usuário autenticado por padrão. O usuário pode marcar explicitamente o cadastro para deixar o lead sem responsável.

**Rastreabilidade:** `RF-006`, `RF-009`.

### RN-009 — Limite de edição do lead

Um usuário com permissão para editar leads pode editar os leads sob sua responsabilidade. Para editar leads atribuídos a outras pessoas, também precisa possuir acesso de visualização global.

**Rastreabilidade:** `RF-008`, `RF-009`, `RF-016`.

### RN-010 — Devolução de lead

O responsável pode devolver o próprio lead para a condição “sem responsável”. A atribuição posterior continua sujeita à permissão de atribuir ou redistribuir leads.

**Rastreabilidade:** `RF-009`, `RF-016`.

### RN-011 — Administração das origens

Os tipos de origem dos leads devem ser administráveis no dashboard por usuário autorizado. Exemplos iniciais incluem catálogo, abordagem, indicação e campanha, sem limitar o cadastro de novos tipos.

Nomes de origens devem ser únicos após normalização de maiúsculas, minúsculas e acentos.

**Rastreabilidade:** `RF-007`, `RF-016`.

### RN-012 — Preservação das observações

Observações do lead são registros separados. Elas podem ser corrigidas, mas a versão anterior, o autor e a data da alteração devem permanecer no histórico. Uma observação não pode ser apagada silenciosamente.

Somente o autor pode corrigir sua própria observação.

**Rastreabilidade:** `RF-008`, `RNF-003`.

### RN-024 — Entrada no pipeline

Todo lead novo deve iniciar na etapa `novo`, independentemente de ter sido captado pelo formulário público ou cadastrado manualmente.

No cadastro manual, a origem é obrigatória. Quando a origem for indicação, a identificação de quem indicou também é obrigatória.

**Rastreabilidade:** `RF-005`, `RF-006`, `RF-007`, `RF-008`.

### RN-025 — Ciclo de vida das origens

- Um tipo de origem pode estar ativo ou inativo e pode ser reativado.
- Uma origem já utilizada não pode ser excluída; deve ser desativada para preservar os leads existentes.
- A origem automática `catálogo/site` não pode ser excluída nem renomeada.
- Um usuário autorizado pode corrigir a origem de um lead, preservando o valor anterior no histórico.

**Rastreabilidade:** `RF-007`, `RF-008`, `RNF-003`.

### RN-026 — Novo interesse de contato existente

Quando o formulário público receber um WhatsApp associado a um lead existente:

- não deve criar outro lead;
- não deve sobrescrever nome, e-mail, etapa, responsável ou origem;
- deve registrar no histórico a nova solicitação, sua data, horário e evidência de consentimento;
- deve marcar o lead com `novo interesse pendente`;
- deve destacar a pendência para todos os usuários que podem visualizar o lead;
- deve continuar retornando ao visitante a mesma resposta neutra usada para um contato novo.

Um usuário autorizado pode tratar a marcação e, quando o lead estiver convertido ou perdido, reabri-lo manualmente em uma etapa escolhida. A etapa nunca deve ser alterada automaticamente pelo novo envio.

**Rastreabilidade:** `RF-005`, `RF-008`, `RNF-001`, `RNF-003`.

### RN-035 — Destinatário de atribuição

Um lead somente pode ser atribuído ou redistribuído para uma conta ativa.

**Rastreabilidade:** `RF-009`, `RF-015`.

### RN-036 — Validação da solicitação de revogação

A identidade de quem solicita revogação do consentimento deve ser verificada manualmente pela equipe, fora do sistema, antes da exclusão ou anonimização.

**Rastreabilidade:** `RF-016`, `RNF-008`.

## Planos, benefícios e cupons

### RN-013 — Seleção explícita do plano

Nenhum plano deve vir selecionado ao abrir o catálogo. O visitante deve escolher explicitamente o plano que informa possuir.

Ao trocar de plano, a listagem e as condições dos parceiros devem ser atualizadas imediatamente para a nova seleção.

**Rastreabilidade:** `RF-001`, `RF-002`, `RF-004`.

### RN-014 — Benefício por plano

Um parceiro pode possuir benefício para alguns planos e não para outros. Cada plano atendido possui um percentual inteiro e independente entre 1% e 100%.

O parceiro somente aparece quando possuir benefício para o plano ativo selecionado pelo visitante.

**Rastreabilidade:** `RF-002`, `RF-004`, `RF-014`.

### RN-015 — Condição mínima de benefício

Um parceiro pode ser publicado sem cupom, mas deve possuir percentual de desconto para ao menos um plano ativo.

**Rastreabilidade:** `RF-012`, `RF-014`.

### RN-016 — Precedência de cupom

Um cupom geral é aplicável a todos os planos atendidos pelo parceiro. Quando existir cupom específico para o plano selecionado, ele substitui o cupom geral na exibição.

**Rastreabilidade:** `RF-004`, `RF-014`.

## Consentimento e privacidade

### RN-017 — Evidência de consentimento

O aceite para contato comercial deve registrar:

- data e horário;
- texto ou versão do consentimento aceito;
- origem do envio.

O endereço IP não deve ser coletado como prova de consentimento nesta entrega.

**Rastreabilidade:** `RF-005`, `RNF-008`.

### RN-018 — Revogação do consentimento

Após a revogação do consentimento:

- nenhum novo contato comercial pode ser realizado com base no consentimento revogado;
- o lead deve ser excluído quando não possuir histórico ou dependências;
- o lead deve ser anonimizado quando seu histórico operacional precisar ser preservado.

Depois da exclusão ou anonimização, um novo envio voluntário com novo consentimento pode gerar outro lead para a mesma pessoa.

**Rastreabilidade:** `RF-005`, `RF-016`, `RNF-008`.

## Contas internas

### RN-019 — Geração do nome de usuário

O nome de usuário deve ser gerado pelo sistema a partir do nome completo do usuário:

- convertido para letras minúsculas;
- sem acentos ou caracteres especiais;
- com espaços substituídos por pontos;
- com sufixo numérico sequencial quando o identificador já existir.

Exemplo: `João da Silva` gera `joao.da.silva`; uma colisão gera `joao.da.silva.2`.

Um usuário com a permissão adequada pode editar o nome de usuário, respeitando sua unicidade. Alterar o nome completo não altera automaticamente o identificador.

**Rastreabilidade:** `RF-015`.

### RN-020 — Preservação do identificador

O nome de usuário de uma conta desativada não pode ser reutilizado por outra pessoa, preservando a autoria histórica.

**Rastreabilidade:** `RF-015`, `RNF-003`, `RNF-007`.

### RN-021 — Proteções administrativas

- Um usuário não pode desativar a própria conta.
- O sistema deve impedir a desativação do último usuário ativo capaz de administrar usuários e permissões.

**Rastreabilidade:** `RF-015`, `RF-016`.

### RN-022 — Privilégio mínimo inicial

Uma conta nova deve iniciar sem permissões. Todas as suas capacidades devem ser atribuídas explicitamente por um usuário autorizado.

**Rastreabilidade:** `RF-015`, `RF-016`, `RNF-002`.

### RN-023 — Definição e recuperação da senha

- O usuário deve definir sua própria senha por meio de um código de ativação de uso único emitido por um usuário autorizado.
- Para contas sem e-mail, um usuário autorizado pode emitir um novo código de uso único para recuperação.
- Um usuário autenticado pode alterar sua própria senha.
- Administradores não definem nem precisam conhecer as senhas dos usuários.
- Emitir um novo código de ativação ou recuperação invalida os códigos anteriores da mesma finalidade.
- Alterar ou recuperar a senha invalida os JWTs emitidos anteriormente para a conta.

Prazo, formato, armazenamento e forma segura de entrega dos códigos serão definidos nas etapas de segurança e arquitetura.

**Rastreabilidade:** `RF-015`, `RNF-002`.

### RN-037 — Ativação inicial da conta

- Nome completo é obrigatório e e-mail é opcional.
- Uma conta nova é criada ativa, mas não pode acessar o dashboard antes de concluir a ativação e definir sua senha.
- Quando houver e-mail, o código de ativação deve ser enviado automaticamente.
- Sem e-mail, o código deve ser exibido uma única vez ao administrador para entrega fora do sistema.

**Rastreabilidade:** `RF-015`, `RNF-002`.

### RN-038 — Efeito de alteração das permissões

Alterações de permissões devem produzir efeito imediato, inclusive em sessões que já estejam abertas.

**Rastreabilidade:** `RF-016`, `RNF-002`, `RNF-007`.

## Fora do escopo desta etapa de entrega

- Agendamento de próximo contato.
- Alertas de leads com contato atrasado.
