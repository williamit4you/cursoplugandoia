import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OperationDetailPage({ params }: { params: { key: string } }) {
  const operation = await prisma.operationDefinition.findUnique({
    where: { key: params.key },
    include: { runs: { orderBy: { startedAt: "desc" }, take: 50 } },
  });
  if (!operation) notFound();
  const alerts = await prisma.operationAlert.findMany({ where: { operationKey: operation.key }, orderBy: { lastSeenAt: "desc" }, take: 20 });
  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <Link href="/admin/dashboard" className="text-xs font-bold text-indigo-600">Voltar para a Central</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-wider text-slate-400">{operation.family}</div><h1 className="mt-1 text-3xl font-black text-slate-900">{operation.name}</h1><p className="mt-2 text-sm text-slate-500">{operation.description}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${operation.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{operation.enabled ? "Ativa" : "Desligada"}</span></div>
    </div>
    {alerts.length > 0 && <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-black text-amber-950">Alertas</h2><div className="mt-3 space-y-2">{alerts.map((alert) => <div key={alert.id} className="rounded-xl bg-white/70 p-3 text-sm text-amber-950"><strong>{alert.title}</strong><div>{alert.message}</div></div>)}</div></section>}
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-900">Linha do tempo de execucoes</h2><div className="mt-4 space-y-3">{operation.runs.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nenhuma execucao registrada.</div> : operation.runs.map((run) => <article key={run.id} className="grid gap-2 rounded-2xl border border-slate-200 p-4 md:grid-cols-[150px_110px_1fr]"><time className="text-xs text-slate-500">{run.startedAt.toLocaleString("pt-BR")}</time><strong className={run.status === "FAILED" ? "text-rose-700" : run.status === "SUCCESS" ? "text-emerald-700" : "text-amber-700"}>{run.status}</strong><div className="text-xs text-slate-600">Processados: {run.itemsProcessed} | Sucesso: {run.itemsSucceeded} | Falhas: {run.itemsFailed}{run.errorMessage ? <div className="mt-1 text-rose-700">{run.errorMessage}</div> : null}</div></article>)}</div></section>
  </div>;
}
