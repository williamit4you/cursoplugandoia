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
import { courseConfig, getCourseRuntimeConfig } from "@/lib/courseCompletoConfig";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

export const metadata = {
  title: "Formacao Desenvolvedor Full Stack + IA | Plugando IA",
  description:
    "Aprenda programacao construindo projetos de verdade. Comece do zero com C# e evolua para .NET, Next.js, AWS, automacoes e Inteligencia Artificial.",
  alternates: {
    canonical: "/curso-completo",
  },
  openGraph: {
    title: "Formacao Desenvolvedor Full Stack + IA | Plugando IA",
    description:
      "Aprenda programacao construindo projetos de verdade. Comece do zero com C# e evolua para .NET, Next.js, AWS, automacoes e Inteligencia Artificial.",
    url: "/curso-completo",
    siteName: "Plugando IA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Formacao Desenvolvedor Full Stack + IA | Plugando IA",
    description:
      "Aprenda programacao construindo projetos de verdade. Comece do zero com C# e evolua para .NET, Next.js, AWS, automacoes e Inteligencia Artificial.",
  },
};

const journeyItems = [
  {
    number: "01",
    title: "Fundamentos",
    description:
      "Comece entendendo logica, variaveis, condicoes, funcoes, orientacao a objetos e os conceitos essenciais da programacao usando C#.",
    stack: "C# • Logica • POO • LINQ",
  },
  {
    number: "02",
    title: "Backend",
    description:
      "Aprenda como construir APIs, salvar informacoes em banco de dados, criar autenticacao e desenvolver a parte que fica por tras das aplicacoes.",
    stack: ".NET • Web API • EF Core • JWT",
  },
  {
    number: "03",
    title: "Full Stack",
    description: "Avance para aplicacoes web e entenda como interface, servidor e dados trabalham juntos.",
    stack: "Next.js • APIs • Server Actions",
  },
  {
    number: "04",
    title: "Arquitetura",
    description:
      "Conforme seus projetos crescem, aprenda principios para organizar melhor o codigo e tomar decisoes melhores na construcao de software.",
    stack: "SOLID • Coesao • Acoplamento • Arquitetura",
  },
  {
    number: "05",
    title: "Cloud",
    description:
      "Tire seus projetos da sua maquina e conheca servicos utilizados para colocar aplicacoes e bancos de dados na nuvem.",
    stack: "AWS • EC2 • RDS • S3 • Lambda",
  },
  {
    number: "06",
    title: "Automacao e IA",
    description:
      "Conecte sistemas, automatize processos e comece a integrar Inteligencia Artificial as suas aplicacoes.",
    stack: "n8n • APIs • IA • RAG • Agentes",
  },
  {
    number: "07",
    title: "SaaS",
    description: "Veja todas essas pecas se encontrando na construcao de um software completo.",
    stack: "Sistema • Banco • Pagamentos • Assinatura • Deploy",
  },
];

const projectItems = [
  {
    title: "API completa com .NET",
    description:
      "Crie uma API com cadastro de clientes, servicos e agendamentos, banco de dados, relacionamentos, autenticacao e autorizacao.",
    stack: "C# • .NET • EF Core • JWT",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Aplicacao Full Stack",
    description: "Aprenda a criar aplicacoes web modernas e conectar interface, rotas, APIs e dados.",
    stack: "Next.js • Server Components • Server Actions • APIs",
    image: "/imersao-ia-tech-stack.svg",
  },
  {
    title: "Aplicacao na AWS",
    description:
      "Entenda como publicar aplicacoes e trabalhar com infraestrutura, servidores, bancos de dados e servicos em Cloud.",
    stack: "EC2 • RDS • S3 • Elastic Beanstalk • Lambda",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Automacoes com n8n",
    description: "Crie fluxos que recebem informacoes, executam regras, chamam APIs e automatizam processos.",
    stack: "n8n • HTTP Request • APIs • Workflows",
    image: "/imersao-ia-tech-stack.svg",
  },
  {
    title: "Aplicacao com RAG",
    description:
      "Aprenda como uma aplicacao pode consultar informacoes proprias para fornecer contexto a uma Inteligencia Artificial.",
    stack: "IA • RAG • PostgreSQL • Banco vetorial",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Agente de IA",
    description: "Construa uma aplicacao que conversa com modelos de IA utilizando contexto e memoria.",
    stack: "Next.js • IA • Contexto • Memoria",
    image: "/imersao-ia-tech-stack.svg",
  },
  {
    title: "SaaS completo",
    description:
      "Acompanhe a construcao de um sistema com usuarios, clientes, produtos, servicos, banco de dados, trial, pagamentos, assinatura e deploy.",
    stack: "SaaS • PostgreSQL • Pagamentos • Docker • Deploy",
    image: "/plugando-ia-hero.svg",
  },
];

const curriculumSections = [
  {
    number: "01",
    title: "Fundamentos da Linguagem C#",
    subtitle: "Para quem esta comecando.",
    items: [
      "Logica de programacao",
      "Variaveis e tipos de dados",
      "Operadores",
      "Condicionais",
      "Loops",
      "Metodos",
      "Arrays e listas",
      "Dictionary, Queue e Stack",
      "Classes e objetos",
      "Orientacao a objetos",
      "Heranca",
      "Interfaces",
      "Records",
      "Manipulacao de strings",
      "Datas",
      "Arquivos",
      "LINQ",
    ],
  },
  {
    number: "02",
    title: "Backend com .NET Web API",
    subtitle: "Comece a construir aplicacoes de verdade.",
    items: [
      "APIs REST",
      "Controllers",
      "Modelagem de dados",
      "Entity Framework Core",
      "Migrations",
      "CRUD",
      "Relacionamentos",
      "Banco de dados",
      "JWT",
      "Identity",
      "Login",
      "Autenticacao",
      "Autorizacao",
      "Claims",
    ],
  },
  {
    number: "03",
    title: "Desenvolvimento com Next.js",
    subtitle: "Entenda como construir aplicacoes web modernas.",
    items: [
      "Rotas",
      "Layouts",
      "Rotas dinamicas",
      "Server Components",
      "Client Components",
      "Navegacao",
      "APIs",
      "Cache",
      "Middleware",
      "Server Actions",
      "Formularios",
    ],
  },
  {
    number: "04",
    title: "Fundamentos de Arquitetura de Software",
    subtitle: "Aprenda a organizar melhor o que voce constroi.",
    items: [
      "Requisitos funcionais e nao funcionais",
      "Regras de negocio",
      "Escalabilidade",
      "Disponibilidade",
      "Desempenho",
      "Seguranca",
      "Manutenibilidade",
      "Alta coesao e baixo acoplamento",
      "Separacao de responsabilidades",
      "Encapsulamento",
      "Modularidade",
      "Abstracao",
      "SOLID",
      "DRY, KISS e YAGNI",
      "Arquitetura em camadas",
      "Monolitos",
      "REST",
      "GraphQL",
      "gRPC",
      "WebSockets",
    ],
  },
  {
    number: "05",
    title: "AWS",
    subtitle: "Aprenda como seus projetos chegam a nuvem.",
    items: [
      "EC2",
      "Linux e Windows na AWS",
      "IAM",
      "VPC",
      "Subnets",
      "Elastic IP",
      "RDS",
      "PostgreSQL",
      "S3",
      "SNS",
      "Elastic Beanstalk",
      "Auto Scaling",
      "Lambda",
      "API Gateway",
    ],
  },
  {
    number: "06",
    title: "Automacao com n8n",
    subtitle: "Faca sistemas conversarem entre si.",
    items: ["Workflows", "Triggers", "Credenciais", "Condicoes", "Filtros", "Code Node", "HTTP Request", "APIs", "Integracoes"],
  },
  {
    number: "07",
    title: "Inteligencia Artificial e Agentes",
    subtitle: "Use IA dentro das aplicacoes que voce constroi.",
    items: ["Integracao com modelos de IA", "APIs de IA", "Chat", "Contexto", "Memoria", "Agentes", "RAG", "Banco vetorial"],
  },
  {
    number: "08",
    title: "Construcao de SaaS",
    subtitle: "Veja como uma aplicacao pode evoluir para um produto.",
    items: [
      "Cadastro",
      "Login",
      "Banco PostgreSQL",
      "Clientes",
      "Produtos e servicos",
      "Importacao de dados",
      "Ordens de servico",
      "Trial",
      "Pagamentos",
      "Assinaturas",
      "Docker",
      "Deploy",
    ],
  },
];

const audienceItems = [
  "Nunca programou e quer comecar",
  "Ja comecou outros cursos, mas continua perdido",
  "Quer aprender seguindo uma sequencia",
  "Quer construir projetos em vez de apenas assistir aulas",
  "Quer aprender backend e frontend",
  "Quer entender banco de dados",
  "Quer aprender Cloud",
  "Quer conhecer Arquitetura de Software",
  "Quer entender como IA entra em aplicacoes reais",
  "Tem vontade de construir seu proprio sistema ou SaaS",
];

const receiveItems = [
  "Fundamentos de C#",
  "Backend com .NET",
  "Entity Framework Core",
  "APIs REST",
  "Autenticacao JWT",
  "Next.js",
  "Fundamentos de Arquitetura",
  "AWS",
  "n8n",
  "Inteligencia Artificial",
  "Agentes de IA",
  "RAG",
  "Projeto SaaS",
  "Projetos praticos",
];

const faqItems = [
  {
    question: "Preciso saber programar antes?",
    answer:
      "Nao. A formacao comeca pelos fundamentos de programacao utilizando C# e avanca gradualmente para os demais conteudos.",
  },
  {
    question: "Por onde devo comecar?",
    answer: "Se voce esta comecando do zero, comece pela trilha de Fundamentos de C# e siga a sequencia recomendada da formacao.",
  },
  {
    question: "Preciso estudar tudo ao mesmo tempo?",
    answer:
      "Nao. Justamente o contrario. A proposta e que voce avance por etapas e construa sua base antes de chegar aos assuntos mais avancados.",
  },
  {
    question: "Vou aprender frontend e backend?",
    answer: "Sim. O backend e trabalhado principalmente com C# e .NET, enquanto Next.js e utilizado na construcao das aplicacoes web.",
  },
  {
    question: "Tem banco de dados?",
    answer: "Sim. Banco de dados aparece em diferentes projetos, incluindo Entity Framework Core e PostgreSQL.",
  },
  {
    question: "Tem AWS?",
    answer:
      "Sim. A formacao possui uma trilha dedicada a AWS, passando por servicos como EC2, RDS, S3, VPC, Elastic Beanstalk, Lambda e outros.",
  },
  {
    question: "Arquitetura de Software ja esta disponivel?",
    answer: "A trilha de Fundamentos de Arquitetura esta sendo adicionada a formacao e continuara recebendo novas aulas.",
  },
  {
    question: "Vou aprender Inteligencia Artificial?",
    answer: "Sim. A formacao avanca para aplicacoes que integram modelos de IA, agentes, contexto, memoria e RAG.",
  },
  {
    question: "Tem projetos praticos?",
    answer: "Sim. A formacao acompanha projetos envolvendo APIs, aplicacoes web, Cloud, automacoes, agentes, RAG e SaaS.",
  },
  {
    question: "Ate quando vale o preco de lancamento?",
    answer: "O valor de R$ 149,90 e a condicao de lancamento ate 31 de agosto de 2026, as 23:59.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-xs uppercase tracking-[0.28em] text-[#295CFF]">{children}</div>;
}

function SectionTitle({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div className="max-w-4xl">
      <div className={`font-mono text-xs uppercase tracking-[0.28em] ${light ? "text-[#B8F34A]" : "text-[#295CFF]"}`}>{eyebrow}</div>
      <h2
        className={`mt-4 text-balance text-[2.2rem] font-black leading-[0.98] tracking-[-0.04em] md:text-[4rem] ${
          light ? "text-[#F6F3EC]" : "text-[#151515]"
        }`}
      >
        {title}
      </h2>
      {description ? <p className={`mt-5 max-w-3xl text-lg leading-8 ${light ? "text-[#C9C4B8]" : "text-[#62625E]"}`}>{description}</p> : null}
    </div>
  );
}

export default async function CursoCompletoPage() {
  const config = getCourseRuntimeConfig();
  const metaPixelId = await resolveSalesPageMetaPixelId(courseConfig.pageKey, { preferEnvFallback: true });
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
        metadata={{ offerPrice: config.activePrice, currency: "BRL", offerName: config.name }}
      />
      <SalesViewContentTracker
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        currency="BRL"
        value={config.activePrice}
        metadata={{ contentName: config.name, contentType: "course" }}
      />
      <MetaPixelViewContent data={eventData} />
      <SectionViewTracker selectorId="journey" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="journey_view" />
      <SectionViewTracker selectorId="projects" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="projects_view" />
      <SectionViewTracker selectorId="pricing" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="pricing_view" />

      <header className="sticky top-0 z-40 border-b border-[#D7D3CA] bg-[#F4F1EA]/94 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
          <Link href="/curso-completo" className="font-mono text-xs uppercase tracking-[0.28em] text-[#151515]">
            Formacao Full Stack + IA
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#journey" className="text-sm text-[#62625E] transition hover:text-[#151515]">
              O caminho
            </a>
            <a href="#projects" className="text-sm text-[#62625E] transition hover:text-[#151515]">
              Projetos
            </a>
            <a href="#curriculum" className="text-sm text-[#62625E] transition hover:text-[#151515]">
              Formacao
            </a>
            <a href="#pricing" className="text-sm text-[#62625E] transition hover:text-[#151515]">
              Oferta
            </a>
            <a href="#faq" className="text-sm text-[#62625E] transition hover:text-[#151515]">
              FAQ
            </a>
          </nav>
          <TrackedCheckoutButton
            href={config.checkoutUrl}
            label="QUERO COMECAR AGORA →"
            pageKey={config.pageKey}
            pagePath={config.pagePath}
            pageTitle={config.pageTitle}
            value={config.activePrice}
            currency="BRL"
            customEvent="header_cta_click"
            eventData={eventData}
            hideGlow
            className="hidden rounded-[8px] border border-[#295CFF] bg-[#295CFF] px-5 py-3 text-sm font-semibold text-white shadow-none hover:bg-[#1E49D6] md:inline-flex"
          />
        </div>
      </header>

      <section className="border-b border-[#D7D3CA]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.05fr,0.95fr] md:px-8 md:py-24">
          <FadeIn>
            <Eyebrow>Formacao Full Stack + IA • Nova turma 2026</Eyebrow>
            <h1 className="mt-5 max-w-5xl text-balance text-[3rem] font-black leading-[0.94] tracking-[-0.05em] md:text-[5.4rem]">
              Aprenda programacao construindo projetos de verdade.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#62625E] md:text-xl">
              Comece do zero com C# e evolua passo a passo para APIs com .NET, aplicacoes com Next.js, Cloud com AWS, automacoes e projetos com Inteligencia Artificial.
            </p>
            <div className="mt-8 space-y-3 text-base font-semibold text-[#151515]">
              <div>✓ Comece mesmo sem experiencia em programacao</div>
              <div>✓ Aprenda seguindo uma sequencia clara</div>
              <div>✓ Construa projetos enquanto evolui</div>
            </div>
            <div className="mt-10 grid gap-5 border-t border-[#D7D3CA] pt-8 md:max-w-2xl md:grid-cols-[1fr,0.9fr]">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#FF5A36]">Preco especial de lancamento</div>
                <div className="mt-4 text-sm text-[#62625E] line-through">R$ {config.regularPrice.toFixed(0)}</div>
                <div className="mt-2 text-[3.3rem] font-black leading-none tracking-[-0.05em] md:text-[4.8rem]">{priceLabel}</div>
                <div className="mt-2 text-sm font-semibold text-[#FF5A36]">ate 31 de agosto</div>
              </div>
              <div className="grid gap-3">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="QUERO COMECAR AGORA →"
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
                <div className="text-sm text-[#62625E]">Acesso online • Estude no seu ritmo</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="grid gap-5">
              <div className="overflow-hidden border border-[#D7D3CA] bg-[#ECE8DF]">
                <Image src="/plugando-ia-hero.svg" alt="Visual tecnico da Formacao Full Stack + IA" width={1600} height={960} priority className="h-auto w-full" />
              </div>
              <div className="border border-[#D7D3CA] bg-[#ECE8DF] p-6">
                <div className="text-[1.7rem] font-black leading-tight tracking-[-0.04em]">Voce nao precisa aprender tudo de uma vez.</div>
                <div className="mt-4 space-y-3 text-base leading-7 text-[#62625E]">
                  <p>Quando voce comeca a pesquisar programacao, parece que existe uma lista infinita de coisas para estudar.</p>
                  <p>C# ou JavaScript? Frontend ou backend? Banco de dados? API? Cloud? Arquitetura? E agora Inteligencia Artificial?</p>
                  <p>O problema nao e encontrar conteudo. O dificil e saber o que aprender primeiro e o que vem depois.</p>
                  <p>Foi por isso que esta formacao foi organizada como uma trilha.</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="journey" className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle eyebrow="O caminho" title={<>Comece pelo basico. Evolua projeto por projeto.</>} description="Voce comeca construindo sua base e avanca gradualmente para projetos cada vez mais completos." />
          </FadeIn>
          <div className="mt-14 divide-y divide-[#D7D3CA] border-y border-[#D7D3CA]">
            {journeyItems.map((item, index) => (
              <FadeIn key={item.number} delayMs={index * 60}>
                <div className="grid gap-5 py-8 md:grid-cols-[90px,1fr,0.9fr]">
                  <div className="font-mono text-2xl text-[#295CFF]">{item.number}</div>
                  <div>
                    <h3 className="text-[1.9rem] font-black leading-tight tracking-[-0.04em]">{item.title}</h3>
                    <div className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-[#295CFF]">{item.stack}</div>
                  </div>
                  <p className="text-base leading-7 text-[#62625E]">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delayMs={120}>
            <div className="mt-12 max-w-4xl text-[1.6rem] font-black leading-tight tracking-[-0.04em] text-[#151515]">
              O objetivo e chegar ao ponto em que voce consegue olhar para uma ideia e comecar a entender como transforma-la em software.
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="projects" className="border-b border-[#D7D3CA] bg-[#ECE8DF]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle
              eyebrow="Projetos"
              title={<>Voce nao vai ficar apenas na teoria.</>}
              description="Ao longo da formacao, voce acompanha a construcao de projetos que mostram como as tecnologias funcionam juntas."
            />
          </FadeIn>
          <div className="mt-14 grid gap-10">
            {projectItems.map((project, index) => {
              const reverse = index % 2 === 1;
              return (
                <FadeIn key={project.title} delayMs={index * 60}>
                  <div className={`grid gap-8 lg:grid-cols-2 lg:items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
                    <div className="overflow-hidden border border-[#D7D3CA] bg-[#F4F1EA]">
                      <Image src={project.image} alt={project.title} width={1600} height={960} className="h-auto w-full" />
                    </div>
                    <div>
                      <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#62625E]">Aprender fazendo</div>
                      <h3 className="mt-3 text-[2rem] font-black leading-tight tracking-[-0.04em] md:text-[2.8rem]">{project.title}</h3>
                      <p className="mt-4 text-base leading-7 text-[#62625E]">{project.description}</p>
                      <div className="mt-5 border-t border-[#D7D3CA] pt-4 font-mono text-xs uppercase tracking-[0.22em] text-[#295CFF]">{project.stack}</div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section id="curriculum" className="border-b border-[#2D2D2D] bg-[#171717]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle eyebrow="A formacao" title={<>Tudo comeca pela base.</>} light />
          </FadeIn>
          <div className="mt-14 grid gap-6">
            {curriculumSections.map((section, index) => (
              <FadeIn key={section.number} delayMs={index * 50}>
                <div className="border border-[#2D2D2D] p-6 md:p-8">
                  <div className="font-mono text-xs uppercase tracking-[0.24em] text-[#B8F34A]">{section.number}</div>
                  <h3 className="mt-3 text-[1.9rem] font-black leading-tight tracking-[-0.04em] text-[#F6F3EC]">{section.title}</h3>
                  <div className="mt-2 text-base font-semibold text-[#C9C4B8]">{section.subtitle}</div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((item) => (
                      <div key={item} className="border-t border-[#2D2D2D] pt-3 text-sm leading-6 text-[#F6F3EC]">
                        ✓ {item}
                      </div>
                    ))}
                  </div>
                  {section.number === "04" ? (
                    <p className="mt-6 max-w-4xl text-sm leading-7 text-[#C9C4B8]">
                      E esta trilha continuara recebendo novos conteudos, avancando posteriormente para temas relacionados a Arquitetura em Cloud.
                    </p>
                  ) : null}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1fr,0.95fr] md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle
              eyebrow="Programacao + Inteligencia Artificial"
              title={<>A IA pode escrever codigo. Mas alguem ainda precisa saber o que fazer com ele.</>}
              description="Ferramentas de Inteligencia Artificial podem acelerar muito o desenvolvimento. Mas existe uma grande diferenca entre receber um codigo pronto e conseguir entender se aquele codigo esta correto, adaptar uma regra, encontrar um problema ou transformar aquilo em uma aplicacao completa."
            />
            <div className="mt-6 text-lg font-semibold text-[#151515]">Por isso, a formacao nao comeca pela IA. Comeca pela programacao.</div>
            <div className="mt-4 text-base leading-7 text-[#62625E]">
              Voce constroi sua base, aprende como aplicacoes funcionam e entao passa a utilizar IA como uma ferramenta para acelerar o que ja sabe construir.
            </div>
          </FadeIn>
          <FadeIn delayMs={100}>
            <div className="border border-[#D7D3CA] bg-[#ECE8DF] p-8">
              <div className="space-y-6">
                <div className="text-[2rem] font-black leading-tight tracking-[-0.04em]">Aprenda a programar.</div>
                <div className="h-px bg-[#D7D3CA]" />
                <div className="text-[2rem] font-black leading-tight tracking-[-0.04em]">Aprenda a construir.</div>
                <div className="h-px bg-[#D7D3CA]" />
                <div className="text-[2rem] font-black leading-tight tracking-[-0.04em] text-[#295CFF]">Use IA para ir alem.</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA] bg-[#ECE8DF]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle eyebrow="Para quem e" title={<>Esta formacao e para voce que...</>} />
          </FadeIn>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {audienceItems.map((item) => (
              <div key={item} className="border-t border-[#D7D3CA] pt-3 text-sm leading-6 text-[#151515]">
                ✓ {item}
              </div>
            ))}
          </div>
          <FadeIn delayMs={120}>
            <div className="mt-12 text-[1.8rem] font-black leading-tight tracking-[-0.04em]">Voce nao precisa chegar sabendo.</div>
            <div className="mt-2 text-lg font-semibold text-[#151515]">Voce entra para aprender.</div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.95fr,1.05fr] md:px-8 md:py-24">
          <FadeIn>
            <div className="overflow-hidden border border-[#D7D3CA] bg-[#ECE8DF]">
              <Image src="/imersao-ia-tech-stack.svg" alt="Ecossistema tecnico Plugando IA" width={1600} height={960} className="h-auto w-full" />
            </div>
          </FadeIn>
          <FadeIn delayMs={100}>
            <SectionTitle
              eyebrow="Sobre o professor"
              title={<>Quem vai te acompanhar durante a formacao</>}
              description="Eu criei esta formacao pensando principalmente em quem olha para o desenvolvimento atual e nao sabe mais por onde comecar."
            />
            <div className="mt-6 space-y-4 text-base leading-7 text-[#62625E]">
              <p>Hoje voce encontra C#, JavaScript, frameworks, Cloud, automacoes e Inteligencia Artificial disputando sua atencao ao mesmo tempo.</p>
              <p>Minha proposta e diferente: comecar pela base e conectar as pecas aos poucos.</p>
              <p>Em vez de aprender ferramentas isoladas, quero mostrar como elas aparecem na construcao de aplicacoes reais.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#D64E2E] bg-[#FF5A36]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.95fr,1.05fr] md:px-8 md:py-24">
          <FadeIn>
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-[#151515]">Nova formacao 2026</div>
            <h2 className="mt-4 max-w-4xl text-balance text-[2.4rem] font-black leading-[0.98] tracking-[-0.04em] text-[#151515] md:text-[4rem]">
              A formacao cresceu. E esta e a condicao de lancamento.
            </h2>
            <div className="mt-5 max-w-3xl space-y-4 text-base leading-7 text-[#151515]/80">
              <p>Os conteudos que antes estavam separados agora fazem parte de uma formacao organizada para acompanhar sua evolucao desde os fundamentos.</p>
              <p>E essa formacao esta crescendo.</p>
              <p>A nova trilha de Fundamentos de Arquitetura de Software ja comecou a ser adicionada e continuara evoluindo com novos conteudos.</p>
              <p>Por isso, durante este lancamento, voce pode entrar por uma condicao especial.</p>
            </div>
          </FadeIn>
          <FadeIn delayMs={100}>
            <div className="border border-[#151515]/20 bg-[#151515]/5 p-8">
              <div className="text-sm text-[#151515]/70">Preco oficial</div>
              <div className="mt-2 text-xl line-through text-[#151515]/75">R$ {config.regularPrice.toFixed(0)}</div>
              <div className="mt-6 text-sm text-[#151515]/70">Preco de lancamento</div>
              <div className="mt-2 text-[3.4rem] font-black leading-none tracking-[-0.05em] text-[#151515] md:text-[4.8rem]">{priceLabel}</div>
              <div className="mt-3 text-sm font-semibold text-[#151515]">Condicao valida ate 31/08/2026 as 23:59.</div>
              <div className="mt-8">
                {config.launchActive ? (
                  <LaunchCountdown
                    endDate={config.launchEndDate}
                    itemClassName="rounded-none border-[#151515]/20 bg-[#151515]/6"
                    valueClassName="text-[#151515] text-3xl md:text-4xl"
                    labelClassName="text-[#151515]/70"
                  />
                ) : null}
              </div>
              <div className="mt-8">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="QUERO ENTRAR NA FORMACAO →"
                  pageKey={config.pageKey}
                  pagePath={config.pagePath}
                  pageTitle={config.pageTitle}
                  value={config.activePrice}
                  currency="BRL"
                  customEvent="launch_cta_click"
                  eventData={eventData}
                  hideGlow
                  className="w-full rounded-[8px] border border-[#151515] bg-[#151515] px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#F4F1EA] shadow-none hover:bg-black"
                />
              </div>
              <div className="mt-3 text-sm text-[#151515]/75">Acesso online • Estude no seu ritmo</div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="pricing" className="border-b border-[#2D2D2D] bg-[#171717]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1fr,0.95fr] md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle eyebrow="O que voce recebe" title={<>Uma formacao. Uma sequencia completa.</>} description="Ao entrar, voce tera acesso aos conteudos disponibilizados na formacao." light />
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {receiveItems.map((item) => (
                <div key={item} className="border-t border-[#2D2D2D] pt-3 text-sm leading-6 text-[#F6F3EC]">
                  ✓ {item}
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delayMs={120}>
            <div className="border border-[#2D2D2D] p-8">
              <div className="text-sm text-[#C9C4B8]">Tudo por</div>
              <div className="mt-2 text-sm text-[#8F8A80] line-through">R$ {config.regularPrice.toFixed(0)}</div>
              <div className="mt-2 text-[3.4rem] font-black leading-none tracking-[-0.05em] text-[#F6F3EC] md:text-[4.8rem]">{priceLabel}</div>
              <div className="mt-3 text-sm text-[#C9C4B8]">no lancamento.</div>
              <div className="mt-8">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="QUERO COMECAR AGORA →"
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

      <section id="faq" className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle eyebrow="FAQ" title={<>Respostas para decidir com clareza.</>} />
          </FadeIn>
          <div className="mt-12 grid gap-4">
            {faqItems.map((item) => (
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
            <h2 className="text-balance text-[2.6rem] font-black leading-[0.98] tracking-[-0.05em] text-[#151515] md:text-[4.8rem]">
              Voce nao precisa aprender tudo hoje.
            </h2>
            <div className="mt-3 text-[1.5rem] font-black leading-tight tracking-[-0.04em] text-[#151515] md:text-[2.2rem]">Precisa comecar pela primeira etapa.</div>
            <div className="mx-auto mt-8 max-w-3xl space-y-3 text-base leading-7 text-[#62625E]">
              <p>Comece pelos fundamentos.</p>
              <p>Construa seu primeiro projeto.</p>
              <p>Depois o proximo.</p>
              <p>E continue evoluindo ate entender como aplicacoes modernas, Cloud e Inteligencia Artificial se conectam.</p>
            </div>
            <div className="mt-8 text-sm text-[#62625E] line-through">R$ {config.regularPrice.toFixed(0)}</div>
            <div className="mt-2 text-[3.2rem] font-black leading-none tracking-[-0.05em] text-[#151515] md:text-[4.8rem]">{priceLabel}</div>
            <div className="mt-2 font-mono text-xs uppercase tracking-[0.24em] text-[#FF5A36]">Preco de lancamento ate 31/08</div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedCheckoutButton
                href={config.checkoutUrl}
                label="QUERO COMECAR MINHA FORMACAO →"
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
            </div>
            <div className="mt-4 text-sm text-[#62625E]">Formacao Full Stack + IA — Plugando IA</div>
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
