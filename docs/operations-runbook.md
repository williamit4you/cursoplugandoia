# Runbook de Operacao

## Timezone oficial

- Timezone operacional: `America/Sao_Paulo`.
- Todos os horarios de fila e relatorios usam esse timezone.
- Horario de verao nao deve ser calculado manualmente: use sempre timezone IANA no ambiente e no provedor de cron.

## Politica de publicacao

- Noticias automatizadas: publicadas no site ao criar; remocao posterior e feita mudando o status para rascunho.
- Redes sociais: somente itens agendados sao enviados pelo cron social.
- Recuperacao: posts vencidos ou falhos podem ser simulados e reagendados em slots futuros de duas horas.
- Conteudo SEO de produto: briefs sao gerados automaticamente, mas publicacao fica em `DRAFT` ate que as fontes, preco e links afiliados estejam validados.

## Credenciais e seguranca

1. Rotacione imediatamente qualquer token exibido em screenshot, chat ou log.
2. Guarde segredos somente em variaveis de ambiente ou no cofre do provedor.
3. Confirme YouTube OAuth em producao, com Client ID, Client Secret e Redirect URI iguais aos da aplicacao.
4. Cadastre Search Console e Google Trends/Keyword Planner antes de interpretar demanda como volume absoluto.

## Backup verificavel

1. Execute um dump PostgreSQL e arquive em storage privado.
2. Exporte lista e checksum dos objetos MinIO usados por videos e capas.
3. Restaure uma amostra em ambiente isolado antes de considerar o backup valido.

## Operacao diaria

1. Abra a Central de Operacoes e resolva alertas criticos.
2. Gere o relatorio em `/api/operations/daily-report`.
3. Verifique publicacoes vencidas, falhas, custo estimado e item mais antigo da fila.
4. Reagende somente itens recuperaveis e confira as credenciais antes de repetir falhas de autenticacao.
