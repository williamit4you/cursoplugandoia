# Correção do cron do pipeline Shopee — vídeo manual

Data da análise: 24/07/2026  
Escopo: fluxo em que o operador envia um vídeo, informa link de afiliado, título e descrição, e o pipeline deve avançar suas etapas automaticamente.

> Atualização de implementação: a separação `MANUAL_VIDEO`/`SCRAPE_SOURCE`, a geração de copy manual e o cron externo por padrão foram implementados em 24/07/2026. A transformação dos workers de vídeo/merge para jobs assíncronos continua dependente de um contrato de polling nos próprios workers.

## Resumo executivo

O fluxo novo de vídeo manual não foi conectado ao orquestrador de vendas. O endpoint de upload cria a coleta como `PENDING` e sem `aiPromptVendas`. No orquestrador, `PENDING` sempre significa **fazer scraping da URL na Shopee**. Portanto, mesmo com vídeo, título, descrição e link já informados, a primeira ação ainda chama o `render-service` para scraping. Isso é incompatível com a retirada da busca/download da Shopee e impede a sequência normal quando o serviço não retorna mídia.

Há uma segunda causa independente que pode fazer o cron nunca disparar em produção: o cron externo deixa de chamar o pipeline quando `INTERNAL_CRON_ENABLED` é verdadeiro (valor padrão), e o agendador interno usa `setInterval` no processo Next. Em ambiente serverless, intervalos em memória não são um scheduler confiável entre invocações.

O desenho atual também bloqueia o avanço enquanto uma etapa lenta está aguardando Modal/worker: as chamadas de geração/merge são síncronas para o request do cron e podem durar 30–75 minutos. Durante esse período, a trava global do scheduler ignora os próximos ticks.

## Fluxo esperado

Entrada manual:

```text
Upload do vídeo + link afiliado + título + descrição
  -> cria coleta já pronta para gerar copy
  -> gerar copy de vendas
  -> gerar áudio
  -> iniciar geração assíncrona do vídeo da copy
  -> consultar o job até concluir
  -> merge com o vídeo enviado
  -> criar BioProduct e StoryAd/publicações
```

Não deve haver scraping, busca de produto, download de mídia nem geração de link afiliado nessa variante; o vídeo e o link já foram fornecidos pelo operador.

## Evidências e causas

### 1. Upload manual reintroduziu o estado de scraping

Arquivo: `app/api/coleta-shopee/manual/route.ts`.

O endpoint recebe `url`, `titulo`, `descricao` e `video`; salva o vídeo em MinIO e persiste:

```ts
url,
affiliateUrl: url,
titulo: titulo || null,
descricao: descricao || null,
aiPromptVendas: null,
status: "PENDING",
pipelineStatus: "PENDING",
mediaVideoUrls: [videoUrlMinio],
```

Já em `lib/shopee-pipeline/orchestrator.ts`, a transição para qualquer item `PENDING` é `SCRAPE_MEDIA`, que chama `scrapeShopeeAndPersist({ productUrl: item.url })`.

Consequências:

- O link de afiliado é usado como se fosse uma URL de produto a ser raspada.
- Título e descrição manuais podem ser substituídos pelo retorno do scraper.
- A copy fica nula até que o scraper gere `aiPromptVendas`.
- A retirada do scraping/download tornou a primeira etapa inválida, portanto o pipeline não chega à geração de áudio/vídeo.

O histórico confirma a regressão: os commits `dbe6519` e `9047ba0` haviam ajustado o upload manual para `COPY_READY`; o commit `39af145` voltou-o para `PENDING` e removeu a geração de `aiPromptVendas`.

### 2. O scraper exige mídia remota mesmo quando já existe vídeo manual

Arquivo: `lib/shopee-pipeline/scrape.ts`.

Apesar de preservar `mediaVideoUrls` existentes depois do scraping, a função falha antes disso quando `linksMedia` do render-service está vazio:

```ts
if (linksMedia.length === 0) {
  throw new Error("Scraping nao retornou midias do HTML. Operacao cancelada.");
}
```

Logo, o vídeo manual não é um fallback efetivo. Sem scraping ativo, este fluxo falha/reagenda e nunca chega a `COPY_READY`.

### 3. O cron externo não executa o pipeline quando o agendador interno está ativo

Arquivo: `app/api/automation/cron/route.ts`.

`internalSchedulersEnabled()` considera `INTERNAL_CRON_ENABLED` como `true` quando a variável não existe. Nessa condição, `/api/automation/cron` devolve um falso sucesso para Shopee, sem chamar `/api/shopee-pipeline/cron`:

```ts
const shopeePipeline = internalOwnsPipelines
  ? { ok: true, status: 200, data: { skipped: true, owner: "internal_scheduler" } }
  : await callJson(`${origin}/api/shopee-pipeline/cron${encodedSecret}`);
```

O único executor passa a ser `lib/internalCronScheduler.ts`, iniciado por `instrumentation.ts` e baseado em `setInterval`. Isso só funciona enquanto o processo Node permanecer vivo. Não é suficiente para Vercel/serverless, em que a instância pode encerrar logo após a requisição. Mesmo em processo persistente, reinícios removem o timer até a próxima inicialização da aplicação.

### 4. Etapas longas monopolizam o cron

Arquivos: `lib/internalCronScheduler.ts`, `lib/shopee-pipeline/modalClient.ts`, `lib/shopee-pipeline/merge.ts`.

O scheduler ignora todo tick quando `__plugandoShopeeInternalCronRunning` é verdadeiro. Cada tick aguarda `runShopeePipelineCron`, que aguarda `runShopeePipelineOnce`, que aguarda as requisições ao Modal/worker. Os timeouts são de até 75 minutos para vídeo e 45 minutos para merge.

Assim, uma geração lenta não fica em estado assíncrono consultável: ela ocupa a execução atual. Não há como o cron pegar a próxima ação/item enquanto o request estiver pendente. Isso diverge da regra pedida: ao iniciar processamento de vídeo, o cron deve poder seguir para outro trabalho elegível e depois consultar a conclusão.

### 5. Falha terminal não é selecionável para reprocessamento automático

Arquivo: `lib/shopee-pipeline/orchestrator.ts`.

`FAILED` está em `EXCLUDED_STATUSES`; portanto, o seletor não escolhe itens `FAILED`. Existe uma condição de código para `PENDING || FAILED` no passo de scraping, mas ela é inalcançável pela seleção normal. Após as tentativas, é necessário um requeue explícito (não há política documentada/automática nesse fluxo).

### 6. Modelagem ambígua para URL

O campo `url` contém o mesmo link de afiliado que `affiliateUrl`. Para o fluxo antigo, `url` era URL de origem e era usado por scraping/geração de link. Para o novo fluxo manual, ele significa outra coisa. Essa sobrecarga facilita o retorno acidental ao scraping e pode gerar link de afiliado sobre um link já afiliado se a condição mudar no futuro.

## Correção recomendada

### A. Separar o modo manual do modo legado

Adicionar um discriminador explícito, por exemplo `inputMode`:

- `SCRAPE_SOURCE`: URL do produto; permite `SCRAPE_MEDIA` e `GENERATE_AFFILIATE_LINK`.
- `MANUAL_VIDEO`: vídeo + metadados + link afiliado; não permite scraping nem geração de link.

Idealmente, armazenar `sourceUrl` e `affiliateUrl` em campos diferentes. Não reutilizar `url` com dois significados.

Migração sugerida:

1. Adicionar `inputMode` com default `SCRAPE_SOURCE` para preservar registros existentes.
2. Adicionar `sourceUrl` opcional e migrar o conteúdo de `url` dos registros antigos.
3. Para novos envios manuais, preencher `inputMode=MANUAL_VIDEO`, `affiliateUrl`, título, descrição e `mediaVideoUrls`.
4. Manter `url` somente enquanto houver compatibilidade; removê-lo de decisões novas do orquestrador.

### B. Corrigir a criação do upload manual

O endpoint manual deve criar o item com estado que pule o scraping. Há duas opções seguras:

1. **Copy síncrona no cadastro:** gerar e persistir `aiPromptVendas` no endpoint e criar em `COPY_READY`.
2. **Copy como etapa do pipeline (preferível):** criar em `GENERATING_COPY`/`COPY_PENDING` e implementar um passo `GENERATE_SALES_COPY` que usa título, descrição e link manual.

A segunda opção evita requisições longas no upload e torna retry/auditoria consistentes.

Critérios do passo de copy manual:

- entrada: título, descrição e `affiliateUrl`;
- saída: `aiPromptVendas` não vazio;
- não consultar Shopee nem render-service;
- registrar `ShopeePipelineStep` e `ShopeePipelineEvent`;
- falhar de forma recuperável, com backoff e limite de tentativas.

Para correção mínima temporária, o upload pode criar em `COPY_READY` **somente se** já persistir uma `aiPromptVendas` válida. Criar em `COPY_READY` com copy nula apenas desloca a falha para `GENERATE_AUDIO`.

### C. Tornar tarefas de vídeo assíncronas

Os workers Modal e de merge devem expor contrato de job:

```text
POST /jobs                 -> { jobId, status: "QUEUED" | "PROCESSING" }
GET  /jobs/:jobId          -> { status, resultUrl?, error? }
```

O orquestrador deve:

1. iniciar o job e persistir `jobId`, status e `nextRunAt` curto;
2. liberar a trava da coleta e retornar imediatamente;
3. em tick posterior, consultar o job;
4. avançar apenas quando houver URL final; reagendar quando estiver processando; aplicar retry apenas em erro real.

Enquanto não houver API assíncrona dos workers, não prometa processamento paralelo. O cron deve usar um worker/fila persistente para essas tarefas, em vez de aguardar 45–75 minutos dentro da rota Next.

### D. Escolher uma única autoridade de agendamento por ambiente

**Produção serverless (recomendado):**

- configurar um provedor externo (Vercel Cron, GitHub Actions, Cloud Scheduler etc.) para chamar `/api/shopee-pipeline/cron?secret=...` a cada minuto;
- definir `INTERNAL_CRON_ENABLED=false` em produção;
- não depender de `setInterval` em `instrumentation.ts`;
- manter a autenticação por `CRON_SECRET`.

**Servidor Node persistente:**

- permitir o scheduler interno;
- não registrar a mesma rotina no cron externo;
- monitorar `lastTickAt` e alertar após 2 intervalos sem tick;
- garantir execução única entre réplicas com lock no banco, não apenas variável global.

Em ambos os casos, remover o falso `ok` do `/api/automation/cron`: retornar claramente que a etapa foi ignorada e por qual executor, ou executar diretamente quando configurado como owner externo.

### E. Concorrência, lock e retry

- Substituir a trava global em memória por lock com lease no banco (ou fila com concorrência configurada).
- Liberar lock ao enviar job assíncrono; manter apenas marca de job/lease curta para evitar duplicidade.
- Separar `FAILED` terminal de `RETRY_SCHEDULED`; incluir apenas o segundo no seletor após `nextRunAt`.
- Oferecer ação administrativa “Reenfileirar” que redefine estado, `lastError`, `nextRunAt` e lock de modo auditável.
- Definir idempotência por etapa/job para que dois ticks não gerem dois vídeos ou duas publicações.

## Ordem de implementação

1. Corrigir o owner do cron em produção e validar um tick externo real por minuto.
2. Criar `inputMode`/`sourceUrl` e adaptar o upload manual para não entrar em `SCRAPE_MEDIA`.
3. Implementar `GENERATE_SALES_COPY` para o modo manual.
4. Transformar Modal/merge em jobs assíncronos com polling.
5. Ajustar locks, retry e requeue.
6. Migrar/recuperar itens manuais já presos em `PENDING` ou `FAILED`.

## Recuperação dos itens já afetados

Antes de atualizar registros, fazer backup e listar itens `pipelineKind=SALES` criados pelo upload manual. O critério recomendado é vídeo em `mediaVideoUrls`, `affiliateUrl` preenchido e ausência de `sourceUrl`/modo de scraping.

Para cada item:

- se título/descrição/link/vídeo estiverem válidos, marcar como `MANUAL_VIDEO`;
- gerar/regerar `aiPromptVendas` pela nova etapa;
- limpar `lockedAt`, `lockedBy`, `lastError` e definir `nextRunAt` para agora;
- reencaminhar ao primeiro estado válido da nova máquina de estados;
- não reenviar jobs já concluídos: antes, conferir `audioUrl`, `copyVideoUrl`, `videoFinalUrl`, steps e eventos.

Não aplicar atualização em massa baseada apenas em `PENDING`: o banco ainda contém fluxo legado que realmente precisa de scraping.

## Plano de testes de aceitação

### Testes unitários

- Upload manual cria `inputMode=MANUAL_VIDEO` e nunca chama `scrapeShopeeAndPersist`.
- Upload manual sem título/descrição segue a política definida (erro de validação ou copy genérica), sem scraping.
- Primeiro tick de item manual gera copy; segundo inicia áudio; próximos ticks avançam conforme jobs retornam.
- Item legado `SCRAPE_SOURCE` continua iniciando em `SCRAPE_MEDIA`.
- `FAILED` não roda sozinho; `RETRY_SCHEDULED` roda somente após `nextRunAt`; requeue torna o item elegível.
- Dois runners concorrentes não criam dois jobs para a mesma etapa.

### Teste integrado de cron

1. Configurar `runEveryMinutes=1`, `maxItemsPerRun=1` e owner externo.
2. Criar upload manual com vídeo pequeno, link de afiliado, título e descrição.
3. Invocar o endpoint do cron duas ou mais vezes, simulando os minutos.
4. Confirmar em `ShopeePipelineStep` esta sequência, sem `SCRAPE_MEDIA`:

```text
GENERATE_SALES_COPY -> GENERATE_AUDIO -> GENERATE_COPY_VIDEO
-> MERGE_VIDEOS -> CREATE_BIO_PRODUCT -> CREATE_STORY_AD
```

5. Durante `GENERATE_COPY_VIDEO=PROCESSING`, confirmar que um segundo item elegível pode iniciar sua próxima etapa.
6. Reiniciar a aplicação entre ticks e confirmar continuidade pelo banco.
7. Validar que o provedor de cron registra chamadas 200 e que `lastCronRunAt` evolui a cada minuto.

### Observabilidade mínima

- métrica/registro: `lastSuccessfulCronAt`, duração, itens examinados, itens avançados, itens em espera, falhas;
- alerta se nenhum tick for concluído em 2–3 minutos;
- painel com executor configurado (`external` ou `internal`), próximo tick e motivo de não elegibilidade;
- eventos com `jobId`, etapa, tentativa e URL de resultado (sem segredos).

## Arquivos diretamente envolvidos

- `app/api/coleta-shopee/manual/route.ts`
- `lib/shopee-pipeline/orchestrator.ts`
- `lib/shopee-pipeline/scrape.ts`
- `lib/shopee-pipeline/cronRunner.ts`
- `lib/internalCronScheduler.ts`
- `instrumentation.ts`
- `app/api/automation/cron/route.ts`
- `lib/shopee-pipeline/modalClient.ts`
- `lib/shopee-pipeline/merge.ts`
- `prisma/schema.prisma`

## Limites desta análise

Foi feita análise estática e de histórico local. A consulta ao banco local não pôde validar os itens reais porque a execução direta não recebeu a configuração `DATABASE_URL` do runtime Next; por isso, os estados/configurações em produção precisam ser conferidos com o checklist de aceitação acima antes de qualquer migração de dados.
