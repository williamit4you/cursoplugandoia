import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Info, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildStoreArticle, buildStoreCtaLabel, findStoreArticleTopic, STORE_ARTICLE_TOPICS } from "@/lib/affiliateSeoContent";

export const dynamic = "force-dynamic";

async function getStore(slug: string) {
  return prisma.affiliateStore.findFirst({ where: { slug, status: "ACTIVE" } });
}

export async function generateMetadata({ params }: { params: { slug: string; tema: string } }): Promise<Metadata> {
  const [store, topic] = await Promise.all([getStore(params.slug), Promise.resolve(findStoreArticleTopic(params.tema))]);
  if (!store || !topic) return { title: "Conteúdo não encontrado", robots: { index: false, follow: false } };
  const article = buildStoreArticle(store, topic.slug)!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud";
  const canonical = `${siteUrl}/lojas/${store.slug}/${topic.slug}`;
  return {
    title: `${article.title} | Compra Esperta`,
    description: article.description,
    alternates: { canonical },
    openGraph: { title: article.title, description: article.description, type: "article", url: canonical },
  };
}

export default async function StoreArticlePage({ params }: { params: { slug: string; tema: string } }) {
  const store = await getStore(params.slug);
  if (!store) notFound();
  const article = buildStoreArticle(store, params.tema);
  if (!article) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud";
  const canonical = `${siteUrl}/lojas/${store.slug}/${article.topic.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.description,
        mainEntityOfPage: canonical,
        author: { "@type": "Organization", name: "Compra Esperta Promoções" },
        publisher: { "@type": "Organization", name: "Compra Esperta Promoções" },
        about: [store.name, store.category],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Lojas", item: `${siteUrl}/lojas` },
          { "@type": "ListItem", position: 2, name: store.name, item: `${siteUrl}/lojas/${store.slug}` },
          { "@type": "ListItem", position: 3, name: article.topic.shortLabel, item: canonical },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#07110f] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/ofertas" className="flex items-center gap-3 font-black"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><ShoppingBag className="h-5 w-5" /></span>Compra Esperta</Link>
          <Link href={`/lojas/${store.slug}`} className="text-sm font-bold text-emerald-200">{store.name}</Link>
        </div>
      </header>

      <article>
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(52,211,153,0.14),transparent_36%)]">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
            <Link href={`/lojas/${store.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Guias da {store.name}</Link>
            <div className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">{article.topic.shortLabel} • {store.category}</div>
            <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl">{article.title}</h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">{article.description}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400"><Info className="h-4 w-4 text-amber-200" /> Conteúdo editorial com link de afiliado identificado</div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-5 py-12">
          <p className="text-xl font-medium leading-9 text-slate-200">{article.intro}</p>
          <div className="mt-12 space-y-12">
            {article.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{section.title}</h2>
                <div className="mt-5 space-y-4">
                  {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-slate-300">{paragraph}</p>)}
                </div>
                {section.bullets ? (
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((bullet) => <li key={bullet} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-300 text-slate-950"><Check className="h-3 w-3" /></span>{bullet}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <aside className="mt-14 rounded-[30px] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 to-amber-300/5 p-7 sm:p-9">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Próximo passo</div>
            <h2 className="mt-3 text-2xl font-black text-white">Confira as condições diretamente na loja</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Preço, estoque, frete e eventuais cupons podem mudar. O botão abaixo usa seu link de afiliado e registra apenas o clique necessário para medir a campanha.</p>
            <a href={`/go/loja/${store.slug}?source=seo_article&medium=affiliate&campaign=${article.topic.slug}`} rel="sponsored" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 hover:bg-emerald-200">{buildStoreCtaLabel(store)} <ExternalLink className="h-4 w-4" /></a>
          </aside>

          <section className="mt-14">
            <h2 className="text-2xl font-black text-white">Perguntas frequentes</h2>
            <div className="mt-5 space-y-3">
              {article.faq.map((item) => <details key={item.question} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5"><summary className="cursor-pointer list-none font-bold text-white">{item.question}</summary><p className="mt-3 text-sm leading-6 text-slate-400">{item.answer}</p></details>)}
            </div>
          </section>

          <nav className="mt-14 border-t border-white/10 pt-10">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Continue pesquisando</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {STORE_ARTICLE_TOPICS.filter((topic) => topic.slug !== article.topic.slug).map((topic) => (
                <Link key={topic.slug} href={`/lojas/${store.slug}/${topic.slug}`} className="flex items-center justify-between rounded-2xl border border-white/10 p-4 text-sm font-bold text-slate-200 hover:border-emerald-300/30">{topic.shortLabel}<ArrowRight className="h-4 w-4" /></Link>
              ))}
            </div>
          </nav>
        </div>
      </article>
    </main>
  );
}
