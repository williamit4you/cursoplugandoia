# Plano técnico compartilhado

## 1. Objetivo

Generalizar o motor entregue para Cobasi, evitando três pipelines independentes e difíceis de manter.

## 2. Modelos propostos

```text
ContentProgram
- key, name, storeSlug, niche
- enabled, autoPublish, runEveryHours, maxItemsPerRun
- minimumWords, minimumScore
- requiredTrackingJson, allowedHostsJson
- promptPolicyJson, publicationPolicyJson
- lastRunAt, nextRunAt, lockedAt

ProgramContentPage
- programId, type, status, path, title
- seoTitle, metaDescription, primaryKeyword, intent
- contentJson, outlineJson, sourcesJson, internalLinksJson
- qualityScore, indexable, scheduledAt, publishedAt
- expiresAt, attemptCount, lastError

ProgramContentRun
- programId, pageId, operation, status, step
- message, detailsJson, startedAt, completedAt

ProgramContentSource
- pageId, url, publisher, accessedAt, expiresAt
- sourceType, supportsClaimsJson

ProgramTopic
- programId, parentId, name, slug, status
```

Cobasi mantém suas entidades locais/unidades; Brascol e Electrolux usam módulos complementares somente quando necessário.

## 3. Affiliate guard genérico

1. receber apenas `programKey`, `source`, `medium`, `campaign` e destino opcional;
2. resolver `storeSlug` no servidor;
3. buscar `AffiliateStore` ativa;
4. validar HTTPS, domínio e parâmetros cadastrados;
5. permitir deep link apenas em allowlist;
6. preservar tracking;
7. bloquear URL comercial no conteúdo;
8. renderizar CTA interno `/go/loja/{storeSlug}`;
9. registrar clique por programa, página e posição;
10. falhar fechado.

## 4. Agentes compartilhados

- Opportunity Agent: escolhe tema sem canibalização;
- Research Agent: coleta e estrutura fontes;
- SEO Strategist: intenção, keyword, title e outline;
- Writer: conteúdo no schema do tipo;
- Fact Reviewer: confere alegações versus fontes;
- SEO Reviewer: headings, intenção, links e duplicidade;
- Affiliate Reviewer: loja, disclosure, CTA e claims;
- Editor: corrige e devolve versão completa;
- Publisher: executa preflight e sitemap.

Cada programa injeta políticas próprias. Exemplo: Brascol bloqueia promessa de lucro; Electrolux bloqueia reparo perigoso; Cobasi bloqueia aconselhamento veterinário.

## 5. Scheduler

Um scheduler verifica programas vencidos a cada minuto, mas cada programa mantém seu próprio `nextRunAt`:

- Cobasi: uma pauta/dia;
- Brascol: operação diária, até três publicações/semana;
- Electrolux: uma pauta/dia no piloto;
- lock independente por programa;
- retry exponencial;
- limite de custo diário;
- pause automático após falhas consecutivas;
- nenhuma execução concorrente para o mesmo programa/página.

## 6. Sitemap

- incluir somente `PUBLISHED + indexable + canonical + content + loja ativa`;
- separar por programa ao ganhar escala;
- `/sitemap-pets.xml`;
- `/sitemap-revenda-moda.xml`;
- `/sitemap-casa-e-cozinha.xml`;
- `lastModified` apenas para mudança material;
- excluir filtros, rascunhos, redirects, páginas vencidas e sem fonte obrigatória;
- auditoria diária compara banco, resposta HTTP e sitemap.

## 7. Painel

Cada painel mostra:

- status do job e próxima execução;
- orçamento/custo dos agentes;
- fila por tipo;
- rascunhos em revisão;
- publicados e sitemap;
- fontes vencendo;
- páginas com queda de desempenho;
- cliques afiliados;
- logs e falhas;
- botão produzir próxima pauta;
- pausa, reprocessamento, publicação e despublicação.

## 8. Fases

### Fase A — generalização

- extrair modelos e pipeline comuns;
- migrar Cobasi sem mudar URLs públicas;
- criar affiliate guard parametrizado;
- adicionar testes de regressão.

### Fase B — Brascol

- cadastrar programa e prompts;
- importar 30 pautas;
- criar rotas `/revender-roupas/...`;
- gerar rascunhos;
- publicar três por semana.

### Fase C — Electrolux

- cadastrar taxonomia e 36 pautas;
- criar rotas `/casa-e-cozinha/...`;
- implementar fonte/manual/modelo;
- gerar rascunhos;
- publicar até cinco por semana.

### Fase D — mensuração e escala

- conectar Search Console;
- relatórios por programa;
- atualização por expiração;
- sitemaps separados;
- liberar lotes de 10–20 páginas conforme desempenho.

## 9. Testes de aceite

- programa nunca usa loja afiliada de outro programa;
- Brascol sempre roteia por `/go/loja/brascol`;
- Electrolux sempre roteia por `/go/loja/electrolux`;
- parâmetro obrigatório ausente bloqueia publicação;
- conteúdo com URL comercial direta é reprovado;
- rascunho/noindex não entra no sitemap;
- exatamente um H1 e hierarquia H2/H3 válida;
- fonte vencida retém página comercial;
- similaridade/canibalização acima do limite bloqueia publicação;
- conteúdo de segurança Electrolux não oferece reparo perigoso;
- conteúdo Brascol não promete lucro/faturamento;
- build, typecheck, testes e auditoria de links passam.

## 10. Ordem recomendada

1. estabilizar e ativar Cobasi;
2. generalizar o motor;
3. implantar Brascol, menor e ótimo para validar multi-programa;
4. implantar Electrolux;
5. observar 12 semanas;
6. escalar somente os clusters que indexarem e converterem.

