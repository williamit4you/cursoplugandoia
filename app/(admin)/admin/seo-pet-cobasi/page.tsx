import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { bootstrapPetSeo, publishPetContent, queuePetContent, runPetSeoNow, togglePetSeo, unpublishPetContent, updatePetSeoCadence, verifyPetLocation } from "./actions";

export const dynamic = "force-dynamic";

function date(value: Date | null | undefined) {
  return value ? value.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

function badge(status: string) {
  if (status === "PUBLISHED" || status === "VERIFIED") return "bg-emerald-100 text-emerald-800";
  if (status === "FAILED" || status === "REJECTED") return "bg-red-100 text-red-800";
  if (status === "GENERATING" || status === "RUNNING") return "bg-blue-100 text-blue-800";
  if (status === "QUEUED") return "bg-violet-100 text-violet-800";
  return "bg-amber-100 text-amber-800";
}

export default async function PetSeoCobasiAdminPage({ searchParams }: { searchParams?: { city?: string; status?: string } }) {
  const [config, counts, pages, runs, locations] = await Promise.all([
    prisma.petSeoConfig.findUnique({ where: { id: "cobasi" } }),
    Promise.all(["DRAFT", "QUEUED", "REVIEW", "PUBLISHED"].map(async (status) => [status, await prisma.petContentPage.count({ where: { status } })] as const)),
    prisma.petContentPage.findMany({ include: { location: true }, orderBy: [{ status: "asc" }, { createdAt: "asc" }], take: 100 }),
    prisma.petSeoRun.findMany({ include: { page: { select: { title: true } } }, orderBy: { startedAt: "desc" }, take: 30 }),
    prisma.petLocation.findMany({
      where: searchParams?.city ? { OR: [{ city: { contains: searchParams.city, mode: "insensitive" } }, { state: { equals: searchParams.city.toUpperCase() } }] } : undefined,
      include: { _count: { select: { units: true } }, pages: { select: { id: true, status: true, path: true } } },
      orderBy: [{ state: "asc" }, { city: "asc" }],
      take: 120,
    }),
  ]);
  const totals = Object.fromEntries(counts);

  return (
    <main className="p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Compra Esperta</div>
          <h1 className="mt-2 text-3xl font-black text-slate-950">SEO Pet — Cobasi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Fila diária com agentes de pesquisa, estratégia, redação e revisão. A marca é interna; as páginas públicas priorizam produtos, necessidades e cidades.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/programas-afiliados" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Central de programas</Link>
          <form action={bootstrapPetSeo}><button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Preparar programa</button></form>
          <form action={togglePetSeo}><button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">{config?.enabled ? "Pausar job" : "Ativar job"}</button></form>
          <form action={runPetSeoNow}><button className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Produzir próxima pauta</button></form>
        </div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ["Job", config?.enabled ? "Ativo" : "Pausado"], ["Cadência", `${config?.runEveryHours || 24}h`], ["Rascunhos", String(totals.DRAFT || 0)],
          ["Na fila", String(totals.QUEUED || 0)], ["Em revisão", String(totals.REVIEW || 0)], ["No sitemap", String(totals.PUBLISHED || 0)],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-bold uppercase text-slate-500">{label}</div><div className="mt-2 text-xl font-black">{value}</div></div>)}
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-lg font-black">Configuração do job diário</h2><p className="mt-1 text-sm text-slate-500">Publicação automática permanece desligada no piloto. Próxima execução: {date(config?.nextRunAt)}</p></div>
          <form action={updatePetSeoCadence} className="flex items-end gap-2">
            <label className="text-xs font-bold text-slate-600">Intervalo (horas)<input name="runEveryHours" type="number" min="1" max="168" defaultValue={config?.runEveryHours || 24} className="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-xs font-bold text-slate-600">Itens por ciclo<input name="maxItemsPerRun" type="number" min="1" max="5" defaultValue={config?.maxItemsPerRun || 1} className="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2" /></label>
            <button className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-black text-white">Salvar</button>
          </form>
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-black">Fila e publicações</h2></div>
        <div className="divide-y divide-slate-100">
          {pages.map((page) => <div key={page.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0"><div className="font-black text-slate-900">{page.title}</div><div className="mt-1 text-xs text-slate-500">/{page.path} • {page.type} • nota {page.qualityScore ?? "—"}{page.location ? ` • ${page.location.city}/${page.location.state}` : ""}</div>{page.lastError ? <div className="mt-1 text-xs text-red-600">{page.lastError}</div> : null}</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${badge(page.status)}`}>{page.status}{page.indexable ? " • SITEMAP" : ""}</span>
              <Link href={`/admin/seo-pet-cobasi/${page.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black">Revisar</Link>
              {["DRAFT", "FAILED", "STALE"].includes(page.status) ? <form action={queuePetContent}><input type="hidden" name="pageId" value={page.id} /><button className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-black text-violet-700">Colocar na fila</button></form> : null}
              {page.status === "REVIEW" ? <form action={publishPetContent}><input type="hidden" name="pageId" value={page.id} /><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-black text-white">Publicar</button></form> : null}
              {page.status === "PUBLISHED" ? <><Link href={`/${page.path}`} target="_blank" className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-white">Abrir</Link><form action={unpublishPetContent}><input type="hidden" name="pageId" value={page.id} /><button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-black text-red-700">Despublicar</button></form></> : null}
            </div>
          </div>)}
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-black">Cidades ({locations.length} exibidas)</h2><p className="mt-1 text-sm text-slate-500">As 97 localidades começam não indexáveis. Verifique uma unidade para liberar a pauta local.</p></div><form><input name="city" defaultValue={searchParams?.city || ""} placeholder="Cidade ou UF" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button className="ml-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-white">Buscar</button></form></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {locations.map((location) => <details key={location.id} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-black">{location.city}/{location.state} <span className={`ml-2 rounded-full px-2 py-1 text-[10px] ${badge(location.status)}`}>{location.status}</span></summary><div className="mt-3 text-xs text-slate-500">{location._count.units} unidade(s) • pauta {location.pages[0]?.status || "não criada"}</div>{location.status !== "VERIFIED" ? <form action={verifyPetLocation} className="mt-4 grid gap-2"><input type="hidden" name="locationId" value={location.id} /><input name="sourceUrl" type="url" required placeholder="Fonte oficial HTTPS" className="rounded-lg border px-3 py-2 text-sm" /><input name="unitName" required placeholder="Nome da unidade" className="rounded-lg border px-3 py-2 text-sm" /><input name="address" required placeholder="Endereço completo" className="rounded-lg border px-3 py-2 text-sm" /><textarea name="facts" placeholder="Serviços e fatos locais confirmados" className="rounded-lg border px-3 py-2 text-sm" /><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-black text-white">Verificar por 90 dias</button></form> : <div className="mt-3 break-all text-xs text-emerald-700">Fonte: {location.sourceUrl}</div>}</details>)}
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-black">Execuções recentes</h2></div><div className="divide-y">{runs.map((run) => <div key={run.id} className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[170px_130px_1fr]"><span className="text-slate-500">{date(run.startedAt)}</span><span className={`w-fit rounded-full px-2 py-1 text-xs font-black ${badge(run.status)}`}>{run.status}</span><span>{run.page?.title || "Sem pauta"} — {run.message || run.step}</span></div>)}{!runs.length ? <div className="px-5 py-8 text-sm text-slate-500">Nenhuma execução ainda.</div> : null}</div></section>
    </main>
  );
}
