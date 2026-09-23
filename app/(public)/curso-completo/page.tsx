import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, Code2, Rabbit } from "lucide-react";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import { MobileStickyCTA, SectionViewTracker, TrackedAccordion, TrackedCheckoutButton } from "@/components/course-completo/interactive";
import { courseConfig, getCourseRuntimeConfig } from "@/lib/courseCompletoConfig";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

export const metadata: Metadata = {
  title: "Combo Plugando IA — 12 cursos de programação, arquitetura e IA",
  description: "Uma formação com 12 cursos e mais de 250 aulas: C#, .NET, APIs, arquitetura, AWS, RabbitMQ, Next.js, n8n, SaaS e Inteligência Artificial.",
  alternates: { canonical: "/curso-completo" },
  openGraph: {
    title: "12 cursos. Uma única formação. | Plugando IA",
    description: "Do primeiro código a sistemas distribuídos, cloud, SaaS e IA em uma jornada com mais de 250 aulas.",
    url: "/curso-completo",
    siteName: "Plugando IA",
    type: "website",
  },
};

const includedCourses = [
  { number: "01", title: "Fundamentos de C#", area: "Programação", description: "Lógica, orientação a objetos, coleções, arquivos, LINQ e a base para escrever código com segurança.", meta: "75 aulas", color: "#f7dd4c", mark: "C#" },
  { number: "02", title: "API RESTful com .NET", area: "Backend", description: "Uma API completa para barbearia com banco de dados, CRUD, Entity Framework, autenticação e autorização.", meta: "Projeto real", color: "#bde7ce", mark: "API" },
  { number: "03", title: "Arquitetura de Software", area: "Engenharia", description: "Requisitos, atributos de qualidade, coesão, acoplamento, SOLID, camadas e integração entre sistemas.", meta: "Formação central", color: "#d8ceff", mark: "ARQ" },
  { number: "04", title: "Fundamentos de AWS", area: "Cloud", description: "EC2, redes, VPC, RDS, S3, IAM, Auto Scaling, Lambda e publicação de aplicações.", meta: "Infraestrutura", color: "#c6e8ff", mark: "AWS" },
  { number: "05", title: "RabbitMQ com .NET", area: "Mensageria", description: "Exchanges, filas, ACK, concorrência, TTL, Dead Letter e Retry construindo Producers e Consumers.", meta: "51 aulas • novo", color: "#ff6933", mark: "MQ" },
  { number: "06", title: "n8n Básico", area: "Automação", description: "Workflows, credenciais, triggers, condições, Code Node e requisições HTTP para automatizar processos.", meta: "Curso incluído", color: "#bde7ce", mark: "n8n" },
  { number: "07", title: "Agentes de IA", area: "Inteligência Artificial", description: "Fundamentos de agentes, memória, ferramentas e construção prática de um agente inteligente.", meta: "Curso incluído", color: "#f7dd4c", mark: "AGT" },
  { number: "08", title: "Site com IA e RAG", area: "Projeto aplicado", description: "Site, chatbot, e-mails, PostgreSQL, banco vetorial, metadados e agente com RAG.", meta: "Projeto completo", color: "#c6e8ff", mark: "RAG" },
  { number: "09", title: "Next.js", area: "Full Stack", description: "Rotas, layouts, Server e Client Components, cache, middleware, formulários e APIs.", meta: "Curso incluído", color: "#d8ceff", mark: "NEXT" },
  { number: "10", title: "Agentes de IA com Next.js", area: "IA com código", description: "Interface, integração com OpenAI e um ChatClient com contexto e memória construído em código.", meta: "Curso incluído", color: "#bde7ce", mark: "AI" },
  { number: "11", title: "Criando SaaS com IA", area: "Produto", description: "Banco, trial, assinaturas, pagamentos, Docker, GitHub e publicação de um produto digital.", meta: "Do zero ao deploy", color: "#f7dd4c", mark: "SaaS" },
  { number: "12", title: "Arquitetando com LLMs e RAG", area: "IA avançada", description: "Retrieval, transformers, LLMs, embeddings, bancos vetoriais, FastAPI, avaliação e guardrails.", meta: "Curso premium", color: "#ff6933", mark: "LLM" },
];

const journey = [
  ["01", "Aprenda a programar", "Construa sua base com lógica, C# e orientação a objetos."],
  ["02", "Crie aplicações", "Modele dados e desenvolva APIs completas com .NET."],
  ["03", "Organize sistemas", "Entenda arquitetura, qualidade e decisões técnicas."],
  ["04", "Distribua e publique", "Trabalhe com RabbitMQ e infraestrutura AWS."],
  ["05", "Transforme em produto", "Conecte frontend, automação, SaaS e Inteligência Artificial."],
];

const faqBase = [
  ["Os 12 cursos estão realmente incluídos?", "Sim. A proposta desta página é o combo completo: as formações principais e os cursos complementares ficam reunidos em uma única matrícula."],
  ["Preciso saber programar para começar?", "Não. A jornada começa com lógica e fundamentos de C#. Quem já programa pode avançar diretamente para as trilhas mais adequadas ao seu nível."],
  ["Preciso assistir na ordem?", "Não é obrigatório, mas existe uma sequência recomendada. Ela começa nos fundamentos e avança para backend, arquitetura, cloud, mensageria, produto e IA."],
  ["O curso de RabbitMQ está incluído?", "Sim. O curso de RabbitMQ com .NET agora faz parte do combo, com 51 aulas sobre exchanges, filas, ACK, concorrência, Dead Letter e Retry."],
  ["É apenas conteúdo teórico?", "Não. A teoria é conectada a APIs, Producers e Consumers, aplicações Full Stack, automações e projetos com IA."],
  ["Como funciona o acesso?", "O acesso é online para você estudar no seu ritmo. As condições comerciais definitivas são apresentadas no checkout."],
];

function money(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function Cta({ config, label, tone = "blue", className = "" }: { config: ReturnType<typeof getCourseRuntimeConfig>; label: string; tone?: "blue" | "yellow" | "dark"; className?: string }) {
  const palette = tone === "yellow" ? "!bg-[#f7dd4c] !text-[#171717] hover:!bg-white" : tone === "dark" ? "!bg-[#171717] !text-white hover:!bg-[#2349d8]" : "!bg-[#2349d8] !text-white hover:!bg-[#1736a7]";
  return <TrackedCheckoutButton href={config.checkoutUrl} label={label} pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} value={config.activePrice} currency="BRL" customEvent="combo_checkout_click" eventData={{ content_name: config.name, content_category: "Combo de cursos", content_type: "product", value: config.activePrice, currency: "BRL" }} hideGlow className={`!rounded-none !bg-none !px-6 !py-4 !font-black ${palette} ${className}`} />;
}

function CourseCover({ course }: { course: (typeof includedCourses)[number] }) {
  return (
    <div className="relative aspect-[5/3] overflow-hidden border-b-2 border-[#171717]" style={{ backgroundColor: course.color }}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-[#171717]/35 px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[.16em]"><span>Curso {course.number}</span><span>{course.area}</span></div>
      <div className="absolute inset-x-5 bottom-5 top-14 flex items-end justify-between"><span className="font-mono text-xs font-black">PLUGANDO<br />IA</span><strong className="text-5xl font-black tracking-[-.09em] opacity-80">{course.mark}</strong></div>
      <div className="absolute left-1/2 top-[56%] h-px w-28 -translate-x-1/2 rotate-[-28deg] bg-[#171717]/45" />
    </div>
  );
}

export default async function CursoCompletoPage() {
  const config = getCourseRuntimeConfig();
  const metaPixelId = await resolveSalesPageMetaPixelId(courseConfig.pageKey, { preferEnvFallback: true });
  const priceLabel = money(config.activePrice);
  const pricePerCourse = money(config.activePrice / config.courseCount);
  const eventData = { content_name: config.name, content_category: "Combo de cursos", content_type: "product", value: config.activePrice, currency: "BRL" };

  return (
    <main className="min-h-screen bg-[#f2efe5] text-[#171717] selection:bg-[#f7dd4c]">
      <MetaPixelScript pixelId={metaPixelId || undefined} />
      <MetaPixelViewContent data={eventData} />
      <SalesPageTracker pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} metadata={{ offerPrice: config.activePrice, currency: "BRL", offerName: config.name, courseCount: config.courseCount }} />
      <SalesViewContentTracker pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} currency="BRL" value={config.activePrice} metadata={{ contentName: config.name, contentType: "course_bundle", courseCount: config.courseCount }} />
      <SectionViewTracker selectorId="cursos" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="courses_view" />
      <SectionViewTracker selectorId="oferta" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="offer_view" />
      <SectionViewTracker selectorId="faq" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="faq_view" />

      <div className="border-b-2 border-[#171717] bg-[#f7dd4c] px-4 py-2.5 text-center font-mono text-[10px] font-black uppercase tracking-[.16em]">Combo completo • {config.courseCount} cursos • {config.lessonCount}+ aulas • uma única matrícula</div>
      <header className="border-b-2 border-[#171717]"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10"><Link href="/cursos" className="flex items-center gap-3 font-black tracking-[-.03em]"><span className="grid h-9 w-9 place-items-center bg-[#2349d8] text-white"><Code2 className="h-5 w-5" /></span>PLUGANDO IA</Link><a href="#cursos" className="font-mono text-[10px] font-black uppercase tracking-[.16em] underline decoration-2 underline-offset-4">Ver os 12 cursos</a></div></header>

      <section className="border-b-2 border-[#171717]"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.2fr_.8fr]"><div className="px-5 py-14 md:px-10 md:py-20 lg:border-r-2 lg:border-[#171717] lg:py-24"><p className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2349d8]">Formação completa / Edição 2026</p><h1 className="mt-7 max-w-5xl font-serif text-[3.7rem] font-bold leading-[.9] tracking-[-.06em] sm:text-7xl xl:text-[6.4rem]">12 cursos. Uma formação para a sua carreira inteira.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#55534d]">Do primeiro código a APIs, arquitetura, cloud, mensageria, SaaS e Inteligência Artificial. Um caminho completo para aprender a construir — e entender — software de verdade.</p><div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"><Cta config={config} label={`Quero os 12 cursos por ${priceLabel}`} /><a href="#cursos" className="flex items-center justify-center gap-2 border-2 border-[#171717] px-6 py-3.5 text-sm font-black">EXPLORAR O COMBO <ArrowDown className="h-4 w-4" /></a></div></div>
        <aside className="grid border-t-2 border-[#171717] lg:border-t-0"><div className="grid grid-cols-2"><div className="flex min-h-56 flex-col justify-between border-b-2 border-r-2 border-[#171717] bg-[#f7dd4c] p-6"><span className="font-mono text-[9px] font-black uppercase tracking-[.16em]">Cursos completos</span><strong className="text-8xl font-black tracking-[-.1em]">12</strong></div><div className="flex min-h-56 flex-col justify-between border-b-2 border-[#171717] bg-[#2349d8] p-6 text-white"><span className="font-mono text-[9px] font-black uppercase tracking-[.16em]">Aulas disponíveis</span><strong className="text-6xl font-black tracking-[-.08em]">250<span className="text-3xl">+</span></strong></div></div><div className="bg-[#fffaf0] p-6 md:p-8"><p className="font-mono text-[9px] font-black uppercase tracking-[.16em]">Investimento atual</p><div className="mt-5 text-5xl font-black tracking-[-.07em]">{priceLabel}</div><div className="mt-3 flex items-center justify-between border-t border-[#171717]/30 pt-3 text-sm"><span>Equivale a</span><strong>{pricePerCourse} por curso</strong></div><p className="mt-8 font-serif text-2xl font-bold leading-tight">Uma matrícula. Doze possibilidades de evolução.</p></div></aside></div></section>

      <section className="border-b-2 border-[#171717] bg-[#171717] text-white"><div className="mx-auto grid max-w-[1440px] grid-cols-2 md:grid-cols-4">{[["12", "cursos completos"], ["250+", "aulas no combo"], ["01", "única matrícula"], [pricePerCourse, "valor médio por curso"]].map(([value, label], index) => <div key={String(label)} className={`p-6 md:p-8 ${index < 3 ? "border-r border-white/25" : ""}`}><strong className="block text-3xl font-black tracking-[-.05em] md:text-4xl">{value}</strong><span className="mt-2 block font-mono text-[9px] font-bold uppercase tracking-[.14em] text-white/55">{label}</span></div>)}</div></section>

      <section id="cursos" className="mx-auto max-w-[1440px] scroll-mt-4 px-5 py-16 md:px-10 md:py-24"><div className="grid gap-8 border-b-2 border-[#171717] pb-8 md:grid-cols-2 md:items-end"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2349d8]">01 / Tudo o que está incluído</span><h2 className="mt-5 font-serif text-5xl font-bold leading-[.95] tracking-[-.05em] md:text-6xl">Não são módulos soltos.<br />São 12 cursos.</h2></div><p className="max-w-xl justify-self-end text-lg leading-8 text-[#5d5a52]">Cada curso aprofunda uma competência. Juntos, eles formam uma biblioteca para acompanhar diferentes fases da sua carreira.</p></div><div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{includedCourses.map((item) => <article key={item.number} className="group flex h-full flex-col border-2 border-[#171717] bg-[#fffaf0] transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#171717]"><CourseCover course={item} /><div className="flex flex-1 flex-col p-6"><div className="flex items-center justify-between gap-3 font-mono text-[9px] font-black uppercase tracking-[.14em] text-[#656158]"><span>{item.area}</span><span>{item.meta}</span></div><h3 className="mt-5 font-serif text-3xl font-bold leading-[1.02] tracking-[-.035em]">{item.title}</h3><p className="mt-4 leading-7 text-[#5d5a52]">{item.description}</p>{item.number === "05" ? <Link href="/curso-rabbitmq" className="mt-6 inline-flex items-center gap-2 border-t border-[#bdb7a9] pt-4 text-sm font-black text-[#c83c09]">Conhecer o curso individual <ArrowUpRight className="h-4 w-4" /></Link> : null}</div></article>)}</div></section>

      <section className="border-y-2 border-[#171717] bg-[#fffaf0]"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[.7fr_1.3fr]"><div className="border-[#171717] px-5 py-14 md:px-10 lg:border-r-2 lg:py-20"><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2349d8]">02 / Sequência recomendada</span><h2 className="mt-5 font-serif text-4xl font-bold tracking-[-.045em] md:text-5xl">Você não compra um monte de cursos. Compra um caminho.</h2><p className="mt-5 leading-7 text-[#68645b]">Comece pelo seu nível atual e avance conforme seus objetivos. A formação foi desenhada para as peças se conectarem.</p></div><div>{journey.map(([number, title, description]) => <article key={number} className="grid gap-4 border-t-2 border-[#171717] px-5 py-6 first:border-t-0 md:grid-cols-[70px_220px_1fr] md:items-center md:px-8"><span className="font-mono text-xs font-black text-[#2349d8]">{number}</span><h3 className="font-serif text-2xl font-bold">{title}</h3><p className="leading-7 text-[#68645b]">{description}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-12 lg:grid-cols-2"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2349d8]">03 / Por que o combo faz sentido</span><h2 className="mt-5 max-w-2xl font-serif text-5xl font-bold leading-[.98] tracking-[-.05em]">Sua carreira não cabe em uma única tecnologia.</h2></div><div className="grid grid-cols-2 border-l-2 border-t-2 border-[#171717]">{[["CÓDIGO", "Construa uma base que não depende de copiar respostas."], ["SISTEMA", "Entenda como API, dados, mensageria e cloud se conectam."], ["PRODUTO", "Transforme tecnologia em aplicações que resolvem problemas."], ["EVOLUÇÃO", "Volte ao combo sempre que chegar a uma nova etapa profissional."]].map(([title, description]) => <article key={title} className="min-h-52 border-b-2 border-r-2 border-[#171717] p-5 md:p-6"><span className="font-mono text-[10px] font-black text-[#2349d8]">{title}</span><p className="mt-16 font-serif text-lg font-bold leading-snug md:text-xl">{description}</p></article>)}</div></div></section>

      <section id="oferta" className="scroll-mt-4 border-y-2 border-[#171717] bg-[#2349d8] text-white"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.2fr_.8fr]"><div className="border-white px-5 py-16 md:px-10 md:py-24 lg:border-r-2"><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#f7dd4c]">04 / O combo completo</span><h2 className="mt-6 max-w-4xl font-serif text-5xl font-bold leading-[.94] tracking-[-.055em] md:text-7xl">12 cursos pelo valor de uma formação.</h2><p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">Programação, backend, arquitetura, cloud, RabbitMQ, automação, SaaS e IA reunidos em uma única matrícula.</p><div className="mt-10 grid gap-3 sm:grid-cols-2">{["12 cursos completos", `${config.lessonCount}+ aulas`, "C# e .NET", "AWS e RabbitMQ", "Next.js e SaaS", "Agentes, LLMs e RAG"].map((item) => <div key={item} className="flex items-center gap-3 border-t border-white/30 pt-3 text-sm font-bold"><Check className="h-4 w-4 text-[#f7dd4c]" />{item}</div>)}</div></div><aside className="flex flex-col justify-between bg-[#f7dd4c] p-6 text-[#171717] md:p-10"><div><div className="flex justify-between font-mono text-[10px] font-black uppercase tracking-[.16em]"><span>Combo Plugando IA</span><span>12 cursos</span></div><div className="mt-16 text-sm font-bold">Investimento atual</div><div className="mt-1 text-7xl font-black tracking-[-.075em]">{priceLabel.replace("R$ ", "").replace("R$ ", "")}</div><div className="mt-3 border-t border-[#171717]/35 pt-3 text-sm"><span>Em média </span><strong>{pricePerCourse} por curso</strong></div></div><div className="mt-16"><Cta config={config} label="Quero garantir os 12 cursos" tone="dark" className="w-full" /><p className="mt-4 text-center font-mono text-[9px] font-bold uppercase tracking-wider">Você será direcionado ao ambiente de pagamento</p></div></aside></div></section>

      <section id="faq" className="mx-auto max-w-[1050px] scroll-mt-4 px-5 py-16 md:px-10 md:py-24"><div className="grid gap-8 md:grid-cols-[.6fr_1.4fr]"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2349d8]">05 / Dúvidas</span><h2 className="mt-4 font-serif text-4xl font-bold tracking-[-.04em]">Antes de entrar.</h2></div><div className="border-x-2 border-t-2 border-[#171717]">{faqBase.map(([question, answer], index) => <TrackedAccordion key={question} title={question} pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName={`faq_${index + 1}_open`} variant="light" className="!rounded-none !border-x-0 !border-t-0 !border-b-2 !border-[#171717] !bg-[#fffaf0] !p-5" titleClassName="!font-serif !text-lg !font-bold" contentClassName="!text-[#5d5a52]" iconClassName="!rounded-none !border-2 !border-[#171717] !bg-transparent"><p>{answer}</p></TrackedAccordion>)}</div></div></section>

      <section className="border-t-2 border-[#171717] bg-[#171717] text-white"><div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-10"><div><Rabbit className="h-8 w-8 text-[#ff6933]" /><h2 className="mt-4 max-w-2xl font-serif text-3xl font-bold">Agora com RabbitMQ: uma formação ainda mais completa para construir sistemas reais.</h2></div><Cta config={config} label={`Entrar no combo por ${priceLabel}`} tone="yellow" /></div></section>
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-8 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#666258] md:flex-row md:justify-between md:px-10"><span>© {new Date().getFullYear()} Plugando IA</span><div className="flex gap-5"><Link href="/terms">Termos</Link><Link href="/privacy">Privacidade</Link><Link href="/cursos">Catálogo</Link></div></footer>
      <MobileStickyCTA title={config.shortName} priceLabel={`${priceLabel} • ${config.courseCount} cursos`} href={config.checkoutUrl} label="Entrar" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} value={config.activePrice} currency="BRL" className="!border-[#171717] !bg-[#f7dd4c]" titleClassName="!text-[#171717]" priceClassName="!text-[#171717]" buttonClassName="!rounded-none !bg-none !bg-[#171717] !text-white" hideGlow />
    </main>
  );
}
