import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Globe, ShoppingBag, Sparkles, Store } from "lucide-react";
import { notFound } from "next/navigation";
import CommercialDisclosure from "@/components/commerce/CommercialDisclosure";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

async function getStore(slug: string) {
  return prisma.affiliateStore.findFirst({ where: { slug, status: "ACTIVE" } });
}

function descriptionFor(store: { name: string; category: string; defaultCopy: string }) {
  return `Conheca a ${store.name}, veja informacoes sobre ${store.category.toLowerCase()} e acesse conteudos especificos publicados pela Compra Esperta. ${store.defaultCopy}`.slice(0, 300);
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = await getStore(params.slug);
  if (!store) return { title: "Loja nao encontrada", robots: { index: false, follow: false } };
  const description = descriptionFor(store);
  const canonical = `${getCommerceSiteUrl()}/lojas/${store.slug}`;
  return {
    title: `${store.name}: conheca a loja | Compra Esperta`,
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
    select: { slug: true, title: true, metaDescription: true, primaryKeyword: true, product: { select: { imageUrl: true } } },
    orderBy: { publishedAt: "desc" },
    take: 24,
  });

  const siteUrl = getCommerceSiteUrl();
  const description = descriptionFor(store);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${store.name}: perfil e conteudos`,
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
          <Link href="/lojas" className="text-sm font-bold text-[#1f9d68]">Todas as lojas</Link>
        </div>
      </header>

      <section className="border-b border-[#eadfcd] bg-[linear-gradient(180deg,#fffaf3_0%,#f5ecde_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <Link href="/lojas" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Voltar para lojas
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-white text-2xl font-black text-[#1f9d68] shadow-[0_20px_50px_rgba(88,66,35,0.10)]">
                  {initials(store.name)}
                </div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">{store.category}</div>
              </div>
              <h1 className="mt-5 font-serif text-5xl font-black tracking-tight text-slate-950 sm:text-7xl">{store.name}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">{store.defaultCopy}</p>
              <div className="mt-8 max-w-3xl">
                <CommercialDisclosure tone="light" />
              </div>
              <div className="mt-7 flex flex-wrap gap-4">
                <a href={`/go/loja/${store.slug}?source=store_profile&medium=content&campaign=compra_esperta`} rel="sponsored" className="inline-flex items-center gap-2 rounded-2xl bg-[#1f9d68] px-5 py-4 text-sm font-black text-white transition hover:bg-[#188357]">
                  Acessar {store.name}
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link href="/lojas" className="inline-flex items-center gap-2 rounded-2xl border border-[#ddcfb9] bg-white px-5 py-4 text-sm font-black text-slate-900">
                  Explorar outras lojas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <aside className="rounded-[30px] border border-[#e3d6c4] bg-white p-6 shadow-[0_24px_60px_rgba(102,69,34,0.10)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">Visao geral da loja</div>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-[#fffaf3] p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Categoria</div>
                  <div className="mt-2 text-base font-black text-slate-950">{store.category}</div>
                </div>
                <div className="rounded-2xl bg-[#fffaf3] p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <Globe className="h-4 w-4" />
                    Dominio informado
                  </div>
                  <div className="mt-2 break-all text-sm font-semibold text-slate-800">{store.domain}</div>
                </div>
                <div className="rounded-2xl bg-[#fffaf3] p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Ultima conferencia</div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">
                    {store.verifiedAt ? store.verifiedAt.toLocaleDateString("pt-BR") : "Ainda nao registrada"}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-[#e4d8c7] bg-white p-6 shadow-[0_18px_40px_rgba(88,66,35,0.07)]">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">
              <Sparkles className="h-4 w-4" />
              Curadoria editorial
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">Publicamos apenas paginas que passaram por revisao e mantemos o foco em guias de compra mais especificos.</p>
          </div>
          <div className="rounded-[28px] border border-[#e4d8c7] bg-white p-6 shadow-[0_18px_40px_rgba(88,66,35,0.07)]">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">
              <Store className="h-4 w-4" />
              Loja parceira
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">Os links levam para a loja com rastreamento de afiliacao, mantendo a validacao final de preco e estoque no destino.</p>
          </div>
          <div className="rounded-[28px] border border-[#e4d8c7] bg-white p-6 shadow-[0_18px_40px_rgba(88,66,35,0.07)]">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">
              <Globe className="h-4 w-4" />
              Atualizacao
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">Os artigos destacam informacoes encontradas no produto, mas o fechamento da compra deve sempre ser conferido na pagina oficial da loja.</p>
          </div>
        </div>

        {!editorialArticles.length ? (
          <div className="mt-12 rounded-[32px] border border-[#e4d8c7] bg-white p-8 text-sm leading-7 text-slate-600 shadow-[0_20px_50px_rgba(88,66,35,0.08)]">
            Ainda nao ha uma analise especifica publicada para esta loja. Quando um conteudo for aprovado, ele aparecera aqui com destaque editorial.
          </div>
        ) : (
          <div className="mt-16">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">Publicacoes editoriais</div>
            <h2 className="mt-3 font-serif text-4xl font-black text-slate-950">Guias e analises desta loja</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Uma vitrine com cara mais editorial, inspirada em paginas de review e comparativo, para facilitar a leitura e o clique no produto certo.</p>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {editorialArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/lojas/${store.slug}/artigos/${article.slug}`}
                  className="group overflow-hidden rounded-[32px] border border-[#e4d8c7] bg-white shadow-[0_20px_50px_rgba(88,66,35,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(88,66,35,0.12)]"
                >
                  <div className="relative h-52 bg-[linear-gradient(135deg,#f5ecde_0%,#fffaf3_100%)]">
                    {article.product.imageUrl ? (
                      <img src={article.product.imageUrl} alt={article.title} className="h-full w-full object-contain p-6" />
                    ) : (
                      <div className="grid h-full place-items-center text-center text-sm font-semibold text-slate-500">Imagem do produto indisponivel</div>
                    )}
                    <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1f9d68]">
                      {article.primaryKeyword}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black leading-7 text-slate-950">{article.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.metaDescription}</p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#1f9d68]">
                      Ler artigo
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
