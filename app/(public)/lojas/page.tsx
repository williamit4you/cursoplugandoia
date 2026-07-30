import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, ShoppingBag, Sparkles, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lojas e categorias | Compra Esperta Promocoes",
  description: "Consulte lojas por categoria e acesse perfis e conteudos especificos publicados pela Compra Esperta.",
  alternates: { canonical: `${getCommerceSiteUrl()}/lojas` },
};

function value(input: unknown) {
  return String(input || "").trim().slice(0, 80);
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase();
}

const ACCENTS = [
  "bg-[#ffdba6] text-[#7d4d00]",
  "bg-[#d7f5e6] text-[#0f6a44]",
  "bg-[#dcecff] text-[#1f4c8c]",
  "bg-[#ffe0e7] text-[#8f2942]",
];

export default async function StoresPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const q = value(searchParams?.q);
  const category = value(searchParams?.categoria);
  const [stores, categories] = await Promise.all([
    prisma.affiliateStore.findMany({
      where: {
        status: "ACTIVE",
        ...(category ? { category } : {}),
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }
          : {}),
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
    <main className="min-h-screen bg-[#f7f2ea] text-slate-900">
      <header className="border-b border-[#e9dcc8] bg-[#fffaf3]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/ofertas" className="flex items-center gap-3 font-black text-slate-950">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1f9d68] text-white shadow-[0_10px_30px_rgba(31,157,104,0.25)]">
              <ShoppingBag className="h-5 w-5" />
            </span>
            Compra Esperta
          </Link>
          <Link href="/ofertas" className="text-sm font-bold text-[#1f9d68]">Ver ofertas</Link>
        </div>
      </header>

      <section className="border-b border-[#eadfcd] bg-[linear-gradient(180deg,#fffaf3_0%,#f5ecde_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#1f9d68]">Diretorio editorial de lojas</div>
              <h1 className="mt-4 max-w-4xl font-serif text-5xl font-black tracking-tight text-slate-950 sm:text-7xl">
                Lojas, nichos e artigos com cara de guia de compra.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
                Uma vitrine mais confiavel e organizada para navegar por loja, descobrir analises publicadas e chegar ao produto certo com mais contexto.
              </p>

              <form action="/lojas" className="mt-8 flex max-w-3xl flex-col gap-3 rounded-[30px] border border-[#e3d6c4] bg-white p-3 shadow-[0_18px_45px_rgba(88,66,35,0.08)] sm:flex-row">
                <label className="flex flex-1 items-center gap-3 rounded-[22px] bg-[#f8f2e9] px-4">
                  <Search className="h-5 w-5 text-slate-500" />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Buscar loja ou categoria"
                    className="w-full bg-transparent py-4 text-sm text-slate-900 outline-none"
                  />
                </label>
                <button className="rounded-[22px] bg-[#1f9d68] px-6 py-4 text-sm font-black text-white transition hover:bg-[#188357]">
                  Buscar agora
                </button>
              </form>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                <Link
                  href={q ? `/lojas?q=${encodeURIComponent(q)}` : "/lojas"}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black ${
                    !category ? "border-[#1f9d68] bg-[#1f9d68] text-white" : "border-[#ded1bc] bg-white text-slate-700"
                  }`}
                >
                  Todas
                </Link>
                {categories.map((item) => {
                  const params = new URLSearchParams();
                  if (q) params.set("q", q);
                  params.set("categoria", item.category);
                  return (
                    <Link
                      key={item.category}
                      href={`/lojas?${params}`}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black ${
                        category === item.category ? "border-[#1f9d68] bg-[#1f9d68] text-white" : "border-[#ded1bc] bg-white text-slate-700"
                      }`}
                    >
                      {item.category}
                    </Link>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-[32px] border border-[#e3d6c4] bg-white p-6 shadow-[0_24px_60px_rgba(102,69,34,0.10)]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f9d68]">
                <Sparkles className="h-4 w-4" />
                O que mudou
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-[#fffaf3] p-4">
                  <div className="text-sm font-black text-slate-950">Mais editorial</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Cards mais ricos, titulos mais fortes e uma estrutura mais proxima de paginas de review e comparativo.</p>
                </div>
                <div className="rounded-2xl bg-[#fffaf3] p-4">
                  <div className="text-sm font-black text-slate-950">Mais conversao</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">As paginas agora deixam muito mais claro qual loja abrir e onde continuar a pesquisa.</p>
                </div>
                <div className="rounded-2xl bg-[#fffaf3] p-4">
                  <div className="text-sm font-black text-slate-950">Mais coerencia</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">O visual das listas, lojas e artigos agora conversa melhor entre si.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Store className="h-4 w-4 text-[#1f9d68]" />
          {stores.length} lojas encontradas
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((store, index) => (
            <Link
              key={store.id}
              href={`/lojas/${store.slug}`}
              className="group rounded-[32px] border border-[#e4d8c7] bg-white p-6 shadow-[0_20px_50px_rgba(88,66,35,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(88,66,35,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`grid h-14 w-14 place-items-center rounded-[20px] text-lg font-black ${ACCENTS[index % ACCENTS.length]}`}>
                  {initials(store.name)}
                </div>
                {store.featured ? (
                  <div className="rounded-full bg-[#eef9f3] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1f9d68]">
                    Destaque
                  </div>
                ) : null}
              </div>

              <div className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-[#1f9d68]">{store.category}</div>
              <h2 className="mt-3 text-2xl font-black text-slate-950">{store.name}</h2>
              <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">{store.defaultCopy}</p>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm font-black text-slate-900">Ver perfil da loja</div>
                <div className="rounded-full bg-[#f5ecde] p-2 text-[#1f9d68] transition group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
