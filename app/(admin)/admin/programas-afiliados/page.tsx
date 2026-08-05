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

export default async function AffiliateProgramsAdminPage({ searchParams }: PageProps) {
  const summaries = await listAffiliateProgramSummaries();
  const activeStores = summaries.filter((item) => item.store?.status === "ACTIVE").length;
  const runnablePrograms = summaries.filter((item) => item.support.runNow);
  const cobasi = summaries.find((item) => item.spec.storeSlug === "cobasi");
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
              Esta tela serve para 3 coisas: iniciar um programa, mandar gerar conteúdo e acompanhar se os cliques estão entrando.
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
          <MetricCard label="Programas priorizados" value={String(summaries.length)} />
          <MetricCard label="Lojas ativas" value={String(activeStores)} />
          <MetricCard label="Cobasi publicadas" value={String(cobasi?.runtime.publishedCount || 0)} />
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
            <h2 className="text-lg font-black text-slate-900">Fluxo rápido</h2>
            <p className="mt-1 text-sm text-slate-500">Se você quiser usar sem pensar muito, siga estes 3 passos.</p>
          </div>
          <Link href="#como-usar" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
            Abrir ajuda
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <StepCard
            step="1"
            title="Preparar loja"
            description="Use Bootstrap só quando for o primeiro setup da Cobasi ou quando quiser repovoar a base inicial."
          />
          <StepCard
            step="2"
            title="Gerar conteúdo"
            description="Use Rodar agora ou Gerar artigo. O sistema coloca conteúdo novo na fila ou publica conforme a regra do programa."
          />
          <StepCard
            step="3"
            title="Conferir resultado"
            description="Abra o admin da loja e depois o analytics para ver páginas, cliques e comportamento dos acessos."
          />
        </div>
      </section>

      <section className="mt-7 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Ações que funcionam agora</h2>
        <p className="mt-1 text-sm text-slate-500">Esses botões já executam geração ou operação imediatamente.</p>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {runnablePrograms.map(({ spec: program, runtime, support }) => (
            <article key={program.storeSlug} className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{program.programCode}</div>
                  <h3 className="mt-1 text-xl font-black text-slate-950">{program.displayName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{program.heroLabel}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${badgeTone(program.rolloutStatus)}`}>{program.rolloutStatus}</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniStat label="Fila" value={String(runtime.queueCount)} />
                <MiniStat label="Revisão" value={String(runtime.reviewCount)} />
                <MiniStat label="Publicados" value={String(runtime.publishedCount)} />
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

      <section className="mt-7 rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">Todos os programas</h2>
          <p className="mt-1 text-sm text-slate-500">Resumo simples para saber o que existe e qual é o próximo passo.</p>
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-2">
          {summaries.map(({ spec: program, store, runtime, support }) => (
            <article key={program.storeSlug} className="rounded-[22px] border border-slate-200 bg-slate-50/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-950">{program.displayName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{program.firstBatchLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${badgeTone(program.rolloutStatus)}`}>{program.rolloutStatus}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${badgeTone(store?.status || "missing")}`}>{store?.status || "MISSING"}</span>
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-semibold text-slate-500">Loja seed</dt>
                  <dd className="text-right font-semibold text-slate-900">{store?.name || "Não encontrada"}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-semibold text-slate-500">Cadência</dt>
                  <dd className="text-right">{runtime.cadenceLabel || program.cadenceLabel}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-semibold text-slate-500">Cliques</dt>
                  <dd className="text-right">Total {store?.clickCount || 0} • 30d {store?.clickCount30d || 0} • 7d {store?.clickCount7d || 0}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-semibold text-slate-500">Conteúdo</dt>
                  <dd className="text-right">Fila {runtime.queueCount} • Revisão {runtime.reviewCount} • Publicados {runtime.publishedCount}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-semibold text-slate-500">Última atualização</dt>
                  <dd className="text-right">{formatDate(store?.updatedAt)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={program.adminPath} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800">
                  Abrir admin
                </Link>
                {support.runNow ? (
                  <form action={runAffiliateProgramNowAction}>
                    <input type="hidden" name="storeSlug" value={program.storeSlug} />
                    <button className={`rounded-xl px-3 py-2 text-sm font-black ${actionTone(program.storeSlug)}`}>
                      {actionLabel(program.storeSlug)}
                    </button>
                  </form>
                ) : null}
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-600">
                  {program.ctaPath}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="como-usar" className="mt-7 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Como usar esta tela</h2>
        <p className="mt-1 text-sm text-slate-500">Guia rápido, sem linguagem técnica.</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <HelpBox
            title="O que cada botão faz"
            items={[
              "Bootstrap: prepara a base inicial. Use principalmente na Cobasi e não no dia a dia.",
              "Rodar agora / Gerar artigo: manda o sistema executar imediatamente.",
              "Abrir admin: leva para a área detalhada daquela loja.",
              "Ver analytics: mostra páginas, acessos e cliques.",
            ]}
          />
          <HelpBox
            title="Ordem recomendada"
            items={[
              "1. Escolha uma loja pronta, como Cobasi, Electrolux, Brascol ou TNG.",
              "2. Clique no botão principal da loja.",
              "3. Veja a mensagem verde ou vermelha no topo da tela.",
              "4. Depois abra o admin da loja e confira fila, revisão e publicados.",
            ]}
          />
          <HelpBox
            title="Como ler os números"
            items={[
              "Fila: conteúdo aguardando processamento.",
              "Revisão: conteúdo parado para conferência.",
              "Publicados: conteúdo que já saiu.",
              "Cliques total / 30d / 7d: desempenho do programa ao longo do tempo.",
            ]}
          />
          <HelpBox
            title="Se algo der errado"
            items={[
              "A tela agora mostra mensagem de erro no topo.",
              "Se aparecer erro, me diga exatamente qual loja e qual botão você clicou.",
              "Com isso eu corrijo muito mais rápido do que tentando adivinhar.",
            ]}
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-900">{value}</div>
    </div>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">{step}</div>
      <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function HelpBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
