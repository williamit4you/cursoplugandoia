# Auth e Roteamento

## Objetivo

Criar uma experiencia separada do admin atual, mas reaproveitando a infraestrutura ja existente de autenticacao.

## Rotas novas

- `/limpezavideo/login`
- `/limpezavideo`
- `/limpezavideo/jobs/[id]`

## Estrategia confirmada

Usar o mesmo `next-auth` atual com duas mudancas:

- pagina de login separada para o microsaas;
- validacao de acesso por rota e papel do usuario.

## Como separar sem duplicar tudo

Opcao confirmada para o MVP:

- manter um unico provider de credenciais;
- adicionar `role` ou `allowedApps` no token/session;
- proteger `/limpezavideo/:path*` no `middleware.ts`;
- redirecionar nao autenticados para `/limpezavideo/login`.

## Guardas de acesso

Para o MVP, permitir acesso apenas para:

- `ADMIN`; ou
- role dedicada `VIDEO_CLEANUP_OWNER`.

No futuro, migrar para:

- `VIDEO_CLEANUP_OWNER`
- `VIDEO_CLEANUP_OPERATOR`
- `VIDEO_CLEANUP_CUSTOMER`

## UX de login

A tela nova nao deve aparentar ser parte do admin.

Requisitos:

- identidade visual propria;
- formulario enxuto;
- callback para `/limpezavideo`;
- mensagem clara de erro.

## Semente de acesso inicial

Credenciais informadas:

- email: `willianbarata@gmail.com`
- senha inicial: `Will#2028`

Implementacao segura:

- gerar hash com `bcryptjs`;
- criar seed idempotente;
- documentar que a senha deve ser trocada fora do codigo antes de expor comercialmente.
