# Governança SDD — Clube Flex

**Escopo:** relação entre especificações, protocolo operacional e aplicações

Este documento consolida o modelo de Spec-Driven Development do Clube Flex.

## Separação de responsabilidades

```text
specs/
    = definição oficial do sistema

AGENTS.md
    = protocolo operacional para agentes

apps/
    = implementação das especificações
```

### `specs/`

`specs/` é a fonte oficial do sistema. Define, conforme o documento e o
domínio correspondente:

- visão, requisitos, regras de negócio, casos de uso e domínio;
- aplicações, módulos, arquitetura, contratos e decisões registradas em ADRs;
- interface, protótipos, qualidade e plano de implementação.

Uma definição deve possuir uma única fonte oficial. Os demais documentos devem
referenciá-la, em vez de criar uma cópia concorrente.

### `AGENTS.md`

`AGENTS.md` define como o agente trabalha: leitura obrigatória, ordem de
consulta, limites de escopo, fluxo de mudança, verificações e critérios de
parada. Ele não é fonte de requisitos, regras de negócio, contratos,
arquitetura ou decisões visuais do produto.

Quando uma orientação operacional depender de uma decisão do sistema, o
`AGENTS.md` deve apontar para a especificação correspondente, sem reproduzir o
conteúdo normativo dela.

### `apps/`

As aplicações materializam as especificações aprovadas. Código em `apps/` não
é fonte para redefinir requisitos, regras, contratos, arquitetura ou interface.
Uma divergência encontrada na implementação deve ser tratada como diferença a
corrigir ou como mudança de especificação a ser aprovada, nunca como decisão
silenciosa no código.

## Autoridade por tipo de decisão

As fontes são separadas por responsabilidade:

| Tipo de decisão | Fonte oficial |
| --- | --- |
| Produto, requisitos, regras, casos de uso e domínio | documentos em `specs/product/` |
| Aplicações, arquitetura e decisões técnicas | `specs/apps/` e `specs/adr/` |
| Contratos HTTP e representações | `specs/apps/api/contracts/` |
| Qualidade e verificações | `specs/quality/strategy.md` |
| Ordem e escopo de entrega | `specs/delivery/implementation-plan.md` |
| Fluxos, copy, comportamento e estados funcionais da interface | `specs/apps/*/interface.md` |
| Estrutura visual, composição, medidas, tipografia, pesos, cores, espaçamentos, animações e estados visuais | protótipo correspondente em `specs/prototypes/` |
| Tokens e fundamentos compartilhados de interface | `specs/apps/ui-foundations.md`; o arquivo de tokens em `apps/` é sua materialização |
| Procedimento de trabalho do agente | `AGENTS.md` |

O protótipo é a fonte vinculante da construção visual e estrutural da UI. Ele
não substitui contratos, regras de negócio, arquitetura ou requisitos
funcionais. Quando houver aparente conflito entre fontes, a diferença deve ser
registrada e resolvida na documentação antes da implementação afetada; o
agente não deve escolher silenciosamente.

## Ciclo de mudança

1. Identificar a fonte oficial afetada e os documentos relacionados.
2. Alterar a especificação ou o protótipo correspondente, mantendo as
   referências e a rastreabilidade.
3. Registrar a aprovação exigida pelo processo aplicável.
4. Implementar em `apps/` somente dentro do escopo aprovado.
5. Executar as verificações definidas em `specs/quality/strategy.md`.
6. Atualizar as especificações afetadas e confirmar que a implementação está
   alinhada às fontes oficiais.

Para UI, o fluxo específico de protótipo, aprovação e aplicação é obrigatório
e está definido em [ui-change-process.md](ui-change-process.md).

## Estados e bloqueios

Os estados documentais existentes (`Confirmado`, `Proposto` e `Pendente`) devem
ser preservados. Itens `Propostos` ou `Pendentes` não podem ser tratados como
decisões aprovadas durante a implementação.

Uma tarefa fica bloqueada quando a fonte oficial está ausente, contraditória,
pendente de aprovação ou não permite determinar a implementação sem inventar
uma decisão. Nesses casos, o agente deve relatar o documento e a decisão que
faltam.
