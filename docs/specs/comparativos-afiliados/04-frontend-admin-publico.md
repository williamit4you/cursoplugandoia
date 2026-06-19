# SDD-CMP-04: Frontend Admin e Publico

## 1. Objetivo
Desenhar a nova experiencia admin e as paginas publicas do modulo de comparativos.

## 2. Navegacao admin
Adicionar novo item no `menuItems` de `app/(admin)/admin/layout.tsx` logo abaixo de `Agendamentos`.

Item proposto:
- texto: `Comparativos`
- path: `/admin/comparativos`
- icone: `Balance` ou `CompareArrows`

## 3. Tela admin principal
Rota:
- `app/(admin)/admin/comparativos/page.tsx`

Blocos:
- header com titulo, resumo e botao `Novo comparativo`
- filtros por status e busca por tema/slug
- tabela com:
  - titulo
  - tema
  - quantidade de links
  - quantidade valida
  - status
  - data de criacao
  - acao `Abrir`
  - acao `Reprocessar`

## 4. Tela de criacao
Rotas sugeridas:
- `app/(admin)/admin/comparativos/new/page.tsx`
- ou drawer/modal dentro da listagem no MVP

Campos:
- `theme` obrigatorio
- `targetYear` opcional, default ano corrente
- lista dinamica de links
- preview do slug sugerido

UX:
- botao `Adicionar link`
- validacao inline por dominio suportado
- contador de links validos
- submit dispara `POST /api/comparativos`

## 5. Tela de detalhe admin
Rota:
- `app/(admin)/admin/comparativos/[id]/page.tsx`

Secoes:
- resumo do comparativo
- status do pipeline
- itens cadastrados e seus resultados de scraping
- timeline de eventos
- preview do artigo final
- botao `Publicar/Reprocessar`

## 6. Paginas publicas
Rotas:
- `app/(public)/comparativo/page.tsx`
- `app/(public)/comparativo/[slug]/page.tsx`

Lista publica:
- cards com titulo, resumo, contagem de produtos e data
- pagina indexavel

Detalhe publico:
- breadcrumb
- H1 forte
- resumo/hero
- indice opcional
- ranking renderizado do HTML salvo
- secao final com todos os links afiliados
- disclaimer curto: links podem gerar comissao

## 7. SEO tecnico no frontend
- `generateMetadata` por slug, igual ao padrao de `noticias`.
- canonical para a propria URL.
- OpenGraph com `seoTitle`, `metaDescription` e imagem destacada quando houver.
- `revalidate = 0` ou `force-dynamic` no MVP; depois migrar para ISR se desejado.

## 8. Componentes sugeridos
- `components/comparisons/ComparisonTable.tsx`
- `components/comparisons/ComparisonForm.tsx`
- `components/comparisons/ComparisonTimeline.tsx`
- `components/comparisons/PublicComparisonCard.tsx`
- `components/comparisons/PublicComparisonContent.tsx`

## 9. Observacoes de UX
- Como essa area entra abaixo de `Agendamentos`, manter mesma linguagem visual do admin atual.
- O botao `Novo` precisa ficar imediatamente visivel no topo da listagem.
- Mostrar claramente quando algum link falhou para o usuario poder trocar a origem.
