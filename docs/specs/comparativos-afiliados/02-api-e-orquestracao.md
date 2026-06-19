# SDD-CMP-02: API e Orquestracao

## 1. Objetivo
Definir o contrato da nova rotina para cadastro, listagem, execucao, monitoramento e publicacao de comparativos.

## 2. Rotas admin
- `GET /api/comparativos`
  - lista comparativos com filtros `status`, `q`, `page`, `pageSize`
- `POST /api/comparativos`
  - cria comparativo com tema, ano e links
  - salva filhos e agenda execucao
- `GET /api/comparativos/[id]`
  - retorna detalhe completo, itens e timeline
- `PATCH /api/comparativos/[id]`
  - atualiza tema, ano, status manual e links ainda nao processados
- `POST /api/comparativos/[id]/run`
  - dispara reprocessamento
- `GET /api/comparativos/[id]/events`
  - retorna eventos cronologicos

## 3. Rotas publicas
- `GET /comparativo`
  - lista artigos publicados
- `GET /comparativo/[slug]`
  - detalhe publico SEO-friendly

## 4. Payload de criacao
```json
{
  "theme": "bicicleta ergometrica",
  "targetYear": 2026,
  "links": [
    "https://shopee.com.br/produto-1",
    "https://mercadolivre.com.br/produto-2",
    "https://amazon.com.br/produto-3"
  ]
}
```

## 5. Validacoes de entrada
- minimo de `2` links para existir comparacao real;
- maximo conforme config, sugestao `20`;
- remover links vazios e duplicados;
- validar protocolo `http/https`;
- detectar dominio suportado;
- guardar `affiliateUrl` original e tentar resolver `canonicalUrl`.

## 6. Pipeline proposto
Steps padronizados:
1. `validateSources`
2. `scrapeSources`
3. `normalizeSourceData`
4. `generateComparisonBrief`
5. `writeArticle`
6. `reviewSeoAndClaims`
7. `publishComparison`

## 7. Regras de execucao
- Processamento em background, com retorno HTTP rapido no save.
- Lock por `comparisonId`.
- Retry por item em scraping.
- Se alguns links falharem, o artigo pode seguir com os validos se houver pelo menos `2`.
- O titulo final sempre usa `validSourceCount`.
- Se `validSourceCount < 2`, marcar `FAILED` com motivo funcional.

## 8. Reaproveitamento interno
- Criar `lib/comparisons/orchestrator.ts`.
- Criar `lib/comparisons/scrapers/` com adaptadores por dominio.
- Reaproveitar utilitarios de scraping existentes de Shopee e Mercado Livre quando possivel.
- Criar extrator novo para Amazon com fallback conservador.
- Reaproveitar padrao de `steps/events` ja usado em `shopee-pipeline`.

## 9. Contrato interno do artigo
Brief consolidado enviado ao writer:
```json
{
  "theme": "bicicleta ergometrica",
  "targetYear": 2026,
  "productCount": 8,
  "products": [
    {
      "position": 1,
      "storeName": "Amazon",
      "productTitle": "Bike X",
      "brand": "Marca Y",
      "priceText": "R$ 1.999,90",
      "bulletPoints": ["item 1", "item 2"],
      "specs": { "peso_maximo": "120kg" },
      "pros": ["silenciosa"],
      "cons": ["nao informa monitor cardiaco"],
      "confidenceNotes": ["peso maximo confirmado na descricao"]
    }
  ]
}
```

## 10. Publicacao
- Ao concluir, setar `status = PUBLISHED` e `publishedAt = now()`.
- Se `autoPublish = false`, manter em `REVIEWING` para aprovacao manual futura.
- O HTML final ja deve nascer renderizavel na pagina publica.

## 11. Observabilidade
- Registrar eventos por item e por comparativo.
- Registrar modelo, tokens e custo em `AiUsageLog`, ou criar relacao dedicada depois.
- Expor timeline no admin com polling.
