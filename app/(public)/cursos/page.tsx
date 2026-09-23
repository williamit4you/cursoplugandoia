import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, Check, Code2, Layers3, MessageSquareMore, Sparkles } from "lucide-react";
import { SalesPageTracker } from "@/components/SalesPageTracker";
import { courseCatalog, type CourseCatalogItem } from "@/lib/courseCatalog";

export const metadata: Metadata = {
  title: "Cursos de programação, arquitetura e IA | Plugando IA",
  description: "Escolha sua próxima habilidade: RabbitMQ, arquitetura de software, APIs .NET, SaaS com IA ou a formação completa.",
  alternates: { canonical: "/cursos" },
  openGraph: { title: "Cursos Plugando IA | Aprenda construindo", description: "Cursos objetivos para transformar tecnologia em projetos reais.", url: "/cursos", siteName: "Plugando IA", type: "website" },
};

const accentClasses: Record<CourseCatalogItem["accent"], { line: string; glow: string; pill: string }> = {
  orange: { line: "bg-orange-400", glow: "from-orange-500/25", pill: "text-orange-200 border-orange-400/25 bg-orange-400/10" },
  cyan: { line: "bg-cyan-400", glow: "from-cyan-500/25", pill: "text-cyan-200 border-cyan-400/25 bg-cyan-400/10" },
  violet: { line: "bg-violet-400", glow: "from-violet-500/25", pill: "text-violet-200 border-violet-400/25 bg-violet-400/10" },
  emerald: { line: "bg-emerald-400", glow: "from-emerald-500/25", pill: "text-emerald-200 border-emerald-400/25 bg-emerald-400/10" },
  amber: { line: "bg-amber-300", glow: "from-amber-500/25", pill: "text-amber-100 border-amber-300/25 bg-amber-300/10" },
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CourseCard({ course, index }: { course: CourseCatalogItem; index: number }) {
  const accent = accentClasses[course.accent];
  const content = (
    <article className="group relative flex h-full min-h-[430px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#11151c] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20 md:p-7">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b ${accent.glow} to-transparent opacity-70`} />
      <div className={`absolute left-6 top-0 h-1 w-20 rounded-b-full ${accent.line}`} />
      <div className="relative flex items-start justify-between gap-3">
        <span className="font-mono text-xs text-white/35">0{index + 1}</span>
        {course.badge ? <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${accent.pill}`}>{course.badge}</span> : null}
      </div>
      <div className="relative mt-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">{course.eyebrow}</p>
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-0.03em] text-white">{course.title}</h2>
        <p className="mt-4 leading-7 text-slate-400">{course.description}</p>
      </div>
      <div className="relative mt-6 flex flex-wrap gap-2">
        {course.tags.map((tag) => <span key={tag} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-300">{tag}</span>)}
      </div>
      <div className="relative mt-auto border-t border-white/10 pt-5">
        <div className="flex items-center gap-2 text-sm text-slate-300"><Check className="h-4 w-4 text-emerald-400" />{course.outcome}</div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            {course.price ? <>{course.regularPrice ? <div className="text-xs text-slate-500 line-through">{formatPrice(course.regularPrice)}</div> : null}<div className="text-2xl font-black text-white">{formatPrice(course.price)}</div></> : <div className="text-sm font-semibold text-slate-400">Detalhes em breve</div>}
          </div>
          <span className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold ${course.available ? "bg-white text-slate-950 group-hover:bg-orange-300" : "border border-white/10 bg-white/5 text-slate-400"}`}>
            {course.available ? "Conhecer" : "Em breve"}{course.available ? <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /> : null}
          </span>
        </div>
      </div>
    </article>
  );
  return course.available ? <Link href={course.href}>{content}</Link> : <div aria-label={`${course.title} — em breve`}>{content}</div>;
}

export default function CursosPage() {
  const categoryItems = [
    { Icon: MessageSquareMore, label: "Mensageria" },
    { Icon: Layers3, label: "Arquitetura" },
    { Icon: Boxes, label: "Backend" },
    { Icon: Sparkles, label: "IA & SaaS" },
  ];

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <SalesPageTracker pageKey="cursos" pagePath="/cursos" pageTitle="Cursos Plugando IA" />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/cursos" className="flex items-center gap-3 font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-400 text-slate-950"><Code2 className="h-5 w-5" /></span>Plugando IA</Link>
          <Link href="/curso-completo" className="hidden text-sm font-semibold text-slate-300 transition hover:text-white sm:block">Ver formação completa <span aria-hidden>→</span></Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="absolute left-1/2 top-[-200px] h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-orange-500/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-200"><Sparkles className="h-3.5 w-3.5" /> Conhecimento que vira projeto</div>
            <h1 className="mt-6 text-balance text-5xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">Escolha o próximo nível da sua carreira.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">Cursos diretos ao ponto para você entender os fundamentos, escrever código melhor e construir sistemas que funcionam no mundo real.</p>
          </div>
          <div className="mt-12 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
            {categoryItems.map(({ Icon, label }) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-slate-300"><Icon className="h-4 w-4 text-orange-300" />{label}</div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Catálogo</p><h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Encontre o curso certo para agora.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Comece por uma habilidade específica ou escolha o combo para seguir a jornada completa.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courseCatalog.map((course, index) => <CourseCard key={course.slug} course={course} index={index} />)}</div>
      </section>

      <section className="border-t border-white/10 bg-[#0d1015]"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-[1fr,auto] md:items-center"><div><p className="text-sm font-bold text-orange-300">Não sabe qual escolher?</p><h2 className="mt-2 text-3xl font-black tracking-tight">A formação completa organiza o caminho por você.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-400">Fundamentos, backend, arquitetura, cloud, automação e IA em uma sequência pensada para evolução.</p></div><Link href="/curso-completo?utm_source=vitrine&utm_medium=site&utm_campaign=catalogo_cursos" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-400 px-6 py-4 font-black text-slate-950 transition hover:bg-orange-300">Conhecer o combo <ArrowRight className="h-5 w-5" /></Link></div></section>
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-600">© {new Date().getFullYear()} Plugando IA. Aprenda. Construa. Evolua.</footer>
    </main>
  );
}
