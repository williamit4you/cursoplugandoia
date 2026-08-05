# Projeto de conteúdo — Probel

Programa: `PROBEL_SONO_QUARTO`

Loja: `probel`

CTA: `/go/loja/probel`

Risco: `MEDIUM`; `HIGH` quando tratar saúde/dor

## 1. Tese

Criar um portal sobre colchões, sono e quarto. A jornada central é necessidade → tamanho → tecnologia → comparação → modelo → Probel. O conteúdo deve reduzir incerteza sobre medidas, firmeza, construção, box e instalação, sem transformar colchão em tratamento médico.

## 2. Arquitetura

```text
/colchoes
├── /solteiro
├── /casal
├── /queen
├── /king
├── /espuma
├── /molas
├── /molas-ensacadas
├── /firmeza
├── /medidas
├── /cama-box
├── /comparativos
└── /quarto-e-casa-nova
```

Ordem: colchões → tamanhos → molas/espumas → comparativos → box → modelos → quarto/casa.

## 3. Lote inicial — 30 pautas

1. Guia completo para escolher colchão;
2. Guia de tamanhos de colchão;
3. Como escolher colchão de solteiro;
4. Como escolher colchão de casal;
5. Como escolher colchão queen;
6. Como escolher colchão king;
7. Medidas de colchão de solteiro;
8. Medidas de colchão de casal;
9. Medidas de colchão queen;
10. Medidas de colchão king;
11. Casal x queen;
12. Queen x king;
13. Colchão de espuma x mola;
14. Molas ensacadas x tradicionais;
15. Colchão firme x macio;
16. Como interpretar firmeza;
17. Como verificar peso suportado;
18. Como medir quarto, acesso e base;
19. O que é cama box;
20. Cama box x cama tradicional;
21. Box conjugado x separado;
22. Como escolher conjunto box;
23. Colchão para casal: critérios;
24. Colchão para apartamento/quarto pequeno;
25. Quanto custa um colchão queen: metodologia e data;
26. Checklist para montar quarto de casal;
27. Análise Probel Alpha, após ficha oficial;
28. Análise Probel Excede Premium, após ficha oficial;
29. Alpha x Excede Premium, se comparáveis;
30. Calculadora: qual tamanho cabe no quarto.

## 4. Página de modelo

- código/nome e tamanho exatos;
- dimensões e altura;
- construção, materiais e tipo de mola/espuma;
- firmeza conforme escala declarada;
- peso suportado e se é por pessoa/total;
- base compatível;
- garantia e cuidados conforme fonte;
- limitações e itens a medir;
- preço observado e data;
- CTA Probel.

Sem ficha oficial, a página permanece em rascunho.

## 5. Calculadora

Entrada: largura/comprimento do quarto, posição aproximada e tamanho considerado. Saída: ocupação e circulação remanescente aproximada. A ferramenta não substitui medição profissional e deve considerar dimensões reais do modelo/base antes da compra.

## 6. Guardrails

- não recomendar colchão como tratamento para dor, coluna, insônia ou condição clínica;
- conteúdos de saúde explicam limites e orientam profissional;
- não inventar medidas padrão quando produto divergir;
- confirmar se peso suportado é individual ou total;
- não prometer durabilidade;
- preço e disponibilidade incluem data;
- “melhor” exige método e amostra suficiente;
- comparativos usam a mesma fonte temporal e unidades consistentes.

## 7. Cadência

- bootstrap: 30 pautas;
- até 4 publicações por semana;
- job diário prioriza ficha/modelo e páginas comerciais vencidas;
- modelos entram somente após os guias de método;
- reavaliar em 8–12 semanas.

## 8. KPIs

- tráfego por tamanho e tecnologia;
- uso da calculadora e passagem para guias;
- clique afiliado por ticket/tamanho;
- cobertura de fichas oficiais;
- atualizações de preço e modelo no prazo;
- claims de saúde bloqueados.
