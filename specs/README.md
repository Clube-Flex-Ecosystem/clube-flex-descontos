# Especificações — Clube Flex

Esta pasta é a fonte oficial da definição do sistema Clube Flex e a referência
obrigatória para o planejamento e a implementação. O modelo de governança está
consolidado em [Governança SDD](governance.md).

O repositório segue esta separação:

```text
specs/     = definição oficial do sistema
AGENTS.md  = protocolo operacional para agentes
apps/      = implementação das especificações
```

`AGENTS.md` orienta o trabalho do agente, mas não cria requisitos, regras de
negócio, contratos, decisões arquiteturais ou decisões visuais concorrentes.
As aplicações implementam as fontes aprovadas e não redefinem o sistema.

## Estado das etapas

| Etapa | Documento | Estado |
| --- | --- | --- |
| 01 — Visão geral | [product/overview.md](product/overview.md) | Aprovada e registrada |
| 02 — Requisitos | [product/requirements.md](product/requirements.md) | Aprovada |
| 03 — Regras de negócio | [product/business-rules.md](product/business-rules.md) | Aprovada |
| 04 — Casos de uso | [product/use-cases.md](product/use-cases.md) | Aprovada |
| 05 — Modelo de domínio | [product/domain-model.md](product/domain-model.md) | Aprovada |
| 06 — Aplicações | [apps/README.md](apps/README.md) | Aprovada |
| 07 — Arquitetura | [apps/README.md](apps/README.md) | Aprovada |
| 08 — Contratos | [apps/api/contracts/README.md](apps/api/contracts/README.md) | Aprovada |
| 09 — Interface | [apps/catalog/interface.md](apps/catalog/interface.md), [apps/dashboard/interface.md](apps/dashboard/interface.md) e [apps/ui-foundations.md](apps/ui-foundations.md) | Aprovada |
| 10 — Qualidade | [quality/strategy.md](quality/strategy.md) | Aprovada |
| 11 — Implementação | [delivery/implementation-plan.md](delivery/implementation-plan.md) | Aprovada |
| 12 — Revisão | [review.md](review.md) | Aprovada |
| Governança SDD | [governance.md](governance.md) | Referência operacional |

## Fonte da interface

- [Processo de evolução da interface](ui-change-process.md): fluxo obrigatório
  de protótipo, aprovação e implementação para catálogo e dashboard.
- [Fundamentos compartilhados](apps/ui-foundations.md): tokens, escalas, tipografia e papéis das fontes de interface.
- [Design system do dashboard](apps/dashboard/design-system/README.md)
- [Protótipo navegável do dashboard](prototypes/dashboard/index.html)
- [Protótipo navegável do catálogo](prototypes/catalog/index.html)
- Definição dos tokens: [`apps/ui-foundations.md`](apps/ui-foundations.md)
- Materialização atual dos tokens: [`apps/dashboard/src/styles/tailwind.css`](../apps/dashboard/src/styles/tailwind.css)

Os protótipos são a fonte vinculante de construção visual e estrutural da
interface:
qualquer alteração de UI começa no protótipo correspondente, passa por
aprovação explícita e só então é aplicada ao app. Eles usam dados ilustrativos
e não definem contratos, regras de negócio nem arquitetura. O fluxo completo
está em [Processo de evolução da interface](ui-change-process.md).

## Convenções

- **Confirmado:** informação aprovada durante a descoberta.
- **Proposto:** definição que ainda precisa de aprovação.
- **Pendente:** questão ainda não resolvida.
- Requisitos funcionais usam identificadores `RF-XXX`.
- Requisitos não funcionais usam identificadores `RNF-XXX`.
- Regras de negócio usarão identificadores `RN-XXX`.
- Critérios de aceite são vinculados ao requisito correspondente como `CA-RF-XXX-NN`.
- Uma definição deve possuir uma única fonte oficial e ser referenciada pelos demais documentos.

## Princípios

As especificações devem permanecer simples, proporcionais ao escopo e independentes de decisões tecnológicas enquanto essas decisões não forem necessárias e aprovadas.

Nenhuma etapa é considerada concluída apenas pela existência de seu documento. Itens em validação, propostas e pendências devem ser resolvidos antes do início da implementação afetada.
