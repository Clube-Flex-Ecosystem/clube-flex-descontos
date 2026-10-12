# Estratégia de qualidade

**Etapa:** 10 — Qualidade  
**Estado:** Aprovado

## Princípios

- A profundidade dos testes é proporcional ao risco da regra ou integração.
- Casos de uso e regras de negócio são testados na camada mais rápida que forneça confiança suficiente.
- Fluxos críticos também são exercitados pelas fronteiras reais das aplicações.
- Não haverá meta percentual global de cobertura sem relação com risco.
- Um teste deve ser determinístico, independente da ordem e claro sobre o comportamento protegido.

## Testes da API

- Vitest é o executor.
- A API mantém somente testes de integração por HTTP, exercitando as rotas e a aplicação Express completa.
- Cenários de regras ramificadas, segurança, transações e contratos são cobertos nessa suíte, sem testes unitários paralelos de use cases ou repositories.
- Relógio e serviços externos podem ser controlados para reproduzir expiração e falhas; PostgreSQL e repositories Drizzle participam da execução real.

## Testes de integração da API

- Vitest executa a suíte e Supertest exercita a aplicação Express completa por HTTP.
- Controllers, middlewares, use cases, repositories Drizzle, migrations e PostgreSQL real participam dos testes.
- O PostgreSQL é descartável e isolado por execução.
- Todas as migrations são aplicadas antes da suíte.
- O banco é limpo ou recriado para evitar dependência de ordem.
- PostgreSQL e repositories Drizzle não são substituídos por mocks nessa camada.
- Resend e outras dependências externas utilizam adaptadores controlados.

## Testes ponta a ponta

Playwright cobre uma suíte pequena de jornadas críticas:

1. selecionar plano, filtrar catálogo e abrir parceiro;
2. enviar interesse pela jornada do assistente virtual;
3. autenticar no dashboard;
4. cadastrar e publicar parceiro;
5. arrastar lead no Kanban para outra etapa, incluindo confirmação em etapa sensível;
6. confirmar restrição por permissão.

Os testes ponta a ponta não duplicam exaustivamente todas as variações já verificadas pelas suítes inferiores.

## Segurança e privacidade

Devem possuir testes automatizados:

- autenticação e encerramento de sessão;
- efeito imediato de alterações de permissões;
- escopo de visualização e edição de leads;
- rejeição de mutações autenticadas provenientes de origem declarada não autorizada;
- resposta neutra contra enumeração de contatos e contas;
- expiração, tentativas, uso único e invalidação de códigos;
- fallback manual seguro quando o envio administrativo de código falhar;
- neutralidade da recuperação pública diante de falha do provedor de e-mail;
- correspondência entre a versão pública de consentimento e a versão aceita no envio;
- rate limiting dos pontos definidos;
- redação de credenciais e dados pessoais nos logs;
- exclusão ou anonimização conforme o histórico existente;
- proteções do último administrador e contra autoalteração indevida.

## Acessibilidade

- Axe é executado nos fluxos públicos essenciais.
- Navegação completa por teclado é verificada nos fluxos públicos.
- Contraste, foco visível, movimento reduzido, dialogs e anúncios de conteúdo dinâmico são validados.
- Antes da primeira publicação, os fluxos públicos essenciais passam por verificação manual com leitor de tela.
- O dashboard adota verificações básicas, ainda que WCAG 2.2 AA formal se aplique somente ao catálogo nesta entrega.

## Verificações obrigatórias no CI

- formatação;
- lint;
- TypeScript;
- testes de integração das rotas da API;
- testes E2E críticos;
- build de catálogo, dashboard e API;
- aplicação das migrations no preparo do banco usado pelos testes de integração;
- coerência ou geração do OpenAPI a partir dos esquemas aprovados.

Falhas obrigatórias impedem merge protegido e deploy automático.

## Cobertura orientada a risco

São obrigatoriamente cobertos:

- regras de publicação e visibilidade do catálogo, por integração pelas rotas da API;
- benefícios e precedência de cupons;
- duplicidade e histórico de leads;
- pipeline, atribuição e escopo de acesso;
- autenticação, sessão, códigos e permissões;
- concorrência otimista e conflitos de versão;
- consentimento, revogação, exclusão e anonimização;
- contratos de erro e respostas neutras;
- transações que alteram mais de um repository.

## Desempenho

### Catálogo público

Metas de Core Web Vitals:

- LCP menor ou igual a 2,5 segundos;
- INP menor ou igual a 200 milissegundos;
- CLS menor ou igual a 0,1;
- avaliação prioritária em condições móveis.

Os valores de campo são avaliados no 75º percentil quando houver medição real disponível. Antes disso, testes de laboratório são usados como aproximação e não como equivalência perfeita a dados reais.

### Operações comuns

- Catálogo e dashboard apresentam resultado ou feedback de carregamento em até 2 segundos sob condições normais.
- Tempo de serviços externos, como envio de e-mail, não integra essa meta.
- Não haverá suíte complexa de carga nesta entrega.
- Será executada verificação básica com volume representativo, procurando consultas excessivas e degradação evidente.

## Navegadores e dispositivos

- Chromium integra a validação de todo pull request.
- Chromium, Firefox e WebKit integram a validação de release.
- Chrome, Edge e Safari reais são verificados manualmente quando disponíveis antes da primeira publicação.
- O catálogo é validado prioritariamente em viewport e interação móvel, sem excluir tablet e desktop.

## Aceite manual

Antes da primeira publicação, devem ser validados:

- catálogo em celular e desktop;
- assistente e consentimento;
- detalhe compartilhável do parceiro;
- login, ativação e recuperação;
- administração e publicação de parceiro;
- pipeline e permissões;
- exclusão ou anonimização;
- auditoria;
- navegação por teclado e leitor de tela nos fluxos públicos essenciais.

Sem staging permanente, o aceite ocorre em build local de produção. Depois do deploy, executa-se smoke test não destrutivo em produção.

## Testes intermitentes

- Uma falha intermitente não pode ser ignorada ou ocultada por repetição ilimitada.
- O teste deve ser corrigido ou colocado temporariamente em quarentena com justificativa, responsável e prazo.
- Fluxos críticos não podem ser liberados enquanto seu teste estiver em quarentena.

## Pendências não bloqueantes

- Escolher as ferramentas de auditoria de bundle e laboratório de desempenho durante a implementação.
- Documentar o dispositivo real disponível para a verificação manual de Safari.
