import { CourseCheckoutButton } from "@/components/landing/CourseCheckoutButton";
import { FadeIn } from "@/components/motion/fade-in";
import { Section } from "@/components/landing/section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const foundationsCheckoutUrl =
  process.env.NEXT_PUBLIC_FOUNDATIONS_CHECKOUT_URL ??
  "https://pay.hotmart.com/D106592020F?checkoutMode=10";

const modules = [
  "Introdução, apresentação e fundamentos de Information Retrieval",
  "Tokenização, OpenAI Tokenizer e sistemas de recuperação",
  "Modelos clássicos de recuperação de informação",
  "RAG mitigando riscos da IA",
  "Transformers: a arquitetura que revolucionou a IA",
  "Large Language Models (LLMs): como a IA aprende a conversar",
  "RAG: Retrieval-Augmented Generation",
  "Vector databases, embeddings e estratégias de indexação",
  "Engenharia de agentes de IA",
  "FastAPI: construindo APIs profissionais para IA",
  "Avaliação e qualidade em sistemas com LLMs",
  "Guardrails: segurança e confiabilidade em sistemas de IA",
];

const whoItsFor = [
  {
    title: "Para quem quer entender IA além do superficial",
    desc: "Saia do conteúdo solto e construa uma visão clara sobre como LLMs, RAG, embeddings e agentes funcionam de verdade.",
  },
  {
    title: "Para profissionais que buscam base técnica",
    desc: "Você vai conectar os conceitos certos antes de avançar para projetos mais robustos, consultorias ou produtos com IA.",
  },
  {
    title: "Para quem quer começar com investimento acessível",
    desc: "Uma formação introdutória, objetiva e com linguagem clara para entrar no universo da IA moderna sem complicação.",
  },
];

const benefits = [
  {
    title: "Base técnica sólida",
    desc: "Entenda recuperação de informação, contexto, embeddings, transformers, LLMs, APIs e agentes com clareza.",
  },
  {
    title: "RAG sem confusão",
    desc: "Aprenda como sistemas modernos consultam dados reais para responder com mais contexto e menos alucinação.",
  },
  {
    title: "Visão de arquitetura",
    desc: "Entenda como combinar modelo, banco vetorial, API, avaliação e mecanismos de segurança em aplicações reais.",
  },
  {
    title: "Preparação para o próximo nível",
    desc: "Esse curso organiza sua base para depois avançar com mais segurança para projetos, produtos e automações com IA.",
  },
  {
    title: "Conteúdo objetivo",
    desc: "Aulas diretas, sem excesso de teoria solta, para você compreender os conceitos que realmente importam.",
  },
  {
    title: "Condição de lançamento",
    desc: "Aproveite o valor especial de R$ 19,90 nesta fase inicial de lançamento do curso.",
  },
];

const pillars = [
  "Fundamentos de Information Retrieval",
  "LLMs, transformers e tokenização",
  "RAG, bancos vetoriais e embeddings",
  "FastAPI, avaliação e guardrails",
];

const faqs = [
  {
    q: "Este curso é introdutório ou avançado?",
    a: "Ele é introdutório com base técnica consistente. A proposta é te dar clareza real sobre os principais conceitos da IA moderna sem exigir conhecimento profundo prévio.",
  },
  {
    q: "Mesmo sem experiência com RAG ou LLMs, vou conseguir acompanhar?",
    a: "Sim. O conteúdo foi estruturado para organizar seu entendimento passo a passo, conectando retrieval, embeddings, LLMs, APIs e arquitetura de forma clara.",
  },
  {
    q: "O curso é muito teórico ou eu vou entender como isso se aplica na prática?",
    a: "Você vai aprender os fundamentos com contexto aplicado. A ideia não é só apresentar definições, mas te mostrar como esses conceitos sustentam sistemas reais com IA.",
  },
  {
    q: "Esse curso vale a pena para quem quer seguir na área de IA?",
    a: "Sim. Ele foi pensado para reduzir a confusão inicial e te dar a base que falta para estudar, construir e tomar decisões melhores nos próximos passos da sua jornada.",
  },
];

export const metadata = {
  title: "Plugando IA | Arquitetando o Futuro com LLMs e RAG",
  description:
    "Curso introdutório de fundamentos de IA com LLMs, RAG, embeddings, agentes, FastAPI, avaliação e guardrails.",
};

export default async function CursoFundamentosIaPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId("curso-fundamentos-ia", {
    preferEnvFallback: true,
  });

  return (
    <main className="relative overflow-hidden">
      <MetaPixelScript pixelId={metaPixelId} />
      <SalesPageTracker
        pageKey="curso-fundamentos-ia"
        pagePath="/curso-fundamentos-ia"
        pageTitle="Plugando IA | Arquitetando o Futuro com LLMs e RAG"
        metadata={{
          offerPrice: 19.9,
          currency: "BRL",
        }}
      />
      <SalesViewContentTracker
        pageKey="curso-fundamentos-ia"
        pagePath="/curso-fundamentos-ia"
        pageTitle="Plugando IA | Arquitetando o Futuro com LLMs e RAG"
        currency="BRL"
        value={19.9}
        metadata={{
          contentName: "Plugando IA: Arquitetando o Futuro com LLMs e RAG",
          contentType: "course",
        }}
      />
      <MetaPixelViewContent
        data={{
          content_name: "Plugando IA: Arquitetando o Futuro com LLMs e RAG",
          content_category: "Curso",
          content_type: "product",
          value: 19.9,
          currency: "BRL",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute right-[-180px] top-24 h-[360px] w-[360px] rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute left-[-120px] top-[520px] h-[300px] w-[300px] rounded-full bg-emerald-400/20 blur-3xl" />

      <Section className="pt-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr,0.8fr] md:items-center">
          <FadeIn>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
              Nova turma com condição especial de lançamento
            </p>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Plugando IA:{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Arquitetando o Futuro com LLMs e RAG
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
              Um curso direto ao ponto para você entender os fundamentos que sustentam aplicações modernas com IA:
              <strong className="text-white"> LLMs</strong>, <strong className="text-white">RAG</strong>,
              <strong className="text-white"> embeddings</strong>, <strong className="text-white">agentes</strong>,
              <strong className="text-white"> APIs com FastAPI</strong>, avaliação e guardrails.
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
              Se hoje você sente que o mercado fala de IA com muitas siglas e pouca clareza, este curso foi criado para
              te entregar uma base organizada, prática e profissional.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <CourseCheckoutButton
                eventData={{
                  content_name: "Plugando IA: Arquitetando o Futuro com LLMs e RAG",
                  content_category: "Curso",
                  value: 19.9,
                  currency: "BRL",
                }}
                href={foundationsCheckoutUrl}
                label="Quero comprar agora"
              />
              <a
                href="#modulos"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Ver módulos do curso
              </a>
            </div>

            <div className="mt-7 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-white">Curso introdutório</div>
                <div className="mt-1 text-xs text-white/60">baixo investimento para começar</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-white">Base conceitual forte</div>
                <div className="mt-1 text-xs text-white/60">sem pular fundamentos importantes</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-white">Aplicação no mundo real</div>
                <div className="mt-1 text-xs text-white/60">do entendimento à arquitetura</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-glow">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">
                  Condição especial de lançamento
                </div>
                <div className="mt-3 text-sm text-white/60 line-through">De R$ 67,00</div>
                <div className="mt-1 flex items-end gap-3">
                  <div className="text-5xl font-semibold tracking-tight text-white">R$ 19,90</div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    valor promocional
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  Valor especial para esta fase inicial do curso. Ideal para quem quer construir base técnica antes de
                  avançar para projetos, automações e aplicações mais complexas com IA.
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                {pillars.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100/90">
                Turma inaugural com acesso imediato e conteúdo organizado para quem quer entrar em IA com mais clareza.
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="section-border" id="para-quem">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              O curso certo para quem quer parar de ouvir siglas e começar a entender a estrutura da IA moderna.
            </h2>
            <p className="mt-4 text-white/75">
              Se você vê o mercado falando de LLM, RAG, embeddings e agentes, mas sente que falta uma base clara, essa
              formação foi feita para você.
            </p>
          </div>
          <div className="mt-10">
            <FeatureGrid items={whoItsFor} />
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="beneficios">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">O que você vai levar deste curso</h2>
            <p className="mt-4 text-white/75">
              Mais do que definições soltas: você vai ganhar repertório para entender e desenhar sistemas com IA com
              muito mais segurança.
            </p>
          </div>
          <div className="mt-10">
            <FeatureGrid items={benefits} />
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="modulos">
        <FadeIn>
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Conteúdo do curso: do fundamento à arquitetura
              </h2>
              <p className="mt-4 text-white/75">
                Um mapa objetivo para você entender como os blocos da IA moderna se conectam.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              {modules.map((module, index) => (
                <div
                  key={module}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-base font-semibold text-white">
                      Módulo {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Plugando IA Foundations</div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">{module}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="oferta">
        <FadeIn>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-[1fr,0.9fr] md:items-start">
              <div>
                <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                  Uma forma acessível de começar a estudar IA do jeito certo
                </h2>
                <p className="mt-4 text-white/75">
                  Este curso foi pensado para gerar clareza rápida. Você começa com um investimento leve, entende a
                  base e fica pronto para aprofundar depois em projetos mais avançados.
                </p>

                <div className="mt-6 grid gap-4">
                  {[
                    "12 módulos com os conceitos centrais da IA moderna",
                    "Condição especial de lançamento por R$ 19,90",
                    "Conteúdo pensado para reduzir confusão e acelerar entendimento",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/75">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div
                id="quero-entrar"
                className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-glow"
              >
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  Oferta atual
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-base-950/40 p-5">
                  <div className="text-sm text-white/65">Investimento</div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <div className="text-4xl font-semibold tracking-tight text-white">R$ 19,90</div>
                    <div className="text-sm text-white/60">pagamento único</div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    Condição especial de lançamento para a turma inicial. Assim que o checkout estiver conectado, esta
                    página já estará pronta para converter.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-white/75">
                  {[
                    "Fundamentos de Information Retrieval",
                    "Arquitetura de LLMs e RAG",
                    "Embeddings, vetores, APIs e agentes",
                    "Avaliação e guardrails para sistemas de IA",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-cyan-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100/90">
                  Se você quer entrar em IA com direção, esse é o melhor momento para aproveitar o valor de lançamento.
                </div>

                <div className="mt-7">
                  <CourseCheckoutButton
                    eventData={{
                      content_name: "Plugando IA: Arquitetando o Futuro com LLMs e RAG",
                      content_category: "Curso",
                      value: 19.9,
                      currency: "BRL",
                    }}
                    href={foundationsCheckoutUrl}
                    label="Quero comprar agora"
                  />
                  <div className="mt-3 text-center text-xs text-white/55">
                    Link provisoriamente apontando para a própria página até o checkout ser definido.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border pb-16" id="faq">
        <FadeIn>
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Dúvidas rápidas</h2>
              <p className="mt-4 text-white/75">As respostas que mais ajudam antes de tomar a decisão de entrar.</p>
            </div>

            <div className="mt-10 grid gap-4">
              {faqs.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-white/10 bg-white/5 p-6 open:bg-white/10">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-6">
                      <div className="text-base font-semibold">{item.q}</div>
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition group-open:rotate-45">
                        +
                      </div>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>
    </main>
  );
}
