# Projeto de conteúdo — Drogaria Rosário

Programa: `ROSARIO_CUIDADOS_PESSOAIS`

Loja: `drogaria-rosario`

CTA: `/go/loja/drogaria-rosario`

Risco: `HIGH`; medicamentos/sintomas podem ser `CRITICAL`

## 1. Tese

Criar um portal independente de cuidados pessoais, beleza, higiene, bebê e compra inteligente em farmácia. A recorrência é a vantagem comercial. Medicamentos ficam em área informativa separada e não seguem o funil “sintoma → remédio”. SEO local só entra com unidade, retirada, entrega e dados reais.

## 2. Arquitetura

```text
/cuidados-pessoais
├── /skincare
│   ├── /protetor-solar
│   ├── /hidratacao
│   ├── /limpeza-facial
│   └── /tipos-de-pele
├── /cabelos
├── /higiene-pessoal
├── /bebe-e-maternidade
├── /suplementos          # política HIGH
├── /medicamentos         # informativo; sem conversão forçada
├── /kits-e-checklists
└── /farmacias/{cidade-ou-regiao} # somente verificadas
```

Ordem: skincare/dermocosméticos → protetor solar → higiene → bebê → cabelos → suplementação informativa → local. Medicamentos são última prioridade comercial.

## 3. Lote inicial — 30 pautas

### Skincare e proteção — 10

1. Guia de cuidados pessoais;
2. Como montar rotina básica de skincare;
3. Ordem dos produtos de skincare;
4. Skincare de manhã x noite;
5. Como escolher protetor solar;
6. O que significa FPS;
7. Protetor facial x corporal;
8. Protetor com cor x sem cor;
9. Como escolher hidratante facial;
10. Gel de limpeza x sabonete facial.

### Higiene e cabelos — 8

11. Guia de higiene pessoal;
12. Como escolher escova de dentes;
13. Tipos de fio dental;
14. Escova elétrica x manual;
15. Como escolher desodorante;
16. Aerosol x roll-on x stick;
17. Como escolher shampoo;
18. Máscara capilar: como escolher.

### Bebê, kits e compra — 9

19. Guia de higiene do bebê;
20. Como escolher fraldas: critérios;
21. Tipos de fralda;
22. Checklist de higiene do bebê;
23. O que levar na bolsa do bebê;
24. Checklist de maternidade;
25. Monte seu kit de viagem;
26. Monte seu kit de higiene;
27. Como funciona comprar em farmácia online/clique e retire.

### Fundação responsável — 3

28. Como ler rótulo de suplemento;
29. Medicamento genérico, referência e similar: diferenças;
30. Como armazenar medicamentos corretamente.

Páginas de marca/produto e SEO local entram no segundo lote após catálogo e unidades verificadas.

## 4. SEO local

Uma página local exige:

- cidade/região e endereço verificados;
- fonte oficial da unidade;
- horário, retirada, delivery e serviços com validade;
- contexto local útil e não replicado;
- disclosure de independência;
- não usar “perto de mim” como promessa sem geolocalização;
- não afirmar “aberta agora” sem dado em tempo real;
- não sugerir que o Compra Esperta opera atendimento/estoque.

Inventário local permanece `noindex` até a completude. Rotas candidatas como Brasília, Águas Claras e Taguatinga são exemplos, não autorização de publicação.

## 5. Ferramentas comerciais seguras

- montar rotina básica por etapas: limpeza, hidratação e proteção;
- montar kit de viagem;
- montar kit de higiene;
- checklist de maternidade.

Ferramenta não diagnostica tipo de pele, doença, gravidez ou necessidade clínica. Resultado recomenda categorias e conteúdo, não medicamento.

## 6. Marcas, produtos e comparativos

Somente linhas realmente disponíveis. Comparar categoria, textura, quantidade, ativos declarados, indicação do fabricante, FPS e preço/data. Review sem teste é análise de ficha. Preço, estoque e retirada expiram rapidamente.

## 7. Guardrails

- proibido “sintoma → compre medicamento”;
- não indicar dose, interação, substituição ou interrupção;
- não recomendar MIP como se fosse prescrição;
- bula, armazenamento e regras usam fontes oficiais;
- suplementação segue as regras da GLNC/Pibe;
- acne, pele sensível e bebê exigem linguagem não diagnóstica;
- medicamento possui CTA comercial desativado por padrão no piloto;
- conteúdo `HIGH` exige especialista; `CRITICAL` não publica no fluxo comum;
- anúncios/disclosures não podem parecer aconselhamento farmacêutico.

## 8. Cadência

- bootstrap: 30; até 4 publicações por semana;
- job diário prioriza catálogo, preço, fonte clínica/local e stale;
- sazonal: verão/protetor, inverno/hidratação, viagem, volta às aulas;
- local somente após processo de verificação;
- observação de 8–12 semanas antes de ampliar marcas e cidades.

## 9. KPIs

- recorrência por cluster;
- clique multiproduto em rotinas/checklists;
- tráfego e clique local verificados;
- cobertura/validade de unidades;
- consultas de skincare/higiene/bebê versus medicamento;
- bloqueios e incidentes de saúde, meta zero.
