# Merge, Afiliado e Story

Status:

- OK Merge automatico (concat original + copy).
- OK Link afiliado (gera e persiste `affiliateUrl`).
- OK Story propaganda (cria `story_ads` e `story_publications`, agenda +30min).

## Merge automatico

Objetivo:

- pegar o video da propaganda obtido no scraping;
- pegar o video da copy;
- unir automaticamente;
- salvar resultado final no MinIO;
- gravar `finalVideoUrl` na URL/post.

## Entradas

- `mediaVideoUrls[0]` ou video principal escolhido;
- `copyVideoUrl`;
- metadados do produto;
- formato final desejado.

## Saida

- `finalVideoUrl`;
- duracao final;
- payload de processamento;
- logs do render.

## Regras

- Se nao existir video original da Shopee, decidir fallback:
  - usar imagens do produto para montar abertura;
  - ou marcar como `FAILED` com erro humano.
- Se `finalVideoUrl` ja existe, nao renderizar novamente sem acao manual.
- O armazenamento deve seguir o padrao atual de videos manuais.

## Fluxo manual atual (referencia)

Status:

- OK Documentado (resumo).

Resumo:

1. Escolher video principal do produto (primeiro em `mediaVideoUrls`).
2. Gerar `copyVideoUrl` (Infinite Talk).
3. Concatenar (original sem audio + copy com audio) em 1080x1920.
4. Subir MP4 final no MinIO e persistir em `ColetaDadosShoppe.videoFinalUrl`.

## Link afiliado

Depois do video final:

- usar `originalUrl`;
- gerar link afiliado com integracao Shopee ja existente quando possivel;
- gravar `affiliateUrl`;
- registrar request e response.

Arquivos relevantes existentes:

- `lib/shopee/openApi.ts`
- `app/api/shopee/generate-link/route.ts`
- `app/api/shopee/run/route.ts`

## Story propaganda

Ao concluir video final e link afiliado, criar `story_ads`.

Campos minimos:

- titulo;
- descricao;
- video final;
- link afiliado;
- horario de postagem.

Regra inicial:

- `scheduledAt = now + 30 minutes`

## Publicacoes sociais

Criar uma linha por plataforma em `story_publications`.

Plataformas:

- TikTok;
- YouTube;
- Instagram.

Cada plataforma deve registrar:

- tentativa;
- request;
- response;
- ID externo;
- URL publicada;
- erro;
- proximo retry.
