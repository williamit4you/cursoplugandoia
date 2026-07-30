import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, ShoppingBag, Store } from "lucide-react";
import { notFound } from "next/navigation";
import CommercialDisclosure from "@/components/commerce/CommercialDisclosure";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

async function getStore(slug: string) {
  return prisma.affiliateStore.findFirst({ where: { slug, status: "ACTIVE" } });
}

function descriptionFor(store: { name: string; category: string; defaultCopy: string }) {
  return `Conheça a ${store.name}, veja informações sobre ${store.category.toLowerCase()} e acesse conteúdos específicos publicados pela Compra Esperta. ${store.defaultCopy}`.slice(0, 300);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = await getStore(params.slug);
  if (!store) return { title: "Loja não encontrada", robots: { index: false, follow: false } };
  const description = descriptionFor(store);
  const canonical = `${getCommerceSiteUrl()}/lojas/${store.slug}`;
  return {
    title: `${store.name}: conheça a loja | Compra Esperta`,
    description,
    alternates: { canonical },
    openGraph: { title: `${store.name} no Compra Esperta`, description, type: "website", url: canonical },
  };
}

export default async function StoreHubPage({ params }: { params: { slug: string } }) {
  const store = await getStore(params.slug);
  if (!store) notFound();
  const editorialArticles = await prisma.seoBrief.findMany({
    where: { status: "PUBLISHED", indexable: true, contentJson: { not: null }, product: { affiliateStoreId: store.id } },
    select: { slug: true, title: true, metaDescription: true, primaryKeyword: true },
    orderBy: { publishedAt: "desc" },
    take: 24,
  });
  const siteUrl = getCommerceSiteUrl();
  const description = descriptionFor(store);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${store.name}: perfil e conteúdos`,
    description,
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
          <div className="mt-8 max-w-3xl"><CommercialDisclosure /></div>
          <a href={`/go/loja/${store.slug}?source=store_profile&medium=content&campaign=compra_esperta`} rel="sponsored" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 hover:bg-emerald-200">
            Acessar {store.name} <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200"><Store className="h-4 w-4" /> Perfil da loja</div>
        <h2 className="mt-3 text-3xl font-black text-white">Informações antes de acessar</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="text-xs font-bold text-slate-500">Categoria</div><div className="mt-2 font-black text-white">{store.category}</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="text-xs font-bold text-slate-500">Domínio informado</div><div className="mt-2 break-all font-black text-white">{store.domain}</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"><div className="text-xs font-bold text-slate-500">Última conferência</div><div className="mt-2 font-black text-white">{store.verifiedAt ? store.verifiedAt.toLocaleDateString("pt-BR") : "Ainda não registrada"}</div></div>
        </div>

        {!editorialArticles.length ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-7 text-sm leading-6 text-slate-400">
            Ainda não há uma análise específica de produto publicada para esta loja. Conteúdos genéricos foram retirados.
          </div>
        ) : null}

        {editorialArticles.length ? (
          <div className="mt-16">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Publicações editoriais</div>
            <h2 className="mt-3 text-3xl font-black text-white">Análises criadas a partir de produtos encontrados</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {editorialArticles.map((article) => (
                <Link key={article.slug} href={`/lojas/${store.slug}/artigos/${article.slug}`} className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-emerald-300/30">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">{article.primaryKeyword}</div>
                  <h3 className="mt-3 text-xl font-black leading-7 text-white">{article.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{article.metaDescription}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-slate-200">Ler artigo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
