# Roadmap e critérios de aceite

## 1. Estratégia de entrega

O objetivo é colocar a plataforma em produção por fatias verticais. Cada fase entrega comportamento testável; nenhuma depende de publicar todo o inventário.

## 2. Fase 0 — estabilização e banco

- reconciliar com segurança o histórico de migrações existente;
- confirmar que `AffiliateStore` contém as doze lojas ativas e URLs esperadas;
- preservar o conserto do botão Publicar da Cobasi;
- executar regressão de Cobasi e sitemap atual;
- criar backup antes de migração multi-programa.

Aceite: migrações têm estado consistente; Cobasi gera, revisa, publica/despublica e revalida as rotas sem erro de tela.

## 3. Fase 1 — núcleo multi-programa

- criar modelos e migração;
- cadastrar políticas e programas;
- implementar affiliate guard configurável;
- adicionar scanner de conteúdo;
- implementar estados, revisions, reviews e runs;
- construir scheduler e endpoint autenticado.

Aceite: um programa de teste percorre rascunho até publicação; testes provam isolamento entre todas as lojas.

## 4. Fase 2 — painel e templates

- Central de Programas;
- aba por loja;
- fila, execução, fontes, review, preview e preflight;
- templates de hub, guia, compra, comparativo, review, local e ferramenta;
- renderização de headings, metadata, canonical, schema e disclosure;
- sitemap multi-programa.

Aceite: conteúdo publicado responde 200, tem exatamente um H1, H2/H3 válidos, CTA correto e presença determinística no sitemap.

## 5. Fase 3 — migração Cobasi

- criar `COBASI_PET`;
- adaptar pipeline sem alterar URLs públicas;
- importar/configurar 97 cidades como inventário não indexável;
- manter aba legada como alias ou frontend do novo domínio;
- rodar testes de regressão.

Aceite: paridade funcional e nenhuma troca de canonical, CTA ou sitemap.

## 6. Fase 4 — ondas de programas

### Onda A — baixo/médio risco e boa validação do motor

1. Thermos Brasil;
2. TNG;
3. Funko Brasil;
4. Brascol.

### Onda B — especificação técnica e preço

5. Probel;
6. Electrolux;
7. Escuta o Véio.

### Onda C — saúde/YMYL

8. Cicatribem;
9. Pibe Brasil;
10. GLNC Farma;
11. Drogaria Rosário.

Cada programa importa o lote, gera de 3 a 5 rascunhos, valida o template e só então completa o lote inicial.

## 7. Fase 5 — observação e escala

- conectar Search Console;
- observar cada lote por 8–12 semanas;
- consolidar páginas canibalizadas;
- ampliar apenas clusters com sinais reais;
- ativar sitemaps separados quando necessário;
- liberar revisão por amostragem somente para `LOW`, após histórico sem incidentes;
- manter `HIGH` com aprovação especializada.

## 8. Critérios de aceite globais

### Afiliado

- [ ] doze programas resolvem para os doze `storeSlug` documentados;
- [ ] nenhum CTA aceita URL externa arbitrária;
- [ ] Thermos valida `parceiro/am`;
- [ ] os demais validam os três UTMs;
- [ ] loja pausada bloqueia publicação e redirect;
- [ ] links comerciais renderizam `rel="sponsored"`;
- [ ] nenhum programa usa CTA de outro.

### Conteúdo e SEO

- [ ] H1 único;
- [ ] nenhum salto H1→H3;
- [ ] title, description e canonical únicos;
- [ ] schema coerente com a página visível;
- [ ] rascunho é `noindex` e não aparece no sitemap;
- [ ] publicada elegível responde 200 e aparece no sitemap;
- [ ] página possui entrada e saída em links internos;
- [ ] similaridade/canibalização passa os limites;
- [ ] fonte e data de revisão estão visíveis quando exigidas.

### Operação

- [ ] cron é idempotente e autenticado;
- [ ] lock impede concorrência por página/programa;
- [ ] retry não duplica revisão/publicação;
- [ ] `WAIT` não é tratado como falha;
- [ ] orçamento pausa criação sem impedir auditorias locais;
- [ ] três falhas pausam somente o programa afetado;
- [ ] tela mostra erro editorial sem crash;
- [ ] despublicação remove rota do sitemap.

### Compliance específico

- [ ] saúde não diagnostica, prescreve dose ou promete cura;
- [ ] medicamentos não são recomendados por sintoma;
- [ ] Electrolux não orienta reparo perigoso;
- [ ] Escuta o Véio respeita ficha técnica, EPI e limites;
- [ ] Probel não vende colchão como tratamento;
- [ ] Brascol não promete lucro/faturamento;
- [ ] Funko registra origem/licença de imagens;
- [ ] páginas locais não afirmam representação oficial.

## 9. Cenários Given/When/Then prioritários

### Publicação segura

```gherkin
Given uma página aprovada do programa THERMOS_TERMICOS
And a loja thermos-brasil está ativa com parceiro=12410 e am=willianbarata
When o editor publica a revisão aprovada
Then a página fica PUBLISHED e indexable
And o CTA aponta para /go/loja/thermos-brasil
And a página entra no sitemap elegível
```

### Tracking incorreto

```gherkin
Given a URL afiliada da Thermos sem o parâmetro parceiro
When o preflight é executado
Then o achado AFFILIATE_TRACKING_MISSING é BLOCKER
And a página não é publicada
And a tela permanece aberta com a mensagem registrada
```

### Isolamento

```gherkin
Given uma página do programa TNG_MODA_MASCULINA
When um conteúdo ou configuração tenta usar /go/loja/probel
Then o preflight rejeita AFFILIATE_STORE_MISMATCH
And nenhuma versão é publicada
```

### Saúde

```gherkin
Given um rascunho da GLNC com recomendação de dose personalizada
When o Compliance Reviewer executa
Then o conteúdo recebe BLOCK
And não pode ser aprovado no fluxo comum
```

### Sitemap

```gherkin
Given uma página publicada cuja fonte crítica venceu
When a auditoria diária executa
Then a página fica STALE
And sai do sitemap quando a informação vencida é central
And uma tarefa UPDATE_STALE_PAGE é criada
```

## 10. Definition of Done da implementação

- migração revisada e aplicável;
- seed idempotente dos doze programas;
- build e typecheck passam;
- testes unitários, integração e E2E críticos passam;
- Cobasi mantém regressão verde;
- painel e rotas protegidos;
- primeiro programa da Onda A opera do começo ao fim;
- documentação de operação e rollback disponível;
- nenhuma publicação automática ativada sem decisão posterior registrada.

