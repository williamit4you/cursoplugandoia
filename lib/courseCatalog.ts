export type CourseCatalogItem = {
  slug: string;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  outcome: string;
  tags: string[];
  accent: "orange" | "cyan" | "violet" | "emerald" | "amber";
  price?: number;
  regularPrice?: number;
  badge?: string;
  available: boolean;
};

export const courseCatalog: CourseCatalogItem[] = [
  {
    slug: "rabbitmq",
    href: "/curso-rabbitmq",
    eyebrow: "Mensageria com .NET",
    title: "RabbitMQ: do zero ao processamento resiliente",
    description:
      "Domine exchanges, filas, ACK, concorrência, DLQ e retry construindo Producers e Consumers em .NET.",
    outcome: "51 aulas • prática com Docker e C#",
    tags: ["RabbitMQ", ".NET", "Docker"],
    accent: "orange",
    price: 29.9,
    regularPrice: 99.99,
    badge: "Lançamento",
    available: true,
  },
  {
    slug: "arquitetura-software",
    href: "/curso-arquitetura",
    eyebrow: "Engenharia de software",
    title: "Arquitetura de Software",
    description:
      "Aprenda a tomar decisões técnicas melhores e a organizar sistemas que conseguem crescer sem virar um problema.",
    outcome: "SOLID, qualidade, integração e modelos arquiteturais",
    tags: ["Arquitetura", "SOLID", "Design"],
    accent: "violet",
    badge: "Em preparação",
    available: false,
  },
  {
    slug: "saas-antigravity",
    href: "/curso-saas",
    eyebrow: "Produto na prática",
    title: "Criando SaaS com Antigravity",
    description:
      "Construa um SaaS completo com Antigravity e Next.js, do prompt ao banco, trial, pagamento e deploy.",
    outcome: "8 cursos • 85 aulas • projeto publicado",
    tags: ["Antigravity", "Next.js", "SaaS"],
    accent: "cyan",
    badge: "Curso + 7 bônus",
    available: true,
  },
  {
    slug: "api-rest-dotnet",
    href: "/curso-api-rest-dotnet",
    eyebrow: "Backend profissional",
    title: "API RESTful com .NET",
    description:
      "Construa a API de uma barbearia com persistência, regras de negócio, autenticação e autorização.",
    outcome: "Projeto de barbearia + autenticação",
    tags: ["C#", ".NET", "API REST"],
    accent: "emerald",
    badge: "Em preparação",
    available: false,
  },
  {
    slug: "formacao-completa",
    href: "/curso-completo",
    eyebrow: "A jornada completa",
    title: "Combo Formação Full Stack + IA",
    description:
      "Uma trilha organizada para evoluir dos fundamentos ao backend, arquitetura, cloud, automação e Inteligência Artificial.",
    outcome: "Todos os fundamentos em uma única formação",
    tags: ["C#", "Cloud", "IA"],
    accent: "amber",
    badge: "Melhor custo-benefício",
    available: true,
  },
];
