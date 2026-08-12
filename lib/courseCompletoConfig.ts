export type CourseTrack = {
  title: string;
  description: string;
  tech?: string;
};

export type CourseProject = {
  title: string;
  description: string;
  badges: string[];
};

export type CourseFaq = {
  question: string;
  answer: string;
};

export type CourseObjection = {
  question: string;
  answer: string;
};

export type CourseProof = {
  title: string;
  description: string;
  image: string;
};

const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_CHECKOUT_URL ??
  "https://pay.hotmart.com/M103626951G";

export const courseConfig = {
  pageKey: "curso-completo",
  pagePath: "/curso-completo",
  pageTitle: "Formacao Desenvolvedor Full Stack + IA | Plugando IA",
  name: "Formacao Desenvolvedor Full Stack + IA",
  shortName: "Full Stack + IA",
  brand: "Plugando IA",
  regularPrice: 499.99,
  launchPrice: 149.99,
  postLaunchPrice: 499.99,
  launchStartDate: "2026-08-11T00:00:00-03:00",
  launchEndDate: "2026-08-31T23:59:59-03:00",
  checkoutUrl: CHECKOUT_URL,
  guaranteeDays: undefined as number | undefined,
  accessDuration: undefined as string | undefined,
  certificate: undefined as boolean | undefined,
  support: undefined as boolean | undefined,
  futureUpdates: false,
  heroHeadlines: {
    a: "Aprenda programacao do zero e evolua ate construir aplicacoes, arquiteturas e solucoes com IA.",
    b: "Pare de estudar tecnologias isoladas. Siga uma trilha do primeiro codigo a Inteligencia Artificial.",
    c: "Do primeiro codigo ao Cloud e a IA: uma formacao completa para quem quer aprender desenvolvimento.",
  },
  ctaLabels: {
    primary: "QUERO COMECAR MINHA FORMACAO",
    launch: "QUERO GARANTIR O PRECO DE LANCAMENTO",
    secondary: "VER A TRILHA COMPLETA",
    compact: "QUERO ENTRAR",
  },
};

export function getCourseRuntimeConfig(now = new Date()) {
  const launchEnd = new Date(courseConfig.launchEndDate);
  const launchActive = now.getTime() <= launchEnd.getTime();

  return {
    ...courseConfig,
    launchActive,
    activePrice: launchActive ? courseConfig.launchPrice : courseConfig.postLaunchPrice,
  };
}

export const quickBenefits = [
  "Comece mesmo sendo iniciante",
  "Siga uma sequencia organizada",
  "Aprenda construindo projetos",
  "Va do codigo ao deploy",
  "Evolua ate aplicacoes com IA",
];

export const journeySteps = [
  "Fundamentos",
  "Backend",
  "Arquitetura",
  "Full Stack",
  "Cloud",
  "Automacao",
  "IA",
];

export const problemCards = [
  {
    title: "Conteudo demais",
    description: "Voce encontra milhares de aulas, mas nao sabe qual deve ser o proximo passo.",
  },
  {
    title: "Tecnologias desconectadas",
    description: "Voce aprende uma ferramenta hoje e outra amanha, mas nao entende como elas trabalham juntas.",
  },
  {
    title: "Pouca pratica real",
    description: "Assistir aulas e diferente de construir uma aplicacao.",
  },
  {
    title: "IA sem fundamento",
    description: "Copiar codigo gerado por IA e facil. Entender, corrigir e evoluir esse codigo exige base.",
  },
];

export const roadmap: CourseTrack[] = [
  {
    title: "Fundamentos",
    description: "Entenda logica, sintaxe e programacao antes de acelerar com frameworks.",
    tech: "C#",
  },
  {
    title: "Backend",
    description: "Aprenda a construir APIs e trabalhar com banco de dados em projetos reais.",
    tech: ".NET + EF Core",
  },
  {
    title: "Arquitetura",
    description: "Entenda como software e organizado e quais decisoes tornam sistemas mais sustentaveis.",
  },
  {
    title: "Full Stack",
    description: "Construa aplicacoes web modernas conectando frontend, backend e dados.",
    tech: "Next.js",
  },
  {
    title: "Cloud",
    description: "Leve suas aplicacoes para infraestrutura real e aprenda a publicar com clareza.",
    tech: "AWS",
  },
  {
    title: "Automacao",
    description: "Conecte sistemas e automatize processos sem perder a visao de arquitetura.",
    tech: "n8n",
  },
  {
    title: "IA",
    description: "Integre modelos de Inteligencia Artificial dentro de aplicacoes e fluxos reais.",
  },
  {
    title: "Agentes",
    description: "Construa aplicacoes com contexto, memoria e capacidade de agir sobre ferramentas.",
  },
  {
    title: "SaaS",
    description: "Entenda como codigo, operacao e produto se conectam em uma oferta vendavel.",
  },
];

export const architectureTopics = [
  {
    title: "Pensando como arquiteto",
    items: [
      "O que e arquitetura de software e por que ela importa.",
      "Tipos de arquiteto e diferenca entre arquitetura e design de codigo.",
      "Papel do arquiteto de software dentro de um sistema real.",
      "Requisitos funcionais, nao funcionais e regras de negocio.",
      "Restricoes tecnicas e financeiras que influenciam decisoes.",
    ],
  },
  {
    title: "Caracteristicas de um bom sistema",
    items: [
      "Escalabilidade para crescer sem perder controle.",
      "Disponibilidade para manter o sistema acessivel.",
      "Desempenho para responder bem sob carga.",
      "Seguranca para proteger dados e acessos.",
      "Manutenibilidade para evoluir o codigo com menos atrito.",
    ],
  },
  {
    title: "Organizacao do codigo",
    items: [
      "Alta coesao e baixo acoplamento explicados na pratica.",
      "Separacao de responsabilidades e encapsulamento.",
      "Composicao, modularidade, dependencia e abstracao.",
      "Como esses principios deixam o codigo mais facil de evoluir.",
    ],
  },
  {
    title: "SOLID na pratica",
    items: [
      "Single Responsibility Principle para evitar classes sobrecarregadas.",
      "Open/Closed Principle para evoluir sem quebrar o que ja existe.",
      "Liskov Substitution Principle para contratos consistentes.",
      "Interface Segregation Principle para interfaces mais claras.",
      "Dependency Inversion Principle para codigo desacoplado e testavel.",
    ],
  },
  {
    title: "Menos complexidade. Mais clareza.",
    items: [
      "DRY para reduzir repeticao sem criar abstractions desnecessarias.",
      "KISS para priorizar solucoes simples e legiveis.",
      "YAGNI para evitar complexidade antes da hora.",
    ],
  },
];

export const integrationTopics = [
  {
    title: "REST",
    description: "Comunicacao amplamente utilizada entre aplicacoes e APIs.",
  },
  {
    title: "GraphQL",
    description: "Consultas flexiveis de dados quando faz sentido expor leitura sob demanda.",
  },
  {
    title: "gRPC",
    description: "Comunicacao eficiente entre servicos com contratos bem definidos.",
  },
  {
    title: "WebSockets",
    description: "Comunicacao em tempo real para eventos e interfaces reativas.",
  },
];

export const projects: CourseProject[] = [
  {
    title: "API REST profissional",
    description: "Construa uma API completa utilizando .NET, banco de dados, Entity Framework, CRUD e autenticacao.",
    badges: ["C#", ".NET", "EF Core", "JWT"],
  },
  {
    title: "Aplicacao Full Stack",
    description: "Conecte frontend e backend em uma aplicacao web moderna com interface, rotas, consumo de API e fluxo real.",
    badges: ["Next.js", "Frontend", "API", "Deploy"],
  },
  {
    title: "Automacoes e integracoes",
    description: "Conecte ferramentas e automatize processos usando n8n, APIs e fluxos que reduzem trabalho manual.",
    badges: ["n8n", "HTTP", "Fluxos", "Integracoes"],
  },
  {
    title: "Aplicacoes com IA e agentes",
    description: "Adicione modelos, contexto e memoria em aplicacoes que consultam dados proprios antes de responder.",
    badges: ["IA", "Agentes", "RAG", "Contexto"],
  },
  {
    title: "SaaS em evolucao",
    description: "Entenda como organizacao tecnica, deploy e produto se juntam para transformar codigo em software vendavel.",
    badges: ["SaaS", "Arquitetura", "Cloud", "Produto"],
  },
];

export const transformationItems = [
  "Entender como frontend, backend, banco de dados e cloud se conectam.",
  "Sair do estudo isolado para uma jornada com sequencia recomendada.",
  "Ganhar repertorio para construir projetos e nao apenas assistir aulas.",
  "Usar IA como acelerador sem depender dela no escuro.",
];

export const aiPillars = [
  {
    title: "Programacao primeiro",
    description: "Voce aprende a base necessaria para ler, testar, corrigir e evoluir o que constroi.",
  },
  {
    title: "IA como acelerador",
    description: "A Inteligencia Artificial entra para ampliar capacidade, nao para substituir entendimento.",
  },
  {
    title: "Aplicacoes com contexto",
    description: "A trilha avanca ate sistemas que consultam dados proprios e usam agentes de forma estruturada.",
  },
];

export const curriculumGroups = [
  {
    title: "Disponivel agora",
    status: "Disponivel agora",
    items: [
      "Fundamentos de programacao com foco em logica e base tecnica.",
      "C# e desenvolvimento backend com .NET.",
      "Banco de dados, Entity Framework e construcao de APIs.",
      "Fundamentos de Arquitetura de Software.",
      "Next.js para aplicacoes Full Stack modernas.",
      "AWS para levar aplicacoes a infraestrutura real.",
      "Automacoes com n8n e integracoes entre sistemas.",
    ],
  },
  {
    title: "Em expansao",
    status: "Em expansao",
    items: [
      "Novos conteudos de Arquitetura de Software em continuidade de gravacao.",
      "Expansao da trilha para aplicacoes com IA, agentes e RAG.",
      "Proxima evolucao planejada para cenarios mais avancados de arquitetura em Cloud.",
    ],
  },
];

export const audienceItems = [
  "Para quem esta comecando do zero e nao sabe por onde entrar.",
  "Para quem esta estudando sozinho e sente que cada curso puxa para um lado.",
  "Para quem quer entender como sistemas reais funcionam, do codigo ao deploy.",
  "Para quem quer aprender programacao e tambem construir com IA no momento certo da jornada.",
];

export const howItWorksItems = [
  "Voce segue uma sequencia recomendada em vez de estudar tudo ao mesmo tempo.",
  "Cada etapa prepara a base da proxima para reduzir confusao entre tecnologias.",
  "Os projetos conectam backend, frontend, dados, cloud, automacao e IA.",
  "O objetivo e transformar entendimento em capacidade pratica de construcao.",
];

export const proofItems: CourseProof[] = [
  {
    title: "Stack, codigo e construcao",
    description: "Visual real do ecossistema Plugando IA conectando backend, automacao e produto.",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Mapa tecnico da jornada",
    description: "Visao da trilha e das conexoes tecnicas entre fundamentos, software e IA.",
    image: "/imersao-ia-tech-stack.svg",
  },
];

export const objections: CourseObjection[] = [
  {
    question: "Eu nunca programei.",
    answer: "A formacao comeca pelos fundamentos. A proposta e construir a base antes de avancar.",
  },
  {
    question: "Tem tecnologia demais.",
    answer: "Voce nao estudara tudo ao mesmo tempo. Existe uma ordem recomendada.",
  },
  {
    question: "Preciso saber matematica avancada?",
    answer: "O foco da formacao esta em logica, programacao e construcao de aplicacoes. Os projetos apresentados nao exigem matematica avancada de Inteligencia Artificial.",
  },
  {
    question: "Por que aprender programacao se a IA escreve codigo?",
    answer: "A IA pode gerar codigo, mas voce ainda precisa entender o que esta acontecendo para testar, corrigir e evoluir aplicacoes.",
  },
  {
    question: "Arquitetura nao e avancada demais?",
    answer: "A trilha comeca pelos fundamentos de arquitetura e explica os conceitos de maneira gradual.",
  },
  {
    question: "Preciso aprender tudo?",
    answer: "Nao. O objetivo da trilha e justamente mostrar uma progressao.",
  },
];

export const faq: CourseFaq[] = [
  {
    question: "Preciso saber programar antes?",
    answer: "Nao. A trilha foi pensada para quem esta comecando e precisa de uma ordem clara desde os fundamentos.",
  },
  {
    question: "Qual curso comeco primeiro?",
    answer: "A recomendacao e comecar pelos fundamentos e seguir a trilha proposta antes de avancar para backend, Full Stack e IA.",
  },
  {
    question: "Qual e a sequencia recomendada?",
    answer: "Fundamentos, backend, arquitetura, Full Stack, cloud, automacao, IA, agentes e SaaS.",
  },
  {
    question: "Arquitetura ja esta disponivel?",
    answer: "Sim. A formacao ja inclui fundamentos de Arquitetura de Software e continua evoluindo com novos aprofundamentos.",
  },
  {
    question: "Novas aulas serao adicionadas?",
    answer: "Sim. A formacao esta crescendo e novas aulas serao adicionadas ao longo da expansao da trilha.",
  },
  {
    question: "Arquitetura Cloud ja esta disponivel?",
    answer: "Ainda nao. Essa e uma das proximas evolucoes planejadas para a trilha.",
  },
  {
    question: "Aprendo frontend?",
    answer: "Sim. A trilha avanca ate aplicacoes Full Stack com Next.js para conectar interface, API e fluxo de dados.",
  },
  {
    question: "Aprendo backend?",
    answer: "Sim. O caminho inclui C#, .NET, APIs e banco de dados como base pratica de backend.",
  },
  {
    question: "Aprendo banco de dados?",
    answer: "Sim. Banco de dados e Entity Framework fazem parte da construcao das APIs e aplicacoes da jornada.",
  },
  {
    question: "Aprendo AWS?",
    answer: "Sim. A trilha inclui cloud para levar aplicacoes a infraestrutura real.",
  },
  {
    question: "Aprendo Inteligencia Artificial?",
    answer: "Sim. A proposta e aprender programacao e depois avancar para aplicacoes com IA, agentes e RAG.",
  },
  {
    question: "Aprendo agentes?",
    answer: "Sim. A trilha inclui a construcao de aplicacoes com contexto e memoria.",
  },
  {
    question: "Aprendo SaaS?",
    answer: "Sim. O objetivo final da jornada inclui entender como codigo se transforma em produto.",
  },
  {
    question: "Tem projetos?",
    answer: "Sim. A pagina posiciona a formacao como pratica, com construcao de APIs, aplicacoes Full Stack, automacoes e aplicacoes com IA.",
  },
  {
    question: "Como funciona o acesso?",
    answer: "O acesso e online para voce estudar no seu ritmo.",
  },
  {
    question: "Tem suporte?",
    answer: "Se esse ponto for decisivo para voce, vale confirmar no checkout ou no canal oficial antes de entrar.",
  },
  {
    question: "Tem certificado?",
    answer: "Se houver certificacao ativa no momento da compra, isso sera informado oficialmente no ambiente comercial.",
  },
  {
    question: "Tem garantia?",
    answer: "As condicoes comerciais validas aparecem no momento da compra. Considere sempre o que estiver informado oficialmente no checkout.",
  },
  {
    question: "Qual e o valor?",
    answer: "Durante o lancamento, a condicao especial e de R$ 149,99. Em 1 de setembro de 2026, a pagina volta para o valor de R$ 499,99.",
  },
  {
    question: "Ate quando vale o preco de lancamento?",
    answer: "O preco promocional de R$ 149,99 fica disponivel ate 31/08/2026 as 23:59, horario de Brasilia. Em 01/09/2026, o valor volta para R$ 499,99.",
  },
];

export const offerChecklist = [
  "Fundamentos de programacao",
  "C#",
  "Backend com .NET",
  "Banco de dados",
  "Entity Framework",
  "APIs",
  "Arquitetura de Software",
  "Next.js",
  "AWS",
  "n8n",
  "SaaS",
  "Agentes IA",
  "RAG",
  "Projetos praticos",
];
