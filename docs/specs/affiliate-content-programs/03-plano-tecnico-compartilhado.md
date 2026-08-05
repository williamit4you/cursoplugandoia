# Plano técnico compartilhado

## 1. Decisão arquitetural

Generalizar o motor da Cobasi em um domínio `affiliate-content`, mantendo adaptadores temporários para as tabelas e rotas pet. Não criar onze cópias de `PetSeoConfig`, `PetContentPage` e `PetSeoRun`.

```text
Cron autenticado
  → Portfolio Scheduler
    → Program Scheduler
      → Opportunity/Refresh Selector
        → Agent Pipeline
          → Review Gates
            → Publication Preflight
              → Public Renderer
                → Sitemap + Analytics
```

## 2. Princípios

- configuração, não `if` por loja;
- uma operação por item por ciclo;
- publicação transacional e idempotente;
- falha fechada para afiliado, fonte e compliance;
- rascunho pode existir incompleto; publicação não;
- cada afirmação volátil aponta para uma fonte e validade;
- sitemap é projeção do estado elegível no banco;
- agente sugere; regras determinísticas decidem bloqueios;
- job diário é operação contínua, não fábrica obrigatória de URLs.

## 3. Componentes

### 3.1 Portfolio Scheduler

- chamado por `/api/affiliate-content/cron` com `CRON_SECRET`;
- encontra programas `enabled` com `nextRunAt <= now`;
- aplica limite global de custo e concorrência;
- distribui capacidade com round-robin ponderado;
- evita que um programa grande bloqueie os menores;
- registra heartbeat e resultado na observabilidade existente.

### 3.2 Program Runner

- adquire lock atômico por programa;
- seleciona uma operação elegível;
- executa no máximo `maxItemsPerRun`;
- atualiza `lastRunAt` e `nextRunAt` mesmo em `WAIT`;
- limpa lock em sucesso e falha;
- recupera lock vencido com registro explícito.

### 3.3 Pipeline de agentes

Agentes compartilhados recebem `ProgramPolicy`:

1. Opportunity Agent;
2. Research Agent;
3. SEO Strategist;
4. Writer;
5. Fact Reviewer;
6. SEO Reviewer;
7. Compliance Reviewer;
8. Affiliate Reviewer;
9. Editor;
10. Publisher.

Detalhes em [jobs, agentes e operação](./15-jobs-agentes-operacao.md).

### 3.4 Preflight de publicação

O serviço `validateProgramPageForPublication(pageId)` retorna lista estruturada de achados. O serviço não lança exceção de UI para falha editorial esperada; a action persiste `lastError`, mantém o status anterior e devolve feedback ao operador.

Validações mínimas:

- programa e loja ativos;
- `page.programId` corresponde à loja esperada;
- tracking e domínio válidos;
- nenhum URL comercial direto armazenado;
- conteúdo e metadata completos;
- exatamente um H1 e ordem H2/H3 válida;
- fontes mínimas e não vencidas;
- risk gate aprovado;
- similaridade/canibalização abaixo do limite;
- links internos de entrada e saída;
- canonical único e rota sem conflito;
- schema compatível com conteúdo visível;
- aprovação humana válida;
- preço/estoque/localidade atualizados quando aplicável.

### 3.5 Publicação

Em uma transação:

1. criar `ContentRevision` imutável;
2. marcar versão aprovada;
3. definir `status=PUBLISHED`, `indexable=true`, `publishedAt`;
4. registrar `PublicationEvent`;
5. concluir `ContentRun`;
6. emitir evento para revalidação de rota e sitemap.

Se qualquer passo falhar, nenhuma alteração parcial deixa a página indexável.

## 4. Migração da Cobasi

1. manter `/admin/seo-pet-cobasi` e rotas públicas atuais;
2. introduzir `ContentProgram(key=COBASI_PET, storeSlug=cobasi)`;
3. criar adaptador de leitura/escrita entre o motor novo e entidades pet;
4. mover seleção, agentes, validação e scheduler para serviços genéricos;
5. provar paridade com testes existentes;
6. migrar dados em etapa posterior e somente com plano reversível;
7. preservar URLs, canonical, sitemap e analytics.

## 5. Rotas

### Administração

```text
/admin/programas-afiliados
/admin/programas-afiliados/{programKey}
/admin/programas-afiliados/{programKey}/conteudos/{pageId}
/admin/programas-afiliados/{programKey}/fila
/admin/programas-afiliados/{programKey}/execucoes
/admin/programas-afiliados/{programKey}/fontes
/admin/programas-afiliados/{programKey}/analytics
```

Aliases como `/admin/conteudo-brascol` podem redirecionar para a aba canônica.

### API

```text
GET  /api/admin/affiliate-content/programs
PATCH /api/admin/affiliate-content/programs/{key}
POST /api/admin/affiliate-content/programs/{key}/run
POST /api/admin/affiliate-content/programs/{key}/bootstrap
GET  /api/admin/affiliate-content/pages
POST /api/admin/affiliate-content/pages/{id}/queue
POST /api/admin/affiliate-content/pages/{id}/approve
POST /api/admin/affiliate-content/pages/{id}/publish
POST /api/admin/affiliate-content/pages/{id}/unpublish
POST /api/admin/affiliate-content/pages/{id}/retry
GET  /api/admin/affiliate-content/pages/{id}/preflight
GET  /api/affiliate-content/cron
GET  /go/loja/{storeSlug}
```

Mutação administrativa exige sessão/autorização; cron exige segredo; ações são protegidas por CSRF conforme o padrão do projeto.

## 6. Renderização pública

- rota é derivada de `path`, nunca da marca;
- página server-rendered com metadata no primeiro HTML;
- um único componente de CTA recebe `programKey`, `pageId`, `placement` e destino lógico opcional;
- o componente não aceita `href` comercial arbitrário;
- HTML rascunho/preview inclui `noindex,nofollow`;
- conteúdo publicado fica disponível somente se elegível; caso contrário retorna estado seguro e sai do sitemap.

## 7. Observabilidade

Cada execução registra:

- programa, página, operação, etapa e tentativa;
- duração e custo estimado;
- modelo/prompt versionado;
- contagem de fontes e achados;
- status e próximo retry;
- motivo de `WAIT`, bloqueio ou pausa;
- correlação com evento de publicação.

Alertas:

- três falhas consecutivas pausam automaticamente o programa;
- qualquer falha de isolamento de afiliado pausa o portfólio;
- sitemap divergente cria incidente P1;
- conteúdo `HIGH` publicado sem aprovação especializada cria incidente P0 e despublicação automática.

## 8. Segurança e resiliência

- segredo e chave de IA apenas no servidor;
- prompts não recebem cookies, tokens ou URL afiliada completa;
- sanitização de HTML/Markdown/JSON antes de persistir;
- allowlist de protocolos `https:` para fontes;
- SSRF protegido na coleta de fontes;
- limites de tamanho e timeout;
- lock com compare-and-set;
- retry com jitter e fila morta após limite;
- exclusão lógica para conteúdo publicado;
- revisão/auditoria imutáveis.

## 9. Estratégia de testes

- unitários: tracking, sanitizer, headings, canonical, estado e escolha de operação;
- integração: programa → loja → CTA → redirect; preflight → publish → sitemap;
- contrato: schema de saída de cada agente;
- regressão: Cobasi mantém comportamento e URLs;
- E2E: criar, gerar, revisar, publicar, acessar, clicar e despublicar;
- propriedade: para qualquer programa, CTA nunca resolve para outro `storeSlug`;
- snapshot de HTML: H1/H2/H3, disclosure, schema e links.

