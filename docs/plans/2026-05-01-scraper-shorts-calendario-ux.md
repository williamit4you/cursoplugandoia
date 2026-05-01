# Planejamento - Scraper, Shorts, Calendario e UX Social (2026-05-01)

## Objetivos
- Adicionar auto-publicacao no YouTube Shorts nas configuracoes do scraper.
- Corrigir o problema de shorts muito curtos quando a duracao configurada e maior.
- Permitir geracao de imagem/capa automatica para posts.
- Criar variacoes visuais para shorts de perguntas, com pelo menos 5 temas.
- Exibir um calendario de postagem dos videos.
- Criar uma pagina comercial sobre automacao e agentes de IA.
- Simplificar a tela de fila social para deixar o fluxo claro para o usuario.

---

## Diagnostico Atual
- `ScraperConfig` ainda nao possui `autoPublishYouTube`.
- `worker/scraper.py` publica automaticamente em Meta, TikTok e LinkedIn, mas nao em YouTube.
- O fluxo de perguntas ja possui `autoEnqueueYouTube`, mas a variacao visual ainda parece limitada.
- A duracao configurada do video nao garante, por si so, um roteiro longo o suficiente para gerar um video proximo da meta.
- A fila social atual ja tem estados e filtros, mas o entendimento do fluxo ainda esta confuso na UI.
- O projeto ja possui area publica de noticias, mas ainda nao possui uma landing/page comercial dedicada aos servicos de automacao e IA.

---

## Epic 1 - Auto-publicacao do Scraper no YouTube Shorts
### Backend e dados
- [ ] Adicionar `autoPublishYouTube Boolean @default(false)` em `ScraperConfig` no `prisma/schema.prisma`.
- [ ] Gerar migracao Prisma para persistir o novo campo.
- [ ] Atualizar `POST /api/worker/config` para salvar `autoPublishYouTube`.
- [ ] Atualizar `GET /api/worker/config` para retornar o campo corretamente.

### Worker
- [ ] Atualizar `worker/scraper.py`:
  - incluir `autoPublishYouTube` no `DEFAULT_CONFIG`
  - incluir log dedicado de auto-publicacao YouTube
  - chamar `/api/social/publish-youtube` quando a flag estiver ativa

### UI
- [ ] Atualizar `app/(admin)/admin/scraper-config/page.tsx` para incluir o toggle "YouTube Shorts" na secao de publicacao automatica.
- [ ] Garantir persistencia do toggle apos refresh.

### Aceite
- [ ] Ao gerar um video pelo scraper com YouTube ativo, o item deve seguir automaticamente para publicacao no YouTube.
- [ ] A configuracao precisa permanecer salva apos recarregar a tela.

---

## Epic 2 - Corrigir Duracao Real dos Shorts Gerados pelo Scraper
### Hipotese principal
- O campo `videoDurationSec` esta sendo usado no prompt, mas o resumo/roteiro final pode continuar curto demais para sustentar a locucao esperada.

### Tasks
- [ ] Revisar o prompt de geracao em `worker/scraper.py` e `app/(admin)/admin/scraper-config/page.tsx`.
- [ ] Substituir a logica de resumo generico por uma instrucao proporcional ao tempo alvo.
- [ ] Definir regra aproximada de tamanho minimo do roteiro por duracao:
  - 30s
  - 60s
  - 90s
  - 120s
- [ ] Adicionar log de diagnostico com:
  - duracao alvo
  - tamanho do roteiro em caracteres
  - duracao estimada de locucao
- [ ] Validar se a FastAPI/remocao de cenas nao esta encurtando indevidamente o video depois da geracao do roteiro.

### Aceite
- [ ] Com configuracao em `90s`, o video gerado nao pode continuar com cara de micro-clipe.
- [ ] A duracao final deve ficar proxima da meta configurada, com tolerancia operacional.

---

## Epic 3 - Capa Automatica para Posts Gerados
### Objetivo
- Permitir que posts tenham uma imagem/capa automatica, semelhante ao apelo visual ja usado nos videos.

### Possiveis abordagens
- [ ] Opcao A: reaproveitar geracao de imagem por prompt para criar uma capa com titulo.
- [ ] Opcao B: gerar uma capa tipografica com fundo estilizado e titulo destacado.

### Tasks
- [ ] Definir onde a capa sera criada no fluxo:
  - durante ingest do post
  - ou via endpoint dedicado pos-criacao
- [ ] Atualizar backend para preencher `Post.coverImage`.
- [ ] Criar configuracao opcional no admin para habilitar/desabilitar a geracao de capa.
- [ ] Se necessario, criar endpoint dedicado para gerar/reatualizar capa de um post.
- [ ] Garantir fallback quando a geracao falhar.

### Aceite
- [ ] Posts novos podem nascer com capa automatica.
- [ ] O usuario consegue distinguir claramente titulo, tema e imagem de capa.

---

## Epic 4 - Variacoes Visuais nos Shorts com Perguntas
### Objetivo
- Evitar repeticao visual e reduzir risco de desqualificacao no YouTube por excesso de videos quase identicos.

### Tasks
- [ ] Mapear onde o tema visual e definido no fluxo de videos com perguntas:
  - `worker/questions_daemon.py`
  - `app/api/video-code/generate/route.ts`
  - `remotion/*`
- [ ] Criar sistema de temas visuais persistiveis no projeto de video.
- [ ] Implementar pelo menos 5 temas:
  - amarelo
  - azul
  - verde
  - vermelho
  - escuro/neutro
- [ ] Variar combinacoes de:
  - cor de fundo
  - caixas e destaques
  - tipografia
  - elementos graficos
- [ ] Definir estrategia de escolha:
  - aleatoria com rotacao
  - ou manual/configuravel no admin
- [ ] Garantir que o mesmo tema nao domine quase todos os videos gerados.

### Aceite
- [ ] O lote de shorts gerados deve apresentar diversidade visual perceptivel.
- [ ] Os temas precisam manter legibilidade e padrao profissional.

---

## Epic 5 - Calendario de Postagem
### Objetivo
- Exibir quando cada video esta configurado para ser publicado.

### Dependencia importante
- O campo `scheduledTo` ja existe em `SocialPost`, mas precisamos confirmar onde ele esta sendo populado de fato e como sera editado.

### Tasks
- [ ] Auditar uso atual de `scheduledTo` em:
  - `app/api/social/posts/route.ts`
  - endpoints de enqueue/publicacao
  - tela `app/(admin)/admin/social/page.tsx`
- [ ] Definir regra de negocio:
  - postagem imediata
  - postagem agendada
  - reagendamento
- [ ] Criar visao calendario com filtros por:
  - plataforma
  - status
  - tipo
- [ ] Permitir abrir detalhes do item ao clicar no evento.
- [ ] Exibir status diretamente no calendario, pelo menos por cor ou badge.

### Aceite
- [ ] O usuario consegue saber visualmente o que sera publicado, quando e em qual plataforma.

---

## Epic 6 - Nova Tela Comercial de Automacao e Agentes de IA
### Objetivo
- Criar uma pagina publica voltada a venda/explicacao de servicos, separada da area de noticias.

### Conteudo sugerido
- [ ] Automacao com `n8n`
- [ ] Desenvolvimento de automacoes com codigo
- [ ] Agentes com LLM para atendimento e operacao
- [ ] RAG com base em documentos do cliente
- [ ] Implantacao de Evolution API
- [ ] Integracao e cadastro de WhatsApp

### Tasks
- [ ] Definir rota publica dedicada.
- [ ] Estruturar hero, secoes de servicos, beneficios, prova/credibilidade e CTA.
- [ ] Reaproveitar componentes de landing ja existentes quando fizer sentido.
- [ ] Escrever copy orientada a negocio e resultado para o cliente.
- [ ] Garantir coerencia com a identidade visual atual do site.

### Aceite
- [ ] A pagina comunica com clareza os servicos e como eles ajudam o negocio do cliente.
- [ ] O usuario encontra CTA claro para contato ou diagnostico.

---

## Epic 7 - Simplificacao da Fila Social
### Problema
- A fila atual esta funcional, mas a experiencia esta confusa: o usuario nao sabe facilmente se o item foi so enfileirado, se esta processando ou se ja foi publicado.

### Tasks
- [ ] Redesenhar a tela `app/(admin)/admin/social/page.tsx` para priorizar uma listagem unica.
- [ ] Substituir excesso de informacao inline por um botao de "Ver detalhes".
- [ ] Exibir de forma direta as colunas:
  - criacao
  - plataforma
  - tipo
  - status
  - agendamento
  - publicado em
  - link final
- [ ] Deixar o fluxo autoexplicativo com estados claros:
  - gerado
  - enfileirado
  - aguardando publicacao
  - processando
  - publicado
  - falhou
- [ ] Diferenciar claramente acao de "enviar para fila" vs "publicar agora".
- [ ] Revisar labels dos botoes para evitar ambiguidade entre Story, Reels e YouTube.
- [ ] Adicionar detalhes do log em drawer, modal ou linha expansivel.

### Aceite
- [ ] O usuario entende sem duvida se o conteudo foi apenas para fila ou se ja foi publicado.
- [ ] O status nas diferentes plataformas fica visivel de forma clara.

---

## Ordem Recomendada de Implementacao
1. Epic 1 - Auto-publicacao YouTube no scraper
2. Epic 2 - Correcao da duracao real dos shorts
3. Epic 7 - Simplificacao da fila social
4. Epic 4 - Variacoes visuais nos shorts com perguntas
5. Epic 3 - Capa automatica para posts
6. Epic 5 - Calendario de postagem
7. Epic 6 - Nova tela comercial

---

## Riscos e Dependencias
- [ ] A duracao curta pode nao estar apenas no prompt; pode haver limitacao no pipeline FastAPI/TTS/render.
- [ ] O calendario depende da consolidacao da regra de agendamento no fluxo social.
- [ ] A capa automatica depende da decisao sobre tecnologia de geracao e custo operacional.
- [ ] As variacoes visuais exigem validar onde o template do video de perguntas e montado de fato.

---

## Checklist Executivo
- [ ] Adicionar YouTube Shorts no scraper config
- [ ] Corrigir roteiro/duracao dos shorts do scraper
- [ ] Gerar capa automatica para posts
- [ ] Implementar 5 temas visuais para shorts com perguntas
- [ ] Criar calendario de postagem
- [ ] Criar pagina comercial de automacao e agentes de IA
- [ ] Simplificar fila social com listagem unica e detalhes claros
