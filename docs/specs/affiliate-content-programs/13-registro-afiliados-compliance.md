# Registro de afiliados e compliance

## 1. Fonte de verdade

Esta tabela documenta o vínculo esperado, mas o runtime deve ler `AffiliateStore`. A URL nunca é copiada para conteúdo, prompt, template ou configuração paralela.

| Programa | `storeSlug` | Host obrigatório | Tracking obrigatório | CTA interno |
|---|---|---|---|---|
| Cobasi | `cobasi` | `minhaloja.cobasi.com.br` | `utm_source=mais`, `utm_medium=maisplataforma`, `utm_campaign=willianbarata` | `/go/loja/cobasi` |
| Brascol | `brascol` | `brascol.com.br` | mesmos três UTMs | `/go/loja/brascol` |
| Electrolux | `electrolux` | `loja.electrolux.com.br` | mesmos três UTMs | `/go/loja/electrolux` |
| Cicatribem | `cicatribem` | `cicatribem.com.br` | mesmos três UTMs | `/go/loja/cicatribem` |
| Pibe Brasil | `pibe-brasil` | `pibebrasil.com.br` | mesmos três UTMs | `/go/loja/pibe-brasil` |
| Funko Brasil | `funko-brasil` | `www.funko.com.br` | mesmos três UTMs | `/go/loja/funko-brasil` |
| Probel | `probel` | `www.probel.com.br` | mesmos três UTMs | `/go/loja/probel` |
| Thermos Brasil | `thermos-brasil` | `www.thermosbrasil.com.br` | `parceiro=12410`, `am=willianbarata` | `/go/loja/thermos-brasil` |
| Escuta o Véio | `escuta-o-veio` | `www.escutaoveio.com` | mesmos três UTMs | `/go/loja/escuta-o-veio` |
| GLNC Farma | `glnc-farma` | `www.glncfarma.com` | mesmos três UTMs | `/go/loja/glnc-farma` |
| TNG | `tng` | `www.tng.com.br` | mesmos três UTMs | `/go/loja/tng` |
| Drogaria Rosário | `drogaria-rosario` | `www.drogariarosario.com.br` | mesmos três UTMs | `/go/loja/drogaria-rosario` |

“Mesmos três UTMs” significa os valores descritos na linha Cobasi. O validador deve comparar mapa chave/valor, não ordem textual da query.

## 2. Política de resolução

`buildAffiliateHref` recebe somente:

```ts
type AffiliateCtaInput = {
  programKey: string;
  pageId: string;
  placement: string;
  destinationPath?: string;
};
```

O servidor:

1. encontra `ContentProgram` ativo;
2. obtém `affiliateStoreId` e a loja ativa;
3. valida `https`, host e tracking cadastrado;
4. valida `destinationPath` contra a política de deep link;
5. gera apenas `/go/loja/{slug}` com parâmetros internos não comerciais;
6. no clique, reconstrói o destino preservando tracking obrigatório;
7. registra clique antes do redirect.

## 3. Deep links

- desativados por padrão;
- permitidos somente no mesmo host ou hosts explicitamente cadastrados;
- path deve começar com `/` e não pode conter credenciais, protocolo ou host;
- query do usuário não substitui tracking;
- fragmentos e parâmetros extras passam por allowlist;
- falha usa a URL afiliada base válida, nunca URL limpa;
- se a URL afiliada base também falhar, não há redirect externo.

## 4. Scanner de conteúdo

Antes da publicação, varrer:

- HTML;
- Markdown;
- JSON editorial;
- metadata;
- FAQ;
- legenda e alt;
- fontes;
- configurações de botões.

Hosts comerciais das doze lojas são proibidos no corpo, exceto em `sourcesJson` com `purpose=PRIMARY_SOURCE`, sem renderização como CTA. URLs internas permitidas começam com `/go/loja/` e devem corresponder ao programa.

## 5. Disclosure

Antes do primeiro CTA:

> O Compra Esperta é um site independente. Podemos receber comissão quando você compra por alguns links, sem custo adicional para você. Preços, estoque e condições devem ser confirmados na loja.

Conteúdo local acrescenta que o site não representa nem opera a unidade. Conteúdo de saúde não transforma o disclosure em aviso clínico; deve possuir aviso editorial próprio.

## 6. Regras comerciais

- preço exige fonte e `priceObservedAt`;
- disponibilidade exige `availabilityObservedAt`;
- nunca afirmar desconto sem preço anterior verificável;
- não usar urgência artificial;
- “melhor” e rankings exigem método visível;
- review sem teste prático deve chamar-se análise de ficha/rótulo/características;
- não atribuir depoimentos ou notas não coletadas pelo site;
- imagens somente com licença ou permissão registrada;
- não sugerir relação oficial com a loja.

## 7. Testes bloqueantes

1. cada programa resolve exatamente para seu `storeSlug`;
2. Thermos passa com `parceiro/am` e falha sem qualquer um deles;
3. demais programas falham sem qualquer UTM obrigatório;
4. ordem diferente da query não altera validação;
5. URL direta em qualquer campo editorial bloqueia;
6. deep link cross-host bloqueia;
7. query de entrada não sobrescreve tracking;
8. loja pausada impede publicação e redirect;
9. CTA renderiza `rel="sponsored"`;
10. evento de clique contém programa, página e posição, sem dado pessoal bruto.

