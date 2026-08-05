# Programas de marketing de conteúdo afiliado

Status: projeto editorial e técnico  
Data: 5 de agosto de 2026  
Programas: Brascol e Electrolux  
Site: `https://compraesperta-promocoes.shop`

## Decisão executiva

Os dois programas devem usar uma plataforma editorial compartilhada, mas filas e regras distintas.

| Programa | Estratégia | Lote inicial | Cadência após o lote | Escala saudável estimada |
|---|---|---:|---|---:|
| Brascol | portal B2B para revendedores de moda bebê e infantil | 30 páginas | job diário; 3 publicações/semana | 120–250 páginas |
| Electrolux | portal de casa, cozinha e eletrodomésticos | 36 páginas | job diário; 1 publicação/dia no piloto | 400–800 páginas antes de reavaliar |

Não é recomendável criar tudo de uma vez. O sistema pode gerar o lote inicial rapidamente como rascunho, mas a publicação deve ser gradual para validar originalidade, intenção, fontes, indexação e conversão. O job diário não precisa criar uma página todos os dias: ele também pesquisa, atualiza preços/especificações, revalida fontes, revisa conteúdos antigos e audita sitemap.

## Fonte única dos links afiliados

Os dois registros já existem em `AffiliateStore`:

- `storeSlug = brascol`: `https://brascol.com.br?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata`;
- `storeSlug = electrolux`: `https://loja.electrolux.com.br/?utm_source=mais&utm_medium=maisplataforma&utm_campaign=willianbarata`.

Regra obrigatória:

- Brascol: todo CTA usa `/go/loja/brascol`;
- Electrolux: todo CTA usa `/go/loja/electrolux`;
- autores e agentes nunca recebem permissão para inserir URL comercial externo;
- o servidor consulta `AffiliateStore`, valida HTTPS, domínio e os três parâmetros;
- falha de validação bloqueia publicação e sitemap;
- links recebem `rel="sponsored"`;
- preço, estoque e condição promocional nunca são persistidos sem fonte atualizável.

## Plataforma compartilhada recomendada

Em vez de duplicar o módulo da Cobasi duas vezes, a próxima implementação deve generalizar o motor:

```text
ContentProgram
├── COBASI_PET
├── BRASCOL_REVENDA_MODA
└── ELECTROLUX_CASA

Cada programa
├── configuração e cadência
├── loja afiliada obrigatória
├── taxonomia e pautas
├── prompts e regras de segurança
├── fila e execuções
├── fontes e expiração
├── revisão e publicação
└── sitemap e analytics
```

Painéis:

- `/admin/seo-pet-cobasi`;
- `/admin/conteudo-brascol`;
- `/admin/conteudo-electrolux`;
- visão consolidada opcional em `/admin/programas-afiliados`.

## Fluxo comum

```text
oportunidade
→ verificação de canibalização
→ pesquisa em fontes autorizadas
→ briefing
→ redação
→ revisão factual/SEO/compliance
→ validação do afiliado
→ rascunho
→ aprovação
→ publicação
→ sitemap
→ monitoramento e atualização
```

## Documentos

- [Projeto Brascol](./01-projeto-brascol.md)
- [Projeto Electrolux](./02-projeto-electrolux.md)
- [Plano técnico compartilhado](./03-plano-tecnico-compartilhado.md)

## Fontes primárias consultadas

- [Brascol — site oficial e categorias](https://brascol.com.br/)
- [Brascol — quem somos](https://brascol.com.br/pagina/quem-somos)
- [Electrolux — loja oficial](https://loja.electrolux.com.br/)
- [Electrolux — departamento de eletrodomésticos](https://loja.electrolux.com.br/eletrodomesticos)

