# Catálogo — módulos

**Aplicação:** Catálogo público  
**Endereço:** `parceiros.flexclube.org`  
**Estado:** Aprovado

## Responsabilidade

Oferecer uma experiência pública, indexável, acessível e prioritariamente móvel para consulta de parceiros e captação de interesse comercial.

O catálogo não valida a condição de assinante nem o plano contratado.

## Módulos

### Navegação e SEO

- rotas públicas indexáveis;
- metadados das páginas;
- URL estável e compartilhável para cada parceiro;
- preservação da URL quando o nome do parceiro mudar;
- redirecionamento permanente da URL anterior quando o identificador público for alterado explicitamente;
- estados de conteúdo inexistente ou indisponível;
- orientação para mecanismos de busca sem expor o dashboard.

### Contexto do plano

- carregamento dos planos ativos;
- seleção explícita do plano;
- atualização da experiência quando a seleção muda;
- comunicação de que o plano informado não foi validado.

### Descoberta de parceiros

- listagem dos parceiros elegíveis para o plano;
- filtro por categoria;
- destaques primeiro e ordenação alfabética;
- estado vazio quando nenhum parceiro for encontrado.

### Detalhe do parceiro

- descrição e categorias;
- percentual para o plano selecionado;
- cupom aplicável;
- instruções de utilização;
- site e contatos;
- unidades ativas, endereços, horários e contatos herdados.

### Captação de interesse

- formulário com nome, WhatsApp, e-mail opcional e consentimento;
- validação pública dos dados;
- resposta neutra para contato novo ou existente;
- comunicação com a API sem implementar regras de duplicidade localmente.

### Interesse em parceria

- orientação para envio dos dados definidos em `UC-005` ao e-mail `comercial@flexcard.org.br`;
- ausência de cadastro de parceria nesta entrega.

## Fora da responsabilidade

- autenticar assinantes;
- confirmar o plano contratado;
- administrar cadastros;
- aplicar regras de duplicidade ou pipeline;
- emitir autorização, agendar ou registrar utilização do benefício.
