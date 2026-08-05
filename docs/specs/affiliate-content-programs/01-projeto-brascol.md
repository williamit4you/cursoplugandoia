# Projeto de conteúdo — Brascol

## 1. Tese

A Brascol deve ser trabalhada como fornecedora para lojistas e revendedores, não como varejo genérico de moda. O público de maior intenção é quem deseja iniciar ou ampliar um negócio de moda bebê e infantil.

O site oficial confirma foco em atacado, moda bebê e infantojuvenil, enxoval, calçados, puericultura, moda praia e outras categorias para lojistas, além de envio nacional. Isso favorece conteúdo sobre revenda, escolha de mix, estoque, sazonalidade e compra remota.

Posicionamento público:

> Guias independentes para quem vende moda bebê e infantil, com orientação sobre mix de produtos, planejamento, estoque e fornecedores.

A marca Brascol aparece contextualmente como loja parceira, nunca como dona ou operadora do Compra Esperta.

## 2. Criar tudo de uma vez ou usar job diário?

Decisão: modelo híbrido.

1. Criar 30 pautas e respectivos rascunhos no bootstrap.
2. Publicar no máximo 3 páginas por semana durante as primeiras 10 semanas.
3. Manter job diário para pesquisa, atualização, revisão sazonal e criação de novas pautas.
4. Reavaliar depois de 8–12 semanas de Search Console.

Gerar 30 rascunhos de uma vez é viável. Publicar 30 de uma vez não é indicado, pois impede aprendizado por lote e aumenta risco de repetição. Depois do lote inicial, o programa é menor que Electrolux: não precisa forçar uma nova página diária. O job pode alternar `CREATE`, `UPDATE`, `VERIFY`, `AUDIT` e `WAIT`.

## 3. Arquitetura

```text
/revender-roupas
├── /como-comecar
├── /gestao
├── /vendas
├── /fornecedores
├── /moda-infantil-atacado
│   ├── /roupa-de-bebe
│   ├── /roupa-de-menina
│   ├── /roupa-de-menino
│   ├── /enxoval
│   ├── /calcados-infantis
│   ├── /moda-praia-infantil
│   └── /puericultura
├── /sazonal
└── /guias
```

Não criar páginas de moda feminina, masculina, fitness, plus size ou evangélica apenas porque aparecem em listas genéricas de ideias. O catálogo oficial consultado é predominantemente bebê e infantojuvenil. Uma categoria só entra quando houver produtos e fonte atual verificáveis.

## 4. Pilares

### Começar a revender

- como começar a revender roupas infantis;
- quanto investir inicialmente;
- como comprar roupas no atacado pela internet;
- como escolher um fornecedor;
- checklist para abrir uma loja infantil;
- erros de quem começa a revender;
- loja física, Instagram, WhatsApp ou marketplace.

### Mix e categorias

- moda bebê no atacado;
- moda para meninas e meninos;
- conjuntos, vestidos, bodies e macacões;
- enxoval e saída de maternidade;
- calçados infantis;
- puericultura para lojistas;
- como montar grade de tamanhos;
- como equilibrar itens básicos e sazonais.

Não afirmar “produto mais vendido” sem dados de venda. Usar “itens para considerar no mix” quando não houver evidência.

### Gestão

- como calcular margem bruta;
- markup versus margem;
- como precificar sem esquecer custos;
- controle de estoque;
- curva ABC;
- capital de giro;
- planejamento de compras;
- política de troca da própria loja;
- fotografia e cadastro de produtos.

Conteúdos tributários, emissão de nota e formalização devem usar fontes oficiais e deixar claro que regras variam; não substituir contador.

### Vendas

- como vender roupas pelo Instagram;
- catálogo e atendimento pelo WhatsApp;
- como montar uma loja virtual;
- como vender em marketplace;
- descrição de produto;
- exposição de loja e vitrine;
- fidelização e recompra.

### Sazonalidade

- volta às aulas;
- Páscoa;
- Dia das Mães;
- inverno;
- verão e moda praia;
- Dia das Crianças;
- Black Friday;
- Natal.

Conteúdo sazonal deve entrar na fila 60–90 dias antes da data comercial.

### Local

Priorizar:

- onde comprar roupa infantil no atacado no Brás;
- como comprar no Brás morando em outro estado;
- atacado online de moda infantil com envio nacional;
- como planejar frete para compra de atacado.

Não replicar páginas para dezenas de cidades. A Brascol informa envio nacional, portanto páginas “fornecedor em Curitiba/Goiânia/Belo Horizonte” só seriam válidas com dados exclusivos sobre logística, prazo ou contexto regional. Sem isso, seriam doorways.

## 5. Lote inicial de 30 páginas

### Hubs — 6

1. Guia para revender roupas infantis;
2. Moda infantil no atacado;
3. Gestão de loja de roupas;
4. Vendas de moda pela internet;
5. Como escolher fornecedores;
6. Calendário comercial da moda infantil.

### Começo e gestão — 8

7. Como começar a revender roupas infantis;
8. Quanto investir para começar;
9. Checklist para abrir uma loja infantil;
10. Como calcular margem;
11. Markup ou margem: diferenças;
12. Como precificar roupas;
13. Como controlar estoque;
14. Como planejar capital de giro.

### Categorias e mix — 8

15. Roupa de bebê no atacado;
16. Roupa de menina no atacado;
17. Roupa de menino no atacado;
18. Enxoval de bebê para revenda;
19. Calçados infantis para revenda;
20. Moda praia infantil no atacado;
21. Como montar grade de tamanhos;
22. Como definir o mix inicial.

### Canais e fornecedores — 6

23. Como vender pelo Instagram;
24. Como vender pelo WhatsApp;
25. Como montar uma loja virtual;
26. Como fotografar roupas para vender;
27. Como avaliar fornecedor de atacado;
28. Como comprar no Brás pela internet.

### Sazonais — 2

29. Planejamento de estoque para Dia das Crianças;
30. Planejamento de coleção de verão infantil.

## 6. Template

- title exclusivo;
- H1 único orientado à necessidade do lojista;
- introdução com resposta direta;
- H2 para método/decisões;
- H3 para passos, opções e exemplos;
- planilha ou fórmula explicada quando aplicável;
- checklist prático;
- bloco “o que confirmar com o fornecedor”;
- disclosure;
- CTA contextual via `/go/loja/brascol`;
- relacionados e retorno ao hub;
- fontes e data de revisão.

## 7. Job

Cadência diária de operação:

| Dia | Ação prioritária |
|---|---|
| segunda | criar guia de gestão ou início |
| terça | verificar catálogo/categorias e atualizar fontes |
| quarta | criar conteúdo de categoria/mix |
| quinta | atualizar sazonal e auditar links |
| sexta | criar conteúdo de vendas/fornecedor |
| sábado | auditoria de similaridade, sitemap e páginas órfãs |
| domingo | planejar fila; sem criação obrigatória |

No piloto, o job pode gerar rascunhos diariamente, mas libera apenas três publicações semanais após aprovação.

## 8. Escala

Estimativa saudável:

- 15–25 hubs/categorias;
- 40–70 guias de gestão e venda;
- 30–60 conteúdos de categoria/mix;
- 20–40 sazonais;
- 15–30 comparativos e guias de fornecedor;
- poucos conteúdos locais de alta utilidade.

Total provável: 120–250 páginas. Não existe benefício em perseguir 1.000 URLs se a taxonomia real não sustentar diferenciação.

## 9. Guardrails

- não prometer margem ou faturamento;
- não inventar pedido mínimo, desconto, frete, prazo ou política de troca;
- não chamar um produto de “mais vendido” sem fonte;
- não copiar descrições do fornecedor;
- dados comerciais expiram em 30 dias;
- tendências precisam de fonte e ano;
- tributação e formalização exigem fonte oficial;
- todo CTA usa o afiliado cadastrado.

## 10. KPIs

- impressões e cliques por cluster;
- posição para consultas de atacado/revenda;
- cliques afiliados por guia;
- CTR por posição de CTA;
- retorno a hubs e profundidade de navegação;
- páginas indexadas versus enviadas;
- atualização sazonal no prazo;
- conversão por categoria, quando disponível.

