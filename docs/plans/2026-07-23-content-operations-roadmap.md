# Roadmap de Execucao: Conteudo, Operacao, UX e SEO

## Fase 0 - Seguranca e inventario

- [ ] Criar backup verificavel do banco e dos arquivos de storage.
- [x] Catalogar variaveis de ambiente, credenciais, provedores e custos no runbook operacional.
- [ ] Rotacionar tokens que ja foram expostos em mensagens, screenshots ou logs.
- [ ] Listar schedulers ativos e remover duplicidade entre cron externo, `automation/cron` e schedulers internos.
- [x] Registrar timezone oficial e politica de horario de verao.
- [x] Definir quais operacoes podem publicar automaticamente e quais exigem aprovacao.

## Fase 1 - Observabilidade operacional

- [x] Criar `OperationDefinition` e cadastro inicial das familias do inventario.
- [x] Criar `OperationRun` com `runId`, heartbeat, contadores, duracao, erro e custo.
- [x] Instrumentar Engagement, Video Engagement e YouTube Analytics.
- [x] Instrumentar Mercado Livre e Q&A; noticias e video de noticias usam eventos e relatorios de conteudo.
- [x] Criar visao agregada em `/api/pipeline/status?view=operations`.
- [x] Criar historico filtravel em `/api/pipeline/status?view=operation-runs`.
- [x] Detectar scheduler sem heartbeat e classificar como `STALE`.
- [x] Ligar o scheduler interno de Video Engagement no `instrumentation.ts`.
- [x] Exibir item mais antigo por fila.
- [x] Adicionar alertas de fila envelhecida, falhas e cron sem heartbeat; alertas de storage e credenciais dependem das credenciais/provedor configurados.

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

- [x] Corrigir o cron social para reservar cada post antes de chamar a rede e evitar concorrencia.
- [x] Fazer o scheduler interno priorizar a URL local do servidor, reduzindo falhas de DNS da propria aplicacao.
- [x] Permitir `Publicar agora` com `bypassTimeCheck` para posts atrasados.
- [x] Consolidar todos os posts sociais em uma consulta com timezone local.
- [x] Criar simulacao de reagendamento antes de aplicar lote via `dryRun` no endpoint de recuperacao.
- [x] Criar botao `Reagendar antigos (nao postados)` com slots futuros de 2 em 2 horas.
- [x] Permitir reagendar por plataforma ou todas as plataformas pelo parametro `platform`.
- [ ] Confirmar no painel a quantidade e os horarios antes de aplicar o lote.
- [ ] Diferenciar falha de credencial, falha temporaria, video em processamento e item invalido.
- [x] Criar politica base de circuit breaker por provedor e registro de falhas consecutivas.
- [x] Criar auditoria de acoes manuais de fila social.

## Fase 4 - Metricas de conteudo e blog

- [x] Padronizar eventos: `page_view`, `article_view`, `video_view`, `affiliate_click`, `lead_created`, `sale_attributed`.
- [ ] Garantir IDs de campanha e UTMs em todos os links sociais e afiliados.
- [x] Criar relatorio diario de artigos, videos, posts, cliques, visitas, leads e vendas.
- [ ] Integrar Search Console para impressao, clique, CTR, posicao e consulta.
- [ ] Separar metricas observadas de metricas estimadas.
- [ ] Criar retencao de dados e politica de privacidade/consentimento.

## Fase 5 - SEO e agentes de marketing

- [x] Criar catalogo canonico de produtos e base de associacao com oportunidades e briefs SEO.
- [ ] Criar coletor de termos por produto e regiao.
- [ ] Usar Trends para tendencia relativa e Keyword Planner/Search Console para validar demanda; guardar data e fonte.
- [x] Criar score de oportunidade: demanda, tendencia, concorrencia, relevancia e capacidade de conversao.
- [x] Gerar tres briefs por produto: dor, produto e comparativo.
- [ ] Criar agentes separados para pesquisa, estrategia, redacao, SEO, revisao e analise.
- [x] Adicionar validacao de liberacao SEO para produto, preco, links, palavra-chave, intencao e fontes; claims e duplicidade permanecem como revisao editorial.
- [ ] Publicar artigos com links internos para produto, video e comparativos.
- [ ] Medir cada cluster apos 7, 14 e 28 dias.

## Fase 6 - Custos, confiabilidade e escala

- [x] Registrar estrutura de custo por ativo, provedor e operacao.
- [ ] Criar limites diarios por agente, pipeline e provedor.
- [x] Criar circuit breaker para provedor indisponivel.
- [ ] Criar fila de prioridade e capacidade por worker.
- [ ] Criar testes de idempotencia para cada etapa.
- [ ] Criar testes de contrato para Meta, YouTube, storage e workers.
- [ ] Criar relatorio de desperdicio: video gerado sem publicacao, artigo sem visita e custo sem conversao.

## Incidente YouTube - invalid_grant

- [x] Exibir mensagem operacional clara quando o refresh token do YouTube for expirado ou revogado.
- [x] Reautenticar a conta YouTube no Hub de Integracoes.
- [ ] Testar `/api/integrations/youtube/status?check=1` antes de recuperar a fila.
- [ ] Confirmar Client ID, Client Secret e Redirect URI no Google Cloud Console.
- [ ] Confirmar que a tela OAuth nao esta em modo de teste quando a conta for usada continuamente.

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
- [x] Artigo consulta os `SocialPost` vinculados e mostra o vídeo gerado e URLs publicadas.
- [x] Canonical, sitemap, robots e schema `NewsArticle`/`VideoObject` adicionados.
- [x] Notícias automatizadas nascem publicadas e a tela de Posts possui `Publicar todos` para recuperar rascunhos antigos.
- [ ] SEO editorial com pesquisa de intenção, palavras-chave e revisão factual.
