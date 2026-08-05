# Estratégia editorial e SEO

## 1. Posicionamento

O Compra Esperta será um guia independente de decisão de compra. A proposta não é replicar o catálogo da loja, nem fingir ser uma unidade oficial. O conteúdo deve responder perguntas, organizar opções, mostrar critérios de escolha, explicar limites e encaminhar o leitor para conferir preço, disponibilidade e condições atuais pelo link afiliado.

Mensagem editorial recomendada:

> O Compra Esperta produz guias independentes e pode receber comissão quando uma compra é feita por um link de parceiro, sem custo adicional para o leitor. Preço, estoque, entrega e regras da oferta devem ser confirmados na loja.

## 2. Públicos e jornadas

| Jornada | Consulta típica | Conteúdo indicado | CTA |
|---|---|---|---|
| Descoberta | “como escolher areia para gato” | guia informativo | ver opções adequadas |
| Consideração | “ração premium ou super premium” | explicação/comparativo | comparar opções na loja |
| Compra | “melhor ração para cachorro filhote” | guia de compra | conferir produtos e condições |
| Local | “onde comprar produtos pet em Campinas” | guia local original | comprar online / conferir unidade |
| Produto | “Premier ou Royal Canin” | comparação factual | conferir cada opção |
| Necessidade | “ração para cachorro idoso de porte pequeno” | página de seleção explicada | ver produtos compatíveis |

“Melhor” só pode ser usado quando a página explica critérios, público, limitações e método. Nunca declarar um vencedor universal sem evidência.

## 3. Arquitetura de tópicos

### 3.1 Hubs principais

- `/pets`: porta de entrada do universo pet.
- `/pets/cachorros`: alimentação, higiene, passeio, descanso, transporte e cuidados.
- `/pets/gatos`: alimentação, areia, hidratação, enriquecimento ambiental, descanso e transporte.
- `/pets/peixes`: aquários, alimentação, filtragem e manutenção.
- `/pets/passaros`: alimentação, viveiros, higiene e enriquecimento.
- `/jardim`: plantas, ferramentas e manutenção.
- `/casa`: organização, limpeza e utilidades relacionadas ao catálogo.
- `/pets/guias`: índice de conteúdos informativos e de compra.
- `/pets/comparativos`: índice de comparações.
- `/pet-shop`: índice geográfico por UF e cidade.

### 3.2 Categorias prioritárias

Começar com demanda ampla e baixo risco editorial:

1. ração para cachorro;
2. ração para gato;
3. petiscos;
4. brinquedos;
5. areia para gato;
6. camas;
7. caixas de transporte;
8. arranhadores;
9. fontes de água;
10. acessórios de passeio.

Medicamentos, antipulgas, vermífugos, dietas terapêuticas e páginas de doenças não entram no primeiro ciclo.

### 3.3 Subcategorias válidas

Uma subcategoria deve combinar intenção comprovada e conteúdo explicativo próprio. Exemplos:

- idade: filhote, adulto, idoso;
- porte: pequeno, médio, grande;
- formato: seca, úmida, natural;
- faixa de posicionamento: econômica, premium, super premium;
- necessidade: sensibilidade alimentar, controle de peso, castrados — sempre com linguagem cuidadosa;
- raça: somente quando houver diferenças relevantes documentáveis, sem multiplicar o mesmo texto para dezenas de raças;
- preço: páginas de faixa de preço só quando preços forem obtidos e atualizados de forma confiável; caso contrário, usar “custo-benefício” com metodologia, não “barata”.

### 3.4 Clusters

Exemplo do cluster Gatos:

```text
/pets/gatos
├── /pets/gatos/melhor-racao
├── /pets/gatos/areia
│   ├── /pets/comparativos/areia-pipicat-ou-viva-verde
│   └── /pets/guias/como-escolher-areia-para-gato
├── /pets/gatos/arranhadores
├── /pets/gatos/fontes-de-agua
├── /pets/gatos/brinquedos
├── /pets/gatos/camas
└── /pets/gatos/caixas-de-transporte
```

Cada página filha liga ao hub de Gatos. O hub liga às filhas prioritárias. Artigos relacionados criam links laterais apenas quando ajudam a próxima decisão do leitor.

### 3.5 Filtros e facetas

Os filtros previstos são idade, raça, porte, faixa de preço, marca, necessidade, tipo de alimentação e categoria. Eles servem primeiro para experiência de navegação; não criam automaticamente páginas SEO.

- combinações de query string permanecem `noindex,follow` e apontam canonical para a categoria principal;
- ordenação, paginação alternativa e múltiplos filtros não entram no sitemap;
- uma faceta só vira landing page estática quando houver demanda comprovada, conjunto suficiente de produtos, texto editorial exclusivo e links internos;
- facetas vazias ou com poucos itens respondem como indisponíveis e nunca são indexadas;
- preço e disponibilidade devem vir de fonte atualizável; se não houver atualização confiável, não criar páginas por preço;
- a equipe mantém uma allowlist de combinações indexáveis para evitar explosão de crawl e conteúdo duplicado.

## 4. Estratégia local

### 4.1 URL e intenção

Padrão inicial: `/pet-shop/{cidade}-{uf}`. Exemplos:

- `/pet-shop/sao-paulo-sp`;
- `/pet-shop/campinas-sp`;
- `/pet-shop/curitiba-pr`;
- `/pet-shop/goiania-go`.

Keyword principal: “onde comprar produtos pet em {cidade}” ou “pet shop em {cidade}”. A marca não entra no slug, title ou H1 inicial.

### 4.2 Conteúdo mínimo exclusivo de uma página local

Uma página local só pode ser indexada quando possuir, de maneira verificável:

- panorama útil da compra pet na localidade;
- bairros ou regiões atendidas, sem inventar cobertura;
- uma ou mais unidades verificadas, com endereço e fonte/data da conferência;
- horário atualizado, apenas se houver fonte oficial e data de verificação;
- informação factual sobre retirada, entrega ou compra online, quando confirmada;
- categorias mais úteis para o contexto local, justificadas e não inferidas como dado de vendas;
- orientação de acesso ou mapa somente com licença e origem adequadas;
- perguntas frequentes próprias da cidade;
- links para guias de produto relevantes;
- disclosure de independência e CTA afiliado.

Sem esses dados, a cidade fica no inventário como `DRAFT` ou `NOINDEX`, não no sitemap.

### 4.3 O que não fazer

- publicar 97 textos com o mesmo corpo e trocar cidade/UF;
- criar afirmações genéricas sobre clima, hábitos ou raças “populares” sem dados;
- chamar uma unidade de “mais próxima” sem localização do usuário;
- copiar descrições do localizador oficial;
- inventar horário, telefone, estoque, serviços, promoções ou estacionamento;
- embutir mapa sem uma unidade e um endereço verificados;
- marcar o Compra Esperta como proprietário das lojas;
- usar avaliações ou estrelas que o site não coletou e não exibe.

### 4.4 Dados estruturados locais

Por padrão, a página local usa `CollectionPage` + `BreadcrumbList`. `LocalBusiness`/`PetStore` só pode representar uma unidade realmente descrita na página e deve conter dados visíveis, exatos e datados. Nunca usar esse schema para afirmar que a unidade pertence ao Compra Esperta. Quando houver várias unidades, usar `ItemList` com itens individuais verificados.

## 5. Templates editoriais

### 5.1 Página de categoria

- `<title>`: `Ração para cachorro: como escolher por idade e porte | Compra Esperta`
- H1 único: `Ração para cachorro: guia para escolher a opção certa`
- Introdução: intenção e resposta resumida.
- H2: `O que considerar antes de escolher`
  - H3: `Idade e fase de vida`
  - H3: `Porte e nível de atividade`
  - H3: `Ingredientes e necessidades específicas`
- H2: `Tipos de ração para cachorro`
- H2: `Como comparar custo por porção`
- H2: `Opções para diferentes perfis`
- H2: `Dúvidas frequentes`
- Bloco de relacionados e CTA afiliado.

### 5.2 Guia de compra

- H1 responde exatamente à intenção.
- Explicar método e critérios antes das recomendações.
- Para cada opção: “indicado para”, evidências disponíveis, limitações, pontos a conferir e CTA.
- H2 para grandes decisões; H3 para alternativas ou critérios dentro de cada decisão.
- Conclusão por perfil, nunca uma recomendação universal artificial.

### 5.3 Comparativo

- H1: `Premier ou Royal Canin: diferenças para comparar`
- H2: `Resumo das diferenças`
- tabela baseada somente em informações verificadas;
- H2: `Ingredientes e proposta de cada linha`
- H2: `Para quais perfis cada opção pode fazer sentido`
- H2: `Como decidir`
- H2: `Perguntas frequentes`
- CTAs separados, ambos passando pelo redirecionador afiliado.

Não usar comparação depreciativa, alegações clínicas ou superioridade não sustentada.

### 5.4 Página local

- `<title>`: `Onde comprar produtos pet em Campinas: guia local | Compra Esperta`
- H1 único: `Onde comprar produtos pet em Campinas`
- H2: `Opções para comprar produtos pet na cidade`
- H2: `O que você encontra para cães, gatos e outros pets`
  - H3 por categoria realmente disponível/verificada.
- H2: `Compra online, entrega e retirada: o que conferir`
- H2: `Unidades e regiões de Campinas`
  - H3 para cada unidade verificada, não para bairros inventados.
- H2: `Como escolher uma loja pet em Campinas`
- H2: `Dúvidas frequentes`
- CTA: `Conferir produtos pet e condições atuais`.

### 5.5 Hierarquia obrigatória de headings

- exatamente um H1 por página;
- H1 é o título visual principal e corresponde à intenção;
- H2 divide os assuntos principais;
- H3 detalha um H2 e nunca aparece sem H2 pai;
- não saltar de H1 para H3;
- não usar heading apenas para aumentar fonte;
- título, H1 e breadcrumb podem ser semanticamente próximos, mas não devem ser boilerplate enganoso;
- headings devem existir no HTML renderizado, não apenas em widgets ou imagens.

## 6. SEO on-page obrigatório

Cada página indexável deve ter:

- title exclusivo, descritivo e sem repetição de keyword;
- meta description exclusiva que resume a utilidade real;
- canonical absoluto e autorreferente;
- um H1;
- estrutura coerente de H2/H3;
- conteúdo principal presente no HTML/DOM;
- breadcrumb visível e `BreadcrumbList` equivalente;
- Open Graph com title, description, URL e imagem adequada;
- imagem original ou licenciada, com dimensões, formato otimizado e `alt` contextual;
- links internos com âncoras descritivas;
- disclosure comercial próximo ao primeiro CTA;
- CTAs `rel="sponsored"`;
- data de publicação, data de revisão e responsável editorial;
- fontes consultadas quando houver afirmações factuais;
- FAQ visível; `FAQPage` não será aplicado como promessa de rich result e só será usado se estiver de acordo com as regras vigentes;
- ausência de dados contraditórios ou não verificáveis.

Limites editoriais, não “fatores mágicos”:

- title geralmente entre 45 e 65 caracteres, podendo variar para preservar clareza;
- meta description geralmente entre 130 e 165 caracteres;
- slug curto, estável, sem acentos e sem palavras vazias desnecessárias;
- parágrafos escaneáveis, tabelas acessíveis e índice com âncoras em páginas longas;
- não definir quantidade fixa de palavras: a página deve cobrir a intenção sem encher espaço.

## 7. Links internos

Regras por tipo:

- página local: linka para o hub `/pet-shop`, 2–4 categorias e 1–3 guias locais/produto relevantes;
- categoria: linka para espécie pai, subcategorias válidas, 2–5 guias e comparativos;
- guia: linka para hub pai, 2 conteúdos irmãos e uma página de categoria comercial;
- comparativo: linka para páginas das categorias/produtos comparados e para o método de comparação;
- todos os filhos linkam de volta ao hub;
- páginas órfãs falham no preflight;
- âncoras como “clique aqui” devem ser evitadas.

Não criar rodapés com centenas de cidades. O hub local deve agrupar por UF e paginar ou expandir de forma navegável, mantendo os links importantes no HTML.

## 8. Sitemap, indexação e crawl

O projeto já gera `/sitemap.xml` dinamicamente e inclui apenas artigos `PUBLISHED`, `indexable = true`, com conteúdo e loja ativa. O novo programa deve manter esse padrão.

Regras:

- só incluir URL canônica com resposta HTTP 200;
- não incluir rascunho, redirect, 404, página `noindex`, filtro ou busca interna;
- `lastModified` reflete mudança material de conteúdo, não cada execução do sistema;
- sitemap inclui hubs, categorias, guias, comparativos e páginas locais aprovadas;
- após crescimento, separar índice em `sitemap-pages.xml`, `sitemap-pet-categories.xml`, `sitemap-guides.xml`, `sitemap-comparisons.xml` e `sitemap-local.xml`;
- manter cada arquivo abaixo de 50.000 URLs e 50 MB descompactado;
- enviar o índice ao Google Search Console e acompanhar descoberta/indexação por tipo;
- `robots.txt` deve apontar para o sitemap e bloquear apenas áreas sem valor de busca, nunca CSS/JS necessários à renderização;
- query strings de filtros devem usar canonical para a categoria principal ou `noindex,follow`, conforme o caso.

## 9. Dados estruturados

Usar JSON-LD apenas quando o conteúdo equivalente estiver visível:

- home: `Organization` ou `OnlineStore` para o Compra Esperta, com dados próprios;
- hubs/categorias: `CollectionPage` + `BreadcrumbList`;
- guias e comparativos editoriais: `Article` + `BreadcrumbList`;
- produto: `Product` somente com dados atuais e comprovados; não inventar preço, disponibilidade, avaliação ou frete;
- local: `CollectionPage`, `BreadcrumbList` e, se elegível, `ItemList`/`PetStore` com dados de terceiros exatos;
- não marcar CTA afiliado como `Offer` sem preço e disponibilidade confiáveis;
- validar cada template no Rich Results Test e no Schema Markup Validator.

## 10. Fontes e atualização

Hierarquia de evidência:

1. página oficial do produto ou fabricante;
2. rótulo/manual/ficha técnica;
3. página oficial da loja ou localizador de unidades;
4. órgãos públicos, conselhos profissionais e literatura técnica para saúde;
5. fontes secundárias confiáveis para contexto, nunca para copiar texto.

Cada fato sensível deve registrar URL, data de acesso e trecho/parâmetro sustentado. Conteúdo local deve ser revisto a cada 90 dias; guias de produto, a cada 180 dias ou quando o item mudar; preço/estoque nunca deve ser prometido no texto estático.

## 11. Governança de afiliados

### 11.1 Fonte única e construção do href

O componente de CTA recebe somente:

- `storeSlug = "cobasi"`;
- origem (`source`);
- posição/formato (`medium`);
- slug da página (`campaign`);
- destino de produto opcional.

Ele retorna `/go/loja/cobasi?...`. O servidor então:

1. busca loja ativa;
2. valida HTTPS e host da URL afiliada;
3. valida os parâmetros obrigatórios cadastrados;
4. aceita destino apenas em host explicitamente permitido;
5. injeta/preserva os parâmetros afiliados;
6. registra o clique;
7. redireciona com 302;
8. em qualquer falha, volta a uma página interna segura, nunca ao site externo sem tracking.

Observação técnica: hoje o resolvedor aceita apenas o mesmo hostname do cadastro. Como `minhaloja.cobasi.com.br` pode diferir do host das páginas de produto, qualquer liberação de hosts adicionais deve ser testada com o programa de afiliados; não se deve “corrigir” isso removendo os parâmetros ou usando URL comum.

### 11.2 Preflight de publicação

Bloquear quando:

- `affiliateStoreId` não for o registro da Cobasi;
- `AffiliateStore.status !== ACTIVE`;
- URL afiliada não for HTTPS;
- parâmetros de campanha obrigatórios estiverem ausentes;
- houver qualquer URL externa da Cobasi no JSON editorial/HTML;
- CTA não usar `/go/loja/cobasi`;
- `rel="sponsored"` estiver ausente;
- disclosure comercial estiver ausente;
- página depender de um produto sem URL de origem válida.

## 12. Critérios de qualidade e publicação

Pontuação mínima sugerida: 80/100.

| Dimensão | Peso | Condição |
|---|---:|---|
| utilidade e resposta à intenção | 25 | resolve a busca sem obrigar o clique comercial |
| originalidade/diferenciação | 20 | não é template com campos trocados |
| exatidão e fontes | 20 | fatos rastreáveis e sem invenção |
| SEO técnico/on-page | 15 | metadata, headings, canonical, schema e links válidos |
| experiência e legibilidade | 10 | mobile, acessibilidade e escaneabilidade |
| afiliado/compliance | 10 | disclosure e link correto; esta dimensão é eliminatória |

Qualquer falha eliminatória mantém `indexable = false`, mesmo se a nota total for alta.

## 13. Plano editorial inicial

### Hubs e categorias

1. Guia completo para cachorros;
2. Guia completo para gatos;
3. Ração para cachorro;
4. Ração para gato;
5. Areia para gato;
6. Brinquedos para cachorro;
7. Arranhadores para gato;
8. Caixas de transporte.

### Guias de intenção de compra

1. Como escolher ração para cachorro filhote;
2. Ração para cachorro idoso: o que avaliar;
3. Ração premium ou super premium: diferenças;
4. Como escolher areia para gato;
5. Como escolher caixa de transporte por porte;
6. Como escolher fonte de água para gatos.

### Comparativos piloto

Publicar somente depois de validar disponibilidade e fatos:

1. Premier ou Royal Canin;
2. Golden ou GranPlus;
3. Areia Pipicat ou Viva Verde.

O comparativo Bravecto ou NexGard fica fora do piloto por envolver saúde e exigir revisão especializada.

### Locais piloto

Selecionar cidades com dados completos, idealmente em regiões distintas. Candidatas: São Paulo–SP, Campinas–SP, Curitiba–PR, Porto Alegre–RS, Belo Horizonte–MG e Recife–PE. Publicar inicialmente três; as demais permanecem em rascunho até comprovar diferenciação.

### Visão de escala de longo prazo

A proposta original imaginava 50 categorias, 300 artigos informativos, 300 páginas de intenção de compra, 200 comparativos, 180 páginas locais, 100 páginas sobre raças de cães, 100 sobre raças de gatos, 150 sobre saúde/cuidados e 100 guias. Ela fica registrada como mapa de possibilidades, não como meta automática de publicação.

Neste projeto existem 97 cidades informadas, não 180 confirmadas. Substituindo apenas esse número, o inventário teórico seria 1.397 páginas; ainda assim, contagem não é KPI e cada URL precisa passar pelos mesmos critérios. Raças sem necessidade editorial distinta devem ser consolidadas. Temas de saúde exigem revisão especializada. Categorias, comparativos e intenções sobrepostas devem ser fundidos para impedir canibalização.

Portanto, a escala ocorre em três portões:

1. piloto de 18–24 páginas;
2. lotes de 10–20 páginas após dados de 8–12 semanas;
3. expansão do inventário somente quando o template anterior demonstrar indexação, utilidade e conversão sem sinais de duplicação.

## 14. Métricas

Por URL e por tipo de página:

- URLs enviadas, descobertas, rastreadas e indexadas;
- impressões, cliques, CTR e posição no Search Console;
- sessões orgânicas e engajadas;
- scroll de 50% e 90%;
- cliques por CTA, posição e dispositivo;
- taxa de clique afiliado por sessão orgânica;
- páginas órfãs e links quebrados;
- idade da última verificação;
- taxa de rejeição editorial e motivos;
- conversão/venda atribuída quando o programa fornecer retorno confiável.

Não otimizar apenas para quantidade publicada ou posição média. O KPI de negócio é tráfego qualificado que consome conteúdo e segue para a oferta com transparência.
