import { CTAButton } from "@/components/landing/cta-button";

export function Proof() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Conteúdo prático, direto ao ponto — do tipo que vira entrega.
          </h2>
          <p className="mt-4 text-pretty text-white/75">
            O Plugando IA foi desenhado para quem quer parar de “colecionar tutorial” e começar a entregar projeto.
            Aqui, cada aula tem um objetivo claro e encaixa no projeto final. Sem enrolação, sem teoria infinita e sem
            “aula só para preencher”.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-semibold">O que muda na sua rotina:</div>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>• Você entende o “como” e o “porquê” — e aplica no mesmo dia.</li>
              <li>• Você aprende a montar fluxos e APIs que funcionam em produção.</li>
              <li>• Você termina com um sistema pronto para vender (não só um repositório parado).</li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-glow">
          <div className="text-sm font-semibold">Sem promessa milagrosa</div>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Você não precisa “ser gênio” para construir com IA. Precisa de método, prática e um stack bem explicado.
            É isso que você leva daqui.
          </p>
          <div className="mt-6 grid gap-4">
            {[
              { k: "Foco", v: "projetos reais e comerciais" },
              { k: "Ritmo", v: "aulas objetivas e guiadas" },
              { k: "Resultado", v: "portfólio + base para vender" }
            ].map((row) => (
              <div
                key={row.k}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="text-sm text-white/80">{row.k}</div>
                <div className="text-sm font-semibold text-white">{row.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <CTAButton href="#oferta" />
          </div>
        </div>
      </div>
    </div>
  );
}
