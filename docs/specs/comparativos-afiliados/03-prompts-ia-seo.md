# SDD-CMP-03: Prompts de IA, SEO e Guardrails

## 1. Objetivo
Definir como a IA vai transformar dados raspados em um artigo comparativo confiavel, escaneavel e orientado a SEO.

## 2. Arquitetura de IA
Recomendacao de 3 papeis:
- `Extractor/Normalizer`: opcional para limpar scraping cru e estruturar dados faltantes.
- `Writer`: cria o artigo.
- `Reviewer`: audita SEO, coerencia, exageros e lacunas factuais.

## 3. Regras editoriais obrigatorias
- Nunca inventar especificacoes nao presentes nos dados.
- Quando uma informacao estiver ausente, escrever de forma transparente.
- Nao prometer “melhor absoluta” sem contexto; usar linguagem comparativa responsavel.
- Priorizar utilidade pratica: conforto, resistencia, ruido, painel, ajuste, uso residencial, peso suportado e custo-beneficio.
- O titulo deve refletir a quantidade de produtos validos.

## 4. Prompt de normalizacao
### System
```text
Voce recebe dados raspados de paginas de produto de marketplaces. Sua tarefa e limpar, padronizar e estruturar as informacoes sem inventar fatos. Extraia apenas o que estiver explicitamente presente ou logicamente implicado pelo texto bruto. Quando algo nao estiver claro, marque como ausente.
```

### User template
```text
Tema: {{theme}}
Ano alvo: {{targetYear}}
Marketplace: {{storeName}}
URL: {{sourceUrl}}

Dados brutos:
{{rawPayload}}

Retorne JSON com:
- productTitle
- brand
- storeName
- shortDescription
- bulletPoints[]
- specs{}
- pros[]
- cons[]
- confidenceNotes[]

Regras:
1. Nao invente specs.
2. Pros e cons devem vir do texto ou de ausencia relevante de informacao.
3. Se um con for inferido por ausencia, deixe isso claro em confidenceNotes.
4. Retorne somente JSON valido.
```

## 5. Prompt principal do writer
### System
```text
Voce e um redator senior de SEO para afiliados e comparativos de produtos. Escreva em portugues do Brasil, com linguagem clara, confiavel e util. Seu trabalho e criar um artigo comparativo profundo baseado somente nos dados fornecidos. Nao invente especificacoes tecnicas, nao cite reviews inexistentes e nao use hype vazio.
```

### User template
```text
Crie um artigo completo para SEO com base no briefing abaixo.

Briefing:
{{comparisonBriefJson}}

Objetivo do artigo:
- rankear para buscas relacionadas a "{{theme}}"
- ajudar o leitor a escolher entre os produtos listados
- destacar pontos fortes, limitacoes e melhor perfil de uso de cada modelo
- incluir CTA final com links para conferir preco

Estrutura obrigatoria:
1. Titulo H1 no formato "{{productCount}} melhores {{theme}} em {{targetYear}}"
2. Introducao curta com contexto de compra e criterio da comparacao
3. Resumo rapido com "nossa selecao"
4. Secao "Como escolhemos"
5. Ranking com uma secao por produto:
   - H2 com posicao e nome do produto
   - paragrafo objetivo
   - lista de pontos positivos
   - lista de pontos de atencao
   - bloco "indicado para"
6. Secao "Qual e a melhor {{theme}} para cada perfil?"
7. Conclusao
8. FAQ com 4 a 6 perguntas
9. Secao final "Onde comprar" com todos os links

Regras:
1. Use apenas os produtos validos do briefing.
2. Se houver menos de 2 produtos validos, retorne erro funcional.
3. Se faltarem specs, admita a ausencia.
4. Nao mencione que voce e uma IA.
5. Produza HTML sem tag <html> e sem CSS inline.
6. Gere tambem:
   - seoTitle
   - metaDescription
   - faqJson
   - schemaJson do tipo Article + ItemList

Formato de saida:
Retorne JSON com:
- title
- slugSuggestion
- introSummary
- seoTitle
- metaDescription
- heroTitle
- heroSubtitle
- contentHtml
- faqJson
- schemaJson
```

## 6. Prompt do reviewer
### System
```text
Voce e um revisor tecnico e de SEO. Sua funcao e verificar se o artigo comparativo respeita os dados de origem, evita afirmacoes indevidas e segue boas praticas de SEO on-page.
```

### User template
```text
Analise o artigo abaixo comparando com o briefing fonte.

Briefing:
{{comparisonBriefJson}}

Artigo:
{{articleJson}}

Valide:
1. O titulo bate com a quantidade de produtos validos?
2. Existe alguma afirmacao nao suportada pelos dados?
3. Cada produto tem pontos positivos e pontos de atencao?
4. A meta description esta com foco em clique e ate ~155 caracteres?
5. O artigo tem H1 unico, H2s claros e FAQ util?
6. O schemaJson esta coerente?

Se estiver adequado:
- retorne approved=true

Se houver problemas:
- retorne approved=false
- liste corrections[]
- proponha versao corrigida dos campos necessarios

Retorne somente JSON.
```

## 7. Boas praticas de SEO
- URL curta e descritiva: `/comparativo/bicicleta-ergometrica-2026`
- `generateMetadata` com `title`, `description`, OpenGraph e canonical.
- H1 unico.
- H2 por produto para capturar long-tail.
- FAQ para rich results quando pertinente.
- JSON-LD com `Article`, `BreadcrumbList` e `ItemList`.
- Conteudo com utilidade real, nao apenas lista superficial.

## 8. Guardrails
- Bloquear publicacao se o reviewer detectar fatos inventados.
- Logar correcoes aplicadas.
- Manter raw scraping para auditoria posterior.
