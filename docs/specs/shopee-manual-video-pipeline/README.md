# SDD — Pipeline de vídeo manual Shopee

Status: requisitos de produto aprovados; pronto para implementação  
Versão: 1.0  
Data: 24/07/2026  
Owner: Produto/Conteúdo + Engenharia

## 1. Decisão de produto

O pipeline de vendas manual passa a ter como entrada obrigatória o vídeo do produto, o link de afiliado, o título e os dados do produto. Ele não busca a Shopee, não baixa mídia da Shopee e não gera link de afiliado.

`AFFILIATE_LINK_READY` e `GENERATE_AFFILIATE_LINK` permanecem apenas no fluxo legado `SCRAPE_SOURCE`, para produtos cuja URL de origem precisa ser convertida em link afiliado. Eles não podem aparecer, ser inferidos ou ser executados para `MANUAL_VIDEO`.

### Resultado esperado

```text
Cadastro manual
  -> roteiro de narração persuasivo
  -> áudio do roteiro
  -> vídeo da pessoa falando (foto + áudio)
  -> composição PiP sobre o vídeo enviado
  -> metadados específicos de TikTok, Instagram e YouTube
  -> agendamento das três publicações
  -> publicação e monitoramento por plataforma
```

### Decisões aprovadas

| Decisão | Definição aprovada |
| --- | --- |
| Destino de TikTok e Instagram | O CTA direciona para o link já configurado na bio de cada perfil. O pipeline não cria nem depende de BioProduct como pré-requisito de publicação. |
| Revisão humana | Não há aprovação manual obrigatória. Depois de gerar os três metadados, o pipeline agenda automaticamente as publicações. A tela continua permitindo auditoria e edição/reagendamento posterior. |
| Duração do vídeo | Alvo de 20–30 segundos. O roteiro deve ser calibrado para essa janela, sem exceder a duração estimada do áudio. |
| Preço e promoção | Só podem ser mencionados quando o operador os informar explicitamente no cadastro. Sem esse dado, a IA não pode inferir ou prometer preço, desconto, frete, estoque ou prazo. |
| Horário de publicação | Cada rede recebe seu próprio próximo horário disponível, calculado pela fila social da respectiva plataforma. |

## 2. Problemas atuais encontrados

| Achado | Impacto | Correção necessária |
| --- | --- | --- |
| A tela mostra as etapas `Scraping` e `Afiliado` para todos os itens. | Confunde o operador e descreve uma ação inexistente no fluxo manual. | Linha do tempo deve depender de `inputMode`. |
| `inferResumeStatus` retorna `AFFILIATE_LINK_READY` quando existe `affiliateUrl`. | “Continuar agora” pode pular áudio, vídeo e merge. | Para `MANUAL_VIDEO`, inferir somente a partir dos artefatos/etapas manuais. |
| A copy atual é tratada como um único campo e depois reutilizada na descrição de todas as redes. | Narração e texto de postagem têm objetivos distintos; YouTube não recebe link/copy próprios. | Separar roteiro de narração de metadados de publicação por plataforma. |
| `StoryAd.description` e `SocialPost.summary` são genéricos. | TikTok, Instagram e YouTube recebem o mesmo texto. | Persistir título/descrição/hashtags/CTA por plataforma. |
| `StoryAd` é chamado de “Story”, mas Instagram é publicado como Reel e TikTok/YouTube como vídeo. | Nome de domínio induz erro operacional. | Manter a tabela por compatibilidade nesta fase, mas trocar rótulos de UI para “Campanha de publicação”. |
| Modal/merge ainda são chamadas longas síncronas. | Um ciclo fica ocupado enquanto a GPU trabalha. | Próxima fase: contrato de jobs assíncronos e polling; não bloquear o cron. |

## 3. Escopo funcional

### Dentro do escopo

- Cadastro de produto com vídeo, link de afiliado, título e dados do produto.
- Roteiro persuasivo de narração em português do Brasil correto, com acentos e cedilha.
- Áudio em MinIO, vídeo falado da persona e composição PiP em MinIO.
- Geração de textos de postagem adequados às três plataformas.
- Agendamento e publicação de TikTok, Instagram Reels e YouTube Shorts.
- Linha do tempo, estados, logs e retomada corretos para o fluxo manual.

### Fora do escopo desta versão

- Busca/scraping/download na Shopee para o modo manual.
- Geração de novo link de afiliado no modo manual.
- Criação de variantes de vídeo por plataforma; o mesmo MP4 vertical será usado nas três redes.
- Jobs assíncronos no Modal/worker. A especificação prepara os estados e dados para isso, mas a implementação depende do contrato de API dos workers.

## 4. Dados de entrada e validação

### Obrigatórios

| Campo | Regra |
| --- | --- |
| Vídeo do produto | MP4/MOV aceito, acessível por URL pública do MinIO após upload. |
| Link de afiliado | URL válida; é o único link de compra usado na campanha. |
| Título | Nome claro do produto; usado em SEO, YouTube e Bio. |
| Dados do produto | Descrição factual que informe características, benefícios e limites conhecidos. |

### Recomendados

| Campo | Uso |
| --- | --- |
| Preço e oferta | Só pode ser mencionado se o operador informar; é dado opcional e potencialmente dinâmico. |
| Principais benefícios | Melhora a qualidade do gancho e da copy sem a IA inventar fatos. |
| Público/dor principal | Direciona a persuasão. |
| Categoria | Ajuda SEO e hashtags. |
| Persona | Escolhe foto e voz previamente cadastradas. |

### Modelo de dados proposto

Adicionar um objeto `productData`/`publicationMetadata` ao item manual (ou tabelas normalizadas) em vez de sobrecarregar `descricao`:

```ts
type ManualProductData = {
  title: string;
  factualDescription: string;
  benefits?: string[];
  painPoints?: string[];
  category?: string;
  priceText?: string;       // opcional e informado pelo operador
  affiliateUrl: string;
};

type PlatformPublicationCopy = {
  platform: "TIKTOK" | "INSTAGRAM" | "YOUTUBE";
  title?: string;           // obrigatório no YouTube
  caption: string;
  hashtags: string[];
  affiliateUrl?: string;   // permitido/obrigatório somente no YouTube
  cta: string;
};
```

## 5. Máquina de estados

### Estados do modo `MANUAL_VIDEO`

| Ordem | Estado | Etapa | Entrada | Saída |
| ---: | --- | --- | --- | --- |
| 1 | `GENERATING_COPY` | `GENERATE_NARRATION_SCRIPT` | dados do produto + link | `narrationScript` |
| 2 | `COPY_READY` | revisão opcional | roteiro | roteiro aprovado/pronto |
| 3 | `GENERATING_AUDIO` | `GENERATE_AUDIO` | roteiro + voz | `audioUrl` no MinIO |
| 4 | `AUDIO_READY` | pronto para avatar | áudio + foto | — |
| 5 | `GENERATING_COPY_VIDEO` | `GENERATE_AVATAR_VIDEO` | foto + áudio | `copyVideoUrl` |
| 6 | `COPY_VIDEO_READY` | pronto para PiP | vídeo original + avatar | — |
| 7 | `MERGING_VIDEOS` | `COMPOSE_PRODUCT_PIP_VIDEO` | ambos os vídeos | `videoFinalUrl` no MinIO |
| 8 | `FINAL_VIDEO_READY` | `GENERATE_PLATFORM_METADATA` | produto + roteiro + link | 3 conjuntos de metadados |
| 9 | `READY_FOR_SCHEDULING` | validação automática | vídeo + metadados | pronto para agendar automaticamente |
| 10 | `SCHEDULED` | `SCHEDULE_PUBLICATIONS` | uma campanha + 3 publicações | TikTok/IG/YT agendados |
| 11 | `PUBLISHING` | `PUBLISH_PLATFORM` | publicação vencida | URL/status da plataforma |
| 12 | `PUBLISHED` | encerramento | 3 publicações concluídas | campanha concluída |

`GENERATING_AFFILIATE_LINK` e `AFFILIATE_LINK_READY` são proibidos nessa máquina de estados.

### Regras de retomada

1. O item manual nunca pode voltar a `PENDING` para tentar scraping.
2. “Continuar agora” deve localizar o primeiro artefato ausente nesta ordem: roteiro, áudio, avatar, vídeo final, metadados, agendamento.
3. A existência de `affiliateUrl` não altera o estado; para o modo manual ele é pré-requisito de entrada, não resultado de etapa.
4. Um item `FAILED` requer ação explícita de reenfileirar e deve informar a etapa que falhou.

## 6. Conteúdo gerado

### 6.1 Roteiro de narração

Objetivo: converter interesse em intenção de compra, sem promessas ou fatos não informados.

Regras obrigatórias:

- português do Brasil natural, com ortografia, acentos e cedilha corretos;
- sem hashtags, Markdown, URL ou título no texto narrado;
- alvo de 20–30 segundos; validar o tamanho do roteiro contra a duração estimada do áudio;
- estrutura: gancho/dor → benefício factual → prova/uso quando informado → CTA;
- CTA falado: “Confira o link na descrição” ou equivalente; nunca ler a URL;
- não mencionar preço, desconto, estoque ou prazo sem dados explícitos;
- salvar a versão usada no áudio como imutável/auditável.

Exemplo de estrutura, não texto fixo:

```text
Se [dor cotidiana] também atrapalha sua rotina, este [produto] pode ajudar.
Ele [benefício factual] e [benefício factual], deixando [resultado prático].
Para quem busca [resultado], vale conhecer. Confira o link na descrição.
```

### 6.2 Metadados de postagem

É necessário separar os metadados por rede. Não é necessário gerar três roteiros ou três vídeos nesta versão: o vídeo e a narração são os mesmos; muda apenas a embalagem editorial.

| Rede | Título | Legenda | Hashtags | Link afiliado | CTA |
| --- | --- | --- | --- | --- | --- |
| TikTok | opcional/interno | curta, benefício + contexto | 3–5 relevantes e específicas | não colocar URL na legenda; usar “link na bio” | “Confira o link na bio” |
| Instagram Reels | opcional/interno | curta ou média, legível e sem bloco excessivo | 3–8 relevantes, sem lista genérica | não é clicável na legenda; usar “link na bio” | salvar/compartilhar + “link na bio” |
| YouTube Shorts | obrigatório, SEO claro | descrição com contexto, CTA e link de afiliado no início | até 3 relevantes | obrigatório no campo de descrição | “Link para comprar na descrição” |

Decisão: gerar três objetos `PlatformPublicationCopy`. Para YouTube, o link de afiliado deve ser incluído no início da descrição. Para TikTok e Instagram, nenhuma URL é colocada na legenda: a copy usa “link na bio” e o destino é o link previamente configurado nos respectivos perfis.

## 7. Vídeo e armazenamento

1. Upload salva o vídeo original em MinIO (`originalVideoUrl`).
2. Áudio de narração salva em MinIO (`audioUrl`).
3. Foto/voz da persona vêm do cadastro ativo ou da persona escolhida no upload.
4. Worker gera o avatar falado (`copyVideoUrl`).
5. Worker faz composição PiP: vídeo do produto como fundo e avatar no canto inferior direito; remove áudio original e preserva apenas a narração.
6. Aplicação salva o MP4 final em MinIO (`videoFinalUrl`).
7. Antes de agendar, validar acesso público, duração, formato vertical e presença de faixa de áudio.

## 8. Publicação e agendamento

### Modelo desejado

- Uma `PublicationCampaign` lógica por produto/vídeo final.
- Três `PlatformPublication`, uma para TikTok, Instagram e YouTube.
- Cada publicação armazena os metadados específicos, horário, status, tentativas, payload e URL publicada.

`StoryAd`/`StoryPublication` podem ser reutilizados temporariamente, mas a UI deve chamar o conjunto de “Campanha de publicação” e “Publicações”, não “Story”.

### Pré-condições de agendamento

- `videoFinalUrl` acessível;
- metadados dos três canais válidos;
- integrações ativas verificadas;
- para YouTube: credenciais válidas e descrição contendo o link de afiliado;
- para TikTok/Instagram: integração válida; se o link não for clicável, CTA coerente com o destino configurado na bio.

Falha de uma plataforma não deve impedir as outras duas. O item principal só fica `PUBLISHED` quando as três forem publicadas; caso contrário fica `PUBLISHING` com status individual visível.

## 9. UX e observabilidade

### Linha do tempo manual

```text
Roteiro -> Áudio -> Avatar falado -> PiP final -> Textos das redes -> Agendamento -> Publicação
```

Não mostrar Scraping, Afiliado ou Bio como etapas obrigatórias do vídeo manual. Bio pode existir como ação opcional de destino do link.

### Tela de detalhes

- Exibir “Modo: vídeo manual” e o link afiliado como dado de entrada.
- Separar cartões: Roteiro narrado, Áudio, Avatar falado, Vídeo final, TikTok, Instagram, YouTube.
- Permitir revisar/editar e regenerar somente os metadados de uma plataforma antes do agendamento.
- Botão “Continuar agora” mostra qual etapa será feita e por quê.
- Mostrar duração, jobId, tentativa e timestamps por etapa.

## 10. Checklist de desenvolvimento

### Fase 0 — Aprovação da especificação

- [x] Confirmado: TikTok e Instagram usam o link já configurado na bio dos perfis; BioProduct não é pré-requisito do fluxo manual.
- [x] Confirmado: horários individuais por plataforma, calculados pela fila social para evitar colisões e respeitar a janela de cada rede.
- [x] Confirmado: vídeos de 20–30 segundos; a IA pode gerar o roteiro sem aprovação manual obrigatória.
- [x] Confirmado: preço/oferta é campo manual opcional e nunca pode ser inferido pela IA.

### Fase 1 — Dados e estados

- [ ] Criar campos/tabelas para roteiro de narração e metadados por plataforma.
- [ ] Adicionar `GENERATE_PLATFORM_METADATA` e `READY_FOR_SCHEDULING` à máquina de estados.
- [ ] Bloquear `GENERATE_AFFILIATE_LINK` e `AFFILIATE_LINK_READY` para `MANUAL_VIDEO`.
- [ ] Corrigir `inferResumeStatus` para respeitar a máquina manual.
- [ ] Migrar itens manuais existentes sem mover registros legados.

### Fase 2 — IA e mídia

- [ ] Atualizar prompt de narração com regra explícita de português correto, acentos e cedilha.
- [ ] Validar retorno sem hashtags/URLs e com CTA falado.
- [ ] Gerar e persistir metadados TikTok/Instagram/YouTube separadamente.
- [ ] Incluir link de afiliado somente na descrição do YouTube.
- [ ] Validar artefatos no MinIO antes de avançar de estado.

### Fase 3 — Publicação

- [ ] Criar/adequar campanha e publicações individuais.
- [ ] Persistir legenda/título/hashtags por plataforma no `SocialPost`.
- [ ] Garantir que o publisher use o conteúdo correspondente à plataforma.
- [ ] Permitir retry individual sem republicar canais já concluídos.

### Fase 4 — UI e operação

- [ ] Trocar linha do tempo pelo fluxo manual quando `inputMode=MANUAL_VIDEO`.
- [ ] Ocultar etapas legadas e renomear “Story” para “Publicações”.
- [ ] Exibir cópias por rede e botão de editar/regenerar.
- [ ] Criar painel de pré-publicação com validação de integração.
- [ ] Exibir motivo de bloqueio, job e próxima execução de cada item.

### Fase 5 — Jobs e confiabilidade

- [ ] Definir contrato assíncrono para Modal e merge (`POST job`, `GET status`).
- [ ] Persistir jobId e polling sem manter request do cron aberto.
- [ ] Liberar processamento de outros itens enquanto a GPU trabalha.
- [ ] Implementar locks distribuídos/idempotência por etapa.
- [ ] Alertar quando cron/job não tiver heartbeat no intervalo esperado.

## 11. Critérios de aceite

1. Um cadastro manual nunca chama o scraper nem a API de geração de link afiliado.
2. O roteiro narrado contém caracteres portugueses corretos e não contém hashtags nem URL lida em voz.
3. Áudio, avatar e MP4 PiP final são gravados e acessíveis no MinIO.
4. TikTok, Instagram e YouTube recebem textos próprios; somente YouTube recebe o link afiliado na descrição.
5. A timeline do item manual não exibe `Scraping` nem `Afiliado`.
6. “Continuar agora” não usa a presença de `affiliateUrl` para pular etapas.
7. Falha do YouTube não impede publicação/retentativa independente de TikTok e Instagram.
8. Após o vídeo final ficar pronto, o pipeline gera e agenda automaticamente os três textos; o operador pode auditá-los ou reagendá-los depois.
9. Com worker assíncrono, uma renderização em andamento não bloqueia o cron de processar outro item elegível.

## 12. Decisões de produto concluídas

Não há decisões de produto pendentes para iniciar a implementação. Eventuais ajustes de copy, duração ou agenda poderão ser tratados como evolução posterior, sem alterar a máquina de estados aprovada.
