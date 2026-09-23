import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2 } from "lucide-react";
import { SalesPageTracker } from "@/components/SalesPageTracker";
import { courseCatalog } from "@/lib/courseCatalog";

export const metadata: Metadata = {
  title: "Cursos de programação, arquitetura e IA | Plugando IA",
  description: "Cursos práticos de C#, .NET, arquitetura, RabbitMQ, Next.js, SaaS e Inteligência Artificial.",
  alternates: { canonical: "/cursos" },
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CursosPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SalesPageTracker pageKey="cursos" pagePath="/cursos" pageTitle="Cursos Plugando IA" />

      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/cursos" className="flex items-center gap-3 text-lg font-extrabold tracking-[-0.03em] text-[#0b1f3a]"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-700 text-white"><Code2 className="h-5 w-5" /></span>Plugando IA</Link>
          <Link href="/curso-arquitetura-software" className="text-sm font-semibold text-blue-700 hover:text-blue-800">Ver curso de Arquitetura</Link>
        </div>
      </header>

      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Escola de tecnologia aplicada</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-[#0b1f3a] md:text-6xl">Cursos para aprender melhor e construir com confiança.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Escolha uma habilidade específica ou siga uma formação completa. Conteúdo organizado, aplicação prática e clareza sobre o que você será capaz de fazer.</p>
            <a href="#catalogo" className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800">Explorar cursos <ArrowRight className="ml-2 h-4 w-4" /></a>
          </div>
          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <p className="text-sm font-semibold text-blue-700">Quer uma base mais completa?</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0b1f3a]">Arquitetura de Software com C#, API .NET e AWS como bônus.</h2>
            <p className="mt-4 leading-7 text-slate-600">São quatro cursos e mais de 200 aulas por R$ 39,99 à vista.</p>
            <Link href="/curso-arquitetura-software?utm_source=vitrine&utm_medium=site&utm_campaign=catalogo_cursos" className="mt-6 inline-flex items-center text-sm font-bold text-blue-700 hover:text-blue-800">Conhecer a oferta <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </aside>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50"><div className="mx-auto grid max-w-7xl grid-cols-2 px-5 md:grid-cols-4 md:px-8">{[["Cursos individuais", "Aprenda o que precisa agora"], ["Projetos reais", "Veja a tecnologia funcionando"], ["Conteúdo objetivo", "Sem aulas apenas para preencher"], ["Formação completa", "Uma sequência para evoluir"]].map(([title, text]) => <div key={title} className="border-r border-slate-200 px-4 py-7 last:border-r-0 md:px-8"><strong className="block text-base font-bold text-[#0b1f3a]">{title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span></div>)}</div></section>

      <section id="catalogo" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-20 md:px-8 md:py-24">
        <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Catálogo de cursos</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#0b1f3a] md:text-4xl">Escolha o curso certo para o seu momento</h2><p className="mt-4 text-lg leading-8 text-slate-600">Cada página mostra conteúdo, resultado esperado e condição comercial antes da matrícula.</p></div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courseCatalog.map((course, index) => {
            const card = (
              <article className={`flex h-full flex-col rounded-2xl border bg-white p-6 ${course.available ? "border-slate-200 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md" : "border-slate-200 opacity-65"}`}>
                <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{course.eyebrow}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{course.badge}</span></div>
                <span className="mt-8 text-sm font-bold text-slate-400">0{index + 1}</span>
                <h3 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[#0b1f3a]">{course.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">{course.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">{course.tags.map((tag) => <span key={tag} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>)}</div>
                <div className="mt-auto pt-8"><div className="flex items-start gap-2 border-t border-slate-100 pt-5 text-sm font-medium leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />{course.outcome}</div><div className="mt-5 flex items-end justify-between gap-3"><div>{course.price ? <><span className="block text-xs text-slate-500">{course.installments}</span><strong className="text-2xl text-[#0b1f3a]">{formatPrice(course.price)} <small className="text-xs font-medium text-slate-500">à vista</small></strong></> : <span className="text-sm font-semibold text-slate-500">{course.available ? "Ver condição na página" : "Em preparação"}</span>}</div><span className={`inline-flex items-center text-sm font-bold ${course.available ? "text-blue-700" : "text-slate-400"}`}>{course.available ? "Conhecer" : "Em breve"}{course.available ? <ArrowRight className="ml-2 h-4 w-4" /> : null}</span></div></div>
              </article>
            );
            return course.available ? <Link key={course.slug} href={course.href}>{card}</Link> : <div key={course.slug}>{card}</div>;
          })}
        </div>
      </section>

      <section className="border-y border-blue-200 bg-blue-50"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-8"><div><h2 className="text-3xl font-bold tracking-[-0.03em] text-[#0b1f3a]">Comece por Arquitetura de Software</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Além do curso principal, você recebe C#, API RESTful com .NET e AWS como bônus.</p></div><Link href="/curso-arquitetura-software?utm_source=vitrine&utm_medium=site&utm_campaign=rodape_catalogo" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-700 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-800">Ver os 4 cursos <ArrowRight className="ml-2 h-4 w-4" /></Link></div></section>
      <footer className="border-t border-slate-200"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 md:flex-row md:justify-between md:px-8"><strong className="text-[#0b1f3a]">Plugando IA</strong><span>Programação, arquitetura, produto e Inteligência Artificial.</span></div></footer>
    </main>
  );
}
