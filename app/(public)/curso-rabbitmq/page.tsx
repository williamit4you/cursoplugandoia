import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Code2, Rabbit } from "lucide-react";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import { MobileStickyCTA, SectionViewTracker, TrackedAccordion, TrackedCheckoutButton } from "@/components/course-completo/interactive";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const course = {
  pageKey: "curso-rabbitmq",
  pagePath: "/curso-rabbitmq",
  pageTitle: "Curso de RabbitMQ com .NET | Plugando IA",
  name: "RabbitMQ com .NET",
  regularPrice: 99.99,
  launchPrice: 29.9,
  checkoutUrl: process.env.NEXT_PUBLIC_RABBITMQ_CHECKOUT_URL ?? "#oferta",
};

export const metadata: Metadata = {
  title: "Curso de RabbitMQ com .NET — do zero a DLQ e Retry | Plugando IA",
  description: "Aprenda RabbitMQ na prática com C# e .NET: exchanges, filas, ACK, concorrência, TTL, Dead Letter e Retry em 51 aulas.",
  alternates: { canonical: "/curso-rabbitmq" },
  openGraph: { title: "RabbitMQ com .NET: mensageria sem mistério", description: "51 aulas para dominar mensageria, processamento resiliente, DLQ e Retry com C# e .NET.", url: "/curso-rabbitmq", siteName: "Plugando IA", type: "website" },
};

const modules = [
  { title: "Fundamentos da mensageria", summary: "Entenda por que mensageria existe e onde RabbitMQ se encaixa.", lessons: ["O problema que a mensageria resolve", "Comunicação síncrona x assíncrona", "O que é um Message Broker", "História e o que é RabbitMQ", "RabbitMQ x Kafka: diferença conceitual"] },
  { title: "Arquitetura e roteamento", summary: "Visualize o fluxo e aprenda a escolher a estratégia de roteamento.", lessons: ["Arquitetura e fluxo básico do RabbitMQ", "Como o RabbitMQ roteia mensagens", "Exchange tipo Fanout", "Exchange tipo Direct", "Exchange tipo Topic"] },
  { title: "Preparando o ambiente", summary: "Suba o RabbitMQ com Docker e explore os principais tipos de Exchange.", lessons: ["Download do Docker", "Instalando o Docker", "Docker Compose e RabbitMQ", "Exchange Fanout no RabbitMQ", "Exchange Direct no RabbitMQ", "Exchange Topic no RabbitMQ"] },
  { title: "Primeira aplicação .NET com RabbitMQ", summary: "Crie Producer e Consumer e acompanhe a mensagem de ponta a ponta.", lessons: ["Criando os projetos Producer e Consumer", "Instalando o RabbitMQ.Client nos projetos", "Criando a publicação da mensagem", "Criando a Exchange, fila e binding", "Criando o Consumer", "Publicando e consumindo a mensagem"] },
  { title: "Fanout na prática", summary: "Distribua o mesmo evento para múltiplas filas e consumidores.", lessons: ["Exchange e Queue Fanout — prática", "Producer Fanout — prática", "Criando o Consumer das três filas — prática", "Publicando e chamando o Consumer para ver a mensagem"] },
  { title: "Topic na prática", summary: "Roteie eventos por padrões e routing keys.", lessons: ["Criando a Exchange tipo Topic — prática", "Criando o Consumer Topic", "Criando o Consumer Topic — prática", "Publicando e consumindo filas com binding Topic"] },
  { title: "Confirmação e rejeição no Consumer", summary: "Tenha controle sobre sucesso, falha e mensagens problemáticas.", lessons: ["O que é ACK (Acknowledgement)", "ACK false: consumindo manualmente as mensagens", "ACK: processamento em lote e multiple: true", "BasicReject e BasicNack — teoria", "BasicReject e BasicNack — prática", "Poison Message — teoria"] },
  { title: "Distribuição e concorrência", summary: "Escale o consumo com múltiplas instâncias e processamento justo.", lessons: ["Múltiplos Consumers, Competing Consumers e Round-robin", "Consumindo a fila com várias instâncias — prática", "Prefetch, QoS e Fair Dispatch", "Prefetch, QoS e Fair Dispatch — prática", "Concorrência no Consumer .NET — teoria e prática"] },
  { title: "Falhas, expiração, Dead Letter e Retry", summary: "Construa fluxos resilientes para quando o processamento não sair como planejado.", lessons: ["Tratamento de exceções no Consumer", "Verificando as possibilidades de Retry", "DeliveryTag", "TTL: mensagens e filas", "Fila cuja mensagem expira", "Criando uma fila com expiração", "Dead Letter, DLX e DLQ", "Criando Exchange, fila e binding com código e simulando DLX e DLQ", "Retry e quantidade de tentativas: fila de espera", "Implementando Retry com Delay usando TTL e Dead Letter — prática"] },
];

const faq = [
  ["Preciso já saber RabbitMQ?", "Não. O curso começa pelo problema que a mensageria resolve e constrói os conceitos antes de avançar para o código."],
  ["Preciso conhecer C# e .NET?", "É recomendado ter noções básicas de C# para aproveitar melhor as aulas práticas de Producer e Consumer."],
  ["Vou aprender só teoria?", "Não. Você prepara o ambiente com Docker, escreve Producers e Consumers e simula os principais fluxos de entrega, falha e retentativa."],
  ["RabbitMQ e Kafka são a mesma coisa?", "Não. Você aprende a diferença conceitual logo no início para entender quando a proposta do RabbitMQ faz sentido."],
  ["A oferta de R$ 29,90 dura até quando?", "É uma condição de lançamento limitada aos primeiros 30 alunos. Depois disso, o curso volta ao preço de R$ 99,99."],
];

const eventData = { content_name: course.name, content_category: "Curso", content_type: "product", value: course.launchPrice, currency: "BRL" };

function Cta({ label = "Quero entrar na primeira turma", tone = "dark", className = "" }: { label?: string; tone?: "dark" | "orange"; className?: string }) {
  const palette = tone === "orange" ? "!bg-[#ff5c20] !text-[#171717] hover:!bg-white" : "!bg-[#171717] !text-white hover:!bg-[#ff5c20] hover:!text-[#171717]";
  return <TrackedCheckoutButton href={course.checkoutUrl} label={label} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} value={course.launchPrice} currency="BRL" customEvent="rabbitmq_checkout_click" eventData={eventData} hideGlow className={`!rounded-none !bg-none !px-6 !py-4 !font-black ${palette} ${className}`} />;
}

function FlowDiagram() {
  return (
    <div className="border-2 border-[#171717] bg-[#fffaf0]">
      <div className="flex items-center justify-between border-b-2 border-[#171717] px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[.16em]"><span>Diagrama 01 / Fluxo básico</span><span>RabbitMQ</span></div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-5 md:p-7">
        <div className="border-2 border-[#171717] bg-[#c7e9ff] p-4 text-center"><Code2 className="mx-auto h-5 w-5" /><strong className="mt-2 block font-mono text-xs">PRODUCER</strong></div>
        <ArrowRight className="h-5 w-5" />
        <div className="border-2 border-[#171717] bg-[#ff5c20] p-4 text-center"><strong className="font-mono text-xs">EXCHANGE</strong><div className="mt-1 font-mono text-[9px]">topic</div></div>
      </div>
      <div className="mx-auto h-10 w-px bg-[#171717]" />
      <div className="grid grid-cols-3 gap-2 px-5 pb-5 md:px-7 md:pb-7">{["pedidos", "emails", "retry"].map((item) => <div key={item} className="border-2 border-[#171717] bg-[#f7dd4c] p-3 text-center font-mono text-[9px] font-black uppercase">{item}<br />queue</div>)}</div>
      <div className="border-t-2 border-[#171717] bg-[#171717] px-4 py-3 font-mono text-[10px] text-white">STATUS: MESSAGE ACKNOWLEDGED ✓</div>
    </div>
  );
}

export default async function CursoRabbitmqPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(course.pageKey, { preferEnvFallback: true });
  return (
    <main className="min-h-screen bg-[#f2efe5] text-[#171717] selection:bg-[#f7dd4c]">
      <MetaPixelScript pixelId={metaPixelId || undefined} />
      <MetaPixelViewContent data={eventData} />
      <SalesPageTracker pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} metadata={{ offerPrice: course.launchPrice, currency: "BRL", offerName: course.name }} />
      <SalesViewContentTracker pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} currency="BRL" value={course.launchPrice} metadata={{ contentName: course.name, contentType: "course" }} />
      <SectionViewTracker selectorId="conteudo" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName="curriculum_view" />
      <SectionViewTracker selectorId="oferta" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName="offer_view" />

      <header className="border-b-2 border-[#171717]"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10"><Link href="/cursos" className="flex items-center gap-3 font-black tracking-[-.03em]"><span className="grid h-9 w-9 place-items-center bg-[#ff5c20]"><Code2 className="h-5 w-5" /></span>PLUGANDO IA</Link><Link href="/cursos" className="font-mono text-[10px] font-black uppercase tracking-[.16em] underline decoration-2 underline-offset-4">Todos os cursos</Link></div></header>

      <section className="border-b-2 border-[#171717]"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.15fr_.85fr]"><div className="px-5 py-14 md:px-10 md:py-20 lg:border-r-2 lg:border-[#171717] lg:py-24"><div className="flex flex-wrap items-center gap-3 font-mono text-[10px] font-black uppercase tracking-[.16em]"><span className="bg-[#ff5c20] px-3 py-2">Curso 01 / Nova turma</span><span>Primeiros 30 alunos</span></div><h1 className="mt-8 max-w-4xl font-serif text-[3.7rem] font-bold leading-[.9] tracking-[-.06em] sm:text-7xl xl:text-[6.4rem]">Mensageria que você entende. E sabe colocar em produção.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#55534d]">RabbitMQ do fundamento ao código com <strong className="text-[#171717]">C#, .NET e Docker</strong>. Aprenda o fluxo completo — inclusive o que fazer quando a mensagem falha.</p><div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"><Cta /><a href="#conteudo" className="flex items-center justify-center gap-2 border-2 border-[#171717] px-6 py-3.5 text-sm font-black">CONHECER O PROGRAMA <ArrowDown className="h-4 w-4" /></a></div></div>
        <aside className="grid border-t-2 border-[#171717] lg:border-t-0"><div className="bg-[#ff5c20] p-6 md:p-9"><div className="flex items-start justify-between"><span className="font-mono text-[10px] font-black uppercase tracking-[.18em]">RabbitMQ<br />com .NET</span><Rabbit className="h-12 w-12" /></div><div className="mt-20 font-serif text-5xl font-bold leading-[.92] tracking-[-.05em] md:text-6xl">Do primeiro publish ao Retry.</div><div className="mt-12 flex justify-between border-t-2 border-[#171717] pt-4 font-mono text-[10px] font-black uppercase"><span>9 módulos</span><span>51 aulas</span><span>Online</span></div></div><div className="grid grid-cols-2 border-t-2 border-[#171717]"><div className="border-r-2 border-[#171717] bg-[#f7dd4c] p-6"><span className="font-mono text-[9px] font-black uppercase">De</span><strong className="mt-6 block text-2xl line-through">R$ 99,99</strong></div><div className="bg-[#fffaf0] p-6"><span className="font-mono text-[9px] font-black uppercase">Lançamento</span><strong className="mt-3 block text-4xl font-black tracking-[-.06em]">R$ 29,90</strong></div></div></aside></div></section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-start"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#d43d08]">01 / Por que este curso existe</span><h2 className="mt-5 font-serif text-4xl font-bold leading-tight tracking-[-.045em] md:text-5xl">Enviar a mensagem é fácil. Projetar o que acontece depois é engenharia.</h2></div><div className="grid gap-8 md:grid-cols-2"><p className="text-xl leading-8 text-[#3f3d38]">Quando um serviço fica lento, uma mensagem falha ou o volume cresce, copiar uma configuração não basta. Você precisa entender o fluxo.</p><p className="leading-7 text-[#69655d]">Este curso foi organizado para ligar conceito e implementação. Você aprende por que cada componente existe, vê o comportamento no RabbitMQ e escreve o fluxo em .NET.</p><div className="md:col-span-2"><FlowDiagram /></div></div></div></section>

      <section className="border-y-2 border-[#171717] bg-[#171717] text-white"><div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-10 md:grid-cols-2"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#ff7544]">02 / O que muda</span><h2 className="mt-5 max-w-2xl font-serif text-4xl font-bold tracking-[-.045em] md:text-5xl">Você deixa de decorar termos e começa a tomar decisões.</h2></div><p className="max-w-xl self-end text-lg leading-8 text-white/65">Fanout, Direct, Topic, ACK, QoS e DLQ passam a fazer parte de um modelo mental claro — não de uma lista de configurações soltas.</p></div><div className="mt-14 grid border-l border-t border-white/30 sm:grid-cols-2 lg:grid-cols-4">{[["01", "Rotear", "Escolha a Exchange e o binding de acordo com o fluxo."], ["02", "Confirmar", "Controle ACK, Nack, Reject e mensagens problemáticas."], ["03", "Distribuir", "Use concorrência, prefetch e múltiplos Consumers."], ["04", "Recuperar", "Projete TTL, Dead Letter e Retry com delay."]].map(([number, title, text]) => <article key={number} className="min-h-60 border-b border-r border-white/30 p-6"><span className="font-mono text-xs text-[#ff7544]">{number}</span><h3 className="mt-16 font-serif text-3xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{text}</p></article>)}</div></div></section>

      <section id="conteudo" className="mx-auto max-w-[1200px] scroll-mt-4 px-5 py-16 md:px-10 md:py-24"><div className="grid gap-8 border-b-2 border-[#171717] pb-8 md:grid-cols-2 md:items-end"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#d43d08]">03 / Programa do curso</span><h2 className="mt-5 font-serif text-5xl font-bold tracking-[-.05em]">51 aulas.<br />Sem buracos no caminho.</h2></div><p className="max-w-lg justify-self-end leading-7 text-[#69655d]">Do problema que a mensageria resolve até uma estratégia completa de Retry usando TTL e Dead Letter.</p></div><div className="mt-8 border-x-2 border-t-2 border-[#171717]">{modules.map((module, moduleIndex) => <TrackedAccordion key={module.title} title={`${String(moduleIndex + 1).padStart(2, "0")} / ${module.title}`} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName={`module_${moduleIndex + 1}_open`} variant="light" className="!rounded-none !border-x-0 !border-t-0 !border-b-2 !border-[#171717] !bg-[#fffaf0] !p-5 md:!p-7" titleClassName="!font-serif !text-xl !font-bold md:!text-2xl" contentClassName="!text-[#5d5a52]" iconClassName="!rounded-none !border-2 !border-[#171717] !bg-transparent"><p className="mb-5 max-w-2xl text-base">{module.summary}</p><ol className="border-t border-[#b8b2a4]">{module.lessons.map((lesson, lessonIndex) => { const previous = modules.slice(0, moduleIndex).reduce((sum, item) => sum + item.lessons.length, 0); return <li key={lesson} className="grid grid-cols-[42px_1fr] border-b border-[#d5d0c4] py-3"><span className="font-mono text-[10px] font-black text-[#d43d08]">{String(previous + lessonIndex + 1).padStart(2, "0")}</span><span>{lesson}</span></li>; })}</ol></TrackedAccordion>)}</div></section>

      <section id="oferta" className="scroll-mt-4 border-y-2 border-[#171717] bg-[#ff5c20]"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.2fr_.8fr]"><div className="border-[#171717] px-5 py-16 md:px-10 md:py-24 lg:border-r-2"><span className="font-mono text-[10px] font-black uppercase tracking-[.2em]">04 / Convite para a primeira turma</span><h2 className="mt-6 max-w-4xl font-serif text-5xl font-bold leading-[.94] tracking-[-.055em] md:text-7xl">Aprenda agora. Use no próximo sistema.</h2><p className="mt-7 max-w-2xl text-lg leading-8">O preço de lançamento está limitado aos <strong>primeiros 30 alunos</strong>. Depois, o curso retorna ao valor normal de R$ 99,99.</p><div className="mt-10 grid gap-3 sm:grid-cols-2">{["51 aulas em sequência", "Prática com C# e .NET", "Ambiente com Docker", "Fanout, Direct e Topic", "ACK, QoS e concorrência", "TTL, DLQ e Retry"].map((item) => <div key={item} className="flex items-center gap-3 border-t border-[#171717]/40 pt-3 text-sm font-bold"><Check className="h-4 w-4" />{item}</div>)}</div></div><aside className="flex flex-col justify-between bg-[#f7dd4c] p-6 md:p-10"><div><div className="flex justify-between font-mono text-[10px] font-black uppercase tracking-[.16em]"><span>Inscrição individual</span><span>BRL</span></div><div className="mt-16 text-sm">Preço normal</div><div className="text-2xl line-through">R$ 99,99</div><div className="mt-7 text-sm font-bold">Preço de lançamento</div><div className="mt-1 text-7xl font-black tracking-[-.075em]">29<span className="text-3xl">,90</span></div><p className="mt-2 font-mono text-[10px] font-bold uppercase">Pagamento único</p></div><div className="mt-16"><Cta label="Garantir minha vaga" className="w-full" /><p className="mt-4 text-center font-mono text-[9px] font-bold uppercase tracking-wider">Condição válida para os primeiros 30 alunos</p></div></aside></div></section>

      <section className="mx-auto max-w-[1000px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-8 md:grid-cols-[.6fr_1.4fr]"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#d43d08]">05 / Dúvidas</span><h2 className="mt-4 font-serif text-4xl font-bold tracking-[-.04em]">Antes de começar.</h2></div><div className="border-x-2 border-t-2 border-[#171717]">{faq.map(([question, answer], index) => <TrackedAccordion key={question} title={question} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName={`faq_${index + 1}_open`} variant="light" className="!rounded-none !border-x-0 !border-t-0 !border-b-2 !border-[#171717] !bg-[#fffaf0] !p-5" titleClassName="!font-serif !text-lg !font-bold" contentClassName="!text-[#5d5a52]" iconClassName="!rounded-none !border-2 !border-[#171717] !bg-transparent"><p>{answer}</p></TrackedAccordion>)}</div></div></section>

      <section className="border-t-2 border-[#171717] bg-[#171717] text-white"><div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-10"><div><Rabbit className="h-8 w-8 text-[#ff5c20]" /><h2 className="mt-4 font-serif text-3xl font-bold">Entenda cada mensagem. Inclusive a que falha.</h2></div><Cta label="Começar por R$ 29,90" tone="orange" /></div></section>
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-8 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#666258] md:flex-row md:justify-between md:px-10"><span>© {new Date().getFullYear()} Plugando IA</span><Link href="/cursos" className="underline underline-offset-4">Voltar ao catálogo</Link></footer>
      <MobileStickyCTA title={course.name} priceLabel="Lançamento: R$ 29,90" href={course.checkoutUrl} label="Garantir vaga" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} value={course.launchPrice} currency="BRL" className="!border-[#171717] !bg-[#f7dd4c]" titleClassName="!text-[#171717]" priceClassName="!text-[#171717]" buttonClassName="!rounded-none !bg-none !bg-[#171717] !text-white" hideGlow />
    </main>
  );
}
