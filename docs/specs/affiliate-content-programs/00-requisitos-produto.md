# Requisitos do produto

## 1. Problema

O Compra Esperta precisa operar vários programas de marketing de conteúdo sem criar pipelines duplicados, links afiliados incorretos, conteúdo raso em escala ou páginas de saúde/segurança sem controle. O sistema atual possui um módulo específico da Cobasi e recursos editoriais reaproveitáveis, mas ainda não possui um domínio multi-programa completo.

## 2. Objetivos

- adquirir tráfego orgânico anterior à busca pela marca;
- ajudar o visitante a decidir e só então apresentar o CTA;
- gerar rascunhos continuamente com revisão proporcional ao risco;
- publicar gradualmente e aprender com Search Console e cliques;
- impedir tecnicamente troca ou perda de tracking afiliado;
- manter conteúdo, fontes, preços, estoque e informações locais atualizados;
- permitir pausar um programa sem afetar os demais;
- escalar clusters vencedores, não quantidade bruta de URLs.

## 3. Fora do escopo inicial

- publicar todo o catálogo de qualquer loja;
- gerar automaticamente todas as combinações de filtros;
- prometer 1.200 ou 1.500 páginas;
- copiar catálogo, avaliação, imagem ou descrição sem permissão;
- autopublicar conteúdo de saúde, medicamento ou orientação técnica de risco;
- representar-se como site oficial das lojas;
- alterar preço, política comercial ou destino afiliado manualmente no artigo;
- produzir diagnóstico médico, veterinário ou estrutural definitivo.

## 4. Personas operacionais

| Persona | Necessidade |
|---|---|
| Administrador | configurar programa, orçamento, cadência e loja |
| Estrategista SEO | organizar taxonomia, intenção, clusters e canibalização |
| Editor | revisar fontes, texto, claims, links e preview |
| Especialista | aprovar conteúdo YMYL ou técnico de alto risco |
| Operador | acompanhar fila, falhas, stale, sitemap e execução diária |
| Visitante | receber orientação útil e identificar claramente a relação afiliada |

## 5. Requisitos funcionais

### RF-01 — programas

O administrador deve criar, configurar, ativar, pausar e arquivar programas. Cada programa possui uma única `AffiliateStore` obrigatória, taxonomia, política de risco, cadence e orçamento.

### RF-02 — inventário editorial

O sistema deve cadastrar hubs, categorias, guias, comparativos, reviews, conteúdos sazonais, páginas locais e ferramentas. Cada oportunidade deve conter intenção, cluster, prioridade, risco e razão de existir.

### RF-03 — fila e estados

Toda página deve percorrer estados persistidos. O histórico de execução e revisão não pode ser substituído silenciosamente.

### RF-04 — agentes

O pipeline deve executar pesquisa, briefing, redação e revisões separadamente. Cada etapa recebe somente os dados necessários e produz saída estruturada auditável.

### RF-05 — revisão humana

No piloto, nenhuma página é publicada sem aprovação humana. Conteúdo `HIGH` ou `CRITICAL` também exige revisor especializado identificado.

### RF-06 — publicação

O botão Publicar deve executar o mesmo preflight transacional do job. Falha deve manter a página fora do sitemap, registrar o motivo e exibi-lo no painel sem derrubar a tela.

### RF-07 — afiliado

Autores e agentes não podem escolher URL comercial. O servidor resolve a loja pelo programa e o CTA interno pelo `storeSlug` cadastrado.

### RF-08 — atualização

Fontes e fatos voláteis possuem validade. O job deve preferir `UPDATE`/`VERIFY` a `CREATE` quando houver página vencida de maior prioridade.

### RF-09 — sitemap

Somente página publicada, indexável, canônica, válida e ligada a uma loja ativa entra no sitemap. A remoção da elegibilidade deve refletir-se automaticamente.

### RF-10 — analytics

Pageview, impressão e clique de CTA devem carregar `programKey`, `pageId`, `contentType`, `cluster`, `storeSlug` e `ctaPlacement`.

### RF-11 — busca e filtros administrativos

O painel deve filtrar por programa, estado, tipo, risco, cluster, data de expiração, falha, indexação e sitemap.

### RF-12 — lote

O operador deve importar pauta, gerar primeiro lote como rascunho e liberar publicação por página ou pequeno lote após preflight.

## 6. Requisitos não funcionais

- isolamento transacional entre programas;
- idempotência de cron e publicação;
- lock com expiração e recuperação;
- retry exponencial com limite;
- logs sem segredo, URL afiliada completa ou dado pessoal;
- saída de agente validada por schema;
- conteúdo público renderizado no servidor;
- acessibilidade WCAG 2.2 AA nos templates;
- Core Web Vitals monitorados;
- canonical e sitemap determinísticos;
- auditoria de todas as decisões de publicação;
- custos de IA registrados por execução e programa.

## 7. Classificação de risco

| Classe | Exemplos | Regra |
|---|---|---|
| LOW | Funko, TNG, Thermos geral | revisão editorial padrão |
| MEDIUM | Brascol financeiro, Probel, Electrolux, Escuta o Véio | fontes primárias e revisão factual reforçada |
| HIGH | Cobasi saúde, Cicatribem, Pibe, GLNC, suplementação da Rosário | fontes confiáveis + revisão especializada |
| CRITICAL | medicamentos, diagnóstico, dose, reparo elétrico/gás, orientação estrutural definitiva | não autopublicar; rejeitar ou exigir fluxo excepcional |

## 8. Métricas de sucesso

- taxa de páginas aprovadas e indexadas;
- impressões e cliques não relacionados à marca;
- CTR orgânico por template;
- cliques afiliados por 1.000 sessões;
- conversão/revenue quando o programa disponibilizar retorno;
- páginas stale e tempo até atualização;
- falhas de afiliado, que devem permanecer em zero em produção;
- canibalização, páginas órfãs e exclusões do índice;
- custo de IA por página publicada;
- receita e margem editorial por cluster.

## 9. Portões de escala

1. `BOOTSTRAP`: taxonomia e rascunhos.
2. `PILOT`: 10–36 páginas conforme programa.
3. `OBSERVE`: 8–12 semanas.
4. `EXPAND`: lotes de 10–20 URLs apenas em clusters validados.
5. `SCALE`: maior cadência somente com indexação, qualidade e conversão sustentáveis.

