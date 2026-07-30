import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildStoreHubDescription, STORE_ARTICLE_TOPICS } from "@/lib/affiliateSeoContent";

export const dynamic = "force-dynamic";

async function getStore(slug: string) {
  return prisma.affiliateStore.findFirst({ where: { slug, status: "ACTIVE" } });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = await getStore(params.slug);
  if (!store) return { title: "Loja não encontrada", robots: { index: false, follow: false } };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud";
  const description = buildStoreHubDescription(store);
  return {
    title: `${store.name}: guias, dicas e acesso à loja | Compra Esperta`,
    description,
    alternates: { canonical: `${siteUrl}/lojas/${store.slug}` },
    openGraph: { title: `${store.name} no Compra Esperta`, description, type: "website", url: `${siteUrl}/lojas/${store.slug}` },
  };
}

export default async function StoreHubPage({ params }: { params: { slug: string } }) {
  const store = await getStore(params.slug);
  if (!store) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud";
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${store.name}: guias de compra`,
    description: buildStoreHubDescription(store),
    url: `${siteUrl}/lojas/${store.slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Lojas", item: `${siteUrl}/lojas` },
        { "@type": "ListItem", position: 2, name: store.name, item: `${siteUrl}/lojas/${store.slug}` },
      ],
    },
  };

  return (
    <main className="min-h-screen bg-[#07110f] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/ofertas" className="flex items-center gap-3 font-black"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><ShoppingBag className="h-5 w-5" /></span>Compra Esperta</Link>
          <Link href="/lojas" className="text-sm font-bold text-emerald-200">Todas as lojas</Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(52,211,153,0.12),transparent_30%)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Link href="/lojas" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar para lojas</Link>
          <div className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">{store.category}</div>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-white sm:text-7xl">{store.name}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{store.defaultCopy}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`/go/loja/${store.slug}?source=seo_store_hub&medium=affiliate&campaign=compra_esperta_promocoes`} rel="sponsored" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 hover:bg-emerald-200">
              Acessar {store.name} <ExternalLink className="h-4 w-4" />
            </a>
            <span className="rounded-2xl border border-white/10 px-5 py-4 text-xs text-slate-400">Link de afiliado • sem custo adicional</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200"><BookOpen className="h-4 w-4" /> Conteúdo de apoio</div>
        <h2 className="mt-3 text-3xl font-black text-white">Cinco leituras para decidir melhor</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Cada página responde a uma intenção diferente: planejar, comparar, encontrar ideias, revisar a compra e acompanhar condições.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {STORE_ARTICLE_TOPICS.map((topic, index) => (
            <Link key={topic.slug} href={`/lojas/${store.slug}/${topic.slug}`} className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-emerald-300/30">
              <div className="text-xs font-black text-emerald-200">0{index + 1}</div>
              <h3 className="mt-4 text-xl font-black text-white">{topic.shortLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{topic.intent}.</p>
              <div className="mt-5 flex items-center gap-2 text-sm font-bold text-slate-200">Ler conteúdo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
