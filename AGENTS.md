# Instruções para agentes

## Papel deste arquivo

Este arquivo é o protocolo operacional para agentes. A definição oficial do
sistema está em `specs/`; as aplicações em `apps/` são sua implementação.
Consulte [specs/governance.md](specs/governance.md) para a separação de
responsabilidades e a autoridade de cada fonte.

## Fonte de referência

Antes de responder a qualquer prompt ou iniciar qualquer ação no repositório, o agente deve ler `specs/README.md` e consultar a documentação de `specs/` relevante ao pedido. Essa leitura é obrigatória para toda tarefa, inclusive perguntas, alterações de código, revisões e verificações.

A pasta `specs/` é a fonte oficial das especificações do projeto.

Antes de realizar alterações, consulte:

- `specs/README.md`: índice e estado das especificações.
- `specs/product/`: requisitos, domínio e regras de negócio.
- `specs/apps/`: arquitetura, módulos, interfaces e contratos.
- `specs/quality/strategy.md`: testes e critérios de qualidade.
- `specs/delivery/implementation-plan.md`: planejamento das entregas.
- `specs/adr/`: decisões arquiteturais aprovadas.
- `specs/prototypes/`: protótipos navegáveis e fonte de verdade visual e estrutural para construir a UI (layout, componentes, estados, interações, modelo, tipografia, fontes, pesos, cores, espaçamentos, dimensões, raios, sombras e animações).
- `specs/apps/ui-foundations.md`: definição dos fundamentos e tokens de
  interface. O arquivo `apps/dashboard/src/styles/tailwind.css` é apenas a
  materialização desses tokens e não substitui as especificações nem o
  protótipo correspondente.

Leia os documentos relevantes à tarefa, sem carregar desnecessariamente toda a documentação. Para qualquer implementação de UI, consulte obrigatoriamente o protótipo correspondente em `specs/prototypes/` antes de implementar.

## Fidelidade aos protótipos

- As implementações de UI devem seguir rigorosamente o protótipo correspondente em `specs/prototypes/`, que é a fonte de verdade para o modelo visual e estrutural.
- Preserve fielmente layout, hierarquia, componentes, estados, fluxos, interações, fontes, tipografia, pesos, tamanhos, cores, contrastes, espaçamentos, dimensões, raios, sombras e animações/transições demonstrados no protótipo.
- Não substitua, simplifique ou invente decisões visuais e de interação do protótipo. Se houver conflito ou lacuna, pare e solicite esclarecimento; não faça uma interpretação arbitrária.

## Desenvolvimento

- Respeite as decisões arquiteturais aprovadas.
- Não introduza dependências ou abstrações sem justificativa.
- Não duplique regras de negócio ou contratos.
- Mantenha as responsabilidades dos módulos separadas.
- Em páginas de detalhe do dashboard, mantenha autorização no `beforeLoad`, carregamento dos dados obrigatórios no `loader` via `queryOptions` do módulo e tratamento de 404 por redirecionamento para a listagem da feature. Erros restantes devem usar o `errorComponent` da rota; a page não deve duplicar o estado inicial de carregamento e existência do recurso.
- Ao configurar queries do dashboard, preserve a política padrão do `QueryClient` (`staleTime` de 30 segundos, `gcTime` de 5 minutos e atualização ao retornar à aba). Sobrescreva esses valores somente quando houver necessidade específica do domínio e documente a exceção no módulo.
- Use Lucide como fonte de ícones: `lucide-react` no dashboard e `@lucide/astro` no catálogo. No catálogo, componentes de tela importam diretamente os ícones necessários de `@lucide/astro`; não crie adaptadores intermediários nem desenhe SVG manualmente.
- No dashboard, encapsule primitives Radix em `shared/ui`: use-as para dialogs, sheets, confirmações, menus contextuais e toasts; pages e módulos não importam Radix diretamente. Use `tailwind-variants` para variantes e `cn` (`clsx` + `tailwind-merge`) para combinar classes Tailwind. Mantenha componentes simples locais quando não houver comportamento composto que justifique uma primitive externa.
- Construa a UI a partir do protótipo correspondente, aplicando os tokens com Tailwind; não introduza valores visuais literais. A especificação de interface define requisitos funcionais e comportamento; o protótipo define a construção visual e estrutural; os tokens fornecem os valores compartilhados. Em conflito, interrompa e consulte a fonte documental apropriada, sem escolher silenciosamente.
- Priorize simplicidade, legibilidade e manutenção.
- Não invente requisitos para preencher lacunas.
- Solicite esclarecimentos para decisões bloqueantes.

## Fluxo de trabalho

1. Identifique os requisitos e módulos afetados.
2. Consulte os contratos e decisões existentes.
3. Especifique e planeje mudanças relevantes antes de implementar.
4. Solicite aprovação para mudanças arquiteturais.
5. Implemente respeitando o escopo aprovado.
6. Execute os testes e verificações aplicáveis.
7. Atualize as especificações afetadas.

## Qualidade

- Siga `specs/quality/strategy.md`.
- Teste comportamentos, não detalhes desnecessários de implementação.
- Não considere uma tarefa concluída com testes obrigatórios falhando.
- Informe verificações não executadas e problemas conhecidos.

## Restrições

- Não altere decisões aprovadas silenciosamente.
- Não implemente funcionalidades fora do escopo.
- Não execute operações destrutivas sem autorização.
- Não afirme que algo foi validado sem realizar a verificação.
