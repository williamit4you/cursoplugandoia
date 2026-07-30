import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, ShoppingBag, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lojas parceiras | Compra Esperta Promoções",
  description: "Explore lojas parceiras por categoria e encontre guias de compra, checklists e conteúdos para decidir melhor.",
  alternates: { canonical: "/lojas" },
};

function value(input: unknown) {
  return String(input || "").trim().slice(0, 80);
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase();
}

export default async function StoresPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const q = value(searchParams?.q);
  const category = value(searchParams?.categoria);
  const [stores, categories] = await Promise.all([
    prisma.affiliateStore.findMany({
      where: {
        status: "ACTIVE",
        ...(category ? { category } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.affiliateStore.findMany({
      where: { status: "ACTIVE" },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#07110f] text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/ofertas" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><ShoppingBag className="h-5 w-5" /></span>
            <span className="font-black">Compra Esperta</span>
          </Link>
          <Link href="/ofertas" className="text-sm font-bold text-emerald-200">Ver ofertas</Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(52,211,153,0.16),transparent_35%)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Diretório editorial</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">Lojas, categorias e decisões mais inteligentes.</h1>
          <p className="mt-5 max-w-2xl leading-7 text-slate-300">Encontre uma loja e acesse guias de compra, critérios de comparação, inspirações e checklists antes de seguir para o site parceiro.</p>

          <form action="/lojas" className="mt-8 flex max-w-3xl gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-3">
            <label className="flex flex-1 items-center gap-3 rounded-2xl bg-black/20 px-4">
              <Search className="h-5 w-5 text-slate-500" />
              <input name="q" defaultValue={q} placeholder="Buscar loja ou categoria" className="w-full bg-transparent py-4 text-sm outline-none" />
            </label>
            <button className="rounded-2xl bg-white px-6 text-sm font-black text-slate-950">Buscar</button>
          </form>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <Link href={q ? `/lojas?q=${encodeURIComponent(q)}` : "/lojas"} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${!category ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-white/10 text-slate-300"}`}>Todas</Link>
            {categories.map((item) => {
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              params.set("categoria", item.category);
              return <Link key={item.category} href={`/lojas?${params}`} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${category === item.category ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-white/10 text-slate-300"}`}>{item.category}</Link>;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400"><Store className="h-4 w-4" /> {stores.length} lojas encontradas</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store, index) => (
            <Link key={store.id} href={`/lojas/${store.slug}`} className="group rounded-[26px] border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.055]">
              <div className="flex items-start justify-between">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl font-black text-slate-950 ${index % 3 === 0 ? "bg-amber-300" : index % 3 === 1 ? "bg-emerald-300" : "bg-sky-300"}`}>{initials(store.name)}</div>
                <ArrowRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-200" />
              </div>
              <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">{store.category}</div>
              <h2 className="mt-2 text-xl font-black text-white">{store.name}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{store.defaultCopy}</p>
              <div className="mt-5 text-xs font-bold text-slate-300">5 guias disponíveis</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
