# Diagnostico dos videos longos

Data da analise: 04/08/2026

Escopo:

- modulo atual de videos educacionais em `/admin/videos-longos`;
- proposta independente de resumo diario de noticias em formato horizontal, com 3 a 5 minutos;
- qualidade visual do Remotion, tempo de render e uniao dos arquivos.

## Resumo executivo

Gerar um video longo nao e inviavel nem exige gerar imagens por IA. O projeto ja possui uma base funcional importante: roteiro, TTS, busca de videos Pexels, Remotion 16:9, render externo, armazenamento, retomada por partes e fila do YouTube. O problema atual e que essa base ainda funciona como uma ampliacao do gerador de videos curtos, nao como uma linguagem visual propria para videos longos.

As maiores limitacoes encontradas sao:

1. O servico de render usa um bloqueio global e executa somente um render ou uma uniao por vez.
2. As partes de um video longo sao processadas sequencialmente no Next.js.
3. O plano visual nasce antes da duracao real do audio. A timeline e fixada em 600 segundos e pode nao acompanhar exatamente o TTS.
4. O video educacional usa a composicao generica `VideoLandscape`, com cards originalmente criados para videos curtos. A composicao `LongFormMarketingLandscape`, prevista na especificacao, ainda nao existe.
5. Sao buscados no maximo 12 videos Pexels, mas o plano pode ter aproximadamente 40 cenas. A midia e reutilizada e aparece apenas em uma parcela das cenas; o restante e composto principalmente por cards de texto.
6. O fluxo segmentado desativa transcricao e nao gera uma legenda final nova. A interface sugere audio, legendas e render, mas o caminho longo retorna principalmente o MP4.
7. A acao de processamento completo aprova planejamento e versao final automaticamente. Isso reduz a seguranca da revisao editorial prevista para o produto.

Conclusao: Remotion nao e o problema central. Ele e um renderizador deterministico e pode produzir um resultado profissional. A qualidade limitada vem do contrato de cenas, dos templates, da selecao/repeticao de assets, da falta de sincronizacao pelo audio real e do pipeline serial.

## Situacao atual dos videos educacionais

### O que ja funciona

| Capacidade | Situacao |
| --- | --- |
| Projeto e historico | Usa `CodeVideoProject`, etapas e eventos de pipeline |
| Formato | Horizontal 1920x1080, 30 fps |
| Duracao | Alvo fixo de 600 segundos |
| Roteiro | Gerado em blocos, com 1.550 a 1.700 palavras |
| Plano visual | Aproximadamente 24 a 48 cenas, com briefings gerados por IA |
| Midia gratuita | Busca videos horizontais no Pexels |
| Voz | TTS em portugues, dividido por parte |
| Resiliencia | Reaproveita audio e MP4 de partes concluidas |
| Render | Servico separado com Remotion e Chromium |
| Uniao | FFmpeg tenta concatenacao sem recodificar e possui fallback com recodificacao |
| Publicacao | Cria item na fila do YouTube depois da aprovacao final |

### Como o fluxo roda hoje

```text
briefing
  -> roteiro de 1.550-1.700 palavras
  -> briefings visuais
  -> ate 12 buscas Pexels
  -> timeline fixa de 600 segundos
  -> grupos de 55-75 segundos
  -> TTS da parte 1
  -> render da parte 1
  -> TTS da parte 2
  -> render da parte 2
  -> ...
  -> download sequencial de todas as partes
  -> FFmpeg concat
  -> upload do MP4 final
  -> fila do YouTube
```

### Por que a imagem parece incoerente

O problema nao e a IA nao conseguir "manipular" uma imagem. Na implementacao atual ela escolhe um tipo de card e escreve titulo e itens para cada trecho. Ela nao dirige uma sequencia audiovisual completa, nao acompanha um personagem e nao entende visualmente o resultado renderizado.

A busca Pexels recebe poucas consultas amplas. Depois, os assets encontrados sao distribuidos de forma circular pelas cenas. Uma cena usa video externo quando a IA pede `MEDIA` ou, como fallback, aproximadamente a cada seis cenas. Isso gera tres efeitos:

- muita tela de texto para um video de dez minutos;
- b-roll semanticamente generico;
- repeticao de videos sem continuidade editorial.

Para aulas, a coerencia deve vir de capitulos, exemplos e linguagem visual consistente, nao de tentar gerar uma imagem diferente para cada frase. O formato profissional recomendado e hibrido: b-roll, demonstracoes de tela, diagramas, cards curtos e transicoes de capitulo.

### Gargalos de tempo

#### 1. Fila global do render

`render-service/src/server.ts` mantem uma unica `renderQueue`. Tanto `/render` quanto `/concat` usam o mesmo bloqueio. Enquanto uma parte renderiza, nenhuma outra parte nem outra uniao pode rodar no mesmo processo.

Esse bloqueio protege memoria e CPU, mas elimina paralelismo. Mesmo que o Next.js passe a disparar tres partes juntas, o servico atual as colocara em fila.

#### 2. Pipeline sequencial

`renderLongFormInSegments` usa um `for` com `await`. Cada parte espera audio e render completos antes de iniciar a seguinte. Em um video de 600 segundos, isso normalmente cria de 8 a 11 ciclos completos.

#### 3. Render quadro a quadro

Remotion precisa decodificar as midias, montar os frames e codificar H.264. Essa e, em geral, a etapa mais pesada. A chamada atual nao configura explicitamente a concorrencia interna do `renderMedia`, portanto o desempenho depende do padrao do ambiente.

#### 4. Uniao

A uniao nao deveria ser o maior custo quando todos os segmentos possuem o mesmo codec, resolucao, fps e audio: o codigo tenta `ffmpeg -c copy`. Porem, hoje ela:

- baixa todos os segmentos em serie;
- segura a fila global durante download, concat e upload;
- recodifica o video inteiro caso o `copy` falhe.

No fallback, a demora percebida como "unir" e na verdade uma segunda codificacao de todo o conteudo.

#### 5. Assets remotos

Os videos Pexels entram por URL externa na composicao. Sem uma etapa previa de download, validacao e normalizacao, o render depende da rede e de codecs variados. Isso aumenta falhas e torna o tempo menos previsivel.

## E possivel deixar o Remotion profissional?

Sim. O Remotion e adequado para essa funcao. O ganho nao viria principalmente de trocar o modelo de texto, mas de criar uma composicao exclusiva e regras de direcao de arte que a IA apenas preenche.

### Evolucao recomendada para educacionais

1. Criar `LongFormEducationLandscape`, sem alterar as composicoes curtas existentes.
2. Gerar primeiro o roteiro e o audio por capitulos; medir cada audio com `ffprobe`; somente depois construir a timeline visual.
3. Criar componentes proprios: abertura, titulo de capitulo, b-roll, demonstracao de tela, diagrama, comparacao, checklist, destaque numerico, barra de progresso e end card.
4. Limitar texto visivel a ideias curtas. O texto da tela complementa a narracao e nao repete o paragrafo falado.
5. Trocar video ou composicao visual a cada 4 a 8 segundos, com ritmo mais rapido no gancho e mais calmo nas explicacoes.
6. Buscar assets por capitulo e por conceito concreto, com alternativas, em vez de distribuir uma pequena lista circularmente.
7. Baixar os assets aprovados para o armazenamento proprio e normalizar previamente para 1080p, 30 fps, H.264/AAC.
8. Permitir uploads de gravacoes de tela e exemplos reais. Para conteudo educacional, isso agrega mais valor do que imagens sinteticas.
9. Criar uma previa em 720p antes do render final em 1080p.
10. Manter revisao humana real de roteiro, plano visual e preview. O endpoint de processamento nao deve marcar `planningApproved` e `finalApproved` automaticamente.

Legendas queimadas na imagem sao opcionais em videos horizontais. Ainda e recomendavel gerar um arquivo de legenda para acessibilidade, busca e correcao no YouTube, mesmo que ele nao apareca visualmente no MP4.

## Resumo diario de noticias, 3 a 5 minutos

Esse fluxo deve ser independente dos videos educacionais. Ele pode reutilizar coleta, posts, TTS, Pexels, armazenamento, Remotion e YouTube, mas precisa de um tipo de projeto e uma tela proprios.

Usar 100% de videos gratuitos com narracao e tecnicamente viavel e reduz muito a dificuldade de coerencia. A coerencia passa a ser editorial: cada clipe precisa representar o assunto narrado sem fingir ser uma imagem real do acontecimento.

### Formato recomendado para o piloto

- 5 a 8 noticias do dia;
- 30 a 45 segundos por noticia;
- 450 a 750 palavras no total, ajustadas pela velocidade real da voz;
- abertura de 5 a 8 segundos;
- videos Pexels de 4 a 8 segundos;
- identificacao curta da editoria/noticia, sem legenda palavra por palavra;
- encerramento de 8 a 12 segundos;
- horizontal 1920x1080;
- publicacao inicial privada ou nao listada para revisao.

### Pipeline proposto

```text
noticias publicadas no dia
  -> deduplicacao por acontecimento
  -> selecao editorial de 5-8 itens
  -> roteiro original com fonte por bloco
  -> revisao humana
  -> um audio continuo ou audio por noticia
  -> medicao da duracao real
  -> 2-3 consultas Pexels por noticia
  -> download, licenca e normalizacao dos clipes
  -> timeline Remotion dominada por b-roll
  -> preview 720p
  -> aprovacao
  -> render 1080p
  -> upload para YouTube
```

### Composicao visual sugerida

O boletim nao precisa de cards complexos. Uma composicao `DailyNewsLandscape` pode conter:

- abertura curta com data;
- b-roll em tela cheia;
- tarja discreta com categoria e titulo resumido;
- transicao curta entre noticias;
- indicacao visual quando a imagem for apenas ilustrativa;
- logo discreto;
- tela final.

Nao e recomendavel usar imagens ou videos retirados automaticamente dos portais de noticia. Pexels pode fornecer apoio ilustrativo, mas a URL, o autor/plataforma e a regra de uso devem ficar registrados. Em noticias de crimes, politica, saude, desastres e pessoas reais, um b-roll generico nao pode ser montado de forma que pareca prova do fato narrado.

### O que ja existe e pode ser reaproveitado

- noticias e categorias no modelo `Post`;
- criacao dos videos curtos de noticia;
- integracao Pexels para videos horizontais;
- TTS;
- render-service e armazenamento;
- fila e publicacao no YouTube;
- analytics do canal e das noticias;
- especificacao inicial em `docs/specs/daily-news-video/README.md`.

### O que ainda nao existe

- modelo/estado de uma edicao diaria;
- selecao e ordenacao das noticias da edicao;
- rastreabilidade de fontes e assets por bloco;
- roteiro agregado do dia;
- composicao `DailyNewsLandscape`;
- preview e aprovacao da edicao;
- idempotencia especifica para impedir dois resumos da mesma data;
- tela administrativa do resumo diario;
- rotina de horario de corte e agendamento.

## Melhorias de performance prioritarias

### Prioridade 0: medir antes e depois

Registrar por projeto e por segmento:

- espera na fila;
- tempo de TTS;
- download e normalizacao dos assets;
- bundle Remotion;
- render;
- download das partes;
- concat com `copy` ou fallback;
- upload;
- tamanho e duracao dos arquivos.

Sem essa telemetria, "unir demorou" pode esconder download lento ou recodificacao.

### Prioridade 1: evitar recodificacao no concat

- normalizar todos os segmentos com o mesmo perfil H.264, pixel format, fps, resolucao, audio AAC, sample rate e canais;
- validar compatibilidade com `ffprobe` antes do concat;
- registrar claramente quando houve `copy` ou fallback;
- baixar segmentos com concorrencia limitada, por exemplo 3 por vez;
- nao manter o bloqueio de render ocupado durante downloads que nao usam Chromium.

### Prioridade 2: paralelismo controlado

- separar filas de `render`, `audio` e `concat`;
- permitir no maximo 2 renders simultaneos apenas se CPU e memoria do servidor suportarem;
- gerar audios de capitulos em paralelo com limite pequeno;
- processar segmentos independentes com concorrencia 2, mantendo retomada e idempotencia;
- configurar e testar a concorrencia interna do Remotion em vez de depender do padrao.

Mais paralelismo sem limite pode deixar cada render mais lento ou derrubar o servidor. O limite deve ser baseado em CPU, RAM e medicao real.

### Prioridade 3: reduzir trabalho desperdicado

- preview em 720p e render 1080p apenas apos aprovacao;
- cache do bundle Remotion ja existe e deve ser preservado;
- cache de assets normalizados por URL/hash;
- nao refazer partes concluidas quando roteiro, audio e asset da parte nao mudaram;
- hash de entrada por segmento para invalidar somente o que foi editado.

## Plano recomendado

### Etapa 1 - estabilizacao do educacional

- adicionar telemetria de tempos;
- corrigir aprovacao automatica;
- medir audio real antes da timeline;
- prebaixar e normalizar Pexels;
- tornar concat observavel e previsivel;
- criar preview 720p.

### Etapa 2 - piloto do resumo diario

- criar projeto independente `DAILY_NEWS`;
- selecionar noticias ja publicadas no dia;
- gerar roteiro de 3 a 5 minutos com fontes preservadas;
- usar somente Pexels + narracao + tarjas curtas;
- criar `DailyNewsLandscape`;
- publicar inicialmente como privado/nao listado;
- avaliar cinco edicoes antes de automatizar o agendamento.

### Etapa 3 - linguagem profissional dos educacionais

- criar composicao exclusiva;
- introduzir capitulos, demos, diagramas, progresso e end card;
- melhorar busca e aprovacao de assets por cena;
- adicionar editor/regeneracao por capitulo;
- renderizar cinco temas de referencia e comparar retencao e tempo de producao.

### Etapa 4 - capacidade e escala

- filas separadas;
- concorrencia controlada;
- workers de render escalaveis, se as metricas justificarem;
- alertas de fila, falha e custo;
- automacao do resumo diario somente depois de qualidade editorial consistente.

## Decisao recomendada

O melhor primeiro experimento e o resumo diario de 3 a 5 minutos com videos Pexels, narracao e identidade visual leve. Ele e menos complexo, aproveita o crescimento atual do canal e permite validar retencao sem investir primeiro em uma biblioteca educacional completa.

Em paralelo, o educacional deve ser corrigido na fundacao antes de receber mais templates: duracao baseada no audio real, assets normalizados, preview, revisao verdadeira e render observavel. Depois disso, profissionalizar o Remotion vira um trabalho de design e componentes previsivel, nao uma tentativa de fazer a IA improvisar toda a edicao.

## Referencias no codigo

- `app/api/videos-longos/[id]/plan/route.ts`: roteiro, briefings, Pexels e timeline de 600 segundos.
- `app/api/videos-longos/[id]/process/route.ts`: aprovacao automatica e chamada do render.
- `app/api/video-code/render/route.ts`: segmentos sequenciais, retomada e concat.
- `lib/longFormVisualScenes.ts`: distribuicao de cenas, cards e assets.
- `lib/longFormMarketing.ts`: duracao, Pexels, thumbnail e fila do YouTube.
- `remotion/root.tsx`: composicoes genericas atualmente disponiveis.
- `remotion/video-from-spec.tsx`: sequenciamento das cenas e audio.
- `render-service/src/server.ts`: bloqueio global, Remotion, FFmpeg e upload.
- `docs/specs/daily-news-video/README.md`: especificacao do resumo diario ainda nao implementada.
