# Projeto de conteúdo — Cicatribem

Programa: `CICATRIBEM_SKINCARE`

Loja: `cicatribem`

CTA: `/go/loja/cicatribem`

Risco: `HIGH`

## 1. Tese

Criar um portal independente sobre skincare e cuidados com a pele. A aquisição começa pelas dúvidas e rotinas ligadas a manchas, oleosidade, acne, estrias, anti-idade, hidratação, limpeza e proteção solar. A Cicatribem aparece como destino comercial quando houver produto compatível, sem prometer tratamento, cura ou resultado.

Funil:

```text
problema/dúvida → educação → rotina/critério → guia de produtos → análise → Cicatribem
```

## 2. Prioridade e arquitetura

Começar por manchas/hiperpigmentação; não dispersar o primeiro lote.

```text
/cuidados-com-a-pele
├── /manchas-na-pele
│   ├── /manchas-no-rosto
│   ├── /manchas-no-corpo
│   ├── /manchas-de-acne
│   ├── /manchas-de-sol
│   ├── /manchas-nas-axilas
│   ├── /manchas-na-virilha
│   ├── /melasma
│   └── /hiperpigmentacao
├── /pele-oleosa-e-acne
├── /estrias
├── /anti-idade-e-firmeza
├── /hidratacao
├── /limpeza-facial
└── /protecao-solar
```

Expansão: manchas → oleosidade/acne → estrias → anti-idade → skincare geral.

## 3. Lote inicial — 30 pautas

### Fundação — 5

1. Guia de cuidados com a pele;
2. Manchas na pele: guia editorial;
3. Tipos de manchas na pele;
4. Como montar uma rotina para pele com manchas;
5. Como escolher cosméticos para uniformidade do tom.

### Rosto e ativos — 9

6. Possíveis causas de manchas no rosto;
7. Manchas de sol: cuidados e prevenção;
8. Manchas após acne: cuidados com a pele;
9. Melasma: informação, limites do cosmético e dermatologista;
10. Proteção solar em pele com manchas;
11. Vitamina C em cosméticos: proposta e cuidados;
12. Niacinamida em cosméticos: proposta e cuidados;
13. Ácidos em cosméticos: diferenças e precauções;
14. Como combinar etapas sem irritar a pele.

### Axilas e virilha — 8

15. Por que as axilas podem escurecer;
16. Atrito e irritação na pele das axilas;
17. Cuidados após depilação das axilas;
18. Como hidratar a pele das axilas;
19. Como escolher produto para axilas sensíveis;
20. Cuidados com a pele da virilha;
21. Atrito e manchas na região da virilha;
22. Como avaliar cosméticos para áreas sensíveis.

### Comercial — 8

23. Produtos para cuidados com manchas no rosto: critérios;
24. Produtos para manchas de acne: o que observar;
25. Produtos para cuidados com axilas: como escolher;
26. Produtos para cuidados com a virilha: como escolher;
27. Sérum clareador: como ler composição e indicação;
28. Rotina completa: limpeza, tratamento, hidratação e proteção;
29. Análise de um produto prioritário Cicatribem, após fonte oficial;
30. Comparativo de duas soluções do catálogo, após fichas completas.

## 4. Template e conversão

- resposta educativa antes do CTA;
- diferenciar cosmético de tratamento médico;
- ingredientes e modo de uso somente conforme rótulo/fabricante;
- seção “quando procurar dermatologista” quando aplicável;
- análise chama-se “composição, proposta, indicação do fabricante e precauções”, não “funciona?” como promessa;
- comparativos usam critérios objetivos e não propaganda disfarçada;
- CTA contextual e disclosure antes do primeiro botão.

## 5. Guardrails

- não afirmar que produto elimina manchas, melasma, acne, estrias ou celulite;
- não diagnosticar lesão/mancha por texto ou imagem;
- não prescrever concentração, frequência ou combinação personalizada;
- não recomendar uso em área íntima além da indicação oficial;
- não minimizar ardência, alergia ou irritação;
- orientar interrupção e avaliação profissional diante de reação relevante;
- claims exigem fonte compatível; fonte comercial prova apenas composição e alegação do fabricante;
- todas as páginas exigem revisão editorial; páginas clínicas exigem especialista.

## 6. Cadência e canais

- bootstrap: 30 rascunhos/pautas;
- publicação: até 3 por semana;
- job diário prioriza fontes, revisão e atualização;
- imagens originais/licenciadas para Discover;
- derivados para Pinterest somente após aprovação do artigo;
- avaliar o cluster após 8–12 semanas antes de avançar para acne/estrias.

## 7. KPIs

- impressões por estágio do funil;
- passagem informacional → guia comercial;
- cliques afiliados por tema e CTA;
- consultas não relacionadas à marca;
- conteúdo bloqueado por claim de saúde;
- atualização de rótulos e fontes no prazo.
