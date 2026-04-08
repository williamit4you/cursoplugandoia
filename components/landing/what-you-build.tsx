export function WhatYouBuild() {
  const items: Array<{ title: string; bullets: string[] }> = [
    {
      title: "Chatbots com IA (de verdade)",
      bullets: ["Integração com OpenAI", "Contexto e memória", "Pronto para colocar em um site e atender clientes"]
    },
    {
      title: "Automações com n8n",
      bullets: [
        "Triggers, ações e condicionais",
        "HTTP Request para integrar qualquer API",
        "Fluxos exportáveis e reaproveitáveis"
      ]
    },
    {
      title: "Sistema SaaS completo",
      bullets: ["Login, trial e assinatura", "Banco PostgreSQL", "Deploy e validação da assinatura"]
    },
    {
      title: "Apps com IA integrada",
      bullets: ["APIs no Next.js", "Server Actions e formulários", "RAG com banco vetorial + PostgreSQL"]
    }
  ];

  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-start">
      <div>
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          O que você vai construir (para mostrar e vender)
        </h2>
        <p className="mt-4 text-pretty text-white/75">
          Aqui não é curso “bonito” — é curso <strong className="text-white">rentável</strong>. Você sai com entregas
          que viram portfólio, freela e produto.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold">No fim, você sabe:</div>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>• Integrar IA com segurança e boa arquitetura.</li>
            <li>• Automatizar processos e reduzir trabalho manual.</li>
            <li>• Publicar e vender um sistema com assinatura.</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-base font-semibold">{item.title}</div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {item.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-emerald-300/90" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
