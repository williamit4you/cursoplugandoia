import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ExternalLink, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findProductSeoArticle, PRODUCT_SEO_ARTICLES } from "@/lib/productSeoArticles";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

async function getPageData(storeSlug: string, productSlug: string) {
  const [store, article] = await Promise.all([
    prisma.affiliateStore.findFirst({ where: { slug: storeSlug, status: "ACTIVE" } }),
    Promise.resolve(findProductSeoArticle(storeSlug, productSlug)),
  ]);
  return { store, article };
}

export async function generateMetadata({ params }: { params: { slug: string; produto: string } }): Promise<Metadata> {
  const { store, article } = await getPageData(params.slug, params.produto);
  if (!store || !article) return { title: "Produto não encontrado", robots: { index: false, follow: false } };
  const siteUrl = getCommerceSiteUrl();
  const canonical = `${siteUrl}/lojas/${store.slug}/produtos/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    keywords: [article.primaryKeyword, ...article.secondaryKeywords, article.productName, article.brand],
    alternates: { canonical },
    openGraph: { type: "article", title: article.title, description: article.description, url: canonical, siteName: "Compra Esperta Promoções", modifiedTime: article.updatedAt },
    twitter: { card: "summary_large_image", title: article.title, description: article.description },
  };
}

export default async function ProductSeoPage({ params }: { params: { slug: string; produto: string } }) {
  const { store, article } = await getPageData(params.slug, params.produto);
  if (!store || !article) notFound();
  const siteUrl = getCommerceSiteUrl();
  const canonical = `${siteUrl}/lojas/${store.slug}/produtos/${article.slug}`;
  const related = PRODUCT_SEO_ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3);
  const outbound = `/go/loja/${store.slug}?source=product_article&medium=content&campaign=${encodeURIComponent(article.slug)}&destination=${encodeURIComponent(article.productUrl)}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article", "@id": `${canonical}#article`, headline: article.title, description: article.description,
        mainEntityOfPage: canonical, datePublished: article.updatedAt, dateModified: article.updatedAt, inLanguage: "pt-BR",
        author: { "@type": "Organization", name: "Compra Esperta Promoções" },
        publisher: { "@type": "Organization", name: "Compra Esperta Promoções" },
        about: { "@id": `${canonical}#product` }, keywords: [article.primaryKeyword, ...article.secondaryKeywords].join(", "),
      },
      {
        "@type": "Product", "@id": `${canonical}#product`, name: article.productName, description: article.description,
        category: article.category, brand: { "@type": "Brand", name: article.brand }, url: canonical,
      },
      {
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Produtos", item: `${siteUrl}/produtos` },
          { "@type": "ListItem", position: 2, name: store.name, item: `${siteUrl}/lojas/${store.slug}` },
          { "@type": "ListItem", position: 3, name: article.productName, item: canonical },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#07110f] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/ofertas" className="flex items-center gap-3 font-black">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><ShoppingBag className="h-5 w-5" /></span>Compra Esperta
          </Link>
          <nav className="flex items-center gap-5 text-sm font-bold">
            <Link href="/produtos" className="text-slate-400 hover:text-white">Guias de produtos</Link>
            <Link href={`/lojas/${store.slug}`} className="text-emerald-200">{store.name}</Link>
          </nav>
        </div>
      </header>

      <article>
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(52,211,153,0.16),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(251,191,36,0.10),transparent_30%)]">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
            <Link href={`/lojas/${store.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Conteúdos da {store.name}</Link>
            <div className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">{article.eyebrow}</div>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{article.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 px-4 py-2">Atualizado em 30/07/2026</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Fonte: {article.sourceLabel}</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-5 py-12">
          <p className="max-w-4xl text-xl font-medium leading-9 text-slate-200">{article.intro}</p>
          <section aria-labelledby="ficha-resumida" className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <h2 id="ficha-resumida" className="text-xl font-black text-white">Ficha resumida do produto</h2>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {article.specs.map((spec) => (
                <div key={spec.label} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-emerald-200">{spec.label}</dt>
                  <dd className="mt-2 text-sm leading-6 text-slate-200">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-12 space-y-14">
            {article.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{section.title}</h2>
                <div className="mt-5 space-y-4">{section.paragraphs.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-slate-300">{paragraph}</p>)}</div>
                {section.bullets ? (
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-300 text-slate-950"><Check className="h-3 w-3" /></span>{bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <aside className="mt-14 rounded-[30px] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 to-amber-300/5 p-7 sm:p-9">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Confira antes de decidir</div>
            <h2 className="mt-3 text-2xl font-black text-white">Veja disponibilidade e ficha atual na {store.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Especificações, estoque, preço, frete e versões podem mudar. Confirme os dados atuais diretamente na página da loja.</p>
            <a href={outbound} rel="sponsored" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 hover:bg-emerald-200">Ver {article.productName} <ExternalLink className="h-4 w-4" /></a>
          </aside>

          <section className="mt-14">
            <h2 className="text-2xl font-black text-white">Dúvidas sobre {article.productName}</h2>
            <div className="mt-5 space-y-3">
              {article.faq.map((item) => (
                <details key={item.question} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <summary className="cursor-pointer list-none font-bold text-white">{item.question}</summary>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <nav className="mt-14 border-t border-white/10 pt-10" aria-label="Outros guias de produtos">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Continue pesquisando</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/lojas/${item.storeSlug}/produtos/${item.slug}`} className="group flex min-h-32 flex-col justify-between rounded-2xl border border-white/10 p-4 hover:border-emerald-300/30">
                  <span className="text-sm font-black leading-6 text-slate-200">{item.productName}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-200">Ler guia <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </article>
    </main>
  );
}
