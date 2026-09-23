import type { Metadata } from "next";
import { CleanCourseLanding, type CleanCurriculumGroup } from "@/components/course-sales/CleanCourseLanding";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const pageKey = "curso-rabbitmq";
const pagePath = "/curso-rabbitmq";
const pageTitle = "Curso de RabbitMQ com .NET | Plugando IA";
const checkoutUrl = process.env.NEXT_PUBLIC_RABBITMQ_CHECKOUT_URL ?? "https://pay.hotmart.com/V107737859J?bid=1790201856849";
const price = 29.9;

export const metadata: Metadata = {
  title: "Curso de RabbitMQ com .NET — ACK, DLQ e Retry | Plugando IA",
  description: "Aprenda RabbitMQ na prática com C# e .NET: exchanges, filas, ACK, concorrência, TTL, Dead Letter e Retry em 51 aulas.",
  alternates: { canonical: pagePath },
};

const curriculum: CleanCurriculumGroup[] = [
  { title: "Fundamentos da mensageria", meta: "5 aulas", summary: "Entenda o problema que a mensageria resolve e quando RabbitMQ faz sentido.", lessons: ["O problema que a mensageria resolve", "Comunicação síncrona x assíncrona", "O que é um Message Broker", "História e o que é RabbitMQ", "RabbitMQ x Kafka: diferença conceitual"] },
  { title: "Arquitetura e roteamento", meta: "5 aulas", summary: "Conheça o fluxo interno e as estratégias de entrega de mensagens.", lessons: ["Arquitetura e fluxo básico do RabbitMQ", "Como o RabbitMQ roteia mensagens", "Exchange tipo Fanout", "Exchange tipo Direct", "Exchange tipo Topic"] },
  { title: "Preparando o ambiente", meta: "6 aulas", summary: "Configure Docker e explore Fanout, Direct e Topic no RabbitMQ.", lessons: ["Download do Docker", "Instalando o Docker", "Docker Compose e RabbitMQ", "Exchange Fanout no RabbitMQ", "Exchange Direct no RabbitMQ", "Exchange Topic no RabbitMQ"] },
  { title: "Primeira aplicação .NET com RabbitMQ", meta: "6 aulas", summary: "Construa Producer e Consumer e acompanhe a mensagem de ponta a ponta.", lessons: ["Criando os projetos Producer e Consumer", "Instalando RabbitMQ.Client", "Criando a publicação da mensagem", "Criando Exchange, fila e binding", "Criando o Consumer", "Publicando e consumindo a mensagem"] },
  { title: "Fanout na prática", meta: "4 aulas", summary: "Distribua o mesmo evento para múltiplas filas e consumidores.", lessons: ["Exchange e Queue Fanout", "Producer Fanout", "Consumer das três filas", "Publicando e consumindo a mensagem"] },
  { title: "Topic na prática", meta: "4 aulas", summary: "Roteie eventos por padrões e routing keys.", lessons: ["Criando Exchange Topic", "Criando o Consumer Topic", "Consumer Topic na prática", "Filas e bindings Topic"] },
  { title: "Confirmação e rejeição", meta: "6 aulas", summary: "Controle sucesso, falha e mensagens que não podem ser processadas.", lessons: ["ACK (Acknowledgement)", "Consumo manual com ACK false", "Processamento em lote e multiple: true", "BasicReject e BasicNack — teoria", "BasicReject e BasicNack — prática", "Poison Message"] },
  { title: "Distribuição e concorrência", meta: "5 aulas", summary: "Escale o consumo com múltiplas instâncias e processamento justo.", lessons: ["Competing Consumers e Round-robin", "Consumindo com várias instâncias", "Prefetch, QoS e Fair Dispatch", "Fair Dispatch na prática", "Concorrência no Consumer .NET"] },
  { title: "Falhas, Dead Letter e Retry", meta: "10 aulas", summary: "Implemente estratégias para exceções, expiração e retentativas.", lessons: ["Tratamento de exceções no Consumer", "Possibilidades de Retry", "DeliveryTag", "TTL em mensagens e filas", "Mensagem expirada", "Fila com expiração", "Dead Letter, DLX e DLQ", "Simulando DLX e DLQ com código", "Fila de espera e quantidade de tentativas", "Retry com Delay usando TTL e Dead Letter"] },
];

export default async function CursoRabbitmqPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(pageKey, { preferEnvFallback: true });
  return <CleanCourseLanding
    pageKey={pageKey}
    pagePath={pagePath}
    pageTitle={pageTitle}
    name="RabbitMQ com .NET"
    metaPixelId={metaPixelId || undefined}
    eyebrow="Mensageria para aplicações .NET"
    headline="Aprenda a processar mensagens com segurança, escala e controle."
    description="Um curso direto ao ponto para entender RabbitMQ e construir Producers e Consumers em .NET, incluindo os cenários que realmente importam em produção: falhas, concorrência, Dead Letter e Retry."
    notice="Preço de lançamento limitado aos primeiros 30 alunos"
    ctaLabel="Garantir por R$ 29,90"
    checkoutUrl={checkoutUrl}
    price={price}
    offerAvailable={/^https?:\/\//.test(checkoutUrl)}
    stats={[{ value: "51", label: "aulas" }, { value: "9", label: "módulos" }, { value: "9x R$ 3,93", label: "parcelamento disponível" }, { value: "R$ 29,90", label: "à vista" }]}
    heroPoints={["Do fundamento à prática", "Ambiente com Docker", "Projeto em C# e .NET"]}
    problemTitle="Enviar uma mensagem é simples. Garantir que ela seja processada é o desafio."
    problemDescription="Sistemas reais enfrentam indisponibilidade, picos de volume, mensagens inválidas e Consumers lentos. O curso ensina como projetar o fluxo para esses cenários."
    problems={[
      { title: "Acoplamento entre serviços", description: "Uma chamada síncrona lenta pode interromper todo o fluxo da aplicação." },
      { title: "Falhas sem estratégia", description: "Retry sem controle cria loops, sobrecarga e mensagens processadas incorretamente." },
      { title: "Escala mal configurada", description: "Adicionar Consumers não resolve tudo sem prefetch, concorrência e distribuição correta." },
    ]}
    outcomeTitle="Saia sabendo projetar o fluxo completo da mensagem"
    outcomeDescription="Você aprende o papel de cada componente e consegue justificar suas decisões técnicas."
    outcomes={[
      { title: "Escolher o roteamento", description: "Decida entre Fanout, Direct e Topic conforme o comportamento necessário." },
      { title: "Controlar confirmações", description: "Use ACK, Nack e Reject para definir o destino de cada mensagem." },
      { title: "Distribuir processamento", description: "Trabalhe com múltiplos Consumers, QoS, prefetch e concorrência." },
      { title: "Recuperar falhas", description: "Implemente TTL, Dead Letter e Retry com atraso e limite de tentativas." },
    ]}
    curriculumTitle="Tudo o que você precisa para dominar RabbitMQ"
    curriculumDescription="Uma sequência de 51 aulas, começando no problema de negócio e terminando em fluxos resilientes."
    curriculum={curriculum}
    fitTitle="Para quem quer usar mensageria com entendimento, não por tentativa e erro"
    fitItems={["Desenvolvedores C# que nunca trabalharam com filas", "Devs que já publicam mensagens, mas não dominam falhas", "Profissionais estudando arquitetura distribuída", "Quem precisa implementar ACK, DLQ e Retry em projetos reais"]}
    offerTitle="Entre na primeira turma com o preço de lançamento"
    offerDescription="Tenha acesso ao programa completo e desenvolva uma competência que diferencia aplicações demonstrativas de sistemas preparados para produção."
    offerItems={["51 aulas", "9 módulos", "Prática com .NET", "Docker e RabbitMQ", "ACK, QoS e concorrência", "DLQ, TTL e Retry"]}
    offerNote="O valor de R$ 29,90 é exclusivo para os primeiros 30 alunos. Depois, o preço previsto é R$ 99,99."
    faq={[
      ["Preciso já saber RabbitMQ?", "Não. O curso começa pelo problema que a mensageria resolve e apresenta cada componente antes do código."],
      ["Preciso conhecer C#?", "É recomendado ter noções básicas de C# para acompanhar Producers e Consumers com mais facilidade."],
      ["O curso é apenas teórico?", "Não. Você configura o ambiente, escreve código e simula entrega, concorrência, falha e retentativa."],
      ["RabbitMQ e Kafka são iguais?", "Não. O curso apresenta a diferença conceitual para você entender quando RabbitMQ é a escolha adequada."],
      ["A oferta dura até quando?", "A condição de R$ 29,90 é limitada aos primeiros 30 alunos."],
    ]}
  />;
}
