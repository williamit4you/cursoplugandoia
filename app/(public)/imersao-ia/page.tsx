import { FadeIn } from "@/components/motion/fade-in";
import { Section } from "@/components/landing/section";
import Image from "next/image";
import { ArrowRight, BrainCircuit, Check, ChevronRight, Code2, Database, GitBranch, Globe, Layers3, Mail, Rocket, ShieldCheck, Sparkles, Workflow } from "lucide-react";

const checkoutUrl = process.env.NEXT_PUBLIC_IMERSAO_IA_CHECKOUT_URL ?? "#oferta";

const quickWins = [
  "N8N e automacoes",
  "Agentes de Inteligencia Artificial",
  "Next.js na pratica",
  "Projetos reais + SaaS completo",
];

const pathSteps = ["Zero", "Fundamentos", "Automacao", "Agentes", "Desenvolvimento", "Aplicacoes", "SaaS"];

const pains = [
  {
    icon: "01",
    title: "Informacao demais",
    description: "n8n, APIs, agentes, RAG, Next.js, banco vetorial, deploy... tudo aparece ao mesmo tempo.",
  },
  {
    icon: "02",
    title: "Tudo desconectado",
    description: "Voce aprende uma ferramenta, mas nao entende como juntar tudo num projeto util.",
  },
  {
    icon: "03",
    title: "Nenhum caminho claro",
    description: "Um tutorial ensina um pedaco, outro muda o stack, e voce segue sem terminar nada.",
  },
];

const methodSteps = [
  {
    number: "01",
    title: "Conhecer",
    description: "Entenda os fundamentos sem ficar perdido nas siglas.",
  },
  {
    number: "02",
    title: "Conectar",
    description: "Integre ferramentas, APIs, modelos e fluxos com logica.",
  },
  {
    number: "03",
    title: "Construir",
    description: "Crie aplicacoes reais com interface, automacao e IA.",
  },
  {
    number: "04",
    title: "Colocar no ar",
    description: "Veja projetos funcionando de verdade, com deploy e estrutura de produto.",
  },
];

const modules = [
  {
    eyebrow: "Modulo 01",
    title: "N8N Basico",
    summary: "Sua base para automacoes e integracoes do jeito certo.",
    lessons: [
      "O que sao workflows",
      "O que sao credenciais",
      "Entendendo as execucoes e como ela nos ajuda",
      "Importacao e exportacao de fluxo",
      "Triggers no N8N",
      "Acoes",
      "Condicional IF",
      "Soma, max, min e filtro",
      "Entendendo o no Code",
      "Utilizando o node HTTP Request",
    ],
  },
  {
    eyebrow: "Modulo 02",
    title: "Credenciais",
    summary: "Configure os acessos que liberam o potencial dos seus fluxos.",
    lessons: ["Credencial gmail google passo a passo", "Credencial Open AI"],
  },
  {
    eyebrow: "Modulo 03",
    title: "Agente de IA",
    summary: "Saia do uso basico e comece a montar agentes com memoria e ferramentas.",
    lessons: [
      "Explicando basico de um agente de IA",
      "Criando o primeiro agente IA testando e explicando a memoria",
      "Criando o primeiro agente (forma rapida)",
      "Agente de IA com tools se atente ao nome da ferramenta",
    ],
  },
  {
    eyebrow: "Modulo 04",
    title: "Site advocacia com IA + RAG",
    summary: "Projeto real conectando site, chatbot, automacao, banco vetorial e RAG.",
    lessons: [
      "Criando site advocacia com IA",
      "Explicando as tags",
      "Enviando e-mail com n8n e gmail",
      "Incluindo chatbot no site",
      "Explicando sobre banco de dados vetorial e quais existe e qual vou utilizar",
      "Criando o banco de dados postgre no railway e conectando",
      "Incluir arquivo no banco de dados vetorial",
      "Ajuste dados para metadata",
      "Criando o agente IA com rag",
    ],
  },
  {
    eyebrow: "Modulo 05",
    title: "Next.js",
    summary: "A trilha completa para aprender a construir apps modernos de forma organizada.",
    lessons: [
      "Introducao ao nextjs",
      "Criando o projeto",
      "Entendendo o projeto",
      "Entendo as Rotas",
      "Entendendo o Layout.tsx",
      "Agrupamento de paginas",
      "Rotas dinamicas",
      "Rota dinamica com slug",
      "Consulta API CEP com valor que esta na rota",
      "Titulo do site de acordo com a rota",
      "Explicando server components e client components",
      "Mudanca de tela utilizando o Link",
      "Mudanca de tela exclusiva para use client e formularios com useRouter",
      "Mudanca de tela exclusiva pelo server component redirect",
      "Explicando o useRouter replace, push, prefetch, back",
      "Explicando o useRouter forward e o refresh",
      "Tela de erro especifica",
      "Criando um componente e requisicao Server",
      "memorizacao e cache nas requisicoes",
      "middleware nas requisicoes",
      "Requisicoes Server Actions",
      "Server Actions utilizando formulario",
      "useFormState e useFormStatus",
      "Criando API com NEXTjs",
    ],
  },
  {
    eyebrow: "Modulo 06",
    title: "Agentes IA com codigo utilizando NEXT.js",
    summary: "Agora voce junta interface, API, contexto e memoria numa aplicacao de IA propria.",
    lessons: [
      "Criando projeto de agentes",
      "Criando a tela inicial para acessar os agentes",
      "variavel de ambiente e gerando API Key OpenAI",
      "Criando a action para se comunicar com a OPENAI",
      "Criando nosso ChatClient - bate papo com IA",
      "Criando o agente com contexto e memoria",
    ],
  },
  {
    eyebrow: "Modulo 07",
    title: "Criando SaaS com Antigravity",
    summary: "O projeto final para voce acompanhar um sistema completo do prompt ao deploy.",
    lessons: [
      "Aula 001 - Criando prompt para criar o sistema",
      "Aula 002 - criando projeto com Antigravity",
      "Aula 003 - Criando banco Postgres SQL e gerando Conexao",
      "Aula 004 - testando e efetuando ajustes",
      "Aula 005 - testando pagamento e criando trial de 7 dias gratis",
      "Aula 006 - efetuando login no sistema e testando cadastro trial",
      "Aula 007 - Criando menu, testando criacao do cliente, veiculo, produto e servico",
      "Aula 008 - testando a edicao dos cadastros e solicitando a funcionalidade de importacao",
      "Aula 009 - efetuando a importacao dos dados",
      "Aula 010 - ajuste no alert do sistema, testando criacao de ordem de servico",
      "Aula 011 - Verificando a parte de pagamento",
      "Aula 012 - Configurando Asas e concluindo pagamento",
      "Aula 013 - validacao da assinatura concluida",
      "Aula 014 - ajuste dockerfile e gitignore",
      "Aula 015 - subindo no github e no easypanel",
      "Aula 016 - hospedando,logando e testando",
      "Aula 017 - Efetuando novo cadastro e testando",
    ],
  },
];

const projectHighlights = [
  {
    icon: Workflow,
    title: "Automacao",
    description: "n8n + APIs + Gmail + HTTP Request",
  },
  {
    icon: BrainCircuit,
    title: "Aplicacao com IA",
    description: "Next.js + OpenAI + memoria + tools",
  },
  {
    icon: Rocket,
    title: "SaaS",
    description: "Sistema + banco + assinatura + deploy",
  },
];

const techStack = [
  { name: "n8n", icon: Workflow },
  { name: "OpenAI", icon: Sparkles },
  { name: "Next.js", icon: Globe },
  { name: "Gmail", icon: Mail },
  { name: "PostgreSQL", icon: Database },
  { name: "Railway", icon: Rocket },
  { name: "RAG", icon: BrainCircuit },
  { name: "Banco Vetorial", icon: Layers3 },
  { name: "HTTP Request", icon: ChevronRight },
  { name: "APIs", icon: Code2 },
  { name: "GitHub", icon: GitBranch },
  { name: "Deploy", icon: ShieldCheck },
];

const audience = [
  {
    title: "Estou comecando",
    description: "Voce nao precisa dominar essas tecnologias antes para acompanhar.",
  },
  {
    title: "Quero aprender IA de verdade",
    description: "Ir alem de usar prompt e entender como construir solucoes.",
  },
  {
    title: "Quero criar automacoes",
    description: "Conectar IA com ferramentas, APIs e fluxos que resolvem tarefas reais.",
  },
  {
    title: "Quero construir projetos",
    description: "Sites, agentes, aplicacoes e um SaaS completo em um caminho so.",
  },
];

const beforeItems = [
  "Tutoriais aleatorios",
  "Ferramentas desconectadas",
  "Nao saber o que estudar",
  "So consumir conteudo",
  "Nunca terminar um projeto",
];

const afterItems = [
  "Caminho estruturado",
  "Ferramentas trabalhando juntas",
  "Projetos passo a passo",
  "Aplicacoes com IA",
  "SaaS completo",
];

const faqs = [
  {
    q: "Preciso saber programacao para acompanhar?",
    a: "Nao. A oferta foi estruturada para quem esta comecando e precisa de um caminho organizado. Ter curiosidade e vontade de praticar ja ajuda muito.",
  },
  {
    q: "Nunca usei n8n. Vou conseguir acompanhar?",
    a: "Sim. O treinamento comeca pelo basico, explicando workflows, credenciais, execucoes, triggers, acoes, IF, filtros, Code e HTTP Request.",
  },
  {
    q: "Eu realmente vou aprender a criar agentes de IA?",
    a: "Sim. A formacao passa pelo basico do agente, memoria, criacao rapida, tools e depois evolui para agentes com codigo usando Next.js.",
  },
  {
    q: "Tem projeto pratico ou e so teoria?",
    a: "Tem projeto real. Voce acompanha um site para advocacia com IA e RAG, uma trilha de agentes com codigo e um SaaS completo do inicio ao deploy.",
  },
  {
    q: "O SaaS e criado dentro da formacao?",
    a: "Sim. Existe um modulo inteiro acompanhando a criacao do sistema, banco, pagamento, trial, login, assinatura, GitHub e hospedagem.",
  },
  {
    q: "Como acesso as aulas?",
    a: "A pagina ja esta preparada para ligar seu checkout. Assim que a URL final de compra for conectada, os CTAs podem levar direto para a oferta.",
  },
];

function PrimaryCta({ label, href = checkoutUrl }: { label: string; href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2563EB,#7C3AED)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(59,130,246,0.3)] transition hover:scale-[1.01] hover:shadow-[0_18px_60px_rgba(124,58,237,0.28)]"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

export const metadata = {
  title: "Imersao IA | Formacao IA na Pratica",
  description:
    "Aprenda n8n, agentes de IA, Next.js, RAG e SaaS completo em uma jornada pratica por apenas R$97.",
};

export default function ImersaoIaPage() {
  return (
    <main className="relative overflow-hidden bg-[#070B14] text-[#F8FAFC]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.18]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(7,11,20,0.98),rgba(7,11,20,0.72),transparent)]" />
      <div className="pointer-events-none absolute left-[-80px] top-24 h-72 w-72 rounded-full bg-[#2563EB]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-100px] top-10 h-80 w-80 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[840px] h-96 w-96 -translate-x-1/2 rounded-full bg-[#3B82F6]/10 blur-3xl" />

      <Section className="pt-6 md:pt-8">
        <nav className="sticky top-4 z-20 rounded-full border border-white/10 bg-[rgba(13,19,33,0.66)] px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center justify-between gap-4">
            <a href="#topo" className="text-sm font-semibold tracking-[0.2em] text-white">
              IA NA PRATICA
            </a>
            <div className="hidden items-center gap-6 text-sm text-[#94A3B8] md:flex">
              <a className="transition hover:text-white" href="#aprende">
                O que voce aprende
              </a>
              <a className="transition hover:text-white" href="#projetos">
                Projetos
              </a>
              <a className="transition hover:text-white" href="#conteudo">
                Conteudo
              </a>
              <a className="transition hover:text-white" href="#para-quem">
                Para quem e
              </a>
            </div>
            <PrimaryCta label="Comecar agora" />
          </div>
        </nav>
      </Section>

      <Section className="pt-8 md:pt-10" id="topo">
        <div className="grid gap-12 md:grid-cols-[1.02fr,0.98fr] md:items-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-[#BFDBFE]">
              <Sparkles className="h-3.5 w-3.5" />
              Formacao completa em Inteligencia Artificial
            </span>

            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-tight md:text-6xl">
              Saia do zero e aprenda a criar{" "}
              <span className="bg-[linear-gradient(135deg,#60A5FA,#8B5CF6)] bg-clip-text text-transparent">
                aplicacoes completas com IA
              </span>
              .
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#CBD5E1] md:text-lg">
              Aprenda passo a passo a criar automacoes, agentes de IA, aplicacoes web e ate seu proprio SaaS, mesmo
              que voce esteja comecando agora.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {quickWins.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <PrimaryCta label="Quero aprender IA na pratica" />
              <a
                href="#conteudo"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Ver conteudo da formacao
              </a>
            </div>

            <p className="mt-4 text-sm text-[#94A3B8]">Acesso a formacao completa por apenas R$97.</p>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="relative">
              <div className="absolute -inset-8 rounded-[36px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_40%)] blur-2xl" />
              <div className="relative rounded-[28px] border border-[#1E293B] bg-[rgba(17,24,39,0.72)] p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_30px_100px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
                <div className="rounded-[24px] border border-white/10 bg-[#0D1321]/90 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#94A3B8]">
                    <span>IA NA PRATICA</span>
                    <span>turma ativa</span>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between text-sm text-white/90">
                      <span>Seu progresso</span>
                      <span>68%</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,#3B82F6,#8B5CF6)]" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      ["N8N Basico", "Concluido"],
                      ["Agentes de IA", "Concluido"],
                      ["Site + RAG", "Em andamento"],
                      ["Next.js", "Disponivel"],
                      ["Agentes com codigo", "Disponivel"],
                      ["Criando seu SaaS", "Disponivel"],
                    ].map(([label, status], index) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              "h-2.5 w-2.5 rounded-full",
                              index < 2 ? "bg-emerald-400" : index === 2 ? "bg-cyan-400" : "bg-violet-400/80",
                            ].join(" ")}
                          />
                          <span className="text-sm text-white/90">{label}</span>
                        </div>
                        <span className="text-xs uppercase tracking-[0.18em] text-[#94A3B8]">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(13,19,33,0.92))]">
                  <Image
                    src="/imersao-ia-tech-stack.svg"
                    alt="Mapa visual das tecnologias da imersao IA"
                    width={1600}
                    height={900}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="section-border" id="aprende">
        <FadeIn>
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,19,33,0.92),rgba(17,24,39,0.78))] p-6 md:p-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-[#93C5FD]">Existe um caminho</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Voce nao precisa aprender tudo de uma vez.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-7">
              {pathSteps.map((step, index) => (
                <div key={step} className="relative">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center">
                    <div className="text-xs uppercase tracking-[0.2em] text-[#94A3B8]">{String(index + 1).padStart(2, "0")}</div>
                    <div className="mt-2 text-sm font-medium text-white">{step}</div>
                  </div>
                  {index < pathSteps.length - 1 && (
                    <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-[linear-gradient(90deg,#3B82F6,#8B5CF6)] md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="problema">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              O problema nao e aprender IA.
            </h2>
            <p className="mt-3 text-lg text-[#CBD5E1]">E nao saber por onde comecar.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pains.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#60A5FA]">{item.icon}</div>
                <div className="mt-4 text-xl font-semibold">{item.title}</div>
                <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">{item.description}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-lg text-white/90">
            A Formacao IA na Pratica organiza esse caminho para voce.
          </p>
        </FadeIn>
      </Section>

      <Section className="section-border">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#C4B5FD]">Metodo 4C</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Conhecer, conectar, construir e colocar no ar.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {methodSteps.map((step) => (
              <div key={step.title} className="rounded-[24px] border border-white/10 bg-[rgba(17,24,39,0.72)] p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">{step.number}</div>
                <div className="mt-4 text-xl font-semibold">{step.title}</div>
                <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">{step.description}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="conteudo">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#93C5FD]">Conteudo da formacao</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Do fluxo no n8n ao SaaS publicado.
            </h2>
            <p className="mt-4 text-[#CBD5E1]">
              Cada modulo abre um novo nivel da jornada, sem perder a conexao entre teoria, integracao e projeto real.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {modules.map((module, index) => (
              <details
                key={module.title}
                className="group rounded-[24px] border border-white/10 bg-[rgba(17,24,39,0.68)] p-6 open:bg-[rgba(17,24,39,0.9)]"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-[#93C5FD]">{module.eyebrow}</div>
                      <div className="mt-2 text-2xl font-semibold">{module.title}</div>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#94A3B8]">{module.summary}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#CBD5E1]">
                        {module.lessons.length} aulas
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition group-open:rotate-45">
                        +
                      </div>
                    </div>
                  </div>
                </summary>

                <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 md:grid-cols-2">
                  {module.lessons.map((lesson) => (
                    <div key={lesson} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#E2E8F0]">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[linear-gradient(135deg,#3B82F6,#8B5CF6)]" />
                      <span>{lesson}</span>
                    </div>
                  ))}
                </div>

                {index === modules.length - 1 && (
                  <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    Projeto final com banco, login, trial, assinatura, GitHub e deploy para aumentar o valor percebido
                    da formacao.
                  </div>
                )}
              </details>
            ))}
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border">
        <FadeIn>
          <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(139,92,246,0.12),rgba(7,11,20,0.92))] p-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#BFDBFE]">Ponto de virada</p>
            <h2 className="mx-auto mt-3 max-w-4xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              Voce comeca aprendendo as ferramentas. Mas termina entendendo como construir aplicacoes completas.
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {projectHighlights.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="relative rounded-[24px] border border-white/10 bg-[#0D1321]/75 p-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#93C5FD]">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="mt-4 text-xl font-semibold">{item.title}</div>
                    <p className="mt-2 text-sm text-[#94A3B8]">{item.description}</p>
                    {index < projectHighlights.length - 1 && (
                      <div className="pointer-events-none absolute -right-5 top-1/2 hidden h-px w-10 -translate-y-1/2 bg-[linear-gradient(90deg,#3B82F6,#8B5CF6)] md:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="projetos">
        <div className="grid gap-8 md:grid-cols-[0.92fr,1.08fr] md:items-center">
          <FadeIn>
            <div className="inline-flex rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-[#DDD6FE]">
              Projeto final
            </div>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Acompanhe a criacao de um SaaS do inicio ao deploy.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#CBD5E1]">
              Aqui o valor percebido sobe muito: voce deixa de ver apenas aulas isoladas e passa a acompanhar um
              sistema real com banco, autenticacao, pagamento, trial e publicacao.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Banco PostgreSQL", "Login", "Cadastro", "Trial", "Pagamentos", "Assinatura", "GitHub", "Deploy"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="rounded-[28px] border border-white/10 bg-[rgba(17,24,39,0.74)] p-5 shadow-[0_24px_100px_rgba(2,6,23,0.55)]">
              <div className="rounded-[24px] border border-white/10 bg-[#0D1321] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-[#94A3B8]">Projeto SaaS</div>
                    <div className="mt-2 text-2xl font-semibold text-white">Painel de operacao</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    online
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-sm text-[#94A3B8]">Receita mensal</div>
                    <div className="mt-3 text-4xl font-semibold">R$ 4.870</div>
                    <div className="mt-3 h-24 rounded-xl bg-[linear-gradient(180deg,rgba(59,130,246,0.2),rgba(139,92,246,0.04))]">
                      <div className="flex h-full items-end gap-2 px-3 pb-3">
                        {[40, 52, 47, 66, 61, 78, 84].map((height, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-t-md bg-[linear-gradient(180deg,#60A5FA,#8B5CF6)]"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {[
                      ["Clientes ativos", "128"],
                      ["Trials", "24"],
                      ["Conversao", "18%"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="text-sm text-[#94A3B8]">{label}</div>
                        <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="section-border">
        <div className="grid gap-8 md:grid-cols-[1fr,1fr] md:items-center">
          <FadeIn>
            <p className="text-sm uppercase tracking-[0.3em] text-[#93C5FD]">Tecnologias envolvidas</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Um ecossistema visualmente forte para comunicar autoridade.
            </h2>
            <p className="mt-4 text-[#CBD5E1]">
              Em vez de imagens genericas de robo, a pagina mostra stacks, interfaces, integracoes e infraestrutura,
              exatamente o que faz esse produto parecer mais serio e valioso.
            </p>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="grid gap-3 sm:grid-cols-2">
              {techStack.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(139,92,246,0.16))] text-[#BFDBFE]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.name}</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#94A3B8]">stack da imersao</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </Section>

      <Section className="section-border" id="para-quem">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Para quem e essa formacao?</h2>
            <p className="mt-4 text-[#CBD5E1]">
              Para quem quer entrar no mundo da IA com um plano pratico, projetos reais e uma evolucao mais segura.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {audience.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-[rgba(17,24,39,0.68)] p-6">
                <div className="text-xl font-semibold">{item.title}</div>
                <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">{item.description}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border">
        <FadeIn>
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-[#C4B5FD]">Antes e depois</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                A diferenca entre assistir conteudo e construir projetos.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-rose-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(30,41,59,0.88))] p-6">
                <div className="text-sm uppercase tracking-[0.22em] text-rose-200/80">Antes</div>
                <div className="mt-5 grid gap-3">
                  {beforeItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#CBD5E1]">
                      <span className="text-rose-300">x</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-emerald-400/15 bg-[linear-gradient(180deg,rgba(37,99,235,0.14),rgba(34,197,94,0.08),rgba(13,19,33,0.92))] p-6">
                <div className="text-sm uppercase tracking-[0.22em] text-emerald-200/80">Depois</div>
                <div className="mt-5 grid gap-3">
                  {afterItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#E2E8F0]">
                      <span className="text-emerald-300">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border" id="oferta">
        <FadeIn>
          <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(13,19,33,0.98))] p-8 shadow-[0_30px_120px_rgba(2,6,23,0.65)]">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-[#BFDBFE]">Acesso a formacao completa</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-5xl">Formacao IA na Pratica</h2>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {[
                "N8N do Zero",
                "Credenciais e Integracoes",
                "Agentes de IA",
                "Projeto Site com IA e RAG",
                "Formacao Next.js",
                "Agentes de IA com Codigo",
                "Projeto SaaS Completo",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/90">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="text-base text-[#94A3B8] line-through">De R$ 297</div>
              <div className="mt-2 text-6xl font-semibold tracking-tight text-white">R$ 97</div>
              <div className="mt-2 text-sm text-[#CBD5E1]">pagamento unico para entrar agora</div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <PrimaryCta label="Quero comecar agora" />
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                Compra segura
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border pb-16" id="faq">
        <FadeIn>
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-[#93C5FD]">FAQ</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">Duvidas rapidas antes de entrar</h2>
            </div>

            <div className="mt-10 grid gap-4">
              {faqs.map((item) => (
                <details key={item.q} className="group rounded-[24px] border border-white/10 bg-[rgba(17,24,39,0.68)] p-6">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-6">
                      <div className="text-base font-semibold text-white">{item.q}</div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition group-open:rotate-45">
                        +
                      </div>
                    </div>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-[#94A3B8]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section className="section-border pb-20">
        <FadeIn>
          <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_35%),linear-gradient(180deg,rgba(13,19,33,0.96),rgba(7,11,20,1))] px-6 py-12 text-center md:px-10">
            <h2 className="mx-auto max-w-4xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              Da primeira automacao ao seu primeiro SaaS.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[#CBD5E1] md:text-lg">
              Existe muito para aprender em IA. Voce nao precisa aprender tudo hoje. So precisa saber qual e o proximo
              passo.
            </p>
            <div className="mt-8">
              <PrimaryCta label="Comecar minha jornada" />
            </div>
          </div>
        </FadeIn>
      </Section>
    </main>
  );
}
