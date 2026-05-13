# Dashboard, Logs e UX

## Objetivo

Dar visibilidade total do estado de cada URL. O usuario deve entender em poucos segundos o que esta pronto, o que esta rodando, o que falhou e quando tentara novamente.

## Dashboard principal

Cards recomendados:

- URLs pendentes;
- em processamento;
- aguardando POD;
- com erro;
- videos finais prontos;
- stories agendados;
- publicados hoje;
- status atual do POD.

## Lista de URLs

Colunas:

- produto;
- URL original;
- status geral;
- etapa atual;
- tentativas;
- proxima execucao;
- ultimo erro;
- ultima atualizacao;
- acoes.

Acoes:

- ver detalhes;
- pausar;
- ativar;
- reprocessar etapa;
- forcar proxima etapa;
- ver logs;
- abrir midias;
- abrir video final.

## Detalhe da URL

Mostrar uma timeline visual:

```txt
[OK Scraping] -> [OK Copy IA] -> [Aguardando POD] -> [Pendente Audio] -> [Pendente Video Copy] -> [Pendente Merge] -> [Pendente Afiliado] -> [Pendente Story]
```

Para cada etapa:

- status;
- inicio;
- fim;
- duracao;
- tentativas;
- proximo retry;
- ultimo erro;
- link para request/response.

## Logs cronologicos

Exibir:

- data/hora;
- nivel;
- etapa;
- mensagem;
- metadados expansivel.

Filtros:

- todos;
- erros;
- warnings;
- etapa especifica;
- tentativa especifica.

## Estado do POD na tela

Mostrar:

- online/offline;
- busy/idle;
- job atual;
- ultima checagem;
- ultima atividade;
- botao manual de desligar com confirmacao.

Status:

- OK Mostrar online/offline no dashboard (Chip `POD:`).

## Regras de UX

- Nao esconder erro em toast temporario apenas.
- Toda falha precisa aparecer na linha da URL e no detalhe.
- A tela deve diferenciar `erro definitivo` de `reagendado`.
- O usuario deve conseguir copiar o erro e payload para debug.
- O visual deve ser operacional, denso e facil de escanear.
