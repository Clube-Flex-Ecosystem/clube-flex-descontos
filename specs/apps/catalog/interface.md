# Catálogo público — interface

**Etapa:** 09 — Interface  
**Estado:** Aprovado

## Processo de alteração

Alterações de UI do catálogo começam exclusivamente no [protótipo navegável](../../prototypes/catalog/index.html).
Depois de revisadas e aprovadas, são aplicadas em `apps/catalog/`. Não se deve
definir uma alteração diretamente no app. O fluxo completo está documentado no
[processo de evolução da interface](../../ui-change-process.md).

## Direção visual

- Linguagem editorial e acolhedora, com amplo espaço em branco, construída sobre os tokens e a tipografia compartilhados em [fundamentos de interface](../ui-foundations.md).
- Paleta e tipografia: canvas claro e frio, navy como estrutura, laranja do logo reservado à ação e ao valor, e `Archivo` como família única. Papéis, escalas, regras de uso de cor e contrastes estão em [Fundamentos do catálogo](../ui-foundations.md#fundamentos-do-catálogo) e não são repetidos aqui.
- A estrutura e os componentes seguem o [protótipo do catálogo](../../prototypes/catalog/index.html).
- A experiência móvel é prioritária.
- O catálogo deve comunicar descontos em diferentes áreas e evitar aparência ou linguagem que o confunda com plano de saúde.
- A ação principal usa `primary` com rótulo `primary-foreground` (navy). Texto laranja pequeno usa `accent-foreground`; percentuais e números de destaque usam `accent-strong`. Animações respeitam `prefers-reduced-motion`.

> **Revisão de 2026-10-10:** a paleta cream/forest/coral e as famílias DM Sans/Fraunces aprovadas anteriormente foram substituídas, por decisão do responsável, pela paleta e pela tipografia do arquivo de tokens. A copy aprovada permanece inalterada.

> **Revisão de 2026-10-11:** aprovada pelo responsável a direção A da [proposta de sistema visual](../../prototypes/catalog/proposals/2026-10-sistema-visual/README.md) ("Estrutura navy, ação luminosa"), com escopo restrito ao catálogo: paleta própria, `Archivo` no lugar de `Geist`, ação principal retangular com rótulo navy e estados globais do browser (seleção, scrollbar, foco, caret, placeholder e autofill). Copy, estrutura e comportamento permanecem inalterados.

## Estrutura da página inicial

1. Cabeçalho e navegação por âncoras.
2. Hero aprovado.
3. Faixa visual de categorias.
4. Seção institucional `Mais que descontos`.
5. Catálogo de parceiros.
6. Seção `Em quatro passos`.
7. Rodapé.
8. Assistente virtual sobreposto como componente independente.

Não serão adicionados busca textual, ordenação manual ou filtros além de categoria nesta entrega.

Essa estrutura e sua copy foram aprovadas pela supervisora e não devem ser reescritas durante a implementação. Somente a instrução funcional da listagem será adaptada para refletir os controles efetivamente disponíveis.

### Marca no cabeçalho

O texto visual `Parceiros+` é provisório e será substituído posteriormente pela logo oficial. Ele não deve ser tratado como definição final da marca nem recriado como ativo definitivo.

### Copy aprovada do hero

- Selo: `Desde 2010 cuidando da sua família`.
- Título: `Saúde e Qualidade de Vida que você e sua família merecem.`
- Apoio: `Saúde, Educação, lazer e muito mais. Vantagens reais para você e seu bolso. Descontos que merecem ser contados.`
- Ações: `Vem ser Flex` e `Explorar parceiros`.
- `Vem ser Flex` abre diretamente o assistente na jornada `Quero ser Flex`.
- `Explorar parceiros` leva o foco e a navegação à seção do catálogo.

### Composição do hero

- O título usa uma única cor; a hierarquia vem da tipografia, sem trechos destacados em laranja.
- À direita, um palco claro apresenta o Flex Card inclinado e dois cartões de benefício (`Saúde até 40%` e `Educação até 30%`).
- O Flex Card é uma **representação ilustrativa provisória**, sem dados reais de associado, e será substituído pela arte oficial quando fornecida. Ele é decorativo e não é anunciado por tecnologia assistiva.

### Copy aprovada da seção institucional

- Título: `Mais que descontos. Uma rotina mais generosa.`
- Blocos: `Parceiros selecionados`, `Benefícios de verdade`, `Sem complicação` e `Atualizações mensais`.
- O conteúdo textual fornecido na referência aprovada deve ser preservado.

### Copy aprovada de funcionamento

- Título: `Em quatro passos.`
- Etapas: `Cadastre-se`, `Explore parceiros`, `Use seu desconto` e `Economize sempre`.
- O conteúdo textual fornecido na referência aprovada deve ser preservado.
- A ação associada a `Cadastre-se` abre diretamente o assistente na jornada `Quero ser Flex`.

### Rodapé aprovado

- Navegação institucional conforme a referência aprovada.
- Telefone exibido: `21 2702-9080`.
- Ação identificada como `WhatsApp`.
- E-mail oficial: `comercial@flexcard.org.br`.
- Endereço exibido: `Rua Laureano Rosa 100, São Gonçalo, RJ`.
- Links para termos de uso e privacidade.
- O destino técnico da ação de WhatsApp deverá ser fornecido antes da publicação, caso seja diferente do telefone exibido.

## Catálogo de parceiros

### Estado inicial

Nenhum plano vem selecionado. Antes da escolha, a grade é substituída por uma orientação para que o visitante selecione o plano que informa possuir.

### Controles

- Seletor de plano obrigatório, com largura total no celular.
- A URL é a fonte do plano selecionado e utiliza `?plano={slug}`.
- A categoria selecionada também é preservada na URL como `categoria={categoryId}`.
- Sem plano na URL, nenhuma seleção armazenada anteriormente é aplicada.
- Um link com plano público válido abre diretamente naquele contexto.
- Trocar o plano atualiza a URL e a listagem; abrir um parceiro preserva o mesmo parâmetro.
- Categorias em controles horizontais roláveis no celular.
- Opção para exibir todas as categorias ou limpar o filtro.
- Quantidade de parceiros encontrados pode ser apresentada como informação, sem oferecer ordenação.

### Adaptação aprovada da copy da listagem

- Título preservado: `Encontre seu próximo serviço.`
- A instrução que prometia busca por nome e ordenação será adaptada para: `Escolha seu plano e filtre por categoria para encontrar o benefício que procura.`
- O seletor de plano aparece antes dos controles de categoria.
- Busca por nome e ordenação manual não integram a interface nesta entrega.

### Grade

- Uma coluna no celular, duas no tablet e três no desktop.
- Sem paginação e sem carregamento infinito.
- Parceiros destacados aparecem primeiro, sem duplicação em outra lista.
- Entre parceiros com a mesma condição de destaque, mantém-se a ordem alfabética.

### Cartão-resumo

O cartão apresenta:

- categorias;
- nome;
- localização resumida ou quantidade de unidades, quando aplicável;
- percentual do plano selecionado;
- indicação de existência de cupom;
- indicação visual de destaque;
- chamada `Ver detalhes`.

Contatos, instruções completas, endereços e o valor do cupom ficam na página de detalhe. O cartão inteiro pode ser acionável, mas a chamada textual permanece visível.

### Estados operacionais

- plano não selecionado;
- carregamento;
- resultado disponível;
- nenhum parceiro para a categoria;
- falha ao consultar a API com ação `Tentar novamente`;
- plano ou categoria que deixou de estar disponível.

## Página do parceiro

- Rota: `/parceiros/{slug}`.
- Mantém o contexto do plano selecionado na URL.
- Sem plano na URL, exibe os dados públicos gerais e solicita uma escolha explícita antes de apresentar percentual ou cupom.
- Com plano válido na URL, exibe a representação pública completa definida no contrato da API.
- Permite retornar ao catálogo preservando o contexto de navegação quando possível.
- Possui título, descrição e metadados próprios para compartilhamento e indexação.
- Slugs anteriores redirecionam permanentemente para a URL atual.

### Composição

1. Ação `Voltar para parceiros`.
2. Nome, categorias e indicação de destaque.
3. Seletor de plano.
4. Bloco principal do benefício com percentual e cupom, quando houver plano selecionado.
5. Instruções de utilização em destaque.
6. Site e contatos.
7. Unidades em cartões ou acordeão, com endereço, horário, instruções e contatos.
8. Chamada para o assistente virtual.

Antes da seleção, o bloco de benefício informa: `Escolha seu plano para consultar o desconto disponível.`

No celular, cupom e contatos possuem ações diretas para copiar, ligar ou abrir WhatsApp, conforme o tipo do dado.

## Assistente virtual

O assistente é uma interface conversacional determinística e se identifica claramente como virtual. Não utiliza inteligência artificial, atendimento humano em tempo real ou respostas abertas nesta entrega.

### Abertura e apresentação

- Botão flutuante no canto inferior direito com nome acessível `Abrir assistente do Clube Flex`.
- Painel sobreposto no desktop e folha quase integral no celular.
- Saudação inicial seguida das opções `Quero ser Flex` e `Quero ser parceiro`.
- A falha ou indisponibilidade do assistente não impede a consulta do catálogo.

### Quero ser parceiro

1. Informa que o contato continuará por e-mail.
2. Solicita que o e-mail contenha nome do responsável, empresa ou profissional, telefone ou WhatsApp, cidade, serviços oferecidos e proposta de desconto.
3. Oferece ação para enviar e-mail a `comercial@flexcard.org.br`.
4. Não persiste informações no painel.

### Quero ser Flex

1. Solicita nome.
2. Solicita WhatsApp.
3. Solicita e-mail, permitindo pular esse campo.
4. Apresenta consentimento e acesso ao texto de privacidade.
5. Apresenta resumo editável antes do envio.
6. Só envia após concordância explícita.
7. Exibe a mesma confirmação neutra para contato novo ou já existente.

### Comportamento e acessibilidade

- Dados ainda não enviados podem permanecer durante a navegação atual, mas são descartados ao recarregar ou encerrar a página.
- O teclado virtual não pode ocultar o campo ativo.
- Abrir, fechar e avançar são operáveis por teclado.
- O foco é movido e restaurado de forma previsível.
- Novas mensagens relevantes são anunciadas por tecnologia assistiva sem repetir todo o histórico.
- Não é utilizado avatar de pessoa real nem linguagem que simule atendimento humano.

## Acessibilidade e movimento

- Controles interativos possuem alvo mínimo de 44 por 44 pixels.
- Filtros comunicam programaticamente o estado selecionado.
- Foco visível, ordem lógica de teclado e títulos semânticos são obrigatórios.
- Estados de carregamento e resultados são anunciados sem movimentação abrupta de foco.
- Movimentos decorativos são removidos ou interrompidos quando `prefers-reduced-motion` estiver ativo.

## Pendências

- A logo oficial permanece como pendência não bloqueante, conforme [fundamentos compartilhados](../ui-foundations.md).
- A arte oficial do Flex Card permanece como pendência não bloqueante; até lá o hero usa a representação ilustrativa provisória.
