# Portal de Notícias e Pipeline de Vídeo — Especificação orientada a desenvolvimento

**Data:** 24/07/2026  
**Status:** decisão de variantes confirmada; pronto para implementação.  
**Escopo:** artigos/notícias, geração de vídeo, agendamento social, rastreabilidade no admin e experiência pública do portal.

## 1. Resumo executivo

O comportamento atual **não produz dois vídeos de notícia**. Para cada `Post`, o sistema cria um único projeto de vídeo e, ao concluí-lo, agenda **o mesmo arquivo final** para Instagram, TikTok e YouTube.

O vídeo efetivamente renderizado é o de apresentador: áudio sintetizado a partir do roteiro e uma imagem previamente configurada animada para falar. Embora o projeto guarde a opção de usar Pexels/mídia externa, a rota de renderização de notícias segue o ramo de *talking head*; ela não cria nem agenda hoje um vídeo separado de imagens gratuitas.

Decisão de produto confirmada: produzir **duas variantes independentes** por reportagem. Ambas devem ser agendadas no YouTube, com arquivos, status e métricas próprios. Para Instagram e TikTok, a política inicial será publicar apenas a variante com apresentadora, evitando duplicação até que seja solicitada a distribuição das duas variantes também nessas redes.

## 2. Funcionamento atual, confirmado no código

### 2.1 Criação do texto/artigo

| Etapa | Comportamento atual | Evidência |
| --- | --- | --- |
| Criação do artigo | `POST /api/posts` grava `title`, `summary`, `content`, `slug` e o publica imediatamente (`PUBLISHED`). | `app/api/posts/route.ts` |
| Gatilho de vídeo | Depois de gravar o artigo, o endpoint chama a geração de vídeo em segundo plano; a resposta ao usuário não espera o vídeo. | `app/api/posts/route.ts`, `lib/newsArticleVideoTrigger.ts` |
| Origem alternativa | Um item social também pode virar artigo do site em `POST /api/social/publish-site`. | `app/api/social/publish-site/route.ts` |
| Texto de vídeo | O título, resumo e conteúdo HTML são convertidos em texto-base para um roteiro curto de notícia. | `lib/newsArticleVideo.ts` |

Observação: a análise desta rotina confirmou a criação e publicação do `Post`; o gerador editorial que fornece o conteúdo antes do `POST /api/posts` não está acoplado a esse endpoint. Isso deve ser documentado na interface como “origem do artigo” (manual, coleta, IA ou publicação social), para que a operação seja auditável.

### 2.2 Vídeo e áudio

1. É criado apenas **um** `CodeVideoProject` para o artigo, identificado pelo `postId` dentro de `metadataJson`.
2. A duração vem da configuração do scraper, limitada entre 15 e 60 segundos.
3. A configuração pode marcar `useExternalMedia` conforme Pexels esteja habilitado e o prompt pede imagens/vídeos contextuais.
4. Na renderização de projetos de notícia, porém, o caminho ativo gera áudio por IA, grava o MP3 no MinIO e anima a imagem da criadora com esse áudio.
5. O resultado é um único `videoUrl` final no projeto.

**Conclusão:** a expectativa “um vídeo com imagens gratuitas + áudio IA” **e** “outro vídeo com minha imagem + áudio” não corresponde ao que está em produção. Hoje há apenas o segundo. A opção de mídia externa é uma intenção/configuração ainda não materializada em uma segunda saída de vídeo.

### 2.3 Agendamento/publicação

Quando o `videoUrl` final existe, a reconciliação cria `SocialPost`s ligados tanto ao artigo (`postId`) quanto ao projeto (`codeVideoProjectId`):

| Rede | Registro atual | Arquivo usado |
| --- | --- | --- |
| Instagram | `platform: META`, `postType: REEL` | Mesmo `videoUrl` do projeto |
| TikTok | `platform: TIKTOK`, `postType: REEL` | Mesmo `videoUrl` do projeto |
| YouTube | `platform: YOUTUBE`, `postType: REEL` | Mesmo `videoUrl` do projeto |

O horário de cada item é calculado individualmente por `computeNextSocialQueueTime`. A fila padrão inclui Instagram, TikTok e YouTube mesmo que nenhuma plataforma esteja marcada na configuração; flags extras apenas acrescentam redes, como LinkedIn.

Portanto, a resposta objetiva é: **não, os dois vídeos não são agendados, porque os dois vídeos não existem hoje.** O único vídeo final é agendado nas três redes.

## 3. Problemas de operação encontrados

1. A tabela de `/admin/posts` exibe somente o artigo. O botão “Vídeo” pede geração, mas não mostra o projeto criado, o estado, o MP3, o MP4 nem os três agendamentos.
2. A página já existente `/admin/video-engajamento` possui os dados necessários (etapas, áudio, vídeo e `SocialPost`s), mas não há ligação direta a partir da notícia.
3. A API usada pela tabela de posts retorna apenas o último `SocialPost`, insuficiente para responder “o que foi agendado nesta reportagem?”.
4. A página pública `/noticias` traz todos os artigos publicados de uma vez e apenas os corta visualmente em duas listas. Não há busca, categoria, data/arquivo nem paginação no servidor.
5. O modelo `Post` não possui taxonomia, `publishedAt`, destaque editorial, tempo de leitura ou relação explícita com variantes de vídeo.
6. “Mídia externa/Pexels habilitada” pode induzir a operação a esperar um vídeo de imagens gratuitas que o renderizador não entrega.

## 4. Decisão de produto recomendada

### Opção alternativa — um vídeo editorial final por notícia

Gerar um único vídeo de 20–45 segundos (ou a duração configurada) que tenha:

- abertura com gancho e imagens contextuais licenciadas/permitidas;
- narração por IA;
- apresentadora em *picture-in-picture* no canto inferior direito em momentos relevantes, ou cortes alternados;
- legendas, capa/título e CTA editorial discreto;
- uma exportação final por formato necessário e um único agendamento por rede.

Vantagens: evita conteúdo duplicado no mesmo perfil, reduz custo/tempo de renderização e concentra métricas em uma peça por reportagem.

### Decisão confirmada — duas variantes independentes

Cada notícia produzirá e rastreará variantes explícitas:

| Variante | Conteúdo | Política de publicação |
| --- | --- | --- |
| `BROLL` | imagens/vídeos externos + voz IA | YouTube obrigatório; pode ter horário próprio |
| `PRESENTER` | imagem da criadora animada + voz IA | YouTube obrigatório, Instagram e TikTok na política inicial |
| `EDITORIAL_FINAL` | composição das duas anteriores | não será gerada nesta primeira versão, salvo solicitação futura |

Cada variante precisa de seu próprio status, URL no MinIO e `SocialPost`s. Não se deve deduzir a variante a partir de um único `videoUrl`. O YouTube receberá duas publicações por reportagem: uma `BROLL` e uma `PRESENTER`; a fila deverá garantir horários distintos e títulos/descrições que identifiquem a versão sem parecerem duplicados.

## 5. Especificação do novo portal público

Referência visual adotada: composição editorial do arquivo `opcao-2-magazine.png`, preservando a identidade do Portal IA/Plugando IA.

### 5.1 Home `/noticias`

```text
Cabeçalho: marca | Início | Tecnologia | Inteligência Artificial | Negócios | Cursos | Newsletter
Busca global: [ busque notícias...                                  ] [ Buscar ]

Hero editorial: [ matéria em destaque, imagem, resumo, data ] [ duas notícias secundárias ]
Navegação por categoria: Todas | Tecnologia | IA | Negócios | Mercado | Educação | ...
Feed cronológico: Hoje / Ontem / datas anteriores
Grade de cards: capa, categoria, título, resumo curto, data, tempo de leitura
Paginação: Anterior | 1 2 3 ... N | Próxima
```

### 5.2 Requisitos funcionais

- Busca por título, resumo e conteúdo, com termo preservado na URL: `?q=...`.
- Filtro por uma ou mais categorias: `?categoria=tecnologia`.
- Filtro por período: `?de=YYYY-MM-DD&ate=YYYY-MM-DD`; exibir grupos “Hoje”, “Ontem” e mês/ano para o restante.
- Paginação no servidor; padrão de 12 itens, com total, página atual e URLs indexáveis.
- Uma matéria marcada como destaque (`featured`) e duas secundárias; se não houver marcação, usar as mais recentes.
- Estado vazio, resultados de busca, paginação acessível e carregamento responsivo.
- Página da matéria com categoria, data de publicação, tempo de leitura, capa, vídeo final quando disponível e artigos relacionados por categoria.
- SEO: título/meta description por artigo, `Article` JSON-LD, canonical, Open Graph e sitemap alimentados por `publishedAt`.

### 5.3 Direção visual

- Fundo claro, tipografia editorial serifada somente nos títulos de destaque e sans-serif legível no corpo.
- Cor de acento vermelha ou a cor oficial da marca, aplicada em categorias, linha ativa e CTAs; não copiar logo, textos ou imagens de terceiros da referência.
- Cards com fotos/capas de proporção consistente, contraste alto e data/tempo de leitura discretos.
- O admin continua operacional; o novo layout é da área pública, não uma reestilização cosmética da tabela interna.

## 6. Modelo de dados proposto

### 6.1 Artigos e categorias

```prisma
model NewsCategory {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  color       String?
  sortOrder   Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  posts       PostNewsCategory[]
}

model PostNewsCategory {
  postId     String
  categoryId String
  post       Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   NewsCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  @@id([postId, categoryId])
  @@index([categoryId, postId])
}
```

Adicionar a `Post`: `publishedAt DateTime?`, `featured Boolean @default(false)`, `readTimeMinutes Int?`, `seoTitle String?`, `metaDescription String?`, `origin` (enum ou texto controlado) e relação `categories PostNewsCategory[]`.

Relação muitos-para-muitos é preferível: uma matéria pode pertencer a “Tecnologia” e “Inteligência Artificial”, sem duplicação.

### 6.2 Rastreabilidade de vídeo

Mínimo viável: manter a relação atual pelo `metadataJson`, mas criar uma leitura de API que sempre devolva o projeto do `Post` e todos os seus `SocialPost`s.

Evolução recomendada: adicionar `postId String?` diretamente em `CodeVideoProject`, com relação Prisma e índice. Isso elimina a busca frágil por texto dentro de JSON e torna a navegação direta, auditável e performática.

Se a alternativa de duas variantes for aprovada, acrescentar `NewsVideoAsset` com `postId`, `projectId`, `variant`, `audioUrl`, `videoUrl`, `status`, `durationSec`, erro e timestamps. `SocialPost` aponta para o ativo/variante exato que publicou.

## 7. Experiência administrativa proposta

### 7.1 Nova tela/detalhe de notícia

Manter `/admin/posts` como lista de gestão, mas substituir a ação opaca “Vídeo” por “Abrir operação”. O painel lateral ou rota `/admin/posts/[id]` deve conter:

| Bloco | Informação e ação |
| --- | --- |
| Artigo | título, status, origem, categorias, publicação, capa e link público |
| Pipeline | projeto de vídeo, etapa atual, tentativa, erro e botão “abrir pipeline” |
| Artefatos | roteiro, áudio no MinIO, vídeo final e player/abrir arquivo |
| Agendamentos | uma linha por rede: plataforma, variante, status, data/hora, URL da publicação e botão “abrir fila” |
| Auditoria | eventos do pipeline e histórico de reprocessamento |

Links necessários:

- “Abrir pipeline” → `/admin/video-engajamento?postId=<id>` (a página deve aceitar esse filtro).
- “Abrir agendamento” → `/admin/social?postId=<id>` (a fila deve aceitar esse filtro).
- “Abrir vídeo” → URL segura do MinIO/player, sem expor credenciais.

### 7.2 Indicadores na tabela

Adicionar colunas compactas: `Categoria`, `Vídeo` (não iniciado/processando/pronto/falhou), `Agendamentos` (ex.: `3/3`), `Próximo horário` e uma ação única “Detalhes”. A lista deve usar busca, filtros de período/categoria/status e paginação também no admin.

## 8. Contratos de API propostos

| Endpoint | Responsabilidade |
| --- | --- |
| `GET /api/admin/posts` | lista paginada com busca/filtros, categorias, resumo de vídeo e contagem de agendamentos |
| `GET /api/admin/posts/:id/operation` | artigo + projetos + artefatos + todos os `SocialPost`s + eventos |
| `PATCH /api/admin/posts/:id` | categorias, data de publicação, destaque, metadados editoriais |
| `GET /api/noticias` | feed público paginado, filtros e dados mínimos de cards |
| `GET /api/noticias/:slug` | matéria pública, categorias, vídeo editorial e relacionados |

Todos os retornos de operação devem trazer identificadores estáveis, URLs públicas quando existirem, status normalizados e timestamps em UTC; a interface converte para `America/Sao_Paulo`.

## 9. Critérios de aceite

### Diagnóstico e rastreabilidade

- [ ] Para qualquer reportagem, o admin mostra se há 0, 1 ou mais projetos de vídeo.
- [ ] O admin mostra todos os arquivos gerados e permite abrir o vídeo final.
- [ ] O admin mostra os três agendamentos vinculados, inclusive status, horário e URL publicada.
- [ ] Um artigo sem vídeo ou com erro possui causa e ação de reprocessamento visíveis.
- [ ] A ligação deixa de depender somente de busca textual em `metadataJson`.

### Vídeo

- [ ] A política de variantes foi escolhida e registrada na configuração.
- [ ] A variante `BROLL` usa de fato imagens/mídias externas permitidas e áudio IA.
- [ ] A variante `PRESENTER` usa a imagem configurada da criadora e áudio IA.
- [ ] As duas variantes têm arquivo, status e agendamento independentes no YouTube.
- [ ] As duas publicações do YouTube recebem horários distintos e metadados que deixam clara a diferença editorial.
- [ ] Instagram e TikTok recebem somente `PRESENTER`, salvo mudança explícita da política.

### Portal público

- [ ] Categorias são administráveis e uma matéria pode ter mais de uma.
- [ ] Busca, filtro de categoria, período e paginação funcionam juntos e preservam a URL.
- [ ] A home possui destaque, secundárias e feed cronológico responsivo.
- [ ] A página de artigo mostra metadados editoriais e vídeo quando pronto.
- [ ] SEO técnico (metadata, canonical, schema e sitemap) é verificado.

## 10. Plano de implementação em fases

1. **Fundação de dados:** migration de categoria/metadados editoriais; popular categorias iniciais; adicionar relação explícita entre artigo e projeto.
2. **Observabilidade:** endpoint de detalhe operacional e filtros por `postId` nas telas de vídeo e fila social; incorporar links na lista de Posts.
3. **Correção de vídeo:** implementar `BROLL` e `PRESENTER`; testes de render, MinIO e reconciliação de fila. Criar dois agendamentos independentes para o YouTube e um agendamento da variante `PRESENTER` para Instagram e TikTok.
4. **Admin de notícias:** lista paginada/filtros e página lateral/detalhe da reportagem com pipeline e agendas.
5. **Portal público:** novo layout editorial, busca, categorias, datas, cards, paginação e página de artigo.
6. **Qualidade:** testes de API/integração, acessibilidade, responsividade, SEO, monitoramento e dados de demonstração.

## 11. Política de distribuição aprovada

- Gerar duas versões independentes: `BROLL` e `PRESENTER`.
- Agendar **as duas** no YouTube, em horários individuais e sem colisão.
- Agendar inicialmente apenas `PRESENTER` no Instagram e TikTok.
- Exibir a variante em cada linha de agendamento e manter métricas separadas.

Qualquer expansão para publicar `BROLL` no Instagram/TikTok será uma alteração explícita de política, não um efeito colateral do pipeline.
