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
    slug: "formacao-completa",
    href: "/formacao-completa",
    eyebrow: "A melhor escolha",
    title: "Formação Completa Plugando IA",
    description: "Leve Vibe Coding, Arquitetura de Software, RabbitMQ, Fundamentos de IA Generativa e SaaS com Antigravity em uma única matrícula.",
    outcome: "5 cursos • acesso vitalício • futuras atualizações",
    tags: ["Vibe Coding", "Arquitetura", "RabbitMQ", "IA", "SaaS"],
    accent: "cyan",
    price: 149.9,
    regularPrice: 399.5,
    installments: "De R$ 399,50 por",
    badge: "Combo • economize R$ 249,60",
    available: true,
  },
  {
    slug: "vibecode",
    href: "/vibecode",
    eyebrow: "Da ideia à aplicação",
    title: "Vibe Coding para Leigos",
    description: "Use ChatGPT e Codex para planejar, construir, testar e publicar aplicações, mesmo sem experiência com programação.",
    outcome: "Método completo • projeto real de ponta a ponta",
    tags: ["Vibe Coding", "ChatGPT", "Codex", "Projeto prático"],
    accent: "violet",
    price: 79.9,
    installments: "Pagamento único",
    badge: "Novo curso",
    available: true,
  },
  {
    slug: "vibecode",
    href: "/vibecode",
    eyebrow: "Da ideia à aplicação",
    title: "Vibe Coding para Leigos",
    description: "Use ChatGPT e Codex para planejar, construir, testar e publicar aplicações, mesmo sem experiência com programação.",
    outcome: "Método completo • projeto real de ponta a ponta",
    tags: ["Vibe Coding", "ChatGPT", "Codex", "Projeto prático"],
    accent: "violet",
    price: 79.9,
    installments: "Pagamento único",
    badge: "Novo curso",
    available: true,
  },
  {
    slug: "fundamentos-ia",
    href: "/fundamentos-ia",
    eyebrow: "IA Generativa na prática",
    title: "Fundamentos de IA Generativa",
    description: "Entenda LLMs e prompts e aprenda a integrar IA, Tools e dados reais em uma aplicação web completa.",
    outcome: "7 módulos • projeto completo de barbearia com IA",
    tags: ["IA Generativa", "LLMs", "Tools", "Aplicação web"],
    accent: "amber",
    price: 79.9,
    installments: "Pagamento único",
    badge: "Novo curso",
    available: true,
  },
  {
    slug: "arquitetura-software",
    href: "/curso-arquitetura-software",
    eyebrow: "Arquitetura + 3 bônus",
    title: "Arquitetura de Software com C#",
    description: "Aprenda a organizar sistemas e leve também os cursos de C#, API RESTful com .NET e AWS.",
    outcome: "4 cursos • mais de 200 aulas",
    tags: ["Arquitetura", "C#", ".NET", "AWS"],
    accent: "violet",
    price: 79.9,
    installments: "Pagamento único",
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
    price: 79.9,
    installments: "Pagamento único",
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
    price: 79.9,
    installments: "Pagamento único",
    badge: "Curso + 7 bônus",
    available: true,
  },
];
