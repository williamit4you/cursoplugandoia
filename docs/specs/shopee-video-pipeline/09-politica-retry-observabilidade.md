# Retry e Observabilidade

## Politica inicial de retry

| Etapa | Tentativas | Intervalo |
| --- | ---: | --- |
| Scraping de midias | 3 | 10 minutos |
| IA copy | 3 | 10 minutos |
| Ligar POD | sem limite definitivo inicial | 30 minutos |
| Gerar audio | 3 | 30 minutos |
| Gerar video da copy | 3 | 30 minutos |
| Merge de videos | 2 | 15 minutos |
| Gerar link afiliado | 3 | 30 minutos |
| Publicacao social | 3 por plataforma | 30 minutos |

## Erros temporarios

Devem gerar `RETRY_SCHEDULED`:

- timeout;
- HTTP 429;
- HTTP 500/502/503/504;
- POD offline;
- dependencia indisponivel;
- falha de rede;
- job externo ainda em processamento.

## Erros permanentes

Podem gerar `FAILED`:

- URL invalida;
- produto removido;
- midia obrigatoria ausente sem fallback;
- credencial invalida;
- payload rejeitado por validacao;
- limite de tentativas excedido.

## Dados a registrar em toda chamada externa

- URL/endpoint chamado;
- metodo;
- payload sanitizado;
- status HTTP;
- response body sanitizado;
- duracao;
- correlation id, se existir;
- erro bruto;
- erro amigavel.

## Sanitizacao

Nunca registrar segredos em texto puro:

- tokens;
- client secrets;
- cookies;
- authorization headers;
- chaves de API.

## Metricas recomendadas

- tempo medio por etapa;
- taxa de sucesso por etapa;
- quantidade de retries por dia;
- tempo de POD online;
- custo estimado do POD;
- videos finalizados por dia;
- publicacoes com sucesso por plataforma.

