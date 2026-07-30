import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, ShoppingBag } from "lucide-react";
import { PRODUCT_SEO_ARTICLES } from "@/lib/productSeoArticles";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const metadata: Metadata = {
  title: "Guias de produtos: análises para comprar melhor | Compra Esperta",
  description: "Guias de produtos com especificações, indicação de uso, limitações e respostas para dúvidas comuns antes da compra.",
  alternates: { canonical: `${getCommerceSiteUrl()}/produtos` },
};

function clean(value: unknown) {
  return String(value || "").trim().toLocaleLowerCase("pt-BR").slice(0, 80);
}

export default function ProductsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const q = clean(searchParams?.q);
  const products = PRODUCT_SEO_ARTICLES.filter((item) => {
    if (!q) return true;
    return [item.productName, item.brand, item.category, item.primaryKeyword, ...item.secondaryKeywords]
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(q);
  });

  return (
    <main className="min-h-screen bg-[#07110f] text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/ofertas" className="flex items-center gap-3 font-black">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><ShoppingBag className="h-5 w-5" /></span>Compra Esperta
          </Link>
          <Link href="/lojas" className="text-sm font-bold text-emerald-200">Todas as lojas</Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(52,211,153,0.16),transparent_35%)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Pesquisa antes da compra</div>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">Guias de produtos com respostas para dúvidas reais.</h1>
          <p className="mt-5 max-w-2xl leading-7 text-slate-300">Entenda especificações, perfil de uso, pontos fortes e limitações antes de abrir a página da loja.</p>
          <form action="/produtos" className="mt-8 flex max-w-3xl gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-3">
            <label className="flex flex-1 items-center gap-3 rounded-2xl bg-black/20 px-4">
              <Search className="h-5 w-5 text-slate-500" />
              <input name="q" defaultValue={q} placeholder="Buscar produto, marca ou categoria" className="w-full bg-transparent py-4 text-sm outline-none" />
            </label>
            <button className="rounded-2xl bg-white px-6 text-sm font-black text-slate-950">Buscar</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="mb-6 text-sm text-slate-400">{products.length} guias encontrados</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((item, index) => (
            <article key={item.slug} className="group flex min-h-72 flex-col rounded-[28px] border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-emerald-300/30">
              <div className="flex items-start justify-between gap-4">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl text-sm font-black text-slate-950 ${index % 3 === 0 ? "bg-amber-300" : index % 3 === 1 ? "bg-emerald-300" : "bg-sky-300"}`}>{String(index + 1).padStart(2, "0")}</div>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
              </div>
              <h2 className="mt-6 text-xl font-black leading-7 text-white">{item.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{item.description}</p>
              <Link href={`/lojas/${item.storeSlug}/produtos/${item.slug}`} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-black text-emerald-200">
                Ler análise completa <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
