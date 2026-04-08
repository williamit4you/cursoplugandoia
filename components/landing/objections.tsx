const faqs: Array<{ q: string; a: string }> = [
  {
    q: "“Eu não preciso saber muito de IA?”",
    a: "Você não precisa virar cientista de dados. Você precisa aprender a integrar IA em aplicações: chamar API, organizar contexto, criar fluxos, armazenar dados e colocar em produção. É isso que a gente faz aqui."
  },
  {
    q: "“Eu sou iniciante/intermediário. Consigo acompanhar?”",
    a: "Sim. O curso é passo a passo, com explicação prática e construção guiada. Você aprende fazendo — e o projeto final é o seu norte."
  },
  {
    q: "“E se eu travar no meio?”",
    a: "As aulas foram estruturadas para reduzir travas: cada módulo vira uma peça do projeto. Você entende o motivo de cada etapa e consegue reproduzir em outros apps."
  },
  {
    q: "“Isso serve para ganhar dinheiro mesmo?”",
    a: "Serve para você criar entregas que o mercado paga: chatbots, automações e um SaaS com assinatura. O curso te dá base prática para vender projeto (freela) ou produto (SaaS)."
  }
];

export function Objections() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Dúvidas rápidas (e respostas diretas)</h2>
        <p className="mt-4 text-white/75">Sem discurso. Só o que você precisa saber antes de entrar.</p>
      </div>

      <div className="mt-10 grid gap-4">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/5 p-6 open:bg-white/10">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-6">
                <div className="text-base font-semibold">{f.q}</div>
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition group-open:rotate-45">
                  +
                </div>
              </div>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
