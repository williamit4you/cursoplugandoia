# Jobs, agentes e operação

## 1. O que significa “job diário”

Cada programa é verificado diariamente. Isso não significa publicar uma página por dia. O seletor escolhe a ação de maior valor e risco aceitável:

```text
VERIFY_AFFILIATE
VERIFY_SOURCE
REFRESH_VOLATILE_FACTS
UPDATE_STALE_PAGE
RESEARCH_OPPORTUNITY
CREATE_BRIEF
WRITE_DRAFT
RUN_REVIEW
FIX_FINDINGS
PUBLISH_APPROVED
AUDIT_INTERNAL_LINKS
AUDIT_SITEMAP
COLLECT_PERFORMANCE
WAIT
```

Prioridade padrão: segurança/afiliado → stale → correções → publicação aprovada → conteúdo novo → auditorias → espera.

## 2. Scheduler do portfólio

- tick recomendado: 5 minutos em host persistente ou cron externo equivalente;
- elegibilidade por `nextRunAt`, não por executar IA em todo tick;
- máximo global de 2 gerações de IA concorrentes no piloto;
- máximo de uma execução ativa por programa e por página;
- orçamento diário por programa e global;
- round-robin ponderado por prioridade, backlog e tempo desde a última execução;
- programas `HIGH` não consomem fila de aprovação automaticamente;
- três falhas consecutivas pausam o programa e alertam o operador.

## 3. Cadências iniciais

| Programa | Job | Novos rascunhos | Publicações máximas | Revisão principal |
|---|---|---:|---:|---|
| Cobasi | diário | até 1/dia | 1/dia | local/saúde conforme risco |
| Brascol | diário | 3/semana | 3/semana | financeiro/tributário |
| Electrolux | diário | 1/dia | 5/semana | segurança técnica |
| Cicatribem | diário | 3/semana | 3/semana | pele/saúde |
| Pibe Brasil | diário | 3/semana | 3/semana | suplemento/saúde |
| Funko Brasil | diário | até 1/dia | 5/semana | licença e atualidade |
| Probel | diário | 4/semana | 4/semana | saúde e especificações |
| Thermos Brasil | diário | 4/semana | 4/semana | especificações |
| Escuta o Véio | diário | 4/semana | 4/semana | ficha técnica/segurança |
| GLNC Farma | diário | 3/semana | 3/semana | suplemento/saúde |
| TNG | diário | 4/semana | 4/semana | catálogo/sazonal |
| Drogaria Rosário | diário | 4/semana | 4/semana | saúde/local |

Todos começam com `autoPublish=false`. “Máximo” não é meta mínima.

## 4. Contrato dos agentes

### Opportunity Agent

Entrada: taxonomia, backlog, Search Console agregado, páginas existentes, catálogo verificado e sazonalidade.

Saída: `topic`, `intent`, `cluster`, `contentType`, `priority`, `riskClass`, `whyNow`, `candidatePath`, `overlapCandidates`.

Bloqueio: não criar se não houver razão distinta ou fonte possível.

### Research Agent

Entrada: pauta aprovada e política de fontes.

Saída: afirmações estruturadas com `claim`, `sourceUrl`, `sourceType`, `accessedAt`, `expiresAt`, `quotation=false/true`.

Bloqueio: não usar snippet de busca como prova; fontes comerciais só sustentam dados do próprio produto.

### SEO Strategist

Saída: keyword, intenção, title, meta, H1, outline H2/H3, entities, internal links, schema e critérios de atualização. Deve explicar diferenciação frente às páginas próximas.

### Writer

Produz JSON editorial conforme o template. Não recebe nem produz URL afiliada. Deve distinguir fato, inferência e recomendação baseada em critérios.

### Fact Reviewer

Liga claims a fontes, marca ausência, contradição e vencimento. Não corrige inventando; devolve achados.

### SEO Reviewer

Valida intenção, canibalização, title/meta, headings, links, originalidade, canonical e utilidade.

### Compliance Reviewer

Aplica guardrails do programa. Define `PASS`, `NEEDS_HUMAN`, `BLOCK` e os trechos afetados.

### Affiliate Reviewer

Valida programa/loja, scanner de URLs, disclosure, CTA e tracking no banco. É determinístico; IA pode explicar, mas não decidir validade.

### Editor

Recebe achados estruturados e gera uma nova revisão completa. Nunca altera diretamente a versão publicada.

### Publisher

Executa somente o preflight determinístico e a transação. Não escreve conteúdo.

## 5. Política de fontes

Ordem geral:

1. órgão público/regulador, norma ou literatura científica quando o claim exigir;
2. página oficial, manual, ficha técnica ou rótulo do fabricante;
3. entidade profissional reconhecida;
4. fonte editorial reputada para contexto;
5. fonte comercial apenas para preço, estoque, catálogo e alegações do próprio vendedor.

Conteúdo de saúde exige fontes confiáveis e revisão humana; conteúdo técnico usa manual/ficha antes de instrução de aplicação; comparativo de modelos exige fonte para ambos.

## 6. Estados e transições

```text
IDEA → RESEARCHING → BRIEF_READY → DRAFTING → REVIEW
REVIEW → NEEDS_CHANGES → REVIEW
REVIEW → APPROVED → SCHEDULED → PUBLISHED
qualquer estado de trabalho → FAILED → RETRY_SCHEDULED
PUBLISHED → STALE → REVIEW
PUBLISHED → UNPUBLISHED → ARCHIVED
```

`BLOCKED` é terminal até intervenção; `PAUSED` é controle operacional; `CANCELLED` encerra pauta sem publicar.

Transições inválidas retornam `409`. `PUBLISHED` só é alcançado pelo serviço de publicação.

## 7. Idempotência, locks e retry

- cron recebe `runKey = programKey + operationWindow`;
- publicação recebe chave `pageId + approvedRevisionId`;
- lock atômico com TTL de 30 minutos;
- heartbeat em tarefas longas;
- retries em 5, 20 e 60 minutos, depois fila morta;
- erro editorial não conta como erro de infraestrutura;
- `WAIT` registra motivo e agenda o próximo ciclo;
- retomada nunca duplica revisão ou publicação.

## 8. Aprovação

O editor vê conteúdo, fontes, diff, achados, risk class, CTA lógico e preview. A aprovação registra usuário, data, revisão e escopo. Qualquer alteração material após aprovação invalida a aprovação.

Regras:

- `LOW`: editor;
- `MEDIUM`: editor com checklist técnico;
- `HIGH`: editor + especialista;
- `CRITICAL`: não publicar no fluxo comum.

## 9. Rotina semanal de operação

- segunda: pautas e criação;
- terça: pesquisa/fontes;
- quarta: criação e correções;
- quinta: atualização de fatos voláteis;
- sexta: aprovação/publicação;
- sábado: links, sitemap, órfãs e similaridade;
- domingo: performance, planejamento e `WAIT` quando não houver ação segura.

O agendamento específico de cada programa pode sobrescrever esta distribuição.
