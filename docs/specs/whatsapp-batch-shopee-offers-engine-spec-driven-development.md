# Motor de Promoções em Lote da Shopee para WhatsApp — Spec Driven Development

**Data:** 03/08/2026  
**Status:** pronto para implementação incremental.  
**Escopo:** importação em massa de ofertas/produtos, enriquecimento comercial, geração de promoções com desconto e automação de envio horário para WhatsApp.

## Problema confirmado

Você quer uma operação escalável, previsível e comercialmente forte para WhatsApp:

1. importar muitos produtos de uma vez
2. pré-cadastrar dados comerciais relevantes
3. gerar promoções com apelo de desconto
4. disparar uma oferta por hora sem montar tudo manualmente

A análise do arquivo [BatchShopeeLinks20260803132511-47a66cf63e184f2d9598aeaaf90c6a29.csv](<C:\Users\willi\Downloads\BatchShopeeLinks20260803132511-47a66cf63e184f2d9598aeaaf90c6a29.csv>) mostrou que:

1. o arquivo foi gerado em **03/08/2026**
2. ele contém colunas `Offer Name`, `Offer Period`, `Offer Type`, `Commission Rate` e `Offer Link`
3. os registros visíveis são de **ofertas/categorias**, não de produtos individuais
4. há campanhas com início em **01/12/2025**

Conclusão prática:

- essa planilha pode ser usada como fonte de links afiliados em massa
- mas ela **não resolve sozinha** a modelagem de produto, preço antigo, preço atual e criativo comercial

## Visão recomendada

Sim, a ideia é boa.

Mas a operação ideal não deve depender só de scraping ao vivo nem só do CSV bruto da Shopee. O melhor modelo é um **catálogo independente de promoções** dentro do sistema.

Esse catálogo deve guardar:

1. produto
2. link afiliado
3. foto
4. preço atual
5. preço anterior
6. percentual de desconto
7. copy curta
8. status de elegibilidade para publicação

Assim, você consegue:

1. importar 20, 100 ou 1000 produtos
2. deixar tudo pré-cadastrado
3. publicar automaticamente 1 promoção por hora
4. trocar só a fila do dia quando quiser

## Estratégia central

### O que deve ser automático

1. importação em massa
2. cálculo de desconto
3. geração de variações de copy
4. agendamento de publicações
5. controle de repetição
6. analytics de clique

### O que deve aceitar apoio manual

1. foto principal
2. preço antigo quando o scraping falhar
3. preço atual quando a Shopee variar demais
4. título comercial mais limpo
5. ativação/inativação da oferta

## Decisão de arquitetura

### Recomendação

Criar um módulo **independente de promoções de WhatsApp**, mas integrado ao resto do sistema.

Ele não substitui `BioProduct`. Ele conversa com `BioProduct`.

Modelo ideal:

1. `BioProduct` continua sendo a landing pública
2. `WhatsappOfferProduct` ou equivalente vira a camada de promoção operacional
3. `WhatsappOfferPost` vira a fila de disparo

## Pergunta crítica: dá para descobrir preço antigo e atual automaticamente?

### Resposta curta

**Às vezes sim, mas não é seguro depender só disso.**

### Resposta profissional

Há três níveis possíveis:

#### Nível 1 — manual assistido

Você informa:

1. preço antigo
2. preço atual

O sistema calcula:

1. desconto em %
2. faixas promocionais
3. copies

Esse é o caminho mais confiável para começar.

#### Nível 2 — scraping com fallback manual

O sistema tenta ler do produto:

1. preço atual
2. preço riscado / preço anterior

Se conseguir:

- preenche automaticamente

Se não conseguir:

- deixa como pendência manual

Esse é o melhor equilíbrio.

#### Nível 3 — automação total

O sistema depende do preço puxado automaticamente em todo ciclo.

Isso é mais arriscado, porque:

1. layout pode mudar
2. preço pode variar por cupom/logado/região
3. o “preço antigo” pode não estar sempre exposto

### Recomendação

Começar pelo **Nível 2**.

Ou seja:

1. tentar mapear automaticamente
2. aceitar edição manual
3. nunca travar a operação por causa disso

## Objetivos

1. importar produtos/ofertas em massa para uma base operacional
2. enriquecer os registros com preço, imagem e contexto comercial
3. calcular e exibir desconto com clareza
4. automatizar uma fila de publicações horárias
5. usar WhatsApp como canal recorrente de distribuição
6. ligar cada promoção ao seu sistema e ao link afiliado

## Resultado de negócio esperado

Você passa a ter uma “esteira” de promoções:

1. base grande pré-cadastrada
2. fila inteligente
3. envio recorrente
4. menos trabalho manual diário
5. mais constância comercial

## Escopo funcional

### Incluído

1. importação em massa por CSV
2. cadastro independente de promoção
3. cálculo de desconto
4. geração de 7 variações promocionais
5. fila horária de disparo
6. integração com WhatsApp/Evolution
7. reaproveitamento de `/bio/[slug]`

### Fora de escopo nesta fase

1. scraping universal de qualquer página externa sem validação
2. comparação de preços entre múltiplos marketplaces
3. previsão de performance por IA avançada
4. atendimento automático no grupo

## Fluxo operacional desejado

### Fluxo 1 — importação em massa

1. operador sobe CSV de links
2. sistema interpreta origem do lote
3. cria registros pendentes
4. tenta enriquecer cada item com metadados
5. itens ficam em revisão

### Fluxo 2 — enriquecimento comercial

Para cada item:

1. título limpo
2. imagem principal
3. preço antigo
4. preço atual
5. categoria
6. link afiliado
7. página `/bio/[slug]`

### Fluxo 3 — geração promocional

O sistema calcula:

1. diferença absoluta
2. percentual de desconto
3. selo promocional
4. intensidade da oferta

### Fluxo 4 — fila horária

1. operador define janela
2. sistema separa os itens elegíveis
3. agenda 1 item por hora
4. envia no WhatsApp
5. marca clique e performance

## Fonte de dados aceita

### Entrada A — CSV da Shopee

Útil para:

1. links afiliados em massa
2. campanhas/categorias
3. origem do lote

Limitação:

- não traz estrutura rica de produto por si só

### Entrada B — lista manual de produtos

Você pode inserir:

1. URL do produto
2. link afiliado
3. preço
4. imagem
5. categoria

### Entrada C — catálogo grande

Você pode importar um lote de 1000 registros e operar por status.

Essa é a melhor visão para escalar.

## Modelo de dados proposto

### Catálogo de promoções

```prisma
model WhatsappPromoCatalogItem {
  id                String   @id @default(cuid())
  sourceType        String   @default("SHOPEE_BATCH") // SHOPEE_BATCH | MANUAL | SCRAPER
  sourceBatchKey    String?
  sourceOfferName   String?
  sourceOfferType   String?
  sourceOfferPeriod String?
  sourceUrl         String?
  affiliateUrl      String
  productUrl        String?
  slug              String   @unique
  title             String
  shortTitle        String?
  description       String?
  imageUrl          String?
  category          String?
  storeName         String?  @default("Shopee")
  oldPrice          Float?
  currentPrice      Float?
  discountPercent   Int?
  savingsAmount     Float?
  promoStrength     String?  // HOT | GOOD | NORMAL | LOW
  active            Boolean  @default(true)
  readyForPublish   Boolean  @default(false)
  lastPriceCheckAt  DateTime?
  lastPublishedAt   DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Fila de publicações

```prisma
model WhatsappPromoPost {
  id              String   @id @default(cuid())
  catalogItemId   String
  status          String   @default("DRAFT") // DRAFT | APPROVED | SCHEDULED | SENT | FAILED | CANCELED
  templateKey     String
  headline        String
  bodyText        String
  linkUrl         String
  mediaUrl        String?
  scheduledTo     DateTime?
  sentAt          DateTime?
  clicksTotal     Int      @default(0)
  errorMessage    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Configuração da automação

```prisma
model WhatsappPromoAutomationConfig {
  id                  String   @id @default(cuid())
  isEnabled           Boolean  @default(false)
  timezone            String   @default("America/Sao_Paulo")
  publishIntervalMin  Int      @default(60)
  dailyStartHour      Int      @default(8)
  dailyEndHour        Int      @default(22)
  maxPostsPerDay      Int      @default(12)
  requireApproval     Boolean  @default(true)
  defaultDestination  String   @default("BIO_PRODUCT") // BIO_PRODUCT | OFFERS_PAGE | DIRECT_AFFILIATE
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

## Regras de elegibilidade

Um item só pode entrar na fila se tiver:

1. título
2. link afiliado
3. imagem
4. preço atual
5. categoria
6. página pública ou destino válido

Regras extras:

1. não repetir em janela curta
2. priorizar maior desconto
3. priorizar categorias estratégicas

## Cálculo comercial

### Fórmulas

#### Desconto

```text
discountPercent = ((oldPrice - currentPrice) / oldPrice) * 100
```

#### Economia

```text
savingsAmount = oldPrice - currentPrice
```

### Tratamento

1. arredondar desconto para inteiro
2. não calcular desconto se faltar um dos preços
3. marcar pendência de preço se `oldPrice <= currentPrice`

## Sete tipos de promoção

O sistema deve conseguir gerar pelo menos estas 7 variações:

1. **Queda forte de preço**
   - foco no `% OFF`
2. **Economia em reais**
   - foco no `economize R$ X`
3. **Oferta relâmpago**
   - foco em urgência leve
4. **Achado do dia**
   - foco em descoberta
5. **Vale a pena hoje**
   - foco em custo-benefício
6. **Categoria em destaque**
   - foco em contexto do produto
7. **Oportunidade para WhatsApp**
   - foco em exclusividade do grupo

## Templates de mensagem

### Template 1 — desconto percentual

```text
🔥 OFERTA

{titulo_curto}

De R$ {preco_antigo} por R$ {preco_atual}
Desconto de {percentual}% OFF

👉 Ver oferta:
{link}
```

### Template 2 — economia em reais

```text
💸 ECONOMIZE

{titulo_curto}

Antes: R$ {preco_antigo}
Agora: R$ {preco_atual}
Você economiza R$ {economia}

👉 Abrir oferta:
{link}
```

### Template 3 — achado do dia

```text
✨ ACHADO DO DIA

{titulo_curto}

Oferta boa para quem estava procurando isso hoje.

👉 Conferir:
{link}
```

## Recomendação de destino do clique

Padrão:

1. mandar para `/bio/[slug]`

Alternativas:

1. mandar para `/ofertas` quando o post falar de vários produtos
2. mandar para link afiliado direto em campanhas especiais

## Integração com o sistema atual

### Reaproveitar

1. `BioProduct`
2. vitrine `/ofertas`
3. página `/bio/[slug]`
4. painel de bio analytics
5. spec e base de WhatsApp/Evolution já planejadas

### Construir

1. importador de lote CSV
2. catálogo promocional independente
3. rotina de enriquecimento de preço
4. fila horária de promoções

## Estratégia de escalabilidade

### Cenário 20 produtos por dia

Funciona muito bem para:

1. curadoria manual forte
2. melhor qualidade de oferta
3. menos ruído

### Cenário 1000 produtos pré-cadastrados

Funciona melhor para:

1. operação contínua
2. automação por fila
3. seleção por regras

### Recomendação

Fazer os dois:

1. montar um estoque grande de produtos elegíveis
2. operar a publicação diária em cima desse estoque

## Painel administrativo proposto

### Nova área

`/admin/whatsapp-promocoes`

### Seções

1. **Importar lote**
   - upload CSV
   - origem do lote
   - resultado da importação

2. **Catálogo**
   - todos os produtos promocionais
   - filtros por categoria, desconto, ativo, pronto

3. **Pendências**
   - sem imagem
   - sem preço
   - sem preço antigo
   - sem slug/página

4. **Fila do dia**
   - drafts
   - aprovados
   - agendados
   - enviados

5. **Analytics**
   - cliques
   - top promoções
   - top horários

## Contratos de API propostos

| Endpoint | Responsabilidade |
| --- | --- |
| `POST /api/whatsapp-promocoes/import-csv` | importar lote CSV |
| `GET /api/whatsapp-promocoes/catalog` | listar catálogo promocional |
| `PATCH /api/whatsapp-promocoes/catalog/:id` | editar item do catálogo |
| `POST /api/whatsapp-promocoes/catalog/:id/refresh-price` | tentar atualizar preço |
| `POST /api/whatsapp-promocoes/posts/generate` | gerar fila do dia |
| `GET /api/whatsapp-promocoes/posts` | listar posts da fila |
| `POST /api/whatsapp-promocoes/posts/:id/send` | enviar promoção |
| `POST /api/whatsapp-promocoes/cron` | rodar automação horária |

## Regras de automação

1. enviar no máximo 1 por hora
2. respeitar janela diária
3. evitar repetição do mesmo item em poucos dias
4. priorizar itens com melhor combinação de:
   - desconto
   - imagem
   - categoria
   - clique histórico

## Plano por fases

## Fase 1 — Base independente

Objetivo: deixar o catálogo pré-cadastrado e operável.

Entregas:

1. importador CSV
2. catálogo promocional
3. campos de preço
4. cálculo de desconto
5. edição manual

Critério de saída:

- você consegue subir lote, revisar e deixar itens prontos

## Fase 2 — Geração de promoções

Objetivo: transformar catálogo em fila comercial.

Entregas:

1. 7 tipos de promoções
2. templates
3. fila do dia
4. prioridade por regra

Critério de saída:

- o sistema gera promoções prontas para publicar

## Fase 3 — Automação horária

Objetivo: publicar sem esforço diário pesado.

Entregas:

1. automação a cada 1 hora
2. integração com Evolution/WhatsApp
3. logs de envio
4. retries controlados

Critério de saída:

- o sistema envia automaticamente uma promoção por hora

## Fase 4 — Inteligência de performance

Objetivo: melhorar resultado comercial.

Entregas:

1. ranking de promoções
2. melhores horários
3. melhores categorias
4. priorização por CTR

Critério de saída:

- a automação aprende com a operação

## Critérios de aceite

- [ ] O sistema importa um lote CSV de links da Shopee.
- [ ] O lote cria registros operacionais independentes.
- [ ] Cada item pode receber preço antigo e preço atual.
- [ ] O sistema calcula `% OFF` e economia em reais.
- [ ] Existem 7 variações promocionais geráveis.
- [ ] O operador consegue deixar itens “prontos para publicar”.
- [ ] A fila diária consegue publicar 1 promoção por hora.
- [ ] A operação aceita lote grande pré-cadastrado.
- [ ] O destino padrão da promoção pode ser `/bio/[slug]`.
- [ ] O sistema mede clique por promoção.

## Decisões recomendadas

1. não depender só do CSV bruto da Shopee
2. criar base própria de promoções
3. usar scraping apenas como apoio
4. manter fallback manual para preços
5. operar com estoque grande e fila inteligente

## Checklist consolidado

| Item | Estado | Evidência / próximo passo |
| --- | --- | --- |
| Validar natureza da planilha da Shopee | Concluído | CSV atual contém campanhas/links de oferta, não catálogo rico de produtos individuais. |
| Definir modelo independente de promoções | Concluído | Recomendado catálogo separado, integrado ao `BioProduct`. |
| Estruturar campos de preço e desconto | Concluído em planejamento | Faltam implementação e painel. |
| Planejar 7 tipos de promoção | Concluído | Templates e categorias promocionais definidos nesta spec. |
| Planejar automação horária | Concluído | Proposta de 1 publicação por hora em janela diária. |
| Implementar importador de lote | Pendente | Criar rota e tela de upload. |
| Implementar enriquecimento de preço | Pendente | Tentar scraping com fallback manual. |
| Implementar fila do WhatsApp | Pendente | Integrar com spec de WhatsApp/Evolution. |

## Próxima execução recomendada

Ordem ideal:

1. importar lote CSV para catálogo independente
2. editar/preencher preços e imagem
3. gerar as promoções prontas
4. conectar à fila de WhatsApp

Essa ordem é a mais segura porque primeiro garante matéria-prima boa, depois automatiza distribuição.
