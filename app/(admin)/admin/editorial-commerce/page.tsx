import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runCommerceEditorialOnce } from "@/lib/commerce-editorial/pipeline";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

async function runNow() {
  "use server";
  await runCommerceEditorialOnce({ force: true }).catch(() => null);
  revalidatePath("/admin/editorial-commerce");
}

async function toggleAutomation() {
  "use server";
  const config = await prisma.commerceEditorialConfig.findUnique({ where: { id: "default" } });
  await prisma.commerceEditorialConfig.upsert({
    where: { id: "default" },
    update: { enabled: !config?.enabled },
    create: { id: "default", enabled: true },
  });
  revalidatePath("/admin/editorial-commerce");
}

function date(value: Date | null | undefined) {
  return value ? value.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

function statusClass(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-100 text-emerald-800";
  if (status === "FAILED") return "bg-red-100 text-red-800";
  if (status === "RUNNING") return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-800";
}

export default async function EditorialCommerceAdminPage() {
  const [config, runs, publications] = await Promise.all([
    prisma.commerceEditorialConfig.findUnique({ where: { id: "default" } }),
    prisma.commerceEditorialRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 }),
    prisma.seoBrief.findMany({
      where: { product: { affiliateStoreId: { not: null } } },
      include: { product: { include: { affiliateStore: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);
  const published = publications.filter((item) => item.status === "PUBLISHED" && item.indexable);
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
          <form action={toggleAutomation}><button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">{config?.enabled ? "Pausar cron" : "Ativar cron"}</button></form>
          <form action={runNow}><button className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Rodar agora</button></form>
        </div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Automação", config?.enabled ? "Ativa" : "Pausada"],
          ["Frequência", `A cada ${config?.runEveryHours || 24}h`],
          ["Próxima execução", date(config?.nextRunAt)],
          ["Publicados no sitemap", String(published.length)],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-xl font-black text-slate-950">{value}</div></div>)}
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Sequência e trava de qualidade</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {["1. Visitar loja", "2. Identificar produto", "3. Pesquisar e escrever", "4. Revisar SEO e fatos", "5. Publicar e indexar"].map((item) => <div key={item} className="rounded-xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700">{item}</div>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Exigências atuais: fonte do produto registrada, mínimo de {config?.minimumWords || 900} palavras, nota do revisor a partir de 75, sem duplicidade relevante e aprovação explícita do agente revisor.</p>
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
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-black text-slate-950">Publicações geradas</h2></div>
        <div className="divide-y divide-slate-100">
          {publications.map((article) => {
            const store = article.product.affiliateStore;
            const publicUrl = store && article.status === "PUBLISHED" && article.indexable ? `${siteUrl}/lojas/${store.slug}/artigos/${article.slug}` : null;
            return <div key={article.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><div className="font-black text-slate-900">{article.title}</div><div className="mt-1 text-xs text-slate-500">{store?.name || "Loja não vinculada"} • nota {article.qualityScore ?? "—"} • {date(article.updatedAt)}</div></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(article.status)}`}>{article.status}{article.indexable ? " • INDEXADO" : ""}</span>{publicUrl ? <Link href={publicUrl} target="_blank" className="text-sm font-black text-emerald-700">Abrir artigo</Link> : null}</div></div>;
          })}
          {!publications.length ? <div className="px-5 py-10 text-center text-sm text-slate-500">Nenhuma publicação gerada.</div> : null}
        </div>
      </section>
    </main>
  );
}
