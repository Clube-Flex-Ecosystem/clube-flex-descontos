# ADR-0006 — Arquitetura interna da API

**Estado:** Aceito  
**Decisão:** 2026-10-10

## Revisão de composição — 2026-10-12

Mantém-se o fluxo `rota → controller → use case → contrato de repository →
implementação Drizzle`. Cada caso de uso permanece em um arquivo próprio dentro
de `use-cases/`. Cada módulo coeso mantém o contrato de seu repository, com
métodos, entradas e retornos explícitos, e a implementação Drizzle correspondente.

O arquivo `[modulo].route.ts` registra os controllers e os middlewares aplicáveis.
O controller instancia diretamente o repository concreto (`new
DrizzlePlanRepository()`) e os use cases que utiliza, como no padrão de
referência aprovado. O repository Drizzle importa o cliente de banco da
infraestrutura e não recebe o banco no construtor. Use cases dependem somente
do contrato e desconhecem Express e Drizzle.

O ponto central de composição de todos os use cases deixa de existir.
Dependências externas e de operação, como e-mail, hash, relógio e logger,
permanecem na infraestrutura. Casos de uso que coordenam vários repositories
continuam atômicos por um contrato de Unit of Work específico; sua
implementação importa o cliente e abre a transação sem expor Drizzle ao use case.
Quando a operação é exposta por um único repository, ele pode encapsular suas
escritas relacionadas e a auditoria na mesma transação.
Não se introduz uma camada de factory para controllers.

A API mantém como suíte automatizada somente testes de integração pelas rotas,
com Express, Drizzle e PostgreSQL reais. Dependências externas continuam
controladas em teste.

## Contexto

A API centraliza regras e persistência, mas deve continuar compreensível para um único mantenedor. O acesso a dados não deve contaminar os casos de uso com Express ou Drizzle.

## Alternativas consideradas

1. Rotas e serviços acessando Drizzle diretamente.
2. Arquitetura em camadas globais.
3. Monólito modular com controllers, use cases e repositories por domínio.

## Decisão

Adotar o fluxo:

`rota → controller → use case → interface de repository → implementação Drizzle`

- Controllers validam a requisição e traduzem a resposta para HTTP.
- Controllers de um módulo podem permanecer em um único arquivo, constroem respostas manualmente e não serializam diretamente o retorno dos use cases.
- Use cases coordenam as regras da operação, são classes com método `execute`, possuem arquivo próprio e são agnósticos de HTTP e persistência.
- Repositories são acessados por contratos específicos de métodos, parâmetros e retornos e não expõem Drizzle aos use cases.
- Implementações Drizzle ficam junto aos contratos de repository do módulo; o cliente e o esquema compartilhados ficam em `infrastructure/database`.
- Implementações concretas seguem nomes explícitos, como `DrizzleLeadRepository`.
- Casos de uso que coordenam vários repositories utilizam um contrato de Unit of Work implementado por transações Drizzle; operações encapsuladas em um repository podem transacionar ali.
- Dependências dos use cases são recebidas por construtor; sua composição ocorre diretamente no controller, sem container de DI.
- Testes de integração exercitam a API por HTTP com PostgreSQL e repositories Drizzle reais; apenas dependências externas são substituídas.
- Princípios SOLID orientam responsabilidades e dependências de forma pragmática.
- Não será criada uma interface CRUD genérica universal.
- A arquitetura interna do catálogo e do dashboard será decidida posteriormente.

## Consequências

### Positivas

- Casos de uso podem ser testados sem banco ou servidor HTTP.
- Detalhes do Drizzle ficam isolados.
- Responsabilidades ficam explícitas por módulo.

### Negativas

- Existem interfaces e composição manual adicionais.
- Transações que envolvem múltiplos repositories precisam de uma abstração explícita.
- Aplicação indiscriminada de interfaces pode gerar cerimônia, por isso cada abstração deve ter consumidor real.
