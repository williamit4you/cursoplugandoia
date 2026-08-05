# Projeto de conteúdo — Electrolux

Programa: `ELECTROLUX_CASA`

Loja: `electrolux`

CTA: `/go/loja/electrolux`

Risco: `MEDIUM`; `CRITICAL` para reparo elétrico, gás ou refrigeração

## 1. Tese

Electrolux sustenta um programa editorial maior porque a compra de eletrodomésticos envolve pesquisa longa, modelos, capacidades, tecnologias, instalação, consumo, ambientes, orçamento e comparação. O portal deve ser sobre casa, cozinha, lavanderia, limpeza e climatização; a marca entra como opção comercial e fonte primária quando pertinente.

A loja oficial consultada organiza o catálogo em eletrodomésticos, eletroportáteis, utilidades, peças/acessórios e serviços. Entre as categorias aparecem geladeira, máquina de lavar, micro-ondas, fogão, cooktop, lava-louças, ar-condicionado, forno, freezer, coifa/depurador, lava e seca, secadora, cervejeira, frigobar e adega.

## 2. Escala e cadência

Decisão: job contínuo.

- bootstrap de 36 pautas;
- produção de 1 rascunho por dia no piloto;
- revisão/publicação de até 5 páginas por semana;
- atualização semanal de modelos e páginas comerciais;
- revisão mensal de páginas de preço;
- revisão semestral de guias estáveis;
- reavaliação depois de 12 semanas.

A proposta de 1.200 páginas é uma visão possível, não o lote inicial. Primeiro portão: 36 páginas. Segundo: 100. Terceiro: 250. Só depois dos dados deve-se decidir se o domínio sustenta 400–800 ou mais.

## 3. Arquitetura

```text
/casa-e-cozinha
├── /geladeiras
├── /lavanderia
│   ├── /maquinas-de-lavar
│   ├── /lava-e-seca
│   └── /secadoras
├── /lava-loucas
├── /fogoes
├── /cooktops
├── /fornos
├── /micro-ondas
├── /aspiradores
├── /ar-condicionado
├── /purificadores-de-agua
├── /coifas-e-depuradores
├── /freezers
├── /adegas-e-cervejeiras
├── /casa-nova
├── /guias
├── /comparativos
└── /manutencao-segura
```

## 4. Tipos de conteúdo

### Categorias e tecnologias

- Frost Free, duplex, inverse e side by side;
- lavadora por capacidade;
- lava e seca versus máquinas separadas;
- indução versus gás;
- forno de embutir versus bancada;
- ar-condicionado inverter;
- aspirador vertical, robô e tradicional;
- purificador por capacidade e rotina.

### Intenção de compra

- como escolher geladeira Frost Free;
- melhor capacidade de lavadora por tamanho da família;
- como escolher lava-louças;
- cooktop de 4 ou 5 bocas;
- forno elétrico por capacidade;
- micro-ondas para apartamento;
- aspirador para casa com pets.

“Melhor” exige método claro. Top 7/10 só é publicado quando houver amostra suficiente, critérios, fontes e data de atualização.

### Comparativos

- Electrolux ou Brastemp;
- Electrolux ou Consul;
- Samsung ou Electrolux;
- LG ou Electrolux;
- comparativos de modelos específicos.

Comparar ficha técnica, capacidade, dimensões, consumo, recursos, garantia e perfil de uso. Não declarar superioridade geral. Modelo específico exige página oficial/manual para ambos os itens.

### Problemas e manutenção

- geladeira fazendo barulho: verificações seguras;
- máquina não centrifuga: o que conferir antes da assistência;
- micro-ondas não aquece: quando interromper o uso;
- como limpar máquina de lavar;
- como reduzir odores na geladeira;
- como economizar energia.

Guardrail crítico: não instruir abertura de equipamento, manipulação elétrica, gás, refrigerante, capacitor, compressor ou reparo que exija técnico. Direcionar para manual e assistência autorizada quando houver risco.

### Ambiente e perfil

- geladeira para apartamento;
- lavadora para casal;
- fogão para cozinha pequena;
- purificador para escritório;
- aspirador para quem tem pets;
- geladeira para família grande;
- lava-louças para casal;
- produtos para quem mora sozinho.

### Casa nova

- lista de eletrodomésticos essenciais;
- ordem de compra para casa nova;
- como planejar uma cozinha;
- como medir nichos e passagens;
- checklist de instalação;
- orçamento por etapas.

### Orçamento

Páginas “até R$ X” só podem ser indexadas quando existir coleta de preço com data, tratamento de indisponibilidade e atualização automática. Sem isso, usar “como comparar custo-benefício” e evitar faixas que envelhecem rapidamente.

### Sazonal

- climatização para verão;
- aquecimento no inverno, se houver catálogo;
- Black Friday;
- casa nova e casamento;
- economia de energia;
- limpeza de primavera e fim de ano.

## 5. Lote inicial de 36 páginas

### Hubs — 8

1. Casa e cozinha;
2. Geladeiras;
3. Lavanderia;
4. Cozinha e cocção;
5. Limpeza e aspiradores;
6. Climatização;
7. Casa nova;
8. Comparativos de eletrodomésticos.

### Guias de categoria — 12

9. Como escolher geladeira;
10. Frost Free, Cycle Defrost ou degelo manual;
11. Geladeira duplex, inverse ou side by side;
12. Como escolher capacidade da máquina de lavar;
13. Máquina de lavar ou lava e seca;
14. Como escolher lava-louças;
15. Fogão ou cooktop;
16. Cooktop a gás ou indução;
17. Como escolher forno elétrico;
18. Como escolher micro-ondas;
19. Como escolher aspirador;
20. Como escolher ar-condicionado econômico.

### Perfil/ambiente — 8

21. Geladeira para apartamento;
22. Geladeira para família grande;
23. Lavadora para casal;
24. Lavadora para quem mora sozinho;
25. Fogão para cozinha pequena;
26. Lava-louças para casal;
27. Aspirador para casa com pets;
28. Purificador para escritório.

### Casa nova e manutenção segura — 8

29. Eletrodomésticos essenciais para casa nova;
30. O que comprar primeiro;
31. Como medir espaço para geladeira;
32. Checklist antes da instalação;
33. Como limpar máquina de lavar;
34. Como tirar cheiro da geladeira;
35. Como reduzir consumo dos eletrodomésticos;
36. Quando procurar assistência técnica.

Comparativos de marca/modelo entram no segundo lote, depois de construir método e coletar fichas técnicas.

## 6. Página de modelo/review

Campos obrigatórios:

- nome e código exatos;
- categoria;
- dimensões e capacidade;
- tensão;
- consumo/eficiência quando fornecidos;
- recursos comprovados;
- manual/ficha/página oficial;
- data de coleta;
- “indicado para” baseado em critérios explícitos;
- limitações;
- itens a confirmar antes da compra;
- CTA via `/go/loja/electrolux`.

Sem fonte oficial ou manual, a página fica em rascunho.

## 7. Job diário

O job escolhe uma operação conforme prioridade:

```text
VERIFY_MODEL_SOURCE
REFRESH_PRICE_AND_STOCK
CREATE_GUIDE
CREATE_COMPARISON
UPDATE_STALE_PAGE
AUDIT_INTERNAL_LINKS
AUDIT_SITEMAP
WAIT
```

Distribuição inicial:

- 35% guias de compra;
- 20% categorias/tecnologias;
- 15% perfil e ambiente;
- 10% casa nova;
- 10% manutenção segura;
- 10% comparativos, somente com fontes completas.

## 8. SEO on-page

- um H1;
- H2 para decisões/critério;
- H3 para tecnologias, capacidades e perfis;
- title e meta description exclusivos;
- canonical absoluto;
- breadcrumb e `BreadcrumbList`;
- `Article` para guias;
- `CollectionPage` para hubs;
- `Product` somente com dados atuais e visíveis;
- tabela acessível em comparativos;
- dimensões sempre com unidade;
- disclosure antes do primeiro CTA;
- links `rel="sponsored"`;
- página publicada somente com links internos de entrada e saída.

## 9. Guardrails

- não inventar preço, estoque, garantia, consumo ou assistência;
- não recomendar reparo elétrico/mecânico perigoso;
- não copiar texto do fabricante;
- não usar avaliações que o site não coleta;
- não criar ranking sem metodologia;
- não manter página de preço vencida indexável;
- não criar página para todo cruzamento categoria × capacidade × perfil;
- não publicar reviews de modelos descontinuados sem explicar o status;
- toda oferta usa o link afiliado da tabela.

## 10. KPIs

- tráfego e receita por categoria;
- clique afiliado por etapa do funil;
- páginas de modelo atualizadas;
- cobertura de fontes/manuais;
- termos não relacionados à marca versus termos de marca;
- indexação por sitemap;
- CTR de comparativos;
- conversão por faixa de ticket;
- páginas vencidas ou sem estoque;
- Core Web Vitals em tabelas e imagens.
