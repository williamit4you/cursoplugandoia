import { CTAButton } from "@/components/landing/cta-button";

export function Offer({ checkoutUrl }: { checkoutUrl: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Oferta do Plugando IA</h2>
          <p className="mt-4 text-pretty text-white/75">
            Se você quer um curso que te faça <strong className="text-white">construir</strong> (e não só assistir), essa é a sua
            entrada.
          </p>

          <div className="mt-6 grid gap-4">
            {[
              { t: "Acesso ao curso completo", d: "Do n8n ao SaaS com assinatura e deploy." },
              { t: "Projeto final pronto para vender", d: "Uma base sólida para portfólio, freela e produto." },
              { t: "Método replicável", d: "Aprenda a integrar IA em qualquer app que você criar." }
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-base font-semibold">{x.t}</div>
                <p className="mt-2 text-sm text-white/70">{x.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-glow">
          <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Promoção por tempo limitado
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-base-950/40 p-5">
            <div className="text-sm text-white/70">Investimento</div>

            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div className="text-sm text-white/60">
                Preço original:{" "}
                <span className="text-white/70 line-through">R$ 97,00</span>
              </div>

              <div className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
                -51% hoje
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-4xl font-semibold tracking-tight">R$ 47,00</div>
              <div className="text-sm text-white/60">ou 12x no cartão*</div>
            </div>

            <div className="mt-2 text-xs text-white/55">*Condição e parcelamento conforme seu checkout.</div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-white/75">
            {[
              "Aulas objetivas (sem enrolação)",
              "Você aprende fazendo (passo a passo)",
              "Do n8n aos agentes + Next.js + SaaS",
              "Projetos prontos para portfólio e venda"
            ].map((b) => (
              <div key={b} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-cyan-300" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          <div className="mt-7">
            <CTAButton href={checkoutUrl} />
            <div className="mt-3 text-center text-xs text-white/55">Clique e finalize sua inscrição em menos de 2 minutos.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
