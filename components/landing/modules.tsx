const modules: Array<{
  name: string;
  summary: string;
  lessons: string[];
}> = [
  {
    name: "Módulo Inicial / n8n (automação completa)",
    summary: "Do zero aos fluxos que integram qualquer API: triggers, ações, lógica, HTTP e Code Node.",
    lessons: [
      "O que são workflows",
      "O que são credenciais",
      "Entendendo as execuções e como ela nos ajuda",
      "Importação e exportação de fluxo",
      "Triggers no N8N",
      "Ações",
      "Condicional IF",
      "Soma, max, min e filtro",
      "Entendendo o nó Code",
      "Utilizando o node HTTP Request"
    ]
  },
  {
    name: "Agente de IA",
    summary: "Crie agentes com memória e tools para resolver tarefas reais.",
    lessons: [
      "Explicando básico de um agente de IA",
      "Criando o primeiro agente IA testando e explicando a memória",
      "Criando o primeiro agente (forma rápida)",
      "Agente de IA com tools (ferramentas) se atente ao nome da ferramenta"
    ]
  },
  {
    name: "Site (advocacia) + IA",
    summary: "Site real com chatbot + e-mail + RAG: banco vetorial + PostgreSQL e agente com contexto.",
    lessons: [
      "Criando site advocacia com IA",
      "Explicando as tags",
      "Enviando e-mail com n8n e gmail",
      "Incluindo chatbot no site",
      "Explicando sobre banco de dados vetorial e quais existe e qual vou utilizar",
      "Criando o banco de dados postgre no railway e conectando",
      "Incluir arquivo no banco de dados vetorial",
      "Ajuste dados para metadata",
      "Criando o agente IA com rag"
    ]
  },
  {
    name: "Next.js (completo)",
    summary: "Domine App Router: rotas, layouts, server/client, APIs, middleware, cache e server actions.",
    lessons: [
      "Introdução ao nextjs",
      "Criando o projeto",
      "Entendendo o projeto",
      "Entendo as Rotas",
      "Entendendo o Layout.tsx",
      "Agrupamento de páginas",
      "Rotas dinâmicas",
      "Rota dinâmica com slug",
      "Consulta API CEP com valor que está na rota",
      "Título do site de acordo com a rota",
      "Explicando server components e client components",
      "Mudança de tela utilizando o Link",
      "Mudança de tela exclusiva para use client e formulários com useRouter",
      "Mudança de tela exclusiva pelo server component redirect",
      "Explicando o useRouter replace, push, prefetch, back",
      "Explicando o useRouter forward e o refresh",
      "Tela de erro específica",
      "Criando um componente e requisição Server",
      "memorização e cache nas requisições",
      "middleware nas requisições",
      "Requisições Server Actions",
      "Server Actions utilizando formulário",
      "useFormState e useFormStatus",
      "Criando API com NEXTjs"
    ]
  },
  {
    name: "Agentes IA com código (Next.js)",
    summary: "Do projeto à integração: key OpenAI, actions, chat client e agente com memória + contexto.",
    lessons: [
      "Criando projeto de agentes",
      "Criando a tela inicial para acessar os agentes",
      "variável de ambiente e gerando API Key OpenAI",
      "Criando a action para se comunicar com a OPENAI",
      "Criando nosso ChatClient - bate papo com IA",
      "Criando o agente com contexto e memória"
    ]
  },
  {
    name: "Criando SaaS com Antigravity",
    summary: "Construa um SaaS com assinatura, trial, banco, deploy e validação do pagamento.",
    lessons: [
      "Aula 001 - Criando prompt para criar o sistema",
      "Aula 002 - criando projeto com Antigravity",
      "Aula 003 - Criando banco Postgres SQL e gerando Conexão",
      "Aula 004 - testando e efetuando ajustes",
      "Aula 005 - testando pagamento e criando trial de 7 dias grátis",
      "Aula 006 - efetuando login no sistema e testando cadastro trial",
      "Aula 007 - Criando menu, testando criaçao do cliente, veículo, produto e serviço",
      "Aula 008 - testando a edição dos cadastros e solicitando a funcionalidade de importação",
      "Aula 009 - efetuando a importação dos dados",
      "Aula 010 - ajuste no alert do sistema, testando criação de ordem de serviço",
      "Aula 011 - Verificando a parte de pagamento",
      "Aula 12 - Configurando Asas e concluindo pagamento",
      "Aula 013 - validação da assinatura concluída",
      "Aula 014 - ajuste dockerfile e gitignore - nao iniciar a parte do git vá para proxima aula - apenas observar e ver o erro",
      "Aula 015 - subindo no github e no easypanel",
      "Aula 016 - hospedando,logando e testando",
      "Aula 017 - Efetuando novo cadastro e testando"
    ]
  }
];

function ModuleCard({
  name,
  summary,
  lessons
}: {
  name: string;
  summary: string;
  lessons: string[];
}) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/5 p-6 open:bg-white/10">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-base font-semibold">{name}</div>
            <p className="mt-2 text-sm text-white/70">{summary}</p>
          </div>
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition group-open:rotate-45">
            +
          </div>
        </div>
      </summary>
      <div className="mt-4 grid gap-2 text-sm text-white/70 md:grid-cols-2">
        {lessons.map((l) => (
          <div key={l} className="rounded-lg border border-white/10 bg-base-950/30 px-3 py-2">
            {l}
          </div>
        ))}
      </div>
    </details>
  );
}

export function Modules() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Módulos do curso (organizado e sem mistério)
        </h2>
        <p className="mt-4 text-white/75">Clique para expandir. Você sabe exatamente o que vai aprender — e o que vai construir.</p>
      </div>
      <div className="mt-10 grid gap-4">
        {modules.map((m) => (
          <ModuleCard key={m.name} name={m.name} summary={m.summary} lessons={m.lessons} />
        ))}
      </div>
    </div>
  );
}
