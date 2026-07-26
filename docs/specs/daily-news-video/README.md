# Boletim Diário de Notícias para YouTube — especificação de produto e implementação

**Status:** proposta; nenhuma automação, publicação ou alteração de produto foi feita por este documento.  
**Objetivo:** gerar uma edição diária horizontal (16:9), com até 10 minutos, que informe com precisão as principais notícias do dia e seja preparada para publicação no YouTube.

## 1. Decisão executiva

É viável construir este produto sobre a capacidade já instalada, mas ele não deve simplesmente compilar matérias nem reaproveitar imagens de veículos. O formato seguro e sustentável é:

1. usar RSS, APIs e fontes oficiais para **descoberta e verificação**;
2. selecionar uma pauta com relevância, diversidade e confirmação mínima em duas fontes independentes quando não houver fonte primária;
3. produzir um roteiro original, curto e factual, com contexto próprio;
4. ilustrar com mídia própria, banco licenciado/permitido (como Pexels), material oficial com licença confirmada, gráficos, mapas, cards e imagens geradas que não retratem um evento real como se fossem registro dele;
5. revisar fatos, linguagem, risco jurídico e título/capa antes de publicar;
6. subir o vídeo com descrição, créditos, fontes e sinalização de IA quando aplicável.

RSS não concede, por si só, direito de republicar texto, fotos ou vídeos. Para a maioria dos portais comerciais, o feed deve ser tratado apenas como índice/link: não copiar o texto integral, não baixar a foto de capa e não reutilizar vídeo da reportagem. A exceção inicial mais útil é a Agência Brasil: o serviço oficial informa que o conteúdo pode ser reproduzido com crédito, ressalvando explicitamente materiais de parceiros internacionais marcados como proibidos. [Condições oficiais da Agência Brasil](https://www.gov.br/pt-br/servicos/acessar-noticias-em-tempo-real-gratuitamente?id=10223&origem=servico).

## 2. Como o sistema atual pode ser reaproveitado

| Capacidade existente | Uso no boletim diário | Limite atual |
| --- | --- | --- |
| Posts/notícias e scrapers | receber itens de feeds e guardar a origem | hoje o fluxo é centrado em um artigo por item |
| `lib/newsArticleVideo.ts` | referência para roteiro, áudio, status e eventos | limita notícia a 15–60 s |
| áudio/voz e apresentadora | locução ou trechos de apresentadora | é necessário um roteiro longo e segmentado |
| Pexels (`lib/pexels.ts`) | b-roll ilustrativo licenciado | não prova nem documenta o fato noticiado |
| Remotion e `render-service` | montagem 16:9 de cenas, cards, legendas e áudio | requer uma composição nova de edição longa |
| fila `SocialPost` e integração YouTube | agendar/publicar, salvar URL e métricas | deve suportar thumbnail, descrição, vídeo longo e o atributo de IA |

O produto novo deve ser independente do vídeo curto de cada `Post`. Ele pode apontar para itens de notícia existentes, mas terá pauta, revisão, roteiro, artefatos, publicação e auditoria próprios.

## 3. Linha editorial e duração

### Grade recomendada por edição

Meta: 8–10 notícias, 8:30–10:00 minutos, cerca de 1.150–1.350 palavras em português, variando pela velocidade da voz.

| Bloco | Orçamento | Regra editorial |
| --- | ---: | --- |
| Abertura | 15–25 s | data, promessa factual e as 2–3 manchetes mais relevantes |
| Brasil/política e economia popular | 2–3 min | separar fato, decisão oficial e consequência prática; fontes primárias para benefícios |
| Segurança pública | 45–75 s | não especular culpados, preservar vítimas e evitar detalhes gráficos |
| Futebol e entretenimento | 1:30–2:00 min | dar preferência a fontes oficiais de clubes, ligas, federações e assessorias |
| Clima, saúde e alertas | 1:30–2:00 min | apenas dados oficiais/confirmados e instrução de serviço quando houver alerta |
| Tecnologia/IA e mundo | 1:30–2:00 min | explicar impacto; confirmar fonte primária ou agência confiável |
| Fecho | 10–20 s | síntese e convite honesto para acompanhar a próxima edição |

As dez categorias citadas pelo negócio podem ser mantidas como taxonomia. Uma edição não precisa forçar uma notícia em cada categoria: faltando relevância, o bloco fica menor ou não entra. Prioridade deve ser impacto público, atualidade, confirmação e interesse, não quantidade.

## 4. Fontes gratuitas: catálogo inicial e política de uso

### Fontes a integrar primeiro

| Tema | Fonte/canal | Papel permitido recomendado | Observação |
| --- | --- | --- |
| Geral, política, economia, mundo, cultura, esporte | Agência Brasil / EBC | descoberta, confirmação e reprodução com crédito, após filtro de material de parceiro | é a melhor fonte-base inicial; o próprio serviço declara gratuidade e permite reprodução com atribuição, mas exclui parceiros internacionais proibidos |
| Governo, benefícios, trabalho, Previdência, saúde, Justiça | portais e RSS específicos de `gov.br` | fonte primária para atos, calendário, regras e comunicados | o Governo Federal mantém coleções RSS e páginas de órgãos podem expor feed próprio; validar endpoint antes de ativar. [Guia RSS gov.br](https://www.gov.br/pt-br/navegacao/rss) |
| Estatísticas, inflação, emprego, pesquisa | IBGE / Banco Central / Ipea / Tesouro | fonte primária de dados, notas e séries | utilizar dado e link oficial; guardar data de consulta |
| Saúde e alertas sanitários | Ministério da Saúde, Anvisa, Fiocruz, secretarias oficiais | fonte primária para alertas e recomendações | saúde exige revisão humana obrigatória |
| Tempo e desastres | INMET, Cemaden, Defesa Civil | fonte primária de alertas e previsão | apresentar validade, localidade e horário do alerta; INMET disponibiliza avisos em portal próprio. [Avisos INMET](https://portal.inmet.gov.br/noticias/inmet-aprimora-interface-de-avisos-meteorol%C3%B3gicos) |
| Futebol | sites/feeds oficiais de CBF, federações, clubes e competições | fatos oficiais: tabela, convocação, punição, escalação confirmada | não usar rumor como notícia; resultados podem vir de provedor contratado/fonte oficial |
| Tecnologia/IA | blogs e newsroom oficiais de empresas, repositórios e órgãos reguladores | anúncio e documentação primária | não resumir rumor como lançamento |
| G1, UOL, CNN Brasil, Folha, Estadão e equivalentes | RSS quando disponibilizado pelo próprio veículo | descoberta, triangulação e link para a origem | **não** reutilizar texto, foto, vídeo, logotipo ou manchete como material final sem licença contratada/expressa |

### Registro obrigatório de fontes

Antes de cadastrar qualquer feed, criar uma ficha com: URL do feed, editoria, dono, periodicidade de consulta, finalidade (`DISCOVERY`, `PRIMARY_FACT`, `REPUBLISH_ALLOWED`), URL de termos/licença, regra de crédito, permissão de texto, imagem e vídeo, responsável pela validação, data da última revisão e status (`PENDING`, `APPROVED`, `BLOCKED`).

Não cadastrar uma fonte comercial como `REPUBLISH_ALLOWED` sem autorização escrita. Em especial, o fato de um feed ser público/gratuito não é licença de republicação.

## 5. Fluxo proposto

```text
Feeds/APIs/fontes oficiais
        ↓
Coleta normalizada + deduplicação + registro da fonte
        ↓
Cluster de evento + checagem de origem e recência
        ↓
Score de pauta → edição diária em rascunho
        ↓
Roteiro original + plano visual + metadados
        ↓
Revisão humana obrigatória (fato, direito, segurança, título/capa)
        ↓
Áudio → busca de assets permitidos → composição Remotion 16:9
        ↓
QA técnico e editorial → upload YouTube → agendamento/publicação
        ↓
Auditoria, créditos, URLs das fontes e métricas
```

### 5.1 Coleta e normalização

- Consultar feeds em intervalo configurável (ex.: 15 minutos) e fontes oficiais em ritmo compatível com cada API.
- Salvar somente os metadados necessários: título original, resumo do feed, URL canônica, fonte, data/hora original, categoria, identificador do feed e hash de deduplicação.
- Não baixar e redistribuir HTML, foto ou vídeo de fontes classificadas como apenas descoberta.
- Agrupar URLs que relatam o mesmo evento; uma edição deve falar do evento, não repetir dez manchetes diferentes.
- Recusar itens sem data, URL canônica, fonte aprovada ou que estejam fora da janela da edição, salvo contexto explicitamente marcado.

### 5.2 Seleção e verificação

Score sugerido: `impacto público (0–5) + atualidade (0–5) + confiabilidade (0–5) + interesse (0–3) - duplicidade (0–3) - risco (0–5)`.

Regras de bloqueio automático:

- política, crime, saúde, benefício, clima severo, desastre, eleição, finanças ou conflito: fonte primária ou duas fontes independentes;
- alegação criminal sem decisão/documento público: não publicar automaticamente;
- números, valores e datas de benefício: confirmar órgão competente e validade;
- fotos/vídeos de evento real sem proveniência/licença: não usar;
- informação em desenvolvimento: usar linguagem de atribuição ("segundo...", "as autoridades informaram...") e encaminhar para revisão.

### 5.3 Roteiro e plano visual

Para cada notícia, gerar uma ficha: fato confirmado, fonte(s), horário de verificação, contexto, o que ainda não está confirmado, impacto para o público, texto narrado, frase de tela, termos de busca permitidos e créditos.

O modelo deve receber fontes como evidência e instruções de: não inventar dado, não criar citação, não tratar hipótese como fato, não diagnosticar, não prescrever e não usar tom sensacionalista em tragédias/crimes. O roteiro final é original; não é uma paráfrase em sequência de uma única reportagem.

Visualmente, alternar apresentadora/narração, b-roll licenciado, mapas, gráficos, cards e timeline. Para acontecimento sem imagens liberadas, usar card informativo, mapa ou ilustração claramente rotulada como ilustrativa — nunca uma imagem sintética realista apresentada como prova.

### 5.4 Revisão humana e publicação

A revisão é uma porta obrigatória no MVP. A pessoa revisora aprova: pauta, fontes, precisão, direitos de cada asset, roteiro, título, thumbnail, descrição, horários e disclosure de IA. Somente após aprovação o job pode renderizar e entrar na fila do YouTube.

Futuramente é aceitável automatizar publicação apenas para pautas de baixo risco previamente aprovadas. Política, saúde, clima severo, crime, benefícios e tragédias devem manter revisão humana antes do upload.

## 6. Direitos, integridade e políticas do YouTube

### Regras internas inegociáveis

- Não copiar reportagem, imagem, vídeo, áudio, infográfico, logo ou thumbnail de veículo sem licença aplicável.
- Não fabricar fala, cena, prova ou depoimento de pessoa real; não usar voz/rosto de terceiro sem consentimento.
- Não mostrar cadáveres, ferimentos, menores identificáveis, material de violência gráfica ou conteúdo que explore tragédia.
- Não identificar suspeito como culpado antes de decisão judicial; atribuir informação a quem a declarou e respeitar presunção de inocência.
- Não oferecer diagnóstico, tratamento ou recomendação financeira individual; priorizar orientações e links de órgãos oficiais.
- Registrar URL, licença e crédito de cada asset usado. Sem registro, o asset não entra no render.

O YouTube exige divulgação quando IA cria/altera conteúdo realista de forma material — por exemplo, evento, local ou pessoa apresentados como reais. A configuração de uso de IA deve ser suportada no fluxo de upload; para notícias, saúde, finanças, eleições, desastres e conflitos podem aparecer rótulos mais evidentes. A divulgação, por si, não reduz audiência nem elegibilidade de monetização. [Política de divulgação de IA do YouTube](https://support.google.com/youtube/answer/14328491).

Para monetização, evitar conteúdo massificado, repetitivo e com valor editorial mínimo: o YouTube considera inelegíveis slideshows/modelos com pouca narração, comentário ou valor educacional, assim como reaproveitamento sem transformação substancial. [Política de monetização e conteúdo reutilizado](https://creatoracademy.youtube.com/page/lesson/ypp-welcome_policies-and-guidelines_list). A solução é manter autoria editorial: curadoria, múltiplas fontes, contexto, narrativa própria, edição não intercambiável e revisão real.

"Clickbait" deve significar embalagem atraente e verdadeira: promessa compatível com o vídeo. A thumbnail não pode levar o público a esperar algo que não existe no conteúdo; também não usar violência gráfica, sexualização ou choque. [Política de thumbnails do YouTube](https://support.google.com/youtube/answer/9229980?hl=en-419). Metadados que enganam ou buscam manipular engajamento também são vedados. [Política de spam e práticas enganosas](https://support.google.com/youtube/answer/2801973/spam-deceptive-practices-and-scams-policies?hl=en-GB).

## 7. Títulos, thumbnails, descrição e SEO

### Título

Gerar 3 opções e submeter à revisão. Fórmula recomendada: fato principal + consequência/serviço + data, sempre verificável.

Exemplos de estrutura: `O que mudou hoje: [fato principal] e mais notícias desta [data]` ou `As notícias de hoje: [tema confirmado] + clima, futebol e economia`.

Proibido: afirmar morte, prisão, benefício, alerta, escândalo, resultado ou fala que não conste no vídeo e nas fontes aprovadas.

### Thumbnail 1280×720

- um fato principal comprovado, 2–5 palavras de texto grande e imagem legalmente utilizável;
- contraste alto, marca discreta e nenhum texto ilegível no celular;
- a imagem é ilustrativa quando não for registro licenciado do fato;
- não usar rosto de pessoa real em contexto que sugira acusação, fala ou presença não comprovada;
- guardar `thumbnailUrl`, prompt/asset de origem, licença e versão aprovada.

### Descrição

Modelo:

```text
Notícias de [data], verificadas até [hora BRT].

Nesta edição: [tópicos factuais, em bullets].

Fontes consultadas:
- [órgão/veículo] — [URL]
- [órgão/veículo] — [URL]

Créditos de imagem/vídeo: [autor/plataforma/licença].
Este vídeo tem caráter informativo e não substitui orientação de autoridades ou profissionais.
#Noticias #Brasil #[tema]
```

As palavras-chave devem nascer do conteúdo publicado: nomes oficiais, localidades, temas e termos de busca reais. Não inserir tags de celebridades/eventos sem relação com a edição.

## 8. Modelo de dados e estados propostos

Criar modelos independentes, sem alterar o contrato de `Post` até a fase de integração:

```prisma
model NewsSource {
  id, name, feedUrl, category, usePolicy, termsUrl, attributionRule,
  allowText, allowImage, allowVideo, status, reviewedAt, createdAt, updatedAt
}

model NewsIngestItem {
  id, sourceId, sourceUrl, canonicalUrl, originalTitle, excerpt, publishedAt,
  fetchedAt, contentHash, category, rawMetadataJson, status
}

model DailyNewsEdition {
  id, editionDate, timezone, title, description, status, scriptText,
  sourceSnapshotJson, assetPlanJson, thumbnailUrl, audioUrl, videoUrl,
  youtubeVideoId, publishedUrl, aiDisclosureRequired, reviewedBy, reviewedAt,
  scheduledAt, publishedAt, errorMessage, createdAt, updatedAt
}

model DailyNewsEditionItem {
  id, editionId, ingestItemId, order, section, narrationText, factSheetJson,
  verificationStatus, reviewStatus, durationSec
}

model DailyNewsAsset {
  id, editionId, editionItemId, url, assetType, source, licenseUrl,
  credit, usageProofJson, startSec, endSec, status
}
```

Estados de `DailyNewsEdition`: `DRAFT → COLLECTING → CURATING → FACT_CHECKING → SCRIPTING → AWAITING_REVIEW → APPROVED → GENERATING_AUDIO → PLANNING_VISUALS → RENDERING → QA → SCHEDULED → PUBLISHED`, com saídas `REJECTED`, `FAILED` e `CANCELED`.

Cada transição deve gerar evento, ator, timestamp, versão do roteiro e motivo. Um vídeo publicado precisa ser reproduzível: exatamente quais fontes e assets foram usados, sob quais regras e quem aprovou.

## 9. Integrações e contratos técnicos

- **Ingestor RSS:** parser com ETag/`Last-Modified`, timeout, retentativa limitada, normalização de HTML, deduplicação por URL/hash e respeito à cadência do publicador.
- **Catálogo de fontes:** configuração administrativa; feeds novos entram em `PENDING` e só rodam após aprovação.
- **Planejador editorial:** cria clusters e uma pauta limitada ao orçamento de duração.
- **Gerador de roteiro:** saída JSON estruturada, validada por schema, contendo fatos, evidências, incertezas, texto, duração e consulta visual; nenhuma URL de mídia de fonte não licenciada deve ser aceita.
- **Assets:** integrar Pexels já disponível; adicionar bloqueio por lista de fontes permitidas, metadados de licença e créditos. Mídia oficial entra somente após regra de uso cadastrada.
- **Render:** nova composição Remotion `DailyNewsLandscape` em 1920×1080, 25/30 fps, com capítulos, lower-thirds, legendas, créditos e fallback para cards/mapas.
- **YouTube:** upload como vídeo longo, `privacyStatus` configurável, thumbnail, título, descrição, playlist, data de agendamento, categoria e atributo de disclosure de IA quando necessário. A publicação deve ser idempotente e nunca duplicar upload após retry.
- **Observabilidade:** logs por edição, erros por fonte, custo/tempo de TTS e render, status de upload, alertas de falha, dashboard de duração, revisão e métricas pós-publicação.

## 10. UX administrativa mínima

1. **Fontes:** lista, licença/termos, finalidade, status e botão de teste do feed.
2. **Pauta do dia:** clusters, score, fonte primária, risco e seleção manual.
3. **Edição:** roteiro segmentado, fontes por bloco, assets, cronologia e contador de duração.
4. **Revisão:** checklist obrigatório com aprovação/rejeição e comentários.
5. **Publicação:** título, thumbnail, descrição, créditos, disclosure IA, horário, privacidade e histórico do upload.
6. **Auditoria:** versão aprovada, logs e artefatos persistidos.

## 11. Implementação por fases

### Fase 0 — governança (pré-requisito)

- aprovar política editorial, matriz de risco e checklist;
- criar registro de fontes e aprovar apenas fontes oficiais/Agência Brasil no piloto;
- definir responsável revisor e horário de corte diário;
- criar um teste manual de 3–5 minutos sem publicação automática.

### Fase 1 — coleta e pauta

- modelos `NewsSource` e `NewsIngestItem`;
- cadastro e health-check de RSS;
- ingestão idempotente, deduplicação e clusters;
- tela de pauta e seleção humana.

### Fase 2 — edição e revisão

- `DailyNewsEdition` e itens;
- roteiro factual estruturado, fontes e versões;
- plano visual, Pexels/licenças e composição Remotion 16:9;
- revisão editorial obrigatória e render de prévia.

### Fase 3 — empacotamento YouTube

- gerador controlado de título, thumbnail e descrição;
- QA automático de duração, resolução, áudio, fontes, créditos e termos proibidos;
- upload privado/não listado para inspeção, seguido de agendamento manual;
- persistência de URL, ID e métricas.

### Fase 4 — automação gradual

- publicação automática somente de edições aprovadas;
- limites de custo, retries seguros e alertas;
- A/B de thumbnail/título quando suportado pelo processo operacional, sem promessa enganosa;
- expansão de fontes após revisão de direitos por fonte.

## 12. Critérios de aceite do MVP

- [ ] Edição horizontal de até 10 minutos, em 1920×1080, com áudio, legendas e capítulos internos.
- [ ] Cada afirmação relevante aponta para fonte e horário de verificação auditáveis.
- [ ] Fontes comerciais são usadas somente para descoberta/link, salvo licença registrada.
- [ ] Todos os assets possuem licença/atribuição registradas ou foram gerados/produzidos sob controle do canal.
- [ ] Nenhuma edição de alto risco publica sem aprovação humana.
- [ ] Título, thumbnail e descrição passam pelo checklist de precisão e políticas.
- [ ] O upload registra a divulgação de IA quando ela for exigida.
- [ ] Falha em qualquer etapa não duplica vídeo nem publica parcialmente.
- [ ] O admin permite rastrear fonte → pauta → roteiro → asset → render → vídeo publicado.

## 13. Decisões que precisam do responsável pelo canal antes da implementação

1. Nome/identidade do canal e linha editorial: boletim neutro, explicativo ou com opinião claramente identificada.
2. Horário diário, janela de corte e se haverá edição extra em breaking news.
3. Quem aprova política, saúde, crime, tragédia e benefício público.
4. Se haverá apresentadora/avatar e se a própria pessoa possui autorização de uso de rosto e voz.
5. Quais fontes comerciais terão apenas descoberta e se alguma licença paga será contratada.
6. Estratégia de mídia: somente Pexels + gráficos no MVP ou também banco pago/mídia de agência licenciada.
7. Publicação inicial como `privado`/`não listado` para QA ou agendada diretamente após aprovação.

## 14. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| violação de copyright | registro de licença por fonte/asset, bloqueio técnico de URL não aprovada e crédito |
| erro factual em notícia urgente | fontes primárias/dupla confirmação, linguagem de atribuição, revisão humana e versão/correção visível |
| conteúdo inautêntico/repetitivo no YouTube | roteiro e seleção originais, contexto, edição variável e valor informativo real |
| thumbnail/título enganoso | checklist de promessa versus conteúdo e revisão |
| IA confundida com registro real | não gerar reconstituição realista de evento; rotular ilustração e usar disclosure do YouTube quando aplicável |
| automação publicar conteúdo sensível | gate humano obrigatório por matriz de risco |
| custo e fila de render | orçamento máximo por edição, prévia baixa resolução e render final somente após aprovação |

