import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Code2, ExternalLink, Sparkles } from "lucide-react";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { MetaPixelViewContent } from "@/components/MetaPixelViewContent";
import { SalesPageTracker, SalesViewContentTracker } from "@/components/SalesPageTracker";
import { MobileStickyCTA, SectionViewTracker, TrackedAccordion, TrackedCheckoutButton } from "@/components/course-completo/interactive";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const offerPrice = Number(process.env.NEXT_PUBLIC_SAAS_PRICE ?? 0);
const checkoutUrl = process.env.NEXT_PUBLIC_SAAS_CHECKOUT_URL ?? "#programa";
const offerAvailable = offerPrice > 0 && /^https?:\/\//.test(checkoutUrl);

const course = {
  pageKey: "curso-saas",
  pagePath: "/curso-saas",
  pageTitle: "Curso SaaS com IA, Antigravity e Next.js | Plugando IA",
  name: "SaaS com IA usando Antigravity",
  courseCount: 8,
  lessonCount: 85,
};

export const metadata: Metadata = {
  title: "Curso SaaS com IA, Antigravity e Next.js | Plugando IA",
  description: "Construa e publique um SaaS completo com Antigravity, Next.js, PostgreSQL, trial, assinatura, pagamento, Docker e deploy. Inclui 7 cursos complementares.",
  alternates: { canonical: "/curso-saas" },
  openGraph: {
    title: "Do prompt ao SaaS publicado | Plugando IA",
    description: "Um projeto completo com Antigravity e Next.js, acompanhado por 7 cursos complementares e 85 aulas.",
    url: "/curso-saas",
    siteName: "Plugando IA",
    type: "website",
  },
};

const saasLessons = [
  "Criando o prompt para gerar o sistema",
  "Criando o projeto com Antigravity",
  "Criando o banco PostgreSQL e gerando a conexão",
  "Testando o sistema e efetuando os primeiros ajustes",
  "Testando o pagamento e criando o trial de 7 dias",
  "Efetuando login e testando o cadastro no trial",
  "Criando o menu e os cadastros de cliente, veículo, produto e serviço",
  "Testando a edição dos cadastros e criando a funcionalidade de importação",
  "Efetuando a importação dos dados",
  "Ajustando alertas e testando a criação de ordem de serviço",
  "Verificando o fluxo de pagamento",
  "Configurando o gateway e concluindo o pagamento",
  "Validando a assinatura concluída",
  "Ajustando Dockerfile e .gitignore",
  "Publicando o projeto no GitHub e no EasyPanel",
  "Hospedando, acessando e testando o sistema",
  "Efetuando um novo cadastro e validando o produto publicado",
];

const nextLessons = [
  "Introdução ao Next.js", "Criando o projeto", "Entendendo o projeto", "Entendendo as rotas", "Entendendo o layout.tsx", "Agrupamento de páginas", "Rotas dinâmicas", "Rota dinâmica com slug", "Consulta à API de CEP com valor da rota", "Título do site de acordo com a rota", "Server Components e Client Components", "Navegação utilizando Link", "Navegação em formulários com useRouter", "Redirect em Server Components", "useRouter: replace, push, prefetch e back", "useRouter: forward e refresh", "Tela de erro específica", "Criando componente e requisição Server", "Memoização e cache nas requisições", "Middleware nas requisições", "Requisições com Server Actions", "Server Actions utilizando formulário", "useFormState e useFormStatus", "Criando API com Next.js",
];

const bonusCourses = [
  {
    number: "01",
    title: "Next.js",
    label: "24 aulas",
    color: "#f7dd4c",
    description: "A base completa para entender rotas, componentes, cache, formulários, Server Actions e APIs.",
    lessons: nextLessons,
  },
  {
    number: "02",
    title: "Agentes de IA com Next.js",
    label: "6 aulas",
    color: "#c6e8ff",
    description: "Construa a interface, conecte a OpenAI e crie um agente com contexto e memória.",
    lessons: ["Criando o projeto de agentes", "Criando a tela inicial para acessar os agentes", "Variável de ambiente e geração da API Key OpenAI", "Criando a action para se comunicar com a OpenAI", "Criando o ChatClient para conversar com a IA", "Criando o agente com contexto e memória"],
  },
  {
    number: "03",
    title: "Arquitetando o Futuro com LLMs e RAG",
    label: "13 aulas",
    color: "#d8ceff",
    description: "Uma base técnica para projetar aplicações mais confiáveis com modelos de linguagem e recuperação.",
    lessons: ["Fundamentos", "Dominando a IA", "AI Agent Engineering", "RAG mitigando riscos da IA", "Attention e Transformers", "Dominando a IA Generativa", "Arquitetura de Agentes", "Hybrid Search in RAG", "Impacto estratégico dos LLMs", "Busca híbrida", "Sistemas de IA corporativa", "Avaliação de LLMs", "Guardrails de IA"],
  },
  {
    number: "04",
    title: "Site para Advocacia com IA",
    label: "9 aulas",
    color: "#bde7ce",
    description: "Um projeto aplicado com site, chatbot, automação, PostgreSQL, banco vetorial e RAG.",
    lessons: ["Criando site para advocacia com IA", "Explicando as tags", "Enviando e-mail com n8n e Gmail", "Incluindo chatbot no site", "Bancos de dados vetoriais: opções e escolha", "Criando PostgreSQL no Railway e conectando", "Incluindo arquivo no banco vetorial", "Ajustando dados para metadata", "Criando o agente de IA com RAG"],
  },
  {
    number: "05",
    title: "Agente de IA",
    label: "4 aulas",
    color: "#ffb69c",
    description: "Entenda a estrutura de um agente e trabalhe com memória e ferramentas.",
    lessons: ["Fundamentos de um agente de IA", "Criando e testando o primeiro agente com memória", "Criando o primeiro agente pelo caminho rápido", "Agente de IA com tools e definição correta das ferramentas"],
  },
  {
    number: "06",
    title: "Credenciais",
    label: "2 aulas",
    color: "#c6e8ff",
    description: "Configure os acessos necessários para integrar serviços reais aos seus projetos.",
    lessons: ["Credencial Gmail/Google passo a passo", "Credencial OpenAI"],
  },
  {
    number: "07",
    title: "n8n Básico",
    label: "10 aulas",
    color: "#f7dd4c",
    description: "Aprenda a criar workflows, trabalhar com credenciais, lógica, código e requisições HTTP.",
    lessons: ["O que são workflows", "O que são credenciais", "Execuções e como elas ajudam", "Importação e exportação de fluxo", "Triggers no n8n", "Ações", "Condicional IF", "Soma, máximo, mínimo e filtro", "Entendendo o nó Code", "Utilizando o nó HTTP Request"],
  },
];

const faq = [
  ["Preciso dominar Next.js antes de começar?", "Não. Um curso completo de Next.js com 24 aulas está incluído no pacote para construir a base necessária."],
  ["O que eu construo no curso principal?", "Um SaaS de gestão com login, trial, clientes, veículos, produtos, serviços, ordens de serviço, importação, assinatura e pagamento."],
  ["O projeto é publicado?", "Sim. A jornada passa por Dockerfile, GitHub, EasyPanel, hospedagem e testes do sistema já publicado."],
  ["Antigravity faz tudo sozinho?", "Não. Ele acelera a construção, mas as aulas mostram como especificar, testar, identificar problemas, solicitar ajustes e validar cada etapa do produto."],
  ["Os cursos de agentes, RAG e n8n estão incluídos?", "Sim. Eles fazem parte dos 7 cursos complementares que acompanham o treinamento principal de SaaS."],
  ["Qual será o preço?", "A condição comercial de lançamento será publicada nesta página assim que as inscrições forem abertas."],
];

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function BuyButton({ label, className = "", tone = "orange" }: { label: string; className?: string; tone?: "orange" | "dark" }) {
  if (!offerAvailable) {
    return <a href="#programa" className={`inline-flex items-center justify-center border-2 border-[#171717] px-6 py-4 text-sm font-black transition ${tone === "dark" ? "bg-[#171717] text-white hover:bg-[#2f54da]" : "bg-[#ff6933] text-[#171717] hover:bg-[#f7dd4c]"} ${className}`}>{label}<ArrowRight className="ml-2 h-4 w-4" /></a>;
  }
  return <TrackedCheckoutButton href={checkoutUrl} label={label} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} value={offerPrice} currency="BRL" customEvent="saas_checkout_click" eventData={{ content_name: course.name, content_category: "Curso", content_type: "product", value: offerPrice, currency: "BRL" }} hideGlow className={`!rounded-none !bg-none !px-6 !py-4 !font-black ${tone === "dark" ? "!bg-[#171717] !text-white hover:!bg-[#2f54da]" : "!bg-[#ff6933] !text-[#171717] hover:!bg-[#f7dd4c]"} ${className}`} />;
}

function ProductBlueprint() {
  return (
    <div className="border-2 border-[#171717] bg-[#fffaf0]">
      <div className="flex items-center justify-between border-b-2 border-[#171717] px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[.16em]"><span>Produto / Visão geral</span><span>Build 01</span></div>
      <div className="grid grid-cols-[90px_1fr] md:grid-cols-[120px_1fr]">
        <div className="border-r-2 border-[#171717] bg-[#171717] p-3 text-white">
          <div className="mb-8 font-mono text-[9px] font-black">SAAS//</div>
          {['Dashboard', 'Clientes', 'Veículos', 'Serviços', 'Ordens'].map((item, index) => <div key={item} className={`border-t border-white/30 py-2 font-mono text-[8px] ${index === 0 ? 'text-[#f7dd4c]' : 'text-white/65'}`}>{item}</div>)}
        </div>
        <div className="p-4 md:p-5">
          <div className="grid grid-cols-3 gap-2">{[["48", "clientes"], ["32", "veículos"], ["12", "OS abertas"]].map(([value, label]) => <div key={label} className="border border-[#171717] p-2"><strong className="block text-xl md:text-2xl">{value}</strong><span className="font-mono text-[7px] uppercase">{label}</span></div>)}</div>
          <div className="mt-3 h-24 border border-[#171717] p-3"><div className="flex h-full items-end gap-2">{[35, 58, 44, 78, 65, 90].map((height, index) => <div key={index} className="flex-1 bg-[#2f54da]" style={{ height: `${height}%` }} />)}</div></div>
          <div className="mt-3 flex items-center justify-between border border-[#171717] bg-[#bde7ce] p-3 font-mono text-[8px] font-black"><span>ASSINATURA ATIVA</span><span>TRIAL → PAID</span></div>
        </div>
      </div>
    </div>
  );
}

export default async function CursoSaasPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(course.pageKey, { preferEnvFallback: true });
  const eventData = { content_name: course.name, content_category: "Curso", content_type: "product", ...(offerPrice > 0 ? { value: offerPrice, currency: "BRL" } : {}) };

  return (
    <main className="min-h-screen bg-[#f2efe5] text-[#171717] selection:bg-[#f7dd4c]">
      <MetaPixelScript pixelId={metaPixelId || undefined} />
      <MetaPixelViewContent data={eventData} />
      <SalesPageTracker pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} metadata={{ offerPrice: offerPrice || null, currency: "BRL", offerName: course.name, offerAvailable }} />
      <SalesViewContentTracker pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} currency="BRL" value={offerPrice || undefined} metadata={{ contentName: course.name, contentType: "course_bundle" }} />
      <SectionViewTracker selectorId="programa" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName="program_view" />
      <SectionViewTracker selectorId="bonus" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName="bonus_view" />
      <SectionViewTracker selectorId="oferta" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName="offer_view" />

      <div className="border-b-2 border-[#171717] bg-[#f7dd4c] px-4 py-2.5 text-center font-mono text-[10px] font-black uppercase tracking-[.15em]">Curso principal + 7 cursos complementares • 85 aulas no pacote</div>
      <header className="border-b-2 border-[#171717]"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10"><Link href="/cursos" className="flex items-center gap-3 font-black tracking-[-.03em]"><span className="grid h-9 w-9 place-items-center bg-[#2f54da] text-white"><Code2 className="h-5 w-5" /></span>PLUGANDO IA</Link><a href="#programa" className="font-mono text-[10px] font-black uppercase tracking-[.16em] underline decoration-2 underline-offset-4">Ver o programa</a></div></header>

      <section className="border-b-2 border-[#171717]"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.08fr_.92fr]"><div className="px-5 py-14 md:px-10 md:py-20 lg:border-r-2 lg:border-[#171717] lg:py-24"><div className="inline-flex bg-[#ff6933] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[.17em]">SaaS com IA / Antigravity + Next.js</div><h1 className="mt-8 max-w-4xl font-serif text-[3.7rem] font-bold leading-[.9] tracking-[-.06em] sm:text-7xl xl:text-[6.2rem]">Do prompt ao SaaS funcionando na internet.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#55534d]">Construa um sistema de gestão completo com login, banco de dados, trial, assinatura, pagamento e deploy — usando IA para acelerar sem abrir mão de entender e validar o produto.</p><div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"><BuyButton label={offerAvailable ? `Quero entrar por ${formatPrice(offerPrice)}` : "Explorar o curso completo"} /><a href="#programa" className="flex items-center justify-center gap-2 border-2 border-[#171717] px-6 py-3.5 text-sm font-black">VER AS 85 AULAS <ArrowDown className="h-4 w-4" /></a></div></div>
        <aside className="grid border-t-2 border-[#171717] lg:border-t-0"><div className="bg-[#2f54da] p-6 text-white md:p-8"><div className="flex items-center justify-between font-mono text-[9px] font-black uppercase tracking-[.16em]"><span>Projeto construído</span><span>Next.js / PostgreSQL</span></div><div className="mt-8"><ProductBlueprint /></div></div><div className="grid grid-cols-3 border-t-2 border-[#171717]"><div className="border-r-2 border-[#171717] bg-[#ff6933] p-5"><strong className="text-4xl font-black">17</strong><span className="mt-2 block font-mono text-[8px] font-black uppercase">aulas do SaaS</span></div><div className="border-r-2 border-[#171717] bg-[#f7dd4c] p-5"><strong className="text-4xl font-black">07</strong><span className="mt-2 block font-mono text-[8px] font-black uppercase">cursos extras</span></div><div className="bg-[#fffaf0] p-5"><strong className="text-4xl font-black">85</strong><span className="mt-2 block font-mono text-[8px] font-black uppercase">aulas totais</span></div></div></aside></div></section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2f54da]">01 / O projeto</span><h2 className="mt-5 font-serif text-5xl font-bold leading-[.96] tracking-[-.05em]">Você não vai montar uma demo. Vai construir um produto.</h2></div><div><p className="max-w-3xl text-xl leading-9 text-[#3f3d38]">O curso acompanha a criação de um SaaS de gestão, com as decisões e ajustes que aparecem entre a primeira especificação e um sistema realmente publicado.</p><div className="mt-10 grid grid-cols-2 border-l-2 border-t-2 border-[#171717] md:grid-cols-3">{[["AUTENTICAÇÃO", "Login e controle de acesso"], ["OPERAÇÃO", "Clientes, veículos e serviços"], ["VENDA", "Trial, assinatura e pagamento"], ["DADOS", "PostgreSQL e importação"], ["ENTREGA", "Docker, GitHub e EasyPanel"], ["VALIDAÇÃO", "Testes e ajustes do produto"]].map(([title, text]) => <article key={title} className="min-h-40 border-b-2 border-r-2 border-[#171717] p-4 md:p-5"><span className="font-mono text-[9px] font-black text-[#2f54da]">{title}</span><p className="mt-10 font-serif text-lg font-bold leading-snug">{text}</p></article>)}</div></div></div></section>

      <section id="programa" className="scroll-mt-4 border-y-2 border-[#171717] bg-[#fffaf0]"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[.72fr_1.28fr]"><div className="border-[#171717] px-5 py-14 md:px-10 lg:border-r-2 lg:py-20"><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#d43d08]">02 / Curso principal</span><h2 className="mt-5 font-serif text-5xl font-bold tracking-[-.05em]">SaaS com IA, passo a passo.</h2><p className="mt-5 leading-7 text-[#68645b]">Da instrução inicial no Antigravity à validação de um novo cadastro no sistema hospedado.</p><div className="mt-10 border-2 border-[#171717] bg-[#ff6933] p-5"><div className="font-mono text-[9px] font-black uppercase">Resultado do curso</div><p className="mt-8 font-serif text-2xl font-bold leading-tight">Um produto com operação, acesso, cobrança e infraestrutura para funcionar fora da sua máquina.</p></div></div><div>{saasLessons.map((lesson, index) => <article key={lesson} className="grid grid-cols-[52px_1fr] border-t-2 border-[#171717] px-5 py-4 first:border-t-0 md:grid-cols-[72px_1fr] md:px-8 md:py-5"><span className="font-mono text-[10px] font-black text-[#d43d08]">{String(index + 1).padStart(2, "0")}</span><p className="font-medium leading-6">{lesson}</p></article>)}</div></div></section>

      <section id="bonus" className="mx-auto max-w-[1440px] scroll-mt-4 px-5 py-16 md:px-10 md:py-24"><div className="grid gap-8 border-b-2 border-[#171717] pb-8 md:grid-cols-2 md:items-end"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2f54da]">03 / Formação complementar</span><h2 className="mt-5 font-serif text-5xl font-bold leading-[.96] tracking-[-.05em]">O SaaS é o projeto.<br />Estes cursos sustentam a construção.</h2></div><p className="max-w-xl justify-self-end text-lg leading-8 text-[#5d5a52]">Next.js, automação e fundamentos de IA organizados em cursos próprios para você aprofundar o que aparece no projeto principal.</p></div><div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{bonusCourses.map((bonus) => <article key={bonus.number} className="border-2 border-[#171717] bg-[#fffaf0]"><div className="flex min-h-44 flex-col justify-between border-b-2 border-[#171717] p-5" style={{ backgroundColor: bonus.color }}><div className="flex justify-between font-mono text-[9px] font-black uppercase"><span>Bônus {bonus.number}</span><span>{bonus.label}</span></div><h3 className="font-serif text-3xl font-bold leading-[1.02] tracking-[-.04em]">{bonus.title}</h3></div><div className="p-5"><p className="min-h-20 leading-7 text-[#5d5a52]">{bonus.description}</p><TrackedAccordion title={`Ver conteúdo — ${bonus.lessons.length} aulas`} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName={`bonus_${bonus.number}_open`} variant="light" className="mt-5 !rounded-none !border-0 !border-t !border-[#bdb7a9] !bg-transparent !px-0 !pb-0 !pt-4" titleClassName="!font-mono !text-[10px] !font-black !uppercase !tracking-[.12em]" contentClassName="!text-[#5d5a52]" iconClassName="!rounded-none !border !border-[#171717] !bg-transparent"><ol className="space-y-2">{bonus.lessons.map((lesson, index) => <li key={lesson} className="grid grid-cols-[28px_1fr] text-xs leading-5"><span className="font-mono text-[9px] font-black text-[#2f54da]">{String(index + 1).padStart(2, "0")}</span><span>{lesson}</span></li>)}</ol></TrackedAccordion></div></article>)}</div></section>

      <section className="border-y-2 border-[#171717] bg-[#171717] text-white"><div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-10 md:grid-cols-2"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#ff8760]">04 / O método</span><h2 className="mt-5 max-w-2xl font-serif text-5xl font-bold tracking-[-.05em]">IA acelera. Você continua responsável pelo produto.</h2></div><p className="max-w-xl self-end text-lg leading-8 text-white/65">O valor não está em apertar um botão. Está em saber descrever, testar, corrigir e levar o sistema até uma entrega utilizável.</p></div><div className="mt-14 grid border-l border-t border-white/30 sm:grid-cols-2 lg:grid-cols-4">{[["01", "Especifique", "Transforme a ideia em uma instrução clara para o sistema."], ["02", "Construa", "Use o Antigravity para acelerar cada etapa do produto."], ["03", "Valide", "Teste cadastro, regras, cobrança e os fluxos reais."], ["04", "Publique", "Prepare Docker, repositório, servidor e ambiente final."]].map(([number, title, text]) => <article key={number} className="min-h-60 border-b border-r border-white/30 p-6"><span className="font-mono text-xs text-[#ff8760]">{number}</span><h3 className="mt-16 font-serif text-3xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{text}</p></article>)}</div></div></section>

      <section id="oferta" className="scroll-mt-4 border-b-2 border-[#171717] bg-[#ff6933]"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.18fr_.82fr]"><div className="border-[#171717] px-5 py-16 md:px-10 md:py-24 lg:border-r-2"><span className="font-mono text-[10px] font-black uppercase tracking-[.2em]">05 / Pacote completo</span><h2 className="mt-6 max-w-4xl font-serif text-5xl font-bold leading-[.94] tracking-[-.055em] md:text-7xl">Um SaaS publicado. E a base para construir os próximos.</h2><p className="mt-7 max-w-2xl text-lg leading-8">Você recebe o curso principal e mais 7 cursos para aprofundar Next.js, agentes, RAG, automação e integrações.</p><div className="mt-10 grid gap-3 sm:grid-cols-2">{["8 cursos no pacote", "85 aulas organizadas", "Projeto completo de SaaS", "Curso de Next.js", "Agentes, LLMs e RAG", "n8n e credenciais"].map((item) => <div key={item} className="flex items-center gap-3 border-t border-[#171717]/40 pt-3 text-sm font-bold"><Check className="h-4 w-4" />{item}</div>)}</div></div><aside className="flex flex-col justify-between bg-[#f7dd4c] p-6 md:p-10"><div><div className="flex justify-between font-mono text-[10px] font-black uppercase tracking-[.16em]"><span>Nova turma</span><span>8 cursos</span></div>{offerAvailable ? <><div className="mt-16 text-sm font-bold">Investimento</div><div className="mt-1 text-6xl font-black tracking-[-.07em]">{formatPrice(offerPrice)}</div><div className="mt-3 border-t border-[#171717]/35 pt-3 text-sm"><strong>{formatPrice(offerPrice / course.courseCount)}</strong> em média por curso</div></> : <><Sparkles className="mt-16 h-8 w-8" /><h3 className="mt-5 font-serif text-4xl font-bold leading-tight">Condição especial de lançamento.</h3><p className="mt-4 leading-7 text-[#4f4b42]">O valor e o link de inscrição serão publicados aqui na abertura da turma.</p></>}</div><div className="mt-16"><BuyButton label={offerAvailable ? "Quero construir meu SaaS" : "Conhecer todo o programa"} tone="dark" className="w-full" />{offerAvailable ? <p className="mt-4 text-center font-mono text-[9px] font-bold uppercase tracking-wider">Você será direcionado ao ambiente de pagamento</p> : null}</div></aside></div></section>

      <section className="mx-auto max-w-[1050px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-8 md:grid-cols-[.6fr_1.4fr]"><div><span className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#2f54da]">06 / Dúvidas</span><h2 className="mt-4 font-serif text-4xl font-bold tracking-[-.04em]">Antes de começar.</h2></div><div className="border-x-2 border-t-2 border-[#171717]">{faq.map(([question, answer], index) => <TrackedAccordion key={question} title={question} pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} eventName={`faq_${index + 1}_open`} variant="light" className="!rounded-none !border-x-0 !border-t-0 !border-b-2 !border-[#171717] !bg-[#fffaf0] !p-5" titleClassName="!font-serif !text-lg !font-bold" contentClassName="!text-[#5d5a52]" iconClassName="!rounded-none !border-2 !border-[#171717] !bg-transparent"><p>{answer}</p></TrackedAccordion>)}</div></div></section>

      <section className="border-t-2 border-[#171717] bg-[#2f54da] text-white"><div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-10"><div><ExternalLink className="h-7 w-7 text-[#f7dd4c]" /><h2 className="mt-4 max-w-2xl font-serif text-3xl font-bold">A ideia sai do prompt. O curso leva você até o produto publicado.</h2></div><BuyButton label={offerAvailable ? `Entrar por ${formatPrice(offerPrice)}` : "Ver o programa completo"} /></div></section>
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-8 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#666258] md:flex-row md:justify-between md:px-10"><span>© {new Date().getFullYear()} Plugando IA</span><div className="flex gap-5"><Link href="/terms">Termos</Link><Link href="/privacy">Privacidade</Link><Link href="/cursos">Catálogo</Link></div></footer>
      {offerAvailable ? <MobileStickyCTA title="SaaS com IA + 7 cursos" priceLabel={formatPrice(offerPrice)} href={checkoutUrl} label="Entrar" pageKey={course.pageKey} pagePath={course.pagePath} pageTitle={course.pageTitle} value={offerPrice} currency="BRL" className="!border-[#171717] !bg-[#f7dd4c]" titleClassName="!text-[#171717]" priceClassName="!text-[#171717]" buttonClassName="!rounded-none !bg-none !bg-[#171717] !text-white" hideGlow /> : null}
    </main>
  );
}
