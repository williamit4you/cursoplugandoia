# Spec-Driven Development - CRM, WhatsApp e Teste Manual de Scraping (2026-05-01)

## 1. Problema
- O scraping depende do ciclo automatico diario, o que atrasa validacao operacional.
- A pagina publica `/solucoes-ia` ainda nao leva o visitante para um canal comercial configuravel.
- Nao existe uma area separada de CRM em `/crm` para atendimento, pipeline, historico e configuracoes de WhatsApp.
- As credenciais do canal WhatsApp/Evolution nao devem ficar hardcoded no codigo.
- O atendimento assistido por IA precisa ficar restrito ao escopo comercial da empresa: automacao, n8n, agentes de IA, RAG, WhatsApp, integracoes e implantacao.

## 2. Objetivos
- Criar um botao de teste manual de scraping para disparo imediato do worker.
- Criar um CTA publico de WhatsApp em `/solucoes-ia`, abastecido por configuracao persistida no banco.
- Criar a nova area `/crm` com as mesmas credenciais do `/admin`, mas com layout e fluxo proprios.
- Criar uma base de CRM com funil de vendas, contatos, historico, tarefas e indicadores.
- Criar a fundacao do atendimento por WhatsApp com configuracao Evolution + assistente OpenAI com guardrails.

## 3. Fora de Escopo desta entrega
- Integracao completa de webhook inbound/outbound com a Evolution API em producao.
- Disparos reais de e-mail marketing e round-robin automatico entre vendedores.
- BI avancado com filtros historicos complexos ou exportacoes.
- Omnichannel completo alem da estrutura inicial de WhatsApp, e-mail e site.

## 4. Personas
- Administrador comercial: configura canal, acompanha metricas e pipeline.
- Atendente/vendedor: registra contato, muda etapa, cria follow-up e usa respostas assistidas.
- Lead/cliente: entra via site ou WhatsApp para tirar duvidas sobre automacao e agentes de IA.

## 5. Requisitos Funcionais

### RF-01. Teste manual de scraping
- O usuario deve conseguir disparar o scraping imediatamente sem aguardar o scheduler.
- O disparo deve continuar usando o worker atual para manter o mesmo pipeline de logs e rastreio.
- A UI deve comunicar claramente que se trata de um teste/disparo manual.

### RF-02. CTA publico de WhatsApp
- A pagina `/solucoes-ia` deve exibir um botao de WhatsApp.
- O numero e a mensagem padrao devem sair de configuracao salva no banco.
- Deve haver fallback seguro quando a configuracao ainda nao existir.

### RF-03. Nova area protegida `/crm`
- A rota `/crm` deve reutilizar as mesmas credenciais do NextAuth atual.
- O `/crm` deve ter login proprio (`/crm/login`) e layout proprio, sem misturar navegacao com `/admin`.

### RF-04. Configuracoes comerciais e de canal
- Deve existir uma configuracao singleton para:
- dados publicos do WhatsApp comercial
- dados da Evolution API
- politica do atendente IA
- modelo OpenAI usado para resposta
- ligas de automacao futura

### RF-05. Estrutura de CRM
- Contatos precisam suportar no minimo: celular, email, nome e interesse.
- O funil precisa suportar:
- `LEAD`
- `CONTACTED`
- `PROPOSAL_SENT`
- `NEGOTIATION`
- `WON`
- `LOST`
- O historico precisa registrar:
- ligacoes
- mensagens
- reunioes
- tarefas
- notas internas

### RF-06. Dashboard comercial
- Exibir quantidade de leads por etapa.
- Exibir taxa de conversao basica.
- Exibir vendas ganhas e perdidas.
- Exibir volume de atividades recentes.

### RF-07. Assistente IA com guardrails
- O assistente deve responder apenas sobre:
- automacao
- n8n
- agentes de IA
- RAG
- Evolution API
- WhatsApp comercial
- integracoes
- implantacao / consultoria da Plugando IA
- Quando a pergunta sair do escopo, a resposta deve recusar com educacao e redirecionar para os temas atendidos.
- O modelo inicial sera `gpt-4o-mini`, assumido como o "ChatGPT mini" da stack atual.

## 6. Requisitos Nao Funcionais
- Nenhuma credencial da Evolution deve ser hardcoded em componentes.
- O CRM deve usar o banco atual via Prisma.
- A area `/crm` deve ficar protegida via middleware e sessao.
- O botao publico de WhatsApp nao deve expor segredo algum.
- As respostas do assistente devem ser auditaveis no banco.

## 7. Modelo de Dados Proposto

### `CrmSettings`
- configuracao singleton do CRM/WhatsApp/IA
- inclui numero publico, mensagem padrao, base URL da Evolution, instance name, API key, prompt do assistente e flags de ativacao

### `CrmContact`
- nome, celular, email, empresa, interesse, origem, etapa, notas e dono

### `CrmActivity`
- historico cronologico de interacoes
- tipos: `CALL`, `WHATSAPP`, `EMAIL`, `MEETING`, `TASK`, `NOTE`, `SYSTEM`

### `CrmTask`
- tarefas comerciais com status, vencimento e responsavel

### `CrmConversation`
- conversa por canal, inicialmente `WHATSAPP`

### `CrmMessage`
- mensagens do contato, da IA ou do agente
- guarda `role`, `direction`, `content`, `model` e flag de guardrail

## 8. Endpoints Planejados
- `GET /api/crm/public-channel`
- `GET /api/crm/settings`
- `POST /api/crm/settings`
- `GET /api/crm/dashboard`
- `GET /api/crm/contacts`
- `POST /api/crm/contacts`
- `PATCH /api/crm/contacts/[id]`
- `POST /api/crm/activities`
- `POST /api/crm/tasks`
- `GET /api/crm/conversations/[contactId]`
- `POST /api/crm/assistant/reply`

## 9. UX Planejada para `/crm`
- Dashboard
- Contatos
- Pipeline
- Atividades
- Tarefas
- Atendimento IA
- Configuracoes

## 10. Critérios de Aceite
- O usuario consegue entrar em `/crm/login` com a mesma credencial do admin atual.
- O usuario consegue cadastrar contato com celular, email, nome e interesse.
- O usuario consegue mover contato entre etapas do funil.
- O dashboard mostra metricas consolidadas da base.
- O CTA da pagina `/solucoes-ia` abre o WhatsApp configurado no banco.
- O botao de scraping comunica disparo manual/teste imediato.
- O assistente IA responde sobre automacao/agentes e recusa assuntos fora do escopo.

## 11. Plano de Entrega

### Fase 1. Fundacao
- [ ] Criar schema Prisma do CRM
- [ ] Criar migracao
- [ ] Criar singleton de configuracoes
- [ ] Proteger `/crm` no middleware

### Fase 2. Aplicacao CRM
- [ ] Criar login e layout `/crm`
- [ ] Criar dashboard com KPIs
- [ ] Criar CRUD inicial de contatos
- [ ] Criar tabela/kanban simples de pipeline
- [ ] Criar historico e tarefas

### Fase 3. Canal comercial
- [ ] Expor configuracao publica do WhatsApp
- [ ] Atualizar `/solucoes-ia` com CTA dinamico
- [ ] Cadastrar dados da Evolution em configuracoes

### Fase 4. Atendimento IA
- [ ] Criar endpoint de resposta com OpenAI
- [ ] Persistir mensagens e conversas
- [ ] Aplicar guardrails server-side
- [ ] Exibir area de teste do atendente no `/crm`

### Fase 5. Operacao e melhoria
- [ ] Refinar relatorios
- [ ] Preparar webhook Evolution
- [ ] Automatizar follow-ups e distribuicao

## 12. Riscos
- O worker manual depende do daemon estar ativo para consumir a flag de trigger.
- A integracao real com Evolution exigira validar payloads da instancia usada em producao.
- O modelo OpenAI pode exigir ajuste fino de prompt conforme o tom comercial desejado.

## 13. Decisoes desta iteracao
- O CRM nascera em `/crm`, separado do `/admin`.
- O login sera espelhado com a mesma base de usuarios.
- A configuracao do WhatsApp comercial saira de um singleton de CRM, nao de constantes no frontend.
- O primeiro passo de atendimento IA sera assistido e auditavel, pronto para evoluir para webhook real.
