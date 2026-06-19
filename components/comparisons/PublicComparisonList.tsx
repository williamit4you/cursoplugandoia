import Link from "next/link";

export default function PublicComparisonList({ items }: { items: any[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="rounded-[2rem] border border-amber-200/70 bg-[linear-gradient(135deg,#fff7ed,white_58%,#fef3c7)] p-8 shadow-[0_20px_70px_rgba(180,83,9,0.08)]">
        <div className="max-w-3xl">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">Comparativos</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Guias de compra com foco em SEO e afiliacao</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Reunimos comparativos completos para ajudar na escolha do produto ideal, sempre com os links dos itens analisados ao final de cada guia.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/comparativo/${item.slug}`}
            className="group rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">{item.validSourceCount} produtos comparados</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 group-hover:text-amber-700">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.introSummary || item.metaDescription}</p>
            <div className="mt-5 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString("pt-BR")}</span>
              <span>Abrir guia</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
