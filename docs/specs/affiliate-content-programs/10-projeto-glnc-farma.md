# Projeto de conteúdo — GLNC Farma

Programa: `GLNC_NUTRICAO_ROTULOS`

Loja: `glnc-farma`

CTA: `/go/loja/glnc-farma`

Risco: `HIGH`

## 1. Tese

Criar um portal independente sobre nutrição, vitaminas, minerais e leitura de suplementos baseada em evidências. O posicionamento é “entenda antes de comprar”, seguindo nutriente → dúvida → como avaliar → análise de rótulo → GLNC Farma.

O portal não usa sintoma para prescrever suplemento.

## 2. Arquitetura

```text
/nutricao-e-suplementos
├── /nutrientes
│   ├── /vitaminas
│   │   └── /complexo-b
│   └── /minerais
│       ├── /magnesio
│       └── /zinco
├── /quercetina
├── /como-ler-rotulos
├── /comparativos
├── /analises
└── /glossario
```

Prioridade: magnésio → zinco/quercetina → complexo B → demais produtos verificados.

## 3. Lote inicial — 20 pautas

1. O que são suplementos alimentares;
2. Vitaminas x minerais;
3. Como ler o rótulo de suplemento;
4. O que significa %VD;
5. O que é porção e quantidade por porção;
6. O que é magnésio;
7. Alimentos fontes de magnésio;
8. Formas de magnésio: como comparar;
9. Alimentação x suplementação de magnésio;
10. Como comparar suplementos de magnésio;
11. O que é zinco;
12. Alimentos fontes de zinco;
13. O que é quercetina;
14. Quercetina e zinco em suplementos: leitura responsável;
15. O que são vitaminas do complexo B;
16. Guia das vitaminas do complexo B;
17. O que é vitamina B12;
18. Análise Magnesium Cell Science;
19. Análise Querc-Zinc Cell Science;
20. Comparativo de suplementos Cell Science com propostas comparáveis.

## 4. Análise de rótulo

Campos obrigatórios: composição declarada, quantidade por porção, %VD, forma dos nutrientes, ingredientes, aditivos/alergênicos, cápsulas e porções, orientação/advertências do fabricante, regularização aplicável, preço por embalagem/porção e data.

A página deve separar:

- o que o rótulo declara;
- o que fontes independentes explicam sobre o nutriente;
- o que não pode ser concluído sobre aquele produto.

## 5. Comparador de rótulos

Compara objetivamente nutrientes, quantidades, %VD, formas, porções, ingredientes, preço e preço por porção. Não produz “qual você deve tomar”. Produtos com propostas diferentes devem ser marcados como não equivalentes.

## 6. Guardrails

- não usar cansaço, sono ou outro sintoma para indicar produto;
- não diagnosticar deficiência;
- não prescrever dose, horário ou combinação;
- não prometer prevenção/tratamento de doença;
- não inferir eficácia do produto pela literatura do ingrediente;
- informar que necessidades individuais podem exigir profissional;
- fontes científicas/regulatórias para claims; rótulo oficial para composição;
- conteúdo `HIGH` exige editor + especialista.

## 7. Cadência e aceite

- bootstrap: 20; até 3 publicações/semana;
- job diário alterna fonte, glossário, análise e atualização de rótulo;
- CTA somente `/go/loja/glnc-farma`;
- nenhuma página de sintoma → suplemento;
- fórmulas de preço por porção auditáveis;
- reavaliar após 8–12 semanas.

## 8. KPIs

- tráfego para leitura de rótulos/nutrientes;
- uso do comparador;
- clique por análise;
- fontes/rótulos válidos;
- bloqueios de claims e incidentes clínicos, meta zero;
- consultas não relacionadas à marca.
