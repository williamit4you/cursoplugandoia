# Vitrine e Link da Bio

Status:

- OK Rotas publicas `/bio` e `/bio/[slug]`.
- OK Busca e filtro (querystring) no `/bio`.
- OK Tracking de cliques via `/api/bio/click`.
- OK Regra automatica: cria produto quando atinge `AFFILIATE_LINK_READY`.

## Objetivo

Criar uma vitrine publica para onde os videos apontam quando dizem que o produto esta no link da bio.

## Experiencia desejada

A vitrine deve funcionar como um mini e-commerce de afiliados:

- lista de produtos;
- categorias;
- busca rapida;
- pagina de produto;
- video usado na propaganda;
- imagem principal;
- botao de compra com link afiliado;
- destaque para produtos recentes ou em alta.

## Rotas sugeridas

```txt
/bio
/bio/produto/[slug]
/bio/categoria/[slug]
```

## Entidades

### Produto

Ver `bio_products` em `01-modelo-dados.md`.

### Categoria

Campos:

- `id`
- `name`
- `slug`
- `active`
- `sortOrder`
- `createdAt`
- `updatedAt`

### Tracking de clique

Campos:

- `id`
- `bioProductId`
- `source`
- `userAgent`
- `ipHash`
- `createdAt`

## Regra de publicacao

Quando um item atingir `AFFILIATE_LINK_READY` ou `READY_FOR_STORY`, criar/atualizar produto na vitrine.

## Ponto em aberto

Ainda precisa validar se a vitrine oficial da Shopee permite inserir automaticamente o produto afiliado. Ate essa confirmacao, a plataforma propria deve ser considerada a solucao principal.
