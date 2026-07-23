# Roadmap de Execucao: Conteudo, Operacao, UX e SEO

## Fase 0 - Seguranca e inventario

- [ ] Criar backup verificavel do banco e dos arquivos de storage.
- [ ] Catalogar variaveis de ambiente, credenciais, provedores e custos.
- [ ] Rotacionar tokens que ja foram expostos em mensagens, screenshots ou logs.
- [ ] Listar schedulers ativos e remover duplicidade entre cron externo, `automation/cron` e schedulers internos.
- [ ] Registrar timezone oficial e politica de horario de verao.
- [ ] Definir quais operacoes podem publicar automaticamente e quais exigem aprovacao.

## Fase 1 - Observabilidade operacional

- [x] Criar `OperationDefinition` e cadastro inicial das familias do inventario.
- [x] Criar `OperationRun` com `runId`, heartbeat, contadores, duracao, erro e custo.
- [ ] Instrumentar Mercado Livre, noticias, video de noticias, engagement, Q&A e analytics.
- [x] Criar visao agregada em `/api/pipeline/status?view=operations`.
- [ ] Criar endpoint `/api/operations/runs` com filtros e paginação.
- [x] Detectar scheduler sem heartbeat e classificar como `STALE`.
- [ ] Exibir item mais antigo por fila.
- [ ] Adicionar alertas de credencial, fila envelhecida, storage cheio, custo fora do limite e cron sem heartbeat.

## Fase 2 - Central de Operacoes UX/UI

- [ ] Substituir menu plano por grupos Operacao, Crescimento e Sistemas.
- [x] Criar primeira Central de Operacoes no Dashboard com cards de saude e filas sociais.
- [ ] Criar componente reutilizavel de status, progresso, erro, retry e ultima atividade.
- [ ] Unificar nomenclatura: produto, artigo, video, publicacao, campanha e resultado.
- [ ] Criar pagina de detalhe com linha do tempo completa e acoes contextuais.
- [ ] Manter telas legadas como detalhes, com links de retorno para a Central.
- [ ] Corrigir encoding quebrado em labels existentes e padronizar idioma.
- [ ] Testar responsividade, acessibilidade, estados vazios, loading, erro e dados antigos.

## Fase 3 - Fila, calendario e recuperacao

- [ ] Consolidar todos os posts sociais em uma consulta com timezone local.
- [ ] Criar simulacao de reagendamento antes de aplicar lote.
- [ ] Permitir reagendar apenas uma plataforma ou todas as plataformas do mesmo video.
- [ ] Diferenciar falha de credencial, falha temporaria, video em processamento e item invalido.
- [ ] Criar politica de retry com limite e backoff por provedor.
- [ ] Criar auditoria de toda acao manual.

## Fase 4 - Metricas de conteudo e blog

- [ ] Padronizar eventos: `page_view`, `article_view`, `video_view`, `affiliate_click`, `lead_created`, `sale_attributed`.
- [ ] Garantir IDs de campanha e UTMs em todos os links sociais e afiliados.
- [ ] Criar relatorio diario de artigos, videos, posts, cliques, visitas, leads e vendas.
- [ ] Integrar Search Console para impressao, clique, CTR, posicao e consulta.
- [ ] Separar metricas observadas de metricas estimadas.
- [ ] Criar retencao de dados e politica de privacidade/consentimento.

## Fase 5 - SEO e agentes de marketing

- [ ] Criar catalogo canonico de produtos e associar cada video/artigo ao produto.
- [ ] Criar coletor de termos por produto e regiao.
- [ ] Usar Trends para tendencia relativa e Keyword Planner/Search Console para validar demanda; guardar data e fonte.
- [ ] Criar score de oportunidade: demanda, tendencia, concorrencia, relevancia, margem e capacidade de conversao.
- [ ] Gerar tres briefs por produto: dor, produto e comparativo.
- [ ] Criar agentes separados para pesquisa, estrategia, redacao, SEO, revisao e analise.
- [ ] Adicionar aprovacao humana, citacoes/fontes, bloqueio de claims e detector de duplicidade.
- [ ] Publicar artigos com links internos para produto, video e comparativos.
- [ ] Medir cada cluster apos 7, 14 e 28 dias.

## Fase 6 - Custos, confiabilidade e escala

- [ ] Registrar tokens, render, storage, RunPod, chamadas externas e custo por ativo.
- [ ] Criar limites diarios por agente, pipeline e provedor.
- [ ] Criar circuit breaker para provedor indisponivel.
- [ ] Criar fila de prioridade e capacidade por worker.
- [ ] Criar testes de idempotencia para cada etapa.
- [ ] Criar testes de contrato para Meta, YouTube, storage e workers.
- [ ] Criar relatorio de desperdicio: video gerado sem publicacao, artigo sem visita e custo sem conversao.

## Checklist diario do operador

- [ ] Central de Operacoes sem alerta critico.
- [ ] Nenhuma fila com item antigo acima do SLA.
- [ ] Crons com heartbeat recente.
- [ ] Integracoes autenticadas.
- [ ] Videos gerados ontem publicados ou com motivo claro.
- [ ] Artigos publicados indexaveis e com links internos.
- [ ] Falhas revisadas e reagendadas quando recuperaveis.
- [ ] Custos dentro do limite.
- [ ] Relatorio diario gerado e enviado.

## Checklist antes de liberar automacao SEO

- [ ] Produto e preco conferidos.
- [ ] Links afiliados validos e rastreaveis.
- [ ] Fonte e data de cada afirmacao registradas.
- [ ] Palavra-chave nao escolhida apenas por volume.
- [ ] Intencao de busca compativel com o artigo.
- [ ] Tres angulos nao sao conteudo duplicado.
- [ ] Revisao humana concluida quando houver risco factual, medico, financeiro ou legal.
- [ ] Canonical, sitemap, robots, schema e links internos validados.
