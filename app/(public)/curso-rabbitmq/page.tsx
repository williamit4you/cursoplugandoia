import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Box,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Container,
  GitBranch,
  Layers3,
  MessageSquareMore,
  Rabbit,
  RefreshCcw,
  Route,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
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
  openGraph: {
    title: "RabbitMQ com .NET: mensageria sem mistério",
    description: "51 aulas para dominar mensageria, processamento resiliente, DLQ e Retry com C# e .NET.",
    url: "/curso-rabbitmq",
    siteName: "Plugando IA",
    type: "website",
  },
};

const modules = [
  {
    title: "Fundamentos da mensageria",
    summary: "Entenda por que mensageria existe e onde RabbitMQ se encaixa.",
    lessons: ["O problema que a mensageria resolve", "Comunicação síncrona x assíncrona", "O que é um Message Broker", "História e o que é RabbitMQ", "RabbitMQ x Kafka: diferença conceitual"],
  },
  {
    title: "Arquitetura e roteamento",
    summary: "Visualize o fluxo e aprenda a escolher a estratégia de roteamento.",
    lessons: ["Arquitetura e fluxo básico do RabbitMQ", "Como o RabbitMQ roteia mensagens", "Exchange tipo Fanout", "Exchange tipo Direct", "Exchange tipo Topic"],
  },
  {
    title: "Preparando o ambiente",
    summary: "Suba o RabbitMQ com Docker e explore os principais tipos de Exchange.",
    lessons: ["Download do Docker", "Instalando o Docker", "Docker Compose e RabbitMQ", "Exchange Fanout no RabbitMQ", "Exchange Direct no RabbitMQ", "Exchange Topic no RabbitMQ"],
  },
  {
    title: "Primeira aplicação .NET com RabbitMQ",
    summary: "Crie Producer e Consumer e acompanhe a mensagem de ponta a ponta.",
    lessons: ["Criando os projetos Producer e Consumer", "Instalando o RabbitMQ.Client nos projetos", "Criando a publicação da mensagem", "Criando a Exchange, fila e binding", "Criando o Consumer", "Publicando e consumindo a mensagem"],
  },
  {
    title: "Fanout na prática",
    summary: "Distribua o mesmo evento para múltiplas filas e consumidores.",
    lessons: ["Exchange e Queue Fanout — prática", "Producer Fanout — prática", "Criando o Consumer das três filas — prática", "Publicando e chamando o Consumer para ver a mensagem"],
  },
  {
    title: "Topic na prática",
    summary: "Roteie eventos por padrões e routing keys.",
    lessons: ["Criando a Exchange tipo Topic — prática", "Criando o Consumer Topic", "Criando o Consumer Topic — prática", "Publicando e consumindo filas com binding Topic"],
  },
  {
    title: "Confirmação e rejeição no Consumer",
    summary: "Tenha controle sobre sucesso, falha e mensagens problemáticas.",
    lessons: ["O que é ACK (Acknowledgement)", "ACK false: consumindo manualmente as mensagens", "ACK: processamento em lote e multiple: true", "BasicReject e BasicNack — teoria", "BasicReject e BasicNack — prática", "Poison Message — teoria"],
  },
  {
    title: "Distribuição e concorrência",
    summary: "Escale o consumo com múltiplas instâncias e processamento justo.",
    lessons: ["Múltiplos Consumers, Competing Consumers e Round-robin", "Consumindo a fila com várias instâncias — prática", "Prefetch, QoS e Fair Dispatch", "Prefetch, QoS e Fair Dispatch — prática", "Concorrência no Consumer .NET — teoria e prática"],
  },
  {
    title: "Falhas, expiração, Dead Letter e Retry",
    summary: "Construa fluxos resilientes para quando o processamento não sair como planejado.",
    lessons: ["Tratamento de exceções no Consumer", "Verificando as possibilidades de Retry", "DeliveryTag", "TTL: mensagens e filas", "Fila cuja mensagem expira", "Criando uma fila com expiração", "Dead Letter, DLX e DLQ", "Criando Exchange, fila e binding com código e simulando DLX e DLQ", "Retry e quantidade de tentativas: fila de espera", "Implementando Retry com Delay usando TTL e Dead Letter — prática"],
  },
];

const faq = [
  ["Preciso já saber RabbitMQ?", "Não. O curso começa pelo problema que a mensageria resolve e constrói os conceitos antes de avançar para o código."],
  ["Preciso conhecer C# e .NET?", "É recomendado ter noções básicas de C# para aproveitar melhor as aulas práticas de Producer e Consumer."],
  ["Vou aprender só teoria?", "Não. Você prepara o ambiente com Docker, escreve Producers e Consumers e simula os principais fluxos de entrega, falha e retentativa."],
  ["RabbitMQ e Kafka são a mesma coisa?", "Não. Você aprende a diferença conceitual logo no início para entender quando a proposta do RabbitMQ faz sentido."],
  ["A oferta de R$ 29,90 dura até quando?", "É uma condição de lançamento limitada aos primeiros 30 alunos. Depois disso, o curso volta ao preço de R$ 99,99."],
];

const eventData = { content_name: course.name, content_category: "Curso", content_type: "product", value: course.launchPrice, currency: "BRL" };

function Cta({ label = "Quero dominar RabbitMQ por R$ 29,90", className = "" }: { label?: string; className?: string }) {
  return <TrackedCheckoutButton href={course.checkoutUrl} label={label} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} value={course.launchPrice} currency="BRL" customEvent="rabbitmq_checkout_click" eventData={eventData} hideGlow className={`!rounded-xl !bg-[#ff7a1a] !text-[#160b03] hover:!bg-[#ff984f] ${className}`} />;
}

export default async function CursoRabbitmqPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(course.pageKey, { preferEnvFallback: true });

  return (
    <main className="min-h-screen overflow-hidden bg-[#080b0f] text-white selection:bg-orange-400 selection:text-black">
      <MetaPixelScript pixelId={metaPixelId || undefined} />
      <MetaPixelViewContent data={eventData} />
      <SalesPageTracker pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} metadata={{ offerPrice: course.launchPrice, currency: "BRL", offerName: course.name }} />
      <SalesViewContentTracker pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} currency="BRL" value={course.launchPrice} metadata={{ contentName: course.name, contentType: "course" }} />
      <SectionViewTracker selectorId="conteudo" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName="curriculum_view" />
      <SectionViewTracker selectorId="oferta" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName="offer_view" />

      <header className="relative z-20 border-b border-white/10 bg-[#080b0f]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/cursos" className="flex items-center gap-3 text-sm font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-black"><Code2 className="h-5 w-5" /></span>Plugando IA</Link>
          <Link href="/cursos" className="flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">Ver todos os cursos <ChevronRight className="h-4 w-4" /></Link>
        </div>
      </header>

      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute right-[-150px] top-[-120px] h-[520px] w-[520px] rounded-full bg-orange-500/15 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-16 md:py-24 lg:grid-cols-[1.08fr,.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-200"><CircleDot className="h-3.5 w-3.5 fill-orange-400 text-orange-400" /> Nova turma • primeiros 30 alunos</div>
            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-black leading-[0.94] tracking-[-0.055em] md:text-7xl">Pare de perder mensagens. <span className="text-orange-400">Construa sistemas resilientes.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Aprenda RabbitMQ do fundamento ao código e domine o fluxo completo de uma mensagem com <strong className="text-white">C#, .NET e Docker</strong> — incluindo ACK, concorrência, Dead Letter e Retry.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><Cta /><a href="#conteudo" className="rounded-xl border border-white/15 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-white/5">Ver as 51 aulas</a></div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />Do zero ao avançado</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />Exemplos em .NET</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />Acesso online</span></div>
          </div>

          <div className="relative">
            <div className="absolute inset-8 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#10151b] p-5 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div><span className="font-mono text-[10px] uppercase tracking-[.2em] text-slate-500">message-flow.dev</span></div>
              <div className="mt-8 grid grid-cols-[1fr,auto,1fr] items-center gap-3 text-center">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4"><Code2 className="mx-auto h-6 w-6 text-cyan-300" /><div className="mt-2 text-sm font-bold">Producer</div><div className="text-[10px] text-slate-500">.NET</div></div>
                <ArrowRight className="h-5 w-5 text-orange-400" />
                <div className="rounded-2xl border border-orange-400/25 bg-orange-400/10 p-4"><Route className="mx-auto h-6 w-6 text-orange-300" /><div className="mt-2 text-sm font-bold">Exchange</div><div className="text-[10px] text-slate-500">routing</div></div>
              </div>
              <div className="mx-auto my-3 h-8 w-px bg-gradient-to-b from-orange-400 to-violet-400" />
              <div className="grid grid-cols-3 gap-2">{["pedidos", "emails", "retry"].map((queue) => <div key={queue} className="rounded-xl border border-violet-400/20 bg-violet-400/10 p-3 text-center"><Layers3 className="mx-auto h-5 w-5 text-violet-300" /><div className="mt-2 font-mono text-[10px] text-violet-100">{queue}.queue</div></div>)}</div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3"><div className="flex items-center gap-2 text-sm font-bold text-emerald-200"><ShieldCheck className="h-5 w-5" />Consumer processou</div><span className="rounded-md bg-emerald-400/20 px-2 py-1 font-mono text-[10px] text-emerald-200">ACK ✓</span></div>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5"><div><div className="text-xs text-slate-500 line-through">De R$ 99,99</div><div className="text-3xl font-black text-white">R$ 29,90</div></div><Rabbit className="h-14 w-14 text-orange-400" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">O problema não é publicar</p><h2 className="mt-4 text-balance text-4xl font-black tracking-[-.04em] md:text-5xl">O desafio começa quando algo dá errado.</h2><p className="mt-5 text-lg leading-8 text-slate-400">Uma demo envia mensagens em minutos. Um sistema real precisa saber o que fazer com falhas, picos de demanda e mensagens que não podem ser processadas.</p></div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[[X, "Acoplamento que trava", "Uma chamada lenta ou indisponível paralisa o restante do fluxo."], [RefreshCcw, "Retry sem controle", "Tentar de novo sem estratégia cria loops, sobrecarga e mensagens duplicadas."], [Users, "Escala desigual", "Mais Consumers não resolvem tudo sem prefetch, concorrência e distribuição correta."]].map(([Icon, title, desc]) => { const ItemIcon = Icon as typeof X; return <article key={String(title)} className="rounded-3xl border border-white/10 bg-white/[.035] p-7"><ItemIcon className="h-7 w-7 text-orange-400" /><h3 className="mt-8 text-xl font-black">{String(title)}</h3><p className="mt-3 leading-7 text-slate-400">{String(desc)}</p></article>; })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d1117]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[.8fr,1.2fr] lg:items-start"><div className="lg:sticky lg:top-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">Ao final do curso</p><h2 className="mt-4 text-4xl font-black tracking-[-.04em]">Você vai enxergar a mensagem de ponta a ponta.</h2><p className="mt-5 leading-7 text-slate-400">Não apenas copiar configurações. Você vai entender o papel de cada componente e tomar decisões mais seguras.</p></div><div className="grid gap-4 sm:grid-cols-2">{[[GitBranch, "Escolher o roteamento", "Use Fanout, Direct ou Topic de acordo com o fluxo."], [BadgeCheck, "Controlar a entrega", "Trabalhe com ACK, Nack, Reject e Poison Messages."], [Zap, "Escalar Consumers", "Aplique round-robin, QoS, prefetch e concorrência."], [ShieldCheck, "Tratar falhas", "Implemente TTL, DLQ e Retry com delay de forma consciente."], [Container, "Subir o ambiente", "Execute RabbitMQ com Docker Compose."], [Code2, "Integrar com .NET", "Crie Producers e Consumers com RabbitMQ.Client."]].map(([Icon, title, desc]) => { const ItemIcon = Icon as typeof Box; return <article key={String(title)} className="rounded-2xl border border-white/10 bg-[#080b0f] p-6"><ItemIcon className="h-6 w-6 text-orange-400" /><h3 className="mt-5 font-black">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{String(desc)}</p></article>; })}</div></div>
        </div>
      </section>

      <section id="conteudo" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-20 md:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">Conteúdo completo</p><h2 className="mt-4 text-4xl font-black tracking-[-.04em] md:text-5xl">9 módulos. 51 aulas.<br />Uma evolução clara.</h2></div><div className="flex gap-6 text-sm"><div><strong className="block text-2xl text-white">51</strong><span className="text-slate-500">aulas</span></div><div><strong className="block text-2xl text-white">9</strong><span className="text-slate-500">módulos</span></div><div><strong className="block text-2xl text-white">100%</strong><span className="text-slate-500">online</span></div></div></div>
        <div className="mt-12 space-y-3">{modules.map((module, moduleIndex) => <TrackedAccordion key={module.title} title={`${String(moduleIndex + 1).padStart(2, "0")} — ${module.title}`} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName={`module_${moduleIndex + 1}_open`} className="!rounded-2xl !border-white/10 !bg-[#10141a]" titleClassName="!text-lg" contentClassName="!text-slate-400"><p className="mb-5 text-slate-300">{module.summary}</p><ol className="space-y-3">{module.lessons.map((lesson, lessonIndex) => { const previousLessons = modules.slice(0, moduleIndex).reduce((sum, item) => sum + item.lessons.length, 0); return <li key={lesson} className="flex gap-3 border-t border-white/[.06] pt-3"><span className="w-7 shrink-0 font-mono text-xs text-orange-400">{String(previousLessons + lessonIndex + 1).padStart(2, "0")}</span><span>{lesson}</span></li>; })}</ol></TrackedAccordion>)}</div>
      </section>

      <section id="oferta" className="relative scroll-mt-8 border-y border-orange-400/20 bg-[#100c08]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,.2),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1fr,.8fr] lg:items-center">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-orange-200"><Clock3 className="h-4 w-4" /> Oferta de lançamento</div><h2 className="mt-6 text-balance text-4xl font-black leading-tight tracking-[-.045em] md:text-6xl">Entre agora e transforme mensageria em uma habilidade real.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">A condição especial vale somente para os <strong className="text-white">primeiros 30 alunos</strong>. Ao atingir esse limite, o curso retorna ao preço normal.</p><ul className="mt-8 grid gap-3 sm:grid-cols-2">{["51 aulas organizadas", "Do fundamento à resiliência", "Prática com .NET", "Ambiente com Docker", "Fanout, Direct e Topic", "ACK, DLQ, TTL e Retry"].map((item) => <li key={item} className="flex items-center gap-3 text-sm text-slate-300"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/10"><Check className="h-3.5 w-3.5 text-emerald-400" /></span>{item}</li>)}</ul></div>
          <div className="rounded-[30px] border border-orange-400/25 bg-[#15110d] p-7 shadow-2xl shadow-orange-950/40 md:p-9"><p className="text-sm font-bold uppercase tracking-[.18em] text-orange-300">Acesso ao curso completo</p><div className="mt-8 border-b border-white/10 pb-7"><div className="text-sm text-slate-500">Preço normal</div><div className="text-xl text-slate-400 line-through">R$ 99,99</div><div className="mt-4 text-sm text-slate-400">Hoje, no lançamento:</div><div className="mt-1 text-6xl font-black tracking-[-.06em] text-white">R$ 29<span className="text-3xl">,90</span></div><div className="mt-2 text-sm text-slate-500">pagamento único</div></div><Cta label="Garantir minha vaga" className="mt-7 w-full !py-4 !text-base" /><p className="mt-4 text-center text-xs leading-5 text-slate-500">Preço exclusivo para os primeiros 30 alunos.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">Perguntas frequentes</p><h2 className="mt-4 text-4xl font-black tracking-[-.04em]">Antes de entrar, tire suas dúvidas.</h2></div><div className="mt-10 space-y-3">{faq.map(([question, answer], index) => <TrackedAccordion key={question} title={question} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName={`faq_${index + 1}_open`} className="!rounded-2xl !bg-white/[.035]"><p>{answer}</p></TrackedAccordion>)}</div></section>

      <section className="border-t border-white/10 bg-[#0d1117]"><div className="mx-auto max-w-5xl px-6 py-16 text-center"><Rabbit className="mx-auto h-10 w-10 text-orange-400" /><h2 className="mt-5 text-3xl font-black tracking-tight">Sua próxima mensagem pode ser processada do jeito certo.</h2><p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-400">Aprenda o que acontece entre o Producer e o Consumer — inclusive quando o caminho não sai como esperado.</p><Cta label="Começar agora por R$ 29,90" className="mt-7" /></div></section>
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-600">© {new Date().getFullYear()} Plugando IA • <Link href="/cursos" className="hover:text-slate-300">Ver todos os cursos</Link></footer>

      <MobileStickyCTA title={course.name} priceLabel="Lançamento: R$ 29,90" href={course.checkoutUrl} label="Garantir vaga" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} value={course.launchPrice} currency="BRL" className="!bg-[#0b0d10]/95" buttonClassName="!bg-[#ff7a1a] !text-black" hideGlow />
    </main>
  );
}
