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

const checkoutUrl =
  process.env.NEXT_PUBLIC_CHECKOUT_URL ??
  "https://pay.hotmart.com/M103626951G?off=by19achj&bid=1775680433634";

export const metadata = {
  title: "Plugando IA | Curso SaaS com IA",
  description:
    "Aprenda IA na pratica com n8n, agentes, Next.js e um SaaS completo pronto para vender.",
};

export default function CursoSaasPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/30 via-cyan-400/20 to-emerald-400/20 blur-3xl" />

      <Section className="pt-10 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <FadeIn>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]" />
              Para devs que querem ganhar dinheiro com IA de verdade
            </p>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Aprenda IA na pratica e{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                crie projetos que vendem
              </span>{" "}
              em semanas.
            </h1>

            <p className="mt-4 text-pretty text-base leading-relaxed text-white/75 md:text-lg">
              O <strong className="text-white">Plugando IA</strong> e um curso direto ao ponto para voce dominar{" "}
              <strong className="text-white">n8n</strong>, <strong className="text-white">agentes de IA</strong> e{" "}
              <strong className="text-white">Next.js</strong> construindo chatbots, automacoes e um{" "}
              <strong className="text-white">SaaS completo com IA, pagamento e deploy</strong>.
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
                <div className="text-white">100% pratico</div>
                <div className="text-xs text-white/65">voce aprende fazendo</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white">Projeto real</div>
                <div className="text-xs text-white/65">SaaS do zero ao deploy</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white">Sem enrolacao</div>
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
                      Workflows, HTTP, logica, Code Node e integracoes para automatizar tarefas que viram produto.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium">Agentes de IA</div>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Memoria, tools e RAG para agentes que resolvem problemas reais.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium">Next.js</div>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Rotas, APIs, server and client components, actions e deploy em projetos de verdade.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium">SaaS completo</div>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Pagamento, trial, banco e deploy pronto para vender e escalar.
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <Image
                    src="/plugando-ia-hero.svg"
                    alt="Mockup de IA, automacao e codigo"
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

      <Section className="section-border" id="problema">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Muita gente esta estudando IA e continua sem resultado.
            </h2>
            <p className="mt-4 text-pretty text-white/75">
              O problema nao e falta de conteudo. E excesso de teoria solta, demos isoladas e projetos que nao viram
              produto.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Voce entende a ideia, mas trava na execucao",
                desc: "Integrar API, salvar contexto, criar fluxo e colocar em producao ainda parece um labirinto.",
              },
              {
                title: "Tutoriais aleatorios nao se conectam",
                desc: "Cada video mostra um stack diferente e voce termina sem portfolio e sem oferta clara.",
              },
              {
                title: "O mercado esta acelerando",
                desc: "Quem aprende a construir com IA agora vai ocupar as melhores oportunidades.",
              },
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

      <Section className="section-border" id="solucao">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <FadeIn>
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              O caminho mais curto para sair do consumo e entrar em modo{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                construcao
              </span>
              .
            </h2>
            <p className="mt-4 text-pretty text-white/75">
              Voce aprende construindo aplicacoes reais com IA, automacao e codigo: do fluxo no n8n ate a API no
              Next.js, banco vetorial, RAG e deploy.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">Voce vai sair com:</div>
              <ul className="mt-3 space-y-2 text-sm text-white/75">
                <li>• Projetos para portfolio e para vender.</li>
                <li>• Um metodo replicavel para integrar IA em qualquer app.</li>
                <li>• Mais confianca para entregar solucao completa do front ao deploy.</li>
              </ul>
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-glow">
              <div className="text-sm font-semibold">Resumo inteligente do conteudo</div>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                Automacao com <strong className="text-white">n8n</strong>, criacao de{" "}
                <strong className="text-white">agentes com memoria e tools</strong>, chatbot em site real,{" "}
                <strong className="text-white">RAG</strong> com banco vetorial e PostgreSQL,{" "}
                <strong className="text-white">Next.js completo</strong>, integracao com{" "}
                <strong className="text-white">OpenAI</strong> e um <strong className="text-white">SaaS completo</strong>.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#modulos"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white/90 transition hover:bg-white/10"
                >
                  Ver modulos
                </a>
                <CTAButton href={checkoutUrl} variant="secondary" />
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="section-border" id="beneficios">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">O que voce ganha com o curso</h2>
            <p className="mt-4 text-white/75">
              Tudo pensado para voce sair com habilidade aplicavel e projetos que viram entrega e receita.
            </p>
          </div>
          <div className="mt-10">
            <FeatureGrid
              items={[
                {
                  title: "Automacao com n8n",
                  desc: "Workflows, triggers, HTTP, logica e Code Node para automatizar processos de verdade.",
                },
                {
                  title: "Agentes de IA",
                  desc: "Memoria, tools e criacao pratica para agentes que resolvem tarefas e atendem usuarios.",
                },
                {
                  title: "Next.js na pratica",
                  desc: "Rotas, server and client, APIs e actions para construir aplicacoes modernas.",
                },
                {
                  title: "SaaS com IA",
                  desc: "Da ideia ao produto com banco, pagamento, trial, deploy e estrutura pronta para vender.",
                },
                {
                  title: "Integracao com APIs",
                  desc: "OpenAI e servicos externos para criar features inteligentes e integracoes comerciais.",
                },
                {
                  title: "Projetos reais",
                  desc: "Cada modulo vira algo que voce consegue mostrar, publicar e vender.",
                },
              ]}
            />
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="conteudo">
        <FadeIn>
          <WhatYouBuild />
        </FadeIn>
      </Section>

      <Section className="section-border" id="modulos">
        <FadeIn>
          <Modules />
        </FadeIn>
      </Section>

      <Section className="section-border" id="prova">
        <FadeIn>
          <Proof />
        </FadeIn>
      </Section>

      <Section className="section-border" id="objecoes">
        <FadeIn>
          <Objections />
        </FadeIn>
      </Section>

      <Section className="section-border" id="oferta">
        <FadeIn>
          <Offer checkoutUrl={checkoutUrl} />
        </FadeIn>
      </Section>

      <Section className="section-border pb-16">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Voce pode continuar so vendo conteudo ou sair daqui com um produto no ar.
            </h2>
            <p className="mt-4 text-white/75">
              Se voce quer aprender IA do jeito certo, fazendo, o proximo passo e simples.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <CTAButton href={checkoutUrl} />
              <a
                href="#objecoes"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Tirar duvidas rapidas
              </a>
            </div>
          </div>
        </FadeIn>
      </Section>

      <footer className="section-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-white">Plugando IA</div>
            <div className="text-xs text-white/55">IA pratica • automacao • Next.js • SaaS</div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <a className="hover:text-white" href="#beneficios">
              Beneficios
            </a>
            <a className="hover:text-white" href="#conteudo">
              Projetos
            </a>
            <a className="hover:text-white" href="#modulos">
              Modulos
            </a>
            <a className="hover:text-white" href="#oferta">
              Oferta
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
