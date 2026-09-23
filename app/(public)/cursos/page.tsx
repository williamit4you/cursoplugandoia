import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Code2 } from "lucide-react";
import { SalesPageTracker } from "@/components/SalesPageTracker";
import { courseCatalog, type CourseCatalogItem } from "@/lib/courseCatalog";

export const metadata: Metadata = {
  title: "Cursos de tecnologia para quem constrói | Plugando IA",
  description: "Formações em programação, arquitetura, APIs, SaaS e mensageria, com fundamentos e projetos aplicados.",
  alternates: { canonical: "/cursos" },
  openGraph: { title: "Plugando IA — Escola de tecnologia aplicada", description: "Cursos para entender melhor, construir melhor e avançar com consistência.", url: "/cursos", siteName: "Plugando IA", type: "website" },
};

const visualTheme: Record<CourseCatalogItem["accent"], { bg: string; ink: string; mark: string }> = {
  orange: { bg: "bg-[#ff6933]", ink: "text-[#171717]", mark: "border-[#171717]" },
  cyan: { bg: "bg-[#c6e8ff]", ink: "text-[#102033]", mark: "border-[#236ea5]" },
  violet: { bg: "bg-[#d8ceff]", ink: "text-[#21183e]", mark: "border-[#5537aa]" },
  emerald: { bg: "bg-[#bde7ce]", ink: "text-[#10271a]", mark: "border-[#24714a]" },
  amber: { bg: "bg-[#f7dd4c]", ink: "text-[#171717]", mark: "border-[#171717]" },
};

function price(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function CourseArtwork({ course, index }: { course: CourseCatalogItem; index: number }) {
  const theme = visualTheme[course.accent];
  const code = ["MQ", "ARQ", "SaaS", "API", "FULL"][index];
  return (
    <div className={`relative aspect-[4/3] overflow-hidden ${theme.bg} ${theme.ink}`}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-current/30 px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-[.18em]"><span>Plugando IA / Curso {String(index + 1).padStart(2, "0")}</span><span>Ed. 2026</span></div>
      {index === 0 ? (
        <div className="absolute inset-x-5 bottom-6 top-16 grid grid-cols-[1fr,auto,1fr] items-center gap-3"><div className={`border-2 ${theme.mark} p-4 text-center font-mono text-xs font-bold`}>PUB</div><span className="text-xl">→</span><div className="space-y-2">{[1, 2, 3].map((item) => <div key={item} className={`border-2 ${theme.mark} px-3 py-2 font-mono text-[10px]`}>QUEUE_{item}</div>)}</div></div>
      ) : index === 1 ? (
        <div className="absolute inset-x-6 bottom-7 top-20"><div className={`h-full border-2 ${theme.mark} p-4`}><div className={`grid h-full grid-cols-2 gap-3 border-2 ${theme.mark} p-3`}><div className={`border-2 ${theme.mark}`} /><div className="grid gap-3"><div className={`border-2 ${theme.mark}`} /><div className={`border-2 ${theme.mark}`} /></div></div></div></div>
      ) : index === 2 ? (
        <div className="absolute inset-x-6 bottom-7 top-20 flex items-end gap-3">{[44, 70, 100].map((height, item) => <div key={height} className={`flex-1 border-2 ${theme.mark}`} style={{ height: `${height}%` }}><span className="block border-b border-current/40 p-2 font-mono text-[9px]">0{item + 1}</span></div>)}</div>
      ) : index === 3 ? (
        <div className="absolute inset-x-6 bottom-7 top-20 flex flex-col justify-between font-mono text-[10px] font-bold">{["GET /agenda", "POST /clientes", "AUTH /token"].map((item, itemIndex) => <div key={item} className={`flex items-center justify-between border-2 ${theme.mark} p-3`}><span>{item}</span><span>{itemIndex === 2 ? "201" : "200"}</span></div>)}</div>
      ) : (
        <div className="absolute inset-x-5 bottom-6 top-16 grid grid-cols-3 grid-rows-2 gap-2">{["C#", "API", "ARQ", "AWS", "IA", "SaaS"].map((item) => <div key={item} className={`grid place-items-center border-2 ${theme.mark} font-mono text-xs font-black`}>{item}</div>)}</div>
      )}
      <span className="absolute bottom-4 right-5 text-5xl font-black tracking-[-.08em] opacity-15">{code}</span>
    </div>
  );
}

function CourseItem({ course, index }: { course: CourseCatalogItem; index: number }) {
  const content = (
    <article className={`group grid h-full overflow-hidden border-2 border-[#171717] bg-[#fffdf5] ${course.available ? "transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#171717]" : "opacity-75"}`}>
      <CourseArtwork course={course} index={index} />
      <div className="flex flex-col p-6 md:p-7">
        <div className="flex items-start justify-between gap-4"><p className="font-mono text-[10px] font-black uppercase tracking-[.18em] text-[#55534d]">{course.eyebrow}</p><span className="border border-[#171717] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider">{course.badge}</span></div>
        <h2 className="mt-5 font-serif text-3xl font-bold leading-[1.02] tracking-[-.035em] text-[#171717]">{course.title}</h2>
        <p className="mt-4 leading-7 text-[#5d5a52]">{course.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">{course.tags.map((tag) => <span key={tag} className="border border-[#c8c4b7] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-[#55534d]">{tag}</span>)}</div>
        <div className="mt-auto pt-8"><div className="flex items-center gap-2 border-t border-[#d8d3c5] pt-4 text-sm font-medium text-[#3c3a35]"><Check className="h-4 w-4" />{course.outcome}</div><div className="mt-6 flex items-end justify-between gap-3"><div>{course.price ? <>{course.regularPrice ? <div className="text-xs text-[#767269] line-through">{price(course.regularPrice)}</div> : null}<div className="text-2xl font-black text-[#171717]">{price(course.price)}</div></> : <span className="font-mono text-xs font-bold uppercase text-[#767269]">Novas turmas em breve</span>}</div><span className={`grid h-12 w-12 place-items-center border-2 border-[#171717] ${course.available ? "bg-[#171717] text-white transition group-hover:bg-[#2349d8]" : "text-[#171717]"}`}><ArrowUpRight className="h-5 w-5" /></span></div></div>
      </div>
    </article>
  );
  return course.available ? <Link href={course.href}>{content}</Link> : <div>{content}</div>;
}

export default function CursosPage() {
  return (
    <main className="min-h-screen bg-[#f2efe5] text-[#171717]">
      <SalesPageTracker pageKey="cursos" pagePath="/cursos" pageTitle="Cursos Plugando IA" />
      <header className="border-b-2 border-[#171717]"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10"><Link href="/cursos" className="flex items-center gap-3 font-black tracking-[-.03em]"><span className="grid h-9 w-9 place-items-center bg-[#2349d8] text-white"><Code2 className="h-5 w-5" /></span>PLUGANDO IA</Link><div className="hidden items-center gap-8 font-mono text-[10px] font-bold uppercase tracking-[.16em] md:flex"><span>Escola de tecnologia aplicada</span><Link href="#catalogo" className="underline decoration-2 underline-offset-4">Explorar cursos</Link></div></div></header>

      <section className="border-b-2 border-[#171717]"><div className="mx-auto grid max-w-[1440px] md:grid-cols-[1.45fr_.55fr]"><div className="border-[#171717] px-5 py-16 md:border-r-2 md:px-10 md:py-24 lg:py-28"><p className="font-mono text-xs font-black uppercase tracking-[.22em] text-[#2349d8]">Catálogo 2026 / Cursos online</p><h1 className="mt-8 max-w-5xl font-serif text-[3.5rem] font-bold leading-[.92] tracking-[-.055em] sm:text-7xl lg:text-[6.8rem]">Aprenda tecnologia com profundidade. E propósito.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#55534d] md:text-xl">Cursos para quem não quer apenas acompanhar ferramentas, mas entender decisões, construir sistemas e fazer um trabalho melhor.</p></div><aside className="grid grid-cols-2 border-t-2 border-[#171717] md:grid-cols-1 md:border-t-0"><div className="flex flex-col justify-between border-r-2 border-[#171717] bg-[#f7dd4c] p-6 md:border-b-2 md:border-r-0 md:p-8"><span className="font-mono text-[10px] font-black uppercase tracking-[.18em]">Nosso compromisso</span><p className="mt-16 font-serif text-2xl font-bold leading-tight md:text-3xl">Menos atalhos.<br />Mais entendimento.</p></div><div className="flex flex-col justify-between bg-[#2349d8] p-6 text-white md:p-8"><span className="font-mono text-[10px] font-black uppercase tracking-[.18em]">Trilhas disponíveis</span><strong className="mt-16 text-6xl font-black tracking-[-.08em]">05</strong></div></aside></div></section>

      <section id="catalogo" className="mx-auto max-w-[1440px] scroll-mt-4 px-5 py-16 md:px-10 md:py-24"><div className="grid gap-8 border-b-2 border-[#171717] pb-8 md:grid-cols-2 md:items-end"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2349d8]">01 / Escolha seu caminho</span><h2 className="mt-4 font-serif text-4xl font-bold tracking-[-.04em] md:text-5xl">Uma escola. Diferentes pontos de partida.</h2></div><p className="max-w-xl justify-self-end leading-7 text-[#5d5a52]">Estude um tema específico no seu tempo ou escolha a formação completa para seguir uma sequência estruturada.</p></div><div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">{courseCatalog.map((course, index) => <CourseItem key={course.slug} course={course} index={index} />)}</div></section>

      <section className="border-y-2 border-[#171717] bg-[#171717] text-white"><div className="mx-auto grid max-w-[1440px] md:grid-cols-[1fr_auto] md:items-center"><div className="px-5 py-14 md:px-10 md:py-16"><p className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#f7dd4c]">Formação completa</p><h2 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight tracking-[-.04em] md:text-5xl">Se você ainda não sabe qual curso escolher, comece pelo caminho.</h2><p className="mt-4 max-w-2xl leading-7 text-white/65">A formação conecta fundamentos, backend, arquitetura, cloud, automação e IA em uma evolução coerente.</p></div><Link href="/curso-completo?utm_source=vitrine&utm_medium=site&utm_campaign=catalogo_cursos" className="group flex h-full min-h-32 items-center gap-8 border-t-2 border-white bg-[#f7dd4c] px-8 font-black text-[#171717] md:min-h-64 md:border-l-2 md:border-t-0"><span>CONHECER O COMBO</span><ArrowUpRight className="h-7 w-7 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></Link></div></section>
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-8 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#666258] md:flex-row md:justify-between md:px-10"><span>© {new Date().getFullYear()} Plugando IA</span><span>Aprenda / Construa / Evolua</span></footer>
    </main>
  );
}
