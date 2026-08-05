# Projeto de conteúdo — TNG

Programa: `TNG_MODA_MASCULINA`

Loja: `tng`

CTA: `/go/loja/tng`

Risco: `LOW`

## 1. Tese

Criar um portal editorial de moda masculina orientado por ocasião e combinação. A jornada central é ocasião → dress code/look → peças → guia de compra → TNG. Uma página pode gerar compra de várias peças ao montar um look completo.

## 2. Arquitetura

```text
/moda-masculina
├── /como-se-vestir
│   ├── /trabalho
│   ├── /casamento
│   ├── /jantar
│   └── /festa
├── /como-combinar
├── /camisas
├── /polos
├── /calca-chino
├── /jeans
├── /alfaiataria
├── /casacos
├── /dress-code
├── /guarda-roupa
└── /looks
```

Prioridade: “o que vestir” + “como combinar”.

## 3. Lote inicial — 25 pautas

1. Como se vestir bem no dia a dia;
2. Como montar guarda-roupa masculino versátil;
3. Peças essenciais do guarda-roupa masculino;
4. O que é smart casual masculino;
5. O que é esporte fino masculino;
6. Guia de dress code masculino;
7. Como se vestir para trabalhar;
8. Looks masculinos para escritório;
9. Como se vestir para entrevista;
10. Como se vestir para casamento;
11. Casamento de dia x noite;
12. Como se vestir para jantar;
13. Como usar camisa masculina;
14. Como combinar camisa azul;
15. Como combinar camisa branca;
16. Como usar camisa polo;
17. Polo com jeans;
18. Polo com chino;
19. O que é calça chino;
20. Como usar calça chino;
21. Chino x jeans;
22. Como escolher jeans masculino;
23. Como usar blazer masculino;
24. Blazer x paletó;
25. Guia de alfaiataria masculina.

Estação, casacos, calçados e reviews entram no segundo lote conforme catálogo.

## 4. Look completo

Template apresenta 2–3 composições por ocasião, explica dress code e permite CTA por peça. Cada CTA contém `placement` próprio, mas todos resolvem para TNG. Não afirmar disponibilidade de cor/tamanho sem verificação.

## 5. Montador de look

Entradas: ocasião, estilo e clima. Saída: categorias de peça e justificativa editorial; não promete que um SKU específico estará disponível. Resultado liga a guias e categorias verificadas.

## 6. SEO de combinações

“X combina com Y?” só recebe URL quando a combinação possui demanda e orientação substantiva. Matrizes de cor/peça servem ao Opportunity Agent, não à geração automática de todas as páginas.

## 7. Review de produto

Campos: material/composição, modelagem, cores/tamanhos observados, detalhes, cuidados conforme etiqueta/fabricante, ocasiões, combinações, preço/data e disponibilidade. Não inventar caimento; sem teste, descrever ficha e critérios.

## 8. Guardrails e cadência

- não copiar lookbook/descrições/imagens sem permissão;
- não usar estereótipos ou regras absolutas de corpo/gênero;
- disponibilidade, preço e coleção expiram;
- pautas sazonais revisadas antes da estação;
- bootstrap: 25; até 4 publicações por semana;
- conteúdo aprovado pode derivar para Pinterest/Google Imagens/social.

## 9. KPIs

- tráfego por ocasião/peça;
- itens/CTAs clicados por sessão;
- uso do montador;
- conversão de look multiproduto;
- impressões de long-tail “combina com”;
- atualização de coleção/preço.
