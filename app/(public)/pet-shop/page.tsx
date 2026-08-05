import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PetContentArticle } from "@/components/pet-seo/PetContentArticle";
import { getPublishedPetPage } from "@/lib/pet-seo/publicPage";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPetPage("pet-shop");
  if (!page) return { title: "Guias locais de produtos pet", robots: { index: false, follow: false } };
  const canonical = `${getCommerceSiteUrl()}/pet-shop`;
  return { title: page.seoTitle || page.title, description: page.metaDescription, alternates: { canonical } };
}

export default async function PetShopHubPage() {
  const page = await getPublishedPetPage("pet-shop");
  if (!page) notFound();
  return <main className="min-h-screen bg-[#f8faf7] text-slate-900"><header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><Link href="/" className="font-black text-emerald-700">Compra Esperta</Link><Link href="/pets" className="text-sm font-bold">Guias pet</Link></div></header><div className="mx-auto max-w-4xl px-5 py-10 sm:py-16"><nav aria-label="Breadcrumb" className="text-sm text-slate-500"><Link href="/">Início</Link> <span aria-hidden>›</span> <span>Pet shops</span></nav><div className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Guias locais independentes</div><h1 className="mt-3 font-serif text-4xl font-black tracking-tight sm:text-6xl">{page.title}</h1><PetContentArticle article={page.article} path={page.path} relatedLinks={page.related} /></div></main>;
}
