import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Search, ShoppingBag, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import BioProductLink from "../bio/BioProductLink";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compra Esperta Promocoes | Produtos e ofertas",
  description: "Encontre produtos da Shopee com busca rapida, categorias e acesso direto para compra.",
  alternates: { canonical: getCommerceSiteUrl() },
  openGraph: {
    title: "Compra Esperta Promocoes | Produtos e ofertas",
    description: "Encontre produtos da Shopee com busca rapida, categorias e acesso direto para compra.",
    url: getCommerceSiteUrl(),
    type: "website",
  },
};

const storeThemes = [
  ["from-amber-300/25 via-orange-400/5", "bg-amber-300", "hover:bg-amber-200"],
  ["from-emerald-300/25 via-teal-400/5", "bg-emerald-300", "hover:bg-emerald-200"],
  ["from-sky-300/25 via-blue-400/5", "bg-sky-300", "hover:bg-sky-200"],
  ["from-fuchsia-300/20 via-violet-400/5", "bg-fuchsia-300", "hover:bg-fuchsia-200"],
] as const;

function text(value: unknown) {
  return String(value || "").trim();
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function offersUrl(params: { q?: string; category?: string; view?: string }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("categoria", params.category);
  if (params.view) query.set("view", params.view);
  const suffix = query.toString();
  return suffix ? `/ofertas?${suffix}` : "/ofertas";
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const q = text(searchParams?.q).slice(0, 80);
  const category = text(searchParams?.categoria).slice(0, 80);
  const view = text(searchParams?.view).toLowerCase();
  const showAll = view === "all";
  const takeProducts = showAll ? 120 : 24;

  const productWhere = {
    active: true,
    ...(category
      ? {
          category: {
            slug: category,
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [categories, products, filteredProductsCount, totalProducts, stores] = await Promise.all([
    prisma.bioCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    prisma.bioProduct.findMany({
      where: productWhere,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: takeProducts,
      include: { category: true },
    }),
    prisma.bioProduct.count({ where: productWhere }),
    prisma.bioProduct.count({ where: { active: true } }),
    prisma.affiliateStore.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      take: 6,
    }),
  ]);

  const hasFilters = Boolean(q || category);
  const showingCount = products.length;
  const canShowMore = filteredProductsCount > showingCount;

  return (
    <main className="min-h-screen bg-[#07110f] text-slate-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_18%_8%,rgba(52,211,153,0.16),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(251,191,36,0.14),transparent_31%)]" />

      <header className="relative border-b border-white/10 bg-[#07110f]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <Link href="/ofertas" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70">Compra Esperta</span>
              <span className="block text-lg font-black tracking-tight text-white">Promocoes</span>
            </span>
          </Link>
          <Link href="#lojas-parceiras" className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-200 sm:inline-flex">
            Ver lojas
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-8 sm:pt-8">
        <form action="/ofertas" method="GET" className="rounded-[28px] border border-white/10 bg-[#0b1714]/95 p-4 shadow-2xl shadow-black/20">
          {category ? <input type="hidden" name="categoria" value={category} /> : null}
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4">
            <Search className="h-5 w-5 shrink-0 text-emerald-200" />
            <input
              name="q"
              defaultValue={q}
              placeholder="digite o produto e clique em buscar"
              inputMode="search"
              className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
          <button className="mt-3 w-full rounded-2xl bg-orange-300 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-orange-200">
            Buscar
          </button>
          <div className="mt-3 text-[11px] font-medium text-slate-400">
            {hasFilters ? `${filteredProductsCount} resultado(s) encontrado(s).` : `${totalProducts} produtos publicados para busca rapida.`}
          </div>
        </form>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <CategoryChip active={!category} href={offersUrl({ q, view: showAll ? "all" : undefined })}>
            Todos
          </CategoryChip>
          {categories.map((item) => (
            <CategoryChip
              key={item.id}
              active={category === item.slug}
              href={offersUrl({ q, category: item.slug, view: showAll ? "all" : undefined })}
            >
              {item.name}
            </CategoryChip>
          ))}
        </div>

        {hasFilters ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {category ? `Categoria ativa: ${categories.find((item) => item.slug === category)?.name || category}` : "Busca por nome do produto"}
            </div>
            <Link href="/ofertas" className="text-xs font-bold text-emerald-200">
              Limpar filtros
            </Link>
          </div>
        ) : null}
      </section>

      <section id="achados-shopee" className="relative border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">Produtos em destaque</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Selecao da Shopee</h1>
            </div>
            <div className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-[11px] font-black text-orange-200">
              {showingCount}/{filteredProductsCount}
            </div>
          </div>

          {products.length ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => (
                  <article key={product.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0c1916] p-2.5 transition hover:border-white/20">
                    {product.imageUrl ? (
                      <BioProductLink slug={product.slug} href={product.affiliateUrl} className="block overflow-hidden rounded-2xl bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="aspect-square w-full object-cover transition duration-300 hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </BioProductLink>
                    ) : (
                      <div className="grid aspect-square place-items-center rounded-2xl border border-dashed border-orange-300/20 bg-gradient-to-br from-orange-300/15 to-emerald-300/10">
                        <ShoppingBag className="h-7 w-7 text-white/35" />
                      </div>
                    )}

                    <div className="px-1 pb-1 pt-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-200">
                        {product.category?.name || "Achado Shopee"}
                      </div>
                      <h2 className="mt-1.5 line-clamp-2 min-h-[40px] text-[13px] font-black leading-5 text-white sm:text-sm">
                        {product.title}
                      </h2>
                      <p className="mt-1 hidden line-clamp-2 min-h-[32px] text-[11px] leading-4 text-slate-400 sm:block">
                        {product.description}
                      </p>
                      <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                        <Link
                          href={`/bio/${product.slug}`}
                          className="rounded-xl border border-white/10 px-2.5 py-2 text-center text-[11px] font-bold text-slate-200 hover:bg-white/5 sm:px-3"
                        >
                          Detalhes
                        </Link>
                        <BioProductLink
                          slug={product.slug}
                          href={product.affiliateUrl}
                          className="rounded-xl bg-orange-300 px-2.5 py-2 text-center text-[11px] font-black text-slate-950 transition hover:bg-orange-200 sm:px-3"
                        >
                          Ver na Shopee
                        </BioProductLink>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {canShowMore ? (
                  <Link
                    href={offersUrl({ q, category, view: "all" })}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-100"
                  >
                    Ver todos os produtos
                  </Link>
                ) : null}
                {showAll && filteredProductsCount > 24 ? (
                  <Link
                    href={offersUrl({ q, category })}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.07]"
                  >
                    Mostrar menos
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-slate-400">
              Nenhum produto encontrado. Tente outro nome ou escolha outra categoria.
            </div>
          )}
        </div>
      </section>

      <section id="lojas-parceiras" className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Lojas parceiras</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Explore por loja</h2>
          </div>
          <Link href="/lojas" className="text-sm font-bold text-emerald-200">
            Ver todas
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store, index) => {
            const [glow, color, hover] = storeThemes[index % storeThemes.length];
            return (
              <article
                key={store.id}
                className="group relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1916] p-5 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${glow} to-transparent`} />
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl text-base font-black text-slate-950 shadow-lg ${color}`}>
                    {initials(store.name)}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                    Link conferido
                  </span>
                </div>
                <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{store.category}</div>
                <h3 className="mt-2 text-xl font-black tracking-tight text-white">{store.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{store.defaultCopy}</p>
                <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                  <Link
                    href={`/lojas/${store.slug}`}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-slate-950 transition ${color} ${hover}`}
                  >
                    Conhecer a loja
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                  <a
                    href={`/go/loja/${store.slug}?source=bio&medium=store_card&campaign=compra_esperta_promocoes`}
                    rel="sponsored"
                    aria-label={`Ir diretamente para ${store.name}`}
                    className="grid w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/10"
                  >
                    <Store className="h-4 w-4" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function CategoryChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
        active
          ? "border-orange-300 bg-orange-300 text-slate-950"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20"
      }`}
    >
      {children}
    </Link>
  );
}
