import Link from "next/link";
import { notFound } from "next/navigation";
import type { EditorialArticle } from "@/lib/commerce-editorial/agents";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";
import { publishEditorialArticle } from "../actions";

export const dynamic = "force-dynamic";

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try { return JSON.parse(raw || "") as T; } catch { return fallback; }
}

export default async function EditorialArticleReviewPage({ params }: { params: { id: string } }) {
  const article = await prisma.seoBrief.findUnique({
    where: { id: params.id },
    include: { product: { include: { affiliateStore: true } } },
  });
  if (!article?.contentJson || !article.product.affiliateStore) notFound();
  const content = parseJson<EditorialArticle>(article.contentJson, null as unknown as EditorialArticle);
  if (!content?.sections) notFound();
  const review = parseJson<any>(article.reviewNotes, {});
  const sources = parseJson<any[]>(article.sourcesJson, []);
  const store = article.product.affiliateStore;
  const publicUrl = `${getCommerceSiteUrl()}/lojas/${store.slug}/artigos/${article.slug}`;

  return (
    <main className="p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/editorial-commerce" className="text-sm font-black text-emerald-700">← Voltar para agentes SEO</Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-emerald-700">{store.name} • {article.status}</div>
            <h1 className="mt-2 max-w-3xl text-3xl font-black text-slate-950">{article.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{article.metaDescription}</p>
            <div className="mt-3 text-xs text-slate-500">Nota: {article.qualityScore ?? "—"} • Palavra-chave: {article.primaryKeyword}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {article.product.productUrl ? <a href={article.product.productUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-blue-200 px-4 py-3 text-sm font-black text-blue-700">Abrir produto</a> : null}
            {!article.indexable ? (
              <form action={publishEditorialArticle}>
                <input type="hidden" name="briefId" value={article.id} />
                <button className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Publicar artigo</button>
              </form>
            ) : <Link href={publicUrl} target="_blank" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Abrir página publicada</Link>}
          </div>
        </div>

        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{content.eyebrow}</div>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-800">{content.intro}</p>
          {content.specs?.length ? <dl className="mt-7 grid gap-3 sm:grid-cols-2">{content.specs.map((item) => <div key={`${item.label}-${item.value}`} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-black uppercase text-slate-500">{item.label}</dt><dd className="mt-2 text-sm leading-6 text-slate-800">{item.value}</dd></div>)}</dl> : null}
          <div className="mt-10 space-y-10">
            {content.sections.map((section) => <section key={section.title}><h2 className="text-2xl font-black text-slate-950">{section.title}</h2><div className="mt-4 space-y-4">{section.paragraphs.map((paragraph) => <p key={paragraph} className="leading-8 text-slate-700">{paragraph}</p>)}</div>{section.bullets?.length ? <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}
          </div>
          <section className="mt-10"><h2 className="text-2xl font-black text-slate-950">Perguntas frequentes</h2><div className="mt-4 space-y-3">{content.faq.map((item) => <div key={item.question} className="rounded-xl border border-slate-200 p-4"><h3 className="font-black text-slate-900">{item.question}</h3><p className="mt-2 leading-7 text-slate-700">{item.answer}</p></div>)}</div></section>
        </article>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black text-slate-950">Revisão dos agentes</h2><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(review, null, 2)}</pre></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black text-slate-950">Fontes registradas</h2><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(sources, null, 2)}</pre></div>
        </section>
      </div>
    </main>
  );
}
