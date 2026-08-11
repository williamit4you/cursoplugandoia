import Image from "next/image";
import Link from "next/link";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import { FadeIn } from "@/components/motion/fade-in";
import {
  LaunchCountdown,
  MobileStickyCTA,
  SectionViewTracker,
  TrackedAccordion,
  TrackedCheckoutButton,
} from "@/components/course-completo/interactive";
import {
  architectureTerms,
  architectureTopics,
  beginnerPath,
  courseNovaConfig,
  curriculum,
  faq,
  getCourseNovaRuntimeConfig,
  heroBenefits,
  offerItems,
  productShowcase,
  projects,
} from "@/lib/courseNovaConfig";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

export const metadata = {
  title: "Formação Full Stack + IA | Programação para Iniciantes",
  description:
    "Você não precisa aprender tudo. Precisa saber por onde começar. Comece do zero e evolua de fundamentos, backend e frontend até projetos com IA.",
  alternates: {
    canonical: "/curso-novo",
  },
  openGraph: {
    title: "Formação Full Stack + IA | Programação para Iniciantes",
    description:
      "Comece do zero com uma sequência que faz sentido. Fundamentos, backend, frontend, cloud, automação e IA em uma mesma evolução.",
    url: "/curso-novo",
    siteName: "Plugando IA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Formação Full Stack + IA | Programação para Iniciantes",
    description:
      "Uma landing nova, com foco em quem quer começar em programação e evoluir até IA sem se perder.",
  },
};

const launchDeadline = "31 de agosto de 2026";

function formatPrice(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#FF6B35]">
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-balance text-[2.3rem] font-black leading-[0.95] tracking-[-0.05em] text-[#F5F5F3] md:text-[4rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#A7ADB3]">{description}</p>
      ) : null}
    </div>
  );
}

export default async function CursoNovoPage() {
  const config = getCourseNovaRuntimeConfig();
  const metaPixelId = await resolveSalesPageMetaPixelId(courseNovaConfig.pageKey, {
    preferEnvFallback: true,
  });

  const priceLabel = formatPrice(config.activePrice);
  const eventData = {
    content_name: config.courseName,
    content_category: "Curso",
    content_type: "product",
    value: config.activePrice,
    currency: "BRL",
  };

  return (
    <main className="min-h-screen bg-[#0B0D0F] text-[#F5F5F3]">
      <MetaPixelScript pixelId={metaPixelId || undefined} />
      <SalesPageTracker
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        metadata={{ offerPrice: config.activePrice, currency: "BRL", offerName: config.courseName }}
      />
      <SalesViewContentTracker
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        currency="BRL"
        value={config.activePrice}
        metadata={{ contentName: config.courseName, contentType: "course" }}
      />
      <MetaPixelViewContent data={eventData} />
      <SectionViewTracker
        selectorId="caminho"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        eventName="beginner_path_view"
      />
      <SectionViewTracker
        selectorId="projetos"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        eventName="projects_view"
      />
      <SectionViewTracker
        selectorId="oferta"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        eventName="offer_view"
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,107,53,0.2),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(41,92,255,0.18),_transparent_34%),linear-gradient(180deg,_rgba(18,21,24,0.96),_rgba(11,13,15,1))]" />
        <div className="absolute left-0 top-[120px] h-[420px] w-[420px] rounded-full bg-[#295CFF]/10 blur-3xl" />
        <div className="absolute right-[-80px] top-[220px] h-[320px] w-[320px] rounded-full bg-[#FF6B35]/10 blur-3xl" />

        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D0F]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
            <Link href="/curso-novo" className="text-sm font-black uppercase tracking-[0.18em] text-[#F5F5F3]">
              Plugando IA
            </Link>

            <nav className="hidden items-center gap-7 md:flex">
              <a href="#caminho" className="text-sm text-[#A7ADB3] transition hover:text-white">
                O caminho
              </a>
              <a href="#projetos" className="text-sm text-[#A7ADB3] transition hover:text-white">
                Projetos
              </a>
              <a href="#conteudo" className="text-sm text-[#A7ADB3] transition hover:text-white">
                Conteúdo
              </a>
              <a href="#professor" className="text-sm text-[#A7ADB3] transition hover:text-white">
                Professor
              </a>
              <a href="#faq" className="text-sm text-[#A7ADB3] transition hover:text-white">
                FAQ
              </a>
            </nav>

            <TrackedCheckoutButton
              href={config.checkoutUrl}
              label="QUERO COMEÇAR"
              pageKey={config.pageKey}
              pagePath={config.pagePath}
              pageTitle={config.pageTitle}
              value={config.activePrice}
              currency="BRL"
              customEvent="header_cta_click"
              eventData={eventData}
              hideGlow
              className="hidden rounded-full border border-[#FF6B35] bg-[#FF6B35] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#0B0D0F] shadow-none hover:bg-[#ff855b] md:inline-flex"
            />
          </div>
        </header>

        <section className="relative">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-16 pt-14 md:grid-cols-[1.02fr,0.98fr] md:px-8 md:pb-24 md:pt-20">
            <FadeIn>
              <Eyebrow>PARA QUEM QUER COMEÇAR EM PROGRAMAÇÃO</Eyebrow>
              <h1 className="mt-6 max-w-5xl text-balance text-[3.1rem] font-black leading-[0.9] tracking-[-0.06em] text-[#F5F5F3] md:text-[6rem]">
                Você não precisa aprender tudo. Precisa saber por onde começar.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#C9CDD1] md:text-[1.32rem]">
                A formação foi pensada para quem está olhando para programação, backend, frontend, cloud e IA ao mesmo tempo e não sabe mais qual deveria ser o primeiro passo.
              </p>
              <p className="mt-4 text-xl font-semibold text-[#F4C95D]">
                Do zero. Em uma sequência que faz sentido.
              </p>

              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                {heroBenefits.map((item) => (
                  <div key={item} className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-5 text-sm font-medium text-[#F5F5F3]">
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-6 rounded-[30px] border border-white/10 bg-[#121518] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] md:max-w-3xl md:grid-cols-[1fr,0.95fr]">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#A7ADB3]">
                    Oferta de lançamento
                  </div>
                  <div className="mt-4 text-sm text-[#7C838A] line-through">
                    {formatPrice(config.regularPrice)}
                  </div>
                  <div className="mt-2 text-[3.4rem] font-black leading-none tracking-[-0.06em] text-[#F5F5F3] md:text-[4.6rem]">
                    {priceLabel}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-[#FF6B35]">
                    até {launchDeadline}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4">
                  <TrackedCheckoutButton
                    href={config.checkoutUrl}
                    label="QUERO COMEÇAR A PROGRAMAR →"
                    pageKey={config.pageKey}
                    pagePath={config.pagePath}
                    pageTitle={config.pageTitle}
                    value={config.activePrice}
                    currency="BRL"
                    customEvent="hero_cta_click"
                    eventData={eventData}
                    hideGlow
                    className="w-full rounded-full border border-[#FF6B35] bg-[#FF6B35] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[#0B0D0F] shadow-none hover:bg-[#ff855b]"
                  />
                  <a
                    href="#caminho"
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[#F5F5F3] transition hover:border-[#295CFF] hover:bg-[#295CFF]/10"
                  >
                    VER COMO FUNCIONA
                  </a>
                  <div className="text-sm text-[#A7ADB3]">
                    Acesso online. Estude no seu ritmo e avance por etapa.
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn delayMs={120}>
              <div className="relative">
                <div className="absolute -left-5 -top-5 hidden rounded-full border border-[#F4C95D]/40 bg-[#F4C95D]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F4C95D] md:block">
                  FUNDAMENTOS PRIMEIRO
                </div>
                <div className="overflow-hidden rounded-[36px] border border-white/10 bg-[#121518] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
                  <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(24,28,32,0.98),_rgba(11,13,15,0.96))] p-4">
                    <Image
                      src="/plugando-ia-hero.svg"
                      alt="Visual da Formação Full Stack + IA"
                      width={1600}
                      height={960}
                      priority
                      className="h-auto w-full rounded-[20px]"
                    />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-[#0F1215] p-5">
                      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#295CFF]">
                        Sequência
                      </div>
                      <div className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#F5F5F3]">
                        Do primeiro código até IA aplicada
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-[#0F1215] p-5">
                      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#FF6B35]">
                        Direção
                      </div>
                      <div className="mt-3 text-base leading-7 text-[#C9CDD1]">
                        Você não fica pulando de tecnologia em tecnologia sem contexto.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="relative border-y border-white/10 bg-[#121518]/90">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-4 px-5 py-5 md:px-8">
            {["COMECE DO ZERO", "APRENDA NO SEU RITMO", "CONSTRUA PROJETOS", "EVOLUA ATÉ IA"].map((item) => (
              <div
                key={item}
                className="font-mono text-xs uppercase tracking-[0.26em] text-[#A7ADB3]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="border-b border-white/10 bg-[#0B0D0F]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="Produto real"
              title={<>Isso não é uma promessa abstrata.</>}
              description="Você enxerga a trilha, as tecnologias, os projetos e a progressão da formação de forma concreta."
            />
          </FadeIn>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {productShowcase.map((item, index) => (
              <FadeIn key={item.title} delayMs={index * 70}>
                <div className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#121518]">
                  <div className="overflow-hidden border-b border-white/10 bg-[#181C20] p-4">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={1600}
                      height={960}
                      className="h-auto w-full rounded-[18px] transition duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="p-6">
                    <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#295CFF]">
                      VISÃO DE CONJUNTO
                    </div>
                    <h3 className="mt-3 text-[1.65rem] font-black leading-tight tracking-[-0.04em] text-[#F5F5F3]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-[#A7ADB3]">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#121518]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1fr,0.95fr] md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="Big Idea"
              title={<>A IA pode acelerar muito. Mas ela não substitui clareza.</>}
              description="Hoje já existe IA escrevendo código. O problema é que, sem fundamento, fica difícil entender o que está sendo gerado, corrigir regras, adaptar fluxos e transformar respostas em software real."
            />
            <div className="mt-7 space-y-4 text-base leading-7 text-[#C9CDD1]">
              <p>Por isso a formação não começa na IA. Ela começa em programação.</p>
              <p>Você aprende como uma aplicação funciona e, depois, usa IA como acelerador.</p>
            </div>
            <div className="mt-8 inline-flex rounded-full border border-[#F4C95D]/30 bg-[#F4C95D]/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#F4C95D]">
              Fundamentos primeiro. IA como acelerador.
            </div>
          </FadeIn>

          <FadeIn delayMs={100}>
            <div className="grid gap-4 rounded-[32px] border border-white/10 bg-[#0F1215] p-6">
              {[
                "Entender lógica",
                "Construir backend",
                "Conectar frontend",
                "Publicar projetos",
                "Automatizar processos",
                "Aplicar IA com contexto",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-[22px] border border-white/10 bg-[#181C20] px-5 py-4"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.26em] text-[#295CFF]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-right text-base font-semibold text-[#F5F5F3]">{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="caminho" className="border-b border-white/10 bg-[#0B0D0F]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="Caminho do iniciante"
              title={<>Em vez de tentar aprender tudo ao mesmo tempo, você segue um caminho.</>}
              description="Cada etapa prepara a próxima. Você vai criando base, repertório e visão de produto."
            />
          </FadeIn>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            {beginnerPath.map((step, index) => (
              <FadeIn key={step.word} delayMs={index * 50}>
                <div className="rounded-[28px] border border-white/10 bg-[#121518] p-6">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#A7ADB3]">
                        ETAPA {String(index + 1).padStart(2, "0")}
                      </div>
                      <h3 className="mt-3 text-[1.8rem] font-black leading-none tracking-[-0.05em] text-[#F5F5F3]">
                        {step.word}
                      </h3>
                    </div>
                    <div className="rounded-full border border-[#295CFF]/40 bg-[#295CFF]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8FAAFF]">
                      {step.tech}
                    </div>
                  </div>
                  <p className="mt-5 text-base leading-7 text-[#A7ADB3]">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="projetos" className="border-b border-white/10 bg-[#121518]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="Projetos"
              title={<>Você não vai só assistir. Vai entender como as peças viram produto.</>}
              description="Os projetos mostram o que acontece quando backend, frontend, dados, automação e IA começam a se conectar."
            />
          </FadeIn>

          <div className="mt-14 grid gap-10">
            {projects.map((project, index) => {
              const reverse = index % 2 === 1;

              return (
                <FadeIn key={project.title} delayMs={index * 50}>
                  <div
                    className={`grid gap-8 rounded-[34px] border border-white/10 bg-[#0F1215] p-5 lg:grid-cols-[1fr,0.95fr] lg:items-center lg:p-7 ${
                      reverse ? "lg:[&>*:first-child]:order-2" : ""
                    }`}
                  >
                    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#181C20] p-3">
                      <Image
                        src={project.image}
                        alt={project.title}
                        width={1600}
                        height={960}
                        className="h-auto w-full rounded-[18px]"
                      />
                    </div>
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#FF6B35]">
                        PROJETO PRÁTICO
                      </div>
                      <h3 className="mt-4 text-[2rem] font-black leading-[1] tracking-[-0.05em] text-[#F5F5F3] md:text-[2.8rem]">
                        {project.title}
                      </h3>
                      <p className="mt-5 text-base leading-7 text-[#A7ADB3]">{project.description}</p>
                      <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#F4C95D]">
                        {project.stack}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section id="conteudo" className="border-b border-white/10 bg-[#0B0D0F]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="Currículo"
              title={<>Tudo organizado para quem precisa de direção.</>}
              description="Você começa pela base e expande a formação conforme ganha contexto e repertório."
            />
          </FadeIn>

          <div className="mt-14 grid gap-4">
            {curriculum.map((section, index) => (
              <FadeIn key={section.title} delayMs={index * 40}>
                <TrackedAccordion
                  title={section.title}
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  eventName="curriculum_open"
                  className="rounded-[28px] border border-white/10 bg-[#121518] p-6 open:bg-[#15191d]"
                  titleClassName="!text-[#F5F5F3] text-[1.1rem]"
                  contentClassName="!text-[#A7ADB3] text-base leading-7"
                  iconClassName="border-white/10 bg-white/5 !text-white"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {section.label ? (
                        <span className="rounded-full border border-[#4ADE80]/30 bg-[#4ADE80]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7ef0a0]">
                          {section.label}
                        </span>
                      ) : null}
                      {section.badge ? (
                        <span className="rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#FF9A73]">
                          {section.badge}
                        </span>
                      ) : null}
                    </div>
                    <p>{section.description}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {section.items.map((item) => (
                        <div
                          key={item}
                          className="rounded-[18px] border border-white/10 bg-[#0F1215] px-4 py-3 text-sm font-medium text-[#F5F5F3]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </TrackedAccordion>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#121518]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.95fr,1.05fr] md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="Arquitetura"
              title={<>Arquitetura entra como evolução. Não como bloqueio para começar.</>}
              description="Primeiro você aprende a construir. Depois aprende a organizar melhor, escalar melhor e tomar decisões com mais clareza."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {architectureTopics.map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-white/10 bg-[#0F1215] px-4 py-4 text-sm font-semibold text-[#F5F5F3]"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-7 text-base leading-7 text-[#A7ADB3]">
              O conteúdo de Arquitetura ainda está em expansão, com novas aulas em produção.
            </p>
          </FadeIn>

          <FadeIn delayMs={100}>
            <div className="rounded-[32px] border border-white/10 bg-[#0F1215] p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#295CFF]">
                PRINCÍPIOS E DECISÕES
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {architectureTerms.map((term) => (
                  <span
                    key={term}
                    className="rounded-full border border-white/10 bg-[#181C20] px-4 py-2 text-sm font-semibold text-[#F5F5F3]"
                  >
                    {term}
                  </span>
                ))}
              </div>
              <div className="mt-8 rounded-[24px] border border-[#F4C95D]/20 bg-[#F4C95D]/8 p-5">
                <div className="text-xl font-black tracking-[-0.04em] text-[#F4C95D]">
                  Primeiro você tira a ideia do papel.
                </div>
                <p className="mt-3 text-base leading-7 text-[#E8DFB8]">
                  Depois você aprende a deixar essa construção mais limpa, mais segura e mais fácil de evoluir.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0B0D0F]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1fr,0.95fr] md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="IA"
              title={<>Aplicação + dados + IA = novas possibilidades.</>}
              description="Quando você entende aplicação, API, banco, fluxo e contexto, a IA deixa de ser só curiosidade e começa a virar recurso real dentro do produto."
            />
            <div className="mt-8 space-y-4 text-base leading-7 text-[#C9CDD1]">
              <p>Você aprende a integrar IA dentro das aplicações que constrói.</p>
              <p>Depois evolui para agentes, memória, contexto e RAG.</p>
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="grid gap-4">
              {[
                "Chat com IA dentro da aplicação",
                "Fluxos automatizados com n8n",
                "Agentes que usam contexto",
                "RAG com dados próprios",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[26px] border border-white/10 bg-[#121518] px-6 py-6 text-lg font-semibold text-[#F5F5F3]"
                >
                  {item}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="professor" className="border-b border-white/10 bg-[#121518]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.9fr,1.1fr] md:px-8 md:py-24">
          <FadeIn>
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0F1215] p-4">
              <Image
                src="/imersao-ia-tech-stack.svg"
                alt="Ecossistema técnico da Plugando IA"
                width={1600}
                height={960}
                className="h-auto w-full rounded-[24px]"
              />
            </div>
          </FadeIn>

          <FadeIn delayMs={100}>
            <SectionHeading
              eyebrow="Professor"
              title={<>Essa formação foi desenhada para encurtar a distância entre confusão e clareza.</>}
              description="A ideia aqui não é te jogar em um monte de ferramenta ao mesmo tempo. É te conduzir por uma sequência que organiza o seu aprendizado."
            />
            <div className="mt-7 space-y-4 text-base leading-7 text-[#A7ADB3]">
              <p>Se hoje você olha para programação e sente que tudo parece importante ao mesmo tempo, essa sensação faz sentido.</p>
              <p>Tem linguagem, framework, banco, cloud, automação e Inteligência Artificial competindo pela sua atenção.</p>
              <p>Por isso a proposta da formação é simples: começar pela base, construir visão de aplicação e só então avançar para o que vem depois.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="oferta" className="border-b border-white/10 bg-[#FF6B35] text-[#0B0D0F]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1fr,0.96fr] md:px-8 md:py-24">
          <FadeIn>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#0B0D0F]/70">
              Oferta
            </div>
            <h2 className="mt-4 max-w-4xl text-balance text-[2.4rem] font-black leading-[0.94] tracking-[-0.05em] md:text-[4rem]">
              Uma formação completa para quem quer começar e continuar evoluindo.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#0B0D0F]/78">
              Você entra agora e acompanha uma sequência que vai dos fundamentos até aplicações com IA, automação e visão de produto.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {offerItems.map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-[#0B0D0F]/12 bg-[#0B0D0F]/5 px-4 py-4 text-sm font-semibold"
                >
                  {item}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delayMs={100}>
            <div className="rounded-[34px] border border-[#0B0D0F]/12 bg-[#0B0D0F] p-8 text-[#F5F5F3] shadow-[0_30px_120px_rgba(0,0,0,0.28)]">
              <div className="text-sm text-[#A7ADB3]">Preço normal</div>
              <div className="mt-2 text-xl text-[#6C7279] line-through">{formatPrice(config.regularPrice)}</div>
              <div className="mt-6 text-sm text-[#A7ADB3]">Preço de lançamento</div>
              <div className="mt-2 text-[3.5rem] font-black leading-none tracking-[-0.06em] text-[#F5F5F3] md:text-[4.8rem]">
                {priceLabel}
              </div>
              <div className="mt-3 text-sm font-semibold text-[#F4C95D]">
                Condição válida até 31/08/2026 às 23:59.
              </div>

              {config.launchActive ? (
                <div className="mt-8">
                  <LaunchCountdown
                    endDate={config.launchEndDate}
                    itemClassName="rounded-[18px] border-white/10 bg-white/5"
                    valueClassName="text-[#F5F5F3]"
                    labelClassName="text-[#A7ADB3]"
                  />
                </div>
              ) : null}

              <div className="mt-8">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="QUERO ENTRAR NA FORMAÇÃO →"
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  value={config.activePrice}
                  currency="BRL"
                  customEvent="offer_cta_click"
                  eventData={eventData}
                  hideGlow
                  className="w-full rounded-full border border-[#FF6B35] bg-[#FF6B35] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[#0B0D0F] shadow-none hover:bg-[#ff855b]"
                />
              </div>
              <div className="mt-4 text-sm text-[#A7ADB3]">Acesso online.</div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="faq" className="border-b border-white/10 bg-[#0B0D0F]">
        <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="FAQ"
              title={<>O que você precisa saber antes de entrar.</>}
            />
          </FadeIn>

          <div className="mt-12 grid gap-4">
            {faq.map((item, index) => (
              <FadeIn key={item.question} delayMs={index * 30}>
                <TrackedAccordion
                  title={item.question}
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  eventName="faq_open"
                  className="rounded-[26px] border border-white/10 bg-[#121518] p-6 open:bg-[#15191d]"
                  titleClassName="!text-[#F5F5F3] text-lg"
                  contentClassName="!text-[#A7ADB3] text-base leading-7"
                  iconClassName="border-white/10 bg-white/5 !text-white"
                >
                  {item.answer}
                </TrackedAccordion>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#121518]">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center md:px-8 md:py-24">
          <FadeIn>
            <Eyebrow>CTA final</Eyebrow>
            <h2 className="mt-4 text-balance text-[2.5rem] font-black leading-[0.94] tracking-[-0.05em] text-[#F5F5F3] md:text-[4.8rem]">
              Todo desenvolvedor começou sem saber programar.
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#A7ADB3]">
              Se o que falta para você hoje não é vontade, e sim direção, essa formação foi feita para isso.
            </p>
            <div className="mt-8 text-sm text-[#6C7279] line-through">{formatPrice(config.regularPrice)}</div>
            <div className="mt-2 text-[3.2rem] font-black leading-none tracking-[-0.06em] text-[#F5F5F3] md:text-[4.8rem]">
              {priceLabel}
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#FF6B35]">
              até 31/08/2026
            </div>
            <div className="mt-8 flex justify-center">
              <TrackedCheckoutButton
                href={config.checkoutUrl}
                label="QUERO COMEÇAR →"
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
                value={config.activePrice}
                currency="BRL"
                customEvent="final_cta_click"
                eventData={eventData}
                hideGlow
                className="rounded-full border border-[#FF6B35] bg-[#FF6B35] px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[#0B0D0F] shadow-none hover:bg-[#ff855b]"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="bg-[#0B0D0F]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <div className="text-3xl font-black tracking-[-0.05em] text-[#F5F5F3] md:text-5xl">
              PLUGANDO IA
            </div>
            <div className="mt-3 text-sm text-[#A7ADB3]">
              Formação Full Stack + IA para quem precisa de direção para começar.
            </div>
          </div>
          <div className="flex flex-wrap gap-5 font-mono text-xs uppercase tracking-[0.22em] text-[#A7ADB3]">
            <Link href="/terms" className="transition hover:text-white">
              Termos
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacidade
            </Link>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>
        </div>
      </footer>

      <MobileStickyCTA
        title={config.courseName}
        priceLabel={priceLabel}
        href={config.checkoutUrl}
        label="ENTRAR →"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        value={config.activePrice}
        currency="BRL"
        className="border-white/10 bg-[#0B0D0F]/96"
        titleClassName="text-[#F5F5F3]"
        priceClassName="text-[#F4C95D]"
        buttonClassName="rounded-full border border-[#FF6B35] bg-[#FF6B35] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#0B0D0F] shadow-none hover:bg-[#ff855b]"
        hideGlow
      />
    </main>
  );
}
