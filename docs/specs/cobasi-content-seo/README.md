# Programa editorial pet e SEO local

Status: planejamento aprovado para implementação incremental

Site: `https://compraesperta-promocoes.shop`

Última revisão: 5 de agosto de 2026

Escopo inicial: produtos vendidos pela Cobasi e 97 cidades informadas pelo proprietário do site

Programa: `COBASI_PET`

Loja: `cobasi`

CTA: `/go/loja/cobasi`

Integração multi-loja: [Plataforma de marketing de conteúdo afiliado](../affiliate-content-programs/README.md)

## Objetivo

Construir autoridade orgânica para o Compra Esperta no mercado pet sem depender, na etapa inicial, da palavra-chave de marca “Cobasi”. O tráfego deve ser conquistado por necessidades reais do consumidor: espécie, categoria, fase de vida, porte, raça, problema que o produto ajuda a resolver, comparação e localização.

Toda página deve ajudar o leitor antes de apresentar a oferta. A monetização acontece somente por meio do cadastro da Cobasi na tabela `AffiliateStore`; nenhum autor, template ou agente de IA pode inserir diretamente um URL comercial externo.

## Documentos deste programa

1. [Estratégia editorial e SEO](./01-estrategia-editorial-seo.md): arquitetura, clusters, modelos de página, on-page SEO, dados estruturados, links internos, qualidade, compliance e mensuração.
2. [Inventário de cidades](./02-inventario-cidades.md): lista normalizada das 97 localidades, slugs previstos e condições para publicação.
3. [Plano de implementação](./03-plano-implementacao.md): fases, backlog técnico/editorial, critérios de aceite, sitemap e testes obrigatórios.

## Decisões inegociáveis

### 1. Regra absoluta do link afiliado

- A única fonte de verdade é o registro `AffiliateStore.slug = "cobasi"` no banco.
- O cadastro atual aponta para `https://minhaloja.cobasi.com.br` e contém `utm_source=mais`, `utm_medium=maisplataforma` e `utm_campaign=willianbarata`.
- Todo CTA comercial renderizado no site deve apontar primeiro para uma rota interna no formato `/go/loja/cobasi?...`.
- A rota interna consulta o banco e combina o destino permitido com os parâmetros do link afiliado. Autores e páginas nunca devem copiar ou reconstruir UTMs manualmente.
- Se a loja estiver ausente, pausada, bloqueada, com URL inválida ou com parâmetros obrigatórios ausentes, a publicação deve falhar. Não existe fallback para URL comum da Cobasi.
- Links pagos recebem `rel="sponsored"`; quando abrirem nova aba, também recebem `noopener noreferrer`.
- Conteúdo editorial pode ter links internos e links para fontes não comerciais, mas não pode conter `cobasi.com.br`, `minhaloja.cobasi.com.br` ou encurtadores no corpo.
- Um teste automatizado deve varrer HTML e conteúdo armazenado antes de publicar. Qualquer link comercial que não comece com `/go/loja/cobasi` bloqueia a publicação.

### 2. Marca secundária na aquisição inicial

- Os títulos, H1, slugs e palavras-chave principais da primeira etapa não usarão “Cobasi”.
- A marca pode aparecer de maneira factual no disclosure, no CTA e na explicação de que a loja é parceira, sem sugerir que o Compra Esperta é canal oficial.
- Não usar o nome ou identidade visual da marca de forma que gere confusão sobre propriedade, atendimento, estoque ou representação.
- Páginas de marca e consultas como “Cobasi Campinas” ficam para uma fase posterior, condicionada às regras vigentes do programa de afiliados e à aprovação do proprietário.

### 3. Publicação por qualidade, não por volume

- Não serão publicadas 97 páginas locais de uma vez.
- Trocar apenas o nome da cidade é proibido.
- Uma URL nova nasce como rascunho e `noindex`. Só entra no sitemap depois de revisão factual, editorial, afiliada e técnica.
- Filtros automáticos não geram páginas indexáveis por padrão. Uma combinação só ganha URL canônica e indexação quando houver demanda, conteúdo próprio e utilidade além de uma listagem.
- Páginas de saúde, medicamentos, doenças, antipulgas e vermífugos exigem fontes confiáveis, linguagem não diagnóstica e revisão especializada antes de indexação.

## Arquitetura-alvo resumida

```text
/
└── /pets
    ├── /cachorros
    │   ├── /racao
    │   ├── /petiscos
    │   ├── /brinquedos
    │   ├── /camas
    │   └── /transporte
    ├── /gatos
    │   ├── /racao
    │   ├── /areia
    │   ├── /arranhadores
    │   ├── /fontes-de-agua
    │   └── /transporte
    ├── /peixes
    ├── /passaros
    ├── /jardim
    ├── /casa
    ├── /guias
    ├── /comparativos
    └── /pet-shop
        └── /{cidade}-{uf}
```

Os hubs fazem a navegação vertical e as páginas locais se conectam apenas a categorias relevantes para aquela cidade. Cada artigo liga de volta ao seu hub e a duas ou mais páginas irmãs úteis, sem blocos de links artificiais.

## Meta inicial

O primeiro ciclo entrega de 18 a 24 páginas indexáveis, não 1.500:

- 1 hub `/pets`;
- 2 hubs de espécie: cães e gatos;
- 6 hubs de categoria prioritária;
- 6 guias ou comparativos de alta intenção;
- 3 a 9 páginas locais piloto, conforme disponibilidade de dados realmente exclusivos.

Depois de 8 a 12 semanas de dados no Search Console, o programa amplia apenas os formatos que demonstrarem impressões, posição, engajamento e cliques afiliados com qualidade.

## Fontes normativas

- [Políticas de spam da Pesquisa Google](https://developers.google.com/search/docs/essentials/spam-policies?hl=pt-br)
- [Orientação do Google sobre conteúdo de IA generativa](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- [Como criar e enviar um sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Qualificação de links externos e `rel="sponsored"`](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)
- [Boas práticas para títulos](https://developers.google.com/search/docs/appearance/title-link)
- [Boas práticas para meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Dados estruturados de negócio local](https://developers.google.com/search/docs/appearance/structured-data/local-business)
