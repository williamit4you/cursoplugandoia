import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PetContentArticle } from "@/components/pet-seo/PetContentArticle";
import { getPublishedPetPage } from "@/lib/pet-seo/publicPage";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

function pathFor(slug?: string[]) { return ["pets", ...(slug || [])].join("/"); }

export async function generateMetadata({ params }: { params: { slug?: string[] } }): Promise<Metadata> {
  const page = await getPublishedPetPage(pathFor(params.slug));
  if (!page) return { title: "Conteúdo não encontrado", robots: { index: false, follow: false } };
  const canonical = `${getCommerceSiteUrl()}/${page.path}`;
  return { title: page.seoTitle || page.title, description: page.metaDescription, alternates: { canonical }, openGraph: { title: page.seoTitle || page.title, description: page.metaDescription || undefined, url: canonical, type: "article" } };
}

export default async function PetPage({ params }: { params: { slug?: string[] } }) {
  const page = await getPublishedPetPage(pathFor(params.slug));
  if (!page) notFound();
  const siteUrl = getCommerceSiteUrl();
  const schema = { "@context": "https://schema.org", "@type": page.type === "HUB" || page.type === "CATEGORY" ? "CollectionPage" : "Article", name: page.title, headline: page.title, description: page.metaDescription, url: `${siteUrl}/${page.path}`, datePublished: page.publishedAt?.toISOString(), dateModified: page.updatedAt.toISOString(), breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Pets", item: `${siteUrl}/pets` }, { "@type": "ListItem", position: 3, name: page.title, item: `${siteUrl}/${page.path}` }] } };
  return <main className="min-h-screen bg-[#f8faf7] text-slate-900"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><Link href="/" className="font-black text-emerald-700">Compra Esperta</Link><Link href="/pets" className="text-sm font-bold">Guias pet</Link></div></header><div className="mx-auto max-w-4xl px-5 py-10 sm:py-16"><nav aria-label="Breadcrumb" className="text-sm text-slate-500"><Link href="/">Início</Link> <span aria-hidden>›</span> <Link href="/pets">Pets</Link></nav><div className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{page.article.eyebrow || "Guia Compra Esperta"}</div><h1 className="mt-3 font-serif text-4xl font-black tracking-tight sm:text-6xl">{page.title}</h1><PetContentArticle article={page.article} path={page.path} relatedLinks={page.related} /></div></main>;
}

