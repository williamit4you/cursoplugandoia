export type RabbitMqCurriculumModule = {
  title: string;
  summary: string;
  lessons: string[];
};

export const rabbitMqCurriculum: RabbitMqCurriculumModule[] = [
  { title: "Fundamentos da mensageria", summary: "Entenda o problema que a mensageria resolve e quando RabbitMQ faz sentido.", lessons: ["O problema que a mensageria resolve", "Comunicação síncrona x assíncrona", "O que é um Message Broker", "História e o que é RabbitMQ", "RabbitMQ x Kafka: diferença conceitual"] },
  { title: "Arquitetura e roteamento", summary: "Conheça o fluxo interno e as estratégias de entrega de mensagens.", lessons: ["Arquitetura e fluxo básico do RabbitMQ", "Como o RabbitMQ roteia mensagens", "Exchange tipo Fanout", "Exchange tipo Direct", "Exchange tipo Topic"] },
  { title: "Preparando o ambiente", summary: "Configure Docker e explore Fanout, Direct e Topic no RabbitMQ.", lessons: ["Download do Docker", "Instalando o Docker", "Docker Compose e RabbitMQ", "Exchange Fanout no RabbitMQ", "Exchange Direct no RabbitMQ", "Exchange Topic no RabbitMQ"] },
  { title: "Primeira aplicação .NET com RabbitMQ", summary: "Construa Producer e Consumer e acompanhe a mensagem de ponta a ponta.", lessons: ["Criando os projetos Producer e Consumer", "Instalando RabbitMQ.Client", "Criando a publicação da mensagem", "Criando Exchange, fila e binding", "Criando o Consumer", "Publicando e consumindo a mensagem"] },
  { title: "Fanout na prática", summary: "Distribua o mesmo evento para múltiplas filas e consumidores.", lessons: ["Exchange e Queue Fanout", "Producer Fanout", "Consumer das três filas", "Publicando e consumindo a mensagem"] },
  { title: "Topic na prática", summary: "Roteie eventos por padrões e routing keys.", lessons: ["Criando Exchange Topic", "Criando o Consumer Topic", "Consumer Topic na prática", "Filas e bindings Topic"] },
  { title: "Confirmação e rejeição", summary: "Controle sucesso, falha e mensagens que não podem ser processadas.", lessons: ["ACK (Acknowledgement)", "Consumo manual com ACK false", "Processamento em lote e multiple: true", "BasicReject e BasicNack — teoria", "BasicReject e BasicNack — prática", "Poison Message"] },
  { title: "Distribuição e concorrência", summary: "Escale o consumo com múltiplas instâncias e processamento justo.", lessons: ["Competing Consumers e Round-robin", "Consumindo com várias instâncias", "Prefetch, QoS e Fair Dispatch", "Fair Dispatch na prática", "Concorrência no Consumer .NET"] },
  { title: "Falhas, Dead Letter e Retry", summary: "Implemente estratégias para exceções, expiração e retentativas.", lessons: ["Tratamento de exceções no Consumer", "Possibilidades de Retry", "DeliveryTag", "TTL em mensagens e filas", "Mensagem expirada", "Fila com expiração", "Dead Letter, DLX e DLQ", "Simulando DLX e DLQ com código", "Fila de espera e quantidade de tentativas", "Retry com Delay usando TTL e Dead Letter"] },
];

export const projectTracks = [
  "Estrutura e ambiente", "Pedidos e contratos", "Reserva de estoque",
  "Processamento de pagamento", "Finalização e compensação", "Notificações",
  "Frontend do e-commerce", "Retry e DLQ", "Prometheus e Grafana",
];

export const projectLessons = [
  { number: "01", title: "Construindo o projeto e-commerce mensageria" },
  { number: "02", title: "Criando a solução, API e Workers e referenciando" },
  { number: "03", title: "Criando o Docker Compose e subindo o RabbitMQ" },
  { number: "04", title: "Criando os contratos" },
  { number: "05", title: "Instalando pacotes EF Core, conexão com SQLite, DbContext e entidade de pedidos" },
  { number: "06", title: "Criando Exchange, Queues, Binding e EstoquePublisher" },
  { number: "07", title: "Configurando Controller, Program e publicando a mensagem" },
  { number: "08", title: "Configurando a Reserva de Estoque" },
  { number: "09", title: "Criando a classe Worker para consumir a fila" },
  { number: "10", title: "Extensão SQLite no VS Code" },
  { number: "11", title: "Consumindo da fila de estoque concluído e publicando no pagamento" },
  { number: "12", title: "Validando pagamento aprovado e recusado e publicando nas filas" },
  { number: "13", title: "Criando o finalizador de pedido" },
  { number: "14", title: "Configurando liberação de reserva" },
  { number: "15", title: "Liberando o item com compra recusada pelo financeiro para o estoque" },
  { number: "16", title: "Subindo o ambiente novamente" },
  { number: "17", title: "Fluxo de geração de notificação por e-mail aprovado e reprovado" },
  { number: "18", title: "Criando a migration do produto e executando" },
  { number: "19", title: "Criando método e cadastrando produtos" },
  { number: "20", title: "Ajustando CORS" },
  { number: "21", title: "Criando o frontend e demonstrando a aplicação" },
  { number: "21A", title: "Recado" },
  { number: "22", title: "Explicando Retry e fila morta" },
  { number: "23", title: "Explicando o Worker de pagamento para criar as filas" },
  { number: "24", title: "Simulando retentativa e encaminhando para fila morta" },
  { number: "25", title: "Prometheus x Grafana — teoria" },
  { number: "26", title: "Configurando Prometheus como plugin do RabbitMQ e no Docker Compose" },
  { number: "27", title: "Configurando Grafana no Docker Compose e subindo" },
  { number: "28", title: "Conectando Prometheus no Grafana" },
  { number: "29", title: "Gráfico de mensagens prontas" },
  { number: "30", title: "Configurando Prometheus para exibir as filas" },
  { number: "31", title: "Criando gráficos no Grafana" },
];
