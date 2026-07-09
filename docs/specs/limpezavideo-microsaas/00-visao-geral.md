# Spec - LimpezaVideo Microsaas

## Objetivo

Criar um microsaas novo em `https://plugandoia.claud/limpezavideo`, com login proprio, lista de jobs e pipeline de upload/processamento para:

- receber um video enviado pelo usuario;
- armazenar o original no MinIO;
- executar um tratamento padronizado de limpeza;
- subir o arquivo final no MinIO;
- devolver a URL publica do video processado;
- mostrar status, progresso e estimativa de tempo na interface.

## Posicionamento do produto

O produto deve ser tratado como um modulo independente da area admin atual.

Independente significa:

- URL propria em `/limpezavideo`;
- tela de login propria em `/limpezavideo/login`;
- guardas de acesso proprias;
- tabela/lista operacional propria;
- modelo de dados proprio;
- evolucao futura para plano pago sem acoplamento ao admin.

## O que vamos reaproveitar do projeto atual

- `next-auth` e o fluxo de credenciais ja existente em `lib/auth.ts`;
- upload para MinIO em `app/api/upload/route.ts` e `lib/shopee-pipeline/minioUpload.ts`;
- Prisma como camada de persistencia;
- padrao de eventos, steps e status usado nos pipelines de video existentes;
- capacidade de processamento em Python e/ou servico dedicado de render.

## Escopo funcional do MVP

- login por credenciais para um usuario inicial;
- listagem profissional de jobs com acao `Novo`;
- upload de video direto na tela;
- inicio automatico do processamento apos upload;
- exibicao de status em tempo real por polling no MVP;
- URL do video original e URL do video final;
- download do video final;
- reprocessamento manual;
- logs basicos por etapa.

## Tratamentos permitidos no MVP

- remocao de metadados por recodificacao;
- geracao de novo arquivo de saida com codec padrao;
- corte do trecho inicial configuravel;
- normalizacao do audio;
- opcao de mutar ou reduzir audio de forma configuravel;
- opcao de overlays legitimos, como legenda, selo de marca ou barra de seguranca;
- ajustes tecnicos de resolucao, fps e bitrate.

## Fora do escopo desta spec

- qualquer especificacao voltada a enganar sistemas de deteccao de duplicidade;
- automacao de postagem em redes sociais;
- cobranca, assinatura e multi-tenant completo;
- editor timeline completo no navegador;
- inferencia pesada de IA para detectar automaticamente "tudo que parece Shopee" no frame.
