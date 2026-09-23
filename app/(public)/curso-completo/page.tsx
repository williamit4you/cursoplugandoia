import type { Metadata } from "next";
import { CleanCourseLanding } from "@/components/course-sales/CleanCourseLanding";
import { courseConfig, getCourseRuntimeConfig } from "@/lib/courseCompletoConfig";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

export const metadata: Metadata = {
  title: "Combo Plugando IA — 12 cursos de programação, arquitetura e IA",
  description: "Uma formação com 12 cursos e mais de 250 aulas: C#, .NET, APIs, arquitetura, AWS, RabbitMQ, Next.js, n8n, SaaS e IA.",
  alternates: { canonical: "/curso-completo" },
};

const includedCourses = [
  { eyebrow: "Programação", title: "Fundamentos de C#", meta: "75 aulas", description: "Lógica, orientação a objetos, coleções, arquivos, LINQ e fundamentos do .NET." },
  { eyebrow: "Backend", title: "API RESTful com .NET", meta: "Projeto real", description: "API de barbearia com banco de dados, CRUD, Entity Framework, autenticação e autorização." },
  { eyebrow: "Engenharia", title: "Arquitetura de Software", meta: "Formação central", description: "Qualidade, coesão, acoplamento, SOLID, camadas e integração entre sistemas." },
  { eyebrow: "Cloud", title: "Fundamentos de AWS", meta: "Infraestrutura", description: "EC2, redes, VPC, RDS, S3, IAM, Auto Scaling, Lambda e publicação." },
  { eyebrow: "Mensageria", title: "RabbitMQ com .NET", meta: "51 aulas", description: "Exchanges, filas, ACK, concorrência, TTL, Dead Letter e Retry.", href: "/curso-rabbitmq" },
  { eyebrow: "Automação", title: "n8n Básico", meta: "10 aulas", description: "Workflows, credenciais, triggers, condições, código e requisições HTTP." },
  { eyebrow: "Inteligência Artificial", title: "Agentes de IA", meta: "Curso incluído", description: "Agentes, memória, ferramentas e construção prática." },
  { eyebrow: "Projeto aplicado", title: "Site com IA e RAG", meta: "Projeto completo", description: "Chatbot, e-mails, PostgreSQL, banco vetorial, metadata e RAG." },
  { eyebrow: "Full Stack", title: "Next.js", meta: "24 aulas", description: "Rotas, componentes, cache, middleware, formulários, Server Actions e APIs." },
  { eyebrow: "IA com código", title: "Agentes com Next.js", meta: "6 aulas", description: "Interface, OpenAI, ChatClient, contexto e memória." },
  { eyebrow: "Produto", title: "SaaS com IA e Antigravity", meta: "17 aulas", description: "Banco, trial, assinatura, pagamento, Docker e deploy.", href: "/curso-saas" },
  { eyebrow: "IA avançada", title: "LLMs e RAG", meta: "Curso premium", description: "Retrieval, transformers, embeddings, avaliação e guardrails." },
];

export default async function CursoCompletoPage() {
  const config = getCourseRuntimeConfig();
  const metaPixelId = await resolveSalesPageMetaPixelId(courseConfig.pageKey, { preferEnvFallback: true });
  const pricePerCourse = config.activePrice / config.courseCount;

  return <CleanCourseLanding
    pageKey={config.pageKey}
    pagePath={config.pagePath}
    pageTitle={config.pageTitle}
    name={config.name}
    metaPixelId={metaPixelId || undefined}
    eyebrow="Formação completa Plugando IA"
    headline="12 cursos para aprender programação, construir sistemas e evoluir até IA."
    description="Uma única formação reúne os fundamentos e as tecnologias necessárias para sair do primeiro código, criar aplicações completas e avançar para arquitetura, cloud, mensageria, SaaS e Inteligência Artificial."
    ctaLabel={`Quero acessar os 12 cursos`}
    checkoutUrl={config.checkoutUrl}
    price={config.activePrice}
    offerAvailable={/^https?:\/\//.test(config.checkoutUrl)}
    stats={[
      { value: "12", label: "cursos completos" },
      { value: "250+", label: "aulas disponíveis" },
      { value: "1", label: "única matrícula" },
      { value: pricePerCourse.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), label: "valor médio por curso" },
    ]}
    heroPoints={["Do básico ao avançado", "Projetos aplicados", "Estude no seu ritmo"]}
    problemTitle="Cursos isolados ensinam ferramentas. Uma formação mostra como elas se conectam."
    problemDescription="O maior desperdício não é comprar um curso ruim. É estudar assuntos soltos, sem entender qual é o próximo passo e como cada habilidade participa de um sistema real."
    problems={[
      { title: "Conteúdo sem sequência", description: "Você aprende uma ferramenta hoje e outra amanhã, mas não constrói uma base acumulativa." },
      { title: "Fundamentos ignorados", description: "Sem lógica, backend e arquitetura, a IA vira uma forma rápida de gerar código que você não consegue manter." },
      { title: "Projetos que não chegam ao ar", description: "Código, banco, cloud, mensageria e produto precisam funcionar juntos para a entrega ficar completa." },
    ]}
    outcomeTitle="Uma biblioteca para diferentes fases da sua carreira"
    outcomeDescription="Você não precisa consumir tudo de uma vez. Começa no seu nível atual e volta à formação conforme surgem novos desafios."
    outcomes={[
      { title: "Construa uma base sólida", description: "Aprenda lógica, C#, orientação a objetos e fundamentos do desenvolvimento." },
      { title: "Desenvolva aplicações completas", description: "Crie APIs, trabalhe com banco de dados, autenticação e interfaces em Next.js." },
      { title: "Projete sistemas melhores", description: "Aplique arquitetura, cloud e mensageria para organizar e distribuir aplicações." },
      { title: "Transforme código em produto", description: "Conecte automação, agentes, RAG, pagamentos e deploy para criar soluções vendáveis." },
    ]}
    curriculumTitle="Uma sequência clara do primeiro código ao produto"
    curriculumDescription="A formação está organizada por etapas. Você pode seguir a ordem ou entrar diretamente no tema mais importante para o seu momento."
    curriculum={[
      { title: "Fundamentos de programação", meta: "Comece aqui", summary: "Crie a base necessária para entender e escrever código.", lessons: ["Lógica de programação", "C# e .NET", "Orientação a objetos", "Coleções, arquivos e LINQ"] },
      { title: "Backend e dados", meta: "Construa aplicações", summary: "Transforme regras de negócio em uma API completa.", lessons: ["API RESTful", "Entity Framework", "PostgreSQL", "CRUD e relacionamentos", "Autenticação e autorização"] },
      { title: "Arquitetura e sistemas distribuídos", meta: "Evolua o projeto", summary: "Organize responsabilidades e integre aplicações de forma resiliente.", lessons: ["Arquitetura de Software", "SOLID e qualidade", "RabbitMQ e mensageria", "ACK, DLQ e Retry"] },
      { title: "Cloud e aplicações web", meta: "Coloque no ar", summary: "Conecte frontend, backend e infraestrutura.", lessons: ["Next.js", "Fundamentos de AWS", "Docker e deploy", "APIs e Server Actions"] },
      { title: "Automação, SaaS e IA", meta: "Transforme em produto", summary: "Crie aplicações inteligentes e fluxos que resolvem problemas reais.", lessons: ["n8n", "Agentes de IA", "LLMs e RAG", "SaaS com Antigravity", "Trial, assinatura e pagamento"] },
    ]}
    includedTitle="Veja os 12 cursos da formação"
    includedDescription="Cada tema é apresentado como um curso próprio, com objetivo, contexto e aplicação."
    included={includedCourses}
    fitTitle="Para quem quer uma formação que continue útil conforme a carreira avança"
    fitItems={["Quem está começando e precisa de uma sequência", "Quem já programa, mas sente lacunas nos fundamentos", "Devs que querem melhorar arquitetura e backend", "Quem quer construir SaaS e aplicações com IA", "Profissionais migrando para C# e .NET", "Quem prefere uma biblioteca completa a novos cursos isolados"]}
    offerTitle="Leve 12 cursos em uma única matrícula"
    offerDescription={`Com o valor atual, cada curso representa em média ${pricePerCourse.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}. Você recebe uma formação que acompanha do início da programação até aplicações com IA.`}
    offerItems={["12 cursos completos", "Mais de 250 aulas", "C# e .NET", "AWS e RabbitMQ", "Next.js e SaaS", "Agentes, LLMs e RAG"]}
    offerNote="Você será direcionado para o ambiente de pagamento, onde poderá conferir as condições comerciais antes de concluir a matrícula."
    faq={[
      ["Os 12 cursos estão incluídos?", "Sim. A matrícula reúne as formações principais e os cursos complementares apresentados nesta página."],
      ["Preciso saber programar?", "Não. A jornada começa com lógica e C#. Quem já programa pode avançar diretamente para as trilhas adequadas ao seu nível."],
      ["Preciso assistir na ordem?", "Não, mas existe uma sequência recomendada dos fundamentos até arquitetura, cloud, produto e IA."],
      ["RabbitMQ faz parte do combo?", "Sim. O curso de RabbitMQ com .NET, composto por 51 aulas, está incluído."],
      ["O curso de SaaS está incluído?", "Sim. O projeto de SaaS com Antigravity, banco, trial, pagamento e deploy faz parte da formação."],
      ["É apenas conteúdo teórico?", "Não. A formação conecta os conceitos a APIs, banco de dados, Producers, Consumers, aplicações web, automações e projetos com IA."],
    ]}
  />;
}
