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
  ["from-[#ff7ab6]/40 via-[#ffb86b]/15", "bg-[#ff6aa8]", "hover:bg-[#ff5c9f]"],
  ["from-[#ffb86b]/40 via-[#ffd36e]/15", "bg-[#ffb057]", "hover:bg-[#ffa647]"],
  ["from-[#ffd36e]/40 via-[#ff94c2]/15", "bg-[#ffd05e]", "hover:bg-[#ffc84a]"],
  ["from-[#ff94c2]/40 via-[#ffc27a]/15", "bg-[#ff8abf]", "hover:bg-[#ff79b5]"],
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

function truncateText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
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
    <main className="min-h-screen bg-[#fff8fb] text-[#351a27]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,121,181,0.2),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,176,87,0.22),transparent_30%),linear-gradient(180deg,#fff8fb_0%,#fffdf8_56%,#fff5ee_100%)]" />

      <header className="relative border-b border-[#f3d7e4] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <Link href="/ofertas" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[18px] bg-[linear-gradient(135deg,#ff4f95_0%,#ff8d56_52%,#ffd15c_100%)] text-white shadow-[0_14px_32px_rgba(255,105,156,0.32)]">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-[#ff4f95]">Compra Esperta</span>
              <span className="block text-lg font-black tracking-tight text-[#2d1830]">Promocoes</span>
            </span>
          </Link>
          <Link href="#lojas-parceiras" className="hidden rounded-full border border-[#f2d0dd] bg-white px-4 py-2 text-xs font-bold text-[#8d3a63] shadow-sm sm:inline-flex">
            Ver lojas
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-8 sm:pt-8">
        <div className="rounded-[32px] border border-[#f3d7e4] bg-white/90 p-4 shadow-[0_20px_60px_rgba(255,112,164,0.12)] sm:p-5">
          <div className="mb-3 inline-flex items-center rounded-full bg-[#fff0f6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff4f95]">
            Vitrine da bio
          </div>
          <form action="/ofertas" method="GET">
            {category ? <input type="hidden" name="categoria" value={category} /> : null}
            <label className="flex items-center gap-3 rounded-[22px] border border-[#f4dce6] bg-[#fff9fc] px-4 shadow-inner">
              <Search className="h-5 w-5 shrink-0 text-[#ff4f95]" />
              <input
                name="q"
                defaultValue={q}
                placeholder="digite o produto e clique em buscar"
                inputMode="search"
                className="w-full bg-transparent py-4 text-sm text-[#351a27] outline-none placeholder:text-[#b8899e]"
              />
            </label>
            <button className="mt-3 w-full rounded-[22px] bg-[linear-gradient(135deg,#ff4f95_0%,#ff8b59_55%,#ffc95c_100%)] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_32px_rgba(255,105,156,0.24)] transition hover:brightness-[1.03]">
              Buscar
            </button>
          </form>
          <div className="mt-3 text-[11px] font-medium text-[#9f6e83]">
            {hasFilters ? `${filteredProductsCount} resultado(s) encontrado(s).` : `${totalProducts} produtos publicados para busca rapida.`}
          </div>
        </div>

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
            <div className="text-xs text-[#9f6e83]">
              {category ? `Categoria ativa: ${categories.find((item) => item.slug === category)?.name || category}` : "Busca por nome do produto"}
            </div>
            <Link href="/ofertas" className="text-xs font-bold text-[#ff4f95]">
              Limpar filtros
            </Link>
          </div>
        ) : null}
      </section>

      <section id="achados-shopee" className="relative">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-8 sm:py-4">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff4f95]">Achados recentes</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#2d1830] sm:text-3xl">Selecao da Shopee</h1>
              <p className="mt-1 text-sm text-[#8b6074]">Entre, encontre e clique rapido no produto certo.</p>
            </div>
            <div className="rounded-full border border-[#f2d0dd] bg-white px-3 py-1.5 text-[11px] font-black text-[#8d3a63] shadow-sm">
              {showingCount}/{filteredProductsCount}
            </div>
          </div>

          {products.length ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#f3d7e4] bg-white p-2.5 shadow-[0_16px_35px_rgba(255,112,164,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(255,112,164,0.14)]"
                  >
                    {product.imageUrl ? (
                      <BioProductLink slug={product.slug} href={product.affiliateUrl} className="block overflow-hidden rounded-2xl bg-[#fff6f9]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="aspect-square w-full object-cover transition duration-300 hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </BioProductLink>
                    ) : (
                      <div className="grid aspect-square place-items-center rounded-2xl bg-[linear-gradient(180deg,#fff4f8_0%,#fff9ee_100%)]">
                        <ShoppingBag className="h-7 w-7 text-[#d8a3bb]" />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff4f95]">
                        {product.category?.name || "Achado Shopee"}
                      </div>
                      <h2 className="mt-1.5 line-clamp-2 min-h-[40px] text-[13px] font-black leading-5 text-[#2d1830] sm:text-sm">
                        {product.title}
                      </h2>
                      <p className="mt-1 hidden min-h-[32px] text-[11px] leading-4 text-[#8b6074] sm:block">
                        {truncateText(product.description || "", 120)}
                      </p>
                      <div className="mt-auto pt-3">
                        <div className="grid grid-cols-[auto_1fr] gap-2">
                        <Link
                          href={`/bio/${product.slug}`}
                          className="rounded-xl border border-[#f1d2df] px-2.5 py-2 text-center text-[11px] font-bold text-[#8d3a63] transition hover:bg-[#fff4f8] sm:px-3"
                        >
                          Detalhes
                        </Link>
                        <BioProductLink
                          slug={product.slug}
                          href={product.affiliateUrl}
                          className="rounded-xl bg-[linear-gradient(135deg,#ff4f95_0%,#ff8b59_55%,#ffc95c_100%)] px-2.5 py-2 text-center text-[11px] font-black text-white shadow-[0_10px_24px_rgba(255,105,156,0.24)] transition hover:brightness-[1.03] sm:px-3"
                        >
                          Ver na Shopee
                        </BioProductLink>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {canShowMore ? (
                  <Link
                    href={offersUrl({ q, category, view: "all" })}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#8d3a63] shadow-sm transition hover:bg-[#fff4f8]"
                  >
                    Ver todos os produtos
                  </Link>
                ) : null}
                {showAll && filteredProductsCount > 24 ? (
                  <Link
                    href={offersUrl({ q, category })}
                    className="rounded-2xl border border-[#f1d2df] bg-white px-5 py-3 text-sm font-bold text-[#8d3a63] transition hover:bg-[#fff8fb]"
                  >
                    Mostrar menos
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-[#f3d7e4] bg-white p-8 text-center text-sm text-[#8b6074] shadow-sm">
              Nenhum produto encontrado. Tente outro nome ou escolha outra categoria.
            </div>
          )}
        </div>
      </section>

      <section id="lojas-parceiras" className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff8b59]">Lojas parceiras</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#2d1830] sm:text-3xl">Explore por loja</h2>
          </div>
          <Link href="/lojas" className="text-sm font-bold text-[#ff4f95]">
            Ver todas
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store, index) => {
            const [glow, color, hover] = storeThemes[index % storeThemes.length];
            return (
              <article
                key={store.id}
                className="group relative isolate overflow-hidden rounded-[28px] border border-[#f3d7e4] bg-white p-5 shadow-[0_18px_42px_rgba(255,112,164,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(255,112,164,0.12)]"
              >
                <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${glow} to-transparent`} />
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl text-base font-black text-white shadow-lg ${color}`}>
                    {initials(store.name)}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f2d0dd] bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8d3a63]">
                    <BadgeCheck className="h-3.5 w-3.5 text-[#ff4f95]" />
                    Link conferido
                  </span>
                </div>
                <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b76f8b]">{store.category}</div>
                <h3 className="mt-2 text-xl font-black tracking-tight text-[#2d1830]">{store.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#8b6074]">{store.defaultCopy}</p>
                <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                  <Link
                    href={`/lojas/${store.slug}`}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-white transition ${color} ${hover}`}
                  >
                    Conhecer a loja
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                  <a
                    href={`/go/loja/${store.slug}?source=bio&medium=store_card&campaign=compra_esperta_promocoes`}
                    rel="sponsored"
                    aria-label={`Ir diretamente para ${store.name}`}
                    className="grid w-12 place-items-center rounded-2xl border border-[#f1d2df] bg-white text-[#8d3a63] hover:bg-[#fff4f8]"
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
          ? "border-transparent bg-[linear-gradient(135deg,#ff4f95_0%,#ff8b59_55%,#ffc95c_100%)] text-white shadow-[0_10px_20px_rgba(255,105,156,0.2)]"
          : "border-[#f1d2df] bg-white text-[#8d3a63] hover:bg-[#fff4f8]"
      }`}
    >
      {children}
    </Link>
  );
}
