import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";
import { publishEditorialArticle, runEditorialNow, toggleEditorialAutomation } from "./actions";

export const dynamic = "force-dynamic";

const PUBLICATIONS_PER_PAGE = 20;

function date(value: Date | null | undefined) {
  return value ? value.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

function statusClass(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-100 text-emerald-800";
  if (status === "FAILED") return "bg-red-100 text-red-800";
  if (status === "RUNNING") return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-800";
}

function pageHref(page: number) {
  return page === 1 ? "/admin/editorial-commerce" : `/admin/editorial-commerce?page=${page}`;
}

function paginationItems(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export default async function EditorialCommerceAdminPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const requestedPage = Math.max(1, Number.parseInt(String(searchParams?.page || "1"), 10) || 1);
  const publicationWhere = { product: { affiliateStoreId: { not: null } } };
  const [config, runs, publicationCount, publishedCount] = await Promise.all([
    prisma.commerceEditorialConfig.findUnique({ where: { id: "default" } }),
    prisma.commerceEditorialRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 }),
    prisma.seoBrief.count({ where: publicationWhere }),
    prisma.seoBrief.count({
      where: { ...publicationWhere, status: "PUBLISHED", indexable: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(publicationCount / PUBLICATIONS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const publications = await prisma.seoBrief.findMany({
    where: publicationWhere,
    include: { product: { include: { affiliateStore: true } } },
    orderBy: { updatedAt: "desc" },
    skip: (currentPage - 1) * PUBLICATIONS_PER_PAGE,
    take: PUBLICATIONS_PER_PAGE,
  });
  const firstPublication = publicationCount ? (currentPage - 1) * PUBLICATIONS_PER_PAGE + 1 : 0;
  const lastPublication = Math.min(currentPage * PUBLICATIONS_PER_PAGE, publicationCount);
  const visiblePages = paginationItems(currentPage, totalPages);
  const siteUrl = getCommerceSiteUrl();

  return (
    <main className="p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Compra Esperta</div>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Agentes editoriais</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Pesquisa de produto, estratégia, copywriting, revisão SEO e publicação controlada. Textos reprovados não entram no sitemap.</p>
        </div>
        <div className="flex gap-2">
          <form action={toggleEditorialAutomation}><button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">{config?.enabled ? "Pausar cron" : "Ativar cron"}</button></form>
          <form action={runEditorialNow}><button className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Rodar agora</button></form>
        </div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Automação", config?.enabled ? "Ativa" : "Pausada"],
          ["Frequência", `A cada ${config?.runEveryHours || 2}h`],
          ["Próxima execução", date(config?.nextRunAt)],
          ["Publicados no sitemap", String(publishedCount)],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-xl font-black text-slate-950">{value}</div></div>)}
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Sequência e trava de qualidade</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {["1. Visitar loja", "2. Identificar produto", "3. Pesquisar e escrever", "4. Revisar SEO e fatos", "5. Publicar e indexar"].map((item) => <div key={item} className="rounded-xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700">{item}</div>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Exigências atuais: fonte registrada, mínimo de {config?.minimumWords || 900} palavras, nota do revisor a partir de 75, sem duplicidade relevante e aprovação explícita. A rotação está na loja {(config?.storeCursor || 0) + 1}; depois da última loja ativa, volta automaticamente para a primeira.</p>
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-black text-slate-950">Execuções e logs</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Início</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Etapa</th><th className="px-5 py-3">Mensagem</th><th className="px-5 py-3">URL pesquisada</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((run) => <tr key={run.id}><td className="px-5 py-4 text-slate-500">{date(run.startedAt)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(run.status)}`}>{run.status}</span></td><td className="px-5 py-4 font-bold text-slate-700">{run.step}</td><td className="max-w-md px-5 py-4 text-slate-600">{run.message || "—"}</td><td className="max-w-xs truncate px-5 py-4">{run.sourceUrl ? <a href={run.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{run.sourceUrl}</a> : "—"}</td></tr>)}
              {!runs.length ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Nenhuma execução registrada.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <h2 className="font-black text-slate-950">Publicações geradas</h2>
          <span className="text-xs font-bold text-slate-500">
            Exibindo {firstPublication}-{lastPublication} de {publicationCount}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {publications.map((article) => {
            const store = article.product.affiliateStore;
            const publicUrl = store && article.status === "PUBLISHED" && article.indexable ? `${siteUrl}/lojas/${store.slug}/artigos/${article.slug}` : null;
            const affiliateProductUrl = store ? `/go/loja/${store.slug}?source=admin_editorial&medium=review&campaign=${encodeURIComponent(article.slug)}&destination=${encodeURIComponent(article.product.productUrl || "")}` : null;
            return (
              <div key={article.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <div className="font-black text-slate-900">{article.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{store?.name || "Loja não vinculada"} • nota {article.qualityScore ?? "—"} • {date(article.updatedAt)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(article.status)}`}>{article.status}{article.indexable ? " • SITEMAP" : ""}</span>
                  <Link href={`/admin/editorial-commerce/${article.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700">Ler artigo</Link>
                  {affiliateProductUrl ? <a href={affiliateProductUrl} target="_blank" rel="sponsored noreferrer" className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-black text-blue-700">Ver produto com link afiliado</a> : null}
                  {!article.indexable ? (
                    <form action={publishEditorialArticle}>
                      <input type="hidden" name="briefId" value={article.id} />
                      <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-black text-white">Publicar</button>
                    </form>
                  ) : null}
                  {publicUrl ? <Link href={publicUrl} target="_blank" className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-white">Abrir página</Link> : null}
                </div>
              </div>
            );
          })}
          {!publications.length ? <div className="px-5 py-10 text-center text-sm text-slate-500">Nenhuma publicação gerada.</div> : null}
        </div>
        {totalPages > 1 ? (
          <nav aria-label="Paginação das publicações" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            <Link
              href={pageHref(Math.max(1, currentPage - 1))}
              aria-disabled={currentPage === 1}
              className={`rounded-lg border px-3 py-2 text-sm font-black ${currentPage === 1 ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}
            >
              Anterior
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {visiblePages.map((page, index) => {
                const previousPage = visiblePages[index - 1];
                return (
                  <span key={page} className="flex items-center gap-1">
                    {previousPage && page - previousPage > 1 ? <span className="px-1 text-slate-400">...</span> : null}
                    <Link
                      href={pageHref(page)}
                      aria-current={page === currentPage ? "page" : undefined}
                      className={`min-w-9 rounded-lg px-3 py-2 text-center text-sm font-black ${page === currentPage ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}
                    >
                      {page}
                    </Link>
                  </span>
                );
              })}
            </div>
            <Link
              href={pageHref(Math.min(totalPages, currentPage + 1))}
              aria-disabled={currentPage === totalPages}
              className={`rounded-lg border px-3 py-2 text-sm font-black ${currentPage === totalPages ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}
            >
              Próxima
            </Link>
          </nav>
        ) : null}
      </section>
    </main>
  );
}
