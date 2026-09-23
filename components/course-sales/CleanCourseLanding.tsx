import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import { MobileStickyCTA, SectionViewTracker, TrackedAccordion, TrackedCheckoutButton } from "@/components/course-completo/interactive";

export type CleanCurriculumGroup = {
  title: string;
  meta?: string;
  summary: string;
  lessons: string[];
};

export type CleanCard = {
  title: string;
  description: string;
  eyebrow?: string;
  meta?: string;
  href?: string;
};

type CleanCourseLandingProps = {
  pageKey: string;
  pagePath: string;
  pageTitle: string;
  name: string;
  metaPixelId?: string;
  eyebrow: string;
  headline: string;
  description: string;
  notice?: string;
  ctaLabel: string;
  checkoutUrl: string;
  price?: number;
  offerAvailable: boolean;
  stats: Array<{ value: string; label: string }>;
  heroPoints: string[];
  problemTitle: string;
  problemDescription: string;
  problems: CleanCard[];
  outcomeTitle: string;
  outcomeDescription: string;
  outcomes: CleanCard[];
  curriculumTitle: string;
  curriculumDescription: string;
  curriculum: CleanCurriculumGroup[];
  includedTitle?: string;
  includedDescription?: string;
  included?: CleanCard[];
  fitTitle: string;
  fitItems: string[];
  offerTitle: string;
  offerDescription: string;
  offerItems: string[];
  offerNote: string;
  faq: Array<[string, string]>;
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SectionIntro({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">{label}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 md:text-4xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
    </div>
  );
}

export function CleanCourseLanding(props: CleanCourseLandingProps) {
  const eventData = {
    content_name: props.name,
    content_category: "Curso",
    content_type: "product",
    ...(props.price ? { value: props.price, currency: "BRL" } : {}),
  };

  function PrimaryCta({ label, className = "" }: { label: string; className?: string }) {
    if (!props.offerAvailable || !props.price) {
      return (
        <a href="#conteudo" className={`inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 ${className}`}>
          {label}<ArrowRight className="ml-2 h-4 w-4" />
        </a>
      );
    }

    return (
      <TrackedCheckoutButton
        href={props.checkoutUrl}
        label={label}
        pageKey={props.pageKey}
        pagePath={props.pagePath}
        pageTitle={props.pageTitle}
        value={props.price}
        currency="BRL"
        customEvent="primary_checkout_click"
        eventData={eventData}
        hideGlow
        className={`!rounded-lg !bg-none !bg-blue-700 !px-6 !py-3.5 !font-bold !text-white hover:!bg-blue-800 ${className}`}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <MetaPixelScript pixelId={props.metaPixelId} />
      <MetaPixelViewContent data={eventData} />
      <SalesPageTracker pageKey={props.pageKey} pagePath={props.pagePath} pageTitle={props.pageTitle} metadata={{ offerPrice: props.price ?? null, currency: "BRL", offerName: props.name }} />
      <SalesViewContentTracker pageKey={props.pageKey} pagePath={props.pagePath} pageTitle={props.pageTitle} currency="BRL" value={props.price} metadata={{ contentName: props.name, contentType: "course" }} />
      <SectionViewTracker selectorId="conteudo" pageKey={props.pageKey} pagePath={props.pagePath} pageTitle={props.pageTitle} eventName="curriculum_view" />
      <SectionViewTracker selectorId="oferta" pageKey={props.pageKey} pagePath={props.pagePath} pageTitle={props.pageTitle} eventName="offer_view" />

      {props.notice ? <div className="border-b border-blue-100 bg-blue-50 px-4 py-2.5 text-center text-sm font-semibold text-blue-950">{props.notice}</div> : null}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/cursos" className="text-lg font-extrabold tracking-[-0.03em] text-[#0b1f3a]">Plugando IA</Link>
          <a href="#conteudo" className="text-sm font-semibold text-slate-600 hover:text-blue-700">Ver conteúdo</a>
        </div>
      </header>

      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.12fr_.88fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">{props.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-[#0b1f3a] md:text-6xl">{props.headline}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{props.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta label={props.ctaLabel} />
              <a href="#conteudo" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">Ver programa completo</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              {props.heroPoints.map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-700" />{item}</span>)}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold text-slate-500">Resumo da formação</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0b1f3a]">{props.name}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {props.stats.slice(0, 4).map((stat) => <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4"><strong className="block text-2xl font-extrabold text-[#0b1f3a]">{stat.value}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{stat.label}</span></div>)}
            </div>
            <div className="mt-6 border-t border-slate-200 pt-6">
              {props.price ? <><span className="text-sm text-slate-500">Investimento atual</span><strong className="mt-1 block text-4xl font-extrabold tracking-tight text-[#0b1f3a]">{formatPrice(props.price)}</strong></> : <><span className="text-sm text-slate-500">Nova turma</span><strong className="mt-1 block text-2xl font-bold text-[#0b1f3a]">Condição de lançamento em breve</strong></>}
              <PrimaryCta label={props.ctaLabel} className="mt-5 w-full" />
              <p className="mt-3 text-center text-xs leading-5 text-slate-500">{props.offerNote}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 md:grid-cols-4 md:px-8">
          {props.stats.slice(0, 4).map((stat) => <div key={stat.label} className="border-r border-slate-200 px-4 py-7 last:border-r-0 md:px-8"><strong className="block text-2xl font-extrabold text-[#0b1f3a] md:text-3xl">{stat.value}</strong><span className="mt-1 block text-sm text-slate-500">{stat.label}</span></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <SectionIntro label="Por que este curso" title={props.problemTitle} description={props.problemDescription} />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {props.problems.map((item, index) => <article key={item.title} className="rounded-xl border border-slate-200 p-6"><span className="text-sm font-bold text-blue-700">0{index + 1}</span><h3 className="mt-5 text-xl font-bold text-[#0b1f3a]">{item.title}</h3><p className="mt-3 leading-7 text-slate-600">{item.description}</p></article>)}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <SectionIntro label="O que você conquista" title={props.outcomeTitle} description={props.outcomeDescription} />
          <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {props.outcomes.map((item) => <article key={item.title} className="flex gap-4"><span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100"><Check className="h-4 w-4 text-blue-700" /></span><div><h3 className="text-lg font-bold text-[#0b1f3a]">{item.title}</h3><p className="mt-2 leading-7 text-slate-600">{item.description}</p></div></article>)}
          </div>
        </div>
      </section>

      <section id="conteudo" className="mx-auto max-w-5xl scroll-mt-6 px-5 py-20 md:px-8 md:py-24">
        <SectionIntro label="Conteúdo completo" title={props.curriculumTitle} description={props.curriculumDescription} />
        <div className="mt-12 space-y-3">
          {props.curriculum.map((group, index) => <TrackedAccordion key={group.title} title={`${String(index + 1).padStart(2, "0")}. ${group.title}${group.meta ? ` — ${group.meta}` : ""}`} pageKey={props.pageKey} pagePath={props.pagePath} pageTitle={props.pageTitle} eventName={`curriculum_${index + 1}_open`} variant="light" className="!rounded-xl !border-slate-200 !bg-white !p-5 shadow-sm" titleClassName="!text-base !font-bold !text-[#0b1f3a] md:!text-lg" contentClassName="!text-slate-600" iconClassName="!border-slate-200 !bg-slate-50 !text-blue-700"><p className="mb-5 leading-7">{group.summary}</p><ol className="space-y-2 border-t border-slate-100 pt-4">{group.lessons.map((lesson, lessonIndex) => <li key={lesson} className="flex gap-3 text-sm leading-6"><span className="w-6 shrink-0 font-mono text-xs text-blue-700">{String(lessonIndex + 1).padStart(2, "0")}</span><span>{lesson}</span></li>)}</ol></TrackedAccordion>)}
        </div>
      </section>

      {props.included?.length ? (
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
            <SectionIntro label="Também incluído" title={props.includedTitle ?? "Mais conteúdo para sua evolução"} description={props.includedDescription ?? "Tudo incluído na mesma matrícula."} />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {props.included.map((item) => <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wider text-blue-700">{item.eyebrow ?? "Incluído"}</span>{item.meta ? <span className="text-xs text-slate-500">{item.meta}</span> : null}</div><h3 className="mt-4 text-xl font-bold text-[#0b1f3a]">{item.title}</h3><p className="mt-3 leading-7 text-slate-600">{item.description}</p>{item.href ? <Link href={item.href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800">Conhecer individualmente <ArrowRight className="h-4 w-4" /></Link> : null}</article>)}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Para quem é</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#0b1f3a] md:text-4xl">{props.fitTitle}</h2></div>
          <div className="grid gap-3 sm:grid-cols-2">{props.fitItems.map((item) => <div key={item} className="flex gap-3 rounded-xl border border-slate-200 p-5 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />{item}</div>)}</div>
        </div>
      </section>

      <section id="oferta" className="scroll-mt-6 border-y border-blue-200 bg-blue-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Comece agora</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#0b1f3a] md:text-5xl">{props.offerTitle}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{props.offerDescription}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">{props.offerItems.map((item) => <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><Check className="h-4 w-4 text-blue-700" />{item}</div>)}</div>
          </div>
          <aside className="rounded-2xl border border-blue-200 bg-white p-7 shadow-sm">
            {props.notice ? <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"><Clock3 className="h-3.5 w-3.5" />{props.notice}</div> : null}
            {props.price ? <><span className="text-sm text-slate-500">Investimento</span><strong className="mt-1 block text-4xl font-extrabold tracking-tight text-[#0b1f3a]">{formatPrice(props.price)}</strong></> : <strong className="block text-2xl font-bold text-[#0b1f3a]">Condição de lançamento em breve</strong>}
            <PrimaryCta label={props.ctaLabel} className="mt-6 w-full" />
            <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><p className="text-xs leading-5 text-slate-500">{props.offerNote}</p></div>
          </aside>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-5 py-20 md:px-8 md:py-24">
        <SectionIntro label="Perguntas frequentes" title="Tire suas dúvidas antes de entrar" description="Respostas diretas para você decidir com clareza." />
        <div className="mt-10 space-y-3">{props.faq.map(([question, answer], index) => <TrackedAccordion key={question} title={question} pageKey={props.pageKey} pagePath={props.pagePath} pageTitle={props.pageTitle} eventName={`faq_${index + 1}_open`} variant="light" className="!rounded-xl !border-slate-200 !bg-white !p-5" titleClassName="!font-bold !text-[#0b1f3a]" contentClassName="!text-slate-600" iconClassName="!border-slate-200 !bg-slate-50 !text-blue-700"><p>{answer}</p></TrackedAccordion>)}</div>
      </section>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-8"><strong className="text-[#0b1f3a]">Plugando IA</strong><div className="flex gap-5"><Link href="/terms">Termos</Link><Link href="/privacy">Privacidade</Link><Link href="/cursos">Todos os cursos</Link></div></div></footer>

      {props.offerAvailable && props.price ? <MobileStickyCTA title={props.name} priceLabel={formatPrice(props.price)} href={props.checkoutUrl} label="Entrar" pageKey={props.pageKey} pagePath={props.pagePath} pageTitle={props.pageTitle} value={props.price} currency="BRL" className="!border-slate-200 !bg-white" titleClassName="!text-[#0b1f3a]" priceClassName="!text-blue-700" buttonClassName="!rounded-lg !bg-none !bg-blue-700 !text-white" hideGlow /> : null}
    </main>
  );
}
