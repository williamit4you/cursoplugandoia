import type { ReactNode } from "react";
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
  aiPillars,
  architectureTopics,
  courseConfig,
  faq,
  getCourseRuntimeConfig,
  objections,
  offerChecklist,
  problemCards,
  projects,
  proofItems,
  quickBenefits,
  roadmap,
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

const curriculumEntries = [
  {
    number: "01",
    title: "Fundamentos de C#",
    status: "Disponivel agora",
    description: "Comece pela base de logica, sintaxe e pensamento de programacao antes de acelerar com frameworks.",
  },
  {
    number: "02",
    title: "Backend .NET",
    status: "Disponivel agora",
    description: "Construa APIs, regras de negocio, autenticacao e acesso a dados em projetos com contexto real.",
  },
  {
    number: "03",
    title: "Arquitetura",
    status: "Disponivel agora",
    description: "Entenda como organizar software, tomar decisoes melhores e reduzir retrabalho conforme os sistemas crescem.",
  },
  {
    number: "04",
    title: "Next.js",
    status: "Disponivel agora",
    description: "Conecte frontend e backend em aplicacoes Full Stack com interface, rotas e fluxo de dados.",
  },
  {
    number: "05",
    title: "AWS",
    status: "Disponivel agora",
    description: "Leve o que voce construiu para infraestrutura real e veja como o software sai do localhost.",
  },
  {
    number: "06",
    title: "n8n",
    status: "Disponivel agora",
    description: "Automatize processos e integre sistemas sem perder a visao de arquitetura e produto.",
  },
  {
    number: "07",
    title: "IA",
    status: "Em expansao",
    description: "Use modelos como aceleradores dentro de aplicacoes, com criterio tecnico e objetivo claro.",
  },
  {
    number: "08",
    title: "Agentes",
    status: "Em expansao",
    description: "Avance para fluxos com contexto, memoria e acao sobre ferramentas e dados proprios.",
  },
  {
    number: "09",
    title: "SaaS",
    status: "Em expansao",
    description: "Entenda como codigo, operacao e experiencia se conectam para virar software vendavel.",
  },
];

function Eyebrow({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "green" | "orange" }) {
  const tones = {
    default: "text-[#295CFF]",
    green: "text-[#B8F34A]",
    orange: "text-[#151515]",
  };

  return <div className={`font-mono text-xs uppercase tracking-[0.28em] ${tones[tone]}`}>{children}</div>;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  dark = false,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="max-w-4xl">
      <Eyebrow tone={dark ? "green" : "default"}>{eyebrow}</Eyebrow>
      <h2
        className={`mt-4 max-w-4xl text-balance text-[2.3rem] font-black leading-[0.98] tracking-[-0.04em] md:text-[4rem] ${
          dark ? "text-[#F6F3EC]" : "text-[#151515]"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-5 max-w-3xl text-pretty text-base leading-7 md:text-lg ${dark ? "text-[#C9C4B8]" : "text-[#62625E]"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="relative text-sm text-[#62625E] transition after:absolute after:bottom-[-0.35rem] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#151515] after:transition-transform hover:text-[#151515] hover:after:scale-x-100"
    >
      {children}
    </a>
  );
}

function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-[8px] border border-[#151515] px-5 py-3 text-sm font-semibold text-[#151515] transition hover:bg-[#151515] hover:text-[#F4F1EA]"
    >
      {children}
    </a>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[#D7D3CA] pt-3">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#62625E]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#151515]">{value}</div>
    </div>
  );
}

function CurriculumAccordion({
  title,
  number,
  status,
  description,
  pageKey,
  pagePath,
  pageTitle,
}: {
  title: string;
  number: string;
  status: string;
  description: string;
  pageKey: string;
  pagePath: string;
  pageTitle: string;
}) {
  return (
    <TrackedAccordion
      title={`${number}  ${title}`}
      pageKey={pageKey}
      pagePath={pagePath}
      pageTitle={pageTitle}
      eventName="curriculum_open"
      className="rounded-none border-x-0 border-b border-t-0 border-[#D7D3CA] bg-transparent px-0 py-5 open:bg-transparent"
      titleClassName="text-xl font-semibold text-[#151515] md:text-2xl"
      contentClassName="text-[#62625E] text-base leading-7"
      iconClassName="h-9 w-9 rounded-none border-[#D7D3CA] bg-transparent text-[#151515]"
    >
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#295CFF]">{status}</div>
      {description}
    </TrackedAccordion>
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
    <main className="bg-[#F4F1EA] text-[#151515]">
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

      <header className="sticky top-0 z-40 border-b border-[#D7D3CA] bg-[#F4F1EA]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
          <Link href="/curso-completo" className="font-mono text-xs uppercase tracking-[0.28em] text-[#151515]">
            Plugando IA / Formacao 2026
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <NavLink href="#roadmap">Caminho</NavLink>
            <NavLink href="#architecture">Arquitetura</NavLink>
            <NavLink href="#projects">Projetos</NavLink>
            <NavLink href="#pricing">Oferta</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </nav>
          <div className="hidden md:block">
            <TrackedCheckoutButton
              href={config.checkoutUrl}
              label="ENTRAR NA FORMACAO →"
              pageKey={config.pageKey}
              pagePath={config.pagePath}
              pageTitle={config.pageTitle}
              value={config.activePrice}
              currency="BRL"
              customEvent="header_cta_click"
              eventData={eventData}
              hideGlow
              className="rounded-[8px] border border-[#295CFF] bg-[#295CFF] px-5 py-3 text-sm font-semibold text-white shadow-none hover:bg-[#1E49D6]"
            />
          </div>
        </div>
      </header>

      <section id="formacao" className="relative overflow-hidden border-b border-[#D7D3CA]">
        <div className="pointer-events-none absolute left-[-8rem] top-[-4rem] h-64 w-64 rounded-full bg-[#295CFF]/8 blur-3xl" />
        <div className="pointer-events-none absolute right-[-5rem] top-[8rem] h-40 w-40 rounded-full bg-[#FF5A36]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-14 md:grid-cols-[1.1fr,0.9fr] md:px-8 md:py-20">
          <FadeIn>
            <Eyebrow>Plugando IA / Formacao 2026</Eyebrow>
            <h1 className="mt-5 max-w-5xl text-balance text-[3rem] font-black leading-[0.95] tracking-[-0.05em] text-[#151515] md:text-[5.2rem]">
              Aprenda a construir.
              <br />
              Depois aprenda a arquitetar.
              <br />
              Entao acelere com IA.
            </h1>
            <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-[#62625E] md:text-xl">
              Uma formacao completa para comecar pelos fundamentos e evoluir por C#, .NET, Arquitetura de
              Software, Next.js, AWS, automacoes, SaaS e Inteligencia Artificial.
            </p>

            <div className="mt-8 grid gap-6 md:max-w-3xl md:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-3">
                <div className="font-mono text-xs uppercase tracking-[0.26em] text-[#FF5A36]">Lancamento / ate 31 AGO</div>
                <div className="text-sm text-[#62625E] line-through">R$ {config.regularPrice.toFixed(0)}</div>
                <div className="text-[3rem] font-black leading-none tracking-[-0.05em] text-[#151515] md:text-[4.4rem]">
                  {priceLabel}
                </div>
                <div className="text-sm text-[#62625E]">Acesso online. Estude no seu ritmo.</div>
              </div>
              <div className="grid gap-3">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="QUERO COMECAR →"
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  value={config.activePrice}
                  currency="BRL"
                  customEvent="hero_cta_click"
                  eventData={eventData}
                  hideGlow
                  className="w-full rounded-[8px] border border-[#295CFF] bg-[#295CFF] px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-none hover:bg-[#1E49D6]"
                />
                <SecondaryLink href="#roadmap">VER O CAMINHO →</SecondaryLink>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {quickBenefits.map((item) => (
                <div key={item} className="border-t border-[#D7D3CA] pt-3 text-sm leading-6 text-[#151515]">
                  {item}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="grid gap-6">
              <div className="border border-[#D7D3CA] bg-[#ECE8DF] p-4 md:p-6">
                <div className="flex items-center justify-between border-b border-[#D7D3CA] pb-4">
                  <div className="font-mono text-xs uppercase tracking-[0.24em] text-[#62625E]">Journey / technical view</div>
                  <div className="h-2.5 w-2.5 rounded-full bg-[#B8F34A]" />
                </div>
                <div className="divide-y divide-[#D7D3CA]">
                  {roadmap.slice(0, 7).map((step, index) => (
                    <div key={step.title} className="grid grid-cols-[44px,1fr] gap-4 py-4 md:grid-cols-[56px,1fr,0.9fr]">
                      <div className="font-mono text-lg text-[#295CFF]">{String(index + 1).padStart(2, "0")}</div>
                      <div>
                        <div className="text-xl font-semibold text-[#151515]">{step.tech ?? step.title}</div>
                        <div className="mt-1 text-sm text-[#62625E]">{step.title}</div>
                      </div>
                      <div className="hidden text-sm leading-6 text-[#62625E] md:block">{step.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StatLine label="Checkout" value="Direto para a oferta" />
                <StatLine label="Formato" value="Do codigo ao deploy" />
                <StatLine label="Foco" value="Base, sistema e IA" />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA] bg-[#ECE8DF]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <FadeIn>
            <SectionHeading
              eyebrow="02 / O PROBLEMA"
              title={
                <>
                  Voce nao esta sem conteudo.
                  <br />
                  Esta sem um caminho.
                </>
              }
              description="Quando tudo parece importante ao mesmo tempo, voce acumula cursos, troca de stack cedo demais e continua sem enxergar como software real e construido."
            />
            <div className="mt-12 grid border border-[#D7D3CA] md:grid-cols-2">
              {problemCards.map((item, index) => (
                <div
                  key={item.title}
                  className={`grid gap-3 border-[#D7D3CA] p-6 md:p-8 ${index % 2 === 0 ? "md:border-r" : ""} ${
                    index < 2 ? "border-b" : ""
                  }`}
                >
                  <div className="font-mono text-sm uppercase tracking-[0.24em] text-[#295CFF]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="text-[1.6rem] font-bold leading-tight tracking-[-0.03em] text-[#151515]">
                    {item.title.toUpperCase()}.
                  </div>
                  <p className="max-w-md text-base leading-7 text-[#62625E]">{item.description}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="roadmap" className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="03 / O CAMINHO"
              title={
                <>
                  Existe uma ordem
                  <br />
                  para aprender.
                </>
              }
              description="A trilha conecta fundamentos, backend, arquitetura, Full Stack, cloud, automacao, IA, agentes e SaaS sem virar um catalogo solto de modulos."
            />
            <div className="mt-12 divide-y divide-[#D7D3CA] border-y border-[#D7D3CA]">
              {roadmap.map((step, index) => (
                <div key={step.title} className="grid gap-4 py-6 md:grid-cols-[90px,1fr,0.9fr] md:items-start">
                  <div className="font-mono text-2xl text-[#295CFF]">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <div className="text-[1.7rem] font-bold leading-tight tracking-[-0.03em] text-[#151515]">{step.title}</div>
                    {step.tech ? <div className="mt-2 font-mono text-xs uppercase tracking-[0.24em] text-[#62625E]">{step.tech}</div> : null}
                  </div>
                  <p className="max-w-xl text-base leading-7 text-[#62625E]">{step.description}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="architecture" className="border-b border-[#2D2D2D] bg-[#171717]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="04 / ARQUITETURA"
              title={
                <>
                  Nao basta fazer funcionar.
                  <br />
                  Entenda por que funciona assim.
                </>
              }
              description="Aprenda os fundamentos que ajudam voce a tomar melhores decisoes ao construir software."
              dark
            />

            <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="border border-[#2D2D2D] p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-4">
                    {["REQUISITOS", "DESIGN", "MODULOS"].map((item) => (
                      <div key={item} className="border border-[#2D2D2D] px-4 py-3 font-mono text-xs tracking-[0.24em] text-[#F6F3EC]">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-[#295CFF] text-center">
                      <div className="font-mono text-xs uppercase tracking-[0.24em] text-[#B8F34A]">CORE</div>
                      <div className="absolute top-[5.6rem] text-3xl font-black tracking-[-0.04em] text-[#F6F3EC]">SOFTWARE</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {["DADOS", "INTEGRACOES", "INFRAESTRUTURA"].map((item) => (
                      <div key={item} className="border border-[#2D2D2D] px-4 py-3 font-mono text-xs tracking-[0.24em] text-[#F6F3EC]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {["SOLID", "COESAO", "ACOPLAMENTO", "ESCALABILIDADE", "SEGURANCA", "MANUTENIBILIDADE"].map((item) => (
                    <div key={item} className="border border-[#2D2D2D] px-4 py-3 text-sm text-[#C9C4B8]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-[#2D2D2D]">
                  <div className="border-b border-[#2D2D2D] px-5 py-4 font-mono text-xs uppercase tracking-[0.24em] text-[#B8F34A]">
                    Solid / principios
                  </div>
                  {[
                    ["SRP", "Single Responsibility"],
                    ["OCP", "Open/Closed"],
                    ["LSP", "Liskov Substitution"],
                    ["ISP", "Interface Segregation"],
                    ["DIP", "Dependency Inversion"],
                  ].map(([abbr, label]) => (
                    <div key={abbr} className="grid grid-cols-[80px,1fr] border-b border-[#2D2D2D] px-5 py-4 last:border-b-0">
                      <div className="font-mono text-sm text-[#B8F34A]">{abbr}</div>
                      <div className="text-sm text-[#F6F3EC]">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4">
                  {architectureTopics.slice(0, 3).map((topic) => (
                    <div key={topic.title} className="border border-[#2D2D2D] p-5">
                      <div className="text-lg font-semibold text-[#F6F3EC]">{topic.title}</div>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#C9C4B8]">
                        {topic.items.slice(0, 2).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="projects" className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="05 / CONSTRUCAO"
              title={
                <>
                  Menos tutorial.
                  <br />
                  Mais coisa funcionando.
                </>
              }
              description="A formacao aproxima tecnologia de contexto. Cada projeto mostra onde backend, interface, dados, cloud e IA se conectam."
            />
          </FadeIn>

          <div className="mt-14 grid gap-16">
            {projects.slice(0, 3).map((project, index) => {
              const image = proofItems[index % proofItems.length];
              const reversed = index % 2 === 1;

              return (
                <FadeIn key={project.title} delayMs={index * 80}>
                  <div className={`grid gap-8 lg:grid-cols-2 lg:items-center ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
                    <div className="overflow-hidden border border-[#D7D3CA] bg-[#ECE8DF]">
                      <Image src={image.image} alt={project.title} width={1600} height={960} className="h-auto w-full" />
                    </div>
                    <div>
                      <div className="font-mono text-xs uppercase tracking-[0.26em] text-[#62625E]">
                        Project / {String(index + 1).padStart(2, "0")}
                      </div>
                      <h3 className="mt-3 text-[2rem] font-black leading-tight tracking-[-0.04em] text-[#151515] md:text-[2.8rem]">
                        {project.title}
                      </h3>
                      <p className="mt-4 max-w-xl text-base leading-7 text-[#62625E]">{project.description}</p>
                      <div className="mt-6 border-t border-[#D7D3CA] pt-4 font-mono text-xs uppercase tracking-[0.22em] text-[#295CFF]">
                        {project.badges.join(" / ")}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#264DE0] bg-[#295CFF] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1fr,0.9fr] md:px-8 md:py-24">
          <FadeIn>
            <Eyebrow>06 / CLOUD</Eyebrow>
            <h2 className="mt-4 max-w-4xl text-balance text-[2.3rem] font-black leading-[0.98] tracking-[-0.04em] md:text-[4rem]">
              Seu codigo nao termina no localhost.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
              Aprenda como aplicacoes chegam a infraestrutura real e quais pecas importam quando voce quer publicar com clareza.
            </p>
          </FadeIn>

          <FadeIn delayMs={100}>
            <div className="border border-white/25 bg-white/5 p-6">
              <div className="space-y-4">
                {["USUARIO", "API", "EC2 / BEANSTALK", "RDS", "S3"].map((item, index) => (
                  <div key={item}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 border border-white/30 bg-white/10 text-center font-mono text-xs leading-[2.4rem]">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="border border-white/20 px-4 py-3 font-mono text-sm uppercase tracking-[0.18em]">{item}</div>
                    </div>
                    {index < 4 ? <div className="ml-5 h-8 w-px bg-white/30" /> : null}
                  </div>
                ))}
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["VPC", "IAM", "LAMBDA"].map((item) => (
                  <div key={item} className="border border-white/20 px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.22em] text-white/88">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#2D2D2D] bg-[#171717]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="07 / INTELIGENCIA ARTIFICIAL"
              title={
                <>
                  IA nao substitui sua base.
                  <br />
                  Amplifica o que voce sabe fazer.
                </>
              }
              description="A proposta nao e pular fundamentos. E chegar na IA com repertorio suficiente para entender, corrigir, adaptar e evoluir o que esta sendo construido."
              dark
            />
          </FadeIn>

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr,1.05fr]">
            <FadeIn delayMs={100}>
              <div className="border border-[#2D2D2D] p-8">
                <div className="grid gap-6 text-center">
                  <div className="font-mono text-sm uppercase tracking-[0.24em] text-[#F6F3EC]">VOCE</div>
                  <div className="text-[#B8F34A]">+</div>
                  <div className="font-mono text-sm uppercase tracking-[0.24em] text-[#F6F3EC]">FUNDAMENTOS</div>
                  <div className="text-[#B8F34A]">+</div>
                  <div className="font-mono text-sm uppercase tracking-[0.24em] text-[#F6F3EC]">IA</div>
                  <div className="mx-auto h-10 w-px bg-[#295CFF]" />
                  <div className="text-3xl font-black tracking-[-0.04em] text-[#F6F3EC]">SOFTWARE</div>
                </div>
              </div>
            </FadeIn>

            <div className="grid gap-4">
              {aiPillars.map((item, index) => (
                <FadeIn key={item.title} delayMs={index * 80}>
                  <div className="border border-[#2D2D2D] p-6">
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#B8F34A]">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[#F6F3EC]">{item.title}</div>
                    <p className="mt-3 text-base leading-7 text-[#C9C4B8]">{item.description}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="08 / CURRICULO"
              title={
                <>
                  Conteudo organizado.
                  <br />
                  Sem catalogo solto.
                </>
              }
              description="Voce enxerga a trilha inteira e entende o que ja esta pronto, o que esta crescendo e o que faz parte da evolucao da formacao."
            />
          </FadeIn>
          <div className="mt-12">
            {curriculumEntries.map((entry) => (
              <CurriculumAccordion
                key={entry.number}
                {...entry}
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#D64E2E] bg-[#FF5A36]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.95fr,1.05fr] md:px-8 md:py-20">
          <FadeIn>
            <Eyebrow tone="orange">Lancamento / 31.08.2026</Eyebrow>
            <h2 className="mt-4 max-w-3xl text-balance text-[2.3rem] font-black leading-[0.98] tracking-[-0.04em] text-[#151515] md:text-[4rem]">
              Entre agora.
              <br />
              A formacao esta crescendo.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#151515]/80">
              O valor de lancamento existe porque esta e a fase de consolidacao da trilha completa em uma unica formacao.
              Voce entra na etapa fundadora enquanto o conteudo continua evoluindo.
            </p>
          </FadeIn>
          <FadeIn delayMs={80}>
            {config.launchActive ? (
              <LaunchCountdown
                endDate={config.launchEndDate}
                itemClassName="rounded-none border-[#151515]/20 bg-[#151515]/6"
                valueClassName="text-[#151515] text-4xl md:text-5xl"
                labelClassName="text-[#151515]/70"
              />
            ) : (
              <div className="border border-[#151515]/20 bg-[#151515]/6 p-6 text-base leading-7 text-[#151515]/80">
                O periodo de lancamento termina em 31 de agosto de 2026, as 23:59:59, no horario de Sao Paulo.
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      <section id="offer" className="border-b border-[#2D2D2D] bg-[#171717]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1fr,0.95fr] md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="09 / OFERTA"
              title="Tudo em uma unica formacao."
              description="Uma jornada para sair da confusao inicial, construir software com mais criterio e chegar a backend, Full Stack, cloud, automacoes e IA dentro da mesma visao."
              dark
            />
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {offerChecklist.map((item) => (
                <div key={item} className="border border-[#2D2D2D] px-4 py-4 text-sm text-[#F6F3EC]">
                  {item}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div id="pricing" className="border border-[#2D2D2D] p-8">
              <div className="font-mono text-xs uppercase tracking-[0.24em] text-[#B8F34A]">Condicao de lancamento</div>
              <div className="mt-6 text-sm text-[#8F8A80] line-through">R$ {config.regularPrice.toFixed(0)}</div>
              <div className="mt-2 text-[3.4rem] font-black leading-none tracking-[-0.05em] text-[#F6F3EC] md:text-[4.8rem]">
                {priceLabel}
              </div>
              <div className="mt-3 text-sm text-[#C9C4B8]">Prazo real ate 31/08/2026. Sem etapas desnecessarias antes do checkout.</div>

              <div className="mt-8 grid gap-3 text-sm leading-7 text-[#C9C4B8]">
                <div>Comece pelos fundamentos e avance ate aplicacoes completas.</div>
                <div>Estude no seu ritmo, com acesso online.</div>
                <div>Entre enquanto a trilha esta em expansao e crescimento.</div>
              </div>

              <div className="mt-8">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="ENTRAR NA FORMACAO →"
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  value={config.activePrice}
                  currency="BRL"
                  customEvent="pricing_cta_click"
                  eventData={eventData}
                  hideGlow
                  className="w-full rounded-[8px] border border-[#295CFF] bg-[#295CFF] px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-none hover:bg-[#1E49D6]"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionHeading
              eyebrow="10 / PROVAS"
              title={
                <>
                  O que voce vai construir
                  <br />
                  precisa parecer real.
                </>
              }
              description="Em vez de prometer no vazio, a pagina mostra referencias tecnicas, stack e composicoes visuais do ecossistema Plugando IA."
            />
          </FadeIn>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {proofItems.map((item, index) => (
              <FadeIn key={item.title} delayMs={index * 80}>
                <div className="overflow-hidden border border-[#D7D3CA] bg-[#ECE8DF]">
                  <Image src={item.image} alt={item.title} width={1600} height={960} className="h-auto w-full" />
                  <div className="border-t border-[#D7D3CA] p-6">
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#62625E]">
                      Prova visual / {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[#151515]">{item.title}</div>
                    <p className="mt-3 text-base leading-7 text-[#62625E]">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA] bg-[#ECE8DF]">
        <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
          <FadeIn>
            <SectionHeading
              eyebrow="11 / DECISAO"
              title="As duvidas que costumam travar a entrada."
              description="Se voce esta comecando, estas costumam ser as perguntas mais comuns antes de assumir uma trilha longa."
            />
          </FadeIn>
          <div className="mt-10 grid gap-4">
            {objections.slice(0, 4).map((item) => (
              <TrackedAccordion
                key={item.question}
                title={item.question}
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
                eventName="objection_open"
                className="rounded-none border-x-0 border-b border-t-0 border-[#D7D3CA] bg-transparent px-0 py-5 open:bg-transparent"
                titleClassName="text-lg font-semibold text-[#151515]"
                contentClassName="text-[#62625E] text-base leading-7"
                iconClassName="h-9 w-9 rounded-none border-[#D7D3CA] bg-transparent text-[#151515]"
              >
                {item.answer}
              </TrackedAccordion>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-[#295CFF]">FAQ / 09</div>
            <h2 className="mt-4 text-balance text-[2.3rem] font-black leading-[0.98] tracking-[-0.04em] text-[#151515] md:text-[4rem]">
              Respostas para decidir com clareza.
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-4">
            {faq.slice(0, 9).map((item) => (
              <TrackedAccordion
                key={item.question}
                title={item.question}
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
                eventName="faq_open"
                className="rounded-none border-x-0 border-b border-t-0 border-[#D7D3CA] bg-transparent px-0 py-5 open:bg-transparent"
                titleClassName="text-lg font-semibold text-[#151515]"
                contentClassName="text-[#62625E] text-base leading-7"
                iconClassName="h-9 w-9 rounded-none border-[#D7D3CA] bg-transparent text-[#151515]"
              >
                {item.answer}
              </TrackedAccordion>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center md:px-8 md:py-24">
          <FadeIn>
            <Eyebrow>12 / PROXIMO PASSO</Eyebrow>
            <h2 className="mt-4 text-balance text-[2.6rem] font-black leading-[0.98] tracking-[-0.05em] text-[#151515] md:text-[4.6rem]">
              Voce nao precisa dominar tudo hoje.
              <br />
              Precisa comecar pela etapa certa.
            </h2>
            <div className="mt-6 text-sm text-[#62625E] line-through">R$ {config.regularPrice.toFixed(0)}</div>
            <div className="mt-2 text-[3.2rem] font-black leading-none tracking-[-0.05em] text-[#151515] md:text-[4.8rem]">
              {priceLabel}
            </div>
            <div className="mt-2 font-mono text-xs uppercase tracking-[0.24em] text-[#FF5A36]">Ate 31 AGO 2026</div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedCheckoutButton
                href={config.checkoutUrl}
                label="QUERO ENTRAR AGORA →"
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
                value={config.activePrice}
                currency="BRL"
                customEvent="final_cta_click"
                eventData={eventData}
                hideGlow
                className="rounded-[8px] border border-[#295CFF] bg-[#295CFF] px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-none hover:bg-[#1E49D6]"
              />
              <SecondaryLink href="#pricing">REVER A OFERTA</SecondaryLink>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="bg-[#151515]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <div className="text-3xl font-black tracking-[-0.05em] text-[#F6F3EC] md:text-5xl">PLUGANDO IA</div>
            <div className="mt-3 text-sm text-[#C9C4B8]">Formacao Desenvolvedor Full Stack + IA</div>
          </div>
          <div className="flex flex-wrap gap-5 font-mono text-xs uppercase tracking-[0.22em] text-[#C9C4B8]">
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
        title={config.shortName}
        priceLabel={priceLabel}
        href={config.checkoutUrl}
        label="ENTRAR →"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        value={config.activePrice}
        currency="BRL"
        className="border-[#D7D3CA] bg-[#F4F1EA]/96"
        titleClassName="text-[#151515]"
        priceClassName="text-[#FF5A36]"
        buttonClassName="rounded-[8px] border border-[#295CFF] bg-[#295CFF] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-none hover:bg-[#1E49D6]"
        hideGlow
      />
    </main>
  );
}
