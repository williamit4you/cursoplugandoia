# SEO, templates e sitemap

## 1. Regra de intenção única

Cada URL possui uma intenção principal. Antes de criar página, o sistema compara keyword, entidades, SERP intent registrada, outline e conteúdo existente. Quando outra URL satisfaz a intenção, a pauta é anexada como atualização ou seção, não publicada separadamente.

Filtros e cruzamentos ficam `noindex,follow` por padrão. Tornam-se páginas somente com demanda, proposta própria, conteúdo editorial e links internos naturais.

## 2. Campos SEO obrigatórios

- `seoTitle` exclusivo e coerente com o H1;
- `metaDescription` exclusiva;
- `primaryKeyword` e intenção;
- `canonicalPath` único;
- H1 único;
- H2 e H3 em hierarquia válida;
- introdução com resposta direta;
- autor, revisores e datas;
- fontes;
- disclosure antes do primeiro CTA;
- pelo menos um link ao hub, dois links contextuais de saída e um link interno de entrada planejado;
- imagem principal com licença, alt, largura e altura quando o template exigir imagem;
- JSON-LD coerente com o conteúdo visível.

Não existe quantidade fixa universal de palavras. O `minimumWords` é piso de triagem por tipo, nunca autorização para texto repetitivo.

## 3. Templates

### Hub / `CollectionPage`

```text
H1: tema central
Introdução e mapa de decisão
H2: subtemas
  H3: quando acessar cada guia
H2: destaques/recentes
H2: como o conteúdo é avaliado
H2: perguntas frequentes
```

### Guia informativo / `Article`

```text
H1: pergunta ou necessidade
Resposta curta
H2: conceitos/critérios
  H3: detalhes e exemplos
H2: passo a passo seguro
H2: erros/limitações
H2: próximos guias
FAQ + fontes
```

### Guia de compra

```text
H1: como escolher [categoria]
Resposta e perfil atendido
Disclosure
H2: critérios objetivos
  H3: critério por critério
H2: opções por perfil/uso
H2: o que confirmar antes de comprar
H2: metodologia e atualização
CTA contextual + relacionados + fontes
```

### Comparativo

```text
H1: A x B
Resumo sem vencedor universal
Tabela acessível
H2: critérios
  H3: desempenho de A e B em cada critério
H2: para quem cada opção pode fazer sentido
H2: limitações e método
CTAs independentes + fontes + data
```

### Review/análise

```text
H1: produto/modelo — análise
Declaração se houve ou não teste prático
H2: ficha/rótulo comprovado
H2: proposta do fabricante
H2: pontos fortes e limitações verificáveis
H2: preço/disponibilidade observados
H2: o que confirmar
CTA + fontes
```

### Local

```text
H1: necessidade + cidade/UF
Disclosure independente
H2: contexto local comprovado
H2: opções e critérios
H2: retirada/entrega/unidade, somente com fonte atual
H2: categorias relevantes
H2: atualização e fontes
```

Páginas locais exigem blocos substancialmente próprios e comparação de similaridade. Troca de cidade em template é bloqueada.

### Sazonal

Inclui ano somente quando o conteúdo foi revisado para esse ano. Deve ter `publishWindowStart`, `publishWindowEnd` e próxima revisão.

### Ferramenta

Ferramenta explica entradas, fórmula, limites e caráter estimativo. Resultado não pode diagnosticar saúde, estrutura ou prescrever produto. A página possui conteúdo acessível mesmo sem JavaScript quando possível.

## 4. Dados estruturados

- `Article` ou `BlogPosting`: guias, reviews e comparativos;
- `CollectionPage`: hubs;
- `BreadcrumbList`: todas as páginas públicas;
- `FAQPage`: somente quando FAQ está visível e elegível às políticas vigentes;
- `Product`: apenas se a página exibe produto identificável e dados atuais;
- `ItemList`: ranking/lista com itens visíveis e método;
- `LocalBusiness`: somente dados verificados de unidade real, sem afirmar propriedade do Compra Esperta;
- não usar `Review`/`AggregateRating` sem avaliação própria comprovável.

## 5. Sitemap

Elegibilidade:

```text
status=PUBLISHED
AND indexable=true
AND canonicalPath válido
AND conteúdo/revisão aprovados
AND programa e loja ativos
AND fontes críticas válidas
AND página pública responde 200
```

Estrutura alvo:

```text
/sitemap.xml                 # índice
/sitemaps/pets.xml
/sitemaps/revenda-moda.xml
/sitemaps/casa-e-cozinha.xml
/sitemaps/skincare.xml
/sitemaps/suplementos-gummies.xml
/sitemaps/colecionaveis.xml
/sitemaps/colchoes.xml
/sitemaps/termicos.xml
/sitemaps/reforma.xml
/sitemaps/nutricao.xml
/sitemaps/moda-masculina.xml
/sitemaps/cuidados-pessoais.xml
```

Enquanto o volume for pequeno, `/sitemap.xml` pode agregar tudo. A separação é ativada por configuração sem mudar a regra de elegibilidade.

Excluir rascunho, preview, `noindex`, redirect, 404, filtro, busca interna, página stale crítica, canonical para outra URL e conteúdo cuja loja foi pausada. `lastmod` muda apenas com alteração material.

## 6. Links internos

- hub aponta para filhos prioritários;
- filho retorna ao hub;
- informacional aponta ao próximo passo da jornada;
- comercial recebe links de páginas de consideração;
- não inserir blocos massivos de âncoras exatas;
- não criar página pública sem pelo menos um link interno de entrada;
- auditor diário encontra órfãs, links quebrados e excesso de repetição de âncora.

## 7. Qualidade e originalidade

Score é diagnóstico, não substituto de revisão. Publicação exige:

- cobertura da intenção;
- informação verificável;
- valor adicional ao catálogo;
- ausência de paráfrase extensa da fonte;
- exemplos e critérios específicos do nicho;
- linguagem natural em português do Brasil;
- similaridade abaixo do limite por template;
- nenhum trecho ou fato inventado para completar tamanho.

## 8. Atualização e desindexação

- preço/estoque: validade configurável, normalmente 24–72 horas;
- fatos comerciais e catálogo: 30 dias;
- unidades/horários: até 90 dias;
- conteúdo sazonal: antes de cada janela;
- guias estáveis: 180 dias;
- saúde/técnico: revisão antecipada quando fonte ou regra mudar.

Página vencida pode continuar publicada se o fato vencido for removido com segurança. Se a informação for central, fica `STALE`, sai do sitemap e entra na fila de revisão.

