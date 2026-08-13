import Link from "next/link";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import {
  MobileStickyCTA,
  SectionViewTracker,
  TrackedAccordion,
  TrackedCheckoutButton,
} from "@/components/course-completo/interactive";
import { courseConfig, getCourseRuntimeConfig } from "@/lib/courseCompletoConfig";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

export const metadata = {
  title: "Arquitetura de Software para Iniciantes | Plugando IA",
  description:
    "Aprenda C#, APIs, arquitetura de software e fundamentos de cloud em uma jornada criada para quem está começando na programação.",
  alternates: {
    canonical: "/curso-completo",
  },
  openGraph: {
    title: "Arquitetura de Software para Iniciantes | Plugando IA",
    description:
      "Aprenda C#, APIs, arquitetura de software e fundamentos de cloud em uma jornada criada para quem está começando na programação.",
    url: "/curso-completo",
    siteName: "Plugando IA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arquitetura de Software para Iniciantes | Plugando IA",
    description:
      "Aprenda C#, APIs, arquitetura de software e fundamentos de cloud em uma jornada criada para quem está começando na programação.",
  },
};

const tracks = [
  {
    kicker: "TRILHA 01",
    meta: "75 AULAS",
    title: "Fundamentos de C#",
    description: "Construa uma base forte antes de avançar.",
    items: [
      "Logica, variaveis e estruturas de decisao",
      "Orientacao a objetos e interfaces",
      "Colecoes, strings, datas e arquivos",
      "LINQ e organizacao de codigo",
    ],
    curriculumTitle: "Aprenda a programar com C#",
    curriculumIntro:
      "Comece do zero e construa a base necessária para desenvolver aplicações com segurança.",
    curriculumItems: [
      "Lógica de programação.",
      "Fundamentos do C# e do .NET.",
      "Variáveis, condições, repetições e coleções.",
      "Orientação a objetos.",
      "Interfaces, herança e abstração.",
      "Manipulação de dados, arquivos e LINQ.",
    ],
    curriculumOutcome:
      "Resultado da trilha: você entenderá os principais conceitos da programação e estará preparado para construir sua primeira aplicação.",
    curriculumButton: "Ver os 5 módulos desta trilha",
  },
  {
    kicker: "TRILHA 02",
    meta: "PROJETO REAL",
    title: "Web API com .NET",
    description: "Transforme a base em uma aplicação completa.",
    items: [
      "Modelagem e Entity Framework Core",
      "CRUD, relacionamentos e migrations",
      "Autenticacao JWT e Identity",
      "Claims, politicas e documentacao",
    ],
    curriculumTitle: "Construa uma Web API completa",
    curriculumIntro:
      "Transforme seus conhecimentos em uma aplicação real utilizando .NET e banco de dados.",
    curriculumItems: [
      "Criação e modelagem de uma API.",
      "Entity Framework Core.",
      "PostgreSQL ou SQL Server.",
      "CRUD completo.",
      "Relacionamentos entre entidades.",
      "Autenticação com JWT e Identity.",
      "Claims, políticas e autorização.",
    ],
    curriculumOutcome:
      "Resultado da trilha: você construirá uma API completa, conectada ao banco de dados e protegida por autenticação.",
    curriculumButton: "Ver os 4 módulos desta trilha",
  },
  {
    kicker: "TRILHA 03",
    meta: "FORMACAO CENTRAL",
    title: "Arquitetura de Software",
    description: "Aprenda a tomar decisões e organizar sistemas.",
    items: [
      "Requisitos, restricoes e atributos de qualidade",
      "Coesao, acoplamento e responsabilidades",
      "SOLID, DRY, KISS e YAGNI",
      "Camadas, monolito e integracao entre sistemas",
    ],
    featured: true,
    curriculumTitle: "Entenda Arquitetura de Software",
    curriculumIntro:
      "Aprenda a organizar sistemas e compreender as decisões existentes por trás de aplicações profissionais.",
    curriculumItems: [
      "Fundamentos de arquitetura de software.",
      "Requisitos e regras de negócio.",
      "Escalabilidade, disponibilidade e desempenho.",
      "Alta coesão e baixo acoplamento.",
      "SOLID, DRY, KISS e YAGNI.",
      "Arquitetura em camadas e monólitos.",
      "REST, GraphQL, gRPC e Webhooks.",
    ],
    curriculumOutcome:
      "Resultado da trilha: você deixará de enxergar apenas arquivos e códigos isolados e começará a compreender o sistema como um todo.",
    curriculumButton: "Ver os 6 módulos desta trilha",
  },
  {
    kicker: "TRILHA 04",
    meta: "CLOUD",
    title: "Fundamentos de AWS",
    description: "Entenda onde suas aplicações vivem e escalam.",
    items: [
      "EC2, redes, volumes e seguranca",
      "VPC, RDS, S3 e IAM",
      "Elastic Beanstalk e Auto Scaling",
      "Serverless com AWS Lambda",
    ],
    curriculumTitle: "Publique sua aplicação na AWS",
    curriculumIntro:
      "Conheça os principais serviços de nuvem utilizados para hospedar, proteger e escalar aplicações.",
    curriculumItems: [
      "EC2 e modelos de contratação.",
      "Linux, Windows e acesso remoto.",
      "Redes, VPC e segurança.",
      "RDS, PostgreSQL e backups.",
      "S3, IAM e SNS.",
      "Elastic Beanstalk e Auto Scaling.",
      "Serverless, Lambda e API Gateway.",
    ],
    curriculumOutcome:
      "Resultado da trilha: você entenderá como uma aplicação sai do computador e funciona em uma infraestrutura de nuvem.",
    curriculumButton: "Ver os 4 módulos desta trilha",
  },
];

const architectureGroups = [
  {
    title: "01. Fundamentos e decisões",
    items: [
      "O que e arquitetura de software",
      "Tipos de arquiteto",
      "Arquitetura x design de codigo",
      "O papel do arquiteto",
      "Requisitos funcionais e nao funcionais",
      "Regras de negocio",
      "Restrições técnicas e financeiras",
    ],
    open: true,
  },
  {
    title: "02. Atributos de qualidade",
    items: ["Escalabilidade", "Disponibilidade", "Desempenho", "Seguranca", "Manutenibilidade", "Testabilidade"],
  },
  {
    title: "03. Princípios de bom design",
    items: [
      "Alta coesao e baixo acoplamento",
      "Separacao de responsabilidades",
      "Encapsulamento",
      "Composicao",
      "Modularidade",
      "Dependencia e abstracao",
      "DRY, KISS e YAGNI",
    ],
  },
  {
    title: "04. SOLID completo",
    items: [
      "Single Responsibility",
      "Open/Closed",
      "Liskov Substitution",
      "Interface Segregation",
      "Dependency Inversion",
    ],
  },
  {
    title: "05. Modelos arquiteturais",
    items: ["10 modelos para estudar", "Arquitetura em camadas", "Monolito tradicional"],
  },
  {
    title: "06. Integracao entre sistemas",
    items: ["API RESTful", "GraphQL", "gRPC", "Webhooks"],
  },
];

const audienceCards = [
  {
    index: "01",
    title: "Quem esta comecando",
    description: "Quer aprender programação com uma sequência clara e sem pular fundamentos importantes.",
  },
  {
    index: "02",
    title: "Quem já faz cursos",
    description: "Conhece comandos isolados, mas ainda não consegue enxergar como um sistema completo e organizado.",
  },
  {
    index: "03",
    title: "Dev em evolução",
    description: "Já cria aplicações e quer melhorar o vocabulário, a organização do código e as decisões técnicas.",
  },
];

const methodSteps = [
  {
    title: "Aprenda o conceito",
    description: "Termos técnicos explicados com linguagem direta.",
  },
  {
    title: "Veja no código",
    description: "Exemplos em C# e .NET para ligar teoria e prática.",
  },
  {
    title: "Conecte as decisões",
    description: "Entenda como cada escolha afeta manutenção, desempenho e evolução.",
  },
];

const bonusCards = [
  {
    tag: "BONUS 01",
    title: "N8N Básico",
    description:
      "Workflows, credenciais, triggers, ações, condições, nó Code e requisições HTTP para criar suas primeiras automações.",
  },
  {
    tag: "BONUS 02",
    title: "Agentes de IA",
    description: "Fundamentos de agentes, memória, ferramentas e construção prática do seu primeiro agente inteligente.",
  },
  {
    tag: "BONUS 03",
    title: "Site para advocacia com IA",
    description: "Site, chatbot, envio de e-mails, PostgreSQL, banco vetorial, metadados e agente com RAG em um projeto aplicado.",
  },
  {
    tag: "BONUS 04",
    title: "Next.js",
    description: "Rotas, layouts, Server e Client Components, cache, middleware, Server Actions, formulários e criação de APIs.",
  },
  {
    tag: "BONUS 05",
    title: "Agentes de IA com Next.js",
    description: "Crie a interface, conecte-se à OpenAI e desenvolva um ChatClient com contexto e memória utilizando código.",
  },
  {
    tag: "BONUS 06",
    title: "Criação de SaaS com IA",
    description: "Do prompt inicial ao sistema hospedado: banco PostgreSQL, trial, assinaturas, pagamentos, Docker, GitHub e publicação.",
  },
];

const premiumBonusTopics = [
  "Fundamentos de Information Retrieval",
  "Tokenização e OpenAI Tokenizer",
  "Modelos clássicos de recuperação",
  "RAG mitigando riscos da IA",
  "Arquitetura Transformers",
  "Large Language Models",
  "Retrieval-Augmented Generation",
  "Vector Databases e embeddings",
  "Estratégias de indexação",
  "Engenharia de agentes de IA",
  "APIs profissionais com FastAPI",
  "Avaliação e qualidade em LLMs",
  "Guardrails, segurança e confiabilidade",
];

const offerItems = [
  "Fundamentos de C#",
  "Web API com .NET",
  "Arquitetura de software",
  "Fundamentos de AWS",
  "7 cursos bônus de IA",
  "Mais de 200 aulas",
];

const faqItems = [
  {
    question: "Preciso saber programar para acompanhar?",
    answer:
      "Não. A jornada começa com lógica, linguagem C# e orientação a objetos. Quem já conhece o básico pode avançar diretamente para as trilhas seguintes.",
  },
  {
    question: "O curso é apenas sobre teoria?",
    answer:
      "Não. A teoria de arquitetura é conectada a exemplos em C#, à construção de uma Web API completa com .NET e aos serviços usados para executar aplicações na AWS.",
  },
  {
    question: "Arquitetura não é um assunto apenas para desenvolvedores sênior?",
    answer:
      "Não. Compreender responsabilidades, acoplamento, coesão e organização desde cedo evita vícios e acelera a evolução profissional.",
  },
  {
    question: "O que vou conseguir entender ao final?",
    answer:
      "Você terá base para explicar as partes de uma aplicação, criar APIs mais organizadas, compreender princípios SOLID, comparar modelos arquiteturais e reconhecer formas de integração entre sistemas.",
  },
  {
    question: "Posso começar pela trilha de arquitetura?",
    answer:
      "Sim. A formação foi organizada em uma sequência recomendada, mas você pode usar as trilhas conforme seu nível atual e revisar C# ou Web API quando sentir necessidade.",
  },
  {
    question: "Os cursos de inteligência artificial estão incluídos?",
    answer:
      "Sim. Neste lote, os cursos de n8n, agentes de IA, site com RAG, Next.js, agentes com código, criação de SaaS e Arquitetando o Futuro com LLMs e RAG entram como bônus gratuitos. O pacote é avaliado separadamente em R$ 200.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="course-eyebrow">{children}</p>;
}

export default async function CursoCompletoPage() {
  const config = getCourseRuntimeConfig();
  const metaPixelId = await resolveSalesPageMetaPixelId(courseConfig.pageKey, { preferEnvFallback: true });
  const regularPriceLabel = `R$ ${config.regularPrice.toFixed(2).replace(".", ",")}`;
  const priceLabel = `R$ ${config.activePrice.toFixed(2).replace(".", ",")}`;
  const eventData = {
    content_name: config.name,
    content_category: "Curso",
    content_type: "product",
    value: config.activePrice,
    currency: "BRL",
  };

  return (
    <main className="course-page">
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
      <SectionViewTracker selectorId="conteudo" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="content_view" />
      <SectionViewTracker selectorId="bonus" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="bonus_view" />
      <SectionViewTracker selectorId="comprar" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="offer_view" />
      <SectionViewTracker selectorId="faq" pageKey={config.pageKey} pagePath={config.pagePath} pageTitle={config.pageTitle} eventName="faq_view" />

      <div className="course-topbar">
        ?LTIMAS VAGAS DO LOTE: de {regularPriceLabel} por {priceLabel} + pacote de b?nus gratuito
      </div>

      <nav className="course-nav">
        <div className="course-container course-nav-inner">
          <Link href="/curso-completo" className="course-brand">
            Plugando<span>IA</span> / Arquitetura
          </Link>
          <a className="course-nav-link" href="#conteudo">
            Ver conteúdo do curso
          </a>
        </div>
      </nav>

      <header className="course-hero">
        <div className="course-container course-hero-grid">
          <div>
            <Eyebrow>Arquitetura de software para iniciantes</Eyebrow>
            <h1>
              Comece no código. Aprenda a <em>pensar como profissional.</em>
            </h1>
            <p className="course-lead">
              Uma jornada passo a passo para aprender C#, construir APIs reais e entender como sistemas bem organizados
              são planejados, com um pacote especial de cursos de IA incluído gratuitamente.
            </p>
            <div className="course-hero-actions">
              <TrackedCheckoutButton
                href={config.checkoutUrl}
                label={`Quero começar por ${priceLabel}`}
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
                value={config.activePrice}
                currency="BRL"
                customEvent="hero_cta_click"
                eventData={eventData}
                hideGlow
                className="course-btn course-btn-primary"
              />
              <a className="course-btn course-btn-outline" href="#conteudo">
                Explorar as trilhas
              </a>
            </div>
            <div className="course-hero-proof">
              <span>Do básico à arquitetura</span>
              <span>Exemplos em C# e .NET</span>
              <span>Mais de 200 aulas com os bônus</span>
            </div>
          </div>

          <div className="course-code-card" aria-label="Ilustração das camadas de uma arquitetura de software">
            <div className="course-code-top">
              <i className="course-dot" />
              <i className="course-dot" />
              <i className="course-dot" />
            </div>
            <div className="course-architecture">
              <div className="course-layer">
                <b>01</b>
                Presentation
                <span>API</span>
              </div>
              <div className="course-layer">
                <b>02</b>
                Application
                <span>Casos de uso</span>
              </div>
              <div className="course-layer">
                <b>03</b>
                Domain
                <span>Regras</span>
              </div>
              <div className="course-layer">
                <b>04</b>
                Infrastructure
                <span>Dados</span>
              </div>
            </div>
            <div className="course-card-caption">
              Você não vai apenas copiar código. Vai entender onde cada parte se encaixa.
            </div>
          </div>
        </div>
      </header>

      <div className="course-stats">
        <div className="course-container course-stats-inner">
          <div className="course-stat">
            <strong>4 trilhas</strong>
            <span>em uma jornada progressiva</span>
          </div>
          <div className="course-stat">
            <strong>200+ aulas</strong>
            <span>incluindo os cursos bônus</span>
          </div>
          <div className="course-stat">
            <strong>C# + .NET</strong>
            <span>tecnologias usadas no mercado</span>
          </div>
          <div className="course-stat">
            <strong>{regularPriceLabel}</strong>
            <span>por {priceLabel} neste lote</span>
          </div>
        </div>
      </div>

      <section className="course-section">
        <div className="course-container course-intro-grid">
          <div>
            <Eyebrow>O problema não é você</Eyebrow>
            <h2>Arquitetura parece difícil quando explicam pelo final.</h2>
            <p className="course-copy">
              Muitos conteúdos começam falando de padrões complexos antes de mostrar o básico. Aqui, você percorre o
              caminho na ordem certa: linguagem, aplicação, organização e decisões de arquitetura.
            </p>
          </div>
          <div className="course-before-after">
            <article className="course-ba-card">
              <small>Antes</small>
              <ul>
                <li>Copia códigos sem entender a estrutura</li>
                <li>Não sabe onde colocar cada responsabilidade</li>
                <li>Se perde em termos como SOLID e camadas</li>
                <li>Acha que arquitetura é só para sênior</li>
              </ul>
            </article>
            <article className="course-ba-card course-ba-card-after">
              <small>Depois</small>
              <ul>
                <li>Entende a função de cada parte do sistema</li>
                <li>Constrói APIs com mais organização</li>
                <li>Analisa escolhas e seus trade-offs</li>
                <li>Conversa sobre arquitetura com clareza</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="course-section course-journey" id="conteudo">
        <div className="course-container">
          <div className="course-section-head">
            <div>
              <Eyebrow>Sua rota de aprendizagem</Eyebrow>
              <h2>
                Do primeiro conceito
                <br />
                ao sistema completo.
              </h2>
            </div>
            <p>As aulas que você já recebe foram organizadas como uma formação única. Cada etapa prepara a próxima.</p>
          </div>

          <div className="course-tracks">
            {tracks.map((track) => (
              <article key={track.title} className={`course-track${track.featured ? " is-featured" : ""}`}>
                <div className="course-track-number">
                  <span>{track.kicker}</span>
                  <span>{track.meta}</span>
                </div>
                <h3>{track.title}</h3>
                <p>{track.description}</p>
                <ul>
                  {track.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="course-section">
        <div className="course-container course-architecture-list">
          <div className="course-sticky-copy">
            <Eyebrow>Por dentro da trilha central</Eyebrow>
            <h2>Arquitetura sem enrolação.</h2>
            <p className="course-copy">
              Você começa pelo significado das decisões arquiteturais e avança até as formas de comunicação entre
              sistemas.
            </p>
          </div>

          <div className="course-lesson-groups">
            {architectureGroups.map((group) => (
              <details key={group.title} className="course-details" open={group.open}>
                <summary>{group.title}</summary>
                <div className="course-detail-body">
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="course-section course-audience">
        <div className="course-container">
          <Eyebrow>Para quem é</Eyebrow>
          <h2>
            Você não precisa chegar pronto.
            <br />
            O curso existe para preparar você.
          </h2>
          <div className="course-audience-grid">
            {audienceCards.map((card) => (
              <article key={card.index} className="course-person">
                <div className="course-person-icon">{card.index}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="course-section">
        <div className="course-container course-method-grid">
          <div>
            <Eyebrow>Aprendizado progressivo</Eyebrow>
            <h2>Entender antes de decorar.</h2>
            <div className="course-steps">
              {methodSteps.map((step) => (
                <div key={step.title} className="course-step">
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="course-quote-card">
            <p>
              "Arquitetura nao comeca em um diagrama. Comeca quando voce entende por que o codigo foi organizado daquela
              maneira."
            </p>
            <small>- A ideia que guia esta formação</small>
          </aside>
        </div>
      </section>

      <section className="course-section course-bonuses" id="bonus">
        <div className="course-container">
          <div className="course-bonus-head">
            <div>
              <Eyebrow>Bônus especial deste lote</Eyebrow>
              <h2>
                Entre pela arquitetura.
                <br />
                Avance também para a IA.
              </h2>
              <p className="course-copy">
                Além da formação principal, você recebe cursos complementares para criar automações, agentes,
                aplicações com IA e até um SaaS completo.
              </p>
            </div>
            <div className="course-bonus-value">
              <s>Valor separado: R$ 200</s>
              <strong>Hoje: grátis</strong>
              <span>Incluído na sua matrícula neste lote.</span>
            </div>
          </div>

          <div className="course-bonus-grid">
            {bonusCards.map((bonus) => (
              <article key={bonus.tag} className="course-bonus-card">
                <span className="course-bonus-tag">{bonus.tag}</span>
                <h3>{bonus.title}</h3>
                <p>{bonus.description}</p>
              </article>
            ))}

            <article className="course-bonus-card is-special">
              <span className="course-bonus-tag">BONUS PREMIUM</span>
              <h3>Arquitetando o Futuro com LLMs e RAG</h3>
              <p>
                Uma formação avançada para entender a arquitetura por trás de aplicações modernas com inteligência
                artificial.
              </p>
              <ul className="course-bonus-topics">
                {premiumBonusTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="course-section course-offer" id="comprar">
        <div className="course-container">
          <div className="course-offer-card">
            <div className="course-offer-main">
              <Eyebrow>Comece sua formação</Eyebrow>
              <h2>Uma base completa para construir e compreender software.</h2>
              <p>
                Você recebe uma jornada que conecta os fundamentos da programação ao raciocínio arquitetural e ainda
                leva todo o pacote de IA como bônus.
              </p>
              <div className="course-included">
                {offerItems.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>

            <div className="course-price-box">
              <span className="course-discount-pill">ULTIMAS VAGAS NESTE VALOR</span>
              <div className="course-original-price">
                Preço original: <s>{regularPriceLabel}</s>
              </div>
              <div className="course-price">
                <sup>R$</sup>
                {config.activePrice.toFixed(2).replace(".", ",")}
              </div>
              <div className="course-price-note">Pagamento único + R$ 200 em bônus gratuitos</div>
              <TrackedCheckoutButton
                href={config.checkoutUrl}
                label="Quero entrar para o curso"
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
                value={config.activePrice}
                currency="BRL"
                customEvent="offer_cta_click"
                eventData={eventData}
                hideGlow
                className="course-btn course-price-cta"
              />
              <div className="course-safe-note">Você será direcionado para o ambiente de pagamento.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="course-section" id="faq">
        <div className="course-container course-faq">
          <Eyebrow>Dúvidas frequentes</Eyebrow>
          <h2>Antes de começar.</h2>
          <div className="course-faq-list">
            {faqItems.map((item) => (
              <TrackedAccordion
                key={item.question}
                title={item.question}
                pageKey={config.pageKey}
                pagePath={config.pagePath}
                pageTitle={config.pageTitle}
                eventName="faq_open"
                className="course-faq-item"
                titleClassName="course-faq-title"
                contentClassName="course-faq-content"
                iconClassName="course-faq-icon"
              >
                {item.answer}
              </TrackedAccordion>
            ))}
          </div>
        </div>
      </section>

      <footer className="course-footer">
        <div className="course-container course-footer-inner">
          <div>
            <strong>Plugando IA</strong>
            <br />
            Formação em Arquitetura de Software
          </div>
          <div className="course-footer-links">
            <Link href="/terms">Termos</Link>
            <Link href="/privacy">Privacidade</Link>
          </div>
        </div>
      </footer>

      <MobileStickyCTA
        title={config.shortName}
        priceLabel={priceLabel}
        href={config.checkoutUrl}
        label="Entrar"
        pageKey={config.pageKey}
        pagePath={config.pagePath}
        pageTitle={config.pageTitle}
        value={config.activePrice}
        currency="BRL"
        className="course-mobile-cta"
        titleClassName="course-mobile-cta-title"
        priceClassName="course-mobile-cta-price"
        buttonClassName="course-mobile-cta-button"
        hideGlow
      />

      <style>{`
        :root {
          --course-ink: #14221d;
          --course-forest: #173d32;
          --course-cream: #f5f0e6;
          --course-paper: #fffdf8;
          --course-coral: #f27d52;
          --course-lime: #c8ed75;
          --course-muted: #64736c;
          --course-line: rgba(20, 34, 29, 0.14);
          --course-shadow: 0 24px 70px rgba(20, 34, 29, 0.12);
          --course-radius: 28px;
        }

        .course-page {
          background: var(--course-cream);
          color: var(--course-ink);
        }

        .course-page * {
          box-sizing: border-box;
        }

        .course-page a {
          color: inherit;
          text-decoration: none;
        }

        .course-page h1,
        .course-page h2,
        .course-page h3,
        .course-page p {
          margin-top: 0;
        }

        .course-page h1,
        .course-page h2,
        .course-page h3 {
          line-height: 1.04;
          letter-spacing: -0.045em;
        }

        .course-page h1 {
          margin-bottom: 26px;
          max-width: 850px;
          font-size: clamp(3rem, 6vw, 6.25rem);
        }

        .course-page h2 {
          margin-bottom: 22px;
          font-size: clamp(2.2rem, 4.6vw, 4.6rem);
        }

        .course-page h3 {
          font-size: 1.45rem;
        }

        .course-container {
          margin: 0 auto;
          width: min(1160px, calc(100% - 40px));
        }

        .course-topbar {
          padding: 9px 16px;
          background: var(--course-lime);
          color: var(--course-ink);
          text-align: center;
          font-size: 0.88rem;
          font-weight: 800;
        }

        .course-nav {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 3;
          padding-top: 23px;
        }

        .course-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .course-brand {
          color: white;
          font-size: 1.05rem;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .course-brand span {
          color: var(--course-lime);
        }

        .course-nav-link {
          color: #dce7e2;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .course-hero {
          position: relative;
          overflow: hidden;
          min-height: 840px;
          padding: 155px 0 88px;
          background: var(--course-forest);
          color: white;
        }

        .course-hero::before {
          position: absolute;
          top: 50px;
          right: -150px;
          width: 520px;
          height: 520px;
          border: 100px solid rgba(200, 237, 117, 0.07);
          border-radius: 50%;
          content: "";
        }

        .course-hero-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 65px;
          align-items: center;
        }

        .course-hero h1 em {
          color: var(--course-lime);
          font-style: normal;
        }

        .course-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 18px;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .course-eyebrow::before {
          width: 26px;
          height: 3px;
          border-radius: 9px;
          background: var(--course-coral);
          content: "";
        }

        .course-lead {
          max-width: 680px;
          color: #d5e1dc;
          font-size: clamp(1.05rem, 1.7vw, 1.3rem);
          line-height: 1.55;
        }

        .course-btn {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          padding: 0 25px !important;
          border-radius: 12px !important;
          border: 1px solid transparent !important;
          font-weight: 850 !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .course-btn:hover {
          transform: translateY(-2px);
        }

        .course-btn-primary {
          background: var(--course-coral) !important;
          color: #1b241f !important;
          box-shadow: 0 14px 35px rgba(242, 125, 82, 0.22);
        }

        .course-btn-outline {
          border-color: rgba(255, 255, 255, 0.25);
          color: white;
        }

        .course-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          margin: 34px 0 35px;
        }

        .course-hero-proof {
          display: flex;
          flex-wrap: wrap;
          gap: 22px;
          color: #c7d6d0;
          font-size: 0.9rem;
        }

        .course-hero-proof span {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .course-hero-proof span::before {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(200, 237, 117, 0.14);
          color: var(--course-lime);
          font-weight: 900;
          content: "?";
        }

        .course-code-card {
          overflow: hidden;
          transform: rotate(1.5deg);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--course-radius);
          background: #0d1b16;
          box-shadow: 0 35px 80px rgba(0, 0, 0, 0.32);
        }

        .course-code-top {
          display: flex;
          gap: 7px;
          padding: 17px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .course-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #557068;
        }

        .course-dot:first-child {
          background: var(--course-coral);
        }

        .course-dot:nth-child(2) {
          background: #f3c85f;
        }

        .course-dot:nth-child(3) {
          background: var(--course-lime);
        }

        .course-architecture {
          padding: 28px;
        }

        .course-layer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 11px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 13px;
          color: #deebe5;
          font: 700 0.88rem ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .course-layer b {
          color: var(--course-lime);
        }

        .course-layer:nth-child(2) {
          margin-inline: 16px;
        }

        .course-layer:nth-child(3) {
          margin-inline: 32px;
        }

        .course-layer:nth-child(4) {
          margin-inline: 48px;
          background: rgba(242, 125, 82, 0.1);
        }

        .course-card-caption {
          padding: 0 28px 28px;
          color: #91a69e;
          font-size: 0.86rem;
        }

        .course-stats {
          position: relative;
          z-index: 2;
          margin-top: -42px;
        }

        .course-stats-inner {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid var(--course-line);
          border-radius: 20px;
          background: var(--course-paper);
          box-shadow: var(--course-shadow);
        }

        .course-stat {
          padding: 28px 30px;
          border-right: 1px solid var(--course-line);
        }

        .course-stat:last-child {
          border-right: 0;
        }

        .course-stat strong {
          display: block;
          font-size: 1.8rem;
          letter-spacing: -0.05em;
        }

        .course-stat span {
          color: var(--course-muted);
          font-size: 0.86rem;
        }

        .course-section {
          padding: 105px 0;
        }

        .course-intro-grid {
          display: grid;
          grid-template-columns: 0.86fr 1.14fr;
          gap: 90px;
          align-items: start;
        }

        .course-copy {
          color: var(--course-muted);
          font-size: 1.15rem;
          line-height: 1.6;
        }

        .course-before-after {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .course-ba-card {
          padding: 26px;
          border: 1px solid var(--course-line);
          border-radius: 20px;
          background: var(--course-paper);
        }

        .course-ba-card-after {
          background: var(--course-forest);
          color: white;
        }

        .course-ba-card small {
          display: block;
          margin-bottom: 16px;
          color: var(--course-coral);
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .course-ba-card-after small {
          color: var(--course-lime);
        }

        .course-ba-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .course-ba-card li {
          position: relative;
          padding: 9px 0 9px 25px;
          color: var(--course-muted);
        }

        .course-ba-card li::before {
          position: absolute;
          left: 0;
          color: var(--course-coral);
          font-weight: 900;
          content: "x";
        }

        .course-ba-card-after li {
          color: #dce7e2;
        }

        .course-ba-card-after li::before {
          color: var(--course-lime);
          content: "?";
        }

        .course-journey {
          background: var(--course-ink);
          color: white;
        }

        .course-section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 48px;
        }

        .course-section-head p {
          max-width: 470px;
          color: #b5c6bf;
          line-height: 1.6;
        }

        .course-tracks {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .course-track {
          min-height: 380px;
          padding: 31px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          background: #1a2a24;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .course-track:hover {
          transform: translateY(-4px);
          border-color: rgba(200, 237, 117, 0.45);
        }

        .course-track.is-featured {
          background: var(--course-coral);
          color: var(--course-ink);
        }

        .course-track.is-featured .course-track-number,
        .course-track.is-featured p {
          color: #4d3026;
        }

        .course-track.is-featured li {
          color: var(--course-ink);
        }

        .course-track-number {
          display: flex;
          justify-content: space-between;
          margin-bottom: 58px;
          color: var(--course-lime);
          font: 800 0.82rem ui-monospace, monospace;
        }

        .course-track h3 {
          margin-bottom: 13px;
          font-size: 2rem;
        }

        .course-track p {
          color: #aebeb7;
        }

        .course-track ul {
          padding-left: 18px;
          color: #dce6e2;
        }

        .course-track li {
          margin: 8px 0;
        }

        @media (max-width: 650px) {
          .course-container {
            width: min(100% - 26px, 1160px);
          }

          .course-hero-grid {
            grid-template-columns: 1fr;
          }

          .course-code-card {
            display: none;
          }

          .course-nav-link {
            display: none;
          }

          .course-hero {
            padding-bottom: 78px;
          }

          .course-hero-actions .course-btn,
          .course-hero-actions a {
            width: 100%;
          }

          .course-tracks,
          .course-before-after,
          .course-included,
          .course-bonus-grid {
            grid-template-columns: 1fr;
          }

          .course-bonus-card.is-special {
            grid-column: auto;
          }

          .course-bonus-topics {
            columns: 1;
          }

          .course-track {
            min-height: auto;
          }

          .course-track-number {
            margin-bottom: 35px;
          }

          .course-detail-body ul {
            columns: 1;
          }

          .course-layer {
            margin-inline: 0 !important;
            padding: 13px;
            font-size: 0.74rem;
          }

          .course-stats {
            margin-top: -26px;
          }

          .course-stat {
            padding: 21px 18px;
          }

          .course-section {
            padding: 78px 0;
          }

          .course-footer-inner {
            display: block;
          }

          .course-footer-links {
            margin-top: 16px;
          }
        }
      `}</style>
    </main>
  );
}
