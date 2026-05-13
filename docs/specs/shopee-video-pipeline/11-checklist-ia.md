# Checklist para IAs e Devs

## Regra principal

Nao iniciar implementacao sem ler:

- `00-visao-geral.md`
- `01-modelo-dados.md`
- `02-estados-e-transicoes.md`
- `03-orquestrador.md`
- `10-plano-implementacao.md`

## Ja existe no projeto

- [x] Tela administrativa de coleta Shopee.
- [x] Rota de scraping por item.
- [x] Scraping de midias no worker/render-service.
- [x] Upload de midias para MinIO.
- [x] Geracao de titulo/descricao/copy com IA no fluxo existente.
- [x] Integracao Shopee afiliados em `lib/shopee/openApi.ts`.
- [x] Cron geral de automacao.
- [x] Estrutura de publicacoes sociais.
- [x] Processo manual/parcial de criacao/merge de video.
- [x] Workflow ComfyUI de voz em formato API fornecido pelo usuario.
- [x] Workflow visual ComfyUI Infinite Talk fornecido pelo usuario.

## Falta implementar

- [ ] Modelo de logs do pipeline.
- [ ] Modelo de steps do pipeline.
- [ ] Configuracao de timer ativo/inativo.
- [ ] Orquestrador principal.
- [ ] Lock por URL.
- [ ] Retry com `nextRunAt`.
- [ ] Integracao ligar/desligar/online do RunPod.
- [ ] Watchdog para desligar POD ocioso.
- [ ] Cliente ComfyUI para submeter prompts e consultar jobs.
- [ ] Template versionado de audio ComfyUI.
- [ ] Template versionado Infinite Talk em formato API.
- [ ] Geracao de audio na voz.
- [ ] Upload do audio para MinIO.
- [ ] Geracao de video da copy com imagem do usuario.
- [ ] Merge automatico dos videos.
- [ ] Story propaganda.
- [ ] Publicacao social por plataforma.
- [ ] Vitrine/link da bio.
- [ ] Dashboard operacional completo.

## Cuidados obrigatorios

- Nao duplicar videos se uma etapa for executada duas vezes.
- Nao deixar o POD ligado sem job ativo.
- Nao registrar secrets nos logs.
- Nao depender de arquivos locais em `Downloads` para runtime.
- Nao usar o workflow visual Infinite Talk como se fosse prompt API sem converter/exportar.
- Nao sobrescrever artefatos ja gerados sem acao manual.
- Nao processar mais de uma URL por vez no MVP.
- Nao marcar POD offline como falha definitiva.

## Definicao de pronto da Fase 1

- Tabelas criadas.
- Status exibido na tela.
- Timeline por URL visivel.
- Logs gravados e consultaveis.
- Nenhuma chamada nova de POD/audio/video ainda.

## Definicao de pronto da Fase 2

- Orquestrador seleciona uma URL por vez.
- Lock funciona.
- Proxima etapa e detectada corretamente.
- Retry basico funciona.
- Scraping/copy existentes aparecem nos logs.

## Definicao de pronto da Fase 3

- POD e consultado.
- POD e ligado quando necessario.
- Falha ao ligar reagenda para 30 minutos.
- POD ocioso e desligado pelo watchdog.
- Dashboard mostra estado do POD.
