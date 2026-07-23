# Inventario de Operacoes do Portal IA

Data da auditoria: 2026-07-23

## Resposta curta

O sistema nao e apenas uma automacao de Shopee. O codigo atual possui pelo menos oito familias de operacao. O numero de processos realmente rodando neste momento nao pode ser afirmado somente pela leitura do codigo: ele depende do banco, dos crons, das sessoes de worker e dos provedores externos. Esta documentacao separa capacidade instalada de execucao atual.

## Familias encontradas

| Familia | O que faz | Principais evidencias | Saidas |
| --- | --- | --- | --- |
| Shopee / afiliados | Le URLs, coleta produto, gera roteiro/audio/video e enfileira publicacao | `app/api/shopee`, `app/api/coleta-shopee`, `lib/shopee-pipeline` | Video, link afiliado, SocialPost |
| Mercado Livre | Fluxo paralelo de afiliados e geracao de video | `app/api/mercado-livre`, `app/api/scrapers` | Video, afiliado, SocialPost |
| Noticias e artigos | Scraping de fontes, criacao/atualizacao de Posts e publicacao no portal | `app/api/posts`, `app/api/scrapers`, rotas publicas `/noticias` | Artigo, SEO basico, capa |
| Video de noticias | Converte artigo em projeto de video, audio, render e fila social | `lib/newsArticleVideo.ts`, `lib/newsArticleVideoTrigger.ts`, `app/api/posts/[id]/generate-video` | CodeVideoProject, SocialPost |
| Video de engajamento | Cria ideias, roteiro, audio, video e pode publicar em varias redes | `app/api/engajamento`, `app/api/engajamento-pipeline`, `lib/engagement` | EngagementIdea, videos, SocialPost |
| Perguntas / Q&A | Importa perguntas, gera respostas em video e enfileira social | `app/api/video-questions`, `app/api/worker/process-next-question` | VideoQuestion, video, SocialPost |
| Publicacao social | Agenda e publica em Meta/Instagram, YouTube, TikTok, LinkedIn e site | `app/api/social`, `lib/socialCronRunner.ts` | Post publicado, URL, log, status |
| Analytics e monetizacao | Mede YouTube, cliques, bio, vendas, funil e uso de IA | `app/api/youtube-analytics`, `app/api/admin/sales-analytics`, `app/api/bio/admin/analytics`, `app/api/worker/ai-usage` | KPIs, snapshots, relatorios |

## Orquestradores e agendadores atuais

O endpoint `app/api/automation/cron/route.ts` chama uma cadeia de rotinas: tasks, Mercado Livre, social, Shopee pipeline, publisher Shopee, engagement pipeline, publisher de engagement e perguntas. Alem dele, `instrumentation.ts` inicia schedulers internos para pipeline Shopee, pipeline de engagement e fila social. Tambem existem rotas de cron separadas para video engagement, YouTube analytics, task runs e outros modulos.

Isso cria risco de duplicidade, concorrencia e dificuldade de diagnostico. A primeira tarefa de observabilidade deve registrar cada execucao com `operationKey`, `runId`, inicio, fim, status, quantidade processada, custo estimado e erro normalizado.

## O que precisa ser medido para responder "o que esta rodando agora"

- Jobs em estado de processamento por familia.
- Ultima execucao e proxima execucao de cada scheduler.
- Itens aguardando, em processamento, concluidos, falhos e travados.
- Workers ativos, sessoes RunPod e pods ligados.
- Chamadas externas em andamento ou aguardando retry.
- Custo estimado por video, artigo, audio, render e chamada de IA.
- Idade do item mais antigo da fila.

Sem esses dados, os numeros da tela sao apenas contagens de banco e nao comprovam que um worker esta vivo.

## Modelo operacional recomendado

O usuario deve enxergar quatro camadas, nesta ordem:

1. **Fontes**: URLs Shopee/Mercado Livre, fontes de noticias, perguntas, produtos.
2. **Producao**: scraping, roteiro, audio, video, artigo, SEO.
3. **Distribuicao**: fila social, calendario, publicacao e retries.
4. **Resultado**: visualizacoes, cliques, visitas, leads, vendas e custo.

As telas atuais devem virar detalhes dessas quatro camadas, nao itens de primeiro nivel no menu.
