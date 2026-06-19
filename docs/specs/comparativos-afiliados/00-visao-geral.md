# SDD-CMP-00: Visao Geral

## 1. Objetivo
Criar uma nova vertical do sistema para gerar artigos comparativos a partir de links de afiliados informados manualmente pelo admin.

Exemplo:
- tema informado: `bicicleta ergometrica`
- quantidade de links enviados: `8`
- artigo gerado: `8 melhores bicicletas ergometricas em 2026`
- listagem publica: `/comparativo`
- detalhe publico: `/comparativo/bicicleta-ergometrica-2026`

## 2. Problema de negocio
Hoje ja temos pipelines de scraping, publicacao e conteudo. Falta uma rotina focada em SEO evergreen para afiliacao, onde:
- o usuario informa um tema e varios links;
- o sistema coleta dados de cada produto;
- a IA cria um comparativo estruturado, util e rastreavel;
- o artigo e publicado sem login, com links de compra no final.

## 3. Escopo funcional
- Nova aba admin `Comparativos` abaixo de `Agendamentos`.
- CRUD basico de comparativos.
- Cadastro de tema principal e links dinamicos.
- Scraping por item com captura de titulo, descricao, bullets, preco, imagem, loja e atributos tecnicos.
- Normalizacao dos dados por produto.
- Geracao de artigo comparativo com SEO.
- Paginas publicas indexaveis para lista e detalhe.
- Secao final com links afiliados.
- Reprocessamento manual caso scraping/IA falhe.

## 4. Fora de escopo do MVP
- Importacao automatica de links por CSV.
- Publicacao automatica em redes sociais.
- Captura de reviews externas em larga escala.
- A/B testing de titulo e CTA.
- Traducoes multilanguage.

## 5. Premissas tecnicas
- O projeto usa `Next.js App Router`, `Prisma` e `PostgreSQL`.
- Ja existe padrao de admin em `app/(admin)/admin/*`.
- Ja existe padrao de publicacao publica em `app/(public)/noticias/*`.
- Ja existem experiencias de scraping em Shopee e Mercado Livre que podem ser reaproveitadas.
- O fluxo deve suportar Amazon, Shopee e Mercado Livre, mas com extratores desacoplados por dominio.

## 6. Fluxo fim a fim
1. Admin abre `/admin/comparativos`.
2. Clica em `Novo`.
3. Informa tema base, ano alvo opcional e adiciona N links.
4. Ao salvar, o sistema cria o comparativo em status `DRAFT`.
5. O backend cria os itens filhos e ja agenda o processamento.
6. O orquestrador executa:
   - validacao de links;
   - scraping por produto;
   - normalizacao dos dados;
   - consolidacao do briefing;
   - geracao do artigo com IA;
   - revisao automatica SEO;
   - publicacao.
7. O artigo fica disponivel em `/comparativo/[slug]`.
8. A pagina lista todos os comparativos publicados em `/comparativo`.

## 7. Requisitos de conteudo
- A quantidade do titulo deve refletir a quantidade real de links validos.
- O texto deve comparar modelo por modelo.
- Cada produto deve ter pontos fortes e pontos fracos.
- A conclusao deve orientar perfis de uso.
- Os links afiliados ficam no final, em secao clara de CTA.
- O sistema nao deve inventar especificacoes ausentes; quando faltarem dados, deve declarar isso.

## 8. Requisitos nao funcionais
- SEO tecnico com metadata, canonical, headings, FAQ opcional e schema.org.
- Idempotencia para nao duplicar comparativos acidentalmente.
- Rastreamento de falhas por item e por etapa.
- Slug consistente e legivel.
- Reprocessamento parcial sem perder links cadastrados.
