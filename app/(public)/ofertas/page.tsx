import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  HeartHandshake,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import BioProductLink from "../bio/BioProductLink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compra Esperta Promoções | Lojas e ofertas selecionadas",
  description: "Lojas parceiras e achados selecionados em uma vitrine simples, segura e organizada.",
};

const themes = [
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

function filterUrl(q: string, category?: string) {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (category) query.set("categoria", category);
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

  const storeWhere = {
    status: "ACTIVE",
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
            { defaultCopy: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [stores, categories, products, totalStores, totalProducts] = await Promise.all([
    prisma.affiliateStore.findMany({
      where: storeWhere,
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      take: 80,
    }),
    prisma.affiliateStore.findMany({
      where: { status: "ACTIVE" },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
    prisma.bioProduct.findMany({
      where: {
        active: true,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      include: { category: true },
    }),
    prisma.affiliateStore.count({ where: { status: "ACTIVE" } }),
    prisma.bioProduct.count({ where: { active: true } }),
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#07110f] text-slate-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_18%_8%,rgba(52,211,153,0.16),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(251,191,36,0.14),transparent_31%)]" />

      <header className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/ofertas" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70">Compra Esperta</span>
              <span className="block text-lg font-black tracking-tight">Promoções</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Links organizados e transparentes
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pt-20">
        <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Sua vitrine de oportunidades
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.03] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Boas compras começam com{" "}
              <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
                escolhas melhores.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Lojas parceiras, achados da Shopee e caminhos diretos para você comparar com calma — tudo organizado em um só lugar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<Store className="h-5 w-5 text-amber-200" />} value={totalStores} label="lojas parceiras" />
            <Stat icon={<Tag className="h-5 w-5 text-emerald-200" />} value={totalProducts} label="achados publicados" />
          </div>
        </div>

        <form action="/ofertas" method="GET" className="mt-10 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-black/20 px-4">
            <Search className="h-5 w-5 shrink-0 text-slate-500" />
            <input name="q" defaultValue={q} placeholder="Busque uma loja, categoria ou produto" className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-500" />
          </label>
          {category ? <input type="hidden" name="categoria" value={category} /> : null}
          <button className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-emerald-100">Encontrar agora</button>
        </form>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <CategoryChip active={!category} href={filterUrl(q)}>Todas</CategoryChip>
          {categories.map((item) => (
            <CategoryChip key={item.category} active={category === item.category} href={filterUrl(q, item.category)}>
              {item.category}
            </CategoryChip>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Escolha por loja</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Lojas que valem conhecer</h2>
          <p className="mt-2 text-sm text-slate-400">Cards claros, chamadas responsáveis e acesso direto à loja parceira.</p>
        </div>

        {stores.length ? (
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stores.map((store, index) => {
              const [glow, color, hover] = themes[index % themes.length];
              return (
                <article key={store.id} className="group relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1916] p-6 shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl">
                  <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${glow} to-transparent`} />
                  <div className="flex items-start justify-between gap-4">
                    <div className={`grid h-14 w-14 place-items-center rounded-2xl text-base font-black text-slate-950 shadow-lg ${color}`}>{initials(store.name)}</div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />
                      Loja parceira
                    </span>
                  </div>
                  <div className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{store.category}</div>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{store.name}</h3>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-300">{store.defaultCopy}</p>
                  <a href={`/go/loja/${store.slug}?source=bio&medium=store_card&campaign=compra_esperta_promocoes`} rel="sponsored" className={`mt-6 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-black text-slate-950 transition ${color} ${hover}`}>
                    Ver destaques da loja
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </a>
                </article>
              );
            })}
          </div>
        ) : <EmptySearch />}
      </section>

      <section id="achados-shopee" className="relative border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Achados recentes</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Seleção da Shopee</h2>
              <p className="mt-2 text-sm text-slate-400">Produtos que já passaram pelo fluxo atual de coleta e publicação.</p>
            </div>
            <div className="hidden rounded-full border border-orange-300/20 bg-orange-300/10 px-4 py-2 text-xs font-black text-orange-200 sm:block">Shopee</div>
          </div>

          {products.length ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article key={product.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0c1916] p-3 transition hover:-translate-y-1 hover:border-white/20">
                  {product.imageUrl ? (
                    <BioProductLink slug={product.slug} href={product.affiliateUrl} className="block w-full overflow-hidden rounded-2xl bg-white/5 text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.imageUrl} alt={product.title} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.04]" loading="lazy" />
                    </BioProductLink>
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-gradient-to-br from-orange-300/15 to-emerald-300/10"><ShoppingBag className="h-8 w-8 text-white/40" /></div>
                  )}
                  <div className="px-2 pb-2 pt-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-200">{product.category?.name || "Achado Shopee"}</div>
                    <h3 className="mt-2 line-clamp-2 min-h-[48px] text-base font-black leading-6 text-white">{product.title}</h3>
                    <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-400">{product.description}</p>
                    <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
                      <Link href={`/bio/${product.slug}`} className="rounded-xl border border-white/10 px-3 py-3 text-center text-xs font-bold text-slate-200 hover:bg-white/5">Detalhes</Link>
                      <BioProductLink slug={product.slug} href={product.affiliateUrl} className="rounded-xl bg-orange-300 px-3 py-3 text-center text-xs font-black text-slate-950 transition hover:bg-orange-200">Ver na Shopee</BioProductLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-slate-400">
              {q ? "Nenhum produto da Shopee corresponde à sua busca." : "Os próximos achados aparecerão aqui automaticamente."}
            </div>
          )}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <TrustItem icon={<ShieldCheck />} title="Compra consciente">Confira preço, frete, disponibilidade e regras diretamente na loja antes de finalizar.</TrustItem>
          <TrustItem icon={<HeartHandshake />} title="Transparência">Alguns links são de afiliado e podem gerar comissão, sem custo adicional para você.</TrustItem>
          <TrustItem icon={<Sparkles />} title="Seleção em evolução">A vitrine recebe novas lojas e produtos conforme eles entram no nosso fluxo editorial.</TrustItem>
        </div>
        <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} Compra Esperta Promoções</div>
          <div>#compraespertapromocoes</div>
        </footer>
      </section>
    </main>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur">{icon}<div className="mt-5 text-3xl font-black text-white">{value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</div></div>;
}

function CategoryChip({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return <Link href={href} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${active ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20"}`}>{children}</Link>;
}

function EmptySearch() {
  return <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-white/[0.035] p-10 text-center"><Search className="mx-auto h-7 w-7 text-slate-500" /><h3 className="mt-4 font-black text-white">Nenhuma loja encontrada</h3><p className="mt-2 text-sm text-slate-400">Tente outro nome ou remova o filtro de categoria.</p><Link href="/ofertas" className="mt-5 inline-block text-sm font-bold text-emerald-200">Limpar filtros</Link></div>;
}

function TrustItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="h-5 w-5 text-emerald-200 [&>svg]:h-5 [&>svg]:w-5">{icon}</div><div className="mt-4 text-sm font-black text-white">{title}</div><p className="mt-2 text-xs leading-5 text-slate-400">{children}</p></div>;
}
