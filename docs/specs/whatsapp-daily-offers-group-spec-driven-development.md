# Grupo de Ofertas no WhatsApp — Spec Driven Development

**Data:** 03/08/2026  
**Status:** pronto para implementação incremental.  
**Escopo:** publicação diária de ofertas em grupo de WhatsApp, ligação com vitrine `/ofertas` e `/bio/[slug]`, uso opcional de Evolution API, operação administrativa e métricas.

## Problema confirmado

Hoje o sistema já consegue:

1. captar produtos da Shopee
2. gerar link afiliado
3. publicar vitrine pública e páginas `/bio/[slug]`
4. gerar conteúdo e assets relacionados

Mas ainda não existe uma operação dedicada para transformar isso em um canal recorrente de vendas via grupo de WhatsApp.

O cenário desejado é claro:

1. ter um grupo de WhatsApp como canal diário de distribuição de ofertas
2. usar o sistema para selecionar e preparar produtos
3. publicar diariamente promoções com consistência
4. usar a bio do WhatsApp e os links do sistema para capturar cliques e comissão

Também já existe fundação técnica relevante no projeto:

1. configuração de CRM/WhatsApp/Evolution no banco
2. base de CTA público de WhatsApp
3. estrutura de automação, tarefas, social posts e analytics

## Visão de negócio

O grupo de WhatsApp deve funcionar como um canal de distribuição quente, de alta recorrência e baixo atrito. A operação ideal não depende de montar manualmente cada mensagem todos os dias. O sistema prepara a oferta, o operador aprova quando necessário e o envio acontece com rastreabilidade.

O resultado esperado é:

1. mais visitas qualificadas na vitrine
2. mais cliques em links afiliados
3. rotina diária de publicação sem improviso
4. um novo ativo de audiência além de Instagram e tráfego pago

## Pergunta central: dá para fazer?

**Sim, tecnicamente dá para fazer.**

A Evolution API pode ser a camada de envio e recepção do WhatsApp, mas ela não é o produto inteiro. Ela resolve principalmente:

1. conexão com a instância do número
2. envio programático de mensagens
3. recebimento de webhooks e confirmação de entrega, quando suportado

O sistema desta base precisa fazer o restante:

1. escolher quais ofertas entram no grupo
2. montar a mensagem no formato certo
3. definir frequência e janela de disparo
4. evitar repetição ruim
5. medir clique e resultado
6. dar controle para operação

## Premissas

1. Você já possui um número e uma instância Evolution API relacionados a ele.
2. O grupo de WhatsApp já existe ou será criado pela operação.
3. O número usado para envio é participante com permissão para publicar no grupo.
4. O grupo será usado para ofertas próprias e links afiliados.
5. O sistema deve priorizar consistência operacional e rastreabilidade.

## Restrições e riscos reais

1. Nem toda instância/configuração da Evolution se comporta igual para grupos.
2. Precisamos validar o payload real de envio para grupo da sua instância em produção.
3. WhatsApp é ambiente sensível a spam e excesso de frequência.
4. O maior risco não é técnico, é operacional: frequência errada, mensagens cansativas e queda de engajamento.

## Objetivos

1. Permitir publicação diária de ofertas em grupo de WhatsApp usando o sistema.
2. Transformar produtos da Shopee em mensagens prontas para distribuição.
3. Ligar cada publicação ao ecossistema `/ofertas` e `/bio/[slug]`.
4. Medir clique por campanha, produto e mensagem.
5. Permitir modo manual assistido e modo automatizado.
6. Aproveitar a Evolution API sem acoplar toda a operação a um único fornecedor.

## Fora de escopo nesta fase

1. automação completa de atendimento bidirecional do grupo
2. bot conversacional para responder todo mundo no grupo
3. moderação automática de mensagens de participantes
4. campanhas omnichannel completas com e-mail, Telegram e SMS na mesma entrega

## Estratégia recomendada

Não começar com automação 100% livre.

A melhor abordagem é:

1. fase 1 com fila editorial de ofertas e envio manual assistido
2. fase 2 com agendamento automatizado para horários definidos
3. fase 3 com inteligência de repetição, ranking de ofertas e calendário

Isso reduz risco de bloquear número, de cansar o grupo e de publicar oferta ruim.

## Jornada desejada

### Operação diária

1. O sistema seleciona produtos elegíveis do dia.
2. O operador vê uma fila “WhatsApp Ofertas”.
3. Cada item já traz imagem, título curto, CTA, link e preview da mensagem.
4. O operador aprova, ajusta ou descarta.
5. O sistema envia no grupo via Evolution API no horário certo.
6. Os cliques vão para `/bio/[slug]` ou link rastreado.
7. O admin mede quais produtos performaram melhor.

### Jornada do cliente

1. Cliente vê a oferta no grupo.
2. Clica no link.
3. Cai na página `/bio/[slug]` ou `/ofertas`.
4. Valida rapidamente o produto.
5. Segue para Shopee pelo link afiliado.

## Decisão de link principal

Há três opções principais para o link enviado no grupo:

1. enviar direto para Shopee
2. enviar para `/bio/[slug]`
3. enviar para `/ofertas` com filtros ou campanha

### Recomendação

Usar **`/bio/[slug]` como link padrão por oferta**.

Motivos:

1. mantém contexto do produto
2. melhora chance de SEO e branding
3. permite rastrear melhor cliques por item
4. cria ponte entre grupo, bio, orgânico e afiliado

Uso secundário:

- `/ofertas` para mensagens do tipo “veja vários achados de hoje”

## Arquitetura proposta

### Camadas

1. **Catálogo de origem**
   - `BioProduct`
   - `ColetaDadosShoppe`
   - artigos relacionados

2. **Camada de campanha WhatsApp**
   - nova entidade para fila/publicação de ofertas
   - templates de mensagem
   - regras de agenda

3. **Camada de envio**
   - Evolution API
   - status de envio
   - logs e retries

4. **Camada de destino**
   - `/bio/[slug]`
   - `/ofertas`
   - tracking de clique

5. **Camada de analytics**
   - cliques por oferta
   - CTR por mensagem
   - produtos com maior tração

## Modelo de dados proposto

### 1. Configuração do canal WhatsApp Ofertas

Pode reaproveitar `CrmSettings` para credenciais base da Evolution, mas precisa de configuração operacional separada para o canal de ofertas.

```prisma
model WhatsappOffersConfig {
  id                   String   @id @default(cuid())
  isEnabled            Boolean  @default(false)
  evolutionEnabled     Boolean  @default(false)
  targetType           String   @default("GROUP") // GROUP | BROADCAST
  targetId             String?  // id do grupo/lista na Evolution
  targetLabel          String?
  timezone             String   @default("America/Sao_Paulo")
  dailyWindowsJson     String   @default("[]") // ["09:00","13:00","18:00"]
  maxOffersPerDay      Int      @default(6)
  maxOffersPerWindow   Int      @default(2)
  defaultLinkType      String   @default("BIO_PRODUCT") // BIO_PRODUCT | OFFERS_PAGE | DIRECT_AFFILIATE
  requireApproval      Boolean  @default(true)
  appendBioCta         Boolean  @default(true)
  appendScarcityLine   Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

### 2. Fila de ofertas WhatsApp

```prisma
model WhatsappOfferPost {
  id                String   @id @default(cuid())
  bioProductId      String?
  bioProduct        BioProduct? @relation(fields: [bioProductId], references: [id], onDelete: SetNull)
  status            String   @default("DRAFT") // DRAFT | APPROVED | SCHEDULED | SENT | FAILED | CANCELED
  messageText       String
  mediaUrl          String?
  linkUrl           String
  linkType          String   @default("BIO_PRODUCT")
  campaignKey       String?
  scheduledTo       DateTime?
  sentAt            DateTime?
  deliveryPayload   String   @default("{}")
  errorMessage      String?
  clicksTotal       Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 3. Eventos de envio

```prisma
model WhatsappOfferPostEvent {
  id          String   @id @default(cuid())
  offerPostId String
  step        String
  level       String   @default("INFO")
  message     String
  payloadJson String   @default("{}")
  createdAt   DateTime @default(now())
}
```

## Requisitos funcionais

### RF-01. Seleção de ofertas elegíveis

O sistema deve permitir selecionar itens a partir de:

1. `BioProduct` ativos
2. produtos com imagem
3. produtos com categoria
4. produtos com link afiliado válido
5. produtos não publicados em excesso nos últimos dias

### RF-02. Fila editorial de WhatsApp

Deve existir uma fila administrativa com:

1. preview da mensagem
2. imagem
3. link de destino
4. horário agendado
5. status de envio
6. histórico de cliques

### RF-03. Templates de mensagem

Cada mensagem precisa nascer com um formato comercial consistente.

Modelo base:

```text
🔥 Oferta do dia

{titulo curto}

{1 ou 2 linhas de contexto}

👉 Ver oferta:
{link}
```

Variações:

1. oferta unitária
2. carrossel textual com 2 ou 3 produtos
3. mensagem “achados do dia”

### RF-04. Agendamento diário

O sistema deve permitir:

1. definir janelas por dia
2. limitar quantidade de posts por janela
3. evitar explosão de mensagens em sequência
4. reprogramar falhas

### RF-05. Integração com Evolution API

O sistema deve:

1. usar credenciais já persistidas de Evolution quando disponíveis
2. validar se o alvo é grupo
3. registrar resposta do envio
4. marcar sucesso ou falha
5. suportar retry controlado

### RF-06. Destino rastreável

Cada publicação deve apontar para:

1. `/bio/[slug]` por padrão
2. `/ofertas` em campanhas amplas
3. opcionalmente um redirecionador rastreado no futuro

### RF-07. Analytics operacional

O sistema deve mostrar:

1. quantas mensagens foram enviadas
2. quais produtos foram promovidos
3. cliques por oferta
4. top ofertas do grupo
5. horários com mais resultado

## Requisitos não funcionais

1. envio idempotente
2. logs claros de falha
3. separação entre credenciais e operação
4. UX simples para uso diário
5. suporte a operação mobile no admin no futuro

## Integração com o que já existe

### Reaproveitar

1. `CrmSettings` com campos de Evolution API já existentes
2. `BioProduct` como base de destino comercial
3. `/ofertas` e `/bio/[slug]` como destinos
4. `BioClick` e analytics da bio
5. sistema de tarefas/agendamento já existente

### Construir

1. fila dedicada de WhatsApp ofertas
2. templates e motor de copy curta
3. status e logs de envio
4. painel administrativo de aprovação/agendamento

## Fluxos principais

### Fluxo A — Manual assistido

1. operador abre painel “WhatsApp Ofertas”
2. vê produtos sugeridos
3. ajusta mensagem
4. clica em enviar
5. sistema chama Evolution
6. registra sucesso/falha

### Fluxo B — Agendado com aprovação

1. sistema cria drafts automaticamente
2. operador aprova lote do dia
3. agendador envia nos horários
4. painel mostra resultado

### Fluxo C — Automático com regras

1. sistema escolhe ofertas com base em critérios
2. monta mensagens
3. agenda sozinho
4. envia via Evolution
5. registra analytics

## Estratégia de marketing recomendada

O grupo não deve virar dumping de links.

Direção recomendada:

1. publicar poucas ofertas boas por dia
2. priorizar categorias que já performam
3. alternar utilidade e promoção
4. usar copy curta
5. testar horários

Frequência inicial sugerida:

1. manhã: 1 oferta
2. tarde: 1 oferta
3. noite: 1 oferta

Máximo inicial:

- 3 a 5 mensagens por dia

## Regras de qualidade da mensagem

1. título curto
2. uma promessa clara
3. sem texto gigante
4. emoji com moderação
5. CTA direto
6. link único

## Regras de seleção de produto

Priorizar:

1. produto com imagem boa
2. produto com descrição clara
3. produto com categoria conhecida
4. produto com potencial visual
5. produto ainda não saturado no grupo

Evitar:

1. item sem foto
2. item sem contexto
3. item repetido em poucos dias
4. mensagem longa demais

## Painel administrativo proposto

### Nova área

`/admin/whatsapp-ofertas`

### Seções

1. **Configuração**
   - grupo alvo
   - status da Evolution
   - horários
   - limites diários

2. **Fila do dia**
   - drafts
   - aprovados
   - agendados
   - enviados
   - falhados

3. **Biblioteca de ofertas**
   - produtos elegíveis
   - top clicks
   - categorias vencedoras

4. **Analytics**
   - CTR por publicação
   - top horários
   - top produtos do grupo

## Contratos de API propostos

| Endpoint | Responsabilidade |
| --- | --- |
| `GET /api/whatsapp-offers/config` | Ler configuração operacional |
| `PATCH /api/whatsapp-offers/config` | Atualizar grupo, janelas e regras |
| `GET /api/whatsapp-offers/posts` | Listar fila/publicações |
| `POST /api/whatsapp-offers/posts` | Criar draft manual ou automático |
| `PATCH /api/whatsapp-offers/posts/:id` | Editar, aprovar, reagendar, cancelar |
| `POST /api/whatsapp-offers/posts/:id/send` | Disparar envio |
| `POST /api/whatsapp-offers/cron` | Rodar agenda do dia |
| `POST /api/whatsapp-offers/evolution/webhook` | Receber callbacks da Evolution |

## Especificação de envio via Evolution

O envio precisa ser isolado em um adapter.

Exemplo conceitual:

```ts
sendWhatsappGroupMessage({
  targetId,
  messageText,
  mediaUrl,
})
```

Esse adapter:

1. lê `evolutionBaseUrl`
2. lê `evolutionApiKey`
3. lê `evolutionInstanceName`
4. envia para o endpoint correto da sua instância
5. normaliza resposta

## Critério de validação da Evolution

Antes do go-live, precisamos confirmar:

1. formato do identificador do grupo
2. endpoint real de envio para grupo
3. envio com texto puro
4. envio com imagem + legenda
5. retorno de sucesso/falha

## Plano por fases

## Fase 1 — Fundação operacional

Objetivo: publicar ofertas manualmente com apoio do sistema.

Entregas:

1. config do canal
2. fila de ofertas
3. templates
4. envio manual via Evolution
5. logs básicos

Critério de saída:

- o operador consegue publicar uma oferta no grupo saindo do sistema

## Fase 2 — Agendamento diário

Objetivo: tornar a rotina recorrente.

Entregas:

1. janelas por horário
2. aprovação em lote
3. cron de envio
4. retry em falha

Critério de saída:

- as ofertas do dia são preparadas e disparadas nos horários definidos

## Fase 3 — Inteligência comercial

Objetivo: aumentar resultado e reduzir esforço.

Entregas:

1. ranking de produtos por clique
2. regra anti-repetição
3. recomendação de horários
4. sugestão automática de copy

Critério de saída:

- o sistema ajuda a escolher melhores ofertas e melhores janelas

## Critérios de aceite

- [ ] Existe configuração própria para o canal de ofertas no WhatsApp.
- [ ] O sistema consegue criar drafts de mensagens a partir de `BioProduct`.
- [ ] O operador consegue aprovar e enviar uma oferta para o grupo.
- [ ] O sistema registra sucesso ou falha do envio.
- [ ] Cada mensagem possui link rastreável para `/bio/[slug]` ou `/ofertas`.
- [ ] O painel mostra cliques por oferta enviada.
- [ ] O sistema impede envio de item sem imagem ou sem link válido.
- [ ] O fluxo suporta modo manual assistido antes da automação completa.
- [ ] A integração usa a Evolution API configurada no projeto, sem hardcode.

## Métricas de sucesso

### Operacionais

1. número de ofertas enviadas por dia
2. taxa de envio com sucesso
3. tempo médio para montar a rotina diária

### Comerciais

1. cliques por oferta
2. CTR por mensagem
3. top categorias por clique
4. crescimento de tráfego vindo do WhatsApp

## Riscos

1. grupo receber mensagens demais e perder engajamento
2. payload da Evolution para grupos divergir do esperado
3. excesso de repetição de produto
4. oferta ruim reduzir confiança do grupo

## Decisões recomendadas

1. começar por grupo, não por broadcast massivo
2. usar `/bio/[slug]` como destino padrão
3. exigir aprovação humana no início
4. limitar frequência diária desde o dia 1
5. medir tudo antes de ampliar escala

## Checklist consolidado

| Item | Estado | Evidência / próximo passo |
| --- | --- | --- |
| Confirmar visão de negócio do grupo de ofertas | Concluído | Requisito está claro: publicar promoções diariamente no WhatsApp. |
| Verificar base técnica de WhatsApp/Evolution existente | Concluído | Projeto já possui `CrmSettings` com campos de Evolution API. |
| Definir estratégia de link para conversão | Concluído | Recomendado usar `/bio/[slug]` como destino padrão por oferta. |
| Modelar fila de publicações do WhatsApp | Pendente | Criar `WhatsappOffersConfig`, `WhatsappOfferPost` e eventos. |
| Criar painel `/admin/whatsapp-ofertas` | Pendente | Operação precisa de fila, aprovação e agendamento. |
| Implementar adapter da Evolution API | Pendente | Validar endpoint real de envio para grupo na sua instância. |
| Ligar analytics de clique ao canal WhatsApp | Pendente | Reaproveitar base atual de tracking e enriquecer origem/campanha. |
| Implantar rotina diária de ofertas | Pendente | Começar com modo manual assistido e depois automatizar. |

## Próxima execução recomendada

Ordem ideal:

1. validar tecnicamente a sua instância Evolution para envio em grupo
2. criar a modelagem e o painel administrativo
3. implementar envio manual assistido
4. ativar agendamento diário

Essa ordem é a mais segura porque evita construir automação em cima de uma premissa de integração ainda não validada no grupo real.
