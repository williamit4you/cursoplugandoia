# Planejamento - Rotina Mercado Livre Afiliados (2026-05-04)

## Objetivo
- Criar uma rotina diaria para consultar produtos no Mercado Livre.
- Selecionar ate 8 itens por rodada.
- Criar uma propaganda curta por produto usando o fluxo existente de `Propagandas`.
- Preparar publicacoes para YouTube Shorts, Instagram Reels e TikTok com intervalo padrao de 2 horas.
- Guardar credenciais e parametros em uma tela administrativa.

---

## Pesquisa e decisoes
- A busca de produtos pode usar APIs oficiais do Mercado Livre:
  - `GET /sites/{SITE_ID}/search`
  - `GET /items?ids=...`
  - documentacao: https://developers.mercadolivre.com.br/pt_br/publicacao-de-produtos/itens-e-buscas
- OAuth do Mercado Livre usa `access_token` com validade curta e `refresh_token` de uso unico a cada renovacao.
  - documentacao: https://developers.mercadolivre.com.br/en_us/public-and-private-resources/authentication-and-authorization
- O proprio Mercado Livre documenta a geracao de links de afiliado pela Central/Barra de Afiliados, nao como API publica simples.
  - ajuda: https://www.mercadolivre.com.br/ajuda/30084
  - landing: https://www.mercadolivre.com.br/l/afiliados-gere-seus-links

### Decisao profissional
- Usar API oficial para descobrir produtos.
- Nao depender inicialmente de endpoint privado capturado no DevTools para gerar link afiliado.
- Permitir configurar um `affiliateUrlTemplate` validado pelo usuario no Portal do Afiliado.
- Guardar cookie/token do Link Builder apenas como dado de configuracao para uma fase futura, se for aprovado usar esse caminho.

---

## MVP implementado
- Nova tabela `MercadoLivreAffiliateConfig`.
- Nova tabela `MercadoLivreAffiliatePick`.
- Nova tela admin: `/admin/mercado-livre`.
- API de configuracao: `/api/mercado-livre/config`.
- API de preview de produtos: `/api/mercado-livre/products`.
- API de execucao manual/cron: `/api/mercado-livre/run`.
- Integracao com `CodeVideoProject` usando `projectType = PRODUCT_AD`.
- Ao renderizar uma propaganda criada pela rotina, o sistema cria `SocialPost` agendado para as plataformas escolhidas.

---

## Fluxo operacional
1. Admin configura Mercado Livre em `/admin/mercado-livre`.
2. Admin informa termos de busca, limites de preco, plataformas e intervalo.
3. Admin informa modo de link afiliado:
   - template validado;
   - parametro `aff_id` apenas se confirmado no Mercado Livre;
   - ou permalink comum enquanto aguarda validacao.
4. Rotina consulta produtos.
5. Para cada produto selecionado:
   - cria `MercadoLivreAffiliatePick`;
   - cria `CodeVideoProject` do tipo `PRODUCT_AD`;
   - gera roteiro automaticamente, se habilitado;
   - renderiza video automaticamente, se habilitado.
6. Quando o video e renderizado:
   - cria posts sociais com `scheduledTo`;
   - agenda o primeiro item para agora e os seguintes a cada 2 horas.

---

## Credenciais necessarias
- Mercado Livre:
  - App ID / Client ID, se usar OAuth.
  - Client Secret, se usar OAuth.
  - Access Token inicial, se ja tiver.
  - Refresh Token inicial, para renovacao segura.
  - Etiqueta/tag de afiliado.
  - Template de URL afiliada validado no Portal do Afiliado.
- YouTube:
  - Client ID, Client Secret e OAuth ja configurados no Hub de Integracoes.
- Instagram/Facebook:
  - Token Meta, Page ID e Instagram Business Account ID.
- TikTok:
  - Access Token com permissao de publicacao.

---

## Fase 2 recomendada
- Criar job/daemon dedicado para executar `/api/mercado-livre/run` uma vez ao dia.
- Criar processador de posts agendados para publicar automaticamente quando `scheduledTo <= now`.
- Investigar com conta real se existe endpoint oficial/liberado para gerar links afiliados automaticamente.
- Se o Mercado Livre autorizar o uso de Link Builder via sessao, criar um adaptador isolado, com expiracao e alerta quando cookie/token vencer.
- Adicionar score de produto com base em vendas, preco, frete e categoria.
