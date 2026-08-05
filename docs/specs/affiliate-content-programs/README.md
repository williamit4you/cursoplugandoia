# Plataforma de marketing de conteúdo afiliado — Spec-Driven Development

Status: especificação funcional e técnica consolidada

Data de referência: 5 de agosto de 2026

Site: `https://compraesperta-promocoes.shop`

Programas: Cobasi, Brascol, Electrolux, Cicatribem, Pibe Brasil, Funko Brasil, Probel, Thermos Brasil, Escuta o Véio, GLNC Farma, TNG e Drogaria Rosário

## 1. Resultado esperado

Construir uma plataforma editorial multi-loja capaz de pesquisar oportunidades, gerar conteúdo original, revisar, agendar, publicar, atualizar e retirar páginas do sitemap com segurança. A aquisição deve ocorrer por problemas, necessidades, categorias, ocasiões, perfis e localidades — não pela repetição indiscriminada do nome das lojas.

O sistema terá uma Central de Programas Afiliados e uma aba por programa. Cobasi mantém a aba existente durante a migração; os outros programas entram sobre o motor compartilhado.

```text
/admin/programas-afiliados
├── /cobasi
├── /brascol
├── /electrolux
├── /cicatribem
├── /pibe-brasil
├── /funko-brasil
├── /probel
├── /thermos-brasil
├── /escuta-o-veio
├── /glnc-farma
├── /tng
└── /drogaria-rosario
```

## 2. Decisões executivas

1. Não publicar centenas de páginas de uma vez.
2. Criar o inventário e os primeiros rascunhos por lote; publicar gradualmente.
3. Executar um job diário por programa, sem obrigação de criar conteúdo novo todos os dias.
4. Reutilizar agentes e pipeline; regras editoriais são configuradas por programa.
5. Manter `autoPublish = false` durante o piloto de todos os programas.
6. Usar exclusivamente a loja ativa em `AffiliateStore` como fonte do destino afiliado.
7. Bloquear publicação e sitemap quando tracking, domínio, fontes, qualidade ou compliance falharem.
8. Criar página indexável apenas quando houver intenção própria e valor que não possa ser atendido por outra URL.
9. Medir cada lote por 8–12 semanas antes de acelerar o respectivo cluster.

## 3. Portfólio inicial

| Programa | Tese de aquisição | Primeiro lote | Publicação piloto |
|---|---|---:|---:|
| Cobasi | produtos pet + SEO local útil | 18–24 | até 1/dia |
| Brascol | revenda de moda bebê/infantil | 30 | 3/semana |
| Electrolux | casa, cozinha e eletrodomésticos | 36 | até 5/semana |
| Cicatribem | skincare, começando por manchas | 30 | 3/semana |
| Pibe Brasil | creatina + suplementos em gummies | 20 | 3/semana |
| Funko Brasil | anime, franquia, personagem e coleção | 30 | até 5/semana |
| Probel | colchões, tamanhos, tecnologias e quarto | 30 | 4/semana |
| Thermos Brasil | copos, garrafas, canecas e café | 30 | 4/semana |
| Escuta o Véio | problema de obra → solução → produto | 25 | 4/semana |
| GLNC Farma | nutrientes, rótulos e comparação | 20 | 3/semana |
| TNG | ocasião, look, combinação e peça | 25 | 4/semana |
| Drogaria Rosário | cuidados pessoais, beleza, bebê e local | 30 | 4/semana |

Os números são limites de bootstrap, não metas cegas de publicação. Um lote pode permanecer em rascunho, ser fundido com outro ou ser cancelado.

## 4. Regra inegociável de afiliado

- O conteúdo armazena `programKey`, nunca uma URL comercial.
- O CTA renderiza `/go/loja/{storeSlug}`.
- O redirecionador consulta `AffiliateStore` no momento do clique.
- Tracking obrigatório é validado conforme a loja; Thermos não usa o padrão UTM das demais.
- Deep link só existe quando o host está autorizado e os parâmetros do afiliado são preservados.
- Qualquer URL direta de uma loja no corpo editorial bloqueia publicação.
- Todo CTA recebe `rel="sponsored"`.
- Um programa nunca pode usar a loja de outro programa.

O registro completo está em [links afiliados e compliance](./13-registro-afiliados-compliance.md).

## 5. Fluxo obrigatório

```text
OPPORTUNITY
→ CANIBALIZATION_CHECK
→ RESEARCH
→ BRIEF
→ DRAFT
→ FACT_REVIEW
→ SEO_REVIEW
→ COMPLIANCE_REVIEW
→ AFFILIATE_PREFLIGHT
→ HUMAN_APPROVAL
→ PUBLISH
→ SITEMAP_AUDIT
→ PERFORMANCE_MONITORING
→ REFRESH | MERGE | ARCHIVE
```

## 6. Documentos normativos

### Requisitos de produto e plataforma

- [Requisitos do produto](./00-requisitos-produto.md)
- [Plano técnico compartilhado](./03-plano-tecnico-compartilhado.md)
- [Links afiliados e compliance](./13-registro-afiliados-compliance.md)
- [SEO, templates e sitemap](./14-seo-templates-sitemap.md)
- [Jobs, agentes e operação](./15-jobs-agentes-operacao.md)
- [Modelo de dados, APIs e painel](./16-modelo-dados-apis-painel.md)
- [Roadmap e critérios de aceite](./17-roadmap-criterios-aceite.md)

### Estratégia por programa

- [Cobasi — programa pet e cidades](../cobasi-content-seo/README.md)
- [Brascol](./01-projeto-brascol.md)
- [Electrolux](./02-projeto-electrolux.md)
- [Cicatribem](./04-projeto-cicatribem.md)
- [Pibe Brasil](./05-projeto-pibe-brasil.md)
- [Funko Brasil](./06-projeto-funko-brasil.md)
- [Probel](./07-projeto-probel.md)
- [Thermos Brasil](./08-projeto-thermos-brasil.md)
- [Escuta o Véio](./09-projeto-escuta-o-veio.md)
- [GLNC Farma](./10-projeto-glnc-farma.md)
- [TNG](./11-projeto-tng.md)
- [Drogaria Rosário](./12-projeto-drogaria-rosario.md)

## 7. Definition of Done do programa

Um programa está pronto para operar quando:

- possui `ContentProgram` ligado à `AffiliateStore` correta;
- políticas editorial, de fontes, risco e tracking estão configuradas;
- taxonomia e lote inicial foram importados sem slugs duplicados;
- job pode ser pausado e executado manualmente;
- rascunho e preview são `noindex`;
- preflight bloqueia links errados, fatos sem fonte e headings inválidos;
- exatamente um H1 e hierarquia H2/H3 válida são comprovados no HTML;
- páginas publicadas elegíveis entram no sitemap automaticamente;
- métricas de conteúdo e clique afiliado são atribuídas ao programa e página;
- testes de isolamento provam que nenhuma loja recebe CTA de outra.

## 8. Rastreabilidade com os documentos do especialista

| Programa | Diretriz preservada no spec |
|---|---|
| Cobasi | produto antes da marca, clusters pet e cidade somente com conteúdo local próprio |
| Brascol | revenda/empreendedorismo e foco validado em bebê/infantil |
| Electrolux | jornada completa de eletrodomésticos, ambiente, orçamento e manutenção segura |
| Cicatribem | começar por manchas e tratar pele como conteúdo de saúde sensível |
| Pibe Brasil | começar por creatina + gummies, com rigor de rótulo e evidência |
| Funko Brasil | franquia/personagem/coleção, lançamentos, presentes e conteúdo visual |
| Probel | tamanho/tecnologia/comparação/modelo, incluindo ferramenta de medidas |
| Thermos Brasil | copo/garrafa/caneca, finalidade, capacidade, café e presentes |
| Escuta o Véio | problema → solução, com ficha técnica, diagnóstico educativo e calculadora |
| GLNC Farma | nutriente → rótulo → comparação, sem sintoma → suplemento |
| TNG | ocasião → look → peça e combinações úteis, incluindo montador de look |
| Drogaria Rosário | cuidados pessoais/recorrência, saúde responsável e SEO local verificado |

As pautas indicadas pelo especialista foram convertidas em inventários iniciais. Elas continuam sujeitas à pesquisa, canibalização, disponibilidade de fontes e preflight antes de qualquer publicação.
