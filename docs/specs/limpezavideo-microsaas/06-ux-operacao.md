# UX e Operacao

## Tela principal

A home de `/limpezavideo` deve funcionar como uma fila profissional.

Componentes:

- header com nome do produto e botao `Novo`;
- card com regras do upload;
- tabela/lista com jobs;
- drawer ou modal para upload;
- detalhe lateral ou pagina de detalhe para logs.

## Colunas da lista

- nome do arquivo;
- criado em;
- duracao;
- status;
- progresso;
- ETA;
- audio mode;
- URL final;
- acoes.

## Acao `Novo`

Ao clicar:

- abrir modal ou drawer;
- permitir arrastar e soltar video;
- permitir configurar:
  - trim inicial;
  - modo de audio;
  - volume percentual quando `REDUCE`.

Ao confirmar:

- upload inicia imediatamente;
- a tela fecha ou vai para estado de envio;
- o job aparece na lista em tempo real.

## Feedback de processamento

No MVP, usar polling com `setInterval`.

O usuario deve ver:

- etapa atual;
- percentual;
- ETA simples em minutos/segundos;
- erro amigavel quando falhar.

## Estado vazio

Precisa parecer produto, nao painel tecnico cru.

Mensagem sugerida:

- "Envie seu primeiro video para gerar uma versao limpa, recodificada e pronta para uso."

## Identidade visual

Por ser microsaas separado:

- manter linguagem mais produto/SaaS;
- evitar cara de admin interno;
- manter responsivo para desktop e mobile.
