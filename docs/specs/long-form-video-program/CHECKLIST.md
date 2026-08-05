# Checklist de implementacao - Programa de Videos Longos

Versao: 1.0

Data: 04/08/2026

Spec principal: `docs/specs/long-form-video-program/README.md`

Regra de uso: marcar um item somente depois de codigo, teste e verificacao. Itens identificados como `GATE` bloqueiam a fase seguinte.

## Preparacao

- [x] Ler a spec principal e o diagnostico tecnico.
- [x] Confirmar que o trabalho sera dividido em PRs ou commits por fase.
- [x] Confirmar que `Fase 0`, `Fase 1` e `Fase 2` serao concluidas antes de iniciar entregas novas do educacional.
- [ ] Registrar o estado atual das migrations do Prisma.
- [ ] Confirmar ambientes de desenvolvimento, homologacao e producao.
- [ ] Confirmar acesso ao render-service, storage, Pexels e YouTube de homologacao.
- [ ] Criar fixtures de noticia de 3 e 5 minutos.
- [ ] Criar fixture educacional de 6 minutos.
- [ ] Registrar hashes ou IDs dos projetos usados no benchmark.
- [ ] Criar planilha ou tabela de benchmark com etapa, inicio, fim, duracao, CPU, RAM, tamanho e resultado.

## Fase 0 - Baseline, seguranca e observabilidade

Objetivo: medir o fluxo atual e impedir aprovacoes involuntarias antes de desenvolver o produto novo.

### 0.1 Aprovacoes

- [x] Localizar todos os pontos que alteram `planningApproved`.
- [x] Localizar todos os pontos que alteram `finalApproved`.
- [x] Remover a aprovacao automatica de `/api/videos-longos/[id]/process`.
- [x] Criar endpoint explicito para aprovacao do planejamento.
- [x] Criar endpoint explicito para aprovacao final.
- [x] Registrar data e usuario das aprovacoes.
- [x] Bloquear render final sem aprovacao do planejamento.
- [x] Bloquear agendamento sem aprovacao final.
- [ ] Adicionar teste de transicao invalida.
- [ ] Adicionar teste garantindo que `process` nao aprova automaticamente.

### 0.2 Telemetria

- [ ] Padronizar nomes das etapas do pipeline.
- [ ] Registrar `startedAt`, `finishedAt` e `durationMs` em todas as etapas longas.
- [ ] Registrar tempo de espera na fila.
- [ ] Registrar tempo de TTS por parte.
- [ ] Registrar tempo de download de asset.
- [ ] Registrar tempo de bundle Remotion.
- [ ] Registrar tempo de render Remotion.
- [ ] Registrar tempo de download dos segmentos.
- [ ] Registrar tempo do FFmpeg concat.
- [ ] Registrar se concat usou `copy` ou `reencode`.
- [ ] Registrar tempo de upload do artefato.
- [ ] Sanitizar URLs assinadas, tokens e credenciais nos logs.
- [ ] Exibir os tempos na tela de detalhes de `/admin/videos-longos`.

Observacao desta entrega:

- [x] O logger de `CodeVideoPipelineStep` passou a calcular `durationMs` automaticamente quando `startedAt` e `finishedAt` estiverem presentes.
- [x] As etapas `LONG_FORM_APPROVE_PLANNING`, `LONG_FORM_APPROVE_FINAL` e `LONG_FORM_SCHEDULE_YOUTUBE` passaram a gerar trilha de pipeline propria.

### 0.3 Benchmark atual

- [ ] Renderizar a fixture educacional atual sem alterar concorrencia.
- [ ] Registrar quantidade e duracao dos segmentos.
- [ ] Registrar tempo total.
- [ ] Registrar CPU e pico de memoria.
- [ ] Registrar se houve recodificacao no concat.
- [ ] Repetir o mesmo job para validar reaproveitamento.
- [ ] Confirmar que partes concluidas nao foram renderizadas novamente.
- [ ] Guardar os resultados como baseline versionado.

### 0.4 Protecao de regressao

- [ ] Criar teste smoke para video curto vertical.
- [ ] Criar teste smoke para noticia curta.
- [ ] Criar teste smoke para produto/Shopee.
- [x] Confirmar que video longo cria somente fila `YOUTUBE`.
- [ ] Confirmar que noticia longa nao cria fila Meta.
- [x] Rodar `npx tsc --noEmit`.
- [ ] Rodar testes existentes.
- [x] Rodar `npm run build`.

### GATE 0

- [x] Aprovacao automatica removida.
- [ ] Tempos do baseline registrados.
- [ ] Modo do concat visivel.
- [ ] Regressao dos pipelines existentes descartada.
- [ ] Fase 0 aprovada pelo responsavel.

## Fase 1 - Probe, normalizacao e performance

Objetivo: tornar assets e segmentos previsiveis antes do resumo diario.

### 1.1 Probe de midia

- [ ] Criar tipos para resultado de `ffprobe`.
- [ ] Implementar `POST /media/probe` no render-service.
- [ ] Retornar container, codec, pixel format, largura, altura e fps.
- [ ] Retornar codec, sample rate e canais do audio.
- [ ] Retornar duracao e tamanho.
- [ ] Validar timeout e limite de download.
- [ ] Bloquear protocolos e hosts nao permitidos quando aplicavel.
- [ ] Criar testes com MP4 valido, arquivo invalido e timeout.

### 1.2 Normalizacao

- [ ] Implementar `POST /media/normalize`.
- [ ] Definir perfil final 1080p H.264/AAC.
- [ ] Definir perfil de preview 720p H.264/AAC.
- [ ] Aplicar `yuv420p`, 30 fps e `faststart`.
- [ ] Preservar aspect ratio com crop/letterbox definido pela spec.
- [ ] Fazer upload do asset normalizado.
- [ ] Retornar URL estavel e metadados tecnicos.
- [ ] Calcular hash do conteudo.
- [ ] Reutilizar normalizacao existente pelo hash.
- [ ] Testar videos Pexels com codecs diferentes.

### 1.3 Concat previsivel

- [ ] Fazer probe de todos os segmentos antes do concat.
- [ ] Comparar perfil tecnico dos segmentos.
- [ ] Registrar divergencia que impediria `copy`.
- [ ] Baixar ate tres segmentos em paralelo.
- [ ] Remover download do bloqueio de Chromium.
- [ ] Executar `-c copy` quando o perfil for compativel.
- [ ] Registrar `FFMPEG_CONCAT_COPY` em caso de sucesso.
- [ ] Registrar `FFMPEG_CONCAT_REENCODE` no fallback.
- [ ] Registrar motivo do fallback.
- [ ] Validar duracao final contra a soma dos segmentos.
- [ ] Testar concat com 2, 5 e 10 partes.

### 1.4 Filas e concorrencia

- [ ] Separar locks de render e concat.
- [ ] Criar limite configuravel para TTS.
- [ ] Criar limite configuravel para downloads.
- [ ] Criar limite configuravel para normalizacao.
- [ ] Manter render externo em concorrencia 1 inicialmente.
- [ ] Testar concorrencia de render 2 com fixture controlada.
- [ ] Comparar tempo total, CPU, RAM e taxa de erro.
- [ ] Manter concorrencia 1 se o ganho nao compensar.
- [ ] Evitar gravacoes concorrentes inconsistentes em `metadataJson`.

### 1.5 Hash e retomada

- [ ] Definir hash do roteiro.
- [ ] Definir hash do audio por bloco.
- [ ] Definir hash do asset normalizado.
- [ ] Definir hash do videoSpec por segmento.
- [ ] Definir hash da configuracao do render.
- [ ] Reutilizar artefato somente quando o hash corresponder.
- [ ] Invalidar preview depois de alterar roteiro ou asset.
- [ ] Invalidar aprovacao final depois de alterar preview.
- [ ] Testar retomada depois de falha no segmento intermediario.

### 1.6 Preview

- [ ] Adicionar configuracao de 720p ao render-service.
- [ ] Gerar artefato de preview separado do final.
- [ ] Nao substituir `videoUrl` final pelo preview.
- [ ] Adicionar watermark opcional de preview.
- [ ] Exibir preview na tela administrativa.
- [ ] Medir tempo e tamanho do preview.

### GATE 1

- [ ] Assets Pexels normalizados com sucesso.
- [ ] Concat por copy funciona com segmentos normalizados.
- [ ] Download nao bloqueia Chromium.
- [ ] Preview 720p funciona.
- [ ] Retomada por hash funciona.
- [ ] Benchmark novo comparado ao baseline.
- [ ] Fase 1 aprovada pelo responsavel.

## Fase 2 - Resumo diario MVP

Objetivo: produzir cinco boletins privados ou nao listados de 3 a 5 minutos.

### 2.1 Produto e identidade

- [ ] Definir nome do boletim.
- [ ] Definir logo.
- [ ] Definir paleta de cores.
- [ ] Definir fonte licenciada.
- [ ] Definir voz e velocidade.
- [ ] Definir horario de corte.
- [ ] Definir horario de publicacao.
- [ ] Definir categorias permitidas no piloto.
- [ ] Definir responsavel pela aprovacao.
- [ ] Definir comportamento para dias com poucas noticias.

### 2.2 Banco de dados

- [ ] Adicionar `DailyNewsEdition` ao Prisma.
- [ ] Adicionar `DailyNewsEditionItem` ao Prisma.
- [ ] Adicionar `DailyNewsAsset` ao Prisma.
- [ ] Adicionar relacoes com `Post` e `CodeVideoProject`.
- [ ] Adicionar indices e restricao de edicao unica por data/timezone.
- [ ] Criar migration.
- [ ] Revisar SQL gerado.
- [ ] Definir estrategia de rollback.
- [ ] Gerar Prisma Client.
- [ ] Testar migration em banco de desenvolvimento.

### 2.3 Dominio e estados

- [ ] Criar constantes e tipos dos estados.
- [ ] Criar validador central de transicoes.
- [ ] Criar servico de normalizacao da data em `America/Sao_Paulo`.
- [ ] Criar servico de snapshot da noticia.
- [ ] Criar deduplicacao por `postId`.
- [ ] Criar sinalizacao de similaridade por URL e titulo.
- [ ] Criar regra de invalidacao depois de edicao.
- [ ] Criar testes unitarios da maquina de estados.

### 2.4 APIs basicas

- [ ] Implementar `GET /api/resumo-noticias`.
- [ ] Implementar `POST /api/resumo-noticias`.
- [ ] Implementar `GET /api/resumo-noticias/:id`.
- [ ] Implementar `PATCH /api/resumo-noticias/:id`.
- [ ] Validar autenticacao administrativa.
- [ ] Validar estado em toda mutacao.
- [ ] Retornar `409` para transicao invalida.
- [ ] Impedir duas edicoes para a mesma data.

### 2.5 Pauta

- [ ] Consultar posts publicados dentro da janela.
- [ ] Exibir categoria, horario, fonte e URL.
- [ ] Permitir selecionar entre 5 e 8 noticias.
- [ ] Permitir ordenar noticias.
- [ ] Sinalizar fonte ausente.
- [ ] Sinalizar tema sensivel.
- [ ] Salvar snapshot ao confirmar pauta.
- [ ] Impedir alteracao silenciosa do snapshot.

### 2.6 Roteiro

- [ ] Definir schema JSON do roteiro.
- [ ] Gerar tres titulos.
- [ ] Gerar abertura, blocos e encerramento.
- [ ] Limitar roteiro entre 450 e 750 palavras.
- [ ] Vincular cada bloco ao `postId`.
- [ ] Gerar titulo curto de tela.
- [ ] Gerar 2 a 3 buscas Pexels por noticia.
- [ ] Gerar flags de risco.
- [ ] Validar cobertura de todos os itens.
- [ ] Validar ausencia de posts nao selecionados.
- [ ] Permitir editar o roteiro.
- [ ] Implementar aprovacao explicita do roteiro.
- [ ] Registrar aprovador e data.

### 2.7 Audio

- [ ] Gerar narracao continua.
- [ ] Aplicar normalizacao de pronuncia em portugues.
- [ ] Medir duracao com `ffprobe`.
- [ ] Bloquear audio abaixo de 180 segundos.
- [ ] Bloquear audio acima de 330 segundos.
- [ ] Exibir player e duracao no admin.
- [ ] Permitir regenerar apenas o audio.
- [ ] Gerar VTT opcional para o YouTube.

### 2.8 Assets

- [ ] Buscar videos Pexels horizontais.
- [ ] Mostrar alternativas por noticia.
- [ ] Bloquear repeticao do mesmo asset.
- [ ] Permitir aprovar ou substituir asset.
- [ ] Registrar consulta e URL original.
- [ ] Registrar autor, credito e licenca quando disponiveis.
- [ ] Baixar asset aprovado.
- [ ] Normalizar asset.
- [ ] Salvar URL estavel e hash.
- [ ] Marcar asset como ilustrativo quando necessario.
- [ ] Bloquear URLs de portais nao autorizados.

### 2.9 Remotion

- [ ] Criar composicao `DailyNewsLandscape`.
- [ ] Criar `DailyNewsOpening`.
- [ ] Criar `DailyNewsBroll`.
- [ ] Criar `DailyNewsLowerThird`.
- [ ] Criar `DailyNewsTransition`.
- [ ] Criar `DailyNewsSourceLabel`.
- [ ] Criar `DailyNewsClosing`.
- [ ] Criar fallback quando um asset falhar.
- [ ] Garantir troca visual entre 4 e 8 segundos.
- [ ] Garantir safe area.
- [ ] Garantir que nao existe legenda palavra por palavra no MP4.
- [ ] Criar testes visuais de frames conhecidos.

### 2.10 Preview e aprovacao

- [ ] Gerar preview 720p.
- [ ] Exibir roteiro, fontes e assets ao lado do player.
- [ ] Criar checklist editorial na tela.
- [ ] Exigir confirmacao de fontes.
- [ ] Exigir confirmacao de licencas.
- [ ] Exigir confirmacao de titulo e thumbnail.
- [ ] Registrar aprovacao final.
- [ ] Invalidar aprovacao se roteiro ou assets mudarem.

### 2.11 Render e YouTube

- [ ] Gerar MP4 final 1080p.
- [ ] Validar duracao final com tolerancia de 1 segundo.
- [ ] Gerar thumbnail 1280x720.
- [ ] Criar descricao com fontes.
- [ ] Criar chave idempotente de upload.
- [ ] Enviar somente para YouTube.
- [ ] Publicar como privado ou nao listado no piloto.
- [ ] Enviar arquivo de legenda quando disponivel.
- [ ] Salvar ID e URL do YouTube.
- [ ] Testar retry sem duplicar video.
- [ ] Confirmar que nenhuma fila Meta foi criada.

### 2.12 Tela administrativa

- [ ] Criar `/admin/resumo-noticias`.
- [x] Adicionar entrada na navegacao administrativa.
- [x] Criar lista de edicoes e status com tabela paginada.
- [x] Adicionar seletor de itens por pagina com opcoes `10`, `20`, `50` e `100`.
- [x] Exibir total de itens, pagina atual e total de paginas.
- [x] Implementar busca por titulo, data, status ou ID.
- [x] Implementar filtros por status, data, publicacao e aprovacao.
- [x] Adicionar checkbox por linha.
- [x] Adicionar checkbox no cabecalho para selecionar a pagina atual.
- [x] Exibir contador de itens selecionados.
- [x] Criar acoes por linha para abrir, editar e executar a proxima acao valida.
- [x] Criar barra de acoes em lote contextual.
- [ ] Permitir acoes em lote para gerar roteiro.
- [ ] Permitir acoes em lote para gerar audio.
- [ ] Permitir acoes em lote para buscar assets.
- [ ] Permitir acoes em lote para gerar preview.
- [x] Permitir acoes em lote para exportar selecao.
- [ ] Validar transicao e idempotencia em toda acao em lote.
- [ ] Criar tela de detalhes em `/admin/resumo-noticias/:id`.
- [ ] Exibir cabecalho com status, data, duracao e aprovacoes.
- [ ] Exibir cards de resumo com noticias, assets, preview e URL do YouTube.
- [ ] Criar etapa de pauta.
- [ ] Criar etapa de roteiro.
- [ ] Criar etapa de assets.
- [ ] Criar etapa de preview.
- [ ] Criar etapa de publicacao.
- [ ] Criar secao de eventos e erros acionaveis na tela de detalhes.
- [x] Adicionar navegacao clara entre listagem e detalhes.
- [ ] Exibir erros acionaveis.
- [ ] Exibir tempos por etapa.
- [ ] Exibir URL publicada.
- [x] Garantir responsividade.

Observacao desta entrega:

- [x] O padrao inicial de listagem de noticias foi aplicado provisoriamente em `/admin/posts` enquanto a rota dedicada `/admin/resumo-noticias` ainda nao foi aberta no App Router.
- [x] A tela de detalhe operacional da noticia foi enriquecida provisoriamente em `/admin/posts/[id]`, com contexto editorial e vinculos de video.

### 2.13 Cinco pilotos

- [ ] Edicao piloto 1 criada, revisada e publicada privadamente.
- [ ] Edicao piloto 2 criada, revisada e publicada privadamente.
- [ ] Edicao piloto 3 criada, revisada e publicada privadamente.
- [ ] Edicao piloto 4 criada, revisada e publicada privadamente.
- [ ] Edicao piloto 5 criada, revisada e publicada privadamente.
- [ ] Registrar tempo total de cada edicao.
- [ ] Registrar intervencoes manuais.
- [ ] Registrar falhas de asset.
- [ ] Registrar qualidade da voz.
- [ ] Registrar qualidade editorial.
- [ ] Corrigir problemas criticos encontrados.

### GATE 2

- [ ] Cinco edicoes concluidas sem duplicacao.
- [ ] Todas as fontes e licencas rastreaveis.
- [ ] Nenhuma publicacao foi para Meta.
- [ ] Nenhuma edicao publicou sem aprovacao.
- [ ] Qualidade visual aprovada.
- [ ] Tempo e custo considerados aceitaveis.
- [ ] O padrao administrativo de listagem, lote e detalhes foi aprovado.
- [ ] Decisao de continuar registrada.

## Fase 3 - Educacional V2

Objetivo: substituir a linguagem de cards genericos por uma composicao educacional profissional.

Regra de inicio: comecar somente depois da aprovacao do `GATE 2`, exceto ajustes compartilhados estritamente necessarios para o fluxo de noticias.

### 3.1 Workflow

- [ ] Adicionar `workflowStatus` estruturado ao projeto longo.
- [ ] Criar transicoes do fluxo educacional.
- [ ] Separar planejar, aprovar, gerar audio, preview, aprovar final e publicar.
- [ ] Descontinuar o uso operacional do endpoint `/process` automatico.
- [ ] Manter compatibilidade de leitura com projetos antigos.
- [ ] Criar migration se necessaria.
- [ ] Criar testes de transicao e compatibilidade.

### 3.2 Duracao e roteiro

- [ ] Tornar duracao configuravel entre 5 e 8 minutos.
- [ ] Calcular faixa de palavras pela voz escolhida.
- [ ] Gerar estrategia e capitulos separadamente.
- [ ] Gerar roteiro por capitulo.
- [ ] Validar cobertura dos subtitulos.
- [ ] Permitir edicao manual.
- [ ] Aprovar roteiro antes de gerar audio.
- [ ] Gerar audio por capitulo.
- [ ] Medir duracao de cada capitulo.
- [ ] Montar timeline pela duracao real.

### 3.3 Dados e assets

- [ ] Adicionar `CodeVideoAsset` ao Prisma.
- [ ] Criar migration e indices.
- [ ] Gerar consultas por capitulo.
- [ ] Permitir uploads de video, imagem e gravacao de tela.
- [ ] Priorizar gravacao de tela para ferramentas.
- [ ] Baixar e normalizar assets externos.
- [ ] Registrar licenca e credito.
- [ ] Evitar distribuicao circular simples.
- [ ] Evitar asset duplicado em sequencia.
- [ ] Permitir substituir asset sem reescrever o roteiro.

### 3.4 Composicao profissional

- [ ] Criar `LongFormEducationLandscape`.
- [ ] Criar `EducationOpening`.
- [ ] Criar `EducationChapterIntro`.
- [ ] Criar `EducationBroll`.
- [ ] Criar `EducationExplainer`.
- [ ] Criar `EducationDiagram`.
- [ ] Criar `EducationComparison`.
- [ ] Criar `EducationChecklist`.
- [ ] Criar `EducationScreenDemo`.
- [ ] Criar `EducationProgress`.
- [ ] Criar `EducationEndCard`.
- [ ] Carregar fonte da identidade visual no bundle.
- [ ] Definir sistema de espacamento, tipografia e cores.
- [ ] Criar transicoes de capitulo.
- [ ] Criar fallback de midia.
- [ ] Criar testes visuais.

### 3.5 Edicao parcial

- [ ] Definir hash por capitulo.
- [ ] Regenerar somente roteiro do capitulo.
- [ ] Regenerar somente audio do capitulo.
- [ ] Substituir somente assets do capitulo.
- [ ] Renderizar somente segmento invalidado.
- [ ] Reutilizar segmentos validos.
- [ ] Invalidar preview e aprovacao final corretamente.
- [ ] Testar falha e retomada no capitulo intermediario.

### 3.6 Admin

- [ ] Exibir etapas do workflow.
- [ ] Exibir capitulos e cobertura.
- [ ] Exibir roteiro editavel.
- [ ] Exibir duracao estimada e medida.
- [ ] Exibir assets por capitulo.
- [ ] Exibir preview 720p.
- [ ] Exibir aprovacao do planejamento.
- [ ] Exibir aprovacao final.
- [ ] Exibir partes reaproveitadas.
- [ ] Exibir modo e tempo do concat.
- [ ] Exibir fila e URL do YouTube.

### 3.7 Cinco referencias

- [ ] Video educacional 1 concluido e revisado.
- [ ] Video educacional 2 concluido e revisado.
- [ ] Video educacional 3 concluido e revisado.
- [ ] Video educacional 4 concluido e revisado.
- [ ] Video educacional 5 concluido e revisado.
- [ ] Comparar ritmo visual.
- [ ] Comparar tempo de producao.
- [ ] Comparar repeticao de assets.
- [ ] Comparar retencao quando houver dados.
- [ ] Ajustar templates e regras.

### GATE 3

- [ ] Cinco videos educacionais aprovados.
- [ ] Audio e timeline sincronizados.
- [ ] Edicao parcial funciona.
- [ ] Preview evita render final desperdicado.
- [ ] Resultado visual supera a composicao antiga.
- [ ] Nenhuma regressao nos videos curtos.
- [ ] Fase 3 aprovada pelo responsavel.

## Fase 4 - Automacao e escala

Objetivo: automatizar somente o que ficou estavel nos pilotos.

### 4.1 Automacao do resumo

- [ ] Criar rotina diaria com timezone explicito.
- [ ] Criar horario de corte configuravel.
- [ ] Criar rascunho automaticamente.
- [ ] Manter selecao ou aprovacao humana da pauta.
- [ ] Nunca publicar tema sensivel sem revisao.
- [ ] Impedir duas edicoes no mesmo dia.
- [ ] Implementar retry com backoff.
- [ ] Alertar quando nao houver noticias suficientes.
- [ ] Ativar agendamento automatico somente depois da aprovacao final.

### 4.2 Capacidade

- [ ] Revisar benchmark de concorrencia.
- [ ] Definir CPU e RAM minimas por worker.
- [ ] Definir tamanho maximo da fila.
- [ ] Criar health-check de render.
- [ ] Criar alerta de job travado.
- [ ] Criar alerta de recodificacao frequente.
- [ ] Criar alerta de falha no YouTube.
- [ ] Avaliar segundo worker somente se necessario.

### 4.3 Dashboard

- [ ] Mostrar edicoes por status.
- [ ] Mostrar tempo medio por etapa.
- [ ] Mostrar fila atual.
- [ ] Mostrar taxa de falha.
- [ ] Mostrar taxa de concat por copy.
- [ ] Mostrar custo por video quando disponivel.
- [ ] Mostrar publicacoes e URLs.
- [ ] Integrar metricas de visualizacao e retencao do YouTube.
- [ ] Separar metricas de resumo e educacional.

### 4.4 Rollout

- [ ] Ativar flags somente para administradores.
- [ ] Ativar resumo diario sem autoagendamento.
- [ ] Observar por sete dias.
- [ ] Ativar autoagendamento somente de edicoes aprovadas.
- [ ] Observar por mais sete dias.
- [ ] Revisar custos, falhas e desempenho.
- [ ] Documentar rollback.
- [ ] Aprovar expansao de duracao ou volume.

### GATE 4

- [ ] Automacao nao duplica edicoes nem uploads.
- [ ] Alertas funcionam.
- [ ] Dashboard permite operar sem consultar banco.
- [ ] Custos e capacidade estao dentro do limite aprovado.
- [ ] Rollback foi testado.
- [ ] Programa aprovado para operacao recorrente.

## Checklist de cada entrega

Aplicar em toda PR ou conjunto de alteracoes:

- [ ] Escopo da entrega descrito.
- [ ] Arquivos existentes relidos antes da alteracao.
- [ ] Mudancas do usuario preservadas.
- [ ] Migration revisada quando aplicavel.
- [ ] Autorizacao administrativa validada.
- [ ] Transicoes de estado validadas.
- [ ] Idempotencia testada.
- [ ] Logs sanitizados.
- [ ] Erros exibidos de forma acionavel.
- [ ] Testes unitarios adicionados.
- [ ] Testes de integracao adicionados quando aplicavel.
- [ ] `npx tsc --noEmit` executado.
- [ ] Testes relevantes executados.
- [ ] `npm run build` executado.
- [ ] Feature flag e rollback documentados.
- [ ] Spec e checklist atualizadas.

## Registro de decisoes

Preencher durante a execucao:

| Data | Fase | Decisao | Motivo | Responsavel |
| --- | --- | --- | --- | --- |
| 04/08/2026 | Programa | Resumo diario antes do educacional V2 | Menor complexidade e validacao mais rapida no canal | A confirmar |

## Registro dos pilotos

| Piloto | Tipo | Duracao | Tempo total | Concat | Intervencoes | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Resumo diario |  |  |  |  |  |
| 2 | Resumo diario |  |  |  |  |  |
| 3 | Resumo diario |  |  |  |  |  |
| 4 | Resumo diario |  |  |  |  |  |
| 5 | Resumo diario |  |  |  |  |  |
| 1 | Educacional |  |  |  |  |  |
| 2 | Educacional |  |  |  |  |  |
| 3 | Educacional |  |  |  |  |  |
| 4 | Educacional |  |  |  |  |  |
| 5 | Educacional |  |  |  |  |  |
