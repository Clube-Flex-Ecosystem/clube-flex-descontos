# Proposta — auditoria de UX e fluxos do dashboard

**Escopo:** dashboard interno (`apps/dashboard/`), somente interação, composição e fluxo  
**Estado:** Aprovado em 2026-10-11 com os ajustes registrados em [Decisões registradas](#decisões-registradas): o protótipo é sempre a fonte da verdade e tudo o que ele mostra deve existir no app; filtros **não** vão para a URL (o contexto é preservado em memória durante a sessão); o rodapé técnico das listas é removido; salvar e publicar continuam ações separadas. Consolidado no [protótipo do dashboard](../../index.html) e em [`interface.md`](../../../../apps/dashboard/interface.md). Este documento permanece como registro da auditoria; o protótipo comparativo mostra a proposta original, inclusive os trechos depois ajustados (URL nos filtros e "Salvar e publicar").  
**Data:** 2026-10-11  
**Protótipo comparativo:** [index.html](index.html). Ele mostra cada fluxo nas versões **Atual** e **Proposta**, alternando (teclas `1` e `2`) ou lado a lado (`3`), com os estados relevantes de cada fluxo. Uma vista pode ser compartilhada pelo hash, por exemplo `#flow=lead&v=compare&state=conflict`.

Este documento audita **como o dashboard é usado**, e não como ele parece.
Paleta, tipografia, tokens, raios, sombras e fundamentos de componentes
continuam os aprovados em 2026-10-11 ([`ui-foundations.md`](../../../../apps/ui-foundations.md),
[design system](../../../../apps/dashboard/design-system/README.md) e
[auditoria visual](../2026-10-sistema-visual/README.md)). O protótipo
comparativo reutiliza literalmente o CSS do [protótipo aprovado](../../index.html):
toda diferença entre "Atual" e "Proposta" é de posição, ordem, agrupamento,
visibilidade, estado ou fluxo.

**Restrição respeitada:** nenhuma proposta cria, altera ou depende de endpoint,
request, response, schema, regra de negócio, autenticação ou autorização. As
melhorias que exigiriam a API estão isoladas na seção 26.

Fluxo ([processo de evolução da interface](../../../../ui-change-process.md)):

```text
leitura das specs → leitura do app e do protótipo → mapa de tarefas → custo dos fluxos
→ fricção → priorização → propostas A/B/C → protótipo comparativo → APROVAÇÃO   ← estamos aqui
→ interface.md → protótipo consolidado → plano de implementação → app → testes
```

**Fontes lidas:** `specs/README.md`, `ui-change-process.md`, `governance.md` (por
referência), `apps/dashboard/{interface,modules,architecture}.md`,
`apps/ui-foundations.md`, `product/{overview,requirements,business-rules,use-cases}.md`,
`quality/strategy.md`, `prototypes/dashboard/index.html`, a auditoria visual de
2026-10-11, todas as rotas e módulos de `apps/dashboard/src`, as rotas HTTP de
`apps/api/src/http/routes` e os contratos de `packages/contracts`.

---

## 1. Resumo executivo

O dashboard tem fundações corretas para uma ferramenta operacional: lista
completa carregada uma vez, filtros locais instantâneos, Kanban com arraste e
atualização otimista, formulário de parceiro com navegação por seções e
proteção contra saída sem salvar. **O problema não é a quantidade de telas,
e sim o contexto que se perde entre elas e as ações que estão longe do lugar
onde a decisão acontece.**

Os cinco achados de maior peso, todos resolvíveis sem tocar na API:

1. **O contexto de trabalho é descartado a cada navegação.** Filtros, busca,
   aba de estado e posição de rolagem vivem em `useState` local. Quem filtra
   "Novo interesse" no Kanban, abre um lead e volta, encontra o quadro sem
   filtro e no topo da página. Isso ocorre no fluxo mais frequente do produto
   (triagem de leads) e se repete em Parceiros, Usuários e Auditoria.
2. **O detalhe do lead permite a ação mais arriscada com menos proteção do que o
   Kanban.** O `<select>` de etapa no cabeçalho aplica "Convertido" e "Perdido"
   imediatamente, sem a confirmação exigida pela especificação e sem o campo
   de motivo da perda. No Windows, as setas do teclado sobre um `<select>`
   fechado já disparam a mudança.
3. **Erros importantes chegam ao usuário como "tente novamente".** O cadastro de
   lead com WhatsApp duplicado recebe da API o identificador do lead existente,
   mas mostra uma mensagem genérica (viola `CA-RF-006-05`). Em Origens, o erro
   de salvamento é renderizado **atrás** do dialog lateral aberto: para o
   usuário, o botão "Salvar" simplesmente não faz nada.
4. **Há controles que não funcionam e ações duplicadas.** A busca de Origens é
   um campo ligado a uma função vazia. Usuários oferecem três formas de abrir o
   mesmo detalhe (linha, botão "Abrir" e menu com "Abrir detalhe"). Planos e
   categorias repetem "Editar" no botão e no menu.
5. **Ações de salvar ficam longe do que foi alterado.** Em formulários longos
   (parceiro, permissões do usuário) o único "Salvar" está no cabeçalho, fora da
   tela depois da rolagem; "Publicar" exige salvar antes e, abaixo de 1280px, fica
   no fim da página. Benefícios por plano exigem atravessar a linha inteira até
   o interruptor da direita para conseguir digitar o percentual da esquerda.

Também há **lacunas de conformidade**: operações aprovadas nas specs, presentes
no protótipo e já suportadas pela API, mas ausentes no app (editar dados e
origem do lead, corrigir observação, excluir origem nunca usada, contador de
novo interesse na navegação). Elas não são funcionalidades novas e estão
destacadas na seção 7.4.

**Recomendação:** aprovar o pacote **A — Quick Wins** integralmente e o pacote
**B — Workflow** nos itens W1 a W5. O pacote **C** tem um único item
estrutural justificado (reordenar o detalhe do lead em torno da próxima ação).
Nenhuma página vira dialog, nenhuma lista ganha edição inline e nenhuma
confirmação exigida pela especificação é removida.

---

## 2. Papel do dashboard

| Pergunta | Resposta (fontes: `overview.md`, `use-cases.md`, `interface.md` e §2 da auditoria visual aprovada) |
| --- | --- |
| Quem usa | **Vendedores** (leads próprios), **supervisora** (operação comercial, redistribuição, usuários, permissões, auditoria) e **mantenedores do catálogo** (parceiros, planos, categorias). Não são papéis fixos: cada tela depende de permissões individuais. |
| Trabalho central | Tratar leads: localizar, atender novo interesse, registrar observação, avançar etapa, atribuir. É o único trabalho diário e repetitivo documentado. |
| Trabalho periódico | Cadastrar e publicar parceiros (formulário longo, sessões concentradas); manter listas curtas (planos, categorias, origens); criar contas e conceder permissões; consultar auditoria. |
| O que o dashboard **não** é | Não tem página de métricas, não agenda contatos, não alerta atrasos (`business-rules.md`, "Fora do escopo"). Nada nesta proposta cria esses elementos. |

**Frequência.** Não há analytics. As frequências abaixo são **inferidas** a
partir das specs e do registro da auditoria visual aprovada (§2): Kanban e
detalhe do lead **alta**; listagens administrativas **média**; formulário de
parceiro **baixa, em sessões longas**; usuários e auditoria **baixa**. Quando
nem essa inferência existe (por exemplo, cadastro manual de lead ou
redistribuição em massa), a frequência é marcada como **desconhecida** e
avaliada apenas pelo custo do fluxo.

---

## 3. Mapa dos módulos

| Módulo | Rotas | Componentes principais | Operações expostas pelo app | Operações da API **não** expostas |
| --- | --- | --- | --- | --- |
| Leads | `/leads`, `/leads/$leadId` | `LeadsList` → `LeadsData` → `LeadBoard`; `LeadDetailPage`; `LeadCreateDrawer` | listar, filtrar, mover etapa (arraste), criar, ver detalhe, tratar novo interesse, observar, atribuir/devolver, excluir/anonimizar | `PATCH /leads/:id` (dados e origem), `PATCH /leads/:id/observations/:id` (corrigir observação) |
| Origens | `/origens` | `SourcesPage` (página única, chamadas HTTP inline) | listar, criar, editar, desativar, reativar | `DELETE /lead-sources/:id` (origem nunca usada) |
| Parceiros | `/parceiros`, `/parceiros/novo`, `/parceiros/$partnerId` | `PartnersList` → `PartnersData`; `PartnerForm` com `ContactsEditor`, `UnitsEditor`, `BenefitsEditor` | listar, filtrar, criar, editar agregado, publicar, republicar, enviar para rascunho, desativar, destacar, excluir rascunho | — |
| Planos | `/planos` | `PlansList` → `PlansData`; `PlanFormDrawer` | listar, filtrar, criar, editar nome, desativar, reativar | — |
| Categorias | `/categorias` | `CategoriesList` → `CategoriesData`; `CategoryFormDrawer` | idem planos | — |
| Usuários | `/usuarios`, `/usuarios/$userId` | `UsersList` → `UsersData`; `UserCreateDrawer`; `UserDetailPage` + `PermissionGrid` | listar, filtrar, criar, editar dados, conceder/revogar permissões, emitir código, desativar/reativar | — |
| Auditoria | `/auditoria` | `AuditList` → `AuditData`; `AuditEventDrawer` | filtrar (período, ação, autor, afetado), paginar, ver evento | — |
| Conta | `/senha`, `/login`, `/ativar`, `/recuperar` | páginas de `auth` | alterar senha, entrar, ativar, recuperar | — |

Navegação lateral: Comercial (Leads, Origens) · Catálogo (Parceiros, Planos,
Categorias) · Administração (Usuários, Auditoria) · Conta (Alterar senha). A
raiz `/` redireciona ao primeiro módulo permitido.

---

## 4. Mapa das principais tarefas

| Módulo | Tarefa | Quem | Informação necessária | Ação que encerra | Ação seguinte provável | Freq. |
| --- | --- | --- | --- | --- | --- | --- |
| Leads | T1 Triar novos interesses | vendedor, supervisora | quais leads têm interesse pendente, evento e consentimento | "Marcar como tratada" | registrar observação, mudar etapa, voltar ao próximo | Alta (inf.) |
| Leads | T2 Registrar observação após contato | vendedor | lead, observações anteriores | "Adicionar observação" | mudar etapa ou voltar | Alta (inf.) |
| Leads | T3 Avançar etapa | vendedor | etapa atual | soltar o cartão / confirmar | próximo lead | Alta (inf.) |
| Leads | T4 Converter ou perder lead | vendedor | etapa, motivo | confirmação | próximo lead | Média (inf.) |
| Leads | T5 Localizar lead por nome/WhatsApp | todos | termo | abrir o cartão | T1, T2 ou T3 | Alta (inf.) |
| Leads | T6 Cadastrar lead manualmente | vendedor | nome, WhatsApp, origem | "Criar lead" | contatar e registrar observação | Desconhecida |
| Leads | T7 Atribuir / redistribuir / devolver | supervisora, vendedor | responsável atual, pessoas ativas | troca no seletor | próximo lead da mesma carteira | Desconhecida |
| Leads | T8 Corrigir dados ou origem | vendedor | valores atuais | salvar | voltar | Desconhecida (**sem UI hoje**) |
| Leads | T9 Excluir/anonimizar (revogação) | autorizado | existência de histórico | confirmação | voltar ao Kanban | Baixa |
| Origens | T10 Manter origens | supervisora | nome, uso | salvar / desativar | — | Baixa (inf.) |
| Parceiros | T11 Cadastrar parceiro | mantenedor | dados, categorias, contatos, unidades, benefícios | "Salvar" (rascunho) | publicar | Baixa, sessão longa |
| Parceiros | T12 Publicar / republicar | mantenedor com permissão | pendências | "Publicar" | voltar à lista | Baixa |
| Parceiros | T13 Editar parceiro existente | mantenedor | lista filtrada, dados atuais | "Salvar" | próximo parceiro da mesma lista | Média (inf.) |
| Parceiros | T14 Destacar, desativar, enviar para rascunho, excluir rascunho | mantenedor | estado | menu / confirmação | — | Baixa |
| Planos/Categorias | T15 Criar, renomear, desativar, reativar | mantenedor | nome, estado | salvar / confirmar | — | Baixa |
| Usuários | T16 Criar conta e entregar código | supervisora | nome, e-mail | código entregue | conceder permissões | Baixa |
| Usuários | T17 Conceder/revogar permissões | supervisora | permissões atuais e próprias | "Salvar alterações" | voltar | Baixa |
| Usuários | T18 Recuperar acesso de conta sem e-mail | supervisora | situação | código entregue | — | Baixa |
| Usuários | T19 Desativar/reativar conta | supervisora | estado | confirmação | redistribuir leads (T7) | Baixa |
| Auditoria | T20 Investigar alteração | supervisora | período, ação, autor, afetado | abrir evento | outro evento / usuário | Baixa |

---

## 5. Fluxos atuais

Notação: **clique** = ação de ponteiro ou tecla; **contexto** = mudança de
página ou abertura de overlay; **rolagem** = rolagem significativa para
alcançar o próximo controle.

**F1 — Triar um novo interesse (T1 + T2), por lead.** `/leads` → ativar
"Novo interesse" → acertar o **nome** do cartão (o único alvo clicável; o
resto do cartão é área de arraste) → detalhe → "Marcar como tratada" (primeiro
cartão) → rolar além da lista de observações até o compositor → digitar →
"Adicionar observação" → clicar "Leads" na trilha → **o filtro foi perdido e a
página voltou ao topo** → reativar "Novo interesse" → próximo.

**F2 — Converter ou perder pelo detalhe (T4).** Detalhe → `<select>` de
etapa → escolher "Perdido" → aplicado imediatamente. Não há confirmação, o
motivo não pode ser informado e o motivo existente (`lossReason`) não é
exibido em lugar nenhum do detalhe.

**F3 — Cadastrar lead cujo WhatsApp já existe (T6, exceção E2).** "Novo lead"
→ preencher nome, WhatsApp, origem → "Criar lead" → alerta "Não foi possível
concluir a operação. Tente novamente." → nova tentativa produz o mesmo erro →
o usuário fecha o dialog, busca o número no Kanban e abre o cartão por conta
própria (quando o lead é visível para ele).

**F4 — Editar um parceiro de uma lista filtrada (T13), por parceiro.**
`/parceiros` → aba "Rascunhos" + busca → "Editar" → alterar → rolar até o topo
→ "Salvar" → "Cancelar" ou trilha → **aba e busca perdidas** → refazer filtro →
próximo.

**F5 — Publicar após editar (T12).** Alterar → rolar ao topo → "Salvar" →
localizar "Publicar" no resumo lateral (abaixo de 1280px de viewport o resumo
fica **depois** de todas as seções) → "Publicar".

**F6 — Configurar benefícios para três planos (T11).** Para cada plano: clicar
no campo de percentual (somente leitura, nada acontece) → atravessar a linha
até o interruptor na última coluna → ligar → voltar ao percentual → digitar.

**F7 — Criar conta e conceder permissões (T16 + T17).** "Novo usuário" → nome
e e-mail → "Salvar" → detalhe → copiar manualmente o código de ativação (sem
botão de copiar; em telas abaixo de 1024px o cartão do código fica abaixo da
grade de permissões) → marcar permissões uma a uma (até 25 caixas em 8 áreas)
→ rolar ao topo → "Salvar alterações". Sair antes de salvar descarta as
permissões **sem aviso**.

**F8 — Salvar origem com nome repetido (T10).** "Nova origem" → nome →
"Salvar" → o erro é renderizado no topo da página, atrás do overlay; o
dialog permanece aberto sem nenhum retorno visível.

**F9 — Filtrar auditoria por três critérios (T20).** Cada troca de filtro
suspende a lista inteira: a barra de filtros, a tabela e a paginação somem e
dão lugar ao esqueleto; o foco sai do `<select>` usado. Abrir um usuário e
voltar descarta os filtros.

**F10 — Redistribuir a carteira de uma conta desativada (T7 após T19).**
`/leads` → o filtro de responsável só oferece "Todos", "Meus" e "Sem
responsável"; não é possível isolar a carteira da pessoa → buscar cartão por
cartão pelo nome do responsável no rodapé → abrir → trocar no seletor → voltar
(filtros perdidos) → repetir.

---

## 6. Matriz de custo das tarefas

Contagens aproximadas, a partir da rota inicial do fluxo. O objetivo é
evidenciar desperdício, não medir com precisão.

| Fluxo | Cliques | Contextos | Rolagens | Campos | Confirmações | Retorno com perda de contexto |
| --- | --- | --- | --- | --- | --- | --- |
| F1 Triar novo interesse (por lead) | 5 + refiltro (1–3) | 2 | 1 | 1 | 0 | **sim** |
| F2 Perder lead pelo detalhe | 2 | 0 | 0 | 0 | **0 (exigida pela spec)** | — |
| F3 Lead com WhatsApp duplicado | 6–9 | 2 | 0 | 3–4 | 0 | **beco sem saída** |
| F4 Editar parceiro filtrado (por parceiro) | 4 + refiltro (2) | 2 | 1–2 | n | 0 | **sim** |
| F5 Publicar após editar | 3 | 0 | 1–2 | 0 | 0 | — |
| F6 Benefícios para 3 planos | 9 + 6 travessias de linha | 0 | 0 | 3–6 | 0 | — |
| F7 Criar conta + 6 permissões | 11 + cópia manual | 2 | 1–2 | 2 | 0 | **perda silenciosa** ao sair |
| F8 Origem com nome repetido | 3 + cliques sem efeito | 1 | 0 | 1 | 0 | **erro invisível** |
| F9 Auditoria, 3 filtros | 3 | 3 recarregamentos visuais | 0 | 0 | 0 | **sim** |
| F10 Redistribuir carteira (por lead) | 4 + busca visual | 2 | 1 | 0 | 0 | **sim** |

---

## 7. Principais pontos de fricção

Cada achado tem um identificador usado nas seções seguintes. **Freq.** =
alta/média/baixa inferida ou desconhecida. **API?** = a solução exige API.

### 7.1 Leads (frequência alta)

| ID | Problema | Evidência | Impacto | Solução proposta | Esforço | Risco | API? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L1 | Filtros do Kanban perdidos ao abrir o detalhe e voltar | `leads-list.tsx:21-24` (`useState`); trilha aponta para `/leads` sem parâmetros (`app-shell.tsx:197`) | **Alto** | Filtros como *search params* validados da rota `/leads`; a trilha e o "voltar" reusam os parâmetros da última visita à listagem | Pequeno | Baixo | Não |
| L2 | Rolagem volta ao topo ao retornar | `router.tsx` sem `scrollRestoration`; `app-shell.tsx` foca o conteúdo a cada navegação | Médio | Ativar a restauração de rolagem do TanStack Router nas listagens | Pequeno | Baixo | Não |
| L3 | Só o nome do cartão abre o detalhe; o restante é área de arraste | `lead-board.tsx:180-183`; o protótipo aprovado torna o cartão inteiro clicável (`.lead-name::after { inset: 0 }`) | Médio | Cartão inteiro como alvo de abertura, mantendo o arraste pelo limiar de 6px já configurado | Pequeno | Baixo | Não |
| L4 | Etapa alterada pelo `<select>` do detalhe sem confirmação para convertido/perdido e sem motivo | `lead-detail-page.tsx:135-156`; `interface.md`: "Soltar em `converted` ou `lost` exige confirmação"; o protótipo mostra "Alterar etapa" com dialog | **Crítico** (erro irreversível na percepção do usuário, aplicado por teclado) | Botão "Alterar etapa" com o mesmo dialog de confirmação e motivo já usado no Kanban (ver decisão D1) | Pequeno | Baixo | Não |
| L5 | Motivo da perda nunca é exibido | `Lead.lossReason` existe no contrato; o detalhe não o mostra; o protótipo mostra "Motivo da perda" | Médio | Linha "Motivo da perda" em "Dados do lead" quando `stage = lost` | Pequeno | Nenhum | Não |
| L6 | Duplicidade de WhatsApp aparece como "tente novamente" | API: `commercial.service.ts:353` envia `DUPLICATE_RESOURCE` com o id em `detail`; `lead-create-drawer.tsx:52` usa `describeError`, cujo fallback é genérico (`problem.ts:67`) | **Alto** (viola `CA-RF-006-05`) | Erro associado ao campo WhatsApp: "Este WhatsApp já pertence a um lead." + link "Abrir lead existente"; quando o lead está entre os já carregados no Kanban, a mensagem usa o nome dele | Pequeno | Baixo — para quem só vê os próprios leads, o link pode levar a um lead invisível; a rota já redireciona 404 para a listagem | Não |
| L7 | Histórico mostra códigos internos (`lead · stage-changed`) | `lead-detail-page.tsx:270` | Médio | Rótulos legíveis para os 7 tipos emitidos pela API (`lead.created`, `lead.stage-changed`, `lead.assignee-changed`, `lead.source-changed`, `lead.observation-created`, `lead.observation-corrected`, `contact-request.resolved`) usando `data` quando presente; tipo desconhecido cai em rótulo neutro | Pequeno | Baixo | Não |
| L8 | Toda solicitação tratada é rotulada "Primeira solicitação" | `lead-detail-page.tsx:192` usa `resolvedAt` para decidir o rótulo | Médio (informação falsa) | "Solicitação tratada · por {resolvedBy} em {resolvedAt}"; "Novo interesse" para pendentes | Pequeno | Nenhum | Não |
| L9 | A ação mais frequente do detalhe (observar) fica abaixo das solicitações e de toda a lista de observações | ordem dos cartões em `lead-detail-page.tsx:176-279` | **Alto** | Ver C1: pendência de interesse em faixa no topo só quando existe; compositor no topo das observações | Médio | Baixo | Não |
| L10 | Erros do detalhe aparecem no topo da página, longe do controle usado; conflito de versão sem "Carregar versão atual" | `lead-detail-page.tsx:168-174` | Médio | Erro junto à área afetada (compositor, responsável, etapa); conflito com ação de recarga, como em parceiro e usuário | Pequeno | Baixo | Não |
| L11 | "Adicionar observação", "Marcar como tratada" e o seletor de responsável não indicam processamento; duplo envio possível | `commit()` em `lead-detail-page.tsx:64-77` não guarda estado pendente | Médio (viola "Botões indicam processamento") | Estado `loading` por ação e bloqueio enquanto pendente | Pequeno | Nenhum | Não |
| L12 | Filtro de responsável não lista pessoas; para quem só vê os próprios leads, "Todos" e "Sem responsável" não têm sentido | `leads-data.tsx` com opções fixas; `leads-list.tsx` já filtra por id | Médio (bloqueia F10) | Opções derivadas dos responsáveis presentes nos leads carregados; com somente `leads.view-own`, ocultar o filtro | Pequeno | Baixo | Não |
| L13 | Leads com novo interesse não sobem na coluna | ordem da API por `updatedAt` | Baixo | Pendentes primeiro dentro de cada coluna (ordenação local estável) | Pequeno | Cartão muda de posição ao ser tratado — aceitável e esperado | Não |
| L14 | Erro de movimentação do Kanban não pode ser dispensado | `leads-data.tsx`; o protótipo tem "Entendi" | Baixo | Ação "Entendi" no alerta | Pequeno | Nenhum | Não |
| L15 | WhatsApp precisa ser copiado à mão para iniciar o contato | detalhe exibe o número como texto | Médio | Botão "Copiar" ao lado do número | Pequeno | Nenhum | Não |
| L16 | "Devolver lead" duplica a opção "Sem responsável" do seletor; não há "Atribuir a mim" | `lead-detail-page.tsx:307-343` | Baixo | Com `leads.assign`: seletor + "Atribuir a mim" quando o lead não é seu; sem `leads.assign`: somente "Devolver lead" | Pequeno | Baixo | Não |
| L17 | Busca não considera e-mail, embora `LeadSummary.email` esteja carregado | `leads-list.tsx` | Baixo | Incluir e-mail na busca e no placeholder | Pequeno | Nenhum | Não |
| L18 | Cada cartão tem dois pontos de tabulação (artigo arrastável e link) | `lead-board.tsx` | Baixo | Um único ponto focável por cartão; Enter abre, Espaço inicia o arraste por teclado | Médio | Médio (sensor de teclado do dnd-kit) | Não |
| L19 | Contador de novo interesse na navegação, previsto no protótipo, não existe | protótipo `#nav-interest`; `app-shell.tsx` | Baixo | Contador no item "Leads" a partir do cache de leads | Pequeno | Exige consultar leads no shell para quem tem a permissão | Não |

### 7.2 Parceiros

| ID | Problema | Evidência | Impacto | Solução proposta | Esforço | Risco | API? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | Aba e busca perdidas ao voltar do formulário | `use-list-filter.ts:18-19`; "Cancelar" e trilha navegam para `/parceiros` sem estado | **Alto** no fluxo F4 | Mesmo mecanismo de L1, compartilhado por `useListFilter` | Pequeno | Baixo | Não |
| P2 | "Salvar" só no cabeçalho, fora da tela após rolar seções longas | `partner-form.tsx:381-397` | Médio | Barra de salvamento fixa no rodapé da área de conteúdo, visível somente com alterações pendentes (W1) | Médio | Baixo | Não |
| P3 | Publicar exige salvar antes e o botão fica no fim da página abaixo de 1280px | `canRunPublish` exige `!isDirty` (`partner-form.tsx:235-241`); resumo vira bloco final no layout responsivo | Médio | "Salvar e publicar" na barra quando o parceiro não está publicado, o usuário tem `partners.publish` e as pendências locais estão atendidas: duas requisições existentes em sequência (W2) | Médio | Falha parcial: salvo, mas não publicado — mensagem específica e o botão "Publicar" continua disponível | Não |
| P4 | Benefício: o interruptor que habilita a linha fica na última coluna; os campos ficam somente leitura até ele ser ligado | `benefits-editor.tsx:100,115,126` | Médio (F6) | Caixa de seleção com o nome do plano na primeira coluna; ao marcar, o foco vai ao percentual | Pequeno | Baixo | Não |
| P5 | Contatos começam vazios, embora publicar exija ao menos um | `newPartnerValues` com `contacts: []` | Baixo | Novo parceiro inicia com uma linha de WhatsApp vazia, ignorada no envio se continuar vazia | Pequeno | Médio: a regra "linha vazia é ignorada" precisa ser explícita na fronteira `toRequest` | Não |
| P6 | "Remover" unidade tem o mesmo peso de "Editar", lado a lado, sem desfazer | `units-editor.tsx` | Médio (erro com efeito só percebido ao salvar) | "Remover" dentro do painel expandido, separado; unidade removida mostra "Removida · Desfazer" até salvar | Pequeno | Baixo | Não |
| P7 | Navegação de seções não acompanha a rolagem | `activeSection` muda só no clique; `interface.md` exige informar a "seção atual" | Baixo | Seção atual pela posição de rolagem | Pequeno | Baixo | Não |
| P8 | "Editar" aparece no botão da linha e de novo no menu; a linha não é clicável | `partners-data.tsx` | Baixo | Padrão único de linha (W3) | Pequeno | Nenhum | Não |
| P9 | "Cancelar" na edição sem alterações é, na prática, "Voltar" | `partner-form.tsx:383` | Baixo | Cancelar/Descartar somente na barra de salvamento, quando há alterações; trilha continua sendo o retorno | Pequeno | Nenhum | Não |

### 7.3 Usuários, Origens, Planos, Categorias e Auditoria

| ID | Problema | Evidência | Impacto | Solução proposta | Esforço | Risco | API? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U1 | Três caminhos para a mesma ação: linha, "Abrir" e menu com só "Abrir detalhe" | `users-data.tsx:85,132-135` | Baixo | Linha clicável + "Abrir"; sem menu | Pequeno | Nenhum | Não |
| U2 | Código de uso único sem "Copiar"; abaixo de 1024px fica após a grade de permissões | `user-detail-page.tsx:395-413` | **Alto** (código exibido uma única vez) | Faixa no topo da página, largura total, com "Copiar código" e confirmação de cópia | Pequeno | Nenhum | Não |
| U3 | Permissões alteradas são descartadas sem aviso ao sair | o detalhe não usa `useBlocker` (o formulário de parceiro usa) | **Alto** | Mesmo bloqueio de saída do parceiro | Pequeno | Baixo | Não |
| U4 | "Salvar alterações" no topo, longe das caixas marcadas no fim da grade; "Descartar" sempre habilitado | `user-detail-page.tsx:263-279` | Médio | Barra de salvamento (W1) com resumo "+N concedidas · −N revogadas" | Médio | Baixo | Não |
| U5 | Conceder uma área inteira exige marcar cada caixa | `permission-grid.tsx` | Médio para T16 | "Marcar todas" por área, limitado às permissões que o autor possui | Pequeno | Médio: a ação não pode sugerir que concedeu o que o autor não pode conceder — o rótulo mostra "N de M" | Não |
| U6 | Mensagem "Permissões já estão em vigor" mesmo quando só o nome mudou | `user-detail-page.tsx:184` | Baixo | Mensagem conforme o que foi salvo | Pequeno | Nenhum | Não |
| S1 | Busca de Origens não funciona e as abas são um grupo vazio | `sources-page.tsx:106-110` | **Alto** (controle quebrado) | `useListFilter` com abas Ativas/Inativas, como no protótipo | Pequeno | Nenhum | Não |
| S2 | Erro de salvamento renderizado atrás do dialog aberto | `sources-page.tsx:56` grava em estado exibido na página | **Alto** (falha silenciosa) | Erro dentro do dialog e associado ao campo nome | Pequeno | Nenhum | Não |
| S3 | Dialog sem estado de processamento; duplo envio possível | `Drawer` sem `loading` | Médio | `loading` durante a mutação | Pequeno | Nenhum | Não |
| S4 | Ações visíveis divergentes das outras listas ("Desativar" exposto) | `sources-page.tsx` × protótipo (Editar + menu) | Baixo | Padrão W3 | Pequeno | Nenhum | Não |
| C1 | "Editar" duplicado no botão e no menu de planos e categorias | `plans-data.tsx:62`, `categories-data.tsx:61` | Baixo | Menu só com ações que não estão visíveis | Pequeno | Nenhum | Não |
| C2 | Estado vazio por filtro sem ação de limpar | `data-table.tsx` ("Ajuste a busca ou o filtro de estado.") | Médio | Botão "Limpar filtros" no estado vazio por filtro; CTA de criação somente quando a coleção está vazia | Pequeno | Nenhum | Não |
| A1 | Cada filtro ou página substitui a tela inteira pelo esqueleto | `audit-page.tsx:16-18` envolve filtros e tabela no mesmo `Suspense` | Médio | Transição que mantém a tabela anterior esmaecida com indicador, sem desmontar a barra | Pequeno | Baixo | Não |
| A2 | Filtros e página da auditoria se perdem ao navegar | `audit-list.tsx` (`useState`) | Baixo | *Search params* (mesmo mecanismo de L1) | Pequeno | Baixo | Não |
| A3 | "Limpar filtros" sempre visível | `audit-data.tsx` | Baixo | Visível somente quando algo difere do padrão | Pequeno | Nenhum | Não |
| G1 | Grupo "Conta" com um único item na navegação, enquanto o protótipo coloca "Alterar senha" no rodapé da conta | `navigation.ts` × protótipo | Baixo | Seguir o protótipo: ícone no rodapé | Pequeno | Nenhum | Não |
| G2 | Rodapé "Ordem alfabética · sem paginação" em todas as listas | `list-card.tsx` | Baixo (ruído) | Remover; a ordem é evidente | Pequeno | Nenhum (copy do protótipo; decisão D5) | Não |

### 7.4 Lacunas de conformidade (aprovadas, suportadas pela API, ausentes no app)

Estas operações **não são funcionalidades novas**: estão nas specs aprovadas,
no protótipo vinculante e na API. A auditoria as registra porque ausência de
caminho é a fricção máxima. A decisão D2 pede confirmação de que entram nesta
rodada.

| ID | Operação | Spec | Protótipo | API | Situação no app |
| --- | --- | --- | --- | --- | --- |
| K1 | Editar dados de contato e origem do lead | `UC-018`, `CA-RF-007-08` | "Editar dados" no cabeçalho do detalhe | `PATCH /v1/admin/leads/:id` | `leadsApi.update` existe e nunca é chamado |
| K2 | Corrigir a própria observação | `UC-019`, `RN-012` | "Corrigir" na observação do autor | `PATCH /v1/admin/leads/:id/observations/:observationId` | sem UI e sem função de API no módulo |
| K3 | Excluir origem nunca utilizada | `UC-021 A1` | "Excluir" no menu quando a origem tem 0 leads | `DELETE /v1/admin/lead-sources/:id` | sem UI |
| K4 | Contador de novo interesse na navegação | `CA-RF-008-09` (destaque) | `#nav-interest` | dados de `GET /leads` | sem UI (L19) |

**Defeito fora do escopo de UX, registrado para correção técnica:** o detalhe do
lead consulta `GET /leads/assignees` quando o usuário tem `leads.assign`, mas a
rota exige `leads.view-all` (`admin-commercial.routes.ts:34-38`). Quem tem
somente `leads.assign` recebe 403 silencioso e vê o seletor apenas com "Sem
responsável". O detalhe do lead também não segue o padrão de páginas de
detalhe (`loader` + `errorComponent` com nova tentativa e 404 para a listagem)
definido em `architecture.md` e `AGENTS.md`.

---

## 8. UX Papercuts

Atritos pequenos que se repetem durante o dia:

1. Filtro "Novo interesse" refeito a cada retorno do detalhe (L1).
2. Página volta ao topo a cada retorno (L2).
3. Precisão necessária para acertar o nome do cartão (L3).
4. Rolar até o fim das observações para escrever a próxima (L9).
5. Copiar o WhatsApp selecionando o texto (L15).
6. Ler `lead · assignee-changed` para entender o histórico (L7).
7. Ir até o extremo direito da linha para habilitar um plano e voltar para digitar o percentual (P4).
8. Clicar "Adicionar contato" em todo parceiro novo (P5).
9. Subir ao topo para salvar depois de editar o fim do formulário (P2, U4).
10. Salvar, esperar e procurar "Publicar" em outro ponto da página (P3).
11. Selecionar à mão um código que "não será exibido de novo" (U2).
12. Marcar quatro caixas para conceder uma área inteira (U5).
13. Abrir o menu "…" para encontrar a mesma ação do botão ao lado (U1, C1, P8).
14. Digitar na busca de Origens e nada acontecer (S1).
15. Clicar "Salvar" em Origens e nada acontecer (S2).
16. Esqueleto piscando a cada filtro da auditoria (A1).
17. Alerta de falha no Kanban que não sai até a próxima movimentação bem-sucedida (L14).
18. Tabular duas vezes por cartão no Kanban (L18).

---

## 9. Ações repetitivas

| Repetição | Onde | Ganho real de segurança ou compreensão? | Tratamento |
| --- | --- | --- | --- |
| Refazer filtro após cada detalhe | Leads, Parceiros, Usuários, Auditoria | Nenhum | Preservar contexto (L1, P1, A2) |
| Abrir → alterar um campo → voltar → reabrir o próximo, para redistribuir carteira | Leads (F10) | Nenhum | Filtro por responsável (L12) + contexto preservado; o lote fica como oportunidade futura (§26) |
| Marcar permissões individualmente para uma área inteira | Usuário | Nenhum | "Marcar todas" por área (U5) |
| Adicionar a primeira linha de contato | Parceiro novo | Nenhum | Linha inicial (P5) |
| Habilitar e depois preencher cada benefício | Parceiro | Nenhum | Habilitar à esquerda com foco no percentual (P4) |
| Salvar e depois publicar | Parceiro | Parcial: publicar exige estado salvo | "Salvar e publicar" orquestrado, mantendo a mesma verificação de pendências (P3) |
| Selecionar a mesma origem em cadastros consecutivos de leads | Novo lead | Nenhum | Lembrar a última origem escolhida durante a sessão do navegador (W5) — frequência desconhecida |
| Confirmar ações não destrutivas | — | — | **Nenhuma encontrada.** As confirmações existentes protegem desativação, exclusão, anonimização, emissão de código e etapas sensíveis; todas são mantidas. |

---

## 10. Navegação desnecessária

| Caso | Avaliação | Decisão |
| --- | --- | --- |
| Lista → detalhe do lead → lista | O detalhe reúne solicitações, observações, histórico, responsável e privacidade. **Justificado.** O desperdício está no retorno, não na ida. | Manter a página; preservar o contexto (L1, L2). |
| Lista de parceiros → página do formulário | Agregado com cinco seções e salvamento atômico. **Justificado.** | Manter a página. |
| Lista de usuários → detalhe | Permissões, acesso e estado em uma tela. **Justificado.** | Manter a página. |
| Planos, categorias e origens em dialog lateral | Um ou dois campos. **Já é o formato certo.** | Manter. Não propor edição inline: a unicidade normalizada exige validação do servidor e o ganho seria de um clique em tarefa rara. |
| Erro de duplicidade → fechar dialog → buscar → abrir | Navegação manual para uma informação que a API já entregou. | Link direto (L6). |
| Usuário → Auditoria → filtrar pelo usuário | Mudança de contexto e refiltro para uma pergunta natural ("o que mudou nesta conta?"). | Link "Ver na auditoria" no detalhe, levando aos filtros por *search params* (W4, baixa prioridade). |

---

## 11. Posicionamento de ações

| Tela | Ação | Situação | Proposta |
| --- | --- | --- | --- |
| Detalhe do lead | Marcar interesse como tratado | Dentro de um cartão que existe mesmo sem pendência | Faixa de atenção no topo **só quando há pendência**, com a ação ao lado do evento (C1) |
| Detalhe do lead | Adicionar observação | Depois da lista inteira | Compositor no topo do cartão de observações; lista mais recente primeiro |
| Detalhe do lead | Alterar etapa | `<select>` no cabeçalho, sem confirmação | Botão primário "Alterar etapa" no cabeçalho (o objeto é o lead inteiro, então o cabeçalho é o lugar certo) |
| Detalhe do lead | Excluir/anonimizar | Último cartão da coluna lateral, separado | **Manter.** Distante e com confirmação, como deve ser. |
| Formulário de parceiro | Salvar | Somente no cabeçalho | Barra fixa visível com alterações pendentes; o cabeçalho deixa de repetir "Salvar" e "Cancelar" |
| Formulário de parceiro | Publicar | Resumo lateral, dependente de largura | Barra fixa ("Salvar e publicar") + resumo lateral ("Publicar" quando já salvo) |
| Formulário de parceiro | Adicionar unidade | Fim da lista de unidades | Cabeçalho da seção, como no protótipo aprovado |
| Detalhe do usuário | Salvar alterações / Descartar | Cabeçalho, sempre visíveis | Barra fixa com resumo, somente com alterações |
| Detalhe do usuário | Copiar código | Inexistente | Ao lado do código, em faixa no topo |

---

## 12. Hierarquia de ações

| Tela | Ação principal (deveria haver uma) | Situação | Proposta |
| --- | --- | --- | --- |
| Leads | Novo lead | Clara | Manter |
| Detalhe do lead | Registrar observação / alterar etapa | **Nenhuma ação primária**; a etapa é um `<select>` com o mesmo peso de qualquer campo | "Alterar etapa" primário; "Editar dados" secundário; compositor como ação de conteúdo |
| Parceiros, Planos, Categorias, Origens, Usuários | Criar | Clara | Manter; o estado vazio por coleção vazia repete a ação como secundária (já aprovado); o estado vazio por filtro passa a oferecer "Limpar filtros" e não "Criar" |
| Formulário de parceiro | Salvar | Primária, mas "Publicar" compete à distância com um botão secundário | Barra: "Salvar" primário; "Salvar e publicar" secundário quando aplicável |
| Detalhe do usuário | Salvar alterações | Primária sempre presente, mesmo desabilitada; "Descartar" habilitado sem nada para descartar | Barra contextual |
| Auditoria | — (tela de leitura) | Correto não ter primária | Manter |

**Ações de linha — padrão proposto (W3).** A linha inteira abre o registro
(como já ocorre em Usuários e na Auditoria). O botão visível é a ação mais
frequente (Editar ou Abrir). O menu "…" contém apenas o que **não** está
visível: ações de estado e, separadas, as destrutivas. Se o menu ficaria vazio,
ele não aparece. Nenhuma ação frequente vai para o menu.

---

## 13. Problemas de formulários

| Formulário | Problema | Proposta |
| --- | --- | --- |
| Novo lead | Campos montados com `<input>` cru: sem erros por campo, sem foco inicial, sem dica de formato do WhatsApp, divergente dos demais dialogs (`InputField`) | Mesmos controles e padrão de erro dos outros dialogs; foco em Nome; dica "Com DDD"; erro de duplicidade no campo (L6) |
| Novo lead | Origem vazia a cada abertura | Lembrar a última origem da sessão (W5), sem pré-selecionar na primeira vez |
| Parceiro | Ordem dos campos acompanha a entidade; seções e pendências bem resolvidas | **Manter** a estrutura; corrigir P4, P5, P6, P7 |
| Parceiro | Destaque é campo do formulário, mas na lista é ação imediata | **Manter**: na lista é atalho de baixo risco; no formulário acompanha o salvamento. Registrado para consistência, sem mudança. |
| Usuário | Dados e permissões são salvos juntos por um único botão | **Manter** a operação única; mostrar resumo do que será salvo (U4) |
| Origem | Erro fora do dialog; sem `loading` | S2, S3 |
| Plano | Identificador público editável só na criação, com dica clara | **Manter** |

---

## 14. Problemas de tabelas

- **Ordem de colunas:** adequada em todas as listas (identificação primeiro,
  estado por último). Sem mudança.
- **Coluna pouco útil:** "Identificador público" em Planos é consultado
  raramente, mas é a única forma de conferir o link do catálogo sem abrir o
  dialog. Manter.
- **Alvo de clique:** Usuários e Auditoria têm linha clicável; Parceiros, Planos,
  Categorias e Origens não. Unificar (W3).
- **Fitts:** em telas largas, a ação da linha fica no extremo direito
  (`w-px` + `text-right`). Com a linha inteira clicável, o trajeto até a
  borda deixa de ser necessário para a ação mais frequente; o botão visível
  permanece para descoberta e teclado.
- **Estado vazio:** não diferencia "nada cadastrado" de "nada encontrado" na
  ação oferecida (C2).
- **Rodapé:** ruído técnico (G2).

---

## 15. Problemas de filtros e busca

| Lista | Posição/visibilidade | Persistência | Limpeza | Feedback | Proposta |
| --- | --- | --- | --- | --- | --- |
| Leads | Barra própria acima do quadro; boa | **Perdida** | Inexistente | Contagem de leads com `aria-live` | L1, L12, L17; "Limpar filtros" quando houver filtro ativo |
| Parceiros/Planos/Categorias/Usuários | Abas + busca no cartão; boa | **Perdida** | Só manualmente | Contagem "N de M" no rodapé | P1; "Limpar filtros" no vazio por filtro (C2) |
| Origens | Abas vazias + busca **sem efeito** | — | — | — | S1 |
| Auditoria | Quatro seletores; bom | **Perdida** | Sempre visível | Esqueleto substitui tudo | A1, A2, A3 |

Busca: é local, instantânea e sem acento/caixa (bom; não precisa de *debounce*
nem de envio). O placeholder diz o que pode ser buscado. Resultado vazio é
explicado. O termo **não** sobrevive à navegação — resolvido com os *search
params*.

---

## 16. Problemas de páginas de detalhe

**Detalhe do lead.** A pessoa chega por dois motivos: há um novo interesse para
tratar, ou ela acabou de falar com o lead e quer registrar o que aconteceu. A
página atual responde a ambos depois de um cartão de solicitações quase sempre
sem pendência e de toda a lista de observações. Ver C1.

**Formulário de parceiro.** Bom equilíbrio entre seções e resumo lateral. O
problema é a distância entre editar e salvar/publicar (P2, P3).

**Detalhe do usuário.** Quem abre logo após criar a conta precisa, nesta
ordem: entregar o código e conceder permissões. O código fica na coluna lateral
e, em telas menores, abaixo da grade (U2).

---

## 17. Problemas de fluxos de criação e edição

| Fluxo | Hoje | Próxima ação natural | Proposta |
| --- | --- | --- | --- |
| Criar parceiro | Salva rascunho e abre a página do parceiro criado (bom) | Publicar ou completar seções | Barra de salvamento já com "Publicar" disponível quando aplicável (W1, W2) |
| Criar usuário | Abre o detalhe da conta (bom) | Entregar código, conceder permissões | Código em destaque com copiar (U2); grade com "Marcar todas" (U5) |
| Criar lead | Fecha o dialog e mostra toast; o cartão aparece em "Novo" | Registrar o primeiro contato | Toast com ação "Abrir lead" (o toast passa a aceitar uma ação opcional; Radix já suporta) |
| Criar plano/categoria/origem | Fecha o dialog e atualiza a lista | Nenhuma obrigatória | **Manter** |
| Editar parceiro | Permanece na página com toast (bom) | Próximo parceiro da mesma lista | Retorno preserva a lista (P1) |
| Editar usuário | Permanece na página | Voltar à lista | Retorno preserva a lista |

---

## 18. Preservação de contexto

| Contexto | Leads | Parceiros | Planos/Categorias/Origens | Usuários | Auditoria |
| --- | --- | --- | --- | --- | --- |
| Busca | perdida | perdida | perdida ao trocar de módulo | perdida | — |
| Filtros/aba | perdidos | perdidos | perdidos ao trocar de módulo | perdidos | perdidos |
| Página | — | — | — | — | perdida |
| Rolagem | perdida | perdida | perdida | perdida | perdida |
| Overlay aberto | — | — | dialog fecha ao salvar (correto) | — | dialog fecha (correto) |

**Proposta (W-base).** Os filtros de cada listagem passam a ser *search params*
validados na rota (`validateSearch`), com valores padrão omitidos da URL. O
retorno usa o histórico do navegador ou os parâmetros da última visita àquela
listagem (trilha e "Cancelar"). A restauração de rolagem do roteador é
ativada. Benefícios adicionais sem custo: URL compartilhável ("veja os
rascunhos") e sobrevivência a recarregamentos. Não há estado global novo nem
`localStorage`.

---

## 19. Problemas de feedback

| Operação | Durante | Depois | Proposta |
| --- | --- | --- | --- |
| Mover lead (arraste) | Otimista (bom) | Cartão na nova coluna (bom, sem toast) | Manter; dispensar erro (L14) |
| Mudar etapa no detalhe | Nenhum | Badge muda | Dialog com botão em `loading`; toast curto |
| Observação / tratar interesse / atribuir | **Nenhum**; duplo envio possível | Item aparece | `loading` por ação (L11) |
| Salvar origem | **Nenhum** | Dialog fecha; erro invisível | S2, S3 |
| Salvar parceiro / usuário | `loading` (bom) | Toast + "Salvo" no resumo (bom) | Barra mostra "Salvando…" e some ao concluir |
| Filtrar/paginar auditoria | Esqueleto de página inteira | Tabela nova | A1 |
| Copiar | — | — | Confirmação "Copiado" no próprio botão por 2s, sem toast |

Toasts continuam como complemento de sucesso e nunca como única forma de erro,
conforme `interface.md`. Ações cujo resultado é visível no lugar (mover
cartão, marcar caixa) não ganham toast.

---

## 20. Oportunidades de progressive disclosure

| Onde | O que recolher | Por quê | O que **não** recolher |
| --- | --- | --- | --- |
| Detalhe do lead | Solicitações já tratadas (lista recolhida "N solicitações tratadas") | Raramente consultadas depois de tratadas | Pendência ativa, observações, responsável |
| Detalhe do lead | Histórico: últimos 5 eventos + "Ver histórico completo" | Longo em leads antigos, consultado sob demanda | — |
| Formulário de parceiro | Unidades salvas já recolhidas (já ocorre) | Bom | — |
| Detalhe do usuário | Nada | A grade é a tarefa | Não recolher áreas de permissão: o administrador precisa ver tudo o que concede |
| Novo lead | "Detalhe da origem" visível só após escolher a origem | Reduz um campo na abertura | "Quem indicou" continua condicionado à origem |

---

## 21. Quick Wins (A)

Alto impacto, esforço pequeno, sem API. Ordenados por prioridade.

| # | Itens | O que muda | Impacto |
| --- | --- | --- | --- |
| A1 | L4 + L5 | "Alterar etapa" com confirmação e motivo no detalhe; exibir motivo da perda | Crítico |
| A2 | L1 + P1 + A2 + L2 | Filtros e busca em *search params*; restauração de rolagem | Alto |
| A3 | L6 | Erro de WhatsApp duplicado no campo + "Abrir lead existente" | Alto |
| A4 | S1 + S2 + S3 | Origens: busca e abas funcionando; erro dentro do dialog; `loading` | Alto |
| A5 | U2 + U3 | Código com copiar no topo; bloqueio de saída com permissões não salvas | Alto |
| A6 | L3 + L13 + L15 + L17 | Cartão inteiro clicável; pendentes primeiro; copiar WhatsApp; busca por e-mail | Médio, alta frequência |
| A7 | L7 + L8 + L11 | Histórico legível; rótulo correto das solicitações; `loading` nas ações do detalhe | Médio |
| A8 | L12 | Filtro de responsável com pessoas (oculto para quem só vê os próprios) | Médio |
| A9 | P4 | Habilitar benefício na primeira coluna, com foco no percentual | Médio |
| A10 | C1 + U1 + C2 + A3 + L14 | Sem ações duplicadas; "Limpar filtros" no vazio por filtro; dispensar erro do Kanban | Baixo, ubíquo |

---

## 22. Melhorias de workflow (B)

| # | Melhoria | Itens | Por quê | Trade-off |
| --- | --- | --- | --- | --- |
| W1 | **Barra de salvamento contextual** para formulários longos (parceiro e usuário): aparece fixa no rodapé do conteúdo só com alterações, mostra o resumo, "Descartar" e "Salvar" | P2, P9, U4 | Salvar fica a um clique de onde a edição terminou; some quando não há o que salvar, reduzindo botões permanentes no cabeçalho | Um elemento fixo a mais; em mobile ocupa ~56px do rodapé |
| W2 | **Salvar e publicar** no parceiro | P3 | Elimina a ida e volta entre salvar e procurar "Publicar" | Duas requisições: se a publicação falhar, a interface informa "Salvo, mas não publicado" e lista as pendências da API |
| W3 | **Padrão único de ações de linha** em todas as listas | P8, U1, C1, S4, §12 | Previsibilidade entre módulos; menos alvos | Remove itens de menu hoje redundantes (nenhuma capacidade é perdida) |
| W4 | **Atalho Usuário → Auditoria** filtrada pelo afetado | §10 | Responde "o que mudou nesta conta?" sem refiltrar | Depende de A2; frequência baixa |
| W5 | **Novo lead mais rápido**: controles padronizados, foco inicial, última origem lembrada na sessão, toast com "Abrir lead" | §13, §17 | Reduz decisões repetidas no cadastro | Frequência desconhecida; a lembrança da origem fica em `sessionStorage` e nunca pré-seleciona na primeira abertura |
| W6 | **Lacunas K1–K4** | §7.4 | Fluxos aprovados hoje impossíveis | Depende da decisão D2 |
| W7 | P5, P6, P7, L16, L18, U5, U6, A1, G1 | — | Polimentos de formulário e teclado | — |

---

## 23. Melhorias estruturais (C)

Só uma mudança estrutural se justifica.

**C1 — Reordenar o detalhe do lead em torno da próxima ação.**

```text
ATUAL                                   PROPOSTO
Cabeçalho: nome · badges · [select]     Cabeçalho: nome · badges · [Editar dados] [Alterar etapa]
┌ Solicitações de contato (sempre) ┐    ┌ ● Novo interesse pendente · 10/10 08:14 ─ [Marcar como tratada] ┐ (só se houver)
│ Observações                      │    ┌ Observações ─────────────────────────┐ ┌ Dados do lead ─────┐
│   lista antiga → nova            │    │ [ compositor ]          [Adicionar]  │ │ WhatsApp [Copiar]  │
│   [ compositor ]                 │    │ nota mais recente · Corrigir         │ │ Motivo da perda    │
│ Histórico (códigos)              │    │ …                                    │ ├ Responsável ───────┤
└──────────────────────────────────┘    ├ Histórico legível (5 + ver tudo) ────┤ │ [seletor] [A mim]  │
Lateral: Dados · Responsável ·          ├ Solicitações tratadas (recolhidas) ──┤ ├ Privacidade ───────┤
         Privacidade                    └──────────────────────────────────────┘ └────────────────────┘
```

Por que melhora: a ação que motivou a visita fica no primeiro viewport em
ambos os casos de uso; a pendência deixa de ocupar espaço quando não existe;
o histórico vira informação, não código. Trade-off: o cartão
"Solicitações de contato" deixa de ser fixo — a informação continua
disponível (pendente em destaque, tratadas recolhidas). Não há dado novo.

**Rejeitadas após análise:**

- Transformar o detalhe do lead em *sheet* sobre o Kanban: o detalhe tem
  histórico, observações, responsável e privacidade; a especificação pede
  página própria; ganharia contexto do quadro mas perderia espaço e URL
  estável. Com L1+L2 o retorno já é barato.
- Edição inline de nomes em Planos/Categorias/Origens: tarefa rara, validação
  de unicidade no servidor, risco de renomeação acidental.
- Ações em lote (desativar parceiros, redistribuir leads): ver §26.
- "Dias na etapa" ou "atualizado há" no cartão, usando `updatedAt`:
  aproxima-se de "alertas de contato atrasado", explicitamente fora do escopo
  em `business-rules.md`.
- Remover a confirmação de "Convertido" ao arrastar: menos cliques, mas a
  confirmação é exigida pela especificação e protege um desfecho de negócio.
- Valor padrão de percentual ao habilitar um benefício: decisão com
  consequência pública (desconto exibido no catálogo); o foco vai ao campo,
  o valor não é sugerido.

---

## 24. Mapa frequência × fricção

| | **Fricção alta** | **Fricção baixa** |
| --- | --- | --- |
| **Frequência alta** | L1, L2 (contexto perdido) · L9 (observar no fim) · L4 (etapa sem confirmação — risco) · L3 (alvo pequeno) | L7, L8 (rótulos) · L13 (ordem) · L15 (copiar) · L17 (e-mail) · L14 (erro persistente) · L18 (tabulação) · L19 (contador) |
| **Frequência baixa** | P2, P3 (salvar/publicar distantes) · P4 (benefícios) · U2, U3 (código e saída sem aviso) · S1, S2 (controles quebrados) · A1 (esqueleto) | P5, P6, P7, P8, P9 · U1, U5, U6 · C1, C2 · A3 · G1, G2 |
| **Frequência desconhecida** | L6 (duplicidade: beco sem saída) · L12/F10 (redistribuir carteira) · K1–K3 (sem caminho) | W5 (origem repetida no cadastro) |

---

## 25. Priorização por impacto

Prioridade = frequência × fricção × risco de erro. Esforço considerado à parte.

| Prioridade | Item | Freq. | Fricção | Risco de erro | Esforço |
| --- | --- | --- | --- | --- | --- |
| 1 | A1 — etapa com confirmação no detalhe | Alta | Baixa | **Alto** | Pequeno |
| 2 | A2 — contexto preservado | Alta | **Alta** | Baixo | Pequeno |
| 3 | C1 — detalhe do lead orientado à próxima ação | Alta | **Alta** | Baixo | Médio |
| 4 | A3 — duplicidade de WhatsApp | Desconhecida | **Alta** | Médio | Pequeno |
| 5 | A4 — Origens funcionando | Baixa | **Alta** | Médio | Pequeno |
| 6 | A5 — código e saída sem aviso | Baixa | Alta | **Alto** | Pequeno |
| 7 | A6, A7, A8 — Kanban e histórico | Alta | Média | Baixo | Pequeno |
| 8 | W6 — lacunas K1–K4 | Desconhecida | **Total** | — | Médio |
| 9 | W1 + W2 — barra de salvamento e publicar | Baixa (sessões longas) | Alta | Médio | Médio |
| 10 | A9, A10, W3 | Média | Média | Baixo | Pequeno |
| 11 | W4, W5, W7 | Baixa/desconhecida | Baixa | Baixo | Pequeno |

---

## 26. OPORTUNIDADES FUTURAS — DEPENDEM DE API

Fora de escopo. Nenhuma foi implementada nem usada para justificar mudança de
contrato.

| Oportunidade | Por que depende de API |
| --- | --- |
| Redistribuir em lote os leads de uma conta desativada (`CA-RF-015-08`) | Orquestrar N `PUT /assignee` no cliente não é atômico, multiplica conflitos de versão e não tem limite seguro conhecido; exige operação em lote no servidor |
| Ativar/desativar vários parceiros, planos ou categorias de uma vez | Mesmo motivo; frequência não documentada |
| Contagem de parceiros por plano e por categoria nas listas (o protótipo mostra) | `Plan` e `Category` não trazem contagens; derivá-las carregando todos os parceiros nas telas de plano/categoria acopla módulos e exige `partners.view` |
| Nomes de autor/afetado na auditoria para quem não tem `users.view` | O evento traz `username` e ids; nomes completos exigem dado adicional |
| Busca de leads no servidor e paginação do Kanban em volume alto | A listagem completa funciona no volume atual; não há meta de volume definida |
| Preenchimento de endereço por CEP | Depende de serviço externo; RN-033 não exige correspondência geográfica |

---

## 27. Fluxos CURRENT vs PROPOSED

| Fluxo | Etapas atuais | Atritos | Etapas propostas | Ganho |
| --- | --- | --- | --- | --- |
| F1 Triar novo interesse (por lead) | 5 cliques + refiltro, 2 contextos, 1 rolagem | contexto perdido, alvo pequeno, ação no fim | 4 cliques, 2 contextos, 0 rolagem, 0 refiltro | **Alto** (multiplicado por lead) |
| F2 Perder lead pelo detalhe | 2 cliques, **sem confirmação** | erro sem proteção, motivo impossível | 3–4 cliques com confirmação e motivo | **Alto em segurança** (mais cliques, de propósito) |
| F3 WhatsApp duplicado | 6–9 cliques, beco sem saída | mensagem genérica | 4 cliques + "Abrir lead existente" | **Alto** |
| F4 Editar parceiro filtrado (por parceiro) | 4 + 2 de refiltro, 1–2 rolagens | contexto perdido, salvar no topo | 3, 0 refiltro, 0 rolagem para salvar | Médio |
| F5 Publicar após editar | 3 cliques + rolagem | ação dupla e distante | 1 clique ("Salvar e publicar") | Médio |
| F6 Benefícios para 3 planos | 9 cliques + 6 travessias | interruptor no extremo | 3 cliques, 0 travessias | Médio |
| F7 Criar conta + permissões de uma área | 11 cliques + cópia manual, perda silenciosa possível | código sem copiar, salvar distante, sem aviso | 7 cliques, "Copiar código", aviso ao sair | Alto em segurança |
| F8 Origem com nome repetido | cliques sem efeito | erro escondido | erro no campo | **Alto** |
| F9 Auditoria, 3 filtros | 3 recarregamentos visuais, filtros perdidos | esqueleto, foco perdido | 3 trocas sem desmontar a barra; URL preservada | Médio |
| F10 Redistribuir carteira (por lead) | 4 + busca visual + refiltro | sem filtro por pessoa | 4, filtro por pessoa preservado | Médio (lote fica em §26) |

Fluxos analisados e **mantidos** (já eficientes): mover lead por arraste;
criar/editar plano, categoria e origem em dialog lateral; desativar com
confirmação; emissão de código com confirmação; criar parceiro → página do
parceiro criado; criar usuário → detalhe.

---

## 28. Protótipo das mudanças mais importantes

[index.html](index.html) — mesma base visual do protótipo aprovado (CSS
copiado sem alteração de tokens), com os fluxos:

| Fluxo no protótipo | Itens | Estados demonstrados |
| --- | --- | --- |
| Leads — triagem e retorno | L1, L2, L3, L12, L13, L19, C2, L14 | padrão, filtrado, vazio por filtro, erro de movimentação, retorno do detalhe |
| Leads — detalhe | C1, L4, L5, L7, L8, L10, L11, L15, L16, K1, K2 | padrão, salvando observação, sucesso, conflito, lead perdido, dialog de etapa, edição de dados |
| Leads — novo lead | L6, W5 | padrão, salvando, WhatsApp duplicado, sucesso com "Abrir lead" |
| Parceiros — formulário | P2, P3, P4, P6, W1, W2 | sem alterações, com alterações, salvando, publicado, falha parcial |
| Usuários — detalhe | U2, U3, U4, U5 | sem alterações, com alterações, código emitido, saída com alterações |
| Listagens — padrão de linha e Origens | W3, S1, S2, C1, C2, U1 | padrão, vazio por filtro, erro de salvamento no dialog |
| Auditoria — filtros | A1, A2, A3 | padrão, carregando filtro, vazio |

---

## 29. Arquivos das specs afetados após aprovação

| Arquivo | Mudança prevista |
| --- | --- |
| [`apps/dashboard/interface.md`](../../../../apps/dashboard/interface.md) | Leads: alteração de etapa no detalhe (resolução de D1), ordem do detalhe, histórico legível, duplicidade; Listagens: preservação de contexto, padrão de ações de linha, vazio por filtro; Parceiros: barra de salvamento e "Salvar e publicar"; Usuários: código com copiar, bloqueio de saída, marcar área; Auditoria: filtros na URL e carregamento sem desmontar; Confirmações e feedback: barra de salvamento, cópia |
| [`prototypes/dashboard/index.html`](../../index.html) | Consolidar as telas aprovadas |
| [`apps/dashboard/architecture.md`](../../../../apps/dashboard/architecture.md) | Filtros de listagem como *search params* validados na rota; restauração de rolagem; transição para filtros paginados sem suspender a página |
| [`apps/dashboard/design-system/README.md`](../../../../apps/dashboard/design-system/README.md) | Documentar a barra de salvamento e o botão de copiar como composições das primitives existentes (sem token novo) |
| [`quality/strategy.md`](../../../../quality/strategy.md) | Avaliar inclusão de "retorno ao Kanban preserva filtros" no E2E de leads; registrar que o dashboard não tem testes de componente hoje |
| [`ui-foundations.md`](../../../../apps/ui-foundations.md) | Nenhuma mudança prevista |

---

## Decisões registradas

Aprovação do responsável em 2026-10-11:

| ID | Decisão |
| --- | --- |
| D1 | O protótipo é a fonte da verdade: o cartão do Kanban mantém o botão "Alterar etapa" e o detalhe usa "Alterar etapa" com o mesmo dialog. Soltar o cartão em "Convertido" ou "Perdido" abre esse dialog já preenchido. `interface.md` foi ajustada. |
| D2 | Tudo o que o protótipo mostra e o app não tem é implementado (inclui K1–K4). |
| D3 | **Sem filtros na URL.** Filtros, busca, abas e página são preservados em memória durante a sessão do navegador; a rolagem é restaurada pelo roteador. W4 (atalho para a auditoria filtrada) sai do escopo. |
| D4 | **Salvar e publicar continuam separados.** W2 rejeitada; a barra de salvamento oferece somente Descartar e Salvar. |
| D5 | Rodapé "Ordem alfabética · sem paginação" removido. |

## Decisões apresentadas para aprovação (registro)

| ID | Decisão | Recomendação |
| --- | --- | --- |
| D1 | `interface.md` diz que no Kanban "não há botão ou dialog de seleção manual de etapa"; o protótipo aprovado mostra um botão de troca de etapa no cartão **e** "Alterar etapa" com dialog no detalhe; o app usa um `<select>` no detalhe sem confirmação. Qual é o comportamento do detalhe? | Cartão **sem** botão (segue a spec); detalhe com "Alterar etapa" + dialog com a mesma confirmação e motivo do Kanban (segue o protótipo). Ajustar o texto de `interface.md` para delimitar a restrição ao Kanban e remover o botão do cartão do protótipo. |
| D2 | As lacunas K1–K4 entram nesta rodada? | Sim, como W6. |
| D3 | Filtros na URL (*search params*) ou somente em memória durante a sessão? | URL: sobrevive a recarga, permite compartilhar e usa o roteador já adotado. |
| D4 | "Salvar e publicar" orquestrado com duas requisições existentes. | Aprovar, com a mensagem de falha parcial descrita em W2. |
| D5 | Remover o rodapé "Ordem alfabética · sem paginação" das listas (copy presente no protótipo aprovado). | Remover. |
