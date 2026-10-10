# ADR-0006 — Arquitetura interna da API

**Estado:** Aceito  
**Decisão:** 2026-10-10

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
- Implementações concretas ficam na infraestrutura.
- Implementações concretas seguem nomes explícitos, como `DrizzleLeadRepository`.
- Operações envolvendo vários repositories utilizam um contrato de Unit of Work implementado por transações Drizzle.
- Dependências são injetadas por construtor e compostas manualmente, sem container de DI.
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
