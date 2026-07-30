import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, ExternalLink, ShoppingBag, Star } from "lucide-react";
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

function buildQuickFacts(content: EditorialArticle, storeCategory: string) {
  const facts = [
    content.specs?.[0] ? `${content.specs[0].label}: ${content.specs[0].value}` : null,
    content.specs?.[1] ? `${content.specs[1].label}: ${content.specs[1].value}` : null,
    content.secondaryKeywords?.[0] ? `Busca relacionada: ${content.secondaryKeywords[0]}` : null,
    `Categoria: ${content.eyebrow || storeCategory}`,
  ].filter(Boolean) as string[];

  return facts.slice(0, 4);
}

export async function generateMetadata({ params }: { params: { slug: string; artigo: string } }): Promise<Metadata> {
  const brief = await getArticle(params.slug, params.artigo);
  const content = parseContent(brief?.contentJson || null);
  if (!brief || !content) return { title: "Artigo nao encontrado", robots: { index: false, follow: false } };
  const canonical = `${getCommerceSiteUrl()}/lojas/${params.slug}/artigos/${brief.slug}`;
  return {
    title: brief.title,
    description: brief.metaDescription || content.metaDescription,
    keywords: [brief.primaryKeyword, ...(content.secondaryKeywords || [])],
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: brief.title,
      description: brief.metaDescription || content.metaDescription,
      url: canonical,
      publishedTime: brief.publishedAt?.toISOString(),
      images: brief.product.imageUrl ? [{ url: brief.product.imageUrl }] : undefined,
    },
  };
}

export default async function CommerceEditorialArticlePage({ params }: { params: { slug: string; artigo: string } }) {
  const brief = await getArticle(params.slug, params.artigo);
  const content = parseContent(brief?.contentJson || null);
  if (!brief || !content || !brief.product.affiliateStore) notFound();

  const store = brief.product.affiliateStore;
  const canonical = `${getCommerceSiteUrl()}/lojas/${store.slug}/artigos/${brief.slug}`;
  const outbound = `/go/loja/${store.slug}?source=ai_editorial&medium=content&campaign=${encodeURIComponent(brief.slug)}&destination=${encodeURIComponent(brief.product.productUrl || "")}`;
  const quickFacts = buildQuickFacts(content, store.category);
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
        image: brief.product.imageUrl || undefined,
        author: { "@type": "Organization", name: "Compra Esperta" },
        publisher: { "@type": "Organization", name: "Compra Esperta" },
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f2ea] text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

      <header className="border-b border-[#e9dcc8] bg-[#fffaf3]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/ofertas" className="flex items-center gap-3 font-black text-slate-950">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1f9d68] text-white shadow-[0_10px_30px_rgba(31,157,104,0.25)]">
              <ShoppingBag className="h-5 w-5" />
            </span>
            Compra Esperta
          </Link>
          <Link href={`/lojas/${store.slug}`} className="text-sm font-bold text-[#1f9d68]">{store.name}</Link>
        </div>
      </header>

      <article>
        <section className="border-b border-[#eadfcd] bg-[linear-gradient(180deg,#fffaf3_0%,#f8efe2_100%)]">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
            <Link href={`/lojas/${store.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Voltar para {store.name}
            </Link>

            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1f9d68]">
                  <span>{content.eyebrow || store.category}</span>
                  <span className="rounded-full bg-[#efe5d8] px-3 py-1 tracking-[0.08em] text-slate-700">Guia editorial</span>
                </div>
                <h1 className="mt-4 max-w-4xl font-serif text-4xl font-black leading-[1.05] text-slate-950 sm:text-6xl">{brief.title}</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">{content.metaDescription}</p>

                <div className="mt-7 flex flex-wrap gap-3">
                  {quickFacts.map((fact) => (
                    <div key={fact} className="rounded-full border border-[#e5d7c1] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                      {fact}
                    </div>
                  ))}
                </div>

                <div className="mt-8 max-w-3xl">
                  <CommercialDisclosure tone="light" />
                </div>
              </div>

              <aside className="rounded-[30px] border border-[#e3d6c4] bg-white p-5 shadow-[0_24px_60px_rgba(102,69,34,0.10)]">
                {brief.product.imageUrl ? (
                  <div className="overflow-hidden rounded-[24px] bg-[#faf4eb]">
                    <img
                      src={brief.product.imageUrl}
                      alt={brief.product.name || brief.title}
                      className="h-[260px] w-full object-contain p-5"
                    />
                  </div>
                ) : (
                  <div className="grid h-[260px] place-items-center rounded-[24px] bg-[#faf4eb] text-center text-sm font-semibold text-slate-500">
                    Imagem do produto indisponivel
                  </div>
                )}

                <div className="mt-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
                    <Star className="h-4 w-4 fill-current" />
                    Produto destacado nesta analise
                  </div>
                  <h2 className="mt-3 text-xl font-black leading-7 text-slate-950">{brief.product.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Consulte preco, disponibilidade, frete e variacoes direto na loja antes de comprar.
                  </p>
                  <a
                    href={outbound}
                    rel="sponsored"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1f9d68] px-5 py-4 text-sm font-black text-white transition hover:bg-[#188357]"
                  >
                    Ver produto com oferta
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <div className="mt-3 text-xs leading-5 text-slate-500">O clique usa seu redirecionamento afiliado antes de abrir a pagina da loja.</div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <div className="rounded-[32px] border border-[#e4d8c7] bg-white p-7 shadow-[0_20px_50px_rgba(88,66,35,0.08)] sm:p-10">
                <p className="text-xl font-medium leading-9 text-slate-800">{content.intro}</p>

                {content.specs?.length ? (
                  <section className="mt-10 rounded-[28px] border border-[#eadfcd] bg-[#fffaf3] p-6 sm:p-8">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#1f9d68]">
                      <Check className="h-4 w-4" />
                      Destaques encontrados
                    </div>
                    <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                      {content.specs.map((spec) => (
                        <div key={`${spec.label}-${spec.value}`} className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{spec.label}</dt>
                          <dd className="mt-2 text-sm leading-6 text-slate-800">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null}

                <div className="mt-12 space-y-14">
                  {content.sections.map((section, index) => (
                    <section key={section.title}>
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3eadf] text-sm font-black text-[#1f9d68]">
                          {index + 1}
                        </div>
                        <h2 className="font-serif text-3xl font-black tracking-tight text-slate-950">{section.title}</h2>
                      </div>
                      <div className="mt-6 space-y-5">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph} className="text-[17px] leading-8 text-slate-700">{paragraph}</p>
                        ))}
                      </div>
                      {section.bullets?.length ? (
                        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-3 rounded-2xl border border-[#e9dcc8] bg-[#fffaf3] p-4 text-sm leading-6 text-slate-700">
                              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1f9d68] text-white">
                                <Check className="h-3 w-3" />
                              </span>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))}
                </div>
              </div>

              <aside className="mt-10 rounded-[32px] border border-[#d8eadf] bg-[linear-gradient(135deg,#eef9f3_0%,#f9f5ec_100%)] p-7 shadow-[0_18px_50px_rgba(37,99,62,0.10)] sm:p-9">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">Oferta monitorada</div>
                <h2 className="mt-3 font-serif text-3xl font-black text-slate-950">Vale a pena conferir direto na {store.name}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700">
                  Como preco e estoque podem mudar rapido, a confirmacao final deve ser feita na pagina da loja. O botao abaixo leva voce para o produto com rastreamento de afiliacao.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href={outbound}
                    rel="sponsored"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1f9d68] px-5 py-4 text-sm font-black text-white transition hover:bg-[#188357]"
                  >
                    Ir para o produto
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link href={`/lojas/${store.slug}`} className="inline-flex items-center gap-2 rounded-2xl border border-[#cfe4d5] bg-white px-5 py-4 text-sm font-black text-slate-800">
                    Ver mais da loja
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>

              <section className="mt-10 rounded-[32px] border border-[#e4d8c7] bg-white p-7 shadow-[0_18px_50px_rgba(88,66,35,0.08)] sm:p-9">
                <h2 className="font-serif text-3xl font-black text-slate-950">Perguntas frequentes</h2>
                <div className="mt-6 space-y-3">
                  {content.faq.map((item) => (
                    <details key={item.question} className="rounded-2xl border border-[#eadfcd] bg-[#fffaf3] p-5">
                      <summary className="cursor-pointer list-none text-base font-black text-slate-900">{item.question}</summary>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[28px] border border-[#e4d8c7] bg-white p-6 shadow-[0_18px_40px_rgba(88,66,35,0.07)]">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">Resumo rapido</div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  {quickFacts.map((fact) => (
                    <li key={fact} className="flex gap-3">
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#1f9d68]" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-[#e4d8c7] bg-white p-6 shadow-[0_18px_40px_rgba(88,66,35,0.07)]">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">Loja parceira</div>
                <div className="mt-3 text-xl font-black text-slate-950">{store.name}</div>
                <div className="mt-2 text-sm text-slate-600">{store.category}</div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{store.defaultCopy}</p>
                <a href={`/go/loja/${store.slug}?source=article_sidebar&medium=content&campaign=${encodeURIComponent(brief.slug)}`} rel="sponsored" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#1f9d68]">
                  Abrir loja parceira
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}
