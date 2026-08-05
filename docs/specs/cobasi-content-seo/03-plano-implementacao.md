# Plano de implementação

## 1. Diagnóstico do projeto atual

Já existe:

- tabela `AffiliateStore` com registro da Cobasi, URL afiliada, status e domínio;
- redirecionador `/go/loja/[slug]` com registro de clique;
- função que preserva parâmetros afiliados e rejeita destino em host diferente;
- disclosure comercial reutilizável;
- pipeline editorial com pesquisador, estrategista, redator e revisor;
- bloqueio de URLs inseridas pelo agente no corpo editorial;
- páginas editoriais com metadata, canonical, headings e JSON-LD;
- sitemap dinâmico que publica apenas conteúdo aprovado/indexável;
- `robots.txt` específico do domínio comercial.

Lacunas para este programa:

- não há entidade própria para cidade, unidade, hub, categoria ou revisão de dados locais;
- `SeoBrief` está centrado em produto e sua restrição `@@unique([productId, angle])` não comporta toda a nova taxonomia;
- não há preflight global que prove que todos os CTAs de uma página usam a Cobasi afiliada;
- o sitemap não conhece hubs, categorias ou páginas locais;
- não há score específico para diferenciação local/risco de doorway;
- não há fluxo de expiração de horários, endereços e outros fatos locais;
- filtros ainda não possuem política explícita de canonical/noindex;
- falta dashboard por cluster/cidade e posição do CTA.

## 2. Modelo de dados proposto

Não alterar os modelos atuais até revisar a migração. Estrutura conceitual:

```text
PetContentPage
- id, type (HUB | CATEGORY | GUIDE | COMPARISON | LOCAL)
- title, slug, seoTitle, metaDescription
- primaryKeyword, searchIntent, contentJson
- status, indexable, qualityScore
- affiliateStoreId (obrigatório para página comercial deste programa)
- publishedAt, reviewedAt, expiresAt, createdAt, updatedAt

PetTopic
- id, name, slug, parentId, species, category

PetContentTopic
- pageId, topicId, isPrimary

PetLocation
- id, city, state, slug, ibgeCode opcional
- status, verifiedAt, sourceUrl, notes

PetStoreUnit
- id, locationId, affiliateStoreId
- name, address, postalCode, phone, latitude, longitude
- openingHoursJson, servicesJson, sourceUrl
- verifiedAt, expiresAt, status

PetContentLink
- fromPageId, toPageId, anchor, placement

PetContentSource
- pageId, url, publisher, accessedAt, supportsClaim

PetContentReview
- pageId, kind, score, approved, findingsJson, reviewer, createdAt
```

Restrições:

- `PetLocation.slug` único;
- `PetContentPage.slug` único;
- uma página local publicada por cidade/UF/intenção;
- página comercial publicada exige `affiliateStoreId` não nulo;
- dados de unidade expiram e tornam a página candidata a revisão, não atualização silenciosa;
- remoção/pausa da Cobasi retira CTAs e as páginas comerciais do sitemap até revisão.

## 3. Fases

### Fase 0 — conformidade e fonte de verdade

Objetivo: tornar impossível publicar link comercial incorreto.

- criar `buildAffiliateHref({ storeSlug, source, medium, campaign, destination })`;
- criar componente único `AffiliateCta`;
- validar o registro `cobasi` e parâmetros obrigatórios no preflight;
- ampliar sanitizer para HTML, Markdown, JSON editorial e campos de CTA;
- criar allowlist de hosts somente se o programa de afiliados confirmar deep links;
- garantir `rel="sponsored"`;
- testes unitários e de integração;
- tornar `autoPublish = false` para o novo programa durante o piloto.

Aceite: nenhum template novo consegue receber um `href` externo arbitrário.

### Fase 1 — fundação técnica de conteúdo

- criar modelos/migração após revisão;
- CRUD administrativo para hubs, categorias, guias, comparativos e locais;
- workflow `DRAFT → RESEARCH → REVIEW → APPROVED → PUBLISHED`;
- estados adicionais `STALE`, `REJECTED`, `ARCHIVED`;
- metadata e canonical por tipo;
- renderizador semântico com H1/H2/H3;
- breadcrumb visível + JSON-LD;
- preview obrigatório antes de publicar;
- auditor de páginas órfãs.

Aceite: uma página rascunho é acessível no preview, permanece `noindex` e não aparece no sitemap.

### Fase 2 — hubs e categorias

- publicar `/pets`, `/pets/cachorros` e `/pets/gatos`;
- publicar as seis categorias prioritárias;
- criar navegação por cluster;
- instrumentar pageview, scroll e CTA;
- validar mobile, acessibilidade, performance e HTML renderizado.

Aceite: cada hub possui links para filhos, cada filho volta ao pai e nenhuma página é órfã.

### Fase 3 — guias e comparativos piloto

- selecionar seis guias de intenção de compra;
- produzir três comparativos factuais;
- registrar método, fontes e data;
- manter comparativos médicos fora do ciclo;
- revisar canibalização antes de escolher slug/keyword.

Aceite: nota mínima 80, compliance aprovado e fatos rastreáveis.

### Fase 4 — SEO local piloto

- importar as 97 cidades como inventário não indexável;
- confirmar Planaltina/UF;
- escolher três cidades com maior disponibilidade de dados exclusivos;
- cadastrar unidades e fontes;
- produzir páginas locais manualmente assistidas;
- comparar similaridade entre as páginas; bloquear publicação quando o corpo for substancialmente igual;
- ligar cada página a categorias/Guias relevantes;
- liberar sitemap local somente para aprovadas.

Aceite: cada cidade demonstra valor local próprio e passa checklist completo.

### Fase 5 — sitemap e Search Console

- estender `/sitemap.xml` para os novos tipos durante o piloto;
- ao ganhar escala, criar sitemap index e arquivos por tipo;
- incluir apenas `PUBLISHED + indexable + canonical + 200`;
- usar `updatedAt` apenas quando houver alteração material;
- confirmar referência no `robots.txt`;
- enviar no Search Console;
- inspecionar amostra de cada template e solicitar indexação dos pilotos;
- acompanhar cobertura, duplicação e “Rastreada, mas não indexada”.

Aceite: conjunto do sitemap coincide exatamente com o conjunto elegível no banco.

### Fase 6 — escala controlada

- observar 8–12 semanas;
- escolher páginas vencedoras por impressões, CTR, engajamento e clique afiliado;
- ampliar 10–20 URLs por lote;
- executar revisão humana por amostragem total no começo e baseada em risco depois;
- interromper template com queda de qualidade, duplicação ou baixa indexação;
- revisar conteúdo local a cada 90 dias.

Aceite: nenhum novo lote é liberado sem relatório do lote anterior.

## 4. Backlog técnico priorizado

### P0 — antes do primeiro conteúdo

- [ ] helper único de link afiliado;
- [ ] componente único de CTA;
- [ ] validação dos três UTMs obrigatórios da Cobasi;
- [ ] scanner de URLs externas proibidas;
- [ ] publicação falha fechada;
- [ ] testes do redirecionador, inclusive host diferente e URL malformada;
- [ ] confirmação formal sobre deep links e uso de marca no programa.

### P1 — antes da indexação

- [ ] modelos de conteúdo/tópico/local/fonte/revisão;
- [ ] templates semânticos por tipo;
- [ ] metadata/canonical/OG;
- [ ] headings lint;
- [ ] breadcrumbs e schema;
- [ ] regra de `noindex` para rascunho/filtro;
- [ ] sitemap dos novos tipos;
- [ ] links internos e detector de órfãs;
- [ ] painel de preview e checklist.

### P2 — antes da escala

- [ ] score de similaridade entre páginas locais;
- [ ] expiração e fila de reverificação;
- [ ] dashboards de Search Console e afiliado;
- [ ] sitemap index por tipo;
- [ ] auditoria automatizada de 200/canonical/indexability;
- [ ] testes de performance e acessibilidade em CI;
- [ ] relatório por lote.

## 5. Testes obrigatórios

### Afiliado

1. CTA renderizado começa com `/go/loja/cobasi`.
2. Loja inativa não redireciona externamente.
3. URL afiliada sem `utm_source=mais` falha.
4. URL afiliada sem `utm_medium=maisplataforma` falha.
5. URL afiliada sem `utm_campaign=willianbarata` falha.
6. Destino externo ou host não autorizado é ignorado.
7. Parâmetros afiliados não podem ser sobrescritos pela query do usuário.
8. HTML/JSON com link direto para Cobasi bloqueia publicação.
9. Todos os links comerciais possuem `rel="sponsored"`.

### SEO

1. exatamente um H1;
2. nenhum salto H1→H3;
3. title/meta/canonical presentes e exclusivos;
4. canonical absoluto no domínio comercial;
5. rascunho possui `noindex` e não está no sitemap;
6. publicada indexável responde 200 e está no sitemap;
7. redirect/404/noindex nunca aparece no sitemap;
8. JSON-LD válido e coerente com conteúdo visível;
9. imagens possuem `alt`, largura e altura;
10. nenhuma página órfã.

### Qualidade local

1. cidade/UF e fonte verificadas;
2. endereço e horário não vencidos;
3. similaridade abaixo do limite definido;
4. quantidade mínima de blocos exclusivos satisfeita;
5. disclosure de site independente visível;
6. ausência de afirmação de representação oficial.

## 6. Definition of Done de uma página

Uma página está pronta somente quando:

- pesquisa e intenção aprovadas;
- palavra-chave não canibaliza página existente;
- fontes registradas;
- conteúdo original revisado;
- H1/H2/H3 corretos;
- title, description, canonical e OG presentes;
- schema validado;
- links internos de entrada e saída presentes;
- CTA usa exclusivamente o redirecionador Cobasi;
- disclosure visível;
- testes mobile, acessibilidade e performance aprovados;
- status publicado e indexável definidos;
- sitemap atualizado automaticamente;
- evento de pageview e clique conferido.

## 7. Cadência sugerida de 12 semanas

| Semanas | Entrega |
|---|---|
| 1–2 | P0 afiliado, decisões de marca/deep link, modelo de dados |
| 3–4 | templates, preview, preflight, headings e metadata |
| 5–6 | hubs e seis categorias |
| 7–8 | seis guias e comparativos permitidos |
| 9–10 | três páginas locais piloto e sitemap local |
| 11 | QA técnico, schema, mobile, links e analytics |
| 12 | envio ao Search Console e início da janela de observação |

## 8. Decisões pendentes antes de implementar

1. confirmar se Planaltina é DF ou GO;
2. obter/confirmar regras do programa sobre uso de marca, imagens, preços e deep links;
3. confirmar fonte oficial para unidades, horários e serviços;
4. definir responsáveis por revisão editorial e revisão especializada de saúde;
5. escolher as três cidades piloto conforme completude dos dados, não apenas tamanho;
6. definir se o proprietário quer manter páginas atuais em `/lojas/cobasi/...` como área secundária ou migrá-las gradualmente para a arquitetura neutra com redirects 301 e mapa de canônicos.

