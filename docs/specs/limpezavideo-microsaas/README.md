# LimpezaVideo Microsaas Specs

Esta pasta contem a especificacao orientada a desenvolvimento do microsaas `limpezavideo`.

Ordem recomendada de leitura:

1. `00-visao-geral.md`
2. `01-escopo-produto.md`
3. `02-modelo-dados.md`
4. `03-auth-e-roteamento.md`
5. `04-pipeline-processamento.md`
6. `05-apis-e-contratos.md`
7. `06-ux-operacao.md`
8. `07-observabilidade-seguranca.md`
9. `08-plano-implementacao.md`
10. `09-open-questions.md`

Objetivo da pasta:

- definir um microsaas novo e independente do admin atual;
- reaproveitar o que o projeto ja possui de auth, MinIO, Prisma e pipeline;
- registrar contratos e estados antes da implementacao;
- permitir evolucao futura para cobranca e multiusuario;
- deixar claro o que entra no MVP e o que fica para depois.

Limite desta spec:

- esta spec cobre limpeza, corte inicial, recodificacao, normalizacao e sobreposicoes visuais legitimas;
- ela nao define automacoes destinadas a burlar deteccao de duplicidade, fingerprinting ou politicas de plataformas.
