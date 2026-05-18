import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export default async function BioIndexPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const q = normalize(searchParams?.q);
  const category = normalize(searchParams?.category);

  const categories = await prisma.bioCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 100,
  });

  const products = await prisma.bioProduct.findMany({
    where: {
      active: true,
      ...(category
        ? {
            category: { slug: category },
          }
        : {}),
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
    take: 60,
    include: { category: true },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Link na bio</h1>
          <p className="text-sm text-slate-400">Produtos recomendados do momento.</p>
        </div>
      </div>

      <form className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3" action="/bio" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar produto..."
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none focus:border-white/20"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none focus:border-white/20"
        >
          <option value="">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-slate-100 hover:bg-white/15 transition">
          Filtrar
        </button>
      </form>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/bio"
            className={`rounded-full border px-3 py-1 text-xs ${
              !category ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            Todos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/bio?category=${encodeURIComponent(c.slug)}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                category === c.slug
                  ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/bio/${p.slug}`}
            className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-slate-400">{p.category?.name || "Produto"}</div>
                <div className="mt-1 line-clamp-2 text-base font-semibold text-slate-100">{p.title}</div>
              </div>
              <div className="shrink-0 text-xs text-slate-400 group-hover:text-slate-200">Ver</div>
            </div>

            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt={p.title}
                className="mt-3 h-44 w-full rounded-xl object-cover"
                loading="lazy"
              />
            ) : (
              <div className="mt-3 h-44 w-full rounded-xl bg-white/5" />
            )}

            <div className="mt-3 line-clamp-3 text-sm text-slate-300">{p.description}</div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Nenhum produto encontrado.
        </div>
      )}

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400">
        <div>© {new Date().getFullYear()} Plugando IA</div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-slate-200">
            Termos
          </Link>
          <Link href="/privacy" className="hover:text-slate-200">
            Privacidade
          </Link>
        </div>
      </footer>
    </main>
  );
}
