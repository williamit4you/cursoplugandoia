import { CTAButton } from "@/components/landing/cta-button";
import { FadeIn } from "@/components/motion/fade-in";
import { Section } from "@/components/landing/section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Modules } from "@/components/landing/modules";
import { Objections } from "@/components/landing/objections";
import { Offer } from "@/components/landing/offer";
import { Proof } from "@/components/landing/proof";
import { WhatYouBuild } from "@/components/landing/what-you-build";
import Image from "next/image";

const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "https://pay.hotmart.com/M103626951G?off=by19achj&bid=1775680433634";

export default function Page() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/30 via-cyan-400/20 to-emerald-400/20 blur-3xl" />

      {/* 1) HERO (acima da dobra) */}
      <Section className="pt-10 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <FadeIn>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]" />
              Para devs que querem ganhar dinheiro com IA (de verdade)
            </p>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Aprenda IA na prática e{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                crie projetos que vendem
              </span>{" "}
              em semanas — não em anos.
            </h1>

            <p className="mt-4 text-pretty text-base leading-relaxed text-white/75 md:text-lg">
              O <strong className="text-white">Plugando IA</strong> é um curso direto ao ponto para você dominar{" "}
              <strong className="text-white">n8n (automação)</strong>,{" "}
              <strong className="text-white">agentes de IA</strong> e{" "}
              <strong className="text-white">Next.js</strong> construindo: chatbots, automações e um{" "}
              <strong className="text-white">SaaS completo com IA + pagamento + deploy</strong>.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CTAButton href={checkoutUrl} />
              <a
                href="#conteudo"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Ver o que vou construir
              </a>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white">100% prático</div>
                <div className="text-xs text-white/65">você aprende fazendo</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white">Projeto real</div>
                <div className="text-xs text-white/65">SaaS do zero ao deploy</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white">Sem enrolação</div>
                <div className="text-xs text-white/65">aulas objetivas</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/10 to-white/0 blur-2xl" />
              <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-glow">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-base-950/60 px-4 py-3">
                  <div className="text-xs text-white/70">plugando-ia / projetos</div>
                  <div className="text-xs text-emerald-300">build: ok</div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium">n8n</div>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Workflows, HTTP, lógica, Code Node e integrações para automatizar tarefas que viram produto.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium">Agentes de IA</div>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Memória, tools e RAG para agentes que resolvem problemas reais (e não só “prompt bonitinho”).
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium">Next.js</div>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Rotas, APIs, server/client, actions e deploy: o stack que você vai usar em projetos de verdade.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium">SaaS completo</div>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Pagamento, trial, banco e deploy — pronto para vender, escalar e colocar no ar.
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <Image
                    src="/plugando-ia-hero.svg"
                    alt="Mockup moderno de IA, automação e código"
                    width={1200}
                    height={720}
                    className="h-auto w-full animate-floaty"
                    priority
                  />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* 2) SEÇÃO DE PROBLEMA */}
      <Section className="section-border" id="problema">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              A verdade: muita gente está “estudando IA”… e{" "}
              <span className="text-white/70">continuando sem resultado</span>.
            </h2>
            <p className="mt-4 text-pretty text-white/75">
              Se você é dev iniciante/intermediário, provavelmente já viu mil conteúdos sobre IA. O problema é que a
              maioria fica na teoria, em exemplos soltos e em “demos” que não viram produto.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Você até entende a ideia…",
                desc: "…mas trava na hora de integrar API, salvar contexto, criar fluxo e colocar em produção."
              },
              {
                title: "Perde tempo com tutoriais aleatórios",
                desc: "A cada vídeo, um stack diferente. Nada conecta. Você termina sem portfólio e sem oferta."
              },
              {
                title: "E o mercado não espera",
                desc: "Quem aprende a construir com IA agora vai pegar as melhores vagas e oportunidades."
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
              >
                <div className="text-base font-semibold">{item.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </Section>

      {/* 3) SEÇÃO DE SOLUÇÃO */}
      <Section className="section-border" id="solucao">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <FadeIn>
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              O Plugando IA é o caminho mais curto para sair do “consumo” e virar{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                construção
              </span>
              .
            </h2>
            <p className="mt-4 text-pretty text-white/75">
              Você vai aprender do jeito que importa: construindo aplicações reais com IA, automação e código — do
              fluxo no n8n até a API no Next.js, banco (PostgreSQL + vetorial), RAG e deploy.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">Você vai sair com:</div>
              <ul className="mt-3 space-y-2 text-sm text-white/75">
                <li>• Projetos para portfólio e para vender (freela, produto, SaaS).</li>
                <li>• Um método replicável: integrar IA em qualquer app.</li>
                <li>• Confiança para entregar soluções completas (do front ao deploy).</li>
              </ul>
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-glow">
              <div className="text-sm font-semibold">Resumo inteligente do conteúdo</div>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                Automação com <strong className="text-white">n8n</strong> (workflows, triggers, HTTP, lógica e Code
                Node), criação de <strong className="text-white">agentes com memória e tools</strong>, chatbot em
                site real, <strong className="text-white">RAG</strong> com banco vetorial + PostgreSQL,{" "}
                <strong className="text-white">Next.js completo</strong> (rotas, server/client, APIs e actions),
                integração com <strong className="text-white">OpenAI</strong> e um{" "}
                <strong className="text-white">SaaS completo</strong> com pagamento, trial e deploy.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#modulos"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white/90 transition hover:bg-white/10"
                >
                  Ver módulos
                </a>
                <CTAButton href={checkoutUrl} variant="secondary" />
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* 4) BENEFÍCIOS */}
      <Section className="section-border" id="beneficios">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">O que você ganha com o curso</h2>
            <p className="mt-4 text-white/75">
              Tudo pensado para você sair com habilidade aplicável e projetos que viram entrega (e receita).
            </p>
          </div>
          <div className="mt-10">
            <FeatureGrid
              items={[
                {
                  title: "Automação com n8n",
                  desc: "Workflows, triggers, HTTP, lógica e Code Node para automatizar processos de verdade."
                },
                {
                  title: "Agentes de IA",
                  desc: "Memória, tools e criação prática para agentes que resolvem tarefas e atendem usuários."
                },
                {
                  title: "Next.js na prática",
                  desc: "Rotas, server/client, APIs e actions: o stack para construir aplicações modernas."
                },
                {
                  title: "SaaS com IA",
                  desc: "Da ideia ao produto: banco, pagamento, trial, deploy e estrutura pronta para vender."
                },
                {
                  title: "Integração com APIs",
                  desc: "OpenAI + serviços externos para criar features inteligentes e integrações comerciais."
                },
                {
                  title: "Projetos reais",
                  desc: "Sem teoria infinita: cada módulo vira algo que você consegue mostrar e vender."
                }
              ]}
            />
          </div>
        </FadeIn>
      </Section>

      {/* 5) O QUE O ALUNO VAI CONSTRUIR */}
      <Section className="section-border" id="conteudo">
        <FadeIn>
          <WhatYouBuild />
        </FadeIn>
      </Section>

      {/* 6) MÓDULOS DO CURSO */}
      <Section className="section-border" id="modulos">
        <FadeIn>
          <Modules />
        </FadeIn>
      </Section>

      {/* 7) PROVA / AUTORIDADE */}
      <Section className="section-border" id="prova">
        <FadeIn>
          <Proof />
        </FadeIn>
      </Section>

      {/* 8) QUEBRA DE OBJEÇÕES */}
      <Section className="section-border" id="objecoes">
        <FadeIn>
          <Objections />
        </FadeIn>
      </Section>

      {/* 9) OFERTA */}
      <Section className="section-border" id="oferta">
        <FadeIn>
          <Offer checkoutUrl={checkoutUrl} />
        </FadeIn>
      </Section>

      {/* 10) CTA FINAL */}
      <Section className="section-border pb-16">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Você pode continuar só “vendo conteúdo”… ou pode sair daqui com um produto no ar.
            </h2>
            <p className="mt-4 text-white/75">Se você quer aprender IA do jeito certo (fazendo), o próximo passo é simples.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <CTAButton href={checkoutUrl} />
              <a
                href="#objecoes"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Tirar dúvidas rápidas
              </a>
            </div>
            <p className="mt-5 text-xs text-white/55">
              Dica: defina seu link de checkout em <code className="text-white/70">NEXT_PUBLIC_CHECKOUT_URL</code>.
            </p>
          </div>
        </FadeIn>
      </Section>

      <footer className="section-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-white">Plugando IA</div>
            <div className="text-xs text-white/55">IA prática • automação • Next.js • SaaS</div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <a className="hover:text-white" href="#beneficios">Benefícios</a>
            <a className="hover:text-white" href="#conteudo">Projetos</a>
            <a className="hover:text-white" href="#modulos">Módulos</a>
            <a className="hover:text-white" href="#oferta">Oferta</a>
          </div>
        </div>
      </footer>
    </main>
  );
}



