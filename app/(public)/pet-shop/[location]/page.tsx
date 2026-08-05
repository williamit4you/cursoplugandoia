import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PetContentArticle } from "@/components/pet-seo/PetContentArticle";
import { getPublishedPetPage } from "@/lib/pet-seo/publicPage";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { location: string } }): Promise<Metadata> {
  const page = await getPublishedPetPage(`pet-shop/${params.location}`);
  if (!page) return { title: "Guia local não encontrado", robots: { index: false, follow: false } };
  const canonical = `${getCommerceSiteUrl()}/${page.path}`;
  return { title: page.seoTitle || page.title, description: page.metaDescription, alternates: { canonical }, openGraph: { title: page.seoTitle || page.title, description: page.metaDescription || undefined, url: canonical, type: "article" } };
}

export default async function LocalPetPage({ params }: { params: { location: string } }) {
  const page = await getPublishedPetPage(`pet-shop/${params.location}`);
  if (!page || !page.location) notFound();
  const siteUrl = getCommerceSiteUrl();
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: page.title, description: page.metaDescription, url: `${siteUrl}/${page.path}`, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Pet shops", item: `${siteUrl}/pet-shop` }, { "@type": "ListItem", position: 3, name: `${page.location.city}/${page.location.state}`, item: `${siteUrl}/${page.path}` }] } };
  return <main className="min-h-screen bg-[#f8faf7] text-slate-900"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><Link href="/" className="font-black text-emerald-700">Compra Esperta</Link><Link href="/pets" className="text-sm font-bold">Guias pet</Link></div></header><div className="mx-auto max-w-4xl px-5 py-10 sm:py-16"><nav aria-label="Breadcrumb" className="text-sm text-slate-500"><Link href="/">Início</Link> <span aria-hidden>›</span> <span>{page.location.city}/{page.location.state}</span></nav><div className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Guia local verificado</div><h1 className="mt-3 font-serif text-4xl font-black tracking-tight sm:text-6xl">{page.title}</h1><PetContentArticle article={page.article} path={page.path} relatedLinks={page.related} localUnits={page.location.units} /></div></main>;
}

