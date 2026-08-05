# Projeto de conteúdo — Pibe Brasil

Programa: `PIBE_GUMMIES`

Loja: `pibe-brasil`

CTA: `/go/loja/pibe-brasil`

Risco: `HIGH`

## 1. Tese

Criar um portal independente sobre suplementação, alimentação e desempenho, com autoridade específica em suplementos no formato gummies. O primeiro cluster combina o maior destaque percebido do catálogo com diferenciação editorial: creatina + gummies.

```text
conceito → critérios → formato → comparação → rótulo/review → Pibe
```

## 2. Arquitetura

```text
/suplementos
├── /creatina
│   ├── /o-que-e
│   ├── /para-que-serve
│   ├── /creatina-em-goma
│   ├── /goma-ou-po
│   ├── /como-escolher
│   └── /para-iniciantes
├── /gummies
├── /fibras
├── /colageno
├── /melatonina
└── /superfoods
```

Ordem: creatina/gummies → fibras → colágeno → melatonina → superfoods.

## 3. Lote inicial — 20 pautas

1. O que é creatina;
2. Para que serve a creatina segundo fontes confiáveis;
3. Creatina em gummies: o que é;
4. Creatina em gummies ou pó: diferenças;
5. Como escolher creatina;
6. O que observar no rótulo de creatina;
7. Creatina em gummies vale a pena? Critérios para decidir;
8. Creatina em cápsula ou goma;
9. Análise da creatina Pibe: composição e rótulo;
10. Comparativo das versões/sabores Pibe, após verificação;
11. O que são fibras;
12. Fibras solúveis e insolúveis;
13. Fibras em gummies: características do formato;
14. Como escolher suplemento de fibras;
15. O que é colágeno;
16. Colágeno em pó, cápsula ou gummies;
17. Como escolher suplemento de colágeno;
18. O que é melatonina;
19. O que observar no rótulo de melatonina;
20. Guia de suplementos em gummies.

Superfoods entra no segundo lote, depois de definir composição e intenção específicas.

## 4. Página de análise/review

Campos obrigatórios:

- nome exato e versão;
- informação nutricional e porção segundo rótulo;
- quantidade declarada do ingrediente por porção;
- ingredientes e alergênicos;
- açúcares/carboidratos quando declarados;
- quantidade de unidades/porções;
- orientações e advertências do fabricante;
- preço observado e preço por porção, com data;
- sabores e disponibilidade verificadas;
- ausência/presença de teste prático claramente declarada;
- CTA interno Pibe.

## 5. Guardrails

- não prescrever dose ou horário individual;
- não prometer hipertrofia, emagrecimento, energia, imunidade ou sono;
- não dizer que melatonina cura insônia;
- não inferir benefício pela presença de ingrediente;
- não usar sintoma para recomendar suplemento;
- conteúdo deve distinguir evidência sobre nutriente de evidência sobre o produto;
- rótulo e regulamentação aplicável precisam estar atuais;
- conteúdos de melatonina e claims de saúde exigem especialista.

## 6. Cadência

- bootstrap: 20 rascunhos;
- até 3 publicações por semana;
- job diário alterna fonte, escrita, review e atualização de rótulo/preço;
- após 8–12 semanas, expandir o cluster com impressões e clique, não todos ao mesmo tempo.

## 7. Critérios de aceite específicos

- análise não chama resultado comercial de evidência;
- comparativo contém base equivalente para todos os formatos;
- fonte sustenta cada claim fisiológico;
- nenhuma recomendação personalizada;
- CTA usa somente `/go/loja/pibe-brasil`;
- preço por porção exibe data e fórmula auditável.
