# Visão geral do produto

**Etapa:** 01 — Visão geral  
**Estado:** Aprovada e registrada  
**Produto:** Clube Flex  
**Abrangência inicial:** Estado do Rio de Janeiro

## Produto

O Clube Flex é um clube de descontos e não constitui um plano de saúde. Seus assinantes podem acessar condições especiais oferecidas por parceiros em áreas como consultas, exames e lazer.

A primeira entrega digitalizará o catálogo de parceiros e parte do processo comercial do Clube Flex.

## Problema

Atualmente, assinantes e potenciais clientes precisam entrar em contato com a equipe para descobrir:

- quais parceiros estão disponíveis;
- quais serviços ou benefícios são oferecidos;
- qual percentual de desconto corresponde ao plano informado;
- como utilizar o benefício.

Os leads obtidos pelos vendedores são mantidos em planilhas, o que dificulta sua distribuição, acompanhamento e rastreabilidade.

## Objetivos

- Permitir a consulta autônoma ao catálogo de parceiros.
- Reduzir perguntas direcionadas à equipe sobre parceiros e descontos.
- Permitir que a equipe mantenha planos, categorias, parceiros e unidades.
- Captar leads pelo site e permitir seu cadastro manual.
- Centralizar o acompanhamento dos leads em um pipeline.
- Oferecer controle granular de permissões aos usuários internos.
- Estabelecer uma base adequada para módulos futuros sem antecipar sua implementação.

## Público e atores

- **Assinante:** consulta parceiros e benefícios de acordo com o plano que informa possuir.
- **Potencial cliente:** consulta o catálogo e pode enviar seus dados para contato comercial.
- **Vendedor:** cadastra e acompanha seus próprios leads, conforme suas permissões.
- **Supervisora:** acompanha a operação e administra acessos, conforme suas permissões.
- **Demais usuários internos:** recebem individualmente apenas as permissões necessárias.
- **Interessado em parceria:** recebe orientação para enviar os dados por e-mail; seus dados não são gerenciados pelo painel nesta entrega.

“Vendedor” e “supervisora” descrevem funções da organização. Não são papéis fixos do mecanismo de autorização.

## Escopo da primeira entrega

### Catálogo público

- Seleção do plano pelo visitante.
- Listagem dos parceiros que possuem benefício para o plano selecionado.
- Filtro por categoria.
- Exibição prioritária dos parceiros destacados.
- Exibição do percentual de desconto, contatos, site, unidades, cupom aplicável e instruções de utilização.
- Formulário de interesse com nome, WhatsApp e e-mail opcional.
- Consentimento para uso dos dados no contato comercial.
- Resposta pública indistinguível para contatos novos ou já existentes.

### Dashboard interno

- Administração de planos.
- Administração de categorias.
- Administração de parceiros e suas unidades.
- Cadastro inicial de parceiros como rascunho.
- Publicação de parceiros por usuários com a permissão correspondente.
- Desativação sem remoção do registro administrativo.
- Administração de usuários e permissões individuais.
- Cadastro, atribuição e acompanhamento de leads.
- Histórico das alterações relevantes do lead.

### Pipeline inicial

`novo → primeiro contato → em negociação → convertido → perdido`

A conversão será registrada manualmente nesta versão. O motivo da perda será opcional.

## Fora do escopo

- Cadastro e autenticação de assinantes.
- Verificação do plano realmente contratado pelo visitante.
- Cadastro de clientes convertidos ou vínculo entre lead e assinante.
- Cobranças e pagamentos.
- Agendamentos.
- Emissão de autorização ou comprovação digital do benefício.
- Registro da utilização dos descontos.
- Integração com plataformas de anúncios.
- Integração com uma futura base de assinantes.
- Gestão, no painel, de interessados em se tornar parceiros.
- Outros módulos operacionais do Clube Flex.

## Restrições e limites conhecidos

- A operação inicial é limitada ao estado do Rio de Janeiro.
- O catálogo é acessível sem login.
- O plano é informado pelo próprio visitante e não é validado pelo sistema.
- O sistema fornece instruções, mas não executa nem valida o uso do benefício.
- O desconto apresentado é único por parceiro e plano, no formato “até X%”.
- Parceiros sem condição para o plano selecionado não aparecem no catálogo.
- Parceiros destacados são apresentados primeiro e ordenados alfabeticamente dentro do mesmo grupo de destaque.
- Registros desativados permanecem no dashboard e deixam de aparecer publicamente.
- Não há prazo ou orçamento formalmente definidos para a primeira entrega.

## Resultados esperados

- Menor dependência da equipe para consultas sobre parceiros.
- Catálogo mantido diretamente por usuários autorizados.
- Leads centralizados e acompanháveis fora das planilhas.
- Visibilidade sobre responsável, origem, etapa e histórico de cada lead.
- Controle individual das capacidades de cada usuário interno.

As metas quantitativas de desempenho e os critérios de qualidade estão definidos na estratégia de qualidade.

## Encaminhamentos não bloqueantes

- Confirmar os nomes dos planos durante o cadastro inicial.
- Obter validação jurídica organizacional para a retenção de leads por prazo indeterminado.
- Fornecer a logo oficial antes da finalização visual.
