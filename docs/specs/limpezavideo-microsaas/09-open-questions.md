# Open Questions

## Decisoes confirmadas

1. Nao vamos cortar o inicio do video no MVP.

Em vez disso:

- o video deve permanecer inteiro;
- o processamento adiciona um fechamento visual no final;
- esse fechamento tera o logo da marca e o Instagram `@compraesperta.promocoes`.

2. O processamento rodara no worker Python atual.

Detalhe:

- podemos criar novas funcoes nele quando necessario;
- o Next continua como orquestrador e camada de produto.

3. O login separado vai reaproveitar o mesmo `next-auth`.

Detalhe:

- teremos tela propria em `/limpezavideo/login`;
- teremos guard proprio para `/limpezavideo`.

## Pendencias restantes

1. Quais formatos de entrada voce quer aceitar no MVP alem de `mp4`?

2. O output deve sempre preservar a resolucao original ou padronizar para `1080x1920` quando o video vier vertical?

3. Queremos manter o original acessivel por URL na interface ou apenas o final?

4. O arquivo final do logo ja esta disponivel no projeto ou voce ainda vai anexar/enviar?

## Recomendacoes atuais para o MVP

- aceitar `mp4`, `mov` e `webm`;
- preservar resolucao por padrao;
- exibir original e final na tela de detalhe;
- tratar o logo como asset configuravel do produto.
