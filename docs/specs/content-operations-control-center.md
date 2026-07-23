# Spec Driven Development: Central de Operacoes de Conteudo

Status: proposta aprovada para detalhamento tecnico
Data: 2026-07-23

## 1. Objetivo

Criar uma Central de Operacoes que mostre, em uma unica tela, o que o Portal IA esta produzindo, publicando, medindo e gastando. A central deve permitir agir sobre problemas sem obrigar o operador a conhecer os nomes internos dos pipelines.

## 2. Problemas que a especificacao resolve

- Muitas abas representam componentes internos, nao objetivos do negocio.
- Nao existe uma resposta confiavel para "o que esta rodando agora?".
- Fila, calendario, falhas e integracoes aparecem separados.
- Artigos, videos e posts sociais nao possuem uma linha do tempo de origem ate resultado.
- Nao existe relatorio diario unificado de volume, sucesso, custo e retorno.
- Nao existe ciclo de SEO conectado ao produto que originou o video.

## 3. Navegacao proposta

### Operacao

- **Inicio**: saude geral, alertas, filas e atalhos.
- **Conteudo**: artigos, videos e produtos em uma visao unificada.
- **Calendario**: publicacoes por dia, rede, status e campanha.
- **Filas e falhas**: itens travados, falhos, vencidos e retries.

### Crescimento

- **SEO e pautas**: oportunidades, palavras-chave, clusters e briefs.
- **Analytics**: posts, videos, artigos, cliques, visitas, leads e vendas.
- **Relatorio diario**: resumo automatico com variacoes contra o dia anterior.

### Sistemas

- **Automacoes**: cada pipeline com liga/desliga, frequencia, ultima execucao e proxima execucao.
- **Integracoes**: Meta, YouTube, TikTok, storage, RunPod, Pexels e IA.
- **Custos e uso**: tokens, renders, armazenamento e chamadas externas.
- **Logs tecnicos**: acesso detalhado somente quando necessario.

## 4. Requisitos funcionais

### RF-01: Painel de saude

O sistema deve mostrar um card para cada familia de operacao com: estado `OK`, `ATENCAO`, `FALHA` ou `DESLIGADO`; ultima execucao; proxima execucao; itens ativos; itens parados ha mais de 15 minutos; e link para detalhes.

### RF-02: Visao de pipeline

Cada item deve possuir uma linha do tempo unica: fonte -> coleta -> roteiro -> audio -> video -> artigo -> fila social -> publicado -> resultado. Etapas inexistentes devem aparecer como "nao aplicavel", nunca desaparecer silenciosamente.

### RF-03: Fila acionavel

O operador deve conseguir filtrar por familia, produto, plataforma, status, idade e erro. Acoes em lote obrigatorias: reagendar, repetir, pausar, cancelar somente a etapa, abrir log e abrir o ativo gerado.

### RF-04: Calendario operacional

O calendario deve usar horario local, mostrar miniatura, plataforma, tipo, status e titulo. Deve ter visual mes, semana e agenda. Publicacoes vencidas devem ter acao de recuperacao com simulacao antes da confirmacao.

### RF-05: Relatorio diario

Gerar diariamente: itens produzidos, publicados, falhos, taxa de sucesso, tempo medio por etapa, visitas aos artigos, visualizacoes por rede, cliques de afiliado, leads, vendas atribuidas, custo estimado e alertas. Comparar com os sete dias anteriores.

### RF-06: Analytics do blog

Instrumentar pageview, sessao, origem, landing page, scroll, clique em produto, clique afiliado e conversao. Separar evento interno de visita real e respeitar consentimento, privacidade e bloqueadores.

### RF-07: SEO por produto

Depois de um produto gerar video, o sistema deve criar uma pauta SEO com tres angulos:

- **Dor**: problema que o produto resolve, sem promessas enganosas.
- **Produto**: como funciona, para quem serve, pontos fortes e limitacoes.
- **Comparativo**: produto contra alternativa, concorrente ou criterio de escolha.

Cada pauta deve conter palavra-chave principal, variacoes, intencao, cluster, titulo, slug, outline, links internos, CTA, dados de produto, evidencia e status de revisao humana.

### RF-08: Pesquisa de demanda

O agente de pautas deve combinar Google Trends, Google Search Console, Keyword Planner ou fonte equivalente, sugestoes de busca e historico proprio. Trends deve ser tratado como sinal relativo, nao como volume absoluto. O resultado precisa guardar fonte, data, regiao, termo e confianca.

### RF-09: Agentes especializados

- Agente de pesquisa: coleta termos, tendencias e concorrentes.
- Agente de estrategia: escolhe intencao, cluster e prioridade.
- Agente de pauta: cria os tres briefs por produto.
- Agente redator: produz o artigo com fatos e fontes.
- Agente SEO: valida title, description, headings, links e schema.
- Agente revisor: verifica fatos, duplicidade, claims, afiliacao e tom.
- Agente analista: interpreta resultados sem inventar causalidade.

Nenhum agente deve publicar automaticamente conteudo factual sensivel sem regra de aprovacao configuravel.

## 5. Requisitos nao funcionais

- Todas as execucoes devem possuir `runId` e `operationKey`.
- Jobs devem ser idempotentes: repetir nao pode duplicar video, artigo ou post.
- Falhas devem ter mensagem amigavel e detalhe tecnico separado.
- O dashboard deve carregar a visao principal em menos de 2 segundos quando os dados estiverem agregados.
- Metricas devem exibir periodo, timezone e origem.
- Tokens e segredos nunca devem aparecer em logs ou cards.
- Custos devem ser estimados mesmo quando o provedor nao retornar preco exato.

## 6. Contrato de dados minimo

Criar uma camada de observabilidade com entidades equivalentes a:

- `OperationDefinition`: nome, familia, ativo, frequencia, owner.
- `OperationRun`: runId, operationKey, inicio, fim, status, contadores, custo, erro.
- `PipelineItem`: origem, produto, post, video, artigo, estado atual, proxima acao.
- `ContentAsset`: tipo, URL, versao, origem e hash de deduplicacao.
- `SeoOpportunity`: termo, fonte, intencao, cluster, score, data de coleta.
- `DailyReport`: data, KPIs, comparativos, alertas e versao do calculo.

Antes de criar tabelas, mapear o que ja existe em `PipelineLog`, `AutomationTaskRun`, `CodeVideoPipelineEvent`, `ShopeePipelineEvent`, `SocialPost`, `SocialPostClick`, `YtVideoSnapshot`, `BioClick` e modelos de analytics.

## 7. Criterios de aceite da primeira versao

- O operador identifica em menos de 30 segundos quais operacoes estao ativas, paradas ou falhas.
- Um video pode ser rastreado desde a URL/produto ate cada publicacao e clique.
- A tela informa quantos itens estao em cada etapa e qual e o item mais antigo.
- O calendario e a fila exibem os mesmos horarios e status.
- O relatorio diario pode ser aberto por periodo e exportado.
- Um produto gera tres briefs SEO, mas a publicacao exige aprovacao configuravel.
- Uma falha de credencial aponta integracao, proxima acao e impacto estimado.
