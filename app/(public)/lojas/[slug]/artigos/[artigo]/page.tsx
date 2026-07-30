import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import CommercialDisclosure from "@/components/commerce/CommercialDisclosure";
import type { EditorialArticle } from "@/lib/commerce-editorial/agents";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

async function getArticle(storeSlug: string, articleSlug: string) {
  return prisma.seoBrief.findFirst({
    where: {
      slug: articleSlug,
      status: "PUBLISHED",
      indexable: true,
      product: { affiliateStore: { slug: storeSlug, status: "ACTIVE" } },
    },
    include: { product: { include: { affiliateStore: true } } },
  });
}

function parseContent(raw: string | null): EditorialArticle | null {
  try {
    const content = JSON.parse(raw || "");
    return content && Array.isArray(content.sections) && Array.isArray(content.faq) ? content : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string; artigo: string } }): Promise<Metadata> {
  const brief = await getArticle(params.slug, params.artigo);
  const content = parseContent(brief?.contentJson || null);
  if (!brief || !content) return { title: "Artigo não encontrado", robots: { index: false, follow: false } };
  const canonical = `${getCommerceSiteUrl()}/lojas/${params.slug}/artigos/${brief.slug}`;
  return {
    title: brief.title,
    description: brief.metaDescription || content.metaDescription,
    keywords: [brief.primaryKeyword, ...(content.secondaryKeywords || [])],
    alternates: { canonical },
    openGraph: { type: "article", title: brief.title, description: brief.metaDescription || content.metaDescription, url: canonical, publishedTime: brief.publishedAt?.toISOString() },
  };
}

export default async function CommerceEditorialArticlePage({ params }: { params: { slug: string; artigo: string } }) {
  const brief = await getArticle(params.slug, params.artigo);
  const content = parseContent(brief?.contentJson || null);
  if (!brief || !content || !brief.product.affiliateStore) notFound();
  const store = brief.product.affiliateStore;
  const canonical = `${getCommerceSiteUrl()}/lojas/${store.slug}/artigos/${brief.slug}`;
  const outbound = `/go/loja/${store.slug}?source=ai_editorial&medium=content&campaign=${encodeURIComponent(brief.slug)}&destination=${encodeURIComponent(brief.product.productUrl || "")}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: brief.title,
        description: brief.metaDescription || content.metaDescription,
        mainEntityOfPage: canonical,
        datePublished: brief.publishedAt?.toISOString(),
        dateModified: brief.updatedAt.toISOString(),
        inLanguage: "pt-BR",
        author: { "@type": "Organization", name: "Compra Esperta" },
        publisher: { "@type": "Organization", name: "Compra Esperta" },
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#07110f] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/ofertas" className="flex items-center gap-3 font-black"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><ShoppingBag className="h-5 w-5" /></span>Compra Esperta</Link>
          <Link href={`/lojas/${store.slug}`} className="text-sm font-bold text-emerald-200">{store.name}</Link>
        </div>
      </header>

      <article>
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(52,211,153,0.16),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(251,191,36,0.10),transparent_30%)]">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
            <Link href={`/lojas/${store.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar para {store.name}</Link>
            <div className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">{content.eyebrow || store.category}</div>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl">{brief.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{content.metaDescription}</p>
            <div className="mt-7 max-w-3xl"><CommercialDisclosure /></div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-5 py-12">
          <p className="max-w-4xl text-xl font-medium leading-9 text-slate-200">{content.intro}</p>
          {content.specs?.length ? (
            <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <h2 className="text-xl font-black text-white">Informações encontradas</h2>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                {content.specs.map((spec) => <div key={`${spec.label}-${spec.value}`} className="rounded-2xl border border-white/10 bg-black/15 p-4"><dt className="text-xs font-bold uppercase tracking-wider text-emerald-200">{spec.label}</dt><dd className="mt-2 text-sm leading-6 text-slate-200">{spec.value}</dd></div>)}
              </dl>
            </section>
          ) : null}

          <div className="mt-12 space-y-14">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{section.title}</h2>
                <div className="mt-5 space-y-4">{section.paragraphs.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-slate-300">{paragraph}</p>)}</div>
                {section.bullets?.length ? <ul className="mt-6 grid gap-3 sm:grid-cols-2">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-300 text-slate-950"><Check className="h-3 w-3" /></span>{bullet}</li>)}</ul> : null}
              </section>
            ))}
          </div>

          <aside className="mt-14 rounded-[30px] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 to-amber-300/5 p-7 sm:p-9">
            <h2 className="text-2xl font-black text-white">Confira as informações atuais na {store.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Preço, estoque, frete, versões e condições podem mudar. Confirme os dados na página da loja antes de decidir.</p>
            <a href={outbound} rel="sponsored" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 hover:bg-emerald-200">Ver produto na loja <ExternalLink className="h-4 w-4" /></a>
          </aside>

          <section className="mt-14">
            <h2 className="text-2xl font-black text-white">Perguntas frequentes</h2>
            <div className="mt-5 space-y-3">
              {content.faq.map((item) => <details key={item.question} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><summary className="cursor-pointer list-none font-bold text-white">{item.question}</summary><p className="mt-3 text-sm leading-6 text-slate-400">{item.answer}</p></details>)}
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
