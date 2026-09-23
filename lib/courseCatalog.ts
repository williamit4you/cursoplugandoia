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
  installments?: string;
  badge?: string;
  available: boolean;
};

export const courseCatalog: CourseCatalogItem[] = [
  {
    slug: "arquitetura-software",
    href: "/curso-arquitetura-software",
    eyebrow: "Arquitetura + 3 bônus",
    title: "Arquitetura de Software com C#",
    description: "Aprenda a organizar sistemas e leve também os cursos de C#, API RESTful com .NET e AWS.",
    outcome: "4 cursos • mais de 200 aulas",
    tags: ["Arquitetura", "C#", ".NET", "AWS"],
    accent: "violet",
    price: 39.99,
    installments: "6x de R$ 6,67",
    badge: "Oferta com bônus",
    available: true,
  },
  {
    slug: "rabbitmq",
    href: "/curso-rabbitmq",
    eyebrow: "Mensageria com .NET",
    title: "RabbitMQ: do zero ao processamento resiliente",
    description: "Domine exchanges, filas, ACK, concorrência, DLQ e Retry construindo Producers e Consumers em .NET.",
    outcome: "51 aulas • prática com Docker e C#",
    tags: ["RabbitMQ", ".NET", "Docker"],
    accent: "orange",
    price: 29.9,
    installments: "9x de R$ 3,93",
    badge: "Lançamento",
    available: true,
  },
  {
    slug: "saas-antigravity",
    href: "/curso-saas",
    eyebrow: "Produto com IA",
    title: "Criando SaaS com Antigravity",
    description: "Construa um SaaS completo com Antigravity e Next.js, do prompt ao banco, trial, pagamento e deploy.",
    outcome: "8 cursos • 85 aulas • projeto publicado",
    tags: ["Antigravity", "Next.js", "SaaS"],
    accent: "cyan",
    price: 29.9,
    installments: "9x de R$ 3,93",
    badge: "Curso + 7 bônus",
    available: true,
  },
];
