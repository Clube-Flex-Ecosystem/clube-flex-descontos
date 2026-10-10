# Especificações — Clube Flex

Esta pasta é a fonte de referência para o planejamento e a futura implementação do Clube Flex.

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

## UI/UX em validação

- [Fundamentos compartilhados](apps/ui-foundations.md)
- [Design system proposto do dashboard](apps/dashboard/design-system/README.md)
- [Protótipo navegável do dashboard](prototypes/dashboard/index.html)
- [Protótipo navegável do catálogo](prototypes/catalog/index.html)

Os protótipos são referências demonstrativas e não constituem implementação das aplicações.

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
