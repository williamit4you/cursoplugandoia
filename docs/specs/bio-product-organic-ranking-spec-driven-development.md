# Bio Products SEO Orgânico — Spec Driven Development

**Data:** 03/08/2026  
**Status:** pronto para implementação incremental.  
**Escopo:** páginas públicas `/bio/[slug]`, listagem `/ofertas`, categorias `/bio/categoria/[slug]`, sitemap, metadados SEO, dados estruturados e enriquecimento editorial.

## Problema confirmado

Hoje a operação consegue publicar produtos e levar tráfego da bio do Instagram para a vitrine, mas a base necessária para ranqueamento orgânico ainda está incompleta.

Os pontos críticos confirmados são:

1. As páginas `/bio/[slug]` existem, mas ainda não entram no `sitemap.xml` público.
2. A página de produto já possui `title`, `description` e `canonical`, porém ainda não expõe `schema.org/Product`.
3. O conteúdo da página ainda é raso para SEO: basicamente card, mídia, descrição curta e CTA.
4. A estratégia atual é muito boa para clique rápido da bio, mas ainda fraca para capturar buscas orgânicas do Google com intenção de compra.
5. Existem sinais de qualidade técnica a corrigir, como textos com problema de encoding, o que prejudica confiança, UX e entendimento semântico.

## Objetivos

1. Fazer cada produto publicado em `/bio/[slug]` ser elegível para indexação e descoberta orgânica.
2. Garantir que o Google encontre os produtos pelo `sitemap.xml` e por links internos consistentes.
3. Transformar a página de detalhe em uma landing page leve, útil e orientada a intenção de busca real.
4. Melhorar CTR orgânico com `title`, `meta description`, Open Graph e imagens bem configurados.
5. Reforçar relevância semântica com `schema.org/Product`.
6. Preservar a performance mobile e a conversão vinda da bio do Instagram.
7. Criar uma base escalável: ao cadastrar um novo item, ele já nasce com os insumos mínimos para SEO.

## Resultado de negócio esperado

O site deixa de ser apenas uma ponte de tráfego social e passa a construir ativo orgânico. Cada produto pode capturar buscas como nome exato do item, variações de cauda longa, buscas por categoria e buscas com intenção comercial, aumentando cliques qualificados e comissão sem depender exclusivamente de mídia paga.

## Estado atual confirmado no projeto

### Indexação

- `app/sitemap.ts` publica páginas estáticas, lojas, comparativos e conteúdo editorial.
- As rotas `/bio/[slug]` e `/bio/categoria/[slug]` ainda não são emitidas no sitemap público.

### Página de produto

- `app/(public)/bio/[slug]/page.tsx` já gera `title`, `description`, `canonical` e Open Graph básico.
- A página ainda não injeta JSON-LD de `Product`.
- O conteúdo principal ainda é curto demais para competir por SEO em consultas mais disputadas.

### Descoberta interna

- A vitrine `/ofertas` já ajuda o usuário da bio a encontrar produtos.
- Ainda precisamos tratar a navegação interna como mecanismo de SEO: categorias, links relacionados, paginação indexável e maior profundidade editorial.

## Princípios do projeto

1. `SEO sem atrapalhar conversão`: a página precisa ranquear sem ficar pesada ou confusa para quem veio do Instagram.
2. `Mobile first`: o formato principal deve continuar otimizado para celular.
3. `Cada produto nasce pronto para indexação`: o cadastro precisa coletar os campos mínimos obrigatórios.
4. `Conteúdo útil, não inflado`: enriquecer a página com contexto comercial real, sem texto artificial ou repetitivo.
5. `Arquitetura escalável`: a mesma estrutura deve servir para dezenas, centenas e milhares de produtos.

## Escopo funcional

### Incluído nesta spec

1. Inclusão de `/bio/[slug]` e `/bio/categoria/[slug]` no `sitemap.xml`.
2. Estrutura de `metadata` orientada a busca real.
3. Implementação de `schema.org/Product` nas páginas de produto.
4. Ampliação do conteúdo das páginas de detalhe.
5. Fortalecimento de links internos entre vitrine, categorias e páginas de produto.
6. Ajustes no fluxo de cadastro para garantir campos SEO mínimos.
7. Critérios de indexação, canonicalização e `robots`.

### Fora de escopo nesta fase

1. Blog editorial amplo separado do catálogo.
2. Geração automática por IA de textos longos sem revisão.
3. Integrações com Google Merchant Center.
4. Estratégia de backlinks ou PR digital.

## Jornada SEO desejada

1. O produto é cadastrado no admin com nome, slug, imagem, descrição útil, categoria, link afiliado e status ativo.
2. A página `/bio/[slug]` é publicada com `metadata` otimizado, JSON-LD `Product`, imagem válida e conteúdo contextual.
3. O item entra automaticamente no `sitemap.xml`.
4. A vitrine `/ofertas` e a categoria `/bio/categoria/[slug]` passam link interno para esse produto.
5. O Google descobre, rastreia, entende e indexa a página.
6. O usuário encontra o produto pela busca orgânica, entra na página e clica no afiliado.

## Requisitos funcionais

### 1. Sitemap

O `sitemap.xml` deve incluir:

1. `/ofertas`
2. `/bio/[slug]` para todos os `BioProduct` ativos
3. `/bio/categoria/[slug]` para todas as categorias ativas com produtos

Regras:

- Somente itens ativos e públicos entram no sitemap.
- `lastModified` deve refletir `updatedAt` do produto ou categoria.
- URLs canônicas devem usar `getCommerceSiteUrl()`.

### 2. Metadados de produto

Cada `/bio/[slug]` deve gerar:

1. `title` orientado a busca real
2. `description` curta, legível e comercial
3. `canonical`
4. `openGraph`
5. `twitter`
6. `robots` com indexação habilitada para item ativo

Padrão recomendado:

- `title`: `{nome principal do produto} | Compra Esperta Promoções`
- `description`: resumo útil com material, uso, diferencial e CTA implícito

Exemplo:

- `05 Potes de Vidro Hermético com Tampa Bambu | Compra Esperta Promoções`
- `Veja detalhes, usos e link para comprar o kit de potes de vidro hermético com tampa de bambu na Shopee.`

### 3. Dados estruturados

Cada página de produto deve emitir JSON-LD com `@type: Product`.

Campos mínimos:

1. `name`
2. `description`
3. `image`
4. `url`
5. `category`
6. `brand`
7. `offers`

Campos de `offers`:

1. `url` com o link de destino
2. `priceCurrency` quando existir preço estruturado no futuro
3. `availability` usando `InStock` ou `OutOfStock` quando esse dado existir

Decisão desta fase:

- Mesmo sem preço confiável, o `Product` já deve ser implementado com os campos disponíveis.
- Campos ausentes não devem ser inventados.

### 4. Conteúdo enriquecido da página

Cada `/bio/[slug]` deve ir além do card inicial. A página deve conter:

1. Bloco principal com imagem, título, resumo, CTA e prova visual
2. Seção “sobre este produto”
3. Seção “por que esse item chama atenção”
4. Seção “indicado para”
5. Seção “o que observar antes de comprar”
6. Seção de categoria relacionada
7. Seção com produtos parecidos ou complementares

O objetivo não é criar artigo longo. O objetivo é adicionar contexto útil para busca e decisão.

### 5. Links internos

As páginas precisam se reforçar entre si:

1. `/ofertas` deve linkar para `/bio/[slug]`
2. `/bio/[slug]` deve linkar para a categoria do item
3. `/bio/[slug]` deve mostrar produtos relacionados da mesma categoria
4. `/bio/categoria/[slug]` deve listar produtos indexáveis e linkar para todos eles

### 6. Cadastro/admin

O fluxo de cadastro deve garantir no mínimo:

1. `title`
2. `slug`
3. `description`
4. `imageUrl`
5. `category`
6. `affiliateUrl`
7. `active`

Campos recomendados para próxima evolução:

1. `seoTitle`
2. `metaDescription`
3. `highlights` ou `bulletPoints`
4. `brand`
5. `priceText`
6. `faqJson`

## Estrutura de conteúdo recomendada para `/bio/[slug]`

### Hero comercial

- Imagem do produto
- Nome claro e legível
- Resumo curto
- CTA principal: `Ver na Shopee`
- CTA secundário: `Voltar para ofertas` ou `Ver produtos parecidos`

### Bloco 1: visão rápida

- 3 ou 4 pontos objetivos
- Linguagem simples
- Foco em utilidade e contexto de compra

### Bloco 2: descrição expandida

- Parágrafo curto com material, uso, aplicação e diferencial
- Sem exagero promocional

### Bloco 3: para quem é

- Exemplo: cozinha pequena, organização doméstica, presente, decoração, limpeza, etc.

### Bloco 4: produtos relacionados

- Mesma categoria
- Cards menores
- Bom para navegação, profundidade e SEO interno

## Regras de UX e conversão

1. O CTA principal deve continuar acima da dobra no celular.
2. O conteúdo SEO não pode empurrar o botão principal para muito baixo.
3. A imagem do produto deve carregar rápido e ter proporção consistente.
4. O texto deve ser escaneável, com blocos curtos.
5. A navegação para “ver todos” e “ver categoria” deve ser visível.

## Requisitos técnicos

### Geração de sitemap

Alterar `app/sitemap.ts` para buscar:

1. `BioCategory` ativas
2. `BioProduct` ativos

E emitir:

1. `/bio/categoria/[slug]`
2. `/bio/[slug]`

### Página de produto

Alterar `app/(public)/bio/[slug]/page.tsx` para:

1. aprimorar `generateMetadata`
2. injetar JSON-LD `Product`
3. enriquecer conteúdo visível
4. incluir links internos úteis

### Categoria pública

Garantir que `app/(public)/bio/categoria/[slug]/page.tsx`:

1. tenha `metadata` próprio
2. contenha listagem indexável
3. possua paginação ou limite inteligente
4. ligue de volta para `/ofertas` e para cada item

## Regras de SEO técnico

1. Produto ativo: `index, follow`
2. Produto inativo ou inexistente: `noindex`
3. Slug canônico único por item
4. Nada de páginas duplicadas com o mesmo produto em múltiplas URLs
5. Imagens públicas com URL estável
6. Texto com encoding UTF-8 correto em toda a experiência pública

## Estratégia de conteúdo para busca real

Vamos priorizar intenção comercial e cauda longa.

Tipos de consulta que a página deve capturar:

1. nome exato do produto
2. nome + material
3. nome + uso
4. nome + categoria
5. nome + marketplace

Exemplos:

1. `potes de vidro hermético com tampa bambu`
2. `kit potes herméticos para mantimentos`
3. `pote de vidro com tampa bambu shopee`

Regra editorial:

- O conteúdo deve reaproveitar a linguagem de busca do usuário, mas sem copiar descrições ruins ou excessivamente repetitivas do marketplace.

## Plano de implementação por fases

## Fase 1 — Fundamentos de indexação

Objetivo: tornar o catálogo rastreável e indexável.

Entregas:

1. adicionar `/bio/[slug]` ao sitemap
2. adicionar `/bio/categoria/[slug]` ao sitemap
3. revisar `canonical` e `robots`
4. corrigir textos com encoding quebrado

Critério de saída:

- um produto ativo aparece no sitemap e responde com metadata correto

## Fase 2 — Estrutura semântica

Objetivo: fazer o Google entender melhor o item.

Entregas:

1. inserir JSON-LD `Product`
2. melhorar `title` e `meta description`
3. garantir OG image consistente

Critério de saída:

- a página possui marcação semântica válida e pronta para inspeção

## Fase 3 — Conteúdo e navegação interna

Objetivo: aumentar relevância e profundidade.

Entregas:

1. enriquecer a página de produto com blocos úteis
2. exibir categoria e relacionados
3. fortalecer links internos da vitrine e categorias

Critério de saída:

- o usuário encontra o produto, entende rápido e tem próximos passos claros

## Fase 4 — Operação escalável no admin

Objetivo: garantir consistência para cada novo produto publicado.

Entregas:

1. campos obrigatórios e recomendados no cadastro
2. validação para imagem obrigatória
3. possibilidade de editar SEO sem depender de código

Critério de saída:

- nenhum produto novo ativo é publicado sem imagem e conteúdo mínimo

## Critérios de aceite

- [ ] `sitemap.xml` inclui `/bio/[slug]` de todos os produtos ativos.
- [ ] `sitemap.xml` inclui `/bio/categoria/[slug]` de categorias públicas.
- [ ] páginas ativas de produto retornam `index, follow`.
- [ ] páginas inativas ou inexistentes não ficam indexáveis.
- [ ] cada página `/bio/[slug]` renderiza `schema.org/Product`.
- [ ] cada página possui `title`, `description`, `canonical` e imagem social coerentes.
- [ ] a página contém conteúdo útil além do card principal.
- [ ] a página contém link para categoria e produtos relacionados.
- [ ] a experiência mobile continua rápida e orientada a clique.
- [ ] o admin impede publicação de produto ativo sem imagem.
- [ ] não existem textos públicos com problema de encoding.

## Métricas de sucesso

### Curto prazo

1. cobertura completa das URLs no sitemap
2. 100% dos produtos ativos com imagem
3. 100% dos produtos ativos com metadata válido

### Médio prazo

1. aumento de páginas indexadas no Google Search Console
2. crescimento de impressões orgânicas para páginas `/bio/[slug]`
3. crescimento de cliques orgânicos em produtos
4. crescimento do CTR orgânico nas páginas mais buscadas

## Riscos

1. descrições curtas demais continuarem fracas para buscas competitivas
2. produtos sem imagem reduzirem CTR e confiança
3. títulos muito próximos entre si gerarem canibalização
4. conteúdo copiado literalmente do marketplace limitar qualidade orgânica

## Decisões recomendadas

1. tratar imagem como obrigatória para produto ativo
2. tratar categoria como obrigatória para produto ativo
3. permitir `seoTitle` e `metaDescription` customizados no admin
4. manter a página leve, mas com 3 a 5 blocos úteis além do hero

## Checklist consolidado

| Item | Estado | Evidência / próximo passo |
| --- | --- | --- |
| Diagnóstico de indexação dos produtos `/bio/[slug]` | Concluído | Confirmado no código que as páginas existem, mas não entram hoje no sitemap público. |
| Inclusão de produtos e categorias no sitemap | Pendente | Alterar `app/sitemap.ts` para buscar `BioProduct` e `BioCategory` ativos. |
| Implementação de `schema.org/Product` | Pendente | Injetar JSON-LD em `app/(public)/bio/[slug]/page.tsx`. |
| Revisão de metadata para busca real | Pendente | Ajustar `generateMetadata` com padrão orientado a intenção comercial. |
| Enriquecimento de conteúdo da página de produto | Pendente | Adicionar blocos curtos com contexto útil e relacionados. |
| Reforço de links internos entre ofertas, categorias e detalhe | Pendente | Revisar `/ofertas`, categoria e detalhe do produto. |
| Regras mínimas de cadastro para SEO | Em andamento | Admin já recebeu upload de imagem; falta tornar imagem e contexto mínimos obrigatórios. |
| Correção de qualidade textual pública | Pendente | Remover textos com encoding quebrado e padronizar UTF-8. |

## Próxima execução recomendada

Ordem ideal de entrega:

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4

Essa ordem maximiza impacto rápido: primeiro a página fica rastreável, depois compreensível para o Google, depois mais forte em conteúdo e por fim mais escalável no operacional.
