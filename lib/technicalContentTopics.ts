export type TechnicalFunnel = "TOP" | "MIDDLE" | "BOTTOM";
type Topic = { funnel: TechnicalFunnel; keyword: string; title: string; searchIntent: string; angle: string; priority: number };

const topThemes = ["aprender programação do zero", "mudar de carreira para programação", "programação para renda extra", "primeiro emprego como desenvolvedor", "quanto ganha um programador", "programação depois dos 30 anos", "programação para ajudar a família", "como ter reconhecimento na carreira de tecnologia", "como montar portfólio de programação", "como estudar programação trabalhando", "faculdade ou curso de programação", "lógica de programação para iniciantes", "como sair do zero em tecnologia", "rotina de estudos para programação", "medo de não conseguir aprender programação", "como conseguir estágio em programação", "carreira em backend", "programação para quem vem de outra área", "como criar projetos para portfólio", "como conseguir renda com tecnologia"];
const middleThemes = ["curso de C# para iniciantes", "curso de backend .NET", "como criar API REST com .NET", "curso de arquitetura de software", "curso de RabbitMQ", "curso de Next.js", "como criar SaaS", "como estudar cloud AWS", "como aprender banco de dados PostgreSQL", "como montar portfólio backend", "roadmap desenvolvedor C#", "projeto CRUD com .NET", "autenticação JWT em .NET", "curso para mudar de carreira para backend", "curso de programação com projetos", "como conseguir primeira vaga .NET", "trilha de estudos para desenvolvedor backend", "curso de APIs para iniciantes", "como aprender mensageria", "projeto SaaS para portfólio"];
const bottomThemes = ["C#", ".NET", "API REST", "RabbitMQ", "Kafka", "Next.js", "React", "PostgreSQL", "Docker", "AWS", "SOLID", "Clean Architecture", "JWT", "Entity Framework Core", "mensageria", "SaaS", "n8n", "agentes de IA", "RAG", "Antigravity"];

const topAngles = ["por onde começar", "roteiro de 90 dias", "erros de quem começa", "como criar rotina realista", "como praticar sem travar", "projetos simples para começar", "expectativa de salário e carreira", "como transformar estudo em portfólio", "como estudar mesmo trabalhando", "mitos que atrasam iniciantes"];
const middleAngles = ["o que você vai aprender", "trilha passo a passo", "projeto prático para fazer", "pré-requisitos reais", "erros comuns e como evitar", "como saber se é a escolha certa", "plano de estudos de 30 dias", "como montar portfólio com esse tema", "comparação de caminhos de estudo", "próximo passo para conseguir vaga"];
const bottomAngles = ["o que é e para que serve", "como funciona na prática", "quando foi criado e como evoluiu", "vantagens e limitações", "comparação com alternativas", "quando usar e quando não usar", "exemplo simples para iniciantes", "principais dúvidas respondidas", "erros comuns", "como aprender na ordem certa"];

function build(themes: string[], angles: string[], funnel: TechnicalFunnel, intent: string) {
  return themes.flatMap((theme, themeIndex) => angles.map((angle, angleIndex) => ({
    funnel,
    keyword: `${theme} ${angle}`,
    title: `${theme}: ${angle}`.replace(/^./, (letter) => letter.toUpperCase()),
    searchIntent: intent,
    angle,
    priority: themeIndex * 10 + angleIndex + 1,
  })));
}

export const technicalContentTopics: Topic[] = [
  ...build(topThemes, topAngles, "TOP", "Informacional: descoberta de carreira, aprendizado e mudança de vida"),
  ...build(middleThemes, middleAngles, "MIDDLE", "Consideração: método, curso, projeto e especialização"),
  ...build(bottomThemes, bottomAngles, "BOTTOM", "Decisão: tecnologia, funcionamento, comparação e aplicação"),
];

export const FUNNEL_LABEL: Record<TechnicalFunnel, string> = { TOP: "Topo de funil", MIDDLE: "Meio de funil", BOTTOM: "Fundo de funil" };
