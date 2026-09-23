import type { Metadata } from "next";
import { CleanCourseLanding } from "@/components/course-sales/CleanCourseLanding";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const pageKey = "curso-arquitetura-software";
const pagePath = "/curso-arquitetura-software";
const pageTitle = "Arquitetura de Software para Iniciantes com C# | Plugando IA";
const price = 39.99;
const checkoutUrl = process.env.NEXT_PUBLIC_ARCHITECTURE_CHECKOUT_URL ?? "https://pay.hotmart.com/M103626951G?bid=1790202574487";
const offerAvailable = /^https?:\/\//.test(checkoutUrl);

export const metadata: Metadata = {
  title: pageTitle,
  description: "Aprenda arquitetura de software, SOLID, modelos arquiteturais, integração e resiliência. Receba como bônus os cursos de C#, API RESTful com .NET e AWS.",
  alternates: { canonical: pagePath },
};

const curriculum = [
  {
    title: "Fundamentos e decisões de arquitetura",
    meta: "7 aulas",
    summary: "Entenda o papel da arquitetura e os fatores que orientam uma decisão técnica.",
    lessons: ["O que é arquitetura de software", "Tipos de arquiteto", "Arquitetura x design de código", "O papel do arquiteto de software", "Requisitos funcionais e não funcionais", "Regras de negócio", "Restrições técnicas e financeiras"],
  },
  {
    title: "Atributos de qualidade",
    meta: "7 temas",
    summary: "Aprenda a avaliar um sistema além da funcionalidade entregue.",
    lessons: ["Escalabilidade", "Disponibilidade", "Desempenho", "Segurança", "Manutenibilidade", "Observabilidade", "Recuperação de falhas"],
  },
  {
    title: "Princípios de bom design",
    meta: "6 temas",
    summary: "Organize responsabilidades e reduza o impacto das mudanças.",
    lessons: ["Alta coesão e baixo acoplamento", "Separação de responsabilidades", "Encapsulamento de dados", "Composição", "Modularidade", "Dependência e abstração"],
  },
  {
    title: "SOLID, DRY, KISS e YAGNI",
    meta: "Princípios essenciais",
    summary: "Use princípios para orientar o código sem criar complexidade desnecessária.",
    lessons: ["Single Responsibility Principle", "Open/Closed Principle", "Liskov Substitution Principle", "Interface Segregation Principle", "Dependency Inversion Principle", "DRY, KISS e YAGNI"],
  },
  {
    title: "Modelos arquiteturais",
    meta: "Visão prática",
    summary: "Compare formas diferentes de organizar uma aplicação.",
    lessons: ["10 modelos de arquitetura para estudar", "Arquitetura em camadas", "Monolito tradicional", "Monolito modular", "Clean Architecture"],
  },
  {
    title: "Integração entre sistemas",
    meta: "5 abordagens",
    summary: "Entenda como aplicações trocam dados e eventos.",
    lessons: ["API RESTful", "GraphQL", "gRPC", "Webhooks", "Comunicação síncrona e assíncrona"],
  },
  {
    title: "Estratégias de resiliência",
    meta: "3 estratégias",
    summary: "Prepare o sistema para lidar melhor com dependências e falhas.",
    lessons: ["Timeout", "Retry", "Circuit Breaker"],
  },
];

const bonusCourses = [
  {
    eyebrow: "Bônus 01",
    title: "Fundamentos da Linguagem C#",
    meta: "75 aulas",
    description: "Lógica, .NET, tipos, coleções, orientação a objetos, strings, datas, arquivos e LINQ para construir uma base sólida.",
  },
  {
    eyebrow: "Bônus 02",
    title: "API RESTful completa com .NET",
    meta: "51 aulas",
    description: "Projeto de agendamento com EF Core, PostgreSQL, CRUD, relacionamentos, Identity, JWT, Claims e autorização.",
  },
  {
    eyebrow: "Bônus 03",
    title: "Curso AWS Completo",
    meta: "50+ aulas",
    description: "EC2, VPC, RDS, S3, IAM, Elastic Beanstalk, Auto Scaling, Lambda, API Gateway e infraestrutura cloud.",
  },
];

export default async function CursoArquiteturaSoftwarePage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(pageKey, { preferEnvFallback: true });
  return <CleanCourseLanding
    pageKey={pageKey}
    pagePath={pagePath}
    pageTitle={pageTitle}
    name="Arquitetura de Software com C#"
    metaPixelId={metaPixelId || undefined}
    eyebrow="Arquitetura de Software para iniciantes"
    headline="Aprenda a enxergar o sistema além do código."
    description="Entenda como aplicações profissionais são organizadas, quais decisões influenciam qualidade e como escolher estruturas mais fáceis de manter, integrar e evoluir."
    notice="Oferta atual: curso de Arquitetura + 3 cursos bônus"
    ctaLabel={offerAvailable ? "Quero os 4 cursos por R$ 39,99" : "Ver conteúdo e bônus"}
    checkoutUrl={checkoutUrl}
    price={price}
    offerAvailable={offerAvailable}
    stats={[{ value: "4", label: "cursos no pacote" }, { value: "200+", label: "aulas disponíveis" }, { value: "6x R$ 6,67", label: "parcelamento" }, { value: "R$ 39,99", label: "à vista" }]}
    heroPoints={["Comece mesmo sendo iniciante", "Exemplos conectados ao .NET", "C#, API e AWS como bônus"]}
    problemTitle="O código funciona, mas você ainda não sabe se o sistema está bem organizado?"
    problemDescription="Arquitetura parece abstrata quando é ensinada apenas com diagramas. Aqui, os conceitos são ligados a responsabilidades, integração, qualidade e decisões que aparecem em aplicações reais."
    problems={[
      { title: "Responsabilidades misturadas", description: "Alterar uma regra quebra partes que não deveriam depender dela." },
      { title: "Decisões sem critério", description: "Tecnologias e padrões são escolhidos por popularidade, não pelo problema." },
      { title: "Dificuldade para evoluir", description: "O sistema cresce, mas manutenção, testes e novas integrações ficam cada vez mais caros." },
    ]}
    outcomeTitle="Construa vocabulário e critérios para tomar decisões melhores"
    outcomeDescription="O objetivo não é decorar nomes de arquiteturas, mas entender os problemas que cada decisão tenta resolver."
    outcomes={[
      { title: "Analisar requisitos", description: "Diferencie funcionalidades, regras, restrições e atributos de qualidade." },
      { title: "Organizar responsabilidades", description: "Aplique coesão, acoplamento, encapsulamento, composição e modularidade." },
      { title: "Comparar arquiteturas", description: "Entenda camadas, monolito, monolito modular e Clean Architecture." },
      { title: "Planejar integrações resilientes", description: "Compare REST, GraphQL, gRPC, Webhooks, Timeout, Retry e Circuit Breaker." },
    ]}
    curriculumTitle="Arquitetura explicada em uma sequência clara"
    curriculumDescription="Comece pelos fundamentos, avance para qualidade e design e termine com integração e resiliência."
    curriculum={curriculum}
    includedTitle="Três cursos completos incluídos como bônus"
    includedDescription="Além da arquitetura, você fortalece programação, backend e cloud para aplicar os conceitos em projetos reais."
    included={bonusCourses}
    fitTitle="Para quem quer deixar de apenas escrever código e começar a compreender sistemas"
    fitItems={["Quem está começando e quer aprender boas bases", "Desenvolvedores C# e .NET em evolução", "Quem já cria APIs, mas tem dúvidas de organização", "Profissionais se preparando para responsabilidades maiores", "Quem quer entender SOLID sem definições decoradas", "Quem deseja conectar código, integração e infraestrutura"]}
    offerTitle="Leve Arquitetura de Software e mais três cursos completos"
    offerDescription="Por R$ 39,99 à vista, você recebe o curso principal e os treinamentos de C#, API RESTful com .NET e AWS. Uma base com mais de 200 aulas para acompanhar diferentes fases da sua evolução."
    offerItems={["Arquitetura de Software", "75 aulas de C#", "51 aulas de API .NET", "Curso completo de AWS", "Mais de 200 aulas", "4 cursos em uma matrícula"]}
    offerNote={offerAvailable ? "Você será direcionado ao checkout para conferir as condições antes de concluir." : "O conteúdo e o preço já estão definidos. O botão de compra será liberado assim que o checkout da Hotmart for informado."}
    faq={[
      ["Preciso saber programar?", "Não. O bônus de Fundamentos de C# começa por lógica e apresenta a base necessária para acompanhar a evolução."],
      ["Arquitetura não é apenas para desenvolvedores sênior?", "Não. Aprender responsabilidades, qualidade e integração desde cedo evita vícios e acelera a evolução profissional."],
      ["Os três bônus estão incluídos?", "Sim. C#, API RESTful com .NET e AWS acompanham o curso de Arquitetura nesta oferta."],
      ["O curso trabalha exemplos práticos?", "Sim. Os bônus conectam a teoria de arquitetura a código, API, banco de dados, autenticação e infraestrutura."],
      ["Qual é o investimento?", "O valor informado é 6 parcelas de R$ 6,67 ou R$ 39,99 à vista."],
      ["Já posso comprar?", offerAvailable ? "Sim. Use qualquer botão de inscrição da página para acessar o checkout." : "O checkout será liberado nesta página assim que o link da Hotmart estiver disponível."],
    ]}
  />;
}
