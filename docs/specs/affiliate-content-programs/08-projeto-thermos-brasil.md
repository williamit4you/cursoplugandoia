# Projeto de conteúdo — Thermos Brasil

Programa: `THERMOS_TERMICOS`

Loja: `thermos-brasil`

CTA: `/go/loja/thermos-brasil`

Tracking especial: `parceiro=12410`, `am=willianbarata`

Risco: `LOW`

## 1. Tese

Criar um portal independente sobre produtos térmicos, café e hidratação. Capturar a necessidade antes da marca: manter bebida quente/fria, transportar sem derramar, escolher capacidade e usar no trabalho, carro, viagem ou academia.

```text
uso → tipo de recipiente → capacidade → comparação → modelo → Thermos
```

## 2. Arquitetura

```text
/produtos-termicos
├── /copos-termicos
├── /garrafas-termicas
├── /canecas-termicas
├── /cafe
├── /por-finalidade
│   ├── /trabalho
│   ├── /viagem
│   ├── /carro
│   ├── /academia
│   └── /presente
├── /capacidades
├── /comparativos
└── /limpeza-e-conservacao
```

## 3. Lote inicial — 30 pautas

### Copos — 9

1. Guia de copos térmicos;
2. Como escolher copo térmico;
3. Copo térmico para café;
4. Copo térmico com tampa;
5. Copo térmico para viagem;
6. Copo térmico para escritório;
7. Copo térmico para carro;
8. Copo térmico x caneca térmica;
9. Copo térmico x garrafa térmica.

### Garrafas e canecas — 9

10. Guia de garrafas térmicas;
11. Como escolher garrafa térmica;
12. Garrafa térmica para café;
13. Garrafa térmica para água gelada;
14. Garrafa térmica para trabalho;
15. Garrafa térmica para viagem;
16. Guia de canecas térmicas;
17. Caneca térmica para café/escritório;
18. Qual capacidade escolher.

### Café, cuidado e compra — 12

19. Como manter café quente por mais tempo;
20. Como levar café para o trabalho;
21. Como transportar café sem derramar;
22. Como limpar garrafa térmica;
23. Como limpar copo térmico;
24. Como tirar cheiro de café;
25. Inox x plástico: critérios de comparação;
26. 350 ml x 470 ml;
27. 500 ml x 1 litro;
28. Análise Copo Thermos Fuji 470 ml, após ficha;
29. Análise Caneca Viena 350 ml, após ficha;
30. Comparativo Cairo 1 L x Miami 500 ml, como escolha de uso.

## 4. Review e comparação

Campos: capacidade, material, tampa/vedação declarada, dimensões, peso, conservação térmica segundo fabricante, compatibilidade de lavagem, facilidade de limpeza, uso, limitações, preço/data e disponibilidade.

Não inferir “à prova de vazamento”, tempo térmico ou lava-louças sem ficha oficial.

## 5. Ferramenta

“Qual capacidade faz sentido?” compara 350, 470, 500, 750 ml e 1 L com duração/necessidade informada pelo visitante. É ferramenta de planejamento de recipiente, não recomendação médica de ingestão de água.

## 6. Sazonal e presente

Pautas para Dia das Mães, Dia dos Pais, Natal, amigo secreto, volta às aulas e presentes para quem ama café entram 60–90 dias antes. Não gerar página anual se não houver atualização real.

## 7. Cadência e aceite

- bootstrap: 30 pautas;
- até 4 publicações por semana;
- job diário alterna criação, ficha, preço, cuidado e auditoria;
- CTA deve resolver especificamente `/go/loja/thermos-brasil`;
- preflight exige tracking `parceiro/am`, nunca UTMs inexistentes;
- reavaliar após 8–12 semanas.

## 8. KPIs

- tráfego por uso/capacidade;
- cliques por comparativo e modelo;
- uso da ferramenta;
- páginas de especificação atualizadas;
- taxa de compra multiproduto/presente quando disponível.
