import Link from "next/link";
import { listAffiliateProgramSummaries } from "@/lib/affiliate-programs/operations";
import { bootstrapAffiliateProgramAction, runAffiliateProgramNowAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
  };
};

function badgeTone(status: string) {
  if (status === "ACTIVE" || status === "pilot-live") return "bg-emerald-100 text-emerald-800";
  if (status === "NEEDS_FIX" || status === "foundation-ready") return "bg-amber-100 text-amber-800";
  if (status === "BLOCKED" || status === "critical") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

function actionLabel(storeSlug: string) {
  if (storeSlug === "cobasi") return "Rodar agora";
  if (["electrolux", "brascol", "tng"].includes(storeSlug)) return "Gerar artigo";
  return "Abrir admin";
}

function actionTone(storeSlug: string) {
  if (storeSlug === "cobasi") return "bg-emerald-600 text-white";
  if (storeSlug === "electrolux") return "bg-sky-600 text-white";
  if (storeSlug === "brascol") return "bg-amber-600 text-white";
  if (storeSlug === "tng") return "bg-slate-900 text-white";
  return "border border-slate-200 bg-white text-slate-800";
}

function nextStepLabel(storeSlug: string, canRun: boolean) {
  if (storeSlug === "cobasi") return "Se for o primeiro uso, rode o Bootstrap. Depois use Rodar agora.";
  if (canRun) return "Use Gerar artigo e depois confira o admin da loja.";
  return "Abra o admin da loja para continuar a configuração.";
}

export default async function AffiliateProgramsAdminPage({ searchParams }: PageProps) {
  const summaries = await listAffiliateProgramSummaries();
  const activeStores = summaries.filter((item) => item.store?.status === "ACTIVE").length;
  const runnablePrograms = summaries.filter((item) => item.support.runNow).length;
  const ok = searchParams?.ok ? decodeURIComponent(searchParams.ok) : null;
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <main className="p-5 sm:p-8">
      <section className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a,#14532d)] px-6 py-7 text-white shadow-xl shadow-slate-900/10 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Compra Esperta • Operação afiliada</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Programas afiliados</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50/90">
              Tela simplificada: escolha a loja, clique no botão principal e depois confira o resultado.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="#como-usar" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black text-white">
              ? Como usar
            </Link>
            <Link href="/admin/compra-esperta" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-900">
              Ver analytics
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Programas" value={String(summaries.length)} />
          <MetricCard label="Lojas ativas" value={String(activeStores)} />
          <MetricCard label="Prontas para rodar" value={String(runnablePrograms)} />
        </div>
      </section>

      {ok ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {ok}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
          {error}
        </div>
      ) : null}

      <section className="mt-7 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Lojas</h2>
            <p className="mt-1 text-sm text-slate-500">Cada card mostra só o essencial: status, próxima ação e último resultado.</p>
          </div>
          <Link href="#como-usar" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
            Abrir ajuda
          </Link>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {summaries.map(({ spec: program, store, runtime, support }) => (
            <article key={program.storeSlug} className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-950">{program.displayName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{program.heroLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${badgeTone(store?.status || "missing")}`}>
                    {store?.status || "MISSING"}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Próxima ação</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{nextStepLabel(program.storeSlug, support.runNow)}</div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SimpleInfo label="Última atualização" value={formatDate(store?.updatedAt)} />
                <SimpleInfo label="Último resultado" value={`Fila ${runtime.queueCount} • Revisão ${runtime.reviewCount} • Publicados ${runtime.publishedCount}`} />
                <SimpleInfo label="Cliques" value={`Total ${store?.clickCount || 0} • 7d ${store?.clickCount7d || 0}`} />
                <SimpleInfo label="Abrir área" value={program.adminPath} mono />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {program.storeSlug === "cobasi" && support.bootstrap ? (
                  <form action={bootstrapAffiliateProgramAction}>
                    <input type="hidden" name="storeSlug" value={program.storeSlug} />
                    <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800">
                      Bootstrap
                    </button>
                  </form>
                ) : null}

                {support.runNow ? (
                  <form action={runAffiliateProgramNowAction}>
                    <input type="hidden" name="storeSlug" value={program.storeSlug} />
                    <button className={`rounded-xl px-3 py-2 text-sm font-black ${actionTone(program.storeSlug)}`}>
                      {actionLabel(program.storeSlug)}
                    </button>
                  </form>
                ) : null}

                <Link href={program.adminPath} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800">
                  Abrir admin
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="como-usar" className="mt-7 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Como usar</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <HelpStep
            step="1"
            title="Escolha a loja"
            text="Comece por uma das lojas que já estão prontas para rodar: Cobasi, Electrolux, Brascol ou TNG."
          />
          <HelpStep
            step="2"
            title="Clique no botão principal"
            text="Use Rodar agora ou Gerar artigo. Na Cobasi, Bootstrap é só para montagem inicial."
          />
          <HelpStep
            step="3"
            title="Veja o retorno"
            text="Se der certo, aparece mensagem verde. Se der erro, aparece mensagem vermelha no topo."
          />
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

function SimpleInfo({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className={`mt-1 text-sm text-slate-900 ${mono ? "font-mono break-all" : "font-semibold"}`}>{value}</div>
    </div>
  );
}

function HelpStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">{step}</div>
      <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
