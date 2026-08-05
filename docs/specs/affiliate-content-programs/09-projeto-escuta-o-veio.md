# Projeto de conteúdo — Escuta o Véio

Programa: `ESCUTA_VEIO_REFORMA`

Loja: `escuta-o-veio`

CTA: `/go/loja/escuta-o-veio`

Risco: `MEDIUM`; `CRITICAL` para instrução estrutural/perigosa

## 1. Tese

Criar um portal de reforma orientado por problema, não por nome do produto. A pessoa busca umidade, infiltração, parede descascando, piso desnivelado ou acabamento; o conteúdo ajuda a investigar limites e tipos de solução antes de apresentar produtos compatíveis.

```text
problema → investigação segura → tipos de solução → ficha técnica → produto → loja
```

## 2. Arquitetura

```text
/reforma
├── /umidade-e-infiltracao
│   ├── /umidade-na-parede
│   ├── /parede-com-mofo
│   ├── /parede-descascando
│   ├── /umidade-vindo-do-chao
│   └── /impermeabilizacao
├── /pisos
│   ├── /cimento-autonivelante
│   ├── /nivelamento
│   └── /contrapiso
├── /resinas-e-acabamentos
├── /artesanato-com-concreto
├── /madeira            # somente após validar catálogo
├── /glossario
└── /ferramentas
```

Prioridade: umidade/infiltração → pisos → resinas → artesanato → madeira validada.

## 3. Lote inicial — 25 pautas

1. Umidade na parede: principais causas possíveis;
2. Como investigar a origem de infiltração com segurança;
3. Umidade x infiltração;
4. Umidade subindo pela parede;
5. Parede descascando: possíveis causas;
6. Parede com mofo: limites do conteúdo e segurança;
7. O que é impermeabilização;
8. Tipos de impermeabilizantes;
9. Como escolher impermeabilizante;
10. O que é bloqueador de umidade;
11. Guia de preparação de superfícies;
12. O que é cimento autonivelante;
13. Quando o cimento autonivelante é usado;
14. Cimento autonivelante x argamassa;
15. Como identificar piso desnivelado;
16. Guia de nivelamento de piso;
17. O que é resina para piso;
18. Tipos de resina;
19. Como escolher resina conforme superfície;
20. Resina x verniz;
21. Massa acrílica x massa corrida;
22. Análise Nivela+ conforme ficha;
23. Análise Smart Resina conforme ficha;
24. Análise SOS Umidade conforme ficha;
25. Calculadora de rendimento/quantidade.

Artesanato e madeira entram no segundo lote após validação do catálogo e das prioridades.

## 4. Diagnóstico da reforma

Ferramenta educacional:

```text
local (parede/piso/teto/externa/madeira/concreto)
→ sinal observado
→ perguntas de triagem
→ causas possíveis, sem diagnóstico definitivo
→ quando chamar profissional
→ guias e categorias relacionadas
```

Não recomendar produto antes de saber superfície, origem provável, ambiente e limitações. Resultado deve declarar que infiltração/estrutura podem exigir avaliação técnica.

## 5. Calculadora

Usa área informada e rendimento oficial por demão/camada. Registra fórmula, número de demãos e margem somente quando a ficha autorizar. A saída é estimativa; porosidade, perda, preparo e condição da base podem alterar consumo.

## 6. Página de produto

Campos: nome exato, indicação do fabricante, superfícies compatíveis, quantidade, rendimento, preparo, mistura, EPI, aplicação, tempo de secagem/cura, temperatura/umidade de aplicação, limitações, ficha técnica, preço/data e CTA.

## 7. Guardrails

- nunca dar diagnóstico estrutural definitivo;
- não orientar intervenção elétrica, altura ou substância perigosa sem protocolo seguro;
- seguir ficha técnica para mistura, cura, compatibilidade e EPI;
- não combinar produtos sem fonte;
- alertar que mascarar umidade sem corrigir origem pode falhar;
- mofo e ambientes insalubres exigem cautela;
- conteúdo local apenas com diferença climática/dados reais, nunca cidade trocada;
- categoria madeira permanece bloqueada até o catálogo ser confirmado.

## 8. Cadência e KPIs

- bootstrap: 25 pautas; até 4 publicações por semana;
- job diário dá prioridade a fichas vencidas e correções técnicas;
- métricas: tráfego por problema, progressão para solução, uso de ferramentas, clique afiliado, cobertura de fichas, bloqueios de segurança e páginas stale.
