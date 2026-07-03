import { CTAButton } from "@/components/landing/cta-button";
import { FadeIn } from "@/components/motion/fade-in";
import { Section } from "@/components/landing/section";
import { FeatureGrid } from "@/components/landing/feature-grid";

const foundationsCheckoutUrl =
  process.env.NEXT_PUBLIC_FOUNDATIONS_CHECKOUT_URL ?? "#quero-entrar";

const modules = [
  "Introducao, apresentacao e fundamentos de Information Retrieval",
  "Tokenizacao, OpenAI Tokenizer e sistemas de recuperacao",
  "Modelos classicos de recuperacao de informacao",
  "RAG mitigando riscos da IA",
  "Transformers: a arquitetura que revolucionou a IA",
  "Large Language Models: como a IA aprende a conversar",
  "RAG: Retrieval-Augmented Generation",
  "Vector databases, embeddings e estrategias de indexacao",
  "Engenharia de agentes de IA",
  "FastAPI: construindo APIs profissionais para IA",
  "Avaliacao e qualidade em sistemas com LLMs",
  "Guardrails: seguranca e confiabilidade em sistemas de IA",
];

const whoItsFor = [
  {
    title: "Para quem esta comecando em IA aplicada",
    desc: "Entenda os fundamentos certos antes de sair copiando projeto pronto sem contexto.",
  },
  {
    title: "Para devs que querem clareza tecnica",
    desc: "Voce vai ligar os pontos entre LLMs, RAG, embeddings, APIs, agentes e guardrails.",
  },
  {
    title: "Para quem quer entrar com baixo risco",
    desc: "E um produto de entrada, com preco acessivel, para voce validar seu interesse e aprender rapido.",
  },
];

const benefits = [
  {
    title: "Base tecnica de verdade",
    desc: "Voce entende como funciona recuperacao, contexto, embeddings, transformers, LLMs e agentes.",
  },
  {
    title: "RAG sem misterio",
    desc: "Aprenda o que precisa existir para um sistema responder com mais contexto e menos alucinacao.",
  },
  {
    title: "Visao de arquitetura",
    desc: "Entenda como juntar modelo, banco vetorial, API, avaliacao e regras de seguranca.",
  },
  {
    title: "Preparacao para projetos maiores",
    desc: "Esse curso prepara o terreno para depois avancar para sistemas completos e produtos vendaveis.",
  },
  {
    title: "Aulas objetivas",
    desc: "Conteudo enxuto, direto e focado em te dar repertorio para aplicar com mais confianca.",
  },
  {
    title: "Preco de entrada",
    desc: "Oferta pensada para ser facil de testar: apenas R$ 19,90 para entrar no ecossistema Plugando IA.",
  },
];

export const metadata = {
  title: "Plugando IA | Fundamentos de IA, LLMs e RAG",
  description:
    "Curso introdutorio de fundamentos de IA com LLMs, RAG, embeddings, agentes, FastAPI, avaliacao e guardrails.",
};

export default function CursoFundamentosIaPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute right-[-180px] top-24 h-[360px] w-[360px] rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute left-[-120px] top-[520px] h-[300px] w-[300px] rounded-full bg-emerald-400/20 blur-3xl" />

      <Section className="pt-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr,0.8fr] md:items-center">
          <FadeIn>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
              Novo curso de entrada por R$ 19,90
            </p>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Plugando IA:{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Arquitetando o Futuro com LLMs e RAG
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
              Um curso direto para voce entender os fundamentos que sustentam aplicacoes modernas com IA:{" "}
              <strong className="text-white">LLMs</strong>, <strong className="text-white">RAG</strong>,{" "}
              <strong className="text-white">embeddings</strong>, <strong className="text-white">agentes</strong>,{" "}
              <strong className="text-white">APIs com FastAPI</strong>, avaliacao e guardrails.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <CTAButton href={foundationsCheckoutUrl} label="Quero garantir por R$ 19,90" />
              <a
                href="#modulos"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Ver modulos do curso
              </a>
            </div>

            <div className="mt-7 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-white">Curso de entrada</div>
                <div className="mt-1 text-xs text-white/60">baixo investimento para comecar</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-white">Base conceitual forte</div>
                <div className="mt-1 text-xs text-white/60">sem pular fundamentos importantes</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="text-white">Foco em aplicacao real</div>
                <div className="mt-1 text-xs text-white/60">do entendimento a arquitetura</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-glow">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Oferta de lancamento</div>
                <div className="mt-3 text-sm text-white/60 line-through">De R$ 67,00</div>
                <div className="mt-1 flex items-end gap-3">
                  <div className="text-5xl font-semibold tracking-tight text-white">R$ 19,90</div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    ticket de entrada
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  Ideal para quem quer entrar no universo de IA com clareza tecnica antes de avancar para automacoes,
                  agentes comerciais e produtos maiores.
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                {[
                  "Introducao a Information Retrieval",
                  "LLMs, transformers e tokenizacao",
                  "RAG, bancos vetoriais e embeddings",
                  "FastAPI, avaliacao e guardrails",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="section-border" id="para-quem">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              O curso certo para quem quer parar de ouvir siglas e comecar a entender a estrutura da IA moderna.
            </h2>
            <p className="mt-4 text-white/75">
              Se voce ve o mercado falando de LLM, RAG, embeddings e agentes, mas sente que falta uma base clara, essa
              oferta foi feita para voce.
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
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">O que voce vai levar desse curso</h2>
            <p className="mt-4 text-white/75">
              Mais do que definicoes soltas: voce vai ganhar repertorio para entender e desenhar sistemas com IA com
              muito mais seguranca.
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
                Conteudo do curso: do fundamento a arquitetura
              </h2>
              <p className="mt-4 text-white/75">
                Um mapa objetivo para voce entender como os blocos de IA moderna se conectam.
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
                      Modulo {String(index + 1).padStart(2, "0")}
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
                  Uma entrada acessivel para comecar a estudar IA do jeito certo
                </h2>
                <p className="mt-4 text-white/75">
                  Esse produto foi pensado para gerar clareza rapida. Voce entra com um valor leve, entende a base e
                  fica pronto para aprofundar depois em projetos mais avancados.
                </p>

                <div className="mt-6 grid gap-4">
                  {[
                    "Curso introdutorio com foco em LLMs, RAG e arquitetura",
                    "Preco promocional de R$ 19,90",
                    "Perfeito para campanhas de Meta Ads com ticket de entrada",
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
                    <div className="text-sm text-white/60">pagamento unico</div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    O checkout ainda sera conectado. A pagina ja esta pronta para receber o link quando voce me passar.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-white/75">
                  {[
                    "Fundamentos de Information Retrieval",
                    "Arquitetura de LLMs e RAG",
                    "Embeddings, vetores, APIs e agentes",
                    "Avaliacao e guardrails para sistemas de IA",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-cyan-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-7">
                  <CTAButton href={foundationsCheckoutUrl} label="Quero entrar na turma" />
                  <div className="mt-3 text-center text-xs text-white/55">
                    Link provisoriamente apontando para a propria pagina ate o checkout ser definido.
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
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Duvidas rapidas</h2>
              <p className="mt-4 text-white/75">As respostas que mais ajudam antes de subir campanha.</p>
            </div>

            <div className="mt-10 grid gap-4">
              {[
                {
                  q: "Esse curso e tecnico ou introdutorio?",
                  a: "Ele e introdutorio com pegada tecnica. A ideia e te dar base real para entender os blocos da IA aplicada.",
                },
                {
                  q: "Ele serve para quem ainda nao trabalhou com RAG?",
                  a: "Sim. Ele justamente organiza o mapa mental de retrieval, embeddings, LLMs e arquitetura para voce nao aprender tudo picado.",
                },
                {
                  q: "Posso anunciar esse curso como produto de entrada?",
                  a: "Sim. O ticket de R$ 19,90 faz sentido como front-end offer para captar mais gente e depois trabalhar upsell para o curso maior.",
                },
              ].map((item) => (
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
