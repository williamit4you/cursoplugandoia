# Observabilidade e Seguranca

## Observabilidade minima

Cada job precisa registrar:

- quando entrou;
- quem enviou;
- qual etapa esta rodando;
- quanto tempo levou;
- por que falhou;
- onde esta o arquivo final.

## Logs

Fontes:

- eventos no banco;
- logs do processo de transcode;
- tempo por etapa;
- erros de MinIO;
- erros de validacao.

## Alertas do MVP

Mesmo sem sistema de alerta externo, considerar:

- contagem de jobs `FAILED`;
- jobs em `PROCESSING` acima do SLA esperado;
- falhas repetidas na etapa `TRANSCODE_SANITIZE`.

## Seguranca

- nao aceitar upload anonimo;
- validar mime type e extensao;
- impor limite de tamanho do arquivo;
- nao expor caminhos internos do servidor;
- nunca armazenar senha em texto puro;
- restringir listagem aos jobs do usuario autenticado.

## Protecao operacional

- nao apagar o original automaticamente no MVP;
- permitir reprocesso a partir do original;
- limpar apenas arquivos temporarios locais.

## Preparacao para cobranca futura

Mesmo no MVP, salvar:

- `ownerUserId`;
- `fileSizeBytes`;
- `durationSec`;
- timestamps de processamento.

Isso prepara metrica futura de:

- consumo por minuto;
- limites por plano;
- custo por job.
