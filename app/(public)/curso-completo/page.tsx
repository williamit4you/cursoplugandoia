import Image from "next/image";
import Link from "next/link";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import { CTAButton } from "@/components/landing/cta-button";
import { Section } from "@/components/landing/section";
import { FadeIn } from "@/components/motion/fade-in";
import {
  MobileStickyCTA,
  LaunchCountdown,
  SectionViewTracker,
  TrackedAccordion,
  TrackedCheckoutButton,
} from "@/components/course-completo/interactive";
import {
  aiPillars,
  architectureTopics,
  audienceItems,
  courseConfig,
  curriculumGroups,
  faq,
  getCourseRuntimeConfig,
  howItWorksItems,
  integrationTopics,
  journeySteps,
  objections,
  offerChecklist,
  problemCards,
  projects,
  proofItems,
  quickBenefits,
  roadmap,
  transformationItems,
} from "@/lib/courseCompletoConfig";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

export const metadata = {
  title: "Formacao Desenvolvedor Full Stack + IA | Plugando IA",
  description:
    "Aprenda programacao do zero e avance por C#, .NET, Arquitetura de Software, Next.js, AWS, automacoes, SaaS e Inteligencia Artificial atraves de projetos praticos.",
  alternates: {
    canonical: "/curso-completo",
  },
  openGraph: {
    title: "Formacao Desenvolvedor Full Stack + IA | Plugando IA",
    description:
      "Aprenda programacao do zero e avance por C#, .NET, Arquitetura de Software, Next.js, AWS, automacoes, SaaS e Inteligencia Artificial atraves de projetos praticos.",
    url: "/curso-completo",
    siteName: "Plugando IA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Formacao Desenvolvedor Full Stack + IA | Plugando IA",
    description:
      "Aprenda programacao do zero e avance por C#, .NET, Arquitetura de Software, Next.js, AWS, automacoes, SaaS e Inteligencia Artificial atraves de projetos praticos.",
  },
};

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "info" | "success";
}) {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-slate-200",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const alignment = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl";

  return (
    <div className={alignment}>
      {eyebrow ? <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</div> : null}
      <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-white md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-pretty text-base leading-relaxed text-slate-300 md:text-lg">{description}</p> : null}
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,30,48,0.9),rgba(16,24,39,0.9))] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{description}</p>
    </div>
  );
}

function TechnologyBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
      {children}
    </span>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed text-slate-200">
      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(34,197,94,0.6)]" />
      <span>{children}</span>
    </li>
  );
}

function PriceBox({
  title,
  regularPrice,
  activePrice,
  launchActive,
  cta,
}: {
  title: string;
  regularPrice: number;
  activePrice: number;
  launchActive: boolean;
  cta: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,30,48,0.95),rgba(11,18,32,0.95))] p-6 shadow-[0_25px_70px_rgba(4,12,28,0.45)]">
      <Badge tone="warning">{launchActive ? "CONDICAO DE LANCAMENTO" : "VALOR ATUAL"}</Badge>
      <div className="mt-5 text-sm uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <div className="mt-4 text-sm text-slate-400 line-through">De R$ {regularPrice.toFixed(0)}</div>
      <div className="mt-2 text-5xl font-extrabold tracking-tight text-white">R$ {activePrice.toFixed(2).replace(".", ",")}</div>
      {launchActive ? <div className="mt-2 text-sm text-amber-300">Condição disponível até 31/08/2026.</div> : null}
      <div className="mt-6">{cta}</div>
    </div>
  );
}

export default async function CursoCompletoPage() {
  const config = getCourseRuntimeConfig();
  const metaPixelId = await resolveSalesPageMetaPixelId(courseConfig.pageKey, {
    preferEnvFallback: true,
  });
  const priceLabel = `R$ ${config.activePrice.toFixed(2).replace(".", ",")}`;
  const eventData = {
    content_name: config.name,
    content_category: "Curso",
    content_type: "product",
    value: config.activePrice,
    currency: "BRL",
  };

  return (
    <main className="relative overflow-hidden bg-[#070b14] text-[#f8fafc]">
      <MetaPixelScript pixelId={metaPixelId || undefined} />
      <SalesPageTracker
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        metadata={{
          offerPrice: config.activePrice,
          currency: "BRL",
          offerName: config.name,
        }}
      />
      <SalesViewContentTracker
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        currency="BRL"
        value={config.activePrice}
        metadata={{
          contentName: config.name,
          contentType: "course",
        }}
      />
      <MetaPixelViewContent data={eventData} />
      <SectionViewTracker
        selectorId="roadmap"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        eventName="roadmap_view"
      />
      <SectionViewTracker
        selectorId="architecture"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        eventName="architecture_section_view"
      />
      <SectionViewTracker
        selectorId="offer"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        eventName="offer_view"
      />
      <SectionViewTracker
        selectorId="pricing"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        eventName="pricing_view"
      />

      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.18]" />
      <div className="pointer-events-none absolute left-[-12%] top-24 h-[420px] w-[420px] rounded-full bg-[#7c3aed]/18 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] top-16 h-[420px] w-[420px] rounded-full bg-[#2563eb]/16 blur-3xl" />
      <div className="pointer-events-none absolute left-[35%] top-[760px] h-[320px] w-[320px] rounded-full bg-[#06b6d4]/10 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/curso-completo" className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
            Plugando IA
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#formacao" className="transition hover:text-white">
              Formacao
            </a>
            <a href="#trilha" className="transition hover:text-white">
              Trilha
            </a>
            <a href="#projetos" className="transition hover:text-white">
              Projetos
            </a>
            <a href="#conteudo" className="transition hover:text-white">
              Conteudo
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>
          <div className="hidden md:block">
            <TrackedCheckoutButton
              href={config.checkoutUrl}
              label="QUERO COMECAR"
              pageKey={config.pageKey}
              pagePath={config.pagePath}
              pageTitle={config.pageTitle}
              value={config.activePrice}
              currency="BRL"
              customEvent="header_cta_click"
              eventData={eventData}
            />
          </div>
          <div className="md:hidden">
            <CTAButton href="#pricing" label="QUERO COMECAR" variant="secondary" />
          </div>
        </div>
      </header>

      <Section className="pt-8 md:pt-12" id="formacao">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-10 md:grid-cols-[1.05fr,0.95fr] md:items-center">
            <FadeIn>
              <Badge tone="warning">NOVA FORMACAO 2026</Badge>
              {config.launchActive ? (
                <div className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                  PRECO DE LANCAMENTO ATE 31/08/2026
                </div>
              ) : null}

              <h1 className="mt-5 max-w-4xl text-balance text-[2.5rem] font-extrabold leading-[1.02] tracking-tight text-white md:text-[4.2rem]">
                Aprenda programacao do zero e evolua ate construir{" "}
                <span className="bg-gradient-to-r from-[#7c3aed] via-[#2563eb] to-[#06b6d4] bg-clip-text text-transparent">
                  aplicacoes, arquiteturas e solucoes com IA
                </span>
                .
              </h1>

              <p className="mt-5 max-w-3xl text-pretty text-base leading-relaxed text-slate-300 md:text-xl">
                Uma trilha completa para voce comecar pelos fundamentos, dominar C# e .NET, avancar por Arquitetura de
                Software, Next.js e AWS e chegar a criacao de automacoes, SaaS e Agentes de Inteligencia Artificial.
              </p>

              <ul className="mt-7 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                {quickBenefits.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </ul>

              <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label={config.ctaLabels.launch}
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  value={config.activePrice}
                  currency="BRL"
                  customEvent="hero_cta_click"
                  eventData={eventData}
                />
                <a
                  href="#trilha"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {config.ctaLabels.secondary}
                </a>
              </div>

              <div className="mt-3 text-sm text-amber-300">{config.launchActive ? `${priceLabel} ate 31/08` : priceLabel}</div>

              <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span>Acesso online.</span>
                <span>Estude no seu ritmo.</span>
              </div>
            </FadeIn>

            <FadeIn delayMs={100}>
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,30,48,0.88),rgba(11,18,32,0.96))] p-5 shadow-[0_30px_90px_rgba(2,8,23,0.52)]">
                <div className="grid gap-5 lg:grid-cols-[1fr,0.9fr]">
                  <div className="rounded-[24px] border border-white/10 bg-[#0b1220] p-5">
                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Trilha visual</div>
                    <div className="mt-5 space-y-3">
                      {["C#", ".NET", "Arquitetura", "Next.js", "AWS", "SaaS", "AI Agent"].map((step, index) => (
                        <div key={step} className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white">
                            {index + 1}
                          </div>
                          <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <div className="text-xs uppercase tracking-[0.18em] text-amber-300">Preco de lancamento</div>
                      <div className="mt-3 text-sm text-slate-400 line-through">De R$ 699</div>
                      <div className="mt-1 text-4xl font-extrabold tracking-tight text-white">{priceLabel}</div>
                      {config.launchActive ? <div className="mt-2 text-sm text-amber-300">ate 31/08/2026</div> : null}
                    </div>

                    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
                      <Image
                        src="/plugando-ia-hero.svg"
                        alt="Visual de stack, codigo e automacao do ecossistema Plugando IA"
                        width={1200}
                        height={720}
                        priority
                        className="h-auto w-full"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {["C#", ".NET", "Next.js", "AWS", "n8n", "AI"].map((item) => (
                        <TechnologyBadge key={item}>{item}</TechnologyBadge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </Section>

      <Section className="section-border" id="launch">
        <FadeIn>
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[1.1fr,0.9fr] md:px-8">
            <div>
              <SectionHeading
                eyebrow="CONDICAO DE LANCAMENTO"
                title="Uma nova formacao, uma nova fase e um prazo real."
                description="O lancamento existe por um motivo concreto: a reorganizacao dos conteudos em uma unica jornada, a adicao de Fundamentos de Arquitetura de Software e a expansao planejada da trilha."
              />
              <div className="mt-6 rounded-[24px] border border-amber-400/15 bg-amber-400/10 p-5 text-sm leading-relaxed text-amber-100">
                Entre durante esta fase de evolucao da nova formacao e garanta a condicao especial de lancamento como
                aluno fundador.
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#0b1220] p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                CONDICAO DE LANCAMENTO TERMINA EM:
              </div>
              <div className="mt-6">
                {config.launchActive ? (
                  <LaunchCountdown endDate={config.launchEndDate} />
                ) : (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                    O periodo de lancamento terminou em 31/08/2026 as 23:59:59, horario de Sao Paulo.
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="trilha">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading eyebrow="UMA FORMACAO. UMA TRILHA." title="Pare de estudar tecnologias isoladas." description="Siga uma sequencia que mostra o que aprender, em qual ordem e como as pecas se conectam." align="center" />
            <div className="mt-10 overflow-x-auto pb-2">
              <div className="flex min-w-max items-center gap-3">
                {journeySteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
                      {step}
                    </div>
                    {index < journeySteps.length - 1 ? <span className="text-cyan-300">→</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="problema">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading
              eyebrow="SE VOCE ESTA COMECANDO..."
              title="O problema nao e falta de conteudo. E nao saber o que estudar primeiro."
              description="C#, JavaScript, .NET, APIs, banco de dados, AWS, Next.js, n8n, agentes, IA... quando voce esta comecando, parece que precisa dominar tudo de uma vez. Resultado: voce pula de tutorial em tutorial, aprende conceitos isolados e continua sem enxergar como um sistema completo funciona."
              align="center"
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {problemCards.map((item) => (
                <FeatureCard key={item.title} title={item.title} description={item.description} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <div className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Voce nao precisa de mais conteudo aleatorio.
              </div>
              <div className="mt-2 text-lg text-cyan-300">Precisa de uma sequencia.</div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="solucao">
        <FadeIn>
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[1.05fr,0.95fr] md:px-8">
            <div>
              <SectionHeading
                eyebrow="A FORMACAO"
                title="Um caminho organizado do seu primeiro codigo ate aplicacoes com Inteligencia Artificial."
                description="A Formacao Desenvolvedor Full Stack + IA reune diferentes competencias em uma sequencia logica. Cada etapa cria a base para a proxima."
              />
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#0b1220] p-6">
              <div className="grid gap-4">
                {transformationItems.map((item) => (
                  <div key={item} className="rounded-[20px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="roadmap">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading
              eyebrow="ROADMAP"
              title="Da base tecnica ao produto: a progressao que organiza a jornada."
              description="Cada etapa responde a uma duvida comum de quem esta comecando e mostra como as tecnologias se conectam dentro de sistemas reais."
              align="center"
            />
            <div className="mt-12 grid gap-5">
              {roadmap.map((item, index) => (
                <div
                  key={item.title}
                  className="grid gap-4 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,30,48,0.92),rgba(16,24,39,0.92))] p-6 md:grid-cols-[120px,1fr,220px] md:items-center"
                >
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Etapa {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{item.title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
                  </div>
                  <div className="text-sm text-slate-300">{item.tech ? `Tecnologia: ${item.tech}` : "Progressao de estrutura e visao de sistema."}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="architecture">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading
              eyebrow="NOVO NA FORMACAO"
              title="Fundamentos de Arquitetura de Software"
              description="Depois de aprender a escrever codigo, surge uma pergunta ainda mais importante: como organizar um sistema corretamente? Esta nova trilha introduz os principios que ajudam voce a entender por que aplicacoes sao estruturadas de determinadas maneiras."
            />
            <div className="mt-6">
              <Badge tone="info">DISPONIVEL AGORA</Badge>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {architectureTopics.map((topic) => (
                <div key={topic.title} className="rounded-[26px] border border-white/10 bg-[#0b1220] p-6">
                  <div className="text-xl font-bold text-white">{topic.title}</div>
                  <ul className="mt-4 space-y-3">
                    {topic.items.map((item) => (
                      <CheckItem key={item}>{item}</CheckItem>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-[1fr,1fr]">
              <div className="rounded-[26px] border border-white/10 bg-[#0b1220] p-6">
                <div className="text-xl font-bold text-white">Como sistemas conversam</div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {integrationTopics.map((item) => (
                    <div key={item.title} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-amber-400/15 bg-amber-400/10 p-6">
                <Badge tone="warning">EM EXPANSAO</Badge>
                <div className="mt-5 text-2xl font-extrabold tracking-tight text-white">E essa trilha vai continuar evoluindo.</div>
                <p className="mt-4 text-sm leading-relaxed text-amber-100">
                  A proxima evolucao planejada sera levar esses fundamentos para cenarios mais avancados de arquitetura
                  em Cloud.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="projetos">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading eyebrow="APRENDA CONSTRUINDO" title="Voce nao vai apenas assistir. Vai construir." description="Cada projeto transforma tecnologia em contexto. Em vez de estudar ferramentas soltas, voce entende onde cada peca entra." align="center" />
            <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <div key={project.title} className="rounded-[26px] border border-white/10 bg-[#0b1220] p-6">
                  <div className="text-xl font-bold text-white">{project.title}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{project.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.badges.map((badge) => (
                      <TechnologyBadge key={badge}>{badge}</TechnologyBadge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="transformacao">
        <FadeIn>
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[0.95fr,1.05fr] md:px-8">
            <div className="rounded-[28px] border border-white/10 bg-[#0b1220] p-6">
              <SectionHeading
                eyebrow="O QUE MUDA"
                title="De confusao para clareza de jornada."
                description="A proposta da formacao e fazer voce entender a progressao. O foco nao e decorar siglas. E saber em que ordem aprender e como transformar estudo em construcao."
              />
            </div>
            <div className="grid gap-4">
              {[
                "Nao sei por onde comecar → Agora existe uma primeira etapa clara.",
                "Preciso aprender tudo? → Nao. Existe uma ordem recomendada.",
                "Como isso se conecta? → A trilha mostra backend, frontend, cloud, automacao e IA dentro da mesma visao.",
                "IA substitui a base? → Nao. A base permite usar IA com criterio.",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="programacao-ia">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading
              eyebrow="PROGRAMACAO + IA"
              title="Aprenda a programar e aprenda a construir com IA."
              description="A IA entra como acelerador. Ela ajuda voce a construir mais rapido, mas nao substitui fundamentos, entendimento de arquitetura nem capacidade de evoluir codigo."
              align="center"
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {aiPillars.map((item) => (
                <FeatureCard key={item.title} title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="conteudo">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading
              eyebrow="CURRICULO"
              title="Conteudo organizado em vez de catalogo solto."
              description="A pagina apresenta o que ja esta disponivel e o que esta em expansao, sem prometer como pronto o que ainda esta evoluindo."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {curriculumGroups.map((group) => (
                <div key={group.title} className="rounded-[26px] border border-white/10 bg-[#0b1220] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xl font-bold text-white">{group.title}</div>
                    <Badge tone={group.status === "Disponivel agora" ? "success" : "warning"}>{group.status.toUpperCase()}</Badge>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {group.items.map((item) => (
                      <div key={item} className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="para-quem">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading eyebrow="PARA QUEM E" title="Pensada principalmente para iniciantes em programacao." description="A pagina foi organizada para conduzir quem esta perdido em meio a tecnologias, frameworks e promessas confusas." align="center" />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {audienceItems.map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-[#0b1220] px-5 py-5 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="como-funciona">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading eyebrow="COMO FUNCIONA" title="Voce entra para seguir uma progressao, nao para acumular aulas." description="A experiencia comercial e didatica da pagina foi estruturada para reforcar clareza, sequencia e aplicacao." />
            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              {howItWorksItems.map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-[#0b1220] px-5 py-5 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="instrutor">
        <FadeIn>
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[0.9fr,1.1fr] md:px-8">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220]">
              <Image
                src="/imersao-ia-tech-stack.svg"
                alt="Mapa tecnico do ecossistema Plugando IA"
                width={1200}
                height={720}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#0b1220] p-6">
              <SectionHeading
                eyebrow="QUEM ORGANIZOU A TRILHA"
                title="Uma formacao pensada para reduzir a confusao de quem esta comecando."
                description="Eu organizei esta formacao porque aprender desenvolvimento ficou ainda mais confuso com a chegada de novas tecnologias e da Inteligencia Artificial. A ideia e mostrar uma sequencia clara, comecando pelos fundamentos e avancando ate aplicacoes completas."
              />
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="provas">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading
              eyebrow="PROVAS"
              title="Sem depoimentos inventados. Aqui a prova vem do que ja existe."
              description="Como nao foram encontrados depoimentos reais suficientes no projeto, a secao usa assets e evidencias visuais existentes no repositorio para tornar a oferta concreta sem fabricar prova social."
              align="center"
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {proofItems.map((item, index) => (
                <div key={item.title} className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0b1220]">
                  <div className="overflow-hidden border-b border-white/10 bg-white/5">
                    <Image src={item.image} alt={item.title} width={1200} height={720} className="h-auto w-full" />
                  </div>
                  <div className="p-6">
                    <div className="text-lg font-bold text-white">{item.title}</div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>
                    <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">Prova visual {index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
              TODO: conectar depoimentos reais quando houver material validado no projeto.
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="motivo-lancamento">
        <FadeIn>
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[1.05fr,0.95fr] md:px-8">
            <div>
              <SectionHeading
                eyebrow="POR QUE ESTE VALOR AGORA?"
                title="A formacao esta entrando em uma nova fase."
                description="O que antes existia como conteudos separados esta sendo reorganizado em uma unica formacao. Alem das trilhas ja disponiveis, novos conteudos de Arquitetura de Software estao sendo incorporados e a formacao continuara evoluindo."
              />
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Durante esta fase de lancamento, voce pode entrar pela condicao especial de R$ 149,90. Essa condicao
                termina em 31 de agosto de 2026.
              </p>
            </div>
            <div className="rounded-[28px] border border-amber-400/15 bg-amber-400/10 p-6">
              <Badge tone="warning">CONDICAO ALUNO FUNDADOR</Badge>
              <div className="mt-5 text-sm text-amber-100">Preco oficial</div>
              <div className="mt-1 text-lg text-amber-200 line-through">R$ 699</div>
              <div className="mt-4 text-sm text-amber-100">Preco de lancamento</div>
              <div className="mt-1 text-5xl font-extrabold tracking-tight text-white">R$ 149,90</div>
              <div className="mt-2 text-sm text-amber-100">ate 31/08/2026</div>
              <div className="mt-6">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="QUERO ENTRAR NA FORMACAO"
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  value={config.activePrice}
                  currency="BRL"
                  customEvent="launch_cta_click"
                  eventData={eventData}
                />
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="offer">
        <FadeIn>
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHeading
              eyebrow="OFERTA"
              title="Uma unica formacao para acompanhar sua evolucao."
              description="O foco da oferta e acompanhar a jornada do primeiro codigo ate a construcao de aplicacoes, arquitetura, cloud, automacoes e IA."
              align="center"
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {offerChecklist.map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-[#0b1220] px-5 py-5 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="pricing">
        <FadeIn>
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[0.95fr,1.05fr] md:px-8">
            <div>
              <SectionHeading
                eyebrow="PRECO"
                title="Clareza de oferta, prazo real e checkout direto."
                description="A pagina centraliza o checkout em uma unica URL, preserva parametros de campanha quando possivel e evita passos intermediarios antes da compra."
              />
              <ul className="mt-6 space-y-3">
                <CheckItem>Preco oficial: R$ 699.</CheckItem>
                <CheckItem>Preco de lancamento: R$ 149,90.</CheckItem>
                <CheckItem>Prazo absoluto: 31/08/2026 as 23:59:59, horario de Sao Paulo.</CheckItem>
                <CheckItem>Sem contador fake, sem escassez inventada e sem reinicio artificial.</CheckItem>
              </ul>
            </div>
            <PriceBox
              title={config.name}
              regularPrice={config.regularPrice}
              activePrice={config.activePrice}
              launchActive={config.launchActive}
              cta={
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label={config.ctaLabels.launch}
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  value={config.activePrice}
                  currency="BRL"
                  customEvent="pricing_cta_click"
                  eventData={eventData}
                />
              }
            />
          </div>
        </FadeIn>
      </Section>

      {typeof config.guaranteeDays === "number" ? (
        <Section className="section-border" id="garantia">
          <FadeIn>
            <div className="mx-auto max-w-7xl px-5 md:px-8">
              <SectionHeading
                eyebrow="GARANTIA"
                title={`Voce conta com ${config.guaranteeDays} dias de garantia.`}
                description="Esta secao so aparece quando a configuracao comercial real estiver definida."
              />
            </div>
          </FadeIn>
        </Section>
      ) : null}

      <Section className="section-border" id="objecoes">
        <FadeIn>
          <div className="mx-auto max-w-5xl px-5 md:px-8">
            <SectionHeading eyebrow="TALVEZ VOCE ESTEJA PENSANDO..." title="As duvidas mais comuns antes de entrar." align="center" />
            <div className="mt-10 grid gap-4">
              {objections.map((item) => (
                <TrackedAccordion
                  key={item.question}
                  title={item.question}
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  eventName="curriculum_open"
                >
                  {item.answer}
                </TrackedAccordion>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border pb-24 md:pb-16" id="faq">
        <FadeIn>
          <div className="mx-auto max-w-5xl px-5 md:px-8">
            <SectionHeading eyebrow="FAQ" title="Respostas para a decisao de compra." align="center" />
            <div className="mt-10 grid gap-4">
              {faq.map((item) => (
                <TrackedAccordion
                  key={item.question}
                  title={item.question}
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  eventName="faq_open"
                >
                  {item.answer}
                </TrackedAccordion>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border pb-24" id="final-cta">
        <FadeIn>
          <div className="mx-auto max-w-5xl px-5 text-center md:px-8">
            <SectionHeading
              eyebrow="SEU PROXIMO PASSO"
              title="Voce nao precisa dominar tudo hoje. Precisa comecar pela etapa certa."
              description="Comece pelos fundamentos e avance projeto por projeto ate aplicacoes, Cloud e Inteligencia Artificial."
              align="center"
            />
            <div className="mt-6 text-sm text-slate-400 line-through">De R$ 699</div>
            <div className="mt-2 text-5xl font-extrabold tracking-tight text-white">R$ 149,90</div>
            <div className="mt-2 text-sm text-amber-300">ate 31/08</div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedCheckoutButton
                href={config.checkoutUrl}
                label={config.ctaLabels.primary}
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
                value={config.activePrice}
                currency="BRL"
                customEvent="final_cta_click"
                eventData={eventData}
              />
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Rever a oferta
              </a>
            </div>
          </div>
        </FadeIn>
      </Section>

      <footer className="section-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <div className="text-white">Plugando IA</div>
            <div className="mt-2 text-xs text-slate-500">
              Os resultados dependem do estudo, pratica e aplicacao individual.
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em]">
            <Link href="/terms" className="transition hover:text-white">
              Termos
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacidade
            </Link>
            <a href="#faq" className="transition hover:text-white">
              Contato
            </a>
          </div>
        </div>
      </footer>

      <MobileStickyCTA
        title={config.shortName}
        priceLabel={priceLabel}
        href={config.checkoutUrl}
        label={config.ctaLabels.compact}
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        value={config.activePrice}
        currency="BRL"
      />
    </main>
  );
}
