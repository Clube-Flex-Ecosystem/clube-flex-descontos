# Instruções para agentes

## Fonte de referência

A pasta `specs/` é a fonte oficial das especificações do projeto.

Antes de realizar alterações, consulte:

- `specs/README.md`: índice e estado das especificações.
- `specs/product/`: requisitos, domínio e regras de negócio.
- `specs/apps/`: arquitetura, módulos, interfaces e contratos.
- `specs/quality/strategy.md`: testes e critérios de qualidade.
- `specs/delivery/implementation-plan.md`: planejamento das entregas.
- `specs/adr/`: decisões arquiteturais aprovadas.
- `specs/prototypes/`: protótipos navegáveis, fonte visual e estrutural para construir a UI (layout, componentes, estados e interações).
- `apps/dashboard/src/styles/tailwind.css`: tokens de cor, tipografia, escalas, raios e sombras de catálogo e dashboard.

Leia os documentos relevantes à tarefa, sem carregar desnecessariamente toda a documentação.

## Desenvolvimento

- Respeite as decisões arquiteturais aprovadas.
- Não introduza dependências ou abstrações sem justificativa.
- Não duplique regras de negócio ou contratos.
- Mantenha as responsabilidades dos módulos separadas.
- Ao configurar queries do dashboard, preserve a política padrão do `QueryClient` (`staleTime` de 30 segundos, `gcTime` de 5 minutos e atualização ao retornar à aba). Sobrescreva esses valores somente quando houver necessidade específica do domínio e documente a exceção no módulo.
- Use Lucide como fonte de ícones: `lucide-react` no dashboard e `@lucide/astro` no catálogo. Preserve os adaptadores semânticos locais (`shared/ui/icon.tsx` e `components/Icon.astro`); componentes de tela não devem desenhar SVG manualmente nem importar ícones da biblioteca diretamente.
- No dashboard, encapsule primitives Radix em `shared/ui`: use-as para dialogs, sheets, confirmações, menus contextuais e toasts; pages e módulos não importam Radix diretamente. Use `tailwind-variants` para variantes e `cn` (`clsx` + `tailwind-merge`) para combinar classes Tailwind. Mantenha componentes simples locais quando não houver comportamento composto que justifique uma primitive externa.
- Construa a UI a partir do protótipo correspondente, aplicando os tokens com Tailwind; não introduza valores visuais literais. Em conflito, prevalecem a especificação de interface, depois o protótipo e por fim os tokens (ver `specs/apps/ui-foundations.md`).
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
