export const courseNovaConfig = {
  pageKey: "curso-novo",
  pagePath: "/curso-novo",
  pageTitle: "Formação Full Stack + IA | Programação para Iniciantes",
  brandName: "Plugando IA",
  courseName: "Formação Full Stack + IA",
  courseDescriptor: "Programação para iniciantes + IA",
  regularPrice: 699,
  launchPrice: 149.9,
  launchEndDate: "2026-08-31T23:59:59-03:00",
  checkoutUrl:
    process.env.NEXT_PUBLIC_CHECKOUT_URL ??
    "https://pay.hotmart.com/M103626951G?off=by19achj&bid=1775680433634",
  accessDuration: "Acesso online",
  guaranteeDays: undefined as number | undefined,
  certificate: undefined as boolean | undefined,
  support: undefined as boolean | undefined,
  architectureStatus: "Novas aulas em produção",
};

export function getCourseNovaRuntimeConfig(now = new Date()) {
  const launchEnd = new Date(courseNovaConfig.launchEndDate);
  const launchActive = now.getTime() <= launchEnd.getTime();

  return {
    ...courseNovaConfig,
    launchActive,
    activePrice: launchActive ? courseNovaConfig.launchPrice : courseNovaConfig.regularPrice,
  };
}

export const heroBenefits = [
  "Comece mesmo sem experiência",
  "Aprenda construindo projetos",
  "Evolua dos fundamentos até IA",
];

export const productShowcase = [
  {
    title: "Veja a trilha de evolução",
    description: "Uma visão clara do caminho, dos fundamentos até aplicações com IA.",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Entenda como as peças se conectam",
    description: "Backend, automação, produto e Inteligência Artificial aparecendo no mesmo ecossistema.",
    image: "/imersao-ia-tech-stack.svg",
  },
  {
    title: "Comece a enxergar produto real",
    description: "Projetos, código e aplicações apresentados como algo possível de construir.",
    image: "/meta-ads-curso-fundamentos-ia-criativo-01-base-tecnica-v2.svg",
  },
  {
    title: "Veja a evolução até IA",
    description: "A proposta não é parar no básico, e sim ganhar clareza para avançar.",
    image: "/meta-ads-curso-fundamentos-ia-criativo-02-rag-llms-v2.svg",
  },
];

export const beginnerPath = [
  {
    word: "APRENDA",
    description: "Comece entendendo lógica e os fundamentos da programação.",
    tech: "C#",
  },
  {
    word: "CONSTRUA",
    description: "Crie suas primeiras aplicações e aprenda como informações são processadas e armazenadas.",
    tech: ".NET + Banco de dados",
  },
  {
    word: "CONECTE",
    description: "Entenda como interface, servidor e dados trabalham juntos.",
    tech: "Next.js + APIs",
  },
  {
    word: "ORGANIZE",
    description: "Quando seus projetos crescerem, aprenda princípios para deixar o código mais organizado e fácil de evoluir.",
    tech: "Arquitetura",
  },
  {
    word: "PUBLIQUE",
    description: "Aprenda como tirar seus projetos da sua máquina e colocá-los na nuvem.",
    tech: "AWS",
  },
  {
    word: "AUTOMATIZE",
    description: "Conecte ferramentas e crie processos que trabalham automaticamente.",
    tech: "n8n",
  },
  {
    word: "ACELERE",
    description: "Use Inteligência Artificial dentro das aplicações que você aprendeu a construir.",
    tech: "IA + Agentes + RAG",
  },
  {
    word: "PRODUTO",
    description: "Veja como diferentes partes se conectam na construção de um SaaS.",
    tech: "SaaS",
  },
];

export const projects = [
  {
    title: "Construa o backend de um sistema de agendamentos.",
    description:
      "Você vai aprender como uma aplicação cadastra clientes, serviços e agendamentos, salva essas informações e controla quem pode acessar o sistema.",
    stack: "C# / .NET / BANCO / AUTENTICAÇÃO",
    image: "/plugando-ia-hero.svg",
  },
  {
    title: "Crie uma aplicação web completa.",
    description:
      "Entenda como as telas de uma aplicação conversam com informações e funcionalidades que estão no servidor.",
    stack: "NEXT.JS / API / FRONTEND / BACKEND",
    image: "/imersao-ia-tech-stack.svg",
  },
  {
    title: "Faça tarefas acontecerem automaticamente.",
    description:
      "Crie fluxos capazes de receber informações, tomar decisões e conversar com outros sistemas.",
    stack: "N8N / API / AUTOMAÇÃO",
    image: "/meta-ads-curso-fundamentos-ia-story-01-lancamento-v2.svg",
  },
  {
    title: "Coloque Inteligência Artificial dentro de uma aplicação.",
    description:
      "Aprenda como uma aplicação envia informações para um modelo de IA e utiliza a resposta dentro de uma experiência real.",
    stack: "IA / AGENTES / CONTEXTO",
    image: "/meta-ads-curso-fundamentos-ia-criativo-02-rag-llms-v2.svg",
  },
  {
    title: "Faça a IA consultar informações próprias.",
    description:
      "Veja como documentos e dados podem servir de contexto antes da Inteligência Artificial responder.",
    stack: "RAG / POSTGRESQL / IA",
    image: "/meta-ads-curso-fundamentos-ia-criativo-02-rag-llms.svg",
  },
  {
    title: "Veja uma aplicação virar produto.",
    description:
      "Construa funcionalidades como cadastro, login, clientes, produtos, trial, pagamento, assinatura e publicação.",
    stack: "SAAS / BANCO / PAGAMENTO / DEPLOY",
    image: "/meta-ads-curso-fundamentos-ia-criativo-03-oferta-lancamento-v2.svg",
  },
];

export const curriculum = [
  {
    title: "Fundamentos de Programação com C#",
    label: "COMECE AQUI",
    description: "Para quem nunca programou ou ainda sente que falta base.",
    items: [
      "Lógica",
      "Variáveis",
      "Tipos",
      "Condições",
      "Loops",
      "Funções",
      "Orientação a objetos",
      "Coleções",
      "Strings",
      "Datas",
      "Arquivos",
      "LINQ",
    ],
  },
  {
    title: "Backend com .NET",
    description: "Aprenda como funciona a parte da aplicação responsável por regras, dados e funcionalidades.",
    items: ["API", "Banco", "CRUD", "Entity Framework", "Login", "Autenticação", "Autorização"],
  },
  {
    title: "Next.js",
    description: "Aprenda a construir aplicações web e conectar telas, dados e funcionalidades.",
    items: ["Rotas", "Layouts", "Componentes", "APIs", "Server Actions", "Formulários"],
  },
  {
    title: "Fundamentos de Arquitetura",
    badge: "NOVO",
    description: "Depois de aprender a construir, comece a entender como organizar melhor seus projetos.",
    items: ["Organização", "Responsabilidades", "Manutenção", "Segurança", "Desempenho", "Escalabilidade"],
  },
  {
    title: "AWS",
    description: "Entenda como aplicações, servidores e bancos funcionam na nuvem.",
    items: ["EC2", "RDS", "S3", "VPC", "Lambda", "API Gateway"],
  },
  {
    title: "n8n",
    description: "Automatize tarefas e conecte diferentes sistemas.",
    items: ["Workflows", "Triggers", "Integrações", "HTTP Request", "Condições", "APIs"],
  },
  {
    title: "Inteligência Artificial",
    description: "Aprenda a integrar IA às aplicações que você constrói.",
    items: ["Modelos", "Chat", "Contexto", "Aplicações", "Integração"],
  },
  {
    title: "Agentes + RAG",
    description: "Evolua para aplicações que trabalham com contexto, memória e informações próprias.",
    items: ["Agentes", "Memória", "Contexto", "RAG", "Banco vetorial"],
  },
  {
    title: "SaaS",
    description: "Veja como diferentes funcionalidades se conectam em um produto digital.",
    items: ["Cadastro", "Login", "Clientes", "Pagamentos", "Assinaturas", "Deploy"],
  },
];

export const architectureTopics = [
  "Organização",
  "Responsabilidades",
  "Manutenção",
  "Segurança",
  "Desempenho",
  "Escalabilidade",
];

export const architectureTerms = ["SOLID", "Coesão", "Acoplamento", "Modularidade", "REST", "GraphQL", "gRPC", "WebSockets"];

export const offerItems = [
  "Fundamentos de Programação",
  "C#",
  "Backend com .NET",
  "Banco de dados",
  "Aplicações com Next.js",
  "Fundamentos de Arquitetura",
  "AWS",
  "Automação com n8n",
  "Inteligência Artificial",
  "Agentes",
  "RAG",
  "Projeto SaaS",
  "Projetos práticos",
];

export const faq = [
  {
    question: "Eu nunca programei. Posso começar?",
    answer:
      "Sim. A formação começa pelos fundamentos de programação. Se você está começando do zero, a recomendação é iniciar pela trilha de Fundamentos de C# e avançar seguindo a sequência.",
  },
  {
    question: "Por onde devo começar?",
    answer: "Comece pela trilha de fundamentos e siga a sequência proposta, sem tentar estudar tudo ao mesmo tempo.",
  },
  {
    question: "Preciso saber matemática avançada?",
    answer: "Não. O foco inicial está em lógica, prática e construção de aplicações.",
  },
  {
    question: "Preciso estudar tudo ao mesmo tempo?",
    answer: "Não. A proposta da formação é exatamente organizar a evolução em etapas.",
  },
  {
    question: "Vou aprender frontend e backend?",
    answer: "Sim. Você passa por backend com .NET e por aplicações web com Next.js.",
  },
  {
    question: "Vou aprender banco de dados?",
    answer: "Sim. Banco de dados aparece ao longo dos projetos, especialmente nas etapas de backend e SaaS.",
  },
  {
    question: "Tem projetos práticos?",
    answer: "Sim. A formação foi pensada para ensinar construção, não só teoria.",
  },
  {
    question: "Vou aprender IA?",
    answer: "Sim. A IA aparece como parte da evolução, depois que você já entende melhor como aplicações funcionam.",
  },
  {
    question: "Por que aprender programação se existe IA?",
    answer: "Porque a IA pode ajudar a escrever código, mas os fundamentos ajudam você a entender o que está sendo construído.",
  },
  {
    question: "Arquitetura é para iniciantes?",
    answer: "Ela aparece como evolução. Primeiro você aprende a construir. Depois aprende a construir melhor.",
  },
  {
    question: "O conteúdo de Arquitetura está completo?",
    answer: "Não completamente. Há novas aulas em produção e isso é tratado de forma transparente.",
  },
  {
    question: "Como funciona o acesso?",
    answer: "O acesso é online.",
  },
  {
    question: "Existe certificado?",
    answer: "Essa informação não está confirmada no projeto atual, então não está sendo prometida aqui.",
  },
  {
    question: "Existe garantia?",
    answer: "Essa informação precisa ser confirmada nas condições comerciais oficiais da oferta.",
  },
  {
    question: "Até quando vale R$ 149,90?",
    answer: "Até 31 de agosto de 2026, às 23:59, horário de São Paulo.",
  },
];
