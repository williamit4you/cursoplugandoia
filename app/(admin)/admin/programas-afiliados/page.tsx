import Link from "next/link";
import { listAffiliateProgramSummaries } from "@/lib/affiliate-programs/operations";
import { bootstrapAffiliateProgramAction, runAffiliateProgramNowAction } from "./actions";

export const dynamic = "force-dynamic";

function badgeTone(status: string) {
  if (status === "ACTIVE" || status === "pilot-live") return "bg-emerald-100 text-emerald-800";
  if (status === "NEEDS_FIX" || status === "foundation-ready") return "bg-amber-100 text-amber-800";
  if (status === "BLOCKED" || status === "critical") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

export default async function AffiliateProgramsAdminPage() {
  const summaries = await listAffiliateProgramSummaries();
  const activeStores = summaries.filter((item) => item.store?.status === "ACTIVE").length;
  const cobasi = summaries.find((item) => item.spec.storeSlug === "cobasi");
  const electrolux = summaries.find((item) => item.spec.storeSlug === "electrolux");
  const brascol = summaries.find((item) => item.spec.storeSlug === "brascol");

  return (
    <main className="p-5 sm:p-8">
      <section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.28),transparent_34%),linear-gradient(135deg,#0f172a,#14532d)] px-6 py-7 text-white shadow-xl shadow-slate-900/10 md:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Compra Esperta • Operacao afiliada</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Central de Programas Afiliados</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-emerald-50/85">
              Acompanhamento unico da fundacao multi-loja: catalogo de afiliados, rollout editorial, riscos de compliance,
              CTA indireto por loja, seed e status operacional do piloto Cobasi.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Programas priorizados" value={String(summaries.length)} />
            <MetricCard label="Lojas ativas no seed" value={String(activeStores)} />
            <MetricCard label="Paginas Cobasi publicadas" value={String(cobasi?.runtime.publishedCount || 0)} />
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Piloto Cobasi</h2>
              <p className="mt-1 text-sm text-slate-500">O primeiro programa com cron, fila editorial, sitemap controlado e paginas locais.</p>
            </div>
            <Link href="/admin/seo-pet-cobasi" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white">
              Abrir operacao Cobasi
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Job" value={cobasi?.runtime.configStatus === "ACTIVE" ? "Ativo" : "Pausado"} />
            <MiniStat label="Cadencia" value={cobasi?.runtime.cadenceLabel || "—"} />
            <MiniStat label="Cidades cadastradas" value={String(cobasi?.runtime.locations || 0)} />
            <MiniStat label="Fila atual" value={String((cobasi?.runtime.queueCount || 0) + (cobasi?.runtime.reviewCount || 0))} />
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            Proxima etapa tecnica: reconciliar a migration pendente do banco e mover o fluxo de Cobasi para dentro do controlador multi-programa, sem perder a URL atual do admin.
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Editorial compartilhado</h2>
          <p className="mt-1 text-sm text-slate-500">Electrolux e Brascol ja usam a mesma camada operacional, cada uma com execucao direcionada por loja.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Electrolux fila" value={String(electrolux?.runtime.queueCount || 0)} />
            <MiniStat label="Electrolux revisao" value={String(electrolux?.runtime.reviewCount || 0)} />
            <MiniStat label="Electrolux publicados" value={String(electrolux?.runtime.publishedCount || 0)} />
            <MiniStat label="Electrolux modo" value={electrolux?.runtime.cadenceLabel || "—"} />
            <MiniStat label="Brascol fila" value={String(brascol?.runtime.queueCount || 0)} />
            <MiniStat label="Brascol revisao" value={String(brascol?.runtime.reviewCount || 0)} />
            <MiniStat label="Brascol publicados" value={String(brascol?.runtime.publishedCount || 0)} />
            <MiniStat label="Brascol modo" value={brascol?.runtime.cadenceLabel || "—"} />
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Arquivo</div>
            <p className="mt-2 break-all text-sm font-bold text-emerald-700">
              docs/specs/affiliate-content-programs/CHECKLIST-IMPLEMENTACAO.md
            </p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>O checklist ja marca a fundacao concluida nesta etapa e separa claramente o que depende de banco, cron e expansao por loja.</p>
          </div>
        </div>
      </section>

      <section className="mt-7 rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">Portfolio de programas</h2>
          <p className="mt-1 text-sm text-slate-500">As 12 lojas priorizadas, com docs, CTA indireto e estado atual da implementacao.</p>
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-2">
          {summaries.map(({ spec: program, store, runtime, support }) => {
            return (
              <article key={program.storeSlug} className="rounded-[22px] border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{program.programCode}</div>
                    <h3 className="mt-1 text-xl font-black text-slate-950">{program.displayName}</h3>
                    <p className="mt-1 text-sm text-slate-600">{program.heroLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${badgeTone(program.rolloutStatus)}`}>{program.rolloutStatus}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${badgeTone(program.riskLabel)}`}>{program.riskLabel}</span>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Loja seed</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{store?.name || "Nao encontrada"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Status afiliado</dt>
                    <dd className="mt-1">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${badgeTone(store?.status || "missing")}`}>{store?.status || "MISSING"}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Primeiro lote</dt>
                    <dd className="mt-1 text-sm text-slate-700">{program.firstBatchLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Cadencia alvo</dt>
                    <dd className="mt-1 text-sm text-slate-700">{program.cadenceLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">CTA indireto</dt>
                    <dd className="mt-1 font-mono text-xs text-slate-700">{program.ctaPath}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Compliance</dt>
                    <dd className="mt-1 text-sm text-slate-700">{store?.complianceClass || "Pendente"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Atualizado no seed</dt>
                    <dd className="mt-1 text-sm text-slate-700">{formatDate(store?.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Cliques rastreados</dt>
                    <dd className="mt-1 text-sm text-slate-700">{store?.clickCount || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Fila / revisao</dt>
                    <dd className="mt-1 text-sm text-slate-700">{runtime.queueCount} / {runtime.reviewCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Publicados</dt>
                    <dd className="mt-1 text-sm text-slate-700">{runtime.publishedCount}</dd>
                  </div>
                </dl>

                {program.storeSlug === "cobasi" ? (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                    Cobasi ja usa `PetContentPage`, `PetLocation`, `PetStoreUnit` e `PetSeoRun`. As demais lojas entram na proxima fase sobre a fundacao compartilhada.
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={program.adminPath} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800">
                    Abrir admin
                  </Link>
                  {program.storeSlug === "cobasi" && support.bootstrap ? (
                    <>
                      <form action={bootstrapAffiliateProgramAction}>
                        <input type="hidden" name="storeSlug" value={program.storeSlug} />
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800">
                          Bootstrap
                        </button>
                      </form>
                      <form action={runAffiliateProgramNowAction}>
                        <input type="hidden" name="storeSlug" value={program.storeSlug} />
                        <button className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white">
                          Rodar agora
                        </button>
                      </form>
                    </>
                  ) : null}
                  {program.storeSlug === "electrolux" && support.runNow ? (
                    <>
                      <form action={runAffiliateProgramNowAction}>
                        <input type="hidden" name="storeSlug" value={program.storeSlug} />
                        <button className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-black text-white">
                          Gerar artigo
                        </button>
                      </form>
                      <Link href="/admin/editorial-commerce" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800">
                        Abrir pipeline editorial
                      </Link>
                    </>
                  ) : null}
                  {program.storeSlug === "brascol" && support.runNow ? (
                    <>
                      <form action={runAffiliateProgramNowAction}>
                        <input type="hidden" name="storeSlug" value={program.storeSlug} />
                        <button className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-black text-white">
                          Gerar artigo
                        </button>
                      </form>
                      <Link href="/admin/editorial-commerce" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800">
                        Abrir pipeline editorial
                      </Link>
                    </>
                  ) : null}
                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700">
                    {program.docsPath}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100/80">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-900">{value}</div>
    </div>
  );
}
