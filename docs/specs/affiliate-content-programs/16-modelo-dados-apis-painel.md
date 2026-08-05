# Modelo de dados, APIs e painel

## 1. Modelo conceitual

```text
ContentProgram
- id, key, name, slug, niche
- affiliateStoreId (unique por programa ativo)
- status, enabled, autoPublish
- runEveryHours, maxItemsPerRun, weeklyPublishLimit
- riskClass, minimumScore, minimumWords
- requiredTrackingJson, allowedHostsJson
- promptPolicyJson, sourcePolicyJson, publicationPolicyJson
- dailyBudgetUsd, lastRunAt, nextRunAt, lockedAt, consecutiveFailures

ContentTopic
- id, programId, parentId
- name, slug, cluster, priority, status

ProgramContentPage
- id, programId, topicId, locationId?
- type, status, riskClass
- path, slug, title, seoTitle, metaDescription
- primaryKeyword, searchIntent, canonicalPath
- outlineJson, contentJson, internalLinksJson
- qualityScore, similarityScore, indexable
- scheduledAt, publishedAt, reviewedAt, expiresAt
- approvedRevisionId?, attemptCount, lastError

ContentRevision
- id, pageId, revisionNumber
- outlineJson, contentJson, metadataJson
- checksum, createdBy, createdAt

ContentSource
- id, pageId, revisionId?
- url, publisher, sourceType, purpose
- claimsJson, accessedAt, expiresAt, status

ContentReview
- id, pageId, revisionId
- kind, reviewerType, reviewerId?
- status, score, findingsJson, createdAt

ContentRun
- id, programId, pageId?
- operation, status, step, runKey
- promptVersion?, model?, estimatedCostUsd?
- message, detailsJson, attempt
- startedAt, heartbeatAt, completedAt, nextRetryAt?

PublicationEvent
- id, pageId, revisionId
- action, actorId?, preflightJson, createdAt

ContentLocation
- id, programId, city, state, slug
- factsJson, sourcesJson, verifiedAt, expiresAt, status

ContentPerformanceDaily
- date, programId, pageId
- impressions, clicks, sessions, affiliateClicks, conversions?, revenue?
```

## 2. Restrições de banco

- `ContentProgram.key` e `slug` únicos;
- `ProgramContentPage.path` único globalmente;
- `@@unique([programId, primaryKeyword])` apenas se normalização for confiável; caso contrário, detector semântico + índice auxiliar;
- `ContentRevision(pageId, revisionNumber)` único;
- `ContentRun.runKey` único;
- página comercial exige programa com `affiliateStoreId`;
- revisão aprovada deve pertencer à própria página;
- publicação exige revisão imutável;
- localização é única por `programId + city + state + intent` quando aplicável;
- deletar programa publicado é proibido; usar arquivamento.

## 3. Configuração por programa

`requiredTrackingJson`:

```json
{
  "utm_source": "mais",
  "utm_medium": "maisplataforma",
  "utm_campaign": "willianbarata"
}
```

Thermos:

```json
{
  "parceiro": "12410",
  "am": "willianbarata"
}
```

`publicationPolicyJson` contém revisão humana, especialista, validade de fontes, tipos permitidos e limites de publicação. JSONs devem ser validados por schema versionado.

## 4. Endpoints e respostas

Todas as respostas usam `{ ok, data?, error?, findings? }`. Erros editoriais usam `422`, conflitos de estado `409`, autenticação `401/403` e infraestrutura `500`.

### Preflight

`GET /api/admin/affiliate-content/pages/{id}/preflight`

```json
{
  "ok": false,
  "findings": [
    {
      "code": "AFFILIATE_TRACKING_MISSING",
      "severity": "BLOCKER",
      "field": "affiliateStore.affiliateUrl",
      "message": "Parâmetro obrigatório ausente."
    }
  ]
}
```

### Publish

`POST /api/admin/affiliate-content/pages/{id}/publish`

- exige `approvedRevisionId`;
- usa chave de idempotência;
- retorna a versão publicada e rotas revalidadas;
- em `422`, mantém a tela operacional e exibe achados;
- nunca publica parcialmente.

### Run

`POST /api/admin/affiliate-content/programs/{key}/run`

- `force` ignora apenas horário, não policy/preflight;
- `operation` opcional restringe a seleção;
- execução manual também respeita lock e orçamento, salvo autorização explícita para orçamento.

## 5. Painel consolidado

Visão geral:

- cards por programa: status, próxima execução, fila, review, published, stale, sitemap, falhas e custo;
- alertas de afiliado e compliance no topo;
- capacidade diária/global;
- performance por cluster;
- atalhos para pausar e abrir programa.

## 6. Aba do programa

Seções:

1. Visão geral;
2. Conteúdos;
3. Fila;
4. Taxonomia;
5. Fontes e vencimentos;
6. Execuções/logs;
7. SEO e sitemap;
8. Analytics;
9. Configuração.

A aba mostra o `storeSlug` e o tipo de tracking, mas mascara a URL completa para reduzir cópia acidental. Alteração da loja exige confirmação e auditoria.

## 7. Tela de conteúdo

- estado e timeline;
- intenção/cluster/risco;
- editor estruturado;
- outline H1/H2/H3;
- fontes ligadas aos claims;
- links internos;
- diff entre revisões;
- achados por reviewer;
- preview desktop/mobile;
- CTA lógico e loja resolvida;
- preflight executável;
- ações: fila, retry, aprovar, publicar, despublicar e arquivar.

O botão Publicar fica habilitado apenas com revisão aprovada, mas o servidor sempre reexecuta o preflight.

## 8. Sitemap e analytics no painel

Para cada página:

- indexable no banco;
- presente/ausente no sitemap;
- status HTTP observado;
- canonical observado;
- última alteração material;
- impressões, cliques, CTR e posição;
- cliques afiliados por CTA;
- status de fonte/expiração.

Divergências têm ação “revalidar” e não devem ser corrigidas por edição manual do sitemap.

