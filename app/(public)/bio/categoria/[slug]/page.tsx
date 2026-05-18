import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BioCategoryPage({ params }: { params: { slug: string } }) {
  const slug = String(params.slug || "").trim();
  const category = await prisma.bioCategory.findUnique({ where: { slug } });
  if (!category || !category.active) notFound();

  const products = await prisma.bioProduct.findMany({
    where: { active: true, category: { slug } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 60,
    include: { category: true },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/bio" className="text-sm text-slate-400 hover:text-slate-200">
        ← Voltar
      </Link>

      <div className="mt-3">
        <h1 className="text-3xl font-black tracking-tight">{category.name}</h1>
        <p className="text-sm text-slate-400">Categoria</p>
      </div>

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
              <img src={p.imageUrl} alt={p.title} className="mt-3 h-44 w-full rounded-xl object-cover" loading="lazy" />
            ) : (
              <div className="mt-3 h-44 w-full rounded-xl bg-white/5" />
            )}

            <div className="mt-3 line-clamp-3 text-sm text-slate-300">{p.description}</div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Nenhum produto nesta categoria ainda.
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
