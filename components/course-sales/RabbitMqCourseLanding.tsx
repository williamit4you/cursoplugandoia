import Link from "next/link";
import {
  Activity, ArrowDown, ArrowRight, Check, CheckCircle2, CircleDot, Clock3,
  Eye, GitBranch, Layers3, LockKeyhole, PackageCheck, Play, RefreshCcw,
  RotateCcw, ServerCog, ShieldCheck, TriangleAlert, XCircle, Zap,
} from "lucide-react";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import { MobileStickyCTA, SectionViewTracker, TrackedAccordion, TrackedCheckoutButton } from "@/components/course-completo/interactive";
import { projectLessons, projectTracks, rabbitMqCurriculum } from "./rabbitmq-course-data";

type Props = { checkoutUrl: string; metaPixelId?: string; youtubeVideoId?: string };
const pageKey = "curso-rabbitmq";
const pagePath = "/curso-rabbitmq";
const pageTitle = "Curso de RabbitMQ com .NET | Plugando IA";
const price = 79.9;
const eventData = { content_name: "RabbitMQ com .NET — Do Zero ao Projeto Prático", content_category: "Curso", content_type: "product", value: price, currency: "BRL" };

const masteryAreas = [
  { icon: GitBranch, title: "Fundamentos e roteamento", description: "Producer, Consumer, Exchanges, Queues, Binding, Routing Key, Direct, Fanout e Topic." },
  { icon: PackageCheck, title: "Entrega e consumo", description: "ACK, NACK, Reject, Requeue, Delivery Tag, Prefetch, múltiplos Consumers e Fair Dispatch." },
  { icon: RefreshCcw, title: "Falhas e resiliência", description: "Redelivery, TTL, Retry com Delay, DLX, DLQ e controle do limite de tentativas." },
  { icon: ShieldCheck, title: "Confiabilidade", description: "Publisher Confirms, mandatory, mensagens não roteadas, durabilidade e persistência." },
  { icon: Layers3, title: "Sistemas distribuídos", description: "Duplicidade, idempotência, Connections, Channels e recuperação de conexão." },
  { icon: Activity, title: "Observabilidade", description: "RabbitMQ Prometheus Plugin, métricas, backlog e dashboards no Grafana." },
];

const realScenarios = [
  { icon: ServerCog, title: "Serviço fora do ar", description: "As mensagens permanecem na fila e aguardam o Consumer voltar a processar." },
  { icon: TriangleAlert, title: "Pagamento falhou", description: "A mensagem entra em um fluxo explícito de Retry, sem loop descontrolado." },
  { icon: Clock3, title: "Falhou novamente", description: "Novas tentativas são realizadas com delay e contagem controlada." },
  { icon: XCircle, title: "Limite atingido", description: "A mensagem é isolada na DLQ para análise, sem bloquear o restante do fluxo." },
  { icon: RotateCcw, title: "Pagamento recusado", description: "O pedido é cancelado e uma mensagem libera a reserva de estoque." },
  { icon: Eye, title: "Operação visível", description: "Prometheus coleta métricas e o Grafana mostra filas, consumo e backlog." },
];

function SectionIntro({ eyebrow, title, description, center = false }: { eyebrow: string; title: string; description: string; center?: boolean }) {
  return <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff8a3d]">{eyebrow}</p>
    <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.035em] text-white md:text-5xl">{title}</h2>
    <p className="mt-5 text-base leading-8 text-slate-400 md:text-lg">{description}</p>
  </div>;
}

function CheckoutButton({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return <TrackedCheckoutButton href={href} label={label} pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} value={price} currency="BRL" customEvent="rabbitmq_checkout_click" eventData={eventData} hideGlow className={`!rounded-xl !bg-none !bg-[#f56b1b] !px-6 !py-4 !font-extrabold !text-white shadow-[0_16px_50px_rgba(245,107,27,.22)] hover:!bg-[#ff7d2d] ${className}`} />;
}

function FlowNode({ label, accent = false }: { label: string; accent?: boolean }) {
  return <div className={`relative z-10 flex min-h-20 items-center justify-center rounded-2xl border px-4 text-center text-sm font-bold shadow-xl ${accent ? "border-[#f56b1b]/50 bg-[#f56b1b]/10 text-[#ffb17d]" : "border-white/10 bg-[#111722] text-slate-100"}`}>{label}</div>;
}

export function RabbitMqCourseLanding({ checkoutUrl, metaPixelId, youtubeVideoId }: Props) {
  const offerAvailable = /^https?:\/\//.test(checkoutUrl);
  return <main className="min-h-screen overflow-hidden bg-[#07090d] text-white selection:bg-[#f56b1b]/40">
    <MetaPixelScript pixelId={metaPixelId} />
    <MetaPixelViewContent data={eventData} />
    <SalesPageTracker pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} metadata={{ offerPrice: price, currency: "BRL", offerName: eventData.content_name }} />
    <SalesViewContentTracker pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} currency="BRL" value={price} metadata={{ contentName: eventData.content_name, contentType: "course" }} />
    <SectionViewTracker selectorId="projeto" pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} eventName="project_view" />
    <SectionViewTracker selectorId="conteudo" pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} eventName="curriculum_view" />
    <SectionViewTracker selectorId="oferta" pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} eventName="offer_view" />

    <div className="border-b border-[#f56b1b]/15 bg-[#f56b1b]/10 px-4 py-2.5 text-center text-xs font-semibold text-[#ffc29b] sm:text-sm">Preço de lançamento limitado aos primeiros 30 alunos</div>
    <header className="relative z-30 border-b border-white/[0.07] bg-[#07090d]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/cursos" className="flex items-center gap-2 font-extrabold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f56b1b] text-xs">PI</span>Plugando IA</Link>
        <nav className="flex items-center gap-5 text-sm font-semibold text-slate-400"><a href="#projeto" className="hidden transition hover:text-white sm:block">Projeto final</a><a href="#conteudo" className="transition hover:text-white">Conteúdo</a></nav>
      </div>
    </header>

    <section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#f56b1b]/10 blur-[130px]" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#f56b1b]/30 bg-[#f56b1b]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ffb17d]"><CircleDot className="h-3.5 w-3.5" /> Curso completo • Projeto prático</p>
          <h1 className="mt-7 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.05em] sm:text-5xl md:text-7xl">Domine RabbitMQ com .NET <span className="text-[#f56b1b]">do fundamento a uma aplicação real</span></h1>
          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-300 md:text-xl">Aprenda mensageria construindo, quebrando e recuperando uma aplicação. De Exchanges e ACK/NACK a Retry, DLQ, idempotência e observabilidade — aplicados em um e-commerce completo.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">{offerAvailable && <CheckoutButton href={checkoutUrl} label="Quero aprender RabbitMQ" />}<a href="#projeto" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 text-sm font-bold transition hover:border-white/30 hover:bg-white/[0.08]">Ver o projeto prático <ArrowDown className="ml-2 h-4 w-4" /></a></div>
          <div className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-3 font-mono text-xs uppercase tracking-[0.14em] text-slate-500 sm:text-sm">{[".NET", "RabbitMQ", "Docker", "Prometheus", "Grafana"].map(tech => <span key={tech}>{tech}</span>)}</div>
        </div>

        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1119] shadow-[0_30px_100px_rgba(0,0,0,.45)]">
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3"><span className="h-2.5 w-2.5 rounded-full bg-[#f56b1b]" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/50" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/50" /><span className="ml-3 font-mono text-[11px] text-slate-500">rabbitmq-course / final-project</span></div>
          <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_.7fr] md:p-8">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#080b10]">
              {youtubeVideoId ? <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`} title="RabbitMQ na prática: conheça o projeto final" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,rgba(245,107,27,.14),transparent_55%)] p-8 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#f56b1b]/40 bg-[#f56b1b]/15 text-[#ff9a59]"><Play className="ml-1 h-7 w-7" fill="currentColor" /></span><p className="mt-5 text-lg font-bold">Demonstração em preparação</p><p className="mt-2 text-sm text-slate-400">O vídeo do projeto será publicado aqui em breve.</p></div></div>}
            </div>
            <div className="flex flex-col justify-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a3d]">Veja o que você vai construir</p><h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">RabbitMQ na prática, com contexto de produção.</h2><p className="mt-4 text-sm leading-7 text-slate-400">Pedidos, estoque, pagamentos, compensação, Retry, DLQ e métricas trabalhando no mesmo fluxo.</p><div className="mt-6 flex flex-wrap gap-2">{["4 aplicações .NET", "Docker Compose", "SQLite + EF Core", "Métricas reais"].map(item => <span key={item} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">{item}</span>)}</div></div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-white/[0.07] bg-[#0a0d13]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 md:py-24 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
      <div><p className="font-mono text-sm text-[#ff8a3d]">// o ponto de virada</p><h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.035em] md:text-5xl">Publicar uma mensagem é a parte fácil.</h2><p className="mt-5 text-xl font-semibold text-slate-300">E quando alguma coisa dá errado?</p><p className="mt-5 max-w-xl leading-8 text-slate-400">É aí que mensageria deixa de ser uma demo. Você aprende a decidir o destino de cada mensagem, impedir loops, lidar com duplicidade e enxergar o sistema em operação.</p></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{["ACK", "NACK", "REQUEUE", "RETRY", "DLQ", "IDEMPOTÊNCIA", "CONFIRMS", "MÉTRICAS"].map((item, index) => <div key={item} className={`rounded-2xl border p-4 font-mono text-xs font-bold sm:py-6 sm:text-center ${index === 4 ? "border-[#f56b1b]/40 bg-[#f56b1b]/10 text-[#ff9a59]" : "border-white/10 bg-white/[0.03] text-slate-300"}`}>{item}</div>)}</div>
    </div></section>

    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><SectionIntro eyebrow="O que você vai dominar" title="Mensageria além de Producer e Consumer" description="Os conceitos são organizados por decisões que você precisa tomar em sistemas reais — roteamento, entrega, falha, confiabilidade, arquitetura e operação." center /><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{masteryAreas.map(({ icon: Icon, title, description }, index) => <article key={title} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-[#f56b1b]/30 hover:bg-white/[0.045]"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl border border-[#f56b1b]/25 bg-[#f56b1b]/10 text-[#ff8a3d]"><Icon className="h-5 w-5" /></span><span className="font-mono text-xs text-slate-600">0{index + 1}</span></div><h3 className="mt-6 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{description}</p></article>)}</div></section>

    <section id="projeto" className="relative scroll-mt-8 border-y border-white/[0.07] bg-[#0a0e15]"><div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(245,107,27,.08),transparent_60%)]" /><div className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <SectionIntro eyebrow="Projeto final • E-commerce com mensageria" title="Você não vai terminar o curso apenas sabendo criar uma fila." description="Vamos juntar os conceitos em um e-commerce orientado a mensagens, com serviços independentes, caminhos de sucesso, compensação de estoque e tratamento de falhas." />
      <div className="mt-12 rounded-[28px] border border-white/10 bg-[#080b10] p-5 md:p-8">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center"><FlowNode label="Pedidos.Api" /><ArrowRight className="mx-auto hidden h-5 w-5 text-[#f56b1b] md:block" /><FlowNode label="RabbitMQ" accent /><ArrowRight className="mx-auto hidden h-5 w-5 text-[#f56b1b] md:block" /><FlowNode label="Estoque.Worker" /></div>
        <div className="my-4 flex justify-center"><ArrowDown className="h-5 w-5 text-slate-600" /></div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center"><FlowNode label="Notificacao.Worker" /><ArrowRight className="mx-auto hidden h-5 w-5 rotate-180 text-slate-600 md:block" /><FlowNode label="Finalização ou cancelamento" /><ArrowRight className="mx-auto hidden h-5 w-5 rotate-180 text-slate-600 md:block" /><FlowNode label="Pagamento.Worker" /></div>
        <div className="mt-6 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-3"><div className="rounded-xl bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200"><Check className="mr-2 inline h-4 w-4" />Aprovado → finaliza pedido</div><div className="rounded-xl bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100"><RotateCcw className="mr-2 inline h-4 w-4" />Recusado → libera estoque</div><div className="rounded-xl bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200"><XCircle className="mr-2 inline h-4 w-4" />Sem estoque → cancela pedido</div></div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{realScenarios.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><Icon className="h-5 w-5 text-[#ff8a3d]" /><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></article>)}</div>
      <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl border border-[#f56b1b]/25 bg-[#f56b1b]/[0.07] p-6 text-center sm:flex-row sm:text-left md:p-8"><div><h3 className="text-xl font-bold">Construa o fluxo. Provoque a falha. Recupere a aplicação.</h3><p className="mt-2 text-sm text-slate-400">É assim que os conceitos deixam de ser nomes e passam a fazer sentido.</p></div>{offerAvailable && <CheckoutButton href={checkoutUrl} label="Quero acessar o curso" className="shrink-0" />}</div>
    </div></section>

    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
      <SectionIntro eyebrow="Retry e Dead Letter Queue" title="Falhas não somem. Elas precisam de um caminho." description="No projeto, uma falha no pagamento não vira um retry infinito. Você cria espera, delay, novas tentativas, controla o limite e encaminha a mensagem para a DLQ quando ela exige investigação." />
      <div className="rounded-[28px] border border-white/10 bg-[#0c1119] p-6 md:p-8"><div className="grid gap-3 sm:grid-cols-3">{[{ label: "Pagamento", meta: "processamento", color: "text-slate-200" }, { label: "Retry + Delay", meta: "tentativas controladas", color: "text-amber-200" }, { label: "DLQ", meta: "isolamento da falha", color: "text-rose-200" }].map((step, index) => <div key={step.label} className="relative rounded-2xl border border-white/10 bg-[#080b10] p-5"><span className="font-mono text-[10px] text-slate-600">0{index + 1}</span><strong className={`mt-4 block ${step.color}`}>{step.label}</strong><span className="mt-1 block text-xs text-slate-500">{step.meta}</span>{index < 2 && <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden h-5 w-5 text-[#f56b1b] sm:block" />}</div>)}</div><div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 font-mono text-xs leading-7 text-slate-400"><span className="text-[#ff8a3d]">if</span> (tentativas &lt; limite) publish(fila.retry, delay);<br /><span className="text-[#ff8a3d]">else</span> publish(fila.dlq, contextoDaFalha);</div></div>
    </section>

    <section className="border-y border-white/[0.07] bg-[#0a0d13]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2 lg:items-center">
      <div><SectionIntro eyebrow="Prometheus + Grafana" title="Não basta funcionar. Você precisa enxergar o que está acontecendo." description="Você configura o plugin de métricas do RabbitMQ, conecta o Prometheus e cria visualizações no Grafana para acompanhar filas, mensagens prontas e backlog." /><div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-bold"><span className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">RabbitMQ Plugin</span><ArrowRight className="h-4 w-4 text-[#f56b1b]" /><span className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">Prometheus</span><ArrowRight className="h-4 w-4 text-[#f56b1b]" /><span className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">Grafana</span></div></div>
      <div className="rounded-[28px] border border-white/10 bg-[#080b10] p-5 shadow-2xl"><div className="flex items-center justify-between border-b border-white/[0.07] pb-4"><span className="font-mono text-xs text-slate-500">queue_backlog</span><span className="flex items-center gap-2 text-xs text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> collecting</span></div><div className="mt-8 flex h-48 items-end gap-2" aria-label="Representação visual de métricas das filas">{[28,48,35,72,56,88,65,42,62,32,24,18].map((height,index) => <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-[#f56b1b]/30 to-[#f56b1b]" style={{ height: `${height}%`, opacity: .55 + index * .035 }} />)}</div><div className="mt-4 flex justify-between font-mono text-[10px] text-slate-600"><span>mensagens prontas</span><span>tempo →</span></div></div>
    </div></section>

    <section id="conteudo" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-20 md:px-8 md:py-28"><SectionIntro eyebrow="Conteúdo do curso" title="Do primeiro Producer a fluxos resilientes" description="A formação principal organiza o fundamento e a prática em 9 módulos. Abra cada módulo para consultar as aulas." center /><div className="mt-12 space-y-3">{rabbitMqCurriculum.map((module,index) => <TrackedAccordion key={module.title} title={`${String(index + 1).padStart(2,"0")}. ${module.title} — ${module.lessons.length} aulas`} pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} eventName={`curriculum_${index + 1}_open`} className="!rounded-2xl !border-white/10 !bg-white/[0.025] !p-5 open:!border-[#f56b1b]/25 open:!bg-white/[0.045]" titleClassName="!text-base !font-bold !text-white md:!text-lg" contentClassName="!text-slate-400" iconClassName="!border-white/10 !bg-white/[0.04] !text-[#ff8a3d]"><p className="mb-5 leading-7">{module.summary}</p><ol className="grid gap-2 border-t border-white/[0.07] pt-4 md:grid-cols-2">{module.lessons.map((lesson,lessonIndex) => <li key={lesson} className="flex gap-3 text-sm leading-6"><span className="w-6 shrink-0 font-mono text-xs text-[#ff8a3d]">{String(lessonIndex + 1).padStart(2,"0")}</span><span>{lesson}</span></li>)}</ol></TrackedAccordion>)}</div></section>

    <section className="border-y border-[#f56b1b]/15 bg-[linear-gradient(180deg,rgba(245,107,27,.08),rgba(245,107,27,.025))]"><div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28"><SectionIntro eyebrow="Projeto final • 31 aulas + recado" title="E-commerce com Mensageria" description="Uma trilha própria, separada da grade principal, para você perceber a dimensão do projeto e acompanhar sua construção de ponta a ponta." /><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projectTracks.map((track,index) => <div key={track} className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0b0e14]/70 px-4 py-4"><span className="font-mono text-xs text-[#ff8a3d]">{String(index + 1).padStart(2,"0")}</span><span className="text-sm font-semibold text-slate-200">{track}</span></div>)}</div><div className="mt-6"><TrackedAccordion title="Ver as 31 aulas do projeto + recado" pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} eventName="project_lessons_open" className="!rounded-2xl !border-[#f56b1b]/25 !bg-[#0b0e14] !p-5 md:!p-6" titleClassName="!text-base !font-bold !text-white md:!text-lg" contentClassName="!text-slate-400" iconClassName="!border-[#f56b1b]/25 !bg-[#f56b1b]/10 !text-[#ff8a3d]"><ol className="grid gap-x-8 gap-y-3 border-t border-white/[0.07] pt-5 md:grid-cols-2">{projectLessons.map(lesson => <li key={lesson.number} className="flex gap-3 text-sm leading-6"><span className="w-7 shrink-0 font-mono text-xs text-[#ff8a3d]">{lesson.number}</span><span>{lesson.title}</span></li>)}</ol></TrackedAccordion></div></div></section>

    <section id="oferta" className="relative scroll-mt-8"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,107,27,.13),transparent_42%)]" /><div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff8a3d]">Comece agora</p><h2 className="mt-4 text-balance text-4xl font-bold tracking-[-0.04em] md:text-5xl">RabbitMQ deixa de parecer complicado quando você entende o fluxo.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">Comece pelos fundamentos. Termine construindo uma aplicação completa com mensageria, falhas controladas e observabilidade.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{["51 aulas na formação principal", "Projeto final de e-commerce", "Prática com C# e .NET", "Docker, RabbitMQ e SQLite", "Retry, DLQ e idempotência", "Prometheus e Grafana"].map(item => <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-300"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#ff8a3d]" />{item}</div>)}</div></div><aside className="rounded-[28px] border border-[#f56b1b]/30 bg-[#0c1119] p-7 shadow-[0_30px_100px_rgba(0,0,0,.4)]"><span className="inline-flex items-center gap-2 rounded-full bg-[#f56b1b]/10 px-3 py-1.5 text-xs font-bold text-[#ffb17d]"><Zap className="h-3.5 w-3.5" /> Oferta de lançamento</span><p className="mt-7 text-sm text-slate-500">Investimento atual</p><strong className="mt-1 block text-5xl font-extrabold tracking-tight">R$ 79,90</strong><p className="mt-3 text-sm text-slate-400">pagamento único</p>{offerAvailable && <CheckoutButton href={checkoutUrl} label="Quero aprender RabbitMQ com .NET" className="mt-7 w-full" />}<div className="mt-6 flex items-start gap-3 border-t border-white/[0.07] pt-5"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a3d]" /><p className="text-xs leading-5 text-slate-500">Acesso ao curso completo e ao projeto prático apresentado nesta página.</p></div></aside></div></section>

    <section className="border-t border-white/[0.07] bg-[#0a0d13]"><div className="mx-auto max-w-4xl px-5 py-20 md:px-8 md:py-24"><SectionIntro eyebrow="Perguntas frequentes" title="Respostas diretas antes de entrar" description="Sem promessas vagas. O que você precisa saber sobre a formação." center /><div className="mt-10 space-y-3">{[["Preciso já saber RabbitMQ?", "Não. O curso começa pelo problema que a mensageria resolve e apresenta os componentes antes de avançar para o código."], ["Preciso conhecer C#?", "É recomendado ter noções básicas de C# para acompanhar Producers, Consumers, a API e os Workers com mais facilidade."], ["O curso é apenas teórico?", "Não. Além dos exemplos focados, você constrói um e-commerce com API, Workers, banco de dados, Docker, RabbitMQ, Retry, DLQ e observabilidade."], ["O projeto mostra o que acontece quando há falhas?", "Sim. O fluxo cobre falta de estoque, pagamento recusado, liberação de reserva, retentativas com delay, limite de tentativas e DLQ."], ["RabbitMQ e Kafka são iguais?", "Não. O curso apresenta a diferença conceitual para você entender o papel do RabbitMQ e quando ele é uma escolha adequada."]].map(([question,answer],index) => <TrackedAccordion key={question} title={question} pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} eventName={`faq_${index + 1}_open`} className="!rounded-2xl !border-white/10 !bg-white/[0.025] !p-5" titleClassName="!font-bold !text-white" contentClassName="!text-slate-400" iconClassName="!border-white/10 !bg-white/[0.04] !text-[#ff8a3d]"><p>{answer}</p></TrackedAccordion>)}</div></div></section>

    <footer className="border-t border-white/[0.07] bg-[#07090d]"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-8"><strong className="text-white">Plugando IA</strong><div className="flex flex-wrap gap-5"><Link href="/terms">Termos</Link><Link href="/privacy">Privacidade</Link><Link href="/cursos">Todos os cursos</Link></div></div></footer>
    {offerAvailable && <MobileStickyCTA title="RabbitMQ com .NET" priceLabel="R$ 79,90" href={checkoutUrl} label="Acessar" pageKey={pageKey} pagePath={pagePath} pageTitle={pageTitle} value={price} currency="BRL" className="!border-white/10 !bg-[#080b10]/95" priceClassName="!text-[#ff8a3d]" buttonClassName="!rounded-lg !bg-none !bg-[#f56b1b] !text-white" hideGlow />}
  </main>;
}
