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
  title: "Formação Desenvolvedor Full Stack + IA | Plugando IA",
  description:
    "Aprenda programação construindo projetos de verdade. Comece do zero com C# e evolua para .NET, Next.js, AWS, automações e Inteligência Artificial.",
  alternates: {
    canonical: "/curso-completo",
  },
  openGraph: {
    title: "Formação Desenvolvedor Full Stack + IA | Plugando IA",
    description:
      "Aprenda programação construindo projetos de verdade. Comece do zero com C# e evolua para .NET, Next.js, AWS, automações e Inteligência Artificial.",
    url: "/curso-completo",
    siteName: "Plugando IA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Formação Desenvolvedor Full Stack + IA | Plugando IA",
    description:
      "Aprenda programação construindo projetos de verdade. Comece do zero com C# e evolua para .NET, Next.js, AWS, automações e Inteligência Artificial.",
  },
};

const journeyItems = [
  {
    number: "01",
    title: "Fundamentos",
    description:
      "Comece entendendo lógica, variáveis, condições, funções, orientação a objetos e os conceitos essenciais da programação usando C#.",
    stack: "C# • Lógica • POO • LINQ",
  },
  {
    number: "02",
    title: "Backend",
    description:
      "Aprenda como construir APIs, salvar informações em banco de dados, criar autenticação e desenvolver a parte que fica por trás das aplicações.",
    stack: ".NET • Web API • EF Core • JWT",
  },
  {
    number: "03",
    title: "Full Stack",
    description: "Avance para aplicações web e entenda como interface, servidor e dados trabalham juntos.",
    stack: "Next.js • APIs • Server Actions",
  },
  {
    number: "04",
    title: "Arquitetura",
    description:
      "Conforme seus projetos crescem, aprenda princípios para organizar melhor o código e tomar decisões melhores na construção de software.",
    stack: "SOLID • Coesão • Acoplamento • Arquitetura",
  },
  {
    number: "05",
    title: "Cloud",
    description:
      "Tire seus projetos da sua máquina e conheça serviços utilizados para colocar aplicações e bancos de dados na nuvem.",
    stack: "AWS • EC2 • RDS • S3 • Lambda",
  },
  {
    number: "06",
    title: "Automação e IA",
    description:
      "Conecte sistemas, automatize processos e comece a integrar Inteligência Artificial às suas aplicações.",
    stack: "n8n • APIs • IA • RAG • Agentes",
  },
  {
    number: "07",
    title: "SaaS",
    description: "Veja todas essas peças se encontrando na construção de um software completo.",
    stack: "Sistema • Banco • Pagamentos • Assinatura • Deploy",
  },
];

const projectItems = [
  {
    title: "API completa com .NET",
    description:
      "Crie uma API com cadastro de clientes, serviços e agendamentos, banco de dados, relacionamentos, autenticação e autorização.",
    stack: "C# • .NET • EF Core • JWT",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Aplicação Full Stack",
    description: "Aprenda a criar aplicações web modernas e conectar interface, rotas, APIs e dados.",
    stack: "Next.js • Server Components • Server Actions • APIs",
    image: "/imersao-ia-tech-stack.svg",
  },
  {
    title: "Aplicação na AWS",
    description:
      "Entenda como publicar aplicações e trabalhar com infraestrutura, servidores, bancos de dados e serviços em Cloud.",
    stack: "EC2 • RDS • S3 • Elastic Beanstalk • Lambda",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Automações com n8n",
    description: "Crie fluxos que recebem informações, executam regras, chamam APIs e automatizam processos.",
    stack: "n8n • HTTP Request • APIs • Workflows",
    image: "/imersao-ia-tech-stack.svg",
  },
  {
    title: "Aplicação com RAG",
    description:
      "Aprenda como uma aplicação pode consultar informações próprias para fornecer contexto a uma Inteligência Artificial.",
    stack: "IA • RAG • PostgreSQL • Banco vetorial",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Agente de IA",
    description: "Construa uma aplicação que conversa com modelos de IA utilizando contexto e memória.",
    stack: "Next.js • IA • Contexto • Memória",
    image: "/imersao-ia-tech-stack.svg",
  },
  {
    title: "SaaS completo",
    description:
      "Acompanhe a construção de um sistema com usuários, clientes, produtos, serviços, banco de dados, trial, pagamentos, assinatura e deploy.",
    stack: "SaaS • PostgreSQL • Pagamentos • Docker • Deploy",
    image: "/plugando-ia-hero.svg",
  },
];

const curriculumSections = [
  {
    number: "01",
    title: "Fundamentos da Linguagem C#",
    subtitle: "Para quem está começando.",
    items: [
      "Lógica de programação",
      "Variáveis e tipos de dados",
      "Operadores",
      "Condicionais",
      "Loops",
      "Métodos",
      "Arrays e listas",
      "Dictionary, Queue e Stack",
      "Classes e objetos",
      "Orientação a objetos",
      "Herança",
      "Interfaces",
      "Records",
      "Manipulação de strings",
      "Datas",
      "Arquivos",
      "LINQ",
    ],
  },
  {
    number: "02",
    title: "Backend com .NET Web API",
    subtitle: "Comece a construir aplicações de verdade.",
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
      "Autenticação",
      "Autorização",
      "Claims",
    ],
  },
  {
    number: "03",
    title: "Desenvolvimento com Next.js",
    subtitle: "Entenda como construir aplicações web modernas.",
    items: [
      "Rotas",
      "Layouts",
      "Rotas dinâmicas",
      "Server Components",
      "Client Components",
      "Navegação",
      "APIs",
      "Cache",
      "Middleware",
      "Server Actions",
      "Formulários",
    ],
  },
  {
    number: "04",
    title: "Fundamentos de Arquitetura de Software",
    subtitle: "Aprenda a organizar melhor o que você constrói.",
    items: [
      "Requisitos funcionais e não funcionais",
      "Regras de negócio",
      "Escalabilidade",
      "Disponibilidade",
      "Desempenho",
      "Segurança",
      "Manutenibilidade",
      "Alta coesão e baixo acoplamento",
      "Separação de responsabilidades",
      "Encapsulamento",
      "Modularidade",
      "Abstração",
      "SOLID",
      "DRY, KISS e YAGNI",
      "Arquitetura em camadas",
      "Monólitos",
      "REST",
      "GraphQL",
      "gRPC",
      "WebSockets",
    ],
  },
  {
    number: "05",
    title: "AWS",
    subtitle: "Aprenda como seus projetos chegam à nuvem.",
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
    title: "Automação com n8n",
    subtitle: "Faça sistemas conversarem entre si.",
    items: ["Workflows", "Triggers", "Credenciais", "Condições", "Filtros", "Code Node", "HTTP Request", "APIs", "Integrações"],
  },
  {
    number: "07",
    title: "Inteligência Artificial e Agentes",
    subtitle: "Use IA dentro das aplicações que você constrói.",
    items: ["Integração com modelos de IA", "APIs de IA", "Chat", "Contexto", "Memória", "Agentes", "RAG", "Banco vetorial"],
  },
  {
    number: "08",
    title: "Construção de SaaS",
    subtitle: "Veja como uma aplicação pode evoluir para um produto.",
    items: [
      "Cadastro",
      "Login",
      "Banco PostgreSQL",
      "Clientes",
      "Produtos e serviços",
      "Importação de dados",
      "Ordens de serviço",
      "Trial",
      "Pagamentos",
      "Assinaturas",
      "Docker",
      "Deploy",
    ],
  },
];

const audienceItems = [
  "Nunca programou e quer começar",
  "Já começou outros cursos, mas continua perdido",
  "Quer aprender seguindo uma sequência",
  "Quer construir projetos em vez de apenas assistir aulas",
  "Quer aprender backend e frontend",
  "Quer entender banco de dados",
  "Quer aprender Cloud",
  "Quer conhecer Arquitetura de Software",
  "Quer entender como IA entra em aplicações reais",
  "Tem vontade de construir seu próprio sistema ou SaaS",
];

const receiveItems = [
  "Fundamentos de C#",
  "Backend com .NET",
  "Entity Framework Core",
  "APIs REST",
  "Autenticação JWT",
  "Next.js",
  "Fundamentos de Arquitetura",
  "AWS",
  "n8n",
  "Inteligência Artificial",
  "Agentes de IA",
  "RAG",
  "Projeto SaaS",
  "Projetos práticos",
];

const faqItems = [
  {
    question: "Preciso saber programar antes?",
    answer:
      "Não. A formação começa pelos fundamentos de programação utilizando C# e avança gradualmente para os demais conteúdos.",
  },
  {
    question: "Por onde devo começar?",
    answer: "Se você está começando do zero, comece pela trilha de Fundamentos de C# e siga a sequência recomendada da formação.",
  },
  {
    question: "Preciso estudar tudo ao mesmo tempo?",
    answer:
      "Não. Justamente o contrário. A proposta é que você avance por etapas e construa sua base antes de chegar aos assuntos mais avançados.",
  },
  {
    question: "Vou aprender frontend e backend?",
    answer: "Sim. O backend é trabalhado principalmente com C# e .NET, enquanto Next.js é utilizado na construção das aplicações web.",
  },
  {
    question: "Tem banco de dados?",
    answer: "Sim. Banco de dados aparece em diferentes projetos, incluindo Entity Framework Core e PostgreSQL.",
  },
  {
    question: "Tem AWS?",
    answer:
      "Sim. A formação possui uma trilha dedicada à AWS, passando por serviços como EC2, RDS, S3, VPC, Elastic Beanstalk, Lambda e outros.",
  },
  {
    question: "Arquitetura de Software já está disponível?",
    answer: "A trilha de Fundamentos de Arquitetura está sendo adicionada à formação e continuará recebendo novas aulas.",
  },
  {
    question: "Vou aprender Inteligência Artificial?",
    answer: "Sim. A formação avança para aplicações que integram modelos de IA, agentes, contexto, memória e RAG.",
  },
  {
    question: "Tem projetos práticos?",
    answer: "Sim. A formação acompanha projetos envolvendo APIs, aplicações web, Cloud, automações, agentes, RAG e SaaS.",
  },
  {
    question: "Até quando vale o preço de lançamento?",
    answer: "O valor de R$ 149,90 é a condição de lançamento até 31 de agosto de 2026, às 23:59.",
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
            Formação Full Stack + IA
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#journey" className="text-sm text-[#62625E] transition hover:text-[#151515]">
              O caminho
            </a>
            <a href="#projects" className="text-sm text-[#62625E] transition hover:text-[#151515]">
              Projetos
            </a>
            <a href="#curriculum" className="text-sm text-[#62625E] transition hover:text-[#151515]">
              Formação
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
            label="QUERO COMEÇAR AGORA →"
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
            <Eyebrow>Formação Full Stack + IA • Nova turma 2026</Eyebrow>
            <h1 className="mt-5 max-w-5xl text-balance text-[3rem] font-black leading-[0.94] tracking-[-0.05em] md:text-[5.4rem]">
              Aprenda programação construindo projetos de verdade.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#62625E] md:text-xl">
              Comece do zero com C# e evolua passo a passo para APIs com .NET, aplicações com Next.js, Cloud com AWS, automações e projetos com Inteligência Artificial.
            </p>
            <div className="mt-8 space-y-3 text-base font-semibold text-[#151515]">
              <div>✓ Comece mesmo sem experiência em programação</div>
              <div>✓ Aprenda seguindo uma sequência clara</div>
              <div>✓ Construa projetos enquanto evolui</div>
            </div>
            <div className="mt-10 grid gap-5 border-t border-[#D7D3CA] pt-8 md:max-w-2xl md:grid-cols-[1fr,0.9fr]">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#FF5A36]">Preço especial de lançamento</div>
                <div className="mt-4 text-sm text-[#62625E] line-through">R$ {config.regularPrice.toFixed(0)}</div>
                <div className="mt-2 text-[3.3rem] font-black leading-none tracking-[-0.05em] md:text-[4.8rem]">{priceLabel}</div>
                <div className="mt-2 text-sm font-semibold text-[#FF5A36]">até 31 de agosto</div>
              </div>
              <div className="grid gap-3">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="QUERO COMEÇAR AGORA →"
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
                <Image src="/plugando-ia-hero.svg" alt="Visual técnico da Formação Full Stack + IA" width={1600} height={960} priority className="h-auto w-full" />
              </div>
              <div className="border border-[#D7D3CA] bg-[#ECE8DF] p-6">
                <div className="text-[1.7rem] font-black leading-tight tracking-[-0.04em]">Você não precisa aprender tudo de uma vez.</div>
                <div className="mt-4 space-y-3 text-base leading-7 text-[#62625E]">
                  <p>Quando você começa a pesquisar programação, parece que existe uma lista infinita de coisas para estudar.</p>
                  <p>C# ou JavaScript? Frontend ou backend? Banco de dados? API? Cloud? Arquitetura? E agora Inteligência Artificial?</p>
                  <p>O problema não é encontrar conteúdo. O difícil é saber o que aprender primeiro e o que vem depois.</p>
                  <p>Foi por isso que esta formação foi organizada como uma trilha.</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="journey" className="border-b border-[#D7D3CA]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle eyebrow="O caminho" title={<>Comece pelo básico. Evolua projeto por projeto.</>} description="Você começa construindo sua base e avança gradualmente para projetos cada vez mais completos." />
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
              O objetivo é chegar ao ponto em que você consegue olhar para uma ideia e começar a entender como transformá-la em software.
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="projects" className="border-b border-[#D7D3CA] bg-[#ECE8DF]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle
              eyebrow="Projetos"
              title={<>Você não vai ficar apenas na teoria.</>}
              description="Ao longo da formação, você acompanha a construção de projetos que mostram como as tecnologias funcionam juntas."
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
            <SectionTitle eyebrow="A formação" title={<>Tudo começa pela base.</>} light />
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
                      E esta trilha continuará recebendo novos conteúdos, avançando posteriormente para temas relacionados à Arquitetura em Cloud.
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
              eyebrow="Programação + Inteligência Artificial"
              title={<>A IA pode escrever código. Mas alguém ainda precisa saber o que fazer com ele.</>}
              description="Ferramentas de Inteligência Artificial podem acelerar muito o desenvolvimento. Mas existe uma grande diferença entre receber um código pronto e conseguir entender se aquele código está correto, adaptar uma regra, encontrar um problema ou transformar aquilo em uma aplicação completa."
            />
            <div className="mt-6 text-lg font-semibold text-[#151515]">Por isso, a formação não começa pela IA. Começa pela programação.</div>
            <div className="mt-4 text-base leading-7 text-[#62625E]">
              Você constrói sua base, aprende como aplicações funcionam e então passa a utilizar IA como uma ferramenta para acelerar o que já sabe construir.
            </div>
          </FadeIn>
          <FadeIn delayMs={100}>
            <div className="border border-[#D7D3CA] bg-[#ECE8DF] p-8">
              <div className="space-y-6">
                <div className="text-[2rem] font-black leading-tight tracking-[-0.04em]">Aprenda a programar.</div>
                <div className="h-px bg-[#D7D3CA]" />
                <div className="text-[2rem] font-black leading-tight tracking-[-0.04em]">Aprenda a construir.</div>
                <div className="h-px bg-[#D7D3CA]" />
                <div className="text-[2rem] font-black leading-tight tracking-[-0.04em] text-[#295CFF]">Use IA para ir além.</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA] bg-[#ECE8DF]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <FadeIn>
            <SectionTitle eyebrow="Para quem é" title={<>Esta formação é para você que...</>} />
          </FadeIn>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {audienceItems.map((item) => (
              <div key={item} className="border-t border-[#D7D3CA] pt-3 text-sm leading-6 text-[#151515]">
                ✓ {item}
              </div>
            ))}
          </div>
          <FadeIn delayMs={120}>
            <div className="mt-12 text-[1.8rem] font-black leading-tight tracking-[-0.04em]">Você não precisa chegar sabendo.</div>
            <div className="mt-2 text-lg font-semibold text-[#151515]">Você entra para aprender.</div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#D7D3CA]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.95fr,1.05fr] md:px-8 md:py-24">
          <FadeIn>
            <div className="overflow-hidden border border-[#D7D3CA] bg-[#ECE8DF]">
              <Image src="/imersao-ia-tech-stack.svg" alt="Ecossistema técnico Plugando IA" width={1600} height={960} className="h-auto w-full" />
            </div>
          </FadeIn>
          <FadeIn delayMs={100}>
            <SectionTitle
              eyebrow="Sobre o professor"
              title={<>Quem vai te acompanhar durante a formação</>}
              description="Eu criei esta formação pensando principalmente em quem olha para o desenvolvimento atual e não sabe mais por onde começar."
            />
            <div className="mt-6 space-y-4 text-base leading-7 text-[#62625E]">
              <p>Hoje você encontra C#, JavaScript, frameworks, Cloud, automações e Inteligência Artificial disputando sua atenção ao mesmo tempo.</p>
              <p>Minha proposta é diferente: começar pela base e conectar as peças aos poucos.</p>
              <p>Em vez de aprender ferramentas isoladas, quero mostrar como elas aparecem na construção de aplicações reais.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#D64E2E] bg-[#FF5A36]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.95fr,1.05fr] md:px-8 md:py-24">
          <FadeIn>
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-[#151515]">Nova formação 2026</div>
            <h2 className="mt-4 max-w-4xl text-balance text-[2.4rem] font-black leading-[0.98] tracking-[-0.04em] text-[#151515] md:text-[4rem]">
              A formação cresceu. E esta é a condição de lançamento.
            </h2>
            <div className="mt-5 max-w-3xl space-y-4 text-base leading-7 text-[#151515]/80">
              <p>Os conteúdos que antes estavam separados agora fazem parte de uma formação organizada para acompanhar sua evolução desde os fundamentos.</p>
              <p>E essa formação está crescendo.</p>
              <p>A nova trilha de Fundamentos de Arquitetura de Software já começou a ser adicionada e continuará evoluindo com novos conteúdos.</p>
              <p>Por isso, durante este lançamento, você pode entrar por uma condição especial.</p>
            </div>
          </FadeIn>
          <FadeIn delayMs={100}>
            <div className="border border-[#151515]/20 bg-[#151515]/5 p-8">
              <div className="text-sm text-[#151515]/70">Preço oficial</div>
              <div className="mt-2 text-xl line-through text-[#151515]/75">R$ {config.regularPrice.toFixed(0)}</div>
              <div className="mt-6 text-sm text-[#151515]/70">Preço de lançamento</div>
              <div className="mt-2 text-[3.4rem] font-black leading-none tracking-[-0.05em] text-[#151515] md:text-[4.8rem]">{priceLabel}</div>
              <div className="mt-3 text-sm font-semibold text-[#151515]">Condição válida até 31/08/2026 às 23:59.</div>
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
                  label="QUERO ENTRAR NA FORMAÇÃO →"
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
            <SectionTitle eyebrow="O que você recebe" title={<>Uma formação. Uma sequência completa.</>} description="Ao entrar, você terá acesso aos conteúdos disponibilizados na formação." light />
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
              <div className="mt-3 text-sm text-[#C9C4B8]">no lançamento.</div>
              <div className="mt-8">
                <TrackedCheckoutButton
                  href={config.checkoutUrl}
                  label="QUERO COMEÇAR AGORA →"
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
                className="rounded-none border-x-0 border-b border-t-0 border-[#D7D3CA] bg-[#F4F1EA] px-0 py-5 open:bg-[#F4F1EA]"
                titleClassName="text-lg font-semibold !text-[#151515]"
                contentClassName="text-base leading-7 !text-[#62625E]"
                iconClassName="h-9 w-9 rounded-none border-[#D7D3CA] bg-[#F4F1EA] !text-[#151515]"
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
              Você não precisa aprender tudo hoje.
            </h2>
            <div className="mt-3 text-[1.5rem] font-black leading-tight tracking-[-0.04em] text-[#151515] md:text-[2.2rem]">Precisa começar pela primeira etapa.</div>
            <div className="mx-auto mt-8 max-w-3xl space-y-3 text-base leading-7 text-[#62625E]">
              <p>Comece pelos fundamentos.</p>
              <p>Construa seu primeiro projeto.</p>
              <p>Depois o próximo.</p>
              <p>E continue evoluindo até entender como aplicações modernas, Cloud e Inteligência Artificial se conectam.</p>
            </div>
            <div className="mt-8 text-sm text-[#62625E] line-through">R$ {config.regularPrice.toFixed(0)}</div>
            <div className="mt-2 text-[3.2rem] font-black leading-none tracking-[-0.05em] text-[#151515] md:text-[4.8rem]">{priceLabel}</div>
            <div className="mt-2 font-mono text-xs uppercase tracking-[0.24em] text-[#FF5A36]">Preço de lançamento até 31/08</div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedCheckoutButton
                href={config.checkoutUrl}
                label="QUERO COMEÇAR MINHA FORMAÇÃO →"
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
            <div className="mt-4 text-sm text-[#62625E]">Formação Full Stack + IA — Plugando IA</div>
          </FadeIn>
        </div>
      </section>

      <footer className="bg-[#151515]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <div className="text-3xl font-black tracking-[-0.05em] text-[#F6F3EC] md:text-5xl">PLUGANDO IA</div>
            <div className="mt-3 text-sm text-[#C9C4B8]">Formação Desenvolvedor Full Stack + IA</div>
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
