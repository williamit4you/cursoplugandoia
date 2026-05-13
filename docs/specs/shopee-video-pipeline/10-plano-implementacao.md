# Plano de Implementacao

## Fase 1 - Fundacao

Objetivo: criar rastreabilidade antes de automatizar mais chamadas.

- [OK] Criar enums de status do pipeline.
- [OK] Criar tabelas de steps, events e configuracao.
- [OK] Criar tela inicial de dashboard/logs.
- [OK] Mostrar timeline por URL.
- [OK] Garantir que nenhuma nova etapa rode sem log.

## Fase 2 - Orquestrador

Objetivo: executar uma URL por vez com lock e proxima etapa.

- [OK] Criar `shopeePipelineOrchestrator`.
- [OK] Criar contrato de step.
- [OK] Implementar lock por URL.
- [OK] Implementar `nextRunAt`.
- [OK] Implementar retry basico.
- [OK] Encapsular scraping existente como step.
- [OK] Encapsular copy existente como step.

## Fase 3 - RunPod

Objetivo: ligar, verificar e desligar POD com seguranca de custo.

- [OK] Criar cliente para API ligar/desligar/online.
- [OK] Implementar step `ensurePodOnline`.
- [OK] Implementar regra de reagendamento +30 minutos.
- [OK] Criar `pod_sessions`.
- [OK] Criar `pod-watchdog`.
- [OK] Adicionar status do POD no dashboard.

## Fase 4 - Audio e video da copy

Objetivo: gerar audio na voz e video com imagem do usuario.

- [OK] Definir contrato da API de voz.
- [OK] Versionar template ComfyUI de audio baseado em `API-VOZ.json`.
- [OK] Exportar/versionar template ComfyUI Infinite Talk em formato API.
- [OK] Criar cliente ComfyUI para `/prompt`, `/history`, upload e download de outputs.
- [OK] Implementar step `generateAudio`.
- [OK] Salvar audio no MinIO.
- [OK] Definir local/configuracao da imagem do usuario.
- [OK] Implementar step `generateCopyVideo`.
- [OK] Salvar video da copy no MinIO.
- [OK] Registrar `prompt_id`, prompt sanitizado, history e outputs nos logs.

## Fase 5 - Merge final

Objetivo: automatizar o processo hoje manual.

- [OK] Mapear fluxo manual atual.
- [OK] Criar step `mergeVideos`.
- [OK] Usar video original Shopee + copy video.
- [OK] Salvar `finalVideoUrl`.
- [OK] Registrar logs de render.

## Fase 6 - Afiliado e story

Objetivo: preparar publicacao.

- [OK] Implementar step `generateAffiliateLink`.
- [OK] Reaproveitar integracao Shopee existente.
- [OK] Criar `story_ads`.
- [OK] Agendar story para 30 minutos apos criacao.
- [OK] Criar `story_publications`.

## Fase 7 - Publicacao social

Objetivo: publicar nas plataformas.

- [OK] Integrar TikTok.
- [OK] Integrar YouTube.
- [OK] Integrar Instagram.
- [OK] Registrar resultado por plataforma.
- [OK] Retry independente por plataforma.

## Fase 8 - Vitrine/link da bio

Objetivo: ter destino publico para o CTA dos videos.

- [OK] Criar `bio_products`.
- [OK] Criar categorias.
- [OK] Criar `/bio`.
- [OK] Criar pagina de produto.
- [OK] Criar busca.
- [OK] Registrar cliques.
